import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { test } from "node:test";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
async function refuses(script: string, env: NodeJS.ProcessEnv, pattern: RegExp, args: string[] = []) {
    await assert.rejects(
        exec(process.execPath, ["--import", "tsx", `scripts/${script}.ts`, ...args], {
            cwd: root,
            env: { PATH: process.env.PATH, ...env },
            timeout: 10_000,
        }),
        (error: unknown) => {
            assert.ok(error instanceof Error);
            assert.match(error.message, pattern);
            return true;
        },
    );
}

test("live smoke refuses to spend credits without explicit model/all opt-in", async () => {
    await refuses("smoke-models", { MIXROUTE_API_KEY: "fake-key" }, /Paid API calls require SMOKE_MODELS/);
});

test("live smoke never silently uses personal auth.json", async () => {
    await refuses("smoke-models", { SMOKE_MODELS: "example" }, /Set MIXROUTE_API_KEY explicitly/);
});

test("live smoke rejects invalid worker/deadline settings before starting pi", async () => {
    for (const env of [{ SMOKE_CONCURRENCY: "0" }, { SMOKE_CONCURRENCY: "NaN" }, { SMOKE_TIMEOUT_MS: "-1" }]) {
        await refuses(
            "smoke-models",
            { MIXROUTE_API_KEY: "fake-key", SMOKE_MODELS: "example", ...env },
            /must be a positive integer/,
        );
    }
});

test("snapshot generation requires an environment key and rejects argv secrets", async () => {
    await refuses("generate-models", {}, /Set MIXROUTE_API_KEY/);
    await refuses("generate-models", { MIXROUTE_API_KEY: "fake-key" }, /takes no arguments/, ["not-a-secret"]);
});
