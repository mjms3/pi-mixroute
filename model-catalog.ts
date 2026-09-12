/**
 * Maps MixRoute's /v1/models payload to pi provider models, enriched with
 * metadata from models.dev first and OpenRouter second.
 *
 * MixRoute returns bare model ids (`gpt-5`, `claude-opus-4-5`, `glm-4.6`)
 * without limits, pricing, or modalities, so all metadata comes from the two
 * public catalogs. Ids are matched after normalization (lowercase, dots and
 * underscores become dashes) because the three sources disagree on separators:
 * MixRoute and models.dev use `claude-opus-4-5` / `MiniMax-M2.5`, OpenRouter
 * uses `anthropic/claude-opus-4.5` / `minimax/minimax-m2.5`.
 */

import { isUnsupportedMixRouteModel } from "./model-policy.ts";
import type { MixRouteProviderModel } from "./provider-config.ts";

export type MixRouteCatalogModel = {
    id: string;
    supported_endpoint_types?: string[];
};

export type MixRouteCatalogPayload = {
    data?: MixRouteCatalogModel[];
};

type ModelsDevModel = {
    name?: string;
    reasoning?: boolean;
    limit?: {
        context?: number;
        output?: number;
    };
    cost?: {
        input?: number;
        output?: number;
        cache_read?: number;
        cache_write?: number;
    };
    modalities?: {
        input?: string[];
        output?: string[];
    };
};

type ModelsDevProvider = {
    models?: Record<string, ModelsDevModel>;
};

export type ModelsDevPayload = Record<string, ModelsDevProvider>;

type OpenRouterCatalogModel = {
    id: string;
    name?: string;
    supported_parameters?: string[];
    architecture?: {
        modality?: string;
        input_modalities?: string[];
    };
    pricing?: {
        prompt?: string;
        completion?: string;
        input_cache_read?: string;
        input_cache_write?: string;
    };
    context_length?: number;
    top_provider?: {
        max_completion_tokens?: number;
    };
};

export type OpenRouterCatalogPayload = {
    data?: OpenRouterCatalogModel[];
};

// pi requests `contextWindow − prompt estimate − 4096` output tokens, floored at 1, so an
// under-declared window makes every reply a 1-token "length" truncation. 131072 is the
// safer wrong guess: an over-declared window degrades into upstream context errors that
// pi recovers from by compacting.
const DEFAULT_CONTEXT_WINDOW = 131072;
const DEFAULT_MAX_TOKENS = 4096;

// MixRoute ids carry snapshot suffixes the metadata catalogs never list:
// `gpt-4.1-2025-04-14`, `claude-haiku-4-5-20251001`, `gpt-4-0613`,
// `deepseek-v3-2-251201`. Stripped iteratively so dated variants fall back to
// the metadata of their base id.
const VARIANT_SUFFIX = /-(\d{8}|\d{6}|\d{4}-\d{2}-\d{2}|\d{4})$/;

type VariantCandidate = {
    id: string;
    stripped: string[];
};

function baseVariantCandidates(normalizedId: string): VariantCandidate[] {
    const candidates: VariantCandidate[] = [];
    let current = normalizedId;
    const stripped: string[] = [];
    for (let match = VARIANT_SUFFIX.exec(current); match; match = VARIANT_SUFFIX.exec(current)) {
        stripped.unshift(match[1]!);
        current = current.slice(0, -match[0].length);
        candidates.push({ id: current, stripped: [...stripped] });
    }
    return candidates;
}

/** Lowercase and collapse every separator to `-` so `claude-opus-4.5`, `claude-opus-4-5` and `claude_opus_4.5` coincide. */
export function normalizeModelId(id: string): string {
    return id.toLowerCase().replace(/[._\s:]+/g, "-");
}

function supportsTextEndpoints(model: MixRouteCatalogModel): boolean {
    // Older OpenAI-compatible lists contain only ids. Explicit endpoint lists remain authoritative.
    if (model.supported_endpoint_types === undefined) return true;
    const endpoints = new Set(model.supported_endpoint_types);
    return endpoints.has("openai") || endpoints.has("openai-response") || endpoints.has("anthropic");
}

// Routes that no chat client can use: transcription, TTS, realtime, embeddings,
// image/music/video generation, translation, 3D assets. Matched against the
// normalized id. Everything else stays listed even without metadata — hiding a
// usable chat model is worse than listing one that errors when selected.
function isClaudeId(normalizedId: string): boolean {
    return normalizedId.startsWith("claude-");
}

const NON_CHAT_ID_PATTERN =
    /(?:^|-)(?:whisper|tts|transcribe|realtime|audio|embedding|image|imagine|sora|seedance|dreamina|lyria|veo|videoedit)(?:-|$)|^wan\d|^hy\d|(?:^|-)mt\d|dola-seed|^text-embedding/;

function parseOpenRouterPrice(price?: string): number | undefined {
    if (price === undefined || !price.trim()) return undefined;
    const parsed = Number(price) * 1_000_000;
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
}

function firstNonNegative(...values: (number | undefined)[]): number | undefined {
    return values.find((value) => typeof value === "number" && Number.isFinite(value) && value >= 0);
}

// models.dev reports zero limits for embedding models; a non-positive limit would make
// the cached catalog fail its own validation, so treat it as absent.
function firstPositive(...values: (number | undefined)[]): number | undefined {
    return values.find((value) => typeof value === "number" && Number.isSafeInteger(value) && value > 0);
}

// models.dev keys models per provider and the same bare id (`gpt-5`, `grok-4`,
// `kimi-k2.5`) appears under many hosting providers with identical limits but
// diverging prices. Prefer the model's own vendor entry, then major clouds,
// then any reseller, first match wins.
const MODELS_DEV_PROVIDER_PRIORITY = [
    "openai",
    "anthropic",
    "google",
    "xai",
    "zai",
    "zhipuai",
    "deepseek",
    "moonshotai",
    "moonshotai-cn",
    "alibaba",
    "alibaba-cn",
    "minimax",
    "minimax-cn",
    "meta",
    "mistral",
    "amazon-bedrock",
    "azure",
    "azure-cognitive-services",
    "google-vertex",
    "openrouter",
    "volcengine",
];

function buildModelsDevLookup(payload: ModelsDevPayload): Map<string, ModelsDevModel> {
    const lookup = new Map<string, ModelsDevModel>();
    const providerIds = [
        ...MODELS_DEV_PROVIDER_PRIORITY,
        ...Object.keys(payload).filter((id) => !MODELS_DEV_PROVIDER_PRIORITY.includes(id)),
    ];
    for (const providerId of providerIds) {
        const provider = payload[providerId];
        if (!provider?.models) continue;
        for (const [id, model] of Object.entries(provider.models)) {
            const key = normalizeModelId(id);
            if (!lookup.has(key)) lookup.set(key, model);
        }
    }
    return lookup;
}

function buildOpenRouterLookup(payload: OpenRouterCatalogPayload): Map<string, OpenRouterCatalogModel> {
    const lookup = new Map<string, OpenRouterCatalogModel>();
    for (const model of payload.data ?? []) {
        // `anthropic/claude-opus-4.5:batch` -> `claude-opus-4-5`; first variant wins.
        const bare = model.id.split(":")[0]!.split("/").pop()!;
        const key = normalizeModelId(bare);
        if (!lookup.has(key)) lookup.set(key, model);
    }
    return lookup;
}

function openRouterSupportsImageInput(model: OpenRouterCatalogModel | undefined): boolean | undefined {
    const architecture = model?.architecture;
    if (!architecture) return undefined;
    if (architecture.input_modalities) return architecture.input_modalities.includes("image");
    // Older payloads carry a `modality` string such as "text+image->text".
    return architecture.modality?.split("->")[0]?.includes("image");
}

export function mapMixRouteCatalogToProviderModels(
    mixRoutePayload: MixRouteCatalogPayload,
    modelsDevPayload: ModelsDevPayload,
    openRouterPayload: OpenRouterCatalogPayload,
    cachedModels: readonly MixRouteProviderModel[] = [],
): MixRouteProviderModel[] {
    const cachedById = new Map(cachedModels.map((model) => [model.id, model]));
    const seen = new Set<string>();
    const modelsDevLookup = buildModelsDevLookup(modelsDevPayload);
    const openRouterLookup = buildOpenRouterLookup(openRouterPayload);

    return (mixRoutePayload.data ?? [])
        .filter((model) => {
            if (!model.id || !supportsTextEndpoints(model) || isUnsupportedMixRouteModel(model.id)) return false;
            if (seen.has(model.id) || NON_CHAT_ID_PATTERN.test(normalizeModelId(model.id))) return false;
            seen.add(model.id);
            return true;
        })
        .map((model): MixRouteProviderModel => {
            const cached = cachedById.get(model.id);
            const normalizedId = normalizeModelId(model.id);
            const endpoints = new Set(model.supported_endpoint_types ?? []);
            const api: MixRouteProviderModel["api"] =
                isClaudeId(normalizedId) && endpoints.has("anthropic")
                    ? "anthropic-messages"
                    : /^(?:gpt-5-6|gpt-6-astra)(?:-|$)/.test(normalizedId) && endpoints.has("openai-response")
                      ? "openai-responses"
                      : !endpoints.has("openai") && endpoints.has("openai-response")
                        ? "openai-responses"
                        : !endpoints.has("openai") && endpoints.has("anthropic")
                          ? "anthropic-messages"
                          : model.supported_endpoint_types === undefined && isClaudeId(normalizedId)
                            ? "anthropic-messages"
                            : "openai-completions";
            const candidates = [{ id: normalizedId, stripped: [] as string[] }, ...baseVariantCandidates(normalizedId)];

            // First candidate known to either catalog provides the metadata.
            let modelsDevModel: ModelsDevModel | undefined;
            let openRouterModel: OpenRouterCatalogModel | undefined;
            let strippedSuffix: string[] | undefined;
            for (const candidate of candidates) {
                modelsDevModel = modelsDevLookup.get(candidate.id);
                openRouterModel = openRouterLookup.get(candidate.id);
                if (modelsDevModel || openRouterModel) {
                    strippedSuffix = candidate.stripped.length ? candidate.stripped : undefined;
                    break;
                }
            }

            // Some reseller entries (e.g. models.dev `jiekou/grok-4-0709`) echo the bare id
            // as their display name; keep looking through the variants for a real name.
            let baseName: string | undefined;
            for (const candidate of candidates) {
                const name = modelsDevLookup.get(candidate.id)?.name ?? openRouterLookup.get(candidate.id)?.name;
                if (name && name !== model.id) {
                    baseName = name;
                    if (candidate.stripped.length && !strippedSuffix) strippedSuffix = candidate.stripped;
                    break;
                }
            }

            return {
                id: model.id,
                name: baseName
                    ? strippedSuffix
                        ? `${baseName} (${strippedSuffix.join(", ")})`
                        : baseName
                    : (cached?.name ?? model.id),
                api,
                reasoning:
                    modelsDevModel?.reasoning ??
                    openRouterModel?.supported_parameters?.includes("reasoning") ??
                    cached?.reasoning ??
                    false,
                input:
                    (modelsDevModel?.modalities?.input?.includes("image") ??
                    (openRouterModel?.architecture ? openRouterSupportsImageInput(openRouterModel) : undefined) ??
                    cached?.input.includes("image") ??
                    false)
                        ? ["text", "image"]
                        : ["text"],
                cost: {
                    input:
                        firstNonNegative(
                            modelsDevModel?.cost?.input,
                            parseOpenRouterPrice(openRouterModel?.pricing?.prompt),
                            cached?.cost.input,
                        ) ?? 0,
                    output:
                        firstNonNegative(
                            modelsDevModel?.cost?.output,
                            parseOpenRouterPrice(openRouterModel?.pricing?.completion),
                            cached?.cost.output,
                        ) ?? 0,
                    cacheRead:
                        firstNonNegative(
                            modelsDevModel?.cost?.cache_read,
                            parseOpenRouterPrice(openRouterModel?.pricing?.input_cache_read),
                            cached?.cost.cacheRead,
                        ) ?? 0,
                    cacheWrite:
                        firstNonNegative(
                            modelsDevModel?.cost?.cache_write,
                            parseOpenRouterPrice(openRouterModel?.pricing?.input_cache_write),
                            cached?.cost.cacheWrite,
                        ) ?? 0,
                },
                contextWindow:
                    firstPositive(
                        modelsDevModel?.limit?.context,
                        openRouterModel?.context_length,
                        cached?.contextWindow,
                    ) ?? DEFAULT_CONTEXT_WINDOW,
                maxTokens:
                    firstPositive(
                        modelsDevModel?.limit?.output,
                        openRouterModel?.top_provider?.max_completion_tokens,
                        cached?.maxTokens,
                    ) ?? DEFAULT_MAX_TOKENS,
            };
        })
        .sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}
