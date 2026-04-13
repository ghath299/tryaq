import React, { useEffect } from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
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

const MyTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: "#0D1117",
    card: "#0D1117",
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
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#5EDFFF" />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#0D1117" }}>
      <NavigationContainer theme={MyTheme}>
        <RootStackNavigator />
      </NavigationContainer>
    </View>
  );
}

export default function App() {
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
                    <StatusBar style="light" backgroundColor="#0D1117" />
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
    backgroundColor: "#0D1117",
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#0D1117",
    alignItems: "center",
    justifyContent: "center",
  },
});
