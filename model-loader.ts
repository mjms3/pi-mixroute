/** Runtime discovery with independent metadata fallbacks and a validated, atomic disk cache. */
import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { setTimeout as delay } from "node:timers/promises";
import { isRecord, parseMixRouteCatalog, parseModelsDevCatalog, parseOpenRouterCatalog } from "./catalog-validation.ts";
import { mapMixRouteCatalogToProviderModels } from "./model-catalog.ts";
import { filterUnsupportedMixRouteModels } from "./model-policy.ts";
import type { MixRouteProviderModel } from "./provider-config.ts";

export const MIXROUTE_MODELS_URL = "https://api.mixroute.ai/v1/models";
export const MODELS_DEV_URL = "https://models.dev/api.json";
export const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";
const MODEL_CACHE_VERSION = 1;
const DEFAULT_TIMEOUT_MS = 10_000;
const DEFAULT_RETRY_DELAY_MS = 1_000;

export type MixRouteModelSource = "live" | "cache" | "bundled";
export type LoadMixRouteModelsOptions = {
    apiKey: string | undefined;
    cachePath: string;
    bundledModels: MixRouteProviderModel[];
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
    retryDelayMs?: number;
    /** Cancellation is propagated, never converted into a fallback or retried. */
    signal?: AbortSignal;
};
export type LoadMixRouteModelsResult = {
    models: MixRouteProviderModel[];
    source: MixRouteModelSource;
    warning?: string;
};

function errorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
}

function isPositiveInteger(value: unknown): value is number {
    return typeof value === "number" && Number.isSafeInteger(value) && value > 0;
}

function isNonNegativeNumber(value: unknown): value is number {
    return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseCachedModel(value: unknown): MixRouteProviderModel {
    if (!isRecord(value)) throw new Error("Expected a cached model to be an object");
    const { id, name, api, reasoning, input, cost, contextWindow, maxTokens } = value;
    if (typeof id !== "string" || !id.trim() || id !== id.trim()) throw new Error("Expected a non-empty model id");
    if (typeof name !== "string" || !name.trim()) throw new Error("Expected a non-empty model name");
    if (
        api !== undefined &&
        api !== "anthropic-messages" &&
        api !== "openai-completions" &&
        api !== "openai-responses"
    ) {
        throw new Error("Expected a supported text endpoint");
    }
    if (typeof reasoning !== "boolean") throw new Error("Expected boolean reasoning");
    if (
        !Array.isArray(input) ||
        !input.includes("text") ||
        !input.every((item) => item === "text" || item === "image")
    ) {
        throw new Error("Expected text/image input modalities including text");
    }
    if (
        !isRecord(cost) ||
        !isNonNegativeNumber(cost.input) ||
        !isNonNegativeNumber(cost.output) ||
        !isNonNegativeNumber(cost.cacheRead) ||
        !isNonNegativeNumber(cost.cacheWrite)
    ) {
        throw new Error("Expected four non-negative costs");
    }
    if (!isPositiveInteger(contextWindow) || !isPositiveInteger(maxTokens)) {
        throw new Error("Expected positive integer token limits");
    }
    // Reconstruct rather than spread: never accept cached URLs, headers, or credentials.
    return {
        id,
        name,
        ...(api ? { api } : {}),
        reasoning,
        input: [...new Set(input)] as ("text" | "image")[],
        cost: { input: cost.input, output: cost.output, cacheRead: cost.cacheRead, cacheWrite: cost.cacheWrite },
        contextWindow,
        maxTokens,
    };
}

export async function readMixRouteModelsCache(cachePath: string): Promise<MixRouteProviderModel[]> {
    const parsed: unknown = JSON.parse(await readFile(cachePath, "utf8"));
    if (!isRecord(parsed) || parsed.version !== MODEL_CACHE_VERSION || !Array.isArray(parsed.models)) {
        throw new Error(`Expected model cache version ${MODEL_CACHE_VERSION} and a models array`);
    }
    const models = filterUnsupportedMixRouteModels(parsed.models.map(parseCachedModel));
    if (!models.length) throw new Error("Expected at least one usable cached model");
    if (new Set(models.map((model) => model.id)).size !== models.length) throw new Error("Duplicate cached model ids");
    return models;
}

async function writeMixRouteModelsCache(
    cachePath: string,
    models: MixRouteProviderModel[],
    signal?: AbortSignal,
): Promise<void> {
    signal?.throwIfAborted();
    await mkdir(dirname(cachePath), { recursive: true });
    const temporaryPath = `${cachePath}.${process.pid}.${randomUUID()}.tmp`;
    try {
        await writeFile(temporaryPath, `${JSON.stringify({ version: MODEL_CACHE_VERSION, models }, null, 2)}\n`, {
            encoding: "utf8",
            mode: 0o600,
            flag: "wx",
            signal,
        });
        signal?.throwIfAborted();
        await rename(temporaryPath, cachePath);
    } finally {
        await rm(temporaryPath, { force: true }).catch(() => {
            // Best-effort cleanup must not hide the original write error.
        });
    }
}

class CatalogHttpError extends Error {
    constructor(readonly status: number) {
        // Do not log remote bodies/headers, which may contain secrets or terminal escapes.
        super(`Catalog request returned HTTP ${status}`);
    }
}

async function fetchJson(fetchImpl: typeof fetch, url: string, signal: AbortSignal, apiKey?: string): Promise<unknown> {
    const response = await fetchImpl(url, {
        headers: { accept: "application/json", ...(apiKey ? { authorization: `Bearer ${apiKey}` } : {}) },
        signal,
        // Discovery endpoints are fixed; do not follow redirects with credentials.
        redirect: "error",
    });
    if (!response.ok) {
        await response.body?.cancel();
        throw new CatalogHttpError(response.status);
    }
    try {
        return await response.json();
    } catch {
        signal.throwIfAborted();
        // Native JSON errors can quote remote response text. Keep diagnostics body-free.
        throw new Error("Catalog response was not valid JSON");
    }
}

async function fetchLiveModels(
    apiKey: string,
    fetchImpl: typeof fetch,
    timeoutMs: number,
    cachedModels: readonly MixRouteProviderModel[],
    signal?: AbortSignal,
): Promise<{ models: MixRouteProviderModel[]; degradedMetadata: string[] }> {
    const controller = new AbortController();
    const attemptSignal = AbortSignal.any([
        controller.signal,
        AbortSignal.timeout(timeoutMs),
        ...(signal ? [signal] : []),
    ]);
    try {
        const [mixRoute, metadata] = await Promise.all([
            fetchJson(fetchImpl, MIXROUTE_MODELS_URL, attemptSignal, apiKey).then(parseMixRouteCatalog),
            Promise.allSettled([
                fetchJson(fetchImpl, MODELS_DEV_URL, attemptSignal).then(parseModelsDevCatalog),
                fetchJson(fetchImpl, OPENROUTER_MODELS_URL, attemptSignal).then(parseOpenRouterCatalog),
            ]),
        ]);
        signal?.throwIfAborted();
        const [modelsDev, openRouter] = metadata;
        const degradedMetadata = [
            ...(modelsDev.status === "rejected" ? ["models.dev"] : []),
            ...(openRouter.status === "rejected" ? ["OpenRouter"] : []),
        ];
        const models = mapMixRouteCatalogToProviderModels(
            mixRoute,
            modelsDev.status === "fulfilled" ? modelsDev.value : {},
            openRouter.status === "fulfilled" ? openRouter.value : { data: [] },
            degradedMetadata.length ? cachedModels : [],
        );
        if (!models.length) throw new Error("MixRoute returned no usable models");
        return { models, degradedMetadata };
    } finally {
        // Also stop metadata requests if MixRoute failed before they settled.
        controller.abort();
    }
}

export async function loadMixRouteModels(options: LoadMixRouteModelsOptions): Promise<LoadMixRouteModelsResult> {
    const { signal } = options;
    signal?.throwIfAborted();
    const fetchImpl = options.fetchImpl ?? fetch;
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const retryDelayMs = options.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    if (!isPositiveInteger(timeoutMs) || !Number.isSafeInteger(retryDelayMs) || retryDelayMs < 0) {
        throw new Error("Discovery timeout must be a positive integer and retry delay a non-negative integer");
    }
    const cachedModels = await readMixRouteModelsCache(options.cachePath).catch(() => undefined);
    signal?.throwIfAborted();
    const apiKey = options.apiKey?.trim();
    let liveFailure = "No MixRoute API key is configured (run /login mixroute)";
    if (apiKey) {
        try {
            const live = await fetchLiveModels(apiKey, fetchImpl, timeoutMs, cachedModels ?? [], signal).catch(
                async (error: unknown) => {
                    signal?.throwIfAborted();
                    // Auth and other permanent HTTP failures cannot improve after a retry.
                    if (
                        error instanceof CatalogHttpError &&
                        error.status < 500 &&
                        error.status !== 429 &&
                        error.status !== 408
                    )
                        throw error;
                    await delay(retryDelayMs, undefined, { signal });
                    return fetchLiveModels(apiKey, fetchImpl, timeoutMs, cachedModels ?? [], signal);
                },
            );
            signal?.throwIfAborted();
            const warning = live.degradedMetadata.length
                ? `Could not read ${live.degradedMetadata.join(" and ")}; missing metadata uses the last cache or defaults.`
                : undefined;
            try {
                await writeMixRouteModelsCache(options.cachePath, live.models, signal);
                return { models: live.models, source: "live", warning };
            } catch (error) {
                signal?.throwIfAborted();
                return {
                    models: live.models,
                    source: "live",
                    warning: `${warning ? `${warning} ` : ""}Loaded the live catalog but could not write its cache: ${errorMessage(error)}`,
                };
            }
        } catch (error) {
            signal?.throwIfAborted();
            liveFailure = `Could not refresh the MixRoute model catalog (${errorMessage(error)})`;
        }
    }
    return cachedModels
        ? { models: cachedModels, source: "cache", warning: `${liveFailure}. Using the cached catalog.` }
        : {
              models: filterUnsupportedMixRouteModels(options.bundledModels),
              source: "bundled",
              warning: `${liveFailure}. Using the bundled model snapshot.`,
          };
}
