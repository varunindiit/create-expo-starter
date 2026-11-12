import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Stack, type ErrorBoundaryProps } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { Provider } from "react-redux";
import FlashMessage from "react-native-flash-message";

import store from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";
import { FONT_ASSETS, SPACING, useTheme } from "@/theme";
import { RNButton, RNText } from "@/components";
import { captureError, initMonitoring } from "@/services/monitoring";
// #if i18n
import "@/localization/i18n";
// #endif

// Keep the native splash visible until fonts are resolved.
SplashScreen.preventAutoHideAsync().catch(() => {});

initMonitoring();

/**
 * Route-level error boundary.
 *
 * expo-router renders this instead of the crashed subtree, and `retry()`
 * remounts it. Without this export, any render error in production is an
 * unrecoverable blank screen.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  const { colors } = useTheme();

  useEffect(() => {
    captureError(error, { boundary: "root" });
  }, [error]);

  return (
    <View style={[styles.centered, { backgroundColor: colors.background }]}>
      <RNText font="semibold" size={20} color={colors.text} textAlign="center">
        Something went wrong
      </RNText>
      <RNText
        size={14}
        color={colors.textSecondary}
        textAlign="center"
        style={styles.errorDetail}
      >
        {error.message}
      </RNText>
      <RNButton title="Try again" onPress={retry} containerStyle={styles.retry} />
    </View>
  );
}

/**
 * Root navigator — the single Stack that owns every route group.
 *
 * `Stack.Protected` declaratively guards each flow by auth state: only the
 * matching group is mounted, and expo-router automatically redirects to the
 * first available route whenever the guard flips (login / logout). This is the
 * protected-routes pattern — no manual redirects needed.
 */
const RootNavigator = () => {
  const isLoggedIn = useAppSelector((s) => s.auth.isLoggedIn);
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      {/* expo-router 58 no longer infers a target from the first remaining
          group, so each guard names where to send the user. */}
      <Stack.Protected guard={isLoggedIn} redirectTo="/login">
        <Stack.Screen name="(tabs)" />
      </Stack.Protected>

      <Stack.Protected guard={!isLoggedIn} redirectTo="/">
        <Stack.Screen name="(auth)" />
      </Stack.Protected>

      <Stack.Screen name="+not-found" options={{ presentation: "modal" }} />
    </Stack>
  );
};

/** Themed chrome that must sit inside the providers to read the theme. */
const AppChrome = () => {
  const { colors, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <RootNavigator />
      <FlashMessage
        position="top"
        duration={2500}
        floating
        style={{ backgroundColor: colors.surface }}
      />
    </>
  );
};

/** Root layout — global providers, fonts/splash, then the root navigator. */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts(FONT_ASSETS);

  // Resolve the splash on *either* outcome. Waiting only on success means a
  // corrupt or missing font file leaves the user on a blank screen forever.
  const fontsResolved = fontsLoaded || Boolean(fontError);

  useEffect(() => {
    if (fontError) {
      captureError(fontError, { stage: "font-loading" });
    }
  }, [fontError]);

  useEffect(() => {
    if (fontsResolved) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsResolved]);

  if (!fontsResolved) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <Provider store={store}>
          <KeyboardProvider>
            <AppChrome />
          </KeyboardProvider>
        </Provider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  errorDetail: { marginBottom: SPACING.lg },
  retry: { paddingHorizontal: SPACING.xxxl },
});
