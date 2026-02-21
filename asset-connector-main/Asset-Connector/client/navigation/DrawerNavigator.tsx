import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { Dimensions, Platform } from "react-native";

import PatientTabNavigator from "@/navigation/PatientTabNavigator";
import { DrawerContent } from "@/components/DrawerContent";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useScreenOptions } from "@/hooks/useScreenOptions";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const DRAWER_WIDTH = Math.min(SCREEN_WIDTH * 0.85, 340);

export type DrawerParamList = {
  PatientTabs: undefined;
};

const Drawer = createDrawerNavigator<DrawerParamList>();

export default function DrawerNavigator() {
  const { theme } = useTheme();
  const { language } = useApp();
  const isRTL = language === "ar";

  return (
    <Drawer.Navigator
      key={language} // Force re-render on language change
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerPosition: isRTL ? "right" : "left",
        drawerStyle: {
          width: 320,
          backgroundColor: theme.backgroundRoot,
          position: "absolute",
          top: 0,
          bottom: 0,
        },
        drawerType: "front",
        overlayColor: "rgba(0,0,0,0.5)",
        swipeEnabled: true,
        swipeEdgeWidth: 50,
      }}
    >
      <Drawer.Screen name="PatientTabs" component={PatientTabNavigator} />
    </Drawer.Navigator>
  );
}
