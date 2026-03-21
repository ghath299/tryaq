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
  const drawerWidth = Math.min(WINDOW_WIDTH * 0.82, 320);

  return (
    <>
      <StatusBar style="auto" />

      <Drawer.Navigator
        key={language}
        drawerContent={(props) => <DrawerContent {...props} />}
        detachInactiveScreens={false}
        screenOptions={{
          headerShown: false,
          drawerPosition: isRTL ? "right" : "left",
          drawerType: "slide",
          drawerStyle: {
            width: drawerWidth,
            backgroundColor: theme.backgroundRoot,
          },
          sceneStyle: {
            backgroundColor: theme.backgroundRoot,
          },
          overlayColor: "rgba(0,0,0,0.5)",
          swipeEnabled: true,
          swipeEdgeWidth: isRTL ? 80 : 60,
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