import { Platform } from "react-native";
import { createMMKV, type MMKV } from "react-native-mmkv";
import * as SecureStore from "expo-secure-store";

/**
 * Two-tier persistence.
 *
 *  - `storage`        MMKV. Fast, synchronous, *unencrypted*. Use for
 *                     preferences, cached UI state, feature flags.
 *  - `secureStorage`  OS-backed keystore (iOS Keychain / Android
 *                     EncryptedSharedPreferences). Use for tokens and anything
 *                     else that would matter if a device backup leaked.
 *
 * Both expose a synchronous API so callers (notably the axios request
 * interceptor) don't have to become async.
 */
// Static web rendering (`web.output: "static"`) evaluates modules in Node, where
// MMKV's localStorage backend throws. There, every call is a no-op returning
// `undefined`, so module-level reads fall back to their defaults.
const isStaticRender = Platform.OS === "web" && typeof window === "undefined";

export const storage: MMKV = isStaticRender
  ? new Proxy({} as MMKV, { get: () => () => undefined })
  : createMMKV();

// ── general-purpose (unencrypted) ───────────────────────────────────────────

/** Get string */
export const getStorageValue = (KEY: string): string | null => {
  return storage.getString(KEY) ?? null;
};

/** Set string */
export const setStorageValue = (KEY: string, value: string) => {
  storage.set(KEY, value);
};

/** Get boolean */
export const getStorageBoolean = (KEY: string): boolean | undefined => {
  return storage.getBoolean(KEY);
};

/** Set boolean */
export const setStorageBoolean = (KEY: string, value: boolean) => {
  storage.set(KEY, value);
};

/** Clear key */
export const clearStorageValue = (KEY: string) => {
  storage.remove(KEY);
};

/** Clear all stored data (e.g. on logout) */
export const clearAllStorage = () => {
  storage.clearAll();
};

// ── secure (encrypted) ──────────────────────────────────────────────────────

// expo-secure-store has no web implementation. On web we fall back to MMKV,
// which is backed by localStorage — genuinely not secure, but no worse than
// any other browser-side token store. Keep short-lived tokens on web and rely
// on httpOnly cookies if you need real protection there.
const useKeystore = Platform.OS !== "web";

export const secureStorage = {
  get(key: string): string | null {
    if (!useKeystore) return storage.getString(key) ?? null;
    try {
      return SecureStore.getItem(key);
    } catch {
      // Keystore can be unavailable (e.g. device without a secure lock screen
      // in some Android configurations). Never let auth reads throw.
      return null;
    }
  },

  set(key: string, value: string): void {
    if (!useKeystore) {
      storage.set(key, value);
      return;
    }
    try {
      SecureStore.setItem(key, value);
    } catch {
      // Swallow: a failed credential write must not crash the app. The caller
      // will simply be asked to sign in again next launch.
    }
  },

  remove(key: string): void {
    if (!useKeystore) {
      storage.remove(key);
      return;
    }
    // deleteItemAsync is the only delete API; fire-and-forget is fine because
    // the in-memory session has already been cleared by the caller.
    SecureStore.deleteItemAsync(key).catch(() => {});
  },
};
