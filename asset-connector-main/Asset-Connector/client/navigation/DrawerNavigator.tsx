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
        key={language} 
        drawerContent={(props) => <DrawerContent {...props} />}
        // ✅ الحل الجذري لبقاء "شبح" القائمة أو التحديد الرمادي الخلفي
        detachInactiveScreens={false} 
        screenOptions={{
          headerShown: false,
          drawerPosition: isRTL ? "right" : "left",
          drawerType: "front",
          drawerStyle: {
            width: 320,
            backgroundColor: theme.backgroundRoot, // لازم يكون #F2F2F7
          },
          // ✅ إجبار الخلفية اللي تحت الـ Drawer تكون نفس اللون عشان ما يطلع رمادي
          sceneStyle: {
            backgroundColor: theme.backgroundRoot,
          },
          overlayColor: "rgba(0,0,0,0.5)",
          swipeEnabled: true,
          swipeEdgeWidth: WINDOW_WIDTH,
          // ✅ "خنق" التحديد الرمادي في القائمة الجانبية (الأندرويد)
          drawerActiveBackgroundColor: 'transparent',
          drawerInactiveBackgroundColor: 'transparent',
          drawerActiveTintColor: theme.primary,
        }}
      >
        <Drawer.Screen name="PatientTabs" component={PatientTabNavigator} />
      </Drawer.Navigator>
    </>
  );
}