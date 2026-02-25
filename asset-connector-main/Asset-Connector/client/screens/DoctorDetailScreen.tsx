import React from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { MapViewComponent } from "@/components/MapView.native";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { doctors } from "@/data/mockData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type DoctorDetailRouteProp = RouteProp<{ DoctorDetail: { doctorId: string } }, "DoctorDetail">;

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();
  const route = useRoute<DoctorDetailRouteProp>();
  const navigation = useNavigation<any>();

  const doctor = doctors.find((d) => d.id === route.params?.doctorId);

  if (!doctor) {
    return (
      <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body">{t("error")}</ThemedText>
      </View>
    );
  }

  const name = language === "ar" ? doctor.nameAr : doctor.nameEn;
  const specialty = language === "ar" ? doctor.specialtyAr : doctor.specialtyEn;
  const province = language === "ar" ? doctor.provinceAr : doctor.provinceEn;
  const district = language === "ar" ? doctor.districtAr : doctor.districtEn;
  const clinicAddress = language === "ar" ? doctor.clinicAddress : doctor.clinicAddressEn;

  const handleBookAppointment = () => {
    navigation.navigate("BookAppointment" as never, { doctorId: doctor.id } as never);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: insets.bottom + 100,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(400)}>
          <View style={styles.mapContainer}>
            <MapViewComponent
              lat={doctor.lat}
              lng={doctor.lng}
              title={name}
              description={specialty}
            />
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={styles.content}
        >
          <View style={styles.headerSection}>
            <View style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}>
              <Feather name="user" size={40} color={theme.primary} />
            </View>
            <View style={styles.headerInfo}>
              <View style={styles.nameRow}>
                <ThemedText type="h2" style={styles.name}>
                  {name}
                </ThemedText>
                {doctor.isVerified ? (
                  <Feather name="check-circle" size={20} color={theme.primary} />
                ) : null}
              </View>
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                {specialty}
              </ThemedText>
              <View style={styles.ratingRow}>
                <Feather name="star" size={16} color={theme.warning} />
                <ThemedText type="body" style={{ marginLeft: Spacing.xs }}>
                  {doctor.rating}
                </ThemedText>
              </View>
            </View>
          </View>

          <View style={[styles.infoCard, { backgroundColor: theme.backgroundDefault }]}>
            <View style={styles.infoRow}>
              <Feather name="map-pin" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("clinic")}
                </ThemedText>
                <ThemedText type="body">{clinicAddress}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {province} - {district}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.infoRow}>
              <Feather name="clock" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("workingHours")}
                </ThemedText>
                <ThemedText type="body">{doctor.workingHours}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {doctor.workingDays.join(" - ")}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.infoRow}>
              <Feather name="phone" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("phone")}
                </ThemedText>
                <ThemedText type="body">{doctor.phone}</ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={styles.infoRow}>
              <Feather name="navigation" size={20} color={theme.primary} />
              <View style={styles.infoContent}>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {t("distance")}
                </ThemedText>
                <ThemedText type="body">
                  {doctor.distance} {t("km")}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).duration(400)}
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button onPress={handleBookAppointment} style={styles.bookButton}>
          {t("bookAppointment")}
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapContainer: {
    height: 200,
  },
  content: {
    padding: Spacing.lg,
  },
  headerSection: {
    flexDirection: "row",
    marginBottom: Spacing.xl,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  headerInfo: {
    flex: 1,
    justifyContent: "center",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  infoCard: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  infoContent: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.md,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  bookButton: {
    width: "100%",
  },
});
