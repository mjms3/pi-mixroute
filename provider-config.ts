/**
 * Provider configuration for MixRoute (https://api.mixroute.ai/v1).
 *
 * MixRoute is an OpenAI-compatible router (litellm-style responses) that also
 * exposes a native Anthropic Messages endpoint for its Claude routes, which
 * are Bedrock-backed (observed `anthropic.claude-*-v1:0` upstream ids and
 * `msg_bdrk_` message ids on 2026-09-12). Routing Claude models through the
 * native endpoint gives pi prompt caching and native thinking blocks.
 */

import type { ProviderConfig } from "@earendil-works/pi-coding-agent";
import { applyKnownModelOverrides } from "./known-model-overrides.ts";

export const BASE_URL = "https://api.mixroute.ai/v1";
// pi's Anthropic client appends /v1/messages itself, so those models must not carry /v1.
export const ANTHROPIC_BASE_URL = "https://api.mixroute.ai";
export const PROVIDER_NAME = "mixroute";
export const PROVIDER_DISPLAY_NAME = "MixRoute";
export const PROVIDER_API_KEY_ENV = "$MIXROUTE_API_KEY";

export type MixRouteProviderModel = {
    id: string;
    name: string;
    /** Best API exposed for this route, when reported by MixRoute discovery. */
    api?: "anthropic-messages" | "openai-completions" | "openai-responses";
    reasoning: boolean;
    input: ("text" | "image")[];
    cost: {
        input: number;
        output: number;
        cacheRead: number;
        cacheWrite: number;
    };
    contextWindow: number;
    maxTokens: number;
};

type ThinkingLevelMap = Partial<Record<"off" | "minimal" | "low" | "medium" | "high" | "xhigh" | "max", string>>;

// Claude thinking-level behaviour, ported from pi-tokenrouter's probing of the same
// Bedrock-backed upstream generations (probed there 2026-08-27): the adaptive families
// require adaptive thinking (`thinking.type: "adaptive"` plus effort) and reject budget
// thinking; the 4.5-and-older generations reject adaptive and still need budgets.
// pi only offers the xhigh and max levels when a thinkingLevelMap declares them.
const CLAUDE_ADAPTIVE_XHIGH_FAMILIES = ["fable-5", "sonnet-5", "opus-5", "opus-4-8", "opus-4-7"];
const CLAUDE_ADAPTIVE_MAX_ONLY_FAMILIES = ["opus-4-6", "sonnet-4-6"];
// Checked after the adaptive families so sonnet-4-5 and sonnet-4-6 are not caught here.
const CLAUDE_BUDGET_FAMILIES = ["haiku-4-5", "opus-4-5", "sonnet-4"];
const CLAUDE_XHIGH_MAX_THINKING_LEVEL_MAP: ThinkingLevelMap = { xhigh: "xhigh", max: "max" };
const CLAUDE_MAX_ONLY_THINKING_LEVEL_MAP: ThinkingLevelMap = { max: "max" };

export function isClaudeModel(modelId: string): boolean {
    return modelId.toLowerCase().startsWith("claude-");
}

function resolveClaudeThinkingLevelMap(modelId: string): ThinkingLevelMap | undefined {
    if (!isClaudeModel(modelId)) return undefined;
    const normalized = modelId.toLowerCase().replace(/[\s_.:]+/g, "-");
    const matchesFamily = (family: string) => new RegExp(`(?:^|-)${family}(?:-|$)`).test(normalized);
    if (CLAUDE_ADAPTIVE_MAX_ONLY_FAMILIES.some(matchesFamily)) {
        return CLAUDE_MAX_ONLY_THINKING_LEVEL_MAP;
    }
    if (CLAUDE_ADAPTIVE_XHIGH_FAMILIES.some(matchesFamily)) {
        return CLAUDE_XHIGH_MAX_THINKING_LEVEL_MAP;
    }
    if (CLAUDE_BUDGET_FAMILIES.some(matchesFamily)) {
        return undefined;
    }
    // Do not advertise unverified effort levels for unknown or pre-4.5 generations.
    return undefined;
}

export function selectApi(
    modelId: string,
    discoveredApi?: MixRouteProviderModel["api"],
): "anthropic-messages" | "openai-completions" | "openai-responses" {
    // These models' chat endpoints explicitly reject tools with reasoning_effort
    // and direct clients to /v1/responses. Override stale caches that may still
    // record Chat Completions as well as providing the bundled fallback.
    if (/^gpt-5[.-]6(?:-|$)/i.test(modelId) || /^gpt-6-astra(?:-|$)/i.test(modelId)) {
        return "openai-responses";
    }
    if (discoveredApi) return discoveredApi;
    if (isClaudeModel(modelId)) return "anthropic-messages";
    return "openai-completions";
}

function openAICompletionsCompat(modelId: string) {
    const normalized = modelId.toLowerCase();
    const isKimiK3 = /^kimi-k3(?:-|$)/.test(normalized);
    return {
        // MixRoute is OpenAI-compatible, not the OpenAI API itself. In particular,
        // its chat endpoint rejects the `developer` role. Conservative capability
        // defaults prevent one catalog's metadata from turning into invalid payloads
        // for a different gateway implementation.
        supportsStore: false,
        supportsDeveloperRole: false,
        supportsReasoningEffort: isKimiK3,
        maxTokensField: "max_tokens" as const,
        supportsStrictMode: false,
        ...(isKimiK3
            ? {
                  thinkingFormat: "openai" as const,
                  requiresReasoningContentOnAssistantMessages: true,
                  deferredToolsMode: "kimi" as const,
              }
            : {}),
    };
}

/**
 * Ceiling for a model's declared output limit.
 *
 * pi asks for the whole remaining context window as output room, keeping only a flat
 * 4096-token margin against a `characters / 4` estimate of the prompt. On code-heavy
 * context that estimate runs about 25% low, so the request total exceeds a shared
 * prompt-plus-output budget and the upstream answers with a context-length error. pi
 * reads that error as "out of room" and compacts, at a fraction of the real window.
 *
 * Declaring a smaller limit keeps the leftover window as slack. 32768 also fits
 * inside Anthropic's real 64000 output cap, which models.dev reports as 200000 for
 * some Bedrock variants.
 */
const MAX_OUTPUT_TOKENS = 32768;

export function resolveMaxTokens(contextWindow: number, maxTokens: number): number {
    return Math.min(maxTokens, contextWindow, MAX_OUTPUT_TOKENS);
}

export function createMixRouteProviderConfig(models: MixRouteProviderModel[]) {
    return {
        name: PROVIDER_DISPLAY_NAME,
        baseUrl: BASE_URL,
        api: "openai-completions" as const,
        apiKey: PROVIDER_API_KEY_ENV,
        authHeader: true,
        models: models.map((discoveredModel) => {
            // Apply again at registration so old caches and the bundled snapshot
            // receive corrections immediately, without requiring a refresh.
            const m = applyKnownModelOverrides(discoveredModel);
            const api = selectApi(m.id, m.api);
            const thinkingLevelMap = api === "anthropic-messages" ? resolveClaudeThinkingLevelMap(m.id) : undefined;
            return {
                ...m,
                api,
                maxTokens: resolveMaxTokens(m.contextWindow, m.maxTokens),
                ...(api === "anthropic-messages" ? { baseUrl: ANTHROPIC_BASE_URL } : {}),
                ...(thinkingLevelMap ? { thinkingLevelMap } : {}),
                ...(api === "openai-completions" ? { compat: openAICompletionsCompat(m.id) } : {}),
                ...(api === "anthropic-messages"
                    ? {
                          compat: {
                              // Bedrock-backed routes can reject the per-tool eager field.
                              supportsEagerToolInputStreaming: false,
                              ...(thinkingLevelMap ? { forceAdaptiveThinking: true } : {}),
                          },
                      }
                    : {}),
            };
        }),
    } satisfies ProviderConfig;
}
