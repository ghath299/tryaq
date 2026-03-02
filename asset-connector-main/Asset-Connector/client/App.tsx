import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
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

SplashScreen.preventAutoHideAsync();

function AppContent() {
  const [fontsLoaded, fontError] = Font.useFonts({
    Tajawal_400Regular: require("../assets/fonts/Tajawal_400Regular.ttf"),
    Tajawal_500Medium: require("../assets/fonts/Tajawal_500Medium.ttf"),
    Tajawal_700Bold: require("../assets/fonts/Tajawal_700Bold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#000" }}>
      <NavigationContainer>
        <RootStackNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <AppProvider>
          <ThemeProvider>
            <AuthProvider>
              <SafeAreaProvider>
                <GestureHandlerRootView style={styles.root}>
                  <KeyboardProvider>
                    {/* 🔥 تم تعديل الستاتس بار هنا */}
                    <StatusBar style="light" backgroundColor="#000" />

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
    backgroundColor: "#000",
  },
});
