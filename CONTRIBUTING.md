# Contributing

Use Node.js 22.19.0+ and npm. The supported pi baseline is pinned in
`devDependencies`; update both pi packages together and rerun the checks.

```bash
npm ci --ignore-scripts
npm run check
```

## Checks

- `npm run lint`: Biome recommended rules, type-only imports, no explicit `any`,
  no unused imports/variables, and formatting. Non-null assertions are allowed
  for regex captures and test fixtures; TypeScript also enables
  `noUncheckedIndexedAccess`, unused checks, and switch fallthrough checks.
- `npm run typecheck`: checks runtime code, scripts, and tests.
- `npm test`: Node's test runner through tsx, using fake HTTP responses and temp
  directories. Serializer tests stop before HTTP. No provider key is required.
- `npm run test:coverage`: c8 coverage of handwritten runtime code, with minimums
  of 90% lines/functions and 80% branches. Generated data is excluded, but its
  shape is checked by tests.
- `npm run check:package`: builds an actual npm tarball with lifecycle scripts
  disabled, checks its file/import allowlist, extracts it outside the checkout,
  and invokes pi's CLI with isolated configuration and a fake key. Also runs a
  missing-entrypoint negative control. Requires `tar` (Linux/macOS CI supplies it).
- `npm run format`: formatting and safe Biome fixes. Generated data and lockfiles
  are not reformatted.

The test and package checks do not use real credentials, edit personal pi
settings, or call external model APIs. Dependency installation/auditing still
requires the npm registry. Do not add paid smoke tests to the default checks.

## Provider changes

Add a regression test for routing, parsing, retry, or cache changes. Keep unknown
JSON at the validation boundary and reconstruct only supported fields. Never
persist credentials or accept remote/cache-provided base URLs and headers.

Keep live catalog membership separate from fallback metadata. A metadata-service
outage should degrade enrichment, not hide newly available models. Cancellation
must propagate rather than triggering another retry or a fallback registration.

Use pi's built-in transports and documented `compat` flags instead of copying
stream implementations. When adding a workaround, state the observed failure
and model family; do not enable unverified capabilities for all future models.

Only change the denylist after an explicit live retest. Account-specific access
errors are not universal model limitations. Record the pi version, model ID,
endpoint, date, request shape, and sanitized error in the review/PR description.
Never commit raw smoke results or keys. Use `SMOKE_INCLUDE_DENIED=1` to retest
blocked routes that remain in the bundled snapshot.

## Before release or registry submission

1. Confirm the destination `pi-packages` repository URL and read its current
   contribution rules. There are multiple unrelated repositories with that name.
2. Verify ownership/existence of `github.com/maxs/pi-mixroute`, the npm package
   name, and the metadata links. Initialize this package as its own Git
   repository before publishing it; `.github/workflows` must be at the repository
   root. Do not initialize Git in the parent directory containing sibling projects.
3. Review the MIT attribution in `LICENSE` and `NOTICE` and the source-only npm
   file allowlist. Confirm any metadata redistribution obligations with the
   catalog services; upstream metadata is not a promise of MixRoute pricing.
4. Run a clean `npm ci --ignore-scripts`, `npm run check`, and `npm audit`.
   Require the Node 22.19.0/24 Linux and Node 24 macOS CI jobs to pass.
5. With explicit budget approval, regenerate the snapshot and run a small live
   smoke for each transport. Check login and model selection in pi manually.
   Expand to a whole-catalog smoke only when its cost is acceptable.
6. Review `npm pack --dry-run --ignore-scripts` and keep package/lockfile versions
   in sync. `prepublishOnly` runs the full offline checks before a manual publish.
7. Publish/tag only when ready, verify installation from the published artifact,
   then prepare the destination repository's requested entry/PR.

No automated publication or registry submission workflow is included. Opening
this repository's CI cannot publish a package, create a release, or spend model credits.
