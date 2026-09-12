import type { MixRouteProviderModel } from "./provider-config.ts";

/**
 * Routes intentionally hidden from pi.
 *
 * MixRoute's discovery endpoint can advertise models that cannot complete a
 * normal pi request. This is deliberately a manual, evidence-based denylist:
 * entries were reproduced by scripts/smoke-models.ts and should be removed
 * when a later full-catalog smoke test proves that the route works.
 */
export const UNSUPPORTED_MIXROUTE_MODELS = {
    // Historical eager_input_streaming failures. The compat flag now omits that
    // field, but keep these hidden until a live tool round-trip verifies recovery.
    "claude-opus-4-5": "Bedrock rejects eager_input_streaming",
    "claude-opus-4-5-20251101": "Bedrock rejects eager_input_streaming",
    "claude-sonnet-4-5": "Bedrock rejects eager_input_streaming",
    "claude-sonnet-4-5-20250929": "Bedrock rejects eager_input_streaming",

    // Broken/empty streams observed repeatedly in the catalog smoke test.
    "gemini-omni-1.1-flash": "stream ends without finish_reason",
    "gemini-pro-latest": "stream ends without finish_reason",
    "glm-4-alltools": "upstream network_error finish reason",
    "glm-4.5": "successful stream contains no response",
    "glm-4.5-x": "successful stream contains no response",
    "glm-4.6": "successful stream contains no response",
    "glm-4.7": "successful stream contains no response",

    // Catalog output limits produce requests rejected by the upstream model.
    "glm-4-long": "catalog output limit exceeds upstream maximum",
    "glm-4v": "catalog output limit exceeds upstream maximum",
    "glm-4v-plus": "catalog output limit exceeds upstream maximum",
    "gpt-3.5-turbo-0125": "catalog output limit exceeds upstream maximum",
    "gpt-3.5-turbo-1106": "catalog output limit exceeds upstream maximum",

    // MixRoute advertises these routes but rejects the operation used by pi.
    "gpt-5-codex": "requested operation unsupported upstream",
    "gpt-5-pro": "requested operation unsupported upstream",
    "gpt-5-pro-2025-10-06": "requested operation unsupported upstream",
    "gpt-5.1-codex": "requested operation unsupported upstream",
    "gpt-5.1-codex-max": "requested operation unsupported upstream",
    "gpt-5.1-codex-mini": "requested operation unsupported upstream",
    "gpt-5.2-codex": "requested operation unsupported upstream",
    "gpt-5.3-codex": "requested operation unsupported upstream",
    "gpt-5.4-pro": "requested operation unsupported upstream",
    "gpt-5.4-pro-2026-03-05": "requested operation unsupported upstream",
    "gpt-chat-latest": "requires a request token field incompatible with its advertised route",

    // No usable MixRoute channel/auth/access for the current public route.
    "grok-3": "no channels available",
    "grok-3-mini": "no channels available",
    "grok-4-0709": "upstream rejects MixRoute credential",
    "grok-4.2": "no channels available",
    "grok-4.20-beta-0309-non-reasoning": "upstream rejects MixRoute credential",
    "grok-4.20-beta-0309-reasoning": "upstream rejects MixRoute credential",
    "grok-4.20-multi-agent-beta-0309": "upstream rejects MixRoute credential",
    "grok-code-fast-1": "no channels available",
    "o3-pro": "upstream organization is not verified for this model",

    // Model-specific interfaces are incompatible with pi's normal tool request.
    "grok-4.20-0309-reasoning": "upstream rejects reasoning effort",
    "grok-4.20-multi-agent-0309": "client-side tools require beta access",
    "llama-3.3-70b-instruct": "does not support pi's tool set",
    "minimax-h3": "MixRoute routes chat requests to an invalid endpoint",
} as const satisfies Record<string, string>;

export type UnsupportedMixRouteModelId = keyof typeof UNSUPPORTED_MIXROUTE_MODELS;

export function isUnsupportedMixRouteModel(modelId: string): boolean {
    return Object.hasOwn(UNSUPPORTED_MIXROUTE_MODELS, modelId.toLowerCase());
}

export function filterUnsupportedMixRouteModels(models: readonly MixRouteProviderModel[]): MixRouteProviderModel[] {
    return models.filter((model) => !isUnsupportedMixRouteModel(model.id));
}
