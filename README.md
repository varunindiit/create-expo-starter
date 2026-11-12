# create-expo-starter (development repo)

[![CI](https://github.com/varunindiit/create-expo-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/varunindiit/create-expo-starter/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/v/@varunindiit/create-expo-starter)](https://www.npmjs.com/package/@varunindiit/create-expo-starter)

This repository contains two things:

1. **The dev app** (repo root) — a runnable Expo SDK 58 app where all template
   code lives and is developed, type-checked, linted and tested.
2. **The published CLI** — [`create-expo-starter/`](create-expo-starter/), the
   npm package (`@varunindiit/create-expo-starter`) that scaffolds new projects
   from a bundled copy of this app.

Using the CLI? See [its README](create-expo-starter/README.md).
Contributing? See [CONTRIBUTING.md](CONTRIBUTING.md).

```
.
├── src/                     # dev app source — the single source of truth
├── assets/                  # app icons / splash
├── docs/                    # supporting guides
├── scripts/
│   ├── sync-template.mjs    # mirrors the dev app into the CLI template
│   └── reset-project.js     # blank-slate helper (shipped with the template)
└── create-expo-starter/     # the npm package
    ├── bin/ lib/            # CLI (zero runtime dependencies)
    ├── scripts/             # unit + smoke tests
    └── template/            # scaffolded output — generated, do not edit by hand
```

## Development workflow

```bash
npm install
npm start                 # develop and test in the root app (i / a / w)
npm run verify            # typecheck + lint + unit tests

npm run sync-template     # mirror src/, assets/ and configs into the template
cd create-expo-starter
npm run test:all          # CLI lint + unit tests + scaffold smoke tests
```

**Always edit template code in the root app, then run `npm run sync-template`.**
The sync preserves the template's `__APP_*__` identity placeholders and
template-only files (`app.config.js`, `env.example`, `eas.json`, `_gitignore`,
`stubs/`, README, LICENSE), regenerates the bundled lockfile, and fails if a
dev-app identity string would leak into generated projects. CI asserts the sync
is a no-op, so a hand-edited template can never reach npm.

## Testing the CLI end-to-end

```bash
node create-expo-starter/bin/index.js my-test-app --preset full -y --no-install --no-git
```

The real check — what CI runs for every preset — is that the generated project
installs and passes its own verification:

```bash
node create-expo-starter/bin/index.js /tmp/probe --preset full -y --no-git
cd /tmp/probe && npm install && npm run verify
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run verify` | typecheck + lint + tests (the pre-commit check) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | Jest (jest-expo + React Native Testing Library) |
| `npm run lint` | ESLint via `expo lint` |
| `npm run doctor` | `expo-doctor` — dependency and config health |
| `npm run deps:check` | `expo install --check` — SDK compatibility |
| `npm run sync-template` | regenerate `create-expo-starter/template/` |

## Documentation

- [CLI usage and features](create-expo-starter/README.md)
- [Contributing](CONTRIBUTING.md)
- [Changelog](CHANGELOG.md)
- [Proxying Google Places & geocoding](docs/google-places-proxy.md)

## Publishing

1. Bump the version in `create-expo-starter/package.json`.
2. Update [CHANGELOG.md](CHANGELOG.md).
3. `npm run sync-template` and commit.
4. Create a GitHub Release whose tag matches the version (e.g. `v2.0.0`).

The [publish workflow](.github/workflows/publish.yml) verifies the tag, template
sync, LICENSE presence and test suite before publishing with npm provenance.

> Built for Expo SDK 58 — review https://docs.expo.dev/versions/v58.0.0/ before
> changing app code or upgrading dependencies.

## License

MIT — see [LICENSE](LICENSE).
