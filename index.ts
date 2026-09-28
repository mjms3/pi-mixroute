/**
 * MixRoute Provider Extension
 *
 * Registers MixRoute (https://api.mixroute.ai/v1) as a custom provider.
 * Models are derived from MixRoute's /v1/models list, enriched with metadata
 * from models.dev first and OpenRouter second. The catalog is discovered at
 * startup and cached under the pi agent directory; a bundled snapshot covers
 * the first run before any cache exists. /mixroute-refresh re-runs discovery
 * on demand.
 *
 * Budget tracking
 * ---------------
 * MixRoute's OpenAI-compatible API does not return financial budget on every
 * response.  The actual remaining balance is available via MixRoute's user
 * endpoint:
 *
 *   GET /api/user/self  →  { quota, used_quota, ... }
 *
 * Authentication uses a system access key, an officially supported credential
 * generated under Settings → System access key on the MixRoute website.  Set it
 * in auth.json:
 *
 *   "mixroute": {
 *     "type": "api_key",
 *     "key": "sk-...",
 *     "systemAccessKey": "your-system-access-key"
 *   }
 *
 * (Legacy configs that stored the browser session token as "adminToken"
 * together with the numeric "userId" keep working.)
 *
 * When the key is present the extension shows the remaining balance in the
 * footer, colour-coded (defaults; see budgetThresholds below):
 *   🟢 green   ≥ $40 remaining
 *   🟠 orange  $20–$40 remaining
 *   🔴 red     < $20 remaining
 *
 * The colour thresholds are user-configurable in settings.json under the
 * "mixroute" key:
 *
 *   "mixroute": {
 *     "budgetThresholds": { "green": 100, "amber": 25 }
 *   }
 *
 * "green" is the balance (USD) at or above which the indicator is green;
 * "amber" is the balance at or above which it is orange (red below). Both
 * keys are optional; either falls back to its default. Invalid values are
 * ignored. A trusted project's .pi/settings.json overrides the user-level
 * settings, and the env vars MIXROUTE_BUDGET_GREEN / MIXROUTE_BUDGET_AMBER
 * override both (values must be finite, non-negative USD amounts).
 * Thresholds are re-read at each session start.
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import {
    type ExtensionAPI,
    type ExtensionContext,
    getAgentDir,
    type ModelRegistry,
    SettingsManager,
    type ThemeColor,
} from "@earendil-works/pi-coding-agent";
import { type LoadMixRouteModelsResult, loadMixRouteModels, readMixRouteModelsCache } from "./model-loader.ts";
import { filterUnsupportedMixRouteModels } from "./model-policy.ts";
import { MIXROUTE_MODELS } from "./models.generated.ts";
import { createMixRouteProviderConfig, PROVIDER_NAME } from "./provider-config.ts";

// ---------------------------------------------------------------------------
// Budget tracking via /api/user/self
// ---------------------------------------------------------------------------
//
// Authenticate with a system access key (Settings → System access key on
// https://api.mixroute.ai), stored alongside your API key in auth.json as
// "systemAccessKey".  Legacy "adminToken" (browser session token) entries
// with a numeric "userId" are still accepted.
//
//   GET /api/user/self  →  { quota, used_quota, ... }
//
//   quota (internal units) / 500000 = remaining balance in USD

const STATUS_KEY = "mixroute-budget";
const QUOTA_PER_UNIT = 500_000; // from /api/status → quota_per_unit

// Default colour thresholds in USD
const DEFAULT_GREEN_THRESHOLD = 40; // ≥ $40  → green
const DEFAULT_AMBER_THRESHOLD = 20; // ≥ $20  → amber; < $20  → red

/** Colour thresholds (USD): green ≥ `green` > amber ≥ `amber` > red. */
type BudgetThresholds = { green: number; amber: number };

/**
 * Parse a threshold value: must be a finite, non-negative number.
 * Returns undefined for anything else.
 */
function parseThreshold(value: unknown): number | undefined {
    if (typeof value !== "number" || !Number.isFinite(value) || value < 0) return undefined;
    return value;
}

/** Parse a threshold from an environment variable value. */
function parseThresholdEnv(raw: string | undefined): number | undefined {
    if (raw === undefined || raw.trim() === "") return undefined;
    return parseThreshold(Number(raw));
}

/**
 * Normalize user-supplied thresholds so that green ≥ amber (swapping when
 * inverted). Returns null when neither value is valid.
 */
function normalizeThresholds(green: number | undefined, amber: number | undefined): BudgetThresholds | null {
    if (green === undefined && amber === undefined) return null;
    const g = green ?? DEFAULT_GREEN_THRESHOLD;
    const a = amber ?? DEFAULT_AMBER_THRESHOLD;
    return g >= a ? { green: g, amber: a } : { green: a, amber: g };
}

function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Extract the raw "mixroute"."budgetThresholds" object from a settings object. */
function rawThresholdsFromSettings(settings: unknown): Record<string, unknown> | undefined {
    if (!isRecord(settings)) return undefined;
    const entry = settings.mixroute;
    if (!isRecord(entry)) return undefined;
    const thresholds = entry.budgetThresholds;
    return isRecord(thresholds) ? thresholds : undefined;
}

function normalizeFromSettings(settings: unknown): BudgetThresholds | null {
    const raw = rawThresholdsFromSettings(settings);
    return normalizeThresholds(parseThreshold(raw?.green), parseThreshold(raw?.amber));
}

/**
 * Resolve the colour thresholds. Precedence: environment variables
 * (MIXROUTE_BUDGET_GREEN / MIXROUTE_BUDGET_AMBER), then the "mixroute" →
 * "budgetThresholds" object in the trusted project's .pi/settings.json, then
 * the same key in the user-level settings.json, then the defaults.
 */
function resolveThresholds(ctx: Pick<ExtensionContext, "cwd" | "isProjectTrusted">): BudgetThresholds {
    const env = normalizeThresholds(
        parseThresholdEnv(process.env.MIXROUTE_BUDGET_GREEN),
        parseThresholdEnv(process.env.MIXROUTE_BUDGET_AMBER),
    );
    if (env) return env;
    try {
        const projectTrusted = ctx.isProjectTrusted();
        const settingsManager = SettingsManager.create(ctx.cwd, getAgentDir(), { projectTrusted });
        if (projectTrusted) {
            const fromProject = normalizeFromSettings(settingsManager.getProjectSettings());
            if (fromProject) return fromProject;
        }
        const fromGlobal = normalizeFromSettings(settingsManager.getGlobalSettings());
        if (fromGlobal) return fromGlobal;
    } catch {
        // Unreadable settings fall back to the defaults.
    }
    return { green: DEFAULT_GREEN_THRESHOLD, amber: DEFAULT_AMBER_THRESHOLD };
}

// Per-response rate-limit tokens (secondary, shown in /mixroute-budget)
let rlTokensRemaining: number | null = null;
let rlTokensLimit: number | null = null;

/** Parse a decimal HTTP header, returning null if absent or invalid. */
function parseDecimalHeader(headers: Record<string, string>, key: string): number | null {
    const raw = headers[key.toLowerCase()];
    if (raw === undefined || raw === null) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : null;
}

/** Compact number formatting: 1234 → "1.2K", 1234567 → "1.2M" */
function compact(n: number): string {
    return n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1_000 ? `${(n / 1_000).toFixed(1)}K` : n.toFixed(0);
}

/**
 * Read budget credentials from auth.json.
 * Returns { key, userId? } or null if no key is configured.
 */
type BudgetCredentials = { key: string; userId?: number };

/**
 * Read budget credentials from the extension's auth.json entry.
 * Returns { key, userId? } or null if no key is configured or the entry is
 * invalid.
 */
async function readBudgetCredentials(): Promise<BudgetCredentials | null> {
    try {
        const authPath = join(getAgentDir(), "auth.json");
        const raw = await readFile(authPath, "utf8");
        const auth = JSON.parse(raw) as Record<string, unknown>;
        const entry = auth[PROVIDER_NAME] as Record<string, unknown> | undefined;
        if (!entry) return null;
        // Prefer the officially supported system access key; fall back to the
        // legacy "adminToken" (browser session token) for existing configs.
        const key = entry.systemAccessKey ?? entry.adminToken;
        if (typeof key !== "string" || !key.trim()) return null;
        const credentials: BudgetCredentials = { key: key.trim() };
        // userId is only needed by the legacy session-token flow.
        const userId = entry.userId;
        if (typeof userId === "number" && Number.isSafeInteger(userId) && userId > 0) credentials.userId = userId;
        return credentials;
    } catch {
        return null;
    }
}

/**
 * Fetch the user's remaining quota from the /api/user/self endpoint.
 * Returns the balance in USD, or null on failure.
 */
async function fetchBudgetBalance(credentials: BudgetCredentials, signal?: AbortSignal): Promise<number | null> {
    try {
        const headers: Record<string, string> = {
            authorization: `Bearer ${credentials.key}`,
            accept: "application/json",
        };
        // Legacy session tokens also need the numeric user ID header; system
        // access keys identify the user on their own.
        if (credentials.userId !== undefined) headers["New-Api-User"] = String(credentials.userId);
        const res = await fetch("https://api.mixroute.ai/api/user/self", { headers, signal });
        if (!res.ok) return null;
        const body = (await res.json()) as { success?: boolean; data?: { quota?: number } };
        if (!body.success || !body.data || typeof body.data.quota !== "number") return null;
        return body.data.quota / QUOTA_PER_UNIT;
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Extension factory
// ---------------------------------------------------------------------------

export default async function (pi: ExtensionAPI) {
    const cachePath = join(getAgentDir(), "mixroute-models.json");

    // Register immediately so models are available offline and before login;
    // the refresh below replaces them once discovery succeeds.
    const initialModels = filterUnsupportedMixRouteModels(
        await readMixRouteModelsCache(cachePath).catch(() => MIXROUTE_MODELS),
    );
    pi.registerProvider(PROVIDER_NAME, createMixRouteProviderConfig(initialModels));
    let registeredModelsJson = JSON.stringify(initialModels);

    type RefreshResult = LoadMixRouteModelsResult & { changed: boolean };
    let refreshPromise: Promise<RefreshResult> | undefined;
    const lifetime = new AbortController();
    pi.on("session_shutdown", () => {
        lifetime.abort();
    });

    const refresh = (modelRegistry: ModelRegistry): Promise<RefreshResult> => {
        refreshPromise ??= (async () => {
            lifetime.signal.throwIfAborted();
            const apiKey = await modelRegistry.getApiKeyForProvider(PROVIDER_NAME);
            const result = await loadMixRouteModels({
                apiKey,
                cachePath,
                bundledModels: MIXROUTE_MODELS,
                signal: lifetime.signal,
            });
            lifetime.signal.throwIfAborted();
            const modelsJson = JSON.stringify(result.models);
            const changed = modelsJson !== registeredModelsJson;
            if (!changed) return { ...result, changed };
            pi.registerProvider(PROVIDER_NAME, createMixRouteProviderConfig(result.models));
            registeredModelsJson = modelsJson;
            return { ...result, changed };
        })().finally(() => {
            refreshPromise = undefined;
        });
        return refreshPromise;
    };

    let startupRefreshTriggered = false;
    let mixrouteActive = false;
    let budgetBalance: number | null = null; // USD, or null if unavailable
    let thresholds: BudgetThresholds = { green: DEFAULT_GREEN_THRESHOLD, amber: DEFAULT_AMBER_THRESHOLD };

    // Read budget credentials once at startup (auth.json rarely changes).
    const credentials = await readBudgetCredentials();

    /** Re-fetch the balance and update the status bar. */
    async function refreshBudgetBalance(ctx: {
        ui: {
            setStatus: (key: string, text: string | undefined) => void;
            theme?: { fg: (color: ThemeColor, text: string) => string };
        };
    }): Promise<void> {
        if (!credentials) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        const balance = await fetchBudgetBalance(credentials, lifetime.signal);
        if (lifetime.signal.aborted) return;
        budgetBalance = balance;
        updateBudgetStatus(ctx);
    }

    /** Update the status bar with the current balance, colour-coded.
     * Uses explicit ANSI colors (green/amber/red) independent of theme.
     */
    function updateBudgetStatus(ctx: {
        ui: {
            setStatus: (key: string, text: string | undefined) => void;
            theme?: { fg: (color: ThemeColor, text: string) => string };
        };
    }): void {
        if (budgetBalance === null || !mixrouteActive) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        // ANSI 256-color codes: green (28), amber/orange (214), red (196)
        const ansiColor = budgetBalance >= thresholds.green ? 28 : budgetBalance >= thresholds.amber ? 214 : 196;
        const label = `$${budgetBalance.toFixed(2)}`;
        // Use raw ANSI escape sequence for theme-independent colors
        ctx.ui.setStatus(STATUS_KEY, `\x1b[38;5;${ansiColor}m◉ ${label}\x1b[0m`);
    }

    // Session start: reset state, resolve budget thresholds from settings,
    // refresh model catalog in background.
    pi.on("session_start", (_event, ctx) => {
        mixrouteActive = false;
        budgetBalance = null;
        rlTokensRemaining = null;
        rlTokensLimit = null;
        thresholds = resolveThresholds(ctx);
        ctx.ui.setStatus(STATUS_KEY, undefined);

        if (startupRefreshTriggered || process.env.PI_OFFLINE === "1") return;
        startupRefreshTriggered = true;
        void refresh(ctx.modelRegistry).then(
            (result) => {
                if (!lifetime.signal.aborted && result.warning) console.warn(`[mixroute] ${result.warning}`);
            },
            (error: unknown) => {
                if (lifetime.signal.aborted) return;
                console.warn(
                    `[mixroute] Model catalog refresh failed: ${error instanceof Error ? error.message : String(error)}`,
                );
            },
        );
    });

    // When the user picks a MixRoute model, fetch the balance.
    pi.on("model_select", async (_event, ctx) => {
        mixrouteActive = _event.model.provider === PROVIDER_NAME;
        if (!mixrouteActive) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        if (credentials) {
            await refreshBudgetBalance(ctx);
        }
    });

    // After every MixRoute response: track rate-limit tokens and refresh the
    // balance so the footer stays up to date.
    let balanceRefreshInFlight = false;
    pi.on("after_provider_response", (event, ctx) => {
        if (!mixrouteActive) return;

        // Track rate-limit tokens (shown in /mixroute-budget detail).
        const remaining = parseDecimalHeader(event.headers, "x-ratelimit-remaining-tokens");
        const limit = parseDecimalHeader(event.headers, "x-ratelimit-limit-tokens");
        if (remaining !== null) rlTokensRemaining = remaining;
        if (limit !== null) rlTokensLimit = limit;

        // Refresh the balance (fire-and-forget, no concurrency).
        // Each request consumes quota so the balance changes every time.
        if (credentials && !balanceRefreshInFlight) {
            balanceRefreshInFlight = true;
            fetchBudgetBalance(credentials, lifetime.signal)
                .then((balance) => {
                    if (!lifetime.signal.aborted && balance !== null) {
                        budgetBalance = balance;
                        updateBudgetStatus(ctx);
                    }
                })
                .catch(() => {})
                .finally(() => {
                    balanceRefreshInFlight = false;
                });
        }
    });

    pi.registerCommand("mixroute-budget", {
        description: "Show MixRoute remaining balance and usage details",
        handler: async (_args, ctx) => {
            const parts: string[] = [];
            if (budgetBalance !== null) {
                parts.push(`$${budgetBalance.toFixed(2)} remaining`);
            }
            if (rlTokensRemaining !== null && rlTokensLimit !== null) {
                const pct = ((rlTokensRemaining / rlTokensLimit) * 100).toFixed(1);
                parts.push(`${compact(rlTokensRemaining)}/${compact(rlTokensLimit)} tpm rate limit (${pct}%)`);
            }
            if (parts.length === 0) {
                const msg = credentials
                    ? "No MixRoute balance data yet. Send a message first."
                    : "No MixRoute system access key configured. Generate one under Settings → System access key on the MixRoute website and add it to auth.json.";
                if (ctx.hasUI) ctx.ui.notify(msg, "info");
                else console.warn(`[mixroute] ${msg}`);
                return;
            }
            const msg = `MixRoute: ${parts.join(" · ")}`;
            if (ctx.hasUI) ctx.ui.notify(msg, "info");
            else console.warn(`[mixroute] ${msg}`);
        },
    });

    pi.registerCommand("mixroute-refresh", {
        description: "Refresh the MixRoute model catalog",
        handler: async (_args, ctx) => {
            try {
                const result = await refresh(ctx.modelRegistry);
                if (lifetime.signal.aborted) return;
                const summary = `MixRoute model catalog ${result.changed ? "updated" : "unchanged"} (${result.models.length} models from ${result.source}).`;
                const message = result.warning ? `${summary} ${result.warning}` : summary;
                if (ctx.hasUI) ctx.ui.notify(message, result.warning ? "warning" : "info");
                else console.warn(`[mixroute] ${message}`);
            } catch (error) {
                if (lifetime.signal.aborted) return;
                const message = `MixRoute refresh failed: ${error instanceof Error ? error.message : String(error)}`;
                if (ctx.hasUI) ctx.ui.notify(message, "error");
                else console.warn(`[mixroute] ${message}`);
            }
        },
    });
}
