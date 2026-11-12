import React, { memo } from "react";
import {
  ImageBackground,
  ImageSourcePropType,
  StatusBar,
  StyleProp,
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView, Edges } from "react-native-safe-area-context";
import { useTheme } from "@/theme";

interface MainContainerProps {
  children?: React.ReactNode;
  background?: ImageSourcePropType | null;
  edges?: Edges;
  bgColor?: string;
  statusBarStyle?: "light-content" | "dark-content";
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  gradient?: boolean;
  gradientColors?: string[];
  gradientStart?: { x: number; y: number };
  gradientEnd?: { x: number; y: number };
}

const MainContainer: React.FC<MainContainerProps> = memo(
  function MainContainer({
    children,
    background,
    edges = ["top", "bottom"] as const,
    bgColor,
    statusBarStyle,
    style,
    contentStyle,
    gradient = false,
    gradientColors,
    gradientStart = { x: 0, y: 0 },
    gradientEnd = { x: 0, y: 0.4 },
  }) {
    const { colors, isDark } = useTheme();

    return (
    <View
      style={[styles.root, { backgroundColor: bgColor ?? colors.background }, style]}
    >
      <StatusBar
        barStyle={statusBarStyle ?? (isDark ? "light-content" : "dark-content")}
      />
      {gradient ? (
        <LinearGradient
          colors={
            (gradientColors ?? [colors.backgroundAlt, colors.background]) as [
              string,
              string,
              ...string[],
            ]
          }
          start={gradientStart}
          end={gradientEnd}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      {background ? (
        <ImageBackground
          source={background}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
        />
      ) : null}
      <SafeAreaView edges={edges} style={[styles.safe, contentStyle]}>
        {children}
      </SafeAreaView>
    </View>
    );
  },
);

export default MainContainer;

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
});
