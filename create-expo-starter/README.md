# create-expo-starter

A zero-dependency CLI that scaffolds a **production-ready Expo (SDK 58) app**.
Pick a name, pick a feature set, and you get a renamed project that installs,
type-checks, lints and passes its tests immediately.

```bash
npx @varunindiit/create-expo-starter

# or non-interactively
npx @varunindiit/create-expo-starter my-app --preset full --bundle-id com.acme.app -y
```

## Why this over `create-expo-app`?

`create-expo-app` gives you a correct, empty Expo project — the right starting
point if you want to make every architectural decision yourself. This gives you
the decisions already made, wired together and tested:

| | `create-expo-app` | this |
| --- | --- | --- |
| expo-router + typed routes | ✅ | ✅ |
| Auth flow with **session persistence** | — | ✅ (SecureStore + declarative route guard) |
| API client | — | axios + typed `ApiError` + refresh-token queue |
| Server state | — | RTK Query over the same axios instance |
| Client state | — | Redux Toolkit, typed hooks, listener middleware |
| Light **and dark** theme | — | ✅ (type-enforced palettes) |
| Component library | — | 20+ accessible primitives |
| i18n | — | i18next + typed resources (optional) |
| Tests | — | jest-expo + RNTL, wired and passing |
| CI workflow | — | ✅ in the generated project |

## Presets

| Preset | Includes |
| --- | --- |
| `minimal` | Core shell, auth flow, theme, components, Redux, RTK Query |
| `standard` **(default)** | `minimal` + i18n + component gallery |
| `full` | `standard` + device location, Places/geocoding service |

Override any preset per feature:

```bash
npx @varunindiit/create-expo-starter my-app --preset minimal --location
npx @varunindiit/create-expo-starter my-app --preset full --no-gallery
```

Turning a feature off removes its files, its dependencies, its Expo config
plugin, its Android permissions **and** its iOS usage strings — so you never
ship a permission prompt for a capability the app doesn't use.

## What you get

```
src/
├── app/                 # expo-router routes (file-based navigation)
│   ├── _layout.tsx      #   providers, fonts, ErrorBoundary, auth guard
│   ├── +not-found.tsx   #   404 with a way home
│   ├── (auth)/          #   auth flow — mounted when logged out
│   └── (tabs)/          #   bottom-tab app — mounted when logged in
├── components/          # Button, Input, Text, sheets, pickers, 20+ primitives
├── redux/               # store, typed hooks, listener middleware, slices
├── services/            # axios + ApiError, RTK Query, Config, storage, monitoring
├── theme/               # light/dark palettes, spacing, fonts, makeStyles()
├── localization/        # i18next + typed en/fr resources
├── hooks/               # shared hooks
└── utils/               # constants + helpers
```

### Highlights

- **Auth that survives a restart.** The token lives in the OS keystore
  (`expo-secure-store`); the session is rehydrated synchronously at boot, so
  there is no auth flash and no "logged out every launch" surprise. A 401 that
  survives a token refresh drops the user back to the auth flow automatically.
- **Typed API layer.** Every rejection is an `ApiError` with a `kind`
  (`network` / `timeout` / `validation` / …), a normalised message and parsed
  `fieldErrors` for forms. Concurrent 401s collapse onto a single refresh
  round-trip.
- **RTK Query over the same axios instance**, so cached server state inherits
  the auth header, the refresh retry and the error shape for free.
- **Light and dark themes** whose palettes are type-checked against each other —
  a token added to one and forgotten in the other is a compile error, not an
  invisible transparent colour.
- **Accessible components**: roles, labels, and `busy`/`disabled`/`checked`
  state on every interactive primitive; text honours the OS font-size setting
  with a sane cap.
- **Environment config** via `app.config.js` + `.env`, with a typed `Config`
  and explicit guidance about what is and isn't a secret in a mobile bundle.
- **EAS-ready**: `eas.json` with `development` / `preview` / `production`
  profiles wired to `APP_ENV`.
- **TypeScript strict**, `@/*` path alias enforced by ESLint, `npm run verify`
  runs typecheck + lint + tests.

## Options

| Flag | Description |
| --- | --- |
| `[project-name]` | Project name (positional). Prompted if omitted |
| `--bundle-id <id>` | Reverse-DNS identifier, e.g. `com.acme.app` |
| `--preset <name>` | `minimal` \| `standard` \| `full` |
| `--i18n` / `--no-i18n` | Internationalisation (i18next, en/fr) |
| `--location` / `--no-location` | Device location + Places/geocoding |
| `--gallery` / `--no-gallery` | Component gallery screen |
| `--dir <path>` | Where to create the project (default `./<slug>`) |
| `--pm <manager>` | `npm` \| `yarn` \| `pnpm` \| `bun` |
| `--no-install` | Skip dependency installation |
| `--no-git` | Skip git initialisation |
| `--dry-run` | Print the plan without writing anything |
| `-y, --yes` | Accept all defaults, no prompts |
| `-h, --help` | Show help |
| `-v, --version` | Show version |

Running without a TTY (CI, Docker, a script) never prompts — it takes the
documented defaults.

## After scaffolding

```bash
cd <project-name>
npm install        # if you skipped it
npm start          # then press i / a / w
npm run verify     # typecheck + lint + tests
```

Then edit `.env` to point at your API. See `src/services/Config.ts` for how
values resolve.

## Requirements

Node **>= 20.19.0**. The CLI itself has zero runtime dependencies.

> Built for Expo SDK 58. Review the versioned docs at
> https://docs.expo.dev/versions/v58.0.0/ before upgrading.

## License

MIT — see [LICENSE](./LICENSE). The bundled Mona Sans typeface is licensed
separately under the SIL Open Font License 1.1.
