# __APP_DISPLAY_NAME__

An [Expo](https://expo.dev) (SDK 58) app scaffolded with
[`create-expo-starter`](https://www.npmjs.com/package/@varunindiit/create-expo-starter).

## Get started

```bash
npm install        # if you skipped it during scaffolding
npm start          # then press i (iOS), a (Android) or w (web)
npm run verify     # typecheck + lint + tests
```

Environment values live in `.env` (seeded from `.env.example` for you). Edit it
to point at your API — see `src/services/Config.ts` for how values resolve
(`EXPO_PUBLIC_*` → `expo.extra` → fallbacks).

> Neither layer is a secret store: both are inlined into the JS bundle that
> ships to devices. Keys that can be billed, or that grant write access, belong
> behind an endpoint on a server you control.

## Project structure

```
src/
├── app/             # expo-router routes (file-based navigation)
│   ├── _layout.tsx  #   providers, fonts, ErrorBoundary, auth guard
│   ├── +not-found.tsx
│   ├── (auth)/      #   login flow — mounted while logged out
│   └── (tabs)/      #   bottom-tab app — mounted while logged in
├── components/      # reusable UI (Button, Input, sheets, pickers, …)
├── redux/           # store, typed hooks, listener middleware, slices
├── services/        # axios + ApiError, RTK Query, Config, storage, monitoring
├── theme/           # light/dark palettes, spacing, fonts, makeStyles()
├── localization/    # i18next setup + typed resources
├── hooks/           # shared hooks
└── utils/           # constants + helpers
```

## How things work

### Auth

`src/redux/slice/auth.ts` rehydrates the session synchronously at boot from the
OS keystore, so there is no auth flash. Dispatch `signedIn({ token })` and the
listener in `src/redux/listeners.ts` persists it; the `Stack.Protected` guard in
`src/app/_layout.tsx` swaps the navigator over. A 401 that survives a token
refresh dispatches `signedOut()` automatically.

Replace `fakeSignIn` in `src/app/(auth)/login.tsx` with your real call.

### Data fetching

- **Server state** → RTK Query. Add endpoints with
  `apiSlice.injectEndpoints(...)` from a feature file.
- **Client state** → a Redux slice.

Both run through the same axios instance, so they share the auth header, the
refresh-token retry and the `ApiError` shape.

```ts
try {
  await api.post("/things", body);
} catch (error) {
  const e = toApiError(error);
  if (e.kind === "validation") setFieldErrors(e.fieldErrors);
  else showToast(e.message, "danger");
}
```

### Theming

Never import a palette directly — colours come from the hook so they follow the
device appearance and the in-app override:

```tsx
const { colors, isDark } = useTheme();

const useStyles = makeStyles((c) => ({
  card: { backgroundColor: c.surface, borderColor: c.border },
}));
```

Both palettes in `src/theme/palette.ts` must define the same tokens; TypeScript
enforces it.

### Adding a tab

1. Create `src/app/(tabs)/<name>.tsx`.
2. Add `<Tabs.Screen name="<name>" options={{ title: "…" }} />` to
   `src/app/(tabs)/_layout.tsx`.
3. Map an icon in `TAB_ICONS` in `src/components/BottomTabBar/index.tsx`.

## Testing

```bash
npm test              # watch-free run
npm run test:watch
npm run test:coverage
```

Uses `jest-expo` and React Native Testing Library. Note that `render` is **async**
in RNTL v14 and must be awaited.

## Native builds (EAS)

`eas.json` ships with `development` / `preview` / `production` profiles wired to
`APP_ENV`:

```bash
npx eas-cli init
eas build --profile development
```

## Health checks

```bash
npm run doctor        # expo-doctor
npm run deps:check    # expo install --check
```

## Start from a blank slate

```bash
npm run reset-project
```

Moves the starter code to `example/` (or deletes it) and leaves a minimal
`src/app` to build on.

## Learn more

- [Expo SDK 58 docs](https://docs.expo.dev/versions/v58.0.0/)
- [expo-router file-based routing](https://docs.expo.dev/router/introduction/)
- [Redux Toolkit / RTK Query](https://redux-toolkit.js.org/rtk-query/overview)
- [EAS Build](https://docs.expo.dev/build/introduction/)

## License

MIT — see [LICENSE](./LICENSE). The bundled Mona Sans typeface is licensed
separately under the SIL Open Font License 1.1
(`src/assets/fonts/OFL.txt`).
