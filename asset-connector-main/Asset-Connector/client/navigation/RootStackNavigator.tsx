import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View } from "react-native";

import PatientTabNavigator from "@/navigation/PatientTabNavigator";
import LoginScreen from "@/screens/LoginScreen";
import LocationPermissionScreen from "@/screens/LocationPermissionScreen";
import OTPVerificationScreen from "@/screens/OTPVerificationScreen";
import CareerJoinScreen from "@/screens/CareerJoinScreen";
import DoctorDetailScreen from "@/screens/DoctorDetailScreen";
import BookAppointmentScreen from "@/screens/BookAppointmentScreen";
import SearchScreen from "@/screens/SearchScreen";
import MyBookingsScreen from "@/screens/MyBookingsScreen";
import MyOrdersScreen from "@/screens/MyOrdersScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";

export type RootStackParamList = {
  Login: undefined;
  LocationPermission: undefined;
  OTPVerification: undefined;
  Main: undefined;
  Search: undefined;
  DoctorDetail: { doctorId: string };
  BookAppointment: { doctorId: string };
  MyBookings: undefined;
  MyOrders: undefined;
  CareerJoin: { type: "doctor" | "pharmacist" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  const { theme } = useTheme();
  const { authStep } = useAuth();

  console.log("[AuthNavigator] Rendering with authStep:", authStep);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 200,
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      {authStep === "login" && (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
      {authStep === "location" && (
        <Stack.Screen
          name="LocationPermission"
          component={LocationPermissionScreen}
        />
      )}
      {authStep === "otp" && (
        <Stack.Screen
          name="OTPVerification"
          component={OTPVerificationScreen}
        />
      )}
    </Stack.Navigator>
  );
}

function PatientNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useApp();
  const { theme } = useTheme();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        headerStyle: {
          backgroundColor: theme.backgroundRoot,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          color: theme.text,
        },
        headerTransparent: false,
        headerShadowVisible: false,
        animation: "fade_from_bottom",
        animationDuration: 300,
      }}
    >
      <Stack.Screen
        name="Main"
        component={PatientTabNavigator}
        options={{ headerShown: false }}
      />

      <Stack.Screen
        name="Search"
        component={SearchScreen}
        options={{ headerShown: false, animation: "ios_from_right" }}
      />

      <Stack.Screen
        name="DoctorDetail"
        component={DoctorDetailScreen}
        options={{
          title: "",
          headerBackTitle: t("doctors"),
          animation: "slide_from_right",
        }}
      />

      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{
          title: t("bookAppointment"),
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />

      <Stack.Screen
        name="MyBookings"
        component={MyBookingsScreen}
        options={{
          title: t("myBookings"),
          animation: "fade_from_bottom",
        }}
      />

      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: t("myOrders"),
          animation: "fade_from_bottom",
        }}
      />

      <Stack.Screen
        name="CareerJoin"
        component={CareerJoinScreen}
        options={({ route }) => ({
          title:
            (route.params as any)?.type === "doctor"
              ? "انضم كطبيب"
              : "انضم كصيدلاني",
          animation: "slide_from_right",
        })}
      />
    </Stack.Navigator>
  );
}

export default function RootStackNavigator() {
  const { theme } = useTheme();
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: theme.backgroundRoot,
        }}
      >
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <PatientNavigator />;
}
