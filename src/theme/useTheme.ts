import { useCallback, useMemo, useSyncExternalStore } from "react";
import {
  StyleSheet,
  useColorScheme,
  type ImageStyle,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { storage } from "@/services/storage";
import { THEME_PREFERENCE_KEY } from "@/utils/constants";
import { PALETTES, type ColorSchemeName, type ThemeColors } from "./palette";

/** What the user asked for — not necessarily what is rendered. */
export type ThemePreference = "system" | "light" | "dark";

const isPreference = (v: unknown): v is ThemePreference =>
  v === "system" || v === "light" || v === "dark";

// ── preference store ────────────────────────────────────────────────────────
// A three-line external store rather than a React context: the preference is
// read by hooks all over the tree and changes about once per session, so an
// unconditional context re-render is more machinery than the problem needs.
// `useSyncExternalStore` also gives us a correct server/hydration story on web.

const listeners = new Set<() => void>();

const readPreference = (): ThemePreference => {
  const stored = storage.getString(THEME_PREFERENCE_KEY);
  return isPreference(stored) ? stored : "system";
};

let current: ThemePreference = readPreference();

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

const getSnapshot = () => current;

/** Persist and broadcast a new theme preference. */
export const setThemePreference = (preference: ThemePreference) => {
  current = preference;
  storage.set(THEME_PREFERENCE_KEY, preference);
  listeners.forEach((l) => l());
};

// ── hooks ───────────────────────────────────────────────────────────────────

/** The user's stored preference (`system` unless they picked one). */
export const useThemePreference = (): ThemePreference =>
  useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

/**
 * Full theme state.
 *
 * `scheme` is the resolved appearance actually being rendered — the device
 * scheme when the preference is `system`, otherwise the explicit choice.
 */
export const useTheme = () => {
  const deviceScheme = useColorScheme();
  const preference = useThemePreference();

  const scheme: ColorSchemeName =
    preference === "system" ? (deviceScheme === "dark" ? "dark" : "light") : preference;

  const setPreference = useCallback(
    (next: ThemePreference) => setThemePreference(next),
    [],
  );

  return useMemo(
    () => ({
      colors: PALETTES[scheme],
      scheme,
      isDark: scheme === "dark",
      preference,
      setPreference,
    }),
    [scheme, preference, setPreference],
  );
};

/** Just the colours — the common case. */
export const useThemeColors = (): ThemeColors => useTheme().colors;

/**
 * Build a themed StyleSheet.
 *
 * Replaces the module-scope `StyleSheet.create({...})` pattern, which cannot
 * react to appearance changes because it runs once at import time.
 *
 *   const useStyles = makeStyles((c) => ({
 *     card: { backgroundColor: c.surface },
 *   }));
 *
 *   const Card = () => {
 *     const styles = useStyles();
 *     return <View style={styles.card} />;
 *   };
 *
 * The sheet is memoised per colour scheme, so switching themes rebuilds it
 * once rather than on every render.
 */
// RN 0.87's strict TypeScript API dropped `StyleSheet.NamedStyles`; this is the
// same shape, and it keeps style literals (e.g. `flexDirection: "row"`) narrow.
type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

export const makeStyles =
  <T extends NamedStyles<T>>(factory: (colors: ThemeColors) => T) =>
  (): T => {
    const colors = useThemeColors();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
