import assert from "node:assert/strict";
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
async function harness(t: TestContext, offline = false, hasUI = true) {
    const directory = await temporaryDirectory(t);
    const originalDir = process.env.PI_CODING_AGENT_DIR;
    const originalOffline = process.env.PI_OFFLINE;
    process.env.PI_CODING_AGENT_DIR = join(directory, "agent");
    process.env.PI_OFFLINE = offline ? "1" : "0";
    t.after(() => {
        if (originalDir === undefined) delete process.env.PI_CODING_AGENT_DIR;
        else process.env.PI_CODING_AGENT_DIR = originalDir;
        if (originalOffline === undefined) delete process.env.PI_OFFLINE;
        else process.env.PI_OFFLINE = originalOffline;
    });
    const handlers = new Map<string, Handler>();
    const commands = new Map<string, RegisteredCommand>();
    const registrations: ProviderConfig[] = [];
    const notifications: { message: string; level: string }[] = [];
    const warnings: unknown[][] = [];
    t.mock.method(console, "warn", (...args: unknown[]) => {
        warnings.push(args);
    });
    const getKey = t.mock.fn(async (): Promise<string | undefined> => "test-key");
    const context = {
        hasUI,
        modelRegistry: { getApiKeyForProvider: getKey },
        ui: {
            notify: (message: string, level: string) => {
                notifications.push({ message, level });
            },
            setStatus: (_key: string, _text: string | undefined) => {
                // no-op in tests; budget status is a UI-only concern
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
        getKey,
        pi,
        start: () => handlers.get("session_start")!({}, context),
        shutdown: () => handlers.get("session_shutdown")!({}, context),
        refresh: () => commands.get("mixroute-refresh")!.handler("", context),
    };
}

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
