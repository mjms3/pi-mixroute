import assert from "node:assert/strict";
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { type TestContext, test } from "node:test";
import type {
    ExtensionAPI,
    ExtensionCommandContext,
    ExtensionContext,
    ProviderConfig,
    RegisteredCommand,
} from "@earendil-works/pi-coding-agent";
import activate from "../index.ts";
import { fakeFetch, temporaryDirectory } from "./helpers.ts";

type Handler = (event: unknown, context: ExtensionContext) => void | Promise<void>;
async function harness(
    t: TestContext,
    offline = false,
    hasUI = true,
    options: {
        authJson?: string;
        settingsJson?: string;
        projectSettingsJson?: string;
        projectTrusted?: boolean;
        budgetEnv?: { green?: string; amber?: string };
    } = {},
) {
    const directory = await temporaryDirectory(t);
    const agentDir = join(directory, "agent");
    const projectDir = join(directory, "project");
    const originalDir = process.env.PI_CODING_AGENT_DIR;
    const originalOffline = process.env.PI_OFFLINE;
    const originalGreen = process.env.MIXROUTE_BUDGET_GREEN;
    const originalAmber = process.env.MIXROUTE_BUDGET_AMBER;
    process.env.PI_CODING_AGENT_DIR = agentDir;
    process.env.PI_OFFLINE = offline ? "1" : "0";
    delete process.env.MIXROUTE_BUDGET_GREEN;
    delete process.env.MIXROUTE_BUDGET_AMBER;
    if (options.budgetEnv?.green !== undefined) process.env.MIXROUTE_BUDGET_GREEN = options.budgetEnv.green;
    if (options.budgetEnv?.amber !== undefined) process.env.MIXROUTE_BUDGET_AMBER = options.budgetEnv.amber;
    if (options.authJson !== undefined) {
        await mkdir(agentDir, { recursive: true });
        await writeFile(join(agentDir, "auth.json"), options.authJson);
    }
    if (options.settingsJson !== undefined) {
        await mkdir(agentDir, { recursive: true });
        await writeFile(join(agentDir, "settings.json"), options.settingsJson);
    }
    if (options.projectSettingsJson !== undefined) {
        await mkdir(join(projectDir, ".pi"), { recursive: true });
        await writeFile(join(projectDir, ".pi", "settings.json"), options.projectSettingsJson);
    }
    t.after(() => {
        if (originalDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
        else process.env.PI_CODING_AGENT_DIR = originalDir;
        if (originalOffline === undefined) delete process.env.PI_OFFLINE;
        else process.env.PI_OFFLINE = originalOffline;
        if (originalGreen === undefined) delete process.env.MIXROUTE_BUDGET_GREEN;
        else process.env.MIXROUTE_BUDGET_GREEN = originalGreen;
        if (originalAmber === undefined) delete process.env.MIXROUTE_BUDGET_AMBER;
        else process.env.MIXROUTE_BUDGET_AMBER = originalAmber;
    });
    const handlers = new Map<string, Handler>();
    const commands = new Map<string, RegisteredCommand>();
    const registrations: ProviderConfig[] = [];
    const notifications: { message: string; level: string }[] = [];
    const warnings: unknown[][] = [];
    const statuses = new Map<string, string | undefined>();
    t.mock.method(console, "warn", (...args: unknown[]) => {
        warnings.push(args);
    });
    const getKey = t.mock.fn(async (): Promise<string | undefined> => "test-key");
    const context = {
        hasUI,
        cwd: projectDir,
        isProjectTrusted: () => options.projectTrusted ?? true,
        modelRegistry: { getApiKeyForProvider: getKey },
        ui: {
            notify: (message: string, level: string) => {
                notifications.push({ message, level });
            },
            setStatus: (key: string, text: string | undefined) => {
                statuses.set(key, text);
            },
        },
    } as unknown as ExtensionCommandContext;
    const pi = {
        on: (name: string, handler: Handler) => {
            handlers.set(name, handler);
        },
        registerCommand: (name: string, command: RegisteredCommand) => {
            commands.set(name, command);
        },
        registerProvider: (_name: string, config: ProviderConfig) => {
            registrations.push(config);
        },
    } as unknown as ExtensionAPI;
    await activate(pi);
    return {
        context,
        handlers,
        commands,
        registrations,
        notifications,
        warnings,
        statuses,
        getKey,
        pi,
        start: () => handlers.get("session_start")!({}, context),
        shutdown: () => handlers.get("session_shutdown")!({}, context),
        refresh: () => commands.get("mixroute-refresh")!.handler("", context),
        selectModel: (provider = "mixroute") => handlers.get("model_select")!({ model: { provider } }, context),
        afterResponse: (headers: Record<string, string> = {}) =>
            handlers.get("after_provider_response")!({ headers }, context),
    };
}

/** Mock fetch that serves the One API admin balance endpoint. */
function mockAdminBalance(t: TestContext, balanceUsd: number) {
    return t.mock.method(globalThis, "fetch", async (input: unknown): Promise<Response> => {
        const url = String(input);
        if (url === "https://api.mixroute.ai/api/user/self") {
            return Response.json({ success: true, data: { quota: balanceUsd * 500_000 } });
        }
        throw new Error(`Unexpected URL: ${url}`);
    });
}

const budgetStatus = (h: { statuses: Map<string, string | undefined> }) => h.statuses.get("mixroute-budget");
const flushAsync = () => new Promise((resolve) => setImmediate(resolve));

test("factory registers bundled models without networking; offline startup skips refresh", async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", fakeFetch());
    const h = await harness(t, true);
    assert.equal(h.registrations.length, 1);
    assert.ok(h.registrations[0]!.models!.length > 0);
    await h.start();
    assert.equal(fetchMock.mock.callCount(), 0);
    assert.equal(h.getKey.mock.callCount(), 0);
    // Explicit command remains available in offline mode.
    await h.refresh();
    assert.equal(h.registrations.length, 2);
    assert.equal(h.notifications[0]!.level, "info");
});

test("startup and concurrent commands share one refresh; unchanged catalogs do not re-register", async (t) => {
    const fetchMock = t.mock.method(globalThis, "fetch", fakeFetch());
    const h = await harness(t);
    await h.start();
    await h.start();
    await Promise.all([h.refresh(), h.refresh()]);
    assert.equal(fetchMock.mock.callCount(), 3);
    assert.equal(h.getKey.mock.callCount(), 1);
    assert.equal(h.registrations.length, 2);
    await h.refresh();
    assert.equal(fetchMock.mock.callCount(), 6);
    assert.equal(h.registrations.length, 2);
    assert.match(h.notifications.at(-1)!.message, /unchanged/);
});

test("shutdown aborts pending refresh and suppresses stale registration/notifications", async (t) => {
    const h = await harness(t);
    let release!: () => void;
    const started = new Promise<void>((resolve) => {
        release = resolve;
    });
    const signals: AbortSignal[] = [];
    t.mock.method(
        globalThis,
        "fetch",
        async (_url: unknown, init?: RequestInit): Promise<Response> =>
            new Promise((_resolve, reject) => {
                const signal = init!.signal!;
                signals.push(signal);
                signal.addEventListener("abort", () => reject(signal.reason), { once: true });
                if (signals.length === 3) release();
            }),
    );
    await h.start();
    const command = h.refresh();
    await started;
    await h.shutdown();
    await command;
    assert.ok(signals.every((s) => s.aborted));
    assert.equal(h.registrations.length, 1);
    assert.equal(h.notifications.length, 0);
    assert.equal(h.warnings.length, 0);
});

test("genuine registration failures are reported rather than hidden as session shutdown", async (t) => {
    t.mock.method(globalThis, "fetch", fakeFetch());
    const h = await harness(t);
    t.mock.method(h.pi, "registerProvider", () => {
        throw new Error("invalid provider config");
    });
    await h.refresh();
    assert.equal(h.notifications[0]!.level, "error");
    assert.match(h.notifications[0]!.message, /invalid provider config/);
});

test("headless commands report to stderr rather than writing to the JSON/stdout channel", async (t) => {
    const h = await harness(t, false, false);
    h.getKey.mock.mockImplementation(async () => undefined);
    await h.refresh();
    assert.equal(h.notifications.length, 0);
    assert.match(String(h.warnings[0]), /API key/);
    h.getKey.mock.mockImplementation(async () => {
        throw new Error("auth unavailable");
    });
    await h.refresh();
    assert.match(String(h.warnings.at(-1)), /auth unavailable/);
});

test("background refresh failures are handled without unhandled rejections", async (t) => {
    const h = await harness(t);
    h.getKey.mock.mockImplementation(async () => {
        throw new Error("auth unavailable");
    });
    await h.start();
    await h.refresh();
    assert.match(String(h.warnings), /auth unavailable/);
});

test("budget status uses default thresholds when nothing is configured", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
    });
    await h.start();
    await h.selectModel();
    const status = budgetStatus(h);
    assert.ok(status);
    assert.match(status!, /\$30\.00/);
    assert.match(status!, /38;5;214/); // amber: 20 ≤ 30 < 40
});

test("budget thresholds are configurable via the settings.json mixroute key", async (t) => {
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 100, amber: 25 } } }),
    });
    await h.start();
    mockAdminBalance(t, 150);
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;28/); // green: 150 ≥ 100
    mockAdminBalance(t, 30);
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;214/); // amber: 25 ≤ 30 < 100
    mockAdminBalance(t, 10);
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;196/); // red: 10 < 25
});

test("trusted project settings override global budget thresholds", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 100, amber: 25 } } }),
        projectSettingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 10, amber: 5 } } }),
    });
    await h.start();
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;28/); // green: project says 30 ≥ 10
});

test("untrusted project settings are ignored for budget thresholds", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 100, amber: 25 } } }),
        projectSettingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 10, amber: 5 } } }),
        projectTrusted: false,
    });
    await h.start();
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;214/); // amber: global says 25 ≤ 30 < 100
});

test("env vars override settings.json budget thresholds", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        budgetEnv: { green: "10", amber: "5" },
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 100, amber: 25 } } }),
    });
    await h.start();
    await h.selectModel();
    const status = budgetStatus(h);
    assert.ok(status);
    assert.match(status!, /38;5;28/); // green: 30 ≥ 10
});

test("malformed budget threshold values fall back to the defaults", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: -5, amber: "nope" } } }),
    });
    await h.start();
    await h.selectModel();
    const status = budgetStatus(h);
    assert.ok(status);
    assert.match(status!, /38;5;214/); // defaults: amber at 30
});

test("inverted budget threshold pairs are normalized", async (t) => {
    // { green: 10, amber: 50 } is normalized to { green: 50, amber: 10 }.
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
        settingsJson: JSON.stringify({ mixroute: { budgetThresholds: { green: 10, amber: 50 } } }),
    });
    await h.start();
    await h.selectModel();
    const status = budgetStatus(h);
    assert.ok(status);
    assert.match(status!, /38;5;214/); // amber: 10 ≤ 30 < 50
});

test("budget status is not shown when admin credentials are absent", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k" } }),
    });
    await h.start();
    await h.selectModel();
    assert.equal(budgetStatus(h), undefined);
});

test("budget status is hidden when the model switches away from mixroute", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
    });
    await h.start();
    await h.selectModel();
    assert.ok(budgetStatus(h));
    await h.selectModel("other-provider");
    assert.equal(budgetStatus(h), undefined);
});

test("budget status refreshes after each provider response", async (t) => {
    mockAdminBalance(t, 50);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
    });
    await h.start();
    await h.selectModel();
    assert.match(budgetStatus(h)!, /38;5;28/); // green: 50 ≥ 40
    await h.afterResponse({ "x-ratelimit-remaining-tokens": "800", "x-ratelimit-limit-tokens": "1000" });
    assert.match(budgetStatus(h)!, /38;5;28/);
    await flushAsync(); // allow the fire-and-forget balance refresh to settle
});

test("deprecated adminToken config warns once per session and still shows the balance", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
    });
    await h.start();
    await h.start(); // warned once per process, not per session_start
    const deprecationWarnings = h.notifications.filter((n) => n.level === "warning" && /deprecated/.test(n.message));
    assert.equal(deprecationWarnings.length, 1);
    assert.match(deprecationWarnings[0]!.message, /removed in a future release/);
    assert.match(deprecationWarnings[0]!.message, /system access key/i);
    await h.selectModel();
    assert.match(budgetStatus(h)!, /\$30\.00/); // legacy config still works
});

test("deprecated adminToken config warns on stderr when headless", async (t) => {
    mockAdminBalance(t, 30);
    const h = await harness(t, true, false, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", adminToken: "tok", userId: 7 } }),
    });
    await h.start();
    assert.equal(h.notifications.length, 0);
    assert.match(String(h.warnings[0]), /deprecated/);
});

test("system access key config does not warn and needs no userId header", async (t) => {
    const requests: { url: string; headers: Headers }[] = [];
    t.mock.method(globalThis, "fetch", async (input: unknown, init?: RequestInit): Promise<Response> => {
        const url = String(input);
        if (url === "https://api.mixroute.ai/api/user/self") {
            requests.push({ url, headers: new Headers(init?.headers) });
            return Response.json({ success: true, data: { quota: 30 * 500_000 } });
        }
        throw new Error(`Unexpected URL: ${url}`);
    });
    const h = await harness(t, true, true, {
        authJson: JSON.stringify({ mixroute: { type: "api_key", key: "k", systemAccessKey: "sys-key" } }),
    });
    await h.start();
    assert.equal(h.notifications.filter((n) => n.level === "warning").length, 0);
    await h.selectModel();
    assert.match(budgetStatus(h)!, /\$30\.00/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0]!.headers.get("authorization"), "Bearer sys-key");
    assert.equal(requests[0]!.headers.get("New-Api-User"), null);
});
