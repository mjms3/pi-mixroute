#!/usr/bin/env node
/** Opt-in paid pi CLI smoke: isolated settings and a harmless tool round-trip, never filesystem/shell tools. */
import { spawn } from "node:child_process";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { isRecord } from "../catalog-validation.ts";
import { isUnsupportedMixRouteModel } from "../model-policy.ts";
import { MIXROUTE_MODELS } from "../models.generated.ts";
import { createMixRouteProviderConfig } from "../provider-config.ts";

function positiveInteger(name: string, fallback: number): number {
    const value = Number(process.env[name] ?? fallback);
    if (!Number.isSafeInteger(value) || value <= 0) throw new Error(`${name} must be a positive integer`);
    return value;
}

const apiKey = process.env.MIXROUTE_API_KEY?.trim();
const requested = process.env.SMOKE_MODELS?.split(",")
    .map((id) => id.trim())
    .filter(Boolean);
if (!requested?.length && process.env.SMOKE_ALL !== "1") {
    throw new Error("Paid API calls require SMOKE_MODELS=id1,id2 or explicit SMOKE_ALL=1; this never runs in CI");
}
if (!apiKey) throw new Error("Set MIXROUTE_API_KEY explicitly; smoke tests never read your auth.json");
const concurrency = positiveInteger("SMOKE_CONCURRENCY", 2);
const timeoutMs = positiveInteger("SMOKE_TIMEOUT_MS", 90_000);
const root = fileURLToPath(new URL("../", import.meta.url));
const piBin = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");
const outputDir = resolve(process.env.SMOKE_OUTPUT_DIR ?? join(root, "smoke-results"));
const directory = await mkdtemp(join(tmpdir(), "pi-mixroute-smoke-"));
const agentDir = join(directory, "agent");
const probe = join(directory, "probe.ts");
const prompt = 'Call mixroute_smoke_echo with text "OK", then reply with exactly OK.';
const common = ["--no-extensions", "--no-skills", "--no-prompt-templates", "--no-themes", "-e", root];

type CommandResult = { code: number | null; stdout: string; stderr: string; timedOut: boolean; durationMs: number };
type Result = CommandResult & { model: string; ok: boolean };
function run(args: string[]): Promise<CommandResult> {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        const child = spawn(process.execPath, [piBin, ...common, ...args], {
            cwd: directory,
            env: {
                PATH: process.env.PATH,
                HOME: directory,
                USERPROFILE: directory,
                PI_CODING_AGENT_DIR: agentDir,
                PI_OFFLINE: "1",
                PI_TELEMETRY: "0",
                MIXROUTE_API_KEY: apiKey,
                NO_COLOR: "1",
            },
            stdio: ["ignore", "pipe", "pipe"],
        });
        let stdout = "";
        let stderr = "";
        let timedOut = false;
        let killTimer: NodeJS.Timeout | undefined;
        const timer = setTimeout(() => {
            timedOut = true;
            child.kill("SIGTERM");
            killTimer = setTimeout(() => child.kill("SIGKILL"), 2_000);
            killTimer.unref();
        }, timeoutMs);
        const collect = (chunk: string, output: "stdout" | "stderr") => {
            if (output === "stdout") stdout += chunk;
            else stderr += chunk;
            if (stdout.length + stderr.length > 2_000_000) child.kill("SIGKILL");
        };
        child.stdout.setEncoding("utf8").on("data", (chunk: string) => collect(chunk, "stdout"));
        child.stderr.setEncoding("utf8").on("data", (chunk: string) => collect(chunk, "stderr"));
        child.once("error", reject);
        child.once("close", (code) => {
            clearTimeout(timer);
            clearTimeout(killTimer);
            const redact = (text: string) => text.replaceAll(apiKey!, "[REDACTED]");
            resolve({
                code,
                stdout: redact(stdout),
                stderr: redact(stderr),
                timedOut,
                durationMs: Date.now() - started,
            });
        });
    });
}

function passed(result: CommandResult): boolean {
    if (result.code !== 0 || result.timedOut) return false;
    const events: Record<string, unknown>[] = [];
    for (const line of result.stdout.split("\n").filter(Boolean)) {
        try {
            const event: unknown = JSON.parse(line);
            if (isRecord(event)) events.push(event);
        } catch {
            /* Non-protocol log lines are not evidence of success. */
        }
    }
    const toolUsed = events.some(
        (event) => event.type === "tool_execution_end" && event.toolName === "mixroute_smoke_echo" && !event.isError,
    );
    const message = events
        .filter(
            (event) => event.type === "message_end" && isRecord(event.message) && event.message.role === "assistant",
        )
        .at(-1)?.message;
    if (!isRecord(message) || message.stopReason !== "stop" || !Array.isArray(message.content)) return false;
    const text = message.content
        .filter(isRecord)
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim();
    return toolUsed && text === "OK";
}

try {
    await mkdir(agentDir, { recursive: true });
    await mkdir(outputDir, { recursive: true });
    await writeFile(
        probe,
        `import { Type } from "typebox";
export default function (pi) {
    pi.registerTool({ name: "mixroute_smoke_echo", label: "Echo", description: "Echo the provided text. No side effects.",
        parameters: Type.Object({ text: Type.String() }),
        async execute(_id, args) { return { content: [{ type: "text", text: args.text }], details: {} }; }
    });
}\n`,
    );
    if (process.env.SMOKE_INCLUDE_DENIED === "1") {
        const denied = MIXROUTE_MODELS.filter((model) => isUnsupportedMixRouteModel(model.id));
        await writeFile(
            join(agentDir, "models.json"),
            JSON.stringify({ providers: { mixroute: createMixRouteProviderConfig(denied) } }),
        );
    }
    const listed = await run(["--list-models", "mixroute"]);
    if (listed.code !== 0 || listed.timedOut) throw new Error(`Could not list models: ${listed.stderr}`);
    const available = listed.stdout.split("\n").flatMap((line) => /^mixroute\s+(\S+)/.exec(line)?.[1] ?? []);
    const models = [...new Set(requested ?? available)];
    if (!models.length) throw new Error("MixRoute model catalog is empty");
    for (const id of models)
        if (!available.includes(id))
            throw new Error(`Model not registered: ${id} (denied routes may need SMOKE_INCLUDE_DENIED=1)`);
    const results: Result[] = new Array(models.length);
    let next = 0;
    async function worker(): Promise<void> {
        while (next < models.length) {
            const index = next++;
            const model = models[index]!;
            const command = await run([
                "-e",
                probe,
                "-p",
                "--mode",
                "json",
                "--no-session",
                "--no-builtin-tools",
                "--provider",
                "mixroute",
                "--model",
                model,
                "--thinking",
                "high",
                prompt,
            ]);
            results[index] = { model, ...command, ok: passed(command) };
            console.log(`[${index + 1}/${models.length}] ${results[index]!.ok ? "PASS" : "FAIL"} ${model}`);
        }
    }
    await Promise.all(Array.from({ length: Math.min(concurrency, models.length) }, () => worker()));
    await writeFile(
        join(outputDir, "results.json"),
        `${JSON.stringify({ timestamp: new Date().toISOString(), prompt, timeoutMs, concurrency, results }, null, 2)}\n`,
        { mode: 0o600 },
    );
    const failures = results.filter((result) => !result.ok);
    console.log(
        `${results.length - failures.length}/${results.length} passed; results: ${join(outputDir, "results.json")}`,
    );
    process.exitCode = failures.length ? 1 : 0;
} finally {
    await rm(directory, { recursive: true, force: true });
}
