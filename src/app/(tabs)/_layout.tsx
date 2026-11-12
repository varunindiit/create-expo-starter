import { Tabs } from "expo-router";
import BottomTabBar from "@/components/BottomTabBar";
import { useTheme } from "@/theme";

/** Signed-in flow bottom tabs. */
export default function TabsLayout() {
  const { colors } = useTheme();

  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        // Opaque: on web, expo-router 58 leaves inactive tabs mounted and
        // visible beneath the focused one, so a transparent scene shows them.
        sceneStyle: { backgroundColor: colors.background },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      {/* #if gallery */}
      <Tabs.Screen name="components" options={{ title: "Components" }} />
      {/* #endif */}
      <Tabs.Screen name="profile" options={{ title: "Profile" }} />
    </Tabs>
  );
}
