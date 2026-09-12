/**
 * MixRoute Provider Extension
 *
 * Registers MixRoute (https://api.mixroute.ai/v1) as a custom provider.
 * Models are derived from MixRoute's /v1/models list, enriched with metadata
 * from models.dev first and OpenRouter second. The catalog is discovered at
 * startup and cached under the pi agent directory; a bundled snapshot covers
 * the first run before any cache exists. /mixroute-refresh re-runs discovery
 * on demand.
 *
 * Usage:
 *   pi install npm:pi-mixroute        # or: pi -e /path/to/pi-mixroute
 *   /login mixroute
 *   # OR add to ~/.pi/agent/auth.json:
 *   #   "mixroute": { "type": "api_key", "key": "sk-..." }
 *   #   "mixroute": { "type": "api_key", "key": "$MIXROUTE_API_KEY" }
 *   # OR export MIXROUTE_API_KEY=sk-...
 */

import { join } from "node:path";
import { type ExtensionAPI, getAgentDir, type ModelRegistry } from "@earendil-works/pi-coding-agent";
import { type LoadMixRouteModelsResult, loadMixRouteModels, readMixRouteModelsCache } from "./model-loader.ts";
import { filterUnsupportedMixRouteModels } from "./model-policy.ts";
import { MIXROUTE_MODELS } from "./models.generated.ts";
import { createMixRouteProviderConfig, PROVIDER_NAME } from "./provider-config.ts";

export default async function (pi: ExtensionAPI) {
    const cachePath = join(getAgentDir(), "mixroute-models.json");

    // Register immediately so models are available offline and before login;
    // the refresh below replaces them once discovery succeeds. Registration is
    // additive: a provider of the same id configured in models.json still wins
    // for the models it defines, because models.json composes above registered
    // providers.
    const initialModels = filterUnsupportedMixRouteModels(
        await readMixRouteModelsCache(cachePath).catch(() => MIXROUTE_MODELS),
    );
    pi.registerProvider(PROVIDER_NAME, createMixRouteProviderConfig(initialModels));
    let registeredModelsJson = JSON.stringify(initialModels);

    type RefreshResult = LoadMixRouteModelsResult & { changed: boolean };
    let refreshPromise: Promise<RefreshResult> | undefined;
    const lifetime = new AbortController();
    pi.on("session_shutdown", () => {
        lifetime.abort();
    });

    // The compiled pi binary does not re-export AuthStorage, so the API key must
    // come from the model registry handed to event and command contexts. It
    // resolves auth.json credentials first and the $MIXROUTE_API_KEY
    // environment fallback from the provider config second.
    const refresh = (modelRegistry: ModelRegistry): Promise<RefreshResult> => {
        refreshPromise ??= (async () => {
            lifetime.signal.throwIfAborted();
            const apiKey = await modelRegistry.getApiKeyForProvider(PROVIDER_NAME);
            const result = await loadMixRouteModels({
                apiKey,
                cachePath,
                bundledModels: MIXROUTE_MODELS,
                signal: lifetime.signal,
            });
            lifetime.signal.throwIfAborted();
            const modelsJson = JSON.stringify(result.models);
            const changed = modelsJson !== registeredModelsJson;
            if (!changed) return { ...result, changed };
            pi.registerProvider(PROVIDER_NAME, createMixRouteProviderConfig(result.models));
            registeredModelsJson = modelsJson;
            return { ...result, changed };
        })().finally(() => {
            refreshPromise = undefined;
        });
        return refreshPromise;
    };

    // Automatic refresh on harness startup: runs in the background on the first
    // session_start instead of blocking the extension factory, so startup stays
    // fast and works offline (cache/bundled snapshot is already registered).
    let startupRefreshTriggered = false;
    pi.on("session_start", (_event, ctx) => {
        if (startupRefreshTriggered || process.env.PI_OFFLINE === "1") return;
        startupRefreshTriggered = true;
        void refresh(ctx.modelRegistry).then(
            (result) => {
                if (!lifetime.signal.aborted && result.warning) console.warn(`[mixroute] ${result.warning}`);
            },
            (error: unknown) => {
                if (lifetime.signal.aborted) return;
                console.warn(
                    `[mixroute] Model catalog refresh failed: ${error instanceof Error ? error.message : String(error)}`,
                );
            },
        );
    });

    pi.registerCommand("mixroute-refresh", {
        description: "Refresh the MixRoute model catalog",
        handler: async (_args, ctx) => {
            try {
                const result = await refresh(ctx.modelRegistry);
                if (lifetime.signal.aborted) return;
                const summary = `MixRoute model catalog ${result.changed ? "updated" : "unchanged"} (${result.models.length} models from ${result.source}).`;
                const message = result.warning ? `${summary} ${result.warning}` : summary;
                if (ctx.hasUI) ctx.ui.notify(message, result.warning ? "warning" : "info");
                else console.warn(`[mixroute] ${message}`);
            } catch (error) {
                if (lifetime.signal.aborted) return;
                const message = `MixRoute refresh failed: ${error instanceof Error ? error.message : String(error)}`;
                if (ctx.hasUI) ctx.ui.notify(message, "error");
                else console.warn(`[mixroute] ${message}`);
            }
        },
    });
}
