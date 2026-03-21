import React from "react";
import { createDrawerNavigator } from "@react-navigation/drawer";
import PatientTabNavigator from "@/navigation/PatientTabNavigator";
import { DrawerContent } from "@/components/DrawerContent";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { StatusBar } from "expo-status-bar"; // ✅ أضفنا الـ StatusBar للتحكم بالأيقونات العلوية

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
      {/* ✅ نضع الـ StatusBar هنا لضمان تناسق الألوان عند فتح القائمة */}
      <StatusBar style="auto" />

      <Drawer.Navigator
        key={language} // لإعادة بناء القائمة عند تغيير اللغة
        drawerContent={(props) => <DrawerContent {...props} />}
        screenOptions={{
          headerShown: false,
          drawerPosition: isRTL ? "right" : "left", // ✅ يتبع اللغة بشكل صحيح
          drawerStyle: {
            width: 320,
            backgroundColor: theme.backgroundRoot,
            // ❌ حذفنا position: "absolute" والـ top/bottom لحل مشكلة اختفاء القائمة و"الشبح" باليسار
          },
          drawerType: "front",
          overlayColor: "rgba(0,0,0,0.5)",
          swipeEnabled: true,
          swipeEdgeWidth: 50,
          sceneStyle: {
            backgroundColor: theme.backgroundRoot,
          },
        }}
      >
        <Drawer.Screen name="PatientTabs" component={PatientTabNavigator} />
      </Drawer.Navigator>
    </>
  );
}
