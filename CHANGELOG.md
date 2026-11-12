# Changelog

All notable changes to `@varunindiit/create-expo-starter` are documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and
this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.0.0]

Upgrades the scaffolded app to **Expo SDK 58** (React Native 0.88.1, React
19.3.0). Major bump because generated projects need a newer toolchain (Node
≥ 22.13, a current Xcode) and pick up expo-router 58's API changes.

### Changed

- Expo SDK 56 → 58 (via 57): expo-router 58, Reanimated 4.7 / Worklets 0.13,
  Gesture Handler 3, Screens 4.30, Safe Area 5.11, jest-expo 58 / Jest 30.
- Removed `newArchEnabled` from `app.json` (rejected by the SDK 58 schema; the
  New Architecture is the only one).

### Fixed

- Custom tab bar uses expo-router 58's `navigateToTab` API; the auth stack uses
  `unstable_settings.anchor` instead of the removed `initialRouteName`.
- Protected route groups declare `redirectTo`, so signed-out users land on
  `/login` instead of "This screen doesn't exist".
- Tab scenes get an opaque background, so inactive tabs no longer show through
  on web.
- RN 0.87 strict TypeScript API: `OtpInput` uses `TextInputInstance` /
  `TextInputKeyPressEvent`, `useTheme` no longer relies on the removed
  `StyleSheet.NamedStyles`, and the removed `StatusBar` `backgroundColor` /
  `translucent` props are gone.
- Static web export works: MMKV is stubbed during server rendering and a
  localization import cycle is broken.

## [2.0.0]

A full audit pass across delivery, security, correctness and developer
experience. The scaffolded app is a different — and much smaller — starting
point than 1.x, hence the major bump.

### Fixed — release & delivery

- **CI and publish workflows now run at all.** They lived in
  `create-expo-starter/.github/workflows/`, which GitHub never reads; neither
  had ever executed (the repo had zero tags despite a release-triggered publish
  job). Moved to the repository root and given an explicit
  `working-directory`, since the publishable `package.json` is not at the root.
- **The published tarball now contains a LICENSE.** It previously shipped none,
  and the only licence text in the repo carried Expo's copyright (inherited from
  `create-expo-app` and never rewritten) while `package.json` declared MIT.
- **Mona Sans now ships with its SIL OFL 1.1 licence**, as redistribution
  requires. Trimmed from 8 weights to the 4 the app actually uses, halving the
  font payload.
- Added `repository`, `homepage`, `bugs` and `author` metadata.
- CI now fails if `template/` has drifted from the dev app, and the publish job
  refuses to run against a stale template or a missing LICENSE.

### Fixed — scaffolding correctness

- **Dependency installation works on Windows.** `spawnSync` ran without a shell,
  and since Node's CVE-2024-27980 fix a `.cmd` shim (`npm.cmd`, `yarn.cmd`, …)
  cannot be spawned that way — every Windows install failed with EINVAL.
- **Project names can no longer corrupt `app.json`.** Values are JSON-escaped
  when written into JSON files, substitution uses a replacer function so `$&`
  and `$1` in a name are inserted literally, and display names are validated up
  front. `My "Cool" App` previously produced an unparseable `app.json`.
- **Removed the blanket `my-app` / `myapp` find-and-replace.** It rewrote any
  legitimate occurrence of those substrings anywhere in the tree. Only explicit
  `__APP_*__` placeholders are substituted now, and the sync script fails the
  build if a dev-app identity string survives into the template.
- `--help` advertises the real (scoped) package name instead of an unpublished
  unscoped one.
- Non-TTY invocations no longer block on prompts.
- `defaultBundleId` no longer produces identifiers whose final segment starts
  with a digit, which Android rejects at native build time.

### Fixed — the generated app

- **Sessions survive an app restart.** The login flag was written to storage and
  never read back, so `auth.isLoggedIn` always initialised `false`. The auth
  token was never persisted at all, so the axios interceptor could never attach
  one.
- **A 401 now ends the session.** The old interceptor deleted the token but left
  Redux untouched, stranding the user on an authenticated screen with no
  credentials, issuing 401s forever.
- **A font that fails to load no longer hangs the app** on a blank screen behind
  a hidden splash.
- The root `.gitignore` only ignored `.env*.local`, leaving a real `.env` — the
  one that holds keys — fully committable.

### Added

- **Feature presets** (`minimal` / `standard` / `full`) with per-feature
  overrides. Disabling a feature removes its files, dependencies, Expo config
  plugin, Android permissions and iOS usage strings.
- **`expo-secure-store` for credentials.** MMKV is unencrypted by default and
  remains for preferences; tokens now live in Keychain /
  EncryptedSharedPreferences, with a documented web fallback.
- **Typed `ApiError`** with `kind`, `fieldErrors` and `isRetryable`, plus a
  refresh-token queue that collapses concurrent 401s onto one round-trip.
- **RTK Query** layered over the existing axios instance.
- **Typed Redux hooks** (`useAppDispatch` / `useAppSelector` / `useAppStore`)
  and a listener middleware that owns auth persistence.
- **Light and dark themes.** Palettes are structurally type-checked against each
  other; `makeStyles()` replaces module-scope `StyleSheet.create`.
- **Route-level `ErrorBoundary` and a `+not-found` screen.**
- **Accessibility**: roles, labels and state on every interactive primitive;
  text honours the OS font-size setting, capped at 1.3×.
- **Test infrastructure**: `jest-expo` + React Native Testing Library, with
  exemplar tests covering session persistence, error normalisation, palette
  parity and button behaviour.
- **A lockfile in the template**, so two people scaffolding a week apart get the
  same dependency tree. Dropped automatically when pruning makes it stale.
- **Component gallery route** rendering every primitive against the live theme.
- **Monitoring adapter** (`src/services/monitoring.ts`) — a vendor-free seam
  with documented Sentry wiring.
- CLI: `--dir`, `--pm`, `--dry-run`, and a non-blocking update check.
- CLI test suite: 24 unit tests and 37 scaffold smoke tests, including a
  dangling-import check that proves feature pruning never breaks the tree.
- Project scripts: `verify`, `typecheck`, `test`, `doctor`, `deps:check`.
- Dependabot config, issue templates, `CONTRIBUTING.md`, and
  `docs/google-places-proxy.md`.

### Changed

- **The template is no longer a ride-hailing app.** Removed the `ride`, `trip`,
  `chat`, `ratings`, `earnings` and `cards` slices; the SOS, trip-card,
  route-dots, passenger-picker and card-brand components; the seeded fake user
  ("Justin Watson", vehicles, driver verification); and permission strings that
  told App Store reviewers the app was for booking rides.
- **Google Places calls route through your backend by default.** A client-side
  key for the Places/Geocoding *web services* cannot be restricted to an app —
  only by IP — so it is extractable and billable by anyone. Direct mode is an
  opt-in prototyping flag that throws in production builds.
- Migrated from the legacy Places endpoints, which Google no longer enables for
  new Cloud projects, to **Places API (New)**.
- All cross-module imports use the `@/*` alias, enforced by ESLint. The alias
  was previously declared and used zero times against 73 `../../` imports.
- `RNText` respects OS font scaling by default (was hard-disabled).

### Removed

- Four unused Mona Sans weights (Light, Italic, ExtraBold, Black).
- `getDirections` / `getRouteAlternatives` / `decodePolyline` from the places
  service — routing helpers for a domain the starter no longer models.
- The redundant `.npmignore` (the `files` field already governs the tarball).

## [1.1.0]

- Stripped dead code and assets, fixed config leaks, added lint + sync tooling.

## [1.0.0]

- Initial release.
