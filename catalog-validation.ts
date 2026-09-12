/** Validate untrusted catalog JSON before it reaches the mapper. Unknown fields are ignored. */
import type { MixRouteCatalogPayload, ModelsDevPayload, OpenRouterCatalogPayload } from "./model-catalog.ts";

export function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}

function record(value: unknown): Record<string, unknown> {
    if (!isRecord(value)) throw new Error("Expected a catalog object");
    return value;
}

function entries(value: unknown): unknown[] {
    if (!Array.isArray(value)) throw new Error("Expected a catalog data array");
    return value;
}

function optionalRecord(value: unknown): Record<string, unknown> {
    return value === undefined ? {} : record(value);
}

function text(value: unknown): string | undefined {
    return typeof value === "string" && value.trim() ? value : undefined;
}

function strings(value: unknown): string[] | undefined {
    if (value === undefined) return undefined;
    if (!Array.isArray(value) || !value.every((item) => typeof item === "string")) {
        throw new Error("Expected a catalog string array");
    }
    return value;
}

function number(value: unknown): number | undefined {
    return typeof value === "number" && Number.isFinite(value) && value >= 0 ? value : undefined;
}

export function parseMixRouteCatalog(value: unknown): MixRouteCatalogPayload {
    return {
        data: entries(record(value).data).map((entry) => {
            const model = record(entry);
            const id = text(model.id);
            if (!id || id !== id.trim())
                throw new Error("Expected a non-empty model id without surrounding whitespace");
            return { id, supported_endpoint_types: strings(model.supported_endpoint_types) };
        }),
    };
}

export function parseModelsDevCatalog(value: unknown): ModelsDevPayload {
    const providers = record(value);
    return Object.fromEntries(
        Object.entries(providers).map(([id, entry]) => {
            const models = optionalRecord(record(entry).models);
            return [
                id,
                {
                    models: Object.fromEntries(
                        Object.entries(models).map(([modelId, entry]) => {
                            const model = record(entry);
                            const limit = optionalRecord(model.limit);
                            const cost = optionalRecord(model.cost);
                            const modalities = optionalRecord(model.modalities);
                            return [
                                modelId,
                                {
                                    name: text(model.name),
                                    reasoning: typeof model.reasoning === "boolean" ? model.reasoning : undefined,
                                    limit: { context: number(limit.context), output: number(limit.output) },
                                    cost: {
                                        input: number(cost.input),
                                        output: number(cost.output),
                                        cache_read: number(cost.cache_read),
                                        cache_write: number(cost.cache_write),
                                    },
                                    modalities: {
                                        input: strings(modalities.input),
                                        output: strings(modalities.output),
                                    },
                                },
                            ];
                        }),
                    ),
                },
            ];
        }),
    );
}

export function parseOpenRouterCatalog(value: unknown): OpenRouterCatalogPayload {
    return {
        data: entries(record(value).data).map((entry) => {
            const model = record(entry);
            const id = text(model.id);
            if (!id) throw new Error("Expected an OpenRouter model id");
            const architecture = optionalRecord(model.architecture);
            const pricing = optionalRecord(model.pricing);
            const provider = optionalRecord(model.top_provider);
            return {
                id,
                name: text(model.name),
                supported_parameters: strings(model.supported_parameters),
                architecture: {
                    modality: text(architecture.modality),
                    input_modalities: strings(architecture.input_modalities),
                },
                pricing: {
                    prompt: text(pricing.prompt),
                    completion: text(pricing.completion),
                    input_cache_read: text(pricing.input_cache_read),
                    input_cache_write: text(pricing.input_cache_write),
                },
                context_length: number(model.context_length),
                top_provider: { max_completion_tokens: number(provider.max_completion_tokens) },
            };
        }),
    };
}
