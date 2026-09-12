/** Check the real npm tarball and load it through pi, outside this checkout and without dev dependencies. */
import assert from "node:assert/strict";
import { execFile } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { promisify } from "node:util";
import ts from "typescript";

const exec = promisify(execFile);
const root = fileURLToPath(new URL("../", import.meta.url));
const expected = [
    "LICENSE",
    "NOTICE",
    "README.md",
    "package.json",
    "index.ts",
    "catalog-validation.ts",
    "known-model-overrides.ts",
    "model-catalog.ts",
    "model-loader.ts",
    "model-policy.ts",
    "models.generated.ts",
    "provider-config.ts",
].sort();
const directory = await mkdtemp(join(tmpdir(), "pi-mixroute-package-"));
try {
    const { stdout } = await exec("npm", ["pack", "--json", "--ignore-scripts", "--pack-destination", directory], {
        cwd: root,
    });
    const packed = JSON.parse(stdout) as { filename: string; files: { path: string }[] }[];
    assert.equal(packed.length, 1);
    assert.deepEqual(packed[0]!.files.map((file) => file.path).sort(), expected, "Unexpected package contents");
    const installed = join(directory, "node_modules", "pi-mixroute");
    await mkdir(installed, { recursive: true });
    await exec("tar", ["-xzf", join(directory, packed[0]!.filename), "--strip-components=1", "-C", installed]);
    const manifestPath = join(installed, "package.json");
    const manifest = JSON.parse(await readFile(manifestPath, "utf8")) as {
        keywords: string[];
        pi: { extensions: string[] };
        dependencies?: object;
        peerDependencies: Record<string, string>;
        peerDependenciesMeta: Record<string, { optional: boolean }>;
        scripts: Record<string, string>;
    };
    assert.ok(manifest.keywords.includes("pi-package"));
    assert.deepEqual(manifest.pi.extensions, ["./index.ts"]);
    assert.equal(Object.keys(manifest.dependencies ?? {}).length, 0);
    for (const peer of ["@earendil-works/pi-ai", "@earendil-works/pi-coding-agent"]) {
        assert.equal(manifest.peerDependencies[peer], "*");
        assert.equal(manifest.peerDependenciesMeta[peer]?.optional, true);
    }
    for (const hook of ["preinstall", "install", "postinstall", "prepare"])
        assert.equal(manifest.scripts[hook], undefined);
    for (const file of expected.filter((name) => name.endsWith(".ts"))) {
        const source = ts.createSourceFile(file, await readFile(join(installed, file), "utf8"), ts.ScriptTarget.Latest);
        for (const statement of source.statements) {
            if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
            const specifier = statement.moduleSpecifier.text;
            if (specifier.startsWith("./"))
                assert.ok(expected.includes(specifier.slice(2)), `${file} imports unpacked ${specifier}`);
            else
                assert.ok(
                    specifier.startsWith("node:") || Object.hasOwn(manifest.peerDependencies, specifier),
                    `Undeclared import: ${specifier}`,
                );
        }
    }
    const piBin = join(root, "node_modules", "@earendil-works", "pi-coding-agent", "dist", "bundle", "cli.js");
    const env = {
        PATH: process.env.PATH,
        HOME: directory,
        USERPROFILE: directory,
        TMPDIR: directory,
        PI_CODING_AGENT_DIR: join(directory, "agent"),
        PI_OFFLINE: "1",
        PI_TELEMETRY: "0",
        MIXROUTE_API_KEY: "not-a-real-key",
        NO_COLOR: "1",
    };
    const args = [piBin, "--no-extensions", "-e", installed, "--list-models", "mixroute"];
    const listed = await exec(process.execPath, args, {
        cwd: directory,
        env,
        timeout: 45_000,
        maxBuffer: 8 * 1024 * 1024,
    });
    assert.match(listed.stdout, /mixroute\s+/, listed.stderr);
    assert.doesNotMatch(listed.stderr, /failed to load|extension error/i);
    // Negative control: a missing manifest entrypoint must not pass using a global install/cache.
    manifest.pi.extensions = ["./missing.ts"];
    await writeFile(manifestPath, JSON.stringify(manifest));
    const missing = await exec(process.execPath, args, { cwd: directory, env, timeout: 45_000 });
    assert.doesNotMatch(missing.stdout, /mixroute\s+/);
    console.log(
        `Package verified: ${expected.length} files; isolated pi CLI loaded the tarball with no package-local node_modules.`,
    );
} finally {
    await rm(directory, { recursive: true, force: true });
}
