// Dynamic Expo config — extends app.json and injects environment values.
// https://docs.expo.dev/versions/v58.0.0/config/app/
//
// Static identity (name, slug, scheme, icons, plugins) lives in app.json and is
// passed in here as `config`. Anything environment-driven is layered on top.
//
// Two layers of configuration (see .env.example):
//   1. EXPO_PUBLIC_* vars are inlined into the JS bundle automatically by Expo
//      and read directly via process.env in app code. Use for client-safe
//      values (public API base URL, publishable keys).
//   2. Values placed on `extra` below are embedded at build time and read via
//      expo-constants (see src/services/Config.ts).
//
// Neither layer is a secret store — both ship inside the bundle. Inject values
// through EAS env/secrets so they differ per environment, not so they stay
// hidden from whoever downloads the app.

const APP_ENV = process.env.APP_ENV ?? "development";

module.exports = ({ config }) => ({
  ...config,
  extra: {
    ...(config.extra ?? {}),
    appEnv: APP_ENV,
    apiUrl:
      process.env.API_URL ?? config.extra?.apiUrl ?? "https://api.example.com",
    placesProxyPath:
      process.env.PLACES_PROXY_PATH ?? config.extra?.placesProxyPath ?? "/places",
    googleMapsApiKey:
      process.env.GOOGLE_MAPS_API_KEY ?? config.extra?.googleMapsApiKey ?? "",
    sentryDsn: process.env.SENTRY_DSN ?? config.extra?.sentryDsn ?? "",
    eas: {
      ...(config.extra?.eas ?? {}),
      projectId: process.env.EAS_PROJECT_ID ?? config.extra?.eas?.projectId,
    },
  },
});
