/** Exercise pi's actual request serializers, aborting in onPayload before any HTTP request. */
import assert from "node:assert/strict";
import { test } from "node:test";
import type { Model } from "@earendil-works/pi-ai";
import { completeSimple } from "@earendil-works/pi-ai/compat";
import { createReadTool } from "@earendil-works/pi-coding-agent";
import { isRecord } from "../catalog-validation.ts";
import { BASE_URL, createMixRouteProviderConfig } from "../provider-config.ts";
import { model } from "./helpers.ts";

async function payloadFor(id: string): Promise<Record<string, unknown>> {
    const configured = createMixRouteProviderConfig([model(id)]).models[0]!;
    const selected: Model<typeof configured.api> = {
        ...configured,
        provider: "mixroute",
        baseUrl: configured.baseUrl ?? BASE_URL,
    };
    let captured: unknown;
    const result = await completeSimple(
        selected,
        {
            systemPrompt: "Test system prompt",
            messages: [{ role: "user", content: "Read example.txt", timestamp: 0 }],
            tools: [createReadTool("/unused")],
        },
        {
            apiKey: "not-a-real-key",
            reasoning: "high",
            onPayload: (payload) => {
                captured = payload;
                throw new Error("contract-test: stop before network");
            },
        },
    );
    assert.equal(result.stopReason, "error");
    assert.match(result.errorMessage ?? "", /contract-test: stop before network/);
    assert.ok(isRecord(captured));
    return captured;
}

test("pi serializes MixRoute chat with system role, max_tokens and no generic reasoning_effort", async (t) => {
    const network = t.mock.method(globalThis, "fetch", async () => {
        throw new Error("Unexpected network call");
    });
    const payload = await payloadFor("example");
    const messages = payload.messages as { role: string }[];
    assert.equal(messages[0]!.role, "system");
    assert.equal(payload.max_tokens, 32768);
    assert.equal(payload.max_completion_tokens, undefined);
    assert.equal(payload.reasoning_effort, undefined);
    assert.equal(payload.store, undefined);
    assert.equal(network.mock.callCount(), 0);
});

test("pi serializes native Claude adaptive thinking without Bedrock-incompatible eager tool fields", async (t) => {
    const network = t.mock.method(globalThis, "fetch", async () => {
        throw new Error("Unexpected network call");
    });
    const payload = await payloadFor("claude-sonnet-5");
    assert.ok(isRecord(payload.thinking));
    assert.equal(payload.thinking.type, "adaptive");
    const tools = payload.tools as Record<string, unknown>[];
    assert.ok(tools.length > 0);
    assert.ok(tools.every((tool) => !Object.hasOwn(tool, "eager_input_streaming")));
    assert.equal(network.mock.callCount(), 0);
});

test("pi serializes affected GPT routes through Responses with function tools", async (t) => {
    const network = t.mock.method(globalThis, "fetch", async () => {
        throw new Error("Unexpected network call");
    });
    const payload = await payloadFor("gpt-5.6-sol");
    assert.ok(Array.isArray(payload.input));
    assert.equal(payload.messages, undefined);
    assert.ok((payload.tools as { type: string }[]).some((tool) => tool.type === "function"));
    assert.equal(network.mock.callCount(), 0);
});
