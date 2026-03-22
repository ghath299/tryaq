import React from "react";
import { Dimensions, Platform } from "react-native";
import { createDrawerNavigator } from "@react-navigation/drawer";
import PatientTabNavigator from "@/navigation/PatientTabNavigator";
import { DrawerContent } from "@/components/DrawerContent";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar";

const { width: WINDOW_WIDTH } = Dimensions.get("window");

export type DrawerParamList = {
  PatientTabs: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  const { theme } = useTheme();
  const { language } = useApp();
  const isRTL = language === "ar";

  return (
    <>
      <StatusBar style="auto" />

      <Drawer.Navigator
        drawerContent={(props) => <DrawerContent {...props} />}
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          drawerPosition: isRTL ? "right" : "left",
          drawerType: "slide",
          drawerStyle: {
            width: WINDOW_WIDTH * 0.75,
            backgroundColor: theme.backgroundRoot,
          },
          sceneStyle: {
            backgroundColor: theme.backgroundRoot,
          },
          overlayColor: "rgba(0,0,0,0.4)",
          swipeEnabled: true,
          drawerActiveBackgroundColor: "transparent",
          drawerInactiveBackgroundColor: "transparent",
          drawerActiveTintColor: theme.primary,
        }}
      >
        <Drawer.Screen name="PatientTabs" component={PatientTabNavigator} />
      </Drawer.Navigator>
    </>
  );
}