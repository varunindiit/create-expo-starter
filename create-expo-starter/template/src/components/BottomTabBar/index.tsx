import React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { moderateScale } from "react-native-size-matters";
import { makeStyles } from "@/theme";
import type { SvgProps } from "react-native-svg";

import HomeActive from "@/assets/svg/homeActive.svg";
import HomeUnActive from "@/assets/svg/homeUnActive.svg";
import ListActive from "@/assets/svg/listActive.svg";
import ListUnActive from "@/assets/svg/listUnActive.svg";
import ChatActive from "@/assets/svg/chatActive.svg";
import ChatUnActive from "@/assets/svg/chatUnActive.svg";
import UserActive from "@/assets/svg/userActive.svg";
import UserUnActive from "@/assets/svg/userUnActive.svg";

type TabIcon = { Active: React.FC<SvgProps>; Inactive: React.FC<SvgProps> };

/**
 * Structural subset of what expo-router hands a custom `tabBar`.
 *
 * Declared here rather than imported from `@react-navigation/bottom-tabs`,
 * which is a transitive dependency of expo-router — importing from it directly
 * would break the moment expo-router changes its internals, and it isn't in
 * this project's package.json.
 */
interface TabRoute {
  key: string;
  name: string;
}

export interface BottomTabBarProps {
  state: { index: number; routes: TabRoute[] };
  descriptors: Record<
    string,
    { options: { title?: string; tabBarAccessibilityLabel?: string } }
  >;
  emitter: {
    emit(event: {
      type: "tabPress";
      target: string;
      canPreventDefault: true;
    }): { defaultPrevented: boolean };
  };
  navigateToTab(routeKey: string): void;
}

/**
 * Route name -> icon pair.
 *
 * Keys are expo-router route names (the file name without its extension;
 * `index` for a group's home route). Add a route here when you add a tab —
 * anything unmapped falls back to `FALLBACK_ICON` rather than crashing, which
 * is what the old name-guessing logic did when it met an unexpected route.
 */
export const TAB_ICONS: Record<string, TabIcon> = {
  index: { Active: HomeActive, Inactive: HomeUnActive },
  components: { Active: ListActive, Inactive: ListUnActive },
  messages: { Active: ChatActive, Inactive: ChatUnActive },
  profile: { Active: UserActive, Inactive: UserUnActive },
};

const FALLBACK_ICON: TabIcon = {
  Active: ListActive,
  Inactive: ListUnActive,
};

const BottomTabBar: React.FC<BottomTabBarProps> = ({
  state,
  descriptors,
  emitter,
  navigateToTab,
}) => {
  const insets = useSafeAreaInsets();
  const styles = useStyles();

  return (
    <View
      style={[
        styles.wrapper,
        { paddingBottom: Math.max(insets.bottom, moderateScale(12)) },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const isFocused = state.index === index;
          const { options } = descriptors[route.key];
          const cfg = TAB_ICONS[route.name] ?? FALLBACK_ICON;
          const Icon = isFocused ? cfg.Active : cfg.Inactive;
          const label =
            options.tabBarAccessibilityLabel ?? options.title ?? route.name;

          const onPress = () => {
            const event = emitter.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigateToTab(route.key);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={styles.item}
              hitSlop={8}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: isFocused }}
            >
              <View style={[styles.iconWrap, isFocused && styles.iconWrapActive]}>
                <Icon width={moderateScale(26)} height={moderateScale(26)} />
                {isFocused && <View style={styles.activeNotch} />}
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

export default BottomTabBar;

const useStyles = makeStyles((c) => ({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: moderateScale(16),
    paddingTop: moderateScale(8),
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: c.tabBg,
    borderRadius: moderateScale(32),
    paddingHorizontal: moderateScale(12),
    paddingVertical: moderateScale(10),
    shadowColor: c.shadow,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
  },
  item: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrap: {
    width: moderateScale(54),
    height: moderateScale(54),
    borderRadius: moderateScale(18),
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapActive: {
    backgroundColor: c.primary,
    overflow: "hidden",
    borderRadius: moderateScale(18),
  },
  activeNotch: {
    position: "absolute",
    bottom: -1,
    alignSelf: "center",
    width: moderateScale(11.55),
    height: moderateScale(4.23),
    backgroundColor: c.tabBg,
    borderTopLeftRadius: moderateScale(2),
    borderTopRightRadius: moderateScale(2),
  },
}));
