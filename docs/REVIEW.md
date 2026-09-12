# Package review and provider comparison

Reviewed against pi **0.85.1** documentation and the following public packages:

| Reference | Relevant patterns | Decision for pi-mixroute |
| --- | --- | --- |
| [pi-tokenrouter 1.4.0](https://github.com/liaowang11/pi-tokenrouter) | Source-only manifest, bundled/cache/live catalog, models.dev/OpenRouter enrichment, refresh deduplication, loader tests | Preserve the small design and original MIT attribution; strengthen validation, independent metadata fallback, cancellation, and cache writes. Its older `@mariozechner/*` peer setup is not the current pi packaging convention. |
| [pi-provider-litellm 2.3.0](https://github.com/balcsida/pi-provider-litellm) | Native Provider API, optional host peers, Biome, broad tests, isolated tarball/CLI loading, explicit package-content checks, separate smoke workflows | Adopt optional host peers and offline lint/type/test/tarball checks. Do not copy LiteLLM's enterprise auth/MCP/skills scope or release automation. |
| [pi provider examples](https://github.com/earendil-works/pi/tree/main/packages/coding-agent/examples/extensions) and installed `custom-provider.md`, `models.md`, `packages.md`, `extensions.md` | `pi.extensions`, host-supplied peers, model-level API/compat settings, lifecycle cleanup, source loading through pi | Keep one TypeScript entrypoint, wildcard pi peers per current docs, built-in serializers, and session-scoped cancellation. Test actual pi payload construction as well as config objects. |

The current implementation deliberately retains pi's supported provider-config
registration form. It needs standard API-key auth and three built-in transports,
not a custom stream implementation. Moving discovery to the newer native
`refreshModels`/models-store lifecycle could integrate refresh with pi's model
picker, but would also require a cache migration and new lifecycle tests. That
migration is not required for a valid pi package and is not claimed here.

## Findings addressed

- **Session lifecycle:** cancel fetches/retry delays on shutdown, suppress stale
  notifications/registration, and report genuine registration failures instead
  of swallowing all errors as stale handles.
- **Remote JSON:** validate envelopes/nested structures before mapping. Invalid
  metadata is treated like that service being unavailable, independently of
  MixRoute and the other metadata service.
- **Catalog fidelity:** fix Anthropic-only routing; support older id-only lists;
  deduplicate and sort results; honor explicit false capabilities and free prices;
  reject invalid costs/limits; use cached missing fields during partial outages.
- **Cache safety:** reject unusable/duplicate/invalid cached models, strip URLs
  and auth fields, use unique exclusive temporary files and atomic rename, and
  retain live models when only persistence fails.
- **Network behavior:** bounded attempts, cancellable retry, no retry for permanent
  HTTP auth errors, no credential forwarding to metadata hosts or redirects,
  and no remote error-body logging.
- **Provider policy:** avoid inherited-object denylist matches and speculative
  adaptive Claude levels. Disable Bedrock-incompatible eager tool fields without
  prematurely declaring historically denied routes recovered.
- **Developer tooling:** replace ad hoc assertions with named tests, include
  serializer contracts and lifecycle/cache failure paths, add coverage gates,
  strict TypeScript and Biome, and verify real tarball loading in isolated pi.
- **Release hygiene:** explicit Node baseline, optional host peers, license
  attribution, package allowlist, clean installs, pinned read-only CI actions,
  Dependabot, no publish workflow, and guarded paid smoke commands.

## Local verification

- Clean `npm ci --ignore-scripts` completed successfully.
- `npm run check` passed on Node **24.14.1** and **22.19.0**, with pi **0.85.1**.
- **52 tests passed** on both versions. Handwritten runtime coverage on Node 22:
  **99.9% lines**, **100% functions**, **95.91% branches**.
- The **11-file** real npm tarball loaded through the isolated pi CLI; the
  missing-entrypoint negative control failed to register the provider as expected.
- `npm audit` reported **0 vulnerabilities** at review time.
- The validators also accepted fresh public metadata responses: **213 models.dev
  providers** and **445 OpenRouter models**. These were read-only, unauthenticated
  catalog requests, not model inference.
- GitHub Actions has not run remotely yet; macOS verification remains a CI task.

## Remaining checks / intentional limitations

- The destination **`pi-packages` repository has not been identified**. Current pi
  docs describe npm discovery through the `pi-package` keyword and
  [pi.dev/packages](https://pi.dev/packages), not a unique submission repository.
  This review is not a claim that an unknown repository's acceptance rules pass.
- No package was published, submitted, tagged, or pushed. Repository metadata and
  npm name ownership must be confirmed before release.
- No live inference or snapshot regeneration was performed for this review.
  Existing snapshot and denylist observations remain historical. The safer smoke
  runner must still be exercised against real MixRoute with explicit budget approval.
- The optional smoke proves a harmless tool round-trip only. It does not establish
  image support, long-context accuracy, all built-in tool schemas, every thinking
  level, or provider-wide availability. Catalog metadata and prices are estimates.
- CI is configured for Linux and macOS. Windows behavior has not been validated;
  package-development checks require a `tar` executable.
- The package check intentionally uses the pinned pi CLI's shipped entrypoint;
  update the check if pi changes its distribution layout. pi itself supplies the
  peer modules; package-local dev dependencies are absent in the extracted fixture.

See [CONTRIBUTING.md](../CONTRIBUTING.md) for the release checklist.
