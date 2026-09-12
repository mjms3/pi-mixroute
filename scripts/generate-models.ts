/** Regenerate the bundled snapshot. Requires MIXROUTE_API_KEY; never uses user caches. */
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadMixRouteModels } from "../model-loader.ts";

const apiKey = process.env.MIXROUTE_API_KEY;
if (!apiKey?.trim())
    throw new Error("Set MIXROUTE_API_KEY before running npm run generate (do not pass secrets as arguments)");
if (process.argv.length > 2) throw new Error("This command takes no arguments; use MIXROUTE_API_KEY");

const directory = await mkdtemp(join(tmpdir(), "pi-mixroute-generate-"));
try {
    const result = await loadMixRouteModels({
        apiKey,
        cachePath: join(directory, "catalog.json"),
        bundledModels: [],
    });
    // Never silently replace good metadata with defaults after a partial outage.
    if (result.source !== "live" || result.warning) {
        throw new Error(`Refusing to generate an incomplete snapshot: ${result.warning ?? result.source}`);
    }
    const target = fileURLToPath(new URL("../models.generated.ts", import.meta.url));
    const body = `import type { MixRouteProviderModel } from "./provider-config.ts";

// First-run fallback before the runtime-discovered catalog is cached; regenerated with scripts/generate-models.ts.
// Generated on ${new Date().toISOString()}.
export const MIXROUTE_MODELS: MixRouteProviderModel[] = ${JSON.stringify(result.models, null, 4)};
`;
    await writeFile(target, body, "utf8");
    console.log(`Wrote ${result.models.length} models to ${target}`);
} finally {
    await rm(directory, { recursive: true, force: true });
}
