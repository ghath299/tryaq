import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { Pressable, ActivityIndicator, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { DrawerActions, useNavigation } from "@react-navigation/native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
} from "react-native-reanimated";

import DrawerNavigator from "@/navigation/DrawerNavigator";
import LoginScreen from "@/screens/LoginScreen";
import LocationPermissionScreen from "@/screens/LocationPermissionScreen";
import OTPVerificationScreen from "@/screens/OTPVerificationScreen";
import CareerJoinScreen from "@/screens/CareerJoinScreen";
import DoctorDetailScreen from "@/screens/DoctorDetailScreen";
import PharmacyDetailScreen from "@/screens/PharmacyDetailScreen";
import BookAppointmentScreen from "@/screens/BookAppointmentScreen";
import MyBookingsScreen from "@/screens/MyBookingsScreen";
import MyOrdersScreen from "@/screens/MyOrdersScreen";
import MedicinePharmaciesScreen from "@/screens/MedicinePharmaciesScreen";
import PharmacyPickerScreen from "@/screens/PharmacyPickerScreen";
import { useScreenOptions } from "@/hooks/useScreenOptions";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, Animation } from "@/constants/theme";

export type RootStackParamList = {
  Login: undefined;
  LocationPermission: undefined;
  OTPVerification: undefined;
  Main: undefined;
  DoctorDetail: { doctorId: string };
  PharmacyDetail: { pharmacyId: string };
  BookAppointment: { doctorId: string };
  MedicinePharmacies: { medicineId?: string; initialQuery?: string };
  PharmacyPicker: { pharmacyIds?: string[]; medicineName?: string };
  MyBookings: undefined;
  MyOrders: undefined;
  CareerJoin: { type: "doctor" | "pharmacist" };
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function DrawerButton() {
  const { theme } = useTheme();
  const navigation = useNavigation();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSequence(
      withSpring(0.9, Animation.spring.snappy),
      withSpring(1, Animation.spring.gentle)
    );
    navigation.dispatch(DrawerActions.openDrawer());
  };

  return (
    <AnimatedPressable
      onPress={handlePress}
      style={[{ marginLeft: Spacing.lg }, animatedStyle]}
    >
      <Feather name="menu" size={24} color={theme.text} />
    </AnimatedPressable>
  );
}

function AuthNavigator() {
  const { authStep } = useAuth();

  console.log("[AuthNavigator] Rendering with authStep:", authStep);

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "fade",
        animationDuration: 200,
      }}
    >
      {authStep === "login" && (
        <Stack.Screen name="Login" component={LoginScreen} />
      )}
      {authStep === "location" && (
        <Stack.Screen name="LocationPermission" component={LocationPermissionScreen} />
      )}
      {authStep === "otp" && (
        <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      )}
    </Stack.Navigator>
  );
}

function PatientNavigator() {
  const screenOptions = useScreenOptions();
  const { t } = useApp();

  return (
    <Stack.Navigator
      screenOptions={{
        ...screenOptions,
        animation: "fade_from_bottom",
        animationDuration: 300,
      }}
    >
      <Stack.Screen
        name="Main"
        component={DrawerNavigator}
        options={{ headerShown: false }}
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
        name="PharmacyDetail"
        component={PharmacyDetailScreen}
        options={{
          title: "",
          headerBackTitle: t("pharmacies"),
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="MedicinePharmacies"
        component={MedicinePharmaciesScreen}
        options={{
          title: "الصيدليات المتوفرة",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="PharmacyPicker"
        component={PharmacyPickerScreen}
        options={{
          title: t("pharmacies"),
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
          headerLeft: () => <DrawerButton />,
          animation: "fade_from_bottom",
        }}
      />
      <Stack.Screen
        name="MyOrders"
        component={MyOrdersScreen}
        options={{
          title: t("myOrders"),
          headerLeft: () => <DrawerButton />,
          animation: "fade_from_bottom",
        }}
      />
      <Stack.Screen
        name="CareerJoin"
        component={CareerJoinScreen}
        options={({ route }) => ({
          title: (route.params as any)?.type === "doctor" ? "انضم كطبيب" : "انضم كصيدلاني",
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: theme.backgroundRoot }}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    return <AuthNavigator />;
  }

  return <PatientNavigator />;
}
