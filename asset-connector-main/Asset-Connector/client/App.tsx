import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native"; // ✅ أضفنا DefaultTheme
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import * as SplashScreen from "expo-splash-screen";
import * as Font from "expo-font";

import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";

import RootStackNavigator from "@/navigation/RootStackNavigator";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AppProvider } from "@/contexts/AppContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/hooks/useTheme";

SplashScreen.preventAutoHideAsync().catch(() => {});

// ✅ تعريف الثيم المخصص للقضاء على الرمشة البيضاء
const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#000000", // ✅ جعل خلفية التنقل سودة تماماً
    card: "#000000",
  },
};

function AppContent() {
  const [fontsLoaded, fontError] = Font.useFonts({
    Tajawal_400Regular: require("../assets/fonts/Tajawal_400Regular.ttf"),
    Tajawal_500Medium: require("../assets/fonts/Tajawal_500Medium.ttf"),
    Tajawal_700Bold: require("../assets/fonts/Tajawal_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    // ✅ التأكد من أن الحاوية الأساسية سودة
    <View style={{ flex: 1, backgroundColor: "#000000" }}>
      {/* ✅ تمرير الثيم المخصص هنا هو الحل النهائي للرمشة */}
      <NavigationContainer theme={MyTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  useEffect(() => {
    SplashScreen.hideAsync().catch(() => {});
  }, []);

  return (
    <ErrorBoundary
      onError={(error) => {
        console.error("App ErrorBoundary caught:", error);
        SplashScreen.hideAsync().catch(() => {});
      }}
    >
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ThemeProvider>
            <AuthProvider>
              <SafeAreaProvider>
                <GestureHandlerRootView style={styles.root}>
                  <KeyboardProvider>
                    <StatusBar style="light" backgroundColor="#000000" />
                    <AppContent />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </SafeAreaProvider>
            </AuthProvider>
          </ThemeProvider>
        </AppProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#000000", // ✅ ضمان أن الجذر دائماً أسود
  },
});
