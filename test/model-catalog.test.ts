import assert from "node:assert/strict";
import { test } from "node:test";
import { parseMixRouteCatalog, parseModelsDevCatalog, parseOpenRouterCatalog } from "../catalog-validation.ts";
import { mapMixRouteCatalogToProviderModels as map, normalizeModelId } from "../model-catalog.ts";
import { model } from "./helpers.ts";

test("endpoint selection respects advertised transports and id-only legacy catalogs", () => {
    const models = map(
        {
            data: [
                { id: "claude-sonnet-5", supported_endpoint_types: ["openai", "anthropic"] },
                { id: "anthropic-only", supported_endpoint_types: ["anthropic"] },
                { id: "responses-only", supported_endpoint_types: ["openai-response"] },
                { id: "gpt-5.6-sol", supported_endpoint_types: ["openai", "openai-response"] },
                { id: "gpt-6-astra", supported_endpoint_types: ["openai", "openai-response"] },
                { id: "legacy" },
                { id: "claude-legacy" },
                { id: "no-endpoints", supported_endpoint_types: [] },
            ],
        },
        {},
        {},
    );
    assert.deepEqual(Object.fromEntries(models.map((m) => [m.id, m.api])), {
        "anthropic-only": "anthropic-messages",
        "claude-legacy": "anthropic-messages",
        "claude-sonnet-5": "anthropic-messages",
        "gpt-5.6-sol": "openai-responses",
        "gpt-6-astra": "openai-responses",
        legacy: "openai-completions",
        "responses-only": "openai-responses",
    });
});

test("filters non-chat, denied and duplicate routes; output order is deterministic", () => {
    const ids = ["z", "whisper-1", "tts-1", "gpt-image-1", "text-embedding-3", "gpt-5-codex", "a", "z"];
    assert.deepEqual(
        map({ data: ids.map((id) => ({ id })) }, {}, {}).map((m) => m.id),
        ["a", "z"],
    );
});

test("models.dev vendor metadata takes precedence, including explicit false capabilities and free pricing", () => {
    const result = map(
        { data: [{ id: "example" }] },
        {
            reseller: { models: { example: { limit: { context: 42 } } } },
            openai: {
                models: {
                    example: {
                        reasoning: false,
                        modalities: { input: ["text"] },
                        cost: { input: 0 },
                        limit: { context: 1000 },
                    },
                },
            },
        },
        {
            data: [
                {
                    id: "vendor/example",
                    supported_parameters: ["reasoning"],
                    architecture: { input_modalities: ["image"] },
                    pricing: { prompt: "0.000003", completion: "0.00001" },
                },
            ],
        },
    )[0]!;
    assert.equal(result.reasoning, false);
    assert.deepEqual(result.input, ["text"]);
    assert.equal(result.cost.input, 0);
    assert.equal(result.cost.output, 10);
    assert.equal(result.contextWindow, 1000);
});

test("normalization and dated variant metadata fallback preserve the requested id", () => {
    assert.equal(normalizeModelId("MiniMax_M2.5"), "minimax-m2-5");
    const result = map(
        { data: [{ id: "gpt-4.1-2025-04-14" }] },
        {
            openai: { models: { "gpt-4.1": { name: "GPT 4.1", limit: { context: 1000000 } } } },
        },
        {},
    )[0]!;
    assert.equal(result.id, "gpt-4.1-2025-04-14");
    assert.equal(result.name, "GPT 4.1 (2025-04-14)");
    assert.equal(result.contextWindow, 1000000);
});

test("OpenRouter pricing, legacy image modalities and reasoning are used without vendor metadata", () => {
    const result = map(
        { data: [{ id: "example" }] },
        {},
        {
            data: [
                {
                    id: "vendor/example:batch",
                    name: "Example",
                    supported_parameters: ["reasoning"],
                    architecture: { modality: "text+image->text" },
                    pricing: { prompt: "0.000002", input_cache_read: "0.000001" },
                    context_length: 100000,
                    top_provider: { max_completion_tokens: 8192 },
                },
            ],
        },
    )[0]!;
    assert.equal(result.cost.input, 2);
    assert.equal(result.cost.cacheRead, 1);
    assert.deepEqual(result.input, ["text", "image"]);
    assert.equal(result.reasoning, true);
    assert.equal(result.maxTokens, 8192);
});

test("invalid prices and limits never produce negative costs, NaN or invalid caches", () => {
    const result = map(
        { data: [{ id: "unknown" }] },
        {
            vendor: {
                models: { unknown: { cost: { input: -1, output: Number.NaN }, limit: { context: 0, output: 1.5 } } },
            },
        },
        {
            data: [
                { id: "vendor/unknown", pricing: { prompt: "-1", completion: "1garbage", input_cache_read: "1e999" } },
            ],
        },
    )[0]!;
    assert.deepEqual(result.cost, { input: 0, output: 0, cacheRead: 0, cacheWrite: 0 });
    assert.equal(result.contextWindow, 131072);
    assert.equal(result.maxTokens, 4096);
});

test("cached enrichment is field-level fallback, never authoritative membership or routing", () => {
    const cached = [model("example", { api: "openai-completions", input: ["text", "image"] }), model("removed")];
    const result = map({ data: [{ id: "example", supported_endpoint_types: ["anthropic"] }] }, {}, {}, cached);
    assert.equal(result.length, 1);
    assert.equal(result[0]!.api, "anthropic-messages");
    assert.equal(result[0]!.contextWindow, cached[0]!.contextWindow);
    assert.deepEqual(result[0]!.input, ["text", "image"]);
});

test("JSON validators reject malformed envelopes and nested structures", () => {
    for (const value of [
        null,
        [],
        "html",
        {},
        { data: null },
        { data: [null] },
        { data: [{ id: 42 }] },
        { data: [{ id: " " }] },
        { data: [{ id: "x", supported_endpoint_types: "openai" }] },
    ]) {
        assert.throws(() => parseMixRouteCatalog(value));
    }
    for (const value of [
        null,
        [],
        { vendor: null },
        { vendor: { models: [] } },
        { vendor: { models: { x: { modalities: { input: 7 } } } } },
    ]) {
        assert.throws(() => parseModelsDevCatalog(value));
    }
    for (const value of [null, {}, { data: [null] }, { data: [{ id: "x", architecture: [] }] }]) {
        assert.throws(() => parseOpenRouterCatalog(value));
    }
    assert.deepEqual(parseMixRouteCatalog({ data: [{ id: "x", unknown: true }] }).data?.[0], {
        id: "x",
        supported_endpoint_types: undefined,
    });
});
