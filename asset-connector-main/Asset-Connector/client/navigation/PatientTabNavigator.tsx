import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";

import HomeScreen from "@/screens/HomeScreen";
import DoctorsScreen from "@/screens/DoctorsScreen";
import MedicinesScreen from "@/screens/MedicinesScreen";
import PharmaciesScreen from "@/screens/PharmaciesScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Animation } from "@/constants/theme";

export type PatientTabParamList = {
  HomeTab: undefined;
  DoctorsTab: undefined;
  MedicinesTab: undefined;
  PharmaciesTab: undefined;
};

const Tab = createBottomTabNavigator<PatientTabParamList>();

interface AnimatedTabIconProps {
  name: keyof typeof Feather.glyphMap;
  color: string;
  size: number;
  focused: boolean;
}

function AnimatedTabIcon({ name, color, size, focused }: AnimatedTabIconProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(focused ? 1.1 : 1);
  const translateY = useSharedValue(focused ? -1 : 0);

  React.useEffect(() => {
    scale.value = withSpring(focused ? 1.1 : 1, Animation.spring.gentle);
    translateY.value = withSpring(focused ? -1 : 0, Animation.spring.gentle);
  }, [focused]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View style={[styles.tabIconContainer, animatedStyle]}>
      <Feather name={name} size={size} color={color} />
      {focused ? (
        <View
          style={[styles.activeIndicator, { backgroundColor: theme.primary }]}
        />
      ) : null}
    </Animated.View>
  );
}

export default function PatientTabNavigator() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { t } = useApp();

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        lazy: true,
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.tabIconDefault,

        tabBarStyle: {
          backgroundColor: Platform.select({
            ios: "transparent",
            android: theme.backgroundRoot,
          }),
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + insets.bottom,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 10,
          paddingTop: 8,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "500",
          marginTop: 2,
        },

        tabBarBackground: () =>
          Platform.OS === "ios" ? (
            <BlurView
              intensity={80}
              tint={isDark ? "dark" : "light"}
              style={StyleSheet.absoluteFill}
            />
          ) : (
            <View
              style={[
                StyleSheet.absoluteFill,
                { backgroundColor: theme.backgroundRoot + "F5" },
              ]}
            />
          ),

        animation: "fade",
        freezeOnBlur: true,

        sceneStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t("home"),
          headerTitle: () => <HeaderTitle title={t("appName")} />,
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="home"
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="DoctorsTab"
        component={DoctorsScreen}
        options={{
          title: t("doctors"),
          headerTitle: t("doctors"),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="user-check"
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="MedicinesTab"
        component={MedicinesScreen}
        options={{
          title: t("medicines"),
          headerTitle: t("medicines"),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="package"
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />

      <Tab.Screen
        name="PharmaciesTab"
        component={PharmaciesScreen}
        options={{
          title: t("pharmacies"),
          headerTitle: t("pharmacies"),
          tabBarIcon: ({ color, size, focused }) => (
            <AnimatedTabIcon
              name="plus-square"
              size={size}
              color={color}
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabIconContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  activeIndicator: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 4,
  },
});
