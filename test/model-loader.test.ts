import assert from "node:assert/strict";
import { mkdir, readdir, readFile, stat, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { test } from "node:test";
import {
    loadMixRouteModels as load,
    MIXROUTE_MODELS_URL,
    MODELS_DEV_URL,
    OPENROUTER_MODELS_URL,
    readMixRouteModelsCache as readCache,
} from "../model-loader.ts";
import { MIXROUTE_MODELS } from "../models.generated.ts";
import { fakeFetch, model, responses, temporaryDirectory } from "./helpers.ts";

const defaults = { apiKey: "test-secret", bundledModels: [model("bundled")], retryDelayMs: 0 };
const writeCache = (path: string, models: unknown[], version = 1) =>
    writeFile(path, JSON.stringify({ version, models }));

test("live discovery writes a private cache and sends credentials only to MixRoute", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    const seen: string[] = [];
    const fetchImpl: typeof fetch = async (url, init) => {
        const auth = new Headers(init?.headers).get("authorization");
        assert.equal(auth, String(url) === MIXROUTE_MODELS_URL ? "Bearer test-secret" : null);
        assert.equal(init?.redirect, "error");
        assert.ok(init?.signal);
        seen.push(String(url));
        return fakeFetch()(url, init);
    };
    const result = await load({ ...defaults, cachePath, fetchImpl });
    assert.equal(result.source, "live");
    assert.equal(result.warning, undefined);
    assert.equal(seen.length, 3);
    assert.deepEqual(await readCache(cachePath), result.models);
    assert.ok(!(await readFile(cachePath, "utf8")).includes(defaults.apiKey));
    if (process.platform !== "win32") assert.equal((await stat(cachePath)).mode & 0o777, 0o600);
});

test("missing or whitespace-only key uses cache without any network calls", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    await writeCache(cachePath, [model()]);
    for (const apiKey of [undefined, "", "  "]) {
        const result = await load({
            ...defaults,
            apiKey,
            cachePath,
            fetchImpl: () => {
                throw new Error("must not fetch");
            },
        });
        assert.equal(result.source, "cache");
        assert.match(result.warning!, /API key/);
    }
});

test("missing, corrupt and wrong-version caches fall back to the bundle", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    const options = { ...defaults, apiKey: undefined, cachePath };
    assert.equal((await load(options)).source, "bundled");
    await writeFile(cachePath, "{broken");
    assert.equal((await load(options)).source, "bundled");
    await writeCache(cachePath, [model()], 0);
    assert.equal((await load(options)).source, "bundled");
});

test("invalid caches and catalogs emptied by policy are rejected", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    for (const models of [
        [],
        [model("gpt-5-codex")],
        [model(), model()],
        [{ id: "x" }],
        [model(" ")],
        [model("x", { name: " " })],
        [model("x", { input: [] })],
        [model("x", { cost: { input: -1, output: 0, cacheRead: 0, cacheWrite: 0 } })],
        [model("x", { maxTokens: 0 })],
        [model("x", { contextWindow: 1.5 })],
        [{ ...model(), api: "unknown" }],
        [{ ...model(), reasoning: "yes" }],
    ]) {
        await writeCache(cachePath, models);
        await assert.rejects(readCache(cachePath));
    }
});

test("cache parser strips untrusted transport/auth fields; bundled snapshot validates", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    await writeCache(cachePath, [
        { ...model(), baseUrl: "https://evil.invalid", headers: { Authorization: "secret" } },
    ]);
    assert.deepEqual(await readCache(cachePath), [model()]);
    await writeCache(cachePath, MIXROUTE_MODELS);
    assert.ok((await readCache(cachePath)).length > 0);
});

for (const [failed, label] of [
    [MODELS_DEV_URL, "models.dev"],
    [OPENROUTER_MODELS_URL, "OpenRouter"],
]) {
    test(`${label} outage or malformed JSON does not lose the live catalog`, async (t) => {
        const cachePath = join(await temporaryDirectory(t), "cache.json");
        for (const failure of [new Error("offline"), null, new Response("bad json")]) {
            const result = await load({
                ...defaults,
                cachePath,
                fetchImpl: fakeFetch({ ...responses, [failed!]: failure }),
            });
            assert.equal(result.source, "live");
            assert.ok(result.warning?.includes(label!));
            assert.equal(result.models[0]!.contextWindow, failed === MODELS_DEV_URL ? 100000 : 200000);
        }
    });
}

test("partial metadata failure preserves cached fields missing from the remaining service", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    await writeCache(cachePath, [model("example", { maxTokens: 7777, input: ["text", "image"] }), model("removed")]);
    const result = await load({
        ...defaults,
        cachePath,
        fetchImpl: fakeFetch({ ...responses, [MODELS_DEV_URL]: new Error("offline") }),
    });
    assert.equal(result.models.length, 1);
    assert.equal(result.models[0]!.maxTokens, 7777);
    assert.deepEqual(result.models[0]!.input, ["text", "image"]);
    assert.equal(result.models[0]!.contextWindow, 100000);
});

test("both metadata sources down reuse cached metadata, but live routing/membership wins", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    await writeCache(cachePath, [model("example", { api: "openai-completions" }), model("removed")]);
    const result = await load({
        ...defaults,
        cachePath,
        fetchImpl: fakeFetch({
            [MIXROUTE_MODELS_URL]: {
                data: [{ id: "example", supported_endpoint_types: ["anthropic"] }, { id: "new" }],
            },
            [MODELS_DEV_URL]: new Error("offline"),
            [OPENROUTER_MODELS_URL]: new Error("offline"),
        }),
    });
    assert.equal(result.source, "live");
    assert.deepEqual(
        result.models.map((m) => m.id),
        ["example", "new"],
    );
    assert.equal(result.models[0]!.api, "anthropic-messages");
    assert.equal(result.models[0]!.contextWindow, 128000);
    assert.equal(result.models[1]!.contextWindow, 131072);
    assert.match(result.warning!, /models.dev and OpenRouter/);
});

for (const payload of [{ data: [] }, null, { data: [{ id: 7 }] }]) {
    test(`bad MixRoute catalog (${JSON.stringify(payload)}) preserves a good cache`, async (t) => {
        const cachePath = join(await temporaryDirectory(t), "cache.json");
        await writeCache(cachePath, [model()]);
        const result = await load({
            ...defaults,
            cachePath,
            fetchImpl: fakeFetch({ ...responses, [MIXROUTE_MODELS_URL]: payload }),
        });
        assert.equal(result.source, "cache");
        assert.deepEqual(await readCache(cachePath), [model()]);
    });
}

for (const [status, expected] of [
    [401, 1],
    [403, 1],
    [429, 2],
    [500, 2],
]) {
    test(`HTTP ${status} makes ${expected} attempt(s)`, async (t) => {
        const cachePath = join(await temporaryDirectory(t), "cache.json");
        let attempts = 0;
        const result = await load({
            ...defaults,
            cachePath,
            fetchImpl: async (url, init) => {
                if (String(url) === MIXROUTE_MODELS_URL) {
                    attempts++;
                    return new Response("secret body", { status });
                }
                return fakeFetch()(url, init);
            },
        });
        assert.equal(attempts, expected);
        assert.equal(result.source, "bundled");
        assert.ok(!result.warning?.includes("secret body"));
    });
}

test("transient network failure is retried once", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    let attempts = 0;
    const result = await load({
        ...defaults,
        cachePath,
        fetchImpl: async (url, init) => {
            if (String(url) === MIXROUTE_MODELS_URL && attempts++ === 0) throw new Error("network down");
            return fakeFetch()(url, init);
        },
    });
    assert.equal(result.source, "live");
    assert.equal(attempts, 2);
});

test("cache write failure returns the live catalog with a warning", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "directory-not-file");
    await mkdir(cachePath);
    const result = await load({ ...defaults, cachePath, fetchImpl: fakeFetch() });
    assert.equal(result.source, "live");
    assert.match(result.warning!, /could not write/);
});

test("concurrent cache writers leave a complete cache and no temporary files", async (t) => {
    const directory = await temporaryDirectory(t);
    const cachePath = join(directory, "cache.json");
    const results = await Promise.all(
        Array.from({ length: 8 }, () => load({ ...defaults, cachePath, fetchImpl: fakeFetch() })),
    );
    assert.ok(results.every((r) => r.source === "live" && !r.warning));
    assert.deepEqual(await readCache(cachePath), results[0]!.models);
    assert.deepEqual(await readdir(directory), ["cache.json"]);
});

test("cancellation aborts all requests without retries, fallback or cache writes", async (t) => {
    const directory = await temporaryDirectory(t);
    const controller = new AbortController();
    let requests = 0;
    const fetchImpl: typeof fetch = async (_url, init) =>
        new Promise((_resolve, reject) => {
            requests++;
            init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
            if (requests === 3) controller.abort(new Error("session ended"));
        });
    await assert.rejects(
        load({ ...defaults, cachePath: join(directory, "cache.json"), signal: controller.signal, fetchImpl }),
        /session ended/,
    );
    assert.equal(requests, 3);
    assert.deepEqual(await readdir(directory), []);
    await assert.rejects(load({ ...defaults, cachePath: "unused", signal: controller.signal }), /session ended/);
});

test("timeout bounds hung requests and falls back after one retry", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    // AbortSignal.timeout uses unref'ed timers; keep this test alive until they fire.
    const keepAlive = setInterval(() => {}, 1000);
    t.after(() => clearInterval(keepAlive));
    let requests = 0;
    const result = await load({
        ...defaults,
        cachePath,
        timeoutMs: 10,
        fetchImpl: async (_url, init) =>
            new Promise((_resolve, reject) => {
                requests++;
                init!.signal!.addEventListener("abort", () => reject(init!.signal!.reason), { once: true });
            }),
    });
    assert.equal(result.source, "bundled");
    assert.equal(requests, 6);
});

test("invalid JSON error diagnostics do not quote response bodies", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    const result = await load({
        ...defaults,
        cachePath,
        fetchImpl: fakeFetch({
            ...responses,
            [MIXROUTE_MODELS_URL]: new Response("a-secret-echoed-by-server"),
        }),
    });
    assert.equal(result.source, "bundled");
    assert.match(result.warning!, /not valid JSON/);
    assert.ok(!result.warning!.includes("secret-echoed"));
});

test("cancellation during retry backoff prevents the second attempt", async (t) => {
    const cachePath = join(await temporaryDirectory(t), "cache.json");
    const controller = new AbortController();
    let attempts = 0;
    const pending = load({
        ...defaults,
        cachePath,
        signal: controller.signal,
        retryDelayMs: 10_000,
        fetchImpl: async (url, init) => {
            if (String(url) === MIXROUTE_MODELS_URL) {
                attempts++;
                setTimeout(() => controller.abort(new Error("cancelled during backoff")), 10);
                throw new Error("offline");
            }
            return fakeFetch()(url, init);
        },
    });
    await assert.rejects(pending, /cancelled during backoff/);
    assert.equal(attempts, 1);
});

test("invalid timeout/retry settings fail early", async () => {
    for (const options of [{ timeoutMs: 0 }, { timeoutMs: Number.NaN }, { retryDelayMs: -1 }]) {
        await assert.rejects(load({ ...defaults, cachePath: "unused", ...options }), /timeout/);
    }
});
