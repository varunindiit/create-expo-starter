import { Stack } from "expo-router";
import { useTheme } from "@/theme";

// expo-router 58 removed the navigator `initialRouteName` prop.
export const unstable_settings = { anchor: "login" };

/** Authentication flow stack. */
export default function AuthLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: "slide_from_right",
      }}
    >
      <Stack.Screen name="login" />
    </Stack>
  );
}
