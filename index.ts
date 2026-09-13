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
 * response.  The actual remaining balance is available via MixRoute's One API
 * admin endpoint:
 *
 *   GET /api/user/self  →  { quota, used_quota, ... }
 *
 * This requires an admin access token (obtained by logging into the MixRoute
 * website) plus the numeric user ID.  Set both in auth.json:
 *
 *   "mixroute": {
 *     "type": "api_key",
 *     "key": "sk-...",
 *     "adminToken": "your-admin-access-token",
 *     "userId": 1234
 *   }
 *
 * When these are present the extension shows the remaining balance in the
 * footer, colour-coded:
 *   🟢 green   ≥ $40 remaining
 *   🟠 orange  $20–$40 remaining
 *   🔴 red     < $20 remaining
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { type ExtensionAPI, getAgentDir, type ModelRegistry, type ThemeColor } from "@earendil-works/pi-coding-agent";
import { type LoadMixRouteModelsResult, loadMixRouteModels, readMixRouteModelsCache } from "./model-loader.ts";
import { filterUnsupportedMixRouteModels } from "./model-policy.ts";
import { MIXROUTE_MODELS } from "./models.generated.ts";
import { createMixRouteProviderConfig, PROVIDER_NAME } from "./provider-config.ts";

// ---------------------------------------------------------------------------
// Budget tracking via One API admin endpoint
// ---------------------------------------------------------------------------
//
// MixRoute runs a One API admin panel.  When you log into
// https://api.mixroute.ai you receive an admin access token.  Store it
// alongside your API key in auth.json together with your numeric user ID.
//
//   GET /api/user/self  →  { quota, used_quota, ... }
//
//   quota (internal units) / 500000 = remaining balance in USD

const STATUS_KEY = "mixroute-budget";
const QUOTA_PER_UNIT = 500_000; // from /api/status → quota_per_unit

// Colour thresholds in USD
const GREEN_THRESHOLD = 40; // > $40  → green
const AMBER_THRESHOLD = 20; // > $20  → amber; ≤ $20  → red

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
 * Read admin credentials from auth.json.
 * Returns { adminToken, userId } or null if either is missing.
 */
type AdminCredentials = { adminToken: string; userId: number };
async function readAdminCredentials(): Promise<AdminCredentials | null> {
    try {
        const authPath = join(getAgentDir(), "auth.json");
        const raw = await readFile(authPath, "utf8");
        const auth = JSON.parse(raw) as Record<string, unknown>;
        const entry = auth[PROVIDER_NAME] as Record<string, unknown> | undefined;
        if (!entry) return null;
        const adminToken = entry.adminToken;
        const userId = entry.userId;
        if (typeof adminToken !== "string" || !adminToken.trim()) return null;
        if (typeof userId !== "number" || !Number.isSafeInteger(userId) || userId <= 0) return null;
        return { adminToken: adminToken.trim(), userId };
    } catch {
        return null;
    }
}

/**
 * Fetch the user's remaining quota from the One API admin endpoint.
 * Returns the balance in USD, or null on failure.
 */
async function fetchAdminBalance(credentials: AdminCredentials, signal?: AbortSignal): Promise<number | null> {
    try {
        const res = await fetch("https://api.mixroute.ai/api/user/self", {
            headers: {
                authorization: `Bearer ${credentials.adminToken}`,
                "New-Api-User": String(credentials.userId),
                accept: "application/json",
            },
            signal,
        });
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
    let adminBalance: number | null = null; // USD, or null if unavailable
    let credentials: AdminCredentials | null = null;

    // Read admin credentials once at startup (auth.json rarely changes).
    credentials = await readAdminCredentials();

    /** Re-fetch the admin balance and update the status bar. */
    async function refreshAdminBalance(ctx: {
        ui: {
            setStatus: (key: string, text: string | undefined) => void;
            theme?: { fg: (color: ThemeColor, text: string) => string };
        };
    }): Promise<void> {
        if (!credentials) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        const balance = await fetchAdminBalance(credentials, lifetime.signal);
        if (lifetime.signal.aborted) return;
        adminBalance = balance;
        updateBudgetStatus(ctx);
    }

    /** Update the status bar with the current admin balance, colour-coded.
     * Uses explicit ANSI colors (green/amber/red) independent of theme.
     */
    function updateBudgetStatus(ctx: {
        ui: {
            setStatus: (key: string, text: string | undefined) => void;
            theme?: { fg: (color: ThemeColor, text: string) => string };
        };
    }): void {
        if (adminBalance === null || !mixrouteActive) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        // ANSI 256-color codes: green (28), amber/orange (214), red (196)
        const ansiColor = adminBalance >= GREEN_THRESHOLD ? 28 : adminBalance >= AMBER_THRESHOLD ? 214 : 196;
        const label = `$${adminBalance.toFixed(2)}`;
        // Use raw ANSI escape sequence for theme-independent colors
        ctx.ui.setStatus(STATUS_KEY, `\x1b[38;5;${ansiColor}m◉ ${label}\x1b[0m`);
    }

    // Session start: reset state, refresh model catalog in background.
    pi.on("session_start", (_event, ctx) => {
        mixrouteActive = false;
        adminBalance = null;
        rlTokensRemaining = null;
        rlTokensLimit = null;
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

    // When the user picks a MixRoute model, fetch the admin balance.
    pi.on("model_select", async (_event, ctx) => {
        mixrouteActive = _event.model.provider === PROVIDER_NAME;
        if (!mixrouteActive) {
            ctx.ui.setStatus(STATUS_KEY, undefined);
            return;
        }
        if (credentials) {
            await refreshAdminBalance(ctx);
        }
    });

    // After every MixRoute response: track rate-limit tokens and refresh the
    // admin balance so the footer stays up to date.
    let balanceRefreshInFlight = false;
    pi.on("after_provider_response", (event, ctx) => {
        if (!mixrouteActive) return;

        // Track rate-limit tokens (shown in /mixroute-budget detail).
        const remaining = parseDecimalHeader(event.headers, "x-ratelimit-remaining-tokens");
        const limit = parseDecimalHeader(event.headers, "x-ratelimit-limit-tokens");
        if (remaining !== null) rlTokensRemaining = remaining;
        if (limit !== null) rlTokensLimit = limit;

        // Refresh the admin balance (fire-and-forget, no concurrency).
        // Each request consumes quota so the balance changes every time.
        if (credentials && !balanceRefreshInFlight) {
            balanceRefreshInFlight = true;
            fetchAdminBalance(credentials, lifetime.signal)
                .then((balance) => {
                    if (!lifetime.signal.aborted && balance !== null) {
                        adminBalance = balance;
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
            if (adminBalance !== null) {
                parts.push(`$${adminBalance.toFixed(2)} remaining`);
            }
            if (rlTokensRemaining !== null && rlTokensLimit !== null) {
                const pct = ((rlTokensRemaining / rlTokensLimit) * 100).toFixed(1);
                parts.push(`${compact(rlTokensRemaining)}/${compact(rlTokensLimit)} tpm rate limit (${pct}%)`);
            }
            if (parts.length === 0) {
                const msg = credentials
                    ? "No MixRoute balance data yet. Send a message first."
                    : "No admin credentials configured. Add adminToken and userId to auth.json.";
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
