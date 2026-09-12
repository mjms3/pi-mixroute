# pi-mixroute

A [pi](https://pi.dev) provider extension for [MixRoute](https://api.mixroute.ai).
It discovers MixRoute models, enriches their limits and estimated prices from
[models.dev](https://models.dev) and [OpenRouter](https://openrouter.ai), and uses
pi's built-in Chat Completions, Responses, and Anthropic Messages transports.

Requires **pi 0.85.1 or later** and **Node.js 22.19.0 or later**. Development and
request-contract tests are pinned to pi 0.85.1; older `@mariozechner/*` releases are
not supported. No build step or third-party runtime dependencies are required.

## Install

From a local checkout (works before publication):

```bash
pi install /absolute/path/to/pi-mixroute
# Or try it for one run without installing:
pi -e /absolute/path/to/pi-mixroute
```

Once this repository/package has been published:

```bash
pi install git:github.com/mjms3/pi-mixroute
# Or, after the npm release:
pi install npm:pi-mixroute
```

Pi packages execute with your user permissions. Review the source before installing.

## Authenticate and select a model

Inside pi, run `/login mixroute` and choose **Use an API key**, then select a model
with `/model`. Alternatively, set the environment variable before starting pi:

```bash
export MIXROUTE_API_KEY='your-key'
pi
```

Stored pi credentials take precedence over the environment fallback. For manual
configuration, merge this entry into `~/.pi/agent/auth.json` (do not replace your
other credentials):

```json
{
  "mixroute": { "type": "api_key", "key": "your-key" }
}
```

After first login, run `/mixroute-refresh` to discover account-specific models.
Existing `mixroute` entries in `models.json` compose above this extension and take
precedence for models they define.

## Catalog discovery and offline behavior

- The extension registers the disk cache, or a bundled snapshot, before startup
  finishes. Startup and `pi --list-models` do not wait for network discovery.
- On the first `session_start`, a background refresh fetches MixRoute's
  authenticated `/v1/models` list and the two public metadata catalogs in parallel.
- Each attempt has a 10-second deadline. Transient failures get one retry after
  one second; authentication errors do not. Session shutdown cancels in-flight work.
- MixRoute is authoritative for membership and advertised endpoints. models.dev is
  preferred for metadata, with OpenRouter filling missing fields. If either
  metadata service fails or returns malformed data, missing fields fall back to
  the last cache and then defaults. Removed models are not restored from cache.
- If MixRoute is unavailable or there is no key, the cache is used; otherwise the
  bundled snapshot is used. Empty or invalid live catalogs never replace a good cache.
- Successful discovery is cached atomically at `~/.pi/agent/mixroute-models.json`.
  `PI_CODING_AGENT_DIR` changes the agent directory. The cache contains model
  metadata, **not credentials**, and has no expiration; it may be stale offline.

`/mixroute-refresh` explicitly refreshes the catalog and reports its source and any
warnings. Concurrent refreshes share one request. `PI_OFFLINE=1` disables automatic
startup refresh, **not** this explicit command or model inference. To refresh the
catalog used by `--list-models`, run the command in a session first.

Discovery sends your key only to MixRoute. models.dev and OpenRouter receive public
catalog GETs without credentials or conversation content, but see your IP address.
Inference sends prompts, tool definitions/results, and any attached images to
MixRoute and its selected upstream. This extension adds no telemetry.

## Compatibility and limitations

Claude routes use native Anthropic Messages when advertised (base URL without
`/v1`), enabling native thinking and prompt caching. Known adaptive generations get
`forceAdaptiveThinking` and their supported extended effort levels; legacy and
unknown generations do not get speculative adaptive settings. The Bedrock-incompatible
per-tool `eager_input_streaming` field is disabled.

GPT-5.6 and GPT-6 Astra use Responses to avoid MixRoute's Chat Completions rejection
of function tools combined with reasoning effort. Other chat routes use conservative
settings: `system` instead of `developer`, `max_tokens`, and no store, strict, or
generic reasoning-effort fields. Kimi K3 gets its model-specific reasoning replay
and deferred-tool controls. pi handles stream decoding, tool calls, usage, and aborts.

Non-chat routes are filtered by advertised endpoints and ID patterns. The manual
[denylist](model-policy.ts) retains routes that failed earlier smoke tests. Those
results are observations, not permanent provider guarantees: availability may depend
on the account or change upstream. A likely compatibility fix alone does not remove
an entry; retest a tool round-trip first.

Metadata is **estimated**, not a guarantee of MixRoute's limits, capabilities, or
billing. Unknown models default to a 131072-token context window and 4096 output
tokens. Declared output is capped at 32768 and at the context window to leave some
headroom for prompt-estimation errors. These guesses can still cause upstream
errors; override inaccurate metadata in pi's `models.json`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Models missing from `/model` | Authenticate, then run `/mixroute-refresh`. `--list-models` alone does not discover new models. |
| HTTP 401/403 | Check the key and account permissions. Stored credentials override `MIXROUTE_API_KEY`. |
| Cached/bundled catalog warning | Check network access to the three catalog services. Existing models remain available. |
| A route is absent | Check `model-policy.ts` and its advertised text endpoints; manual `models.json` entries can override filtering. |
| Cache appears corrupt | Remove only `mixroute-models.json`, then refresh. Do not delete `auth.json`. |
| Context/limit errors | Correct `contextWindow`/`maxTokens` through `models.json`; enrichment catalogs may describe a different upstream. |

## Development

```bash
npm ci --ignore-scripts
npm run check
```

`check` runs Biome lint/format checks, strict TypeScript, offline `node:test` tests
with coverage thresholds, and a real npm tarball/isolated pi CLI loading check.
Tests never use your credentials or make paid model calls. `npm run format` applies
formatting and safe lint fixes. Coverage is written to `coverage/`.

Regenerate the bundled snapshot explicitly:

```bash
MIXROUTE_API_KEY='your-key' npm run generate
```

Generation uses a disposable cache and refuses to overwrite the snapshot if either
metadata service fails. Review the diff; do not regenerate automatically in CI.
Do not pass credentials as command-line arguments.

### Optional live smoke test (paid)

```bash
MIXROUTE_API_KEY='your-key' SMOKE_MODELS='kimi-k3' npm run smoke
# Explicitly test the whole registered snapshot (can be expensive):
MIXROUTE_API_KEY='your-key' SMOKE_ALL=1 npm run smoke
```

The smoke runner uses isolated pi settings, disables built-in tools and other
extensions/skills, and requires a harmless echo-tool round-trip followed by `OK`.
It never reads your `auth.json`. It uses the bundled catalog, not live discovery;
regenerate first if you want to test newly added routes. Set
`SMOKE_INCLUDE_DENIED=1` to reintroduce denied models present in the snapshot for
retesting. This does **not** validate every built-in tool schema, images, long
contexts, or every reasoning level.

`SMOKE_CONCURRENCY` defaults to 2, `SMOKE_TIMEOUT_MS` to 90000, and `SMOKE_OUTPUT_DIR`
to `smoke-results/`. Results contain raw model output and errors; treat them as
sensitive even though the supplied key is redacted. They are ignored by git and
excluded from the npm package. Live smoke tests never run in GitHub Actions.

See [CONTRIBUTING.md](https://github.com/mjms3/pi-mixroute/blob/main/CONTRIBUTING.md)
for development/release checks and
[docs/REVIEW.md](https://github.com/mjms3/pi-mixroute/blob/main/docs/REVIEW.md)
for the provider comparison and remaining checks.

## License and attribution

[MIT](LICENSE). Discovery, caching, and compatibility code was adapted from
[pi-tokenrouter](https://github.com/liaowang11/pi-tokenrouter); its copyright notice
is preserved in `LICENSE` and [NOTICE](NOTICE). This is an independent integration,
not an official MixRoute package.
