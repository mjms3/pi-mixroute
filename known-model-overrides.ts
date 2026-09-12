/**
 * Corrections for catalog metadata known to be inaccurate for MixRoute routes.
 *
 * Keep these overrides narrow and evidence-based: public catalogs describe their
 * own provider routes, which can differ from the route exposed by MixRoute.
 */
import type { MixRouteProviderModel } from "./provider-config.ts";

type KnownModelOverride = Partial<Pick<MixRouteProviderModel, "reasoning" | "input" | "contextWindow" | "maxTokens">>;

export const KNOWN_MODEL_OVERRIDES: Readonly<Record<string, KnownModelOverride>> = {
    // MixRoute rejects image content for this route with `model features vision not support`.
    // The separately advertised `deepseek-v4-flash-vision-exp` route remains image-capable.
    "deepseek-v4-flash": { input: ["text"] },
};

function normalizeModelId(id: string): string {
    return id.toLowerCase().replace(/[._\s:]+/g, "-");
}

/** Apply last-mile corrections after discovery/cache metadata has been resolved. */
export function applyKnownModelOverrides(model: MixRouteProviderModel): MixRouteProviderModel {
    const override = KNOWN_MODEL_OVERRIDES[normalizeModelId(model.id)];
    if (!override) return model;
    return {
        ...model,
        ...override,
        ...(override.input ? { input: [...override.input] } : {}),
    };
}
