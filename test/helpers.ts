import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { TestContext } from "node:test";
import { MIXROUTE_MODELS_URL, MODELS_DEV_URL, OPENROUTER_MODELS_URL } from "../model-loader.ts";
import type { MixRouteProviderModel } from "../provider-config.ts";

export function model(id = "example", overrides: Partial<MixRouteProviderModel> = {}): MixRouteProviderModel {
    return {
        id,
        name: id,
        reasoning: true,
        input: ["text"],
        cost: { input: 1, output: 2, cacheRead: 0, cacheWrite: 0 },
        contextWindow: 128_000,
        maxTokens: 64_000,
        ...overrides,
    };
}

export async function temporaryDirectory(t: TestContext): Promise<string> {
    const directory = await mkdtemp(join(tmpdir(), "pi-mixroute-test-"));
    t.after(() => rm(directory, { recursive: true, force: true }));
    return directory;
}

export const responses: Record<string, unknown> = {
    [MIXROUTE_MODELS_URL]: { data: [{ id: "example", supported_endpoint_types: ["openai"] }] },
    [MODELS_DEV_URL]: {
        vendor: {
            models: {
                example: {
                    name: "Example",
                    reasoning: true,
                    limit: { context: 200000, output: 16000 },
                    cost: { input: 3 },
                },
            },
        },
    },
    [OPENROUTER_MODELS_URL]: {
        data: [{ id: "vendor/example", context_length: 100000, pricing: { prompt: "0.00001" } }],
    },
};

export function fakeFetch(payloads: Record<string, unknown> = responses): typeof fetch {
    return async (input) => {
        const url = String(input);
        if (!Object.hasOwn(payloads, url)) throw new Error(`Unexpected URL: ${url}`);
        const payload = payloads[url];
        if (payload instanceof Error) throw payload;
        if (payload instanceof Response) return payload.clone();
        return Response.json(payload);
    };
}
