import assert from "node:assert/strict";
import { test } from "node:test";
import { filterUnsupportedMixRouteModels, isUnsupportedMixRouteModel } from "../model-policy.ts";
import {
    ANTHROPIC_BASE_URL,
    BASE_URL,
    createMixRouteProviderConfig,
    resolveMaxTokens,
    selectApi,
} from "../provider-config.ts";
import { model } from "./helpers.ts";

const configured = (id: string) => createMixRouteProviderConfig([model(id)]).models[0]!;

test("provider identity, auth and conservative chat compatibility", () => {
    const config = createMixRouteProviderConfig([model()]);
    assert.equal(config.name, "MixRoute");
    assert.equal(config.apiKey, "$MIXROUTE_API_KEY");
    assert.equal(config.authHeader, true);
    assert.equal(config.baseUrl, BASE_URL);
    const chat = configured("example");
    assert.equal(chat.api, "openai-completions");
    assert.ok(chat.compat && "supportsDeveloperRole" in chat.compat);
    assert.equal(chat.compat.supportsDeveloperRole, false);
    assert.equal(chat.compat.supportsReasoningEffort, false);
    assert.equal(chat.compat.supportsStore, false);
    assert.equal(chat.compat.supportsStrictMode, false);
    assert.equal(chat.compat.maxTokensField, "max_tokens");
});

test("Kimi K3 gets reasoning replay and deferred tools, but K30 does not", () => {
    const kimi = configured("kimi-k3");
    assert.ok(kimi.compat && "supportsReasoningEffort" in kimi.compat);
    assert.equal(kimi.compat.supportsReasoningEffort, true);
    assert.equal(kimi.compat.requiresReasoningContentOnAssistantMessages, true);
    assert.equal(kimi.compat.deferredToolsMode, "kimi");
    const other = configured("kimi-k30");
    assert.ok(other.compat && "supportsReasoningEffort" in other.compat);
    assert.equal(other.compat.supportsReasoningEffort, false);
});

test("Responses overrides stale chat caches only for the affected GPT families", () => {
    for (const id of ["gpt-5.6-sol", "gpt-5-6", "GPT-6-ASTRA"]) {
        assert.equal(selectApi(id, "openai-completions"), "openai-responses");
        assert.equal(configured(id).compat, undefined);
    }
    assert.equal(selectApi("gpt-5.60"), "openai-completions");
    assert.equal(selectApi("example", "anthropic-messages"), "anthropic-messages");
});

test("Claude adaptive families and native endpoint", () => {
    for (const [id, expected] of [
        ["claude-sonnet-5", { xhigh: "xhigh", max: "max" }],
        ["claude-opus-4.6", { max: "max" }],
    ] as const) {
        const claude = configured(id);
        assert.equal(claude.api, "anthropic-messages");
        assert.equal(claude.baseUrl, ANTHROPIC_BASE_URL);
        assert.deepEqual(claude.thinkingLevelMap, expected);
        assert.ok(claude.compat && "forceAdaptiveThinking" in claude.compat);
        assert.equal(claude.compat.forceAdaptiveThinking, true);
        assert.equal(claude.compat.supportsEagerToolInputStreaming, false);
    }
});

test("legacy and unknown Claude models do not advertise unverified adaptive levels", () => {
    for (const id of ["claude-haiku-4-5", "claude-sonnet-4", "claude-3-opus", "claude-opus-4", "claude-future"]) {
        const claude = configured(id);
        assert.equal(claude.thinkingLevelMap, undefined);
        assert.deepEqual(claude.compat, { supportsEagerToolInputStreaming: false });
    }
});

test("output limits are capped without mutating the source snapshot", () => {
    const original = model();
    assert.equal(createMixRouteProviderConfig([original]).models[0]!.maxTokens, 32768);
    assert.equal(original.maxTokens, 64000);
    assert.equal(resolveMaxTokens(1000, 2000), 1000);
    assert.equal(resolveMaxTokens(100000, 4096), 4096);
});

test("denylist is case-insensitive and does not match Object.prototype properties", () => {
    assert.equal(isUnsupportedMixRouteModel("MiniMax-H3"), true);
    assert.equal(isUnsupportedMixRouteModel("GROK-3"), true);
    for (const id of ["constructor", "__proto__", "toString", "gpt-6-astra"])
        assert.equal(isUnsupportedMixRouteModel(id), false);
    assert.deepEqual(
        filterUnsupportedMixRouteModels([model("gpt-5-codex"), model("gpt-6-astra")]).map((m) => m.id),
        ["gpt-6-astra"],
    );
});
