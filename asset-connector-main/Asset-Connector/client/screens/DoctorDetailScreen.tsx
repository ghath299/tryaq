import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";
import { doctors } from "@/data/mockData";

type DoctorDetailRouteProp = RouteProp<
  { DoctorDetail: { doctorId: string } },
  "DoctorDetail"
>;

const openWaze = (lat: number, lng: number) => {
  const deep = `waze://?ll=${lat},${lng}&navigate=yes`;
  const web = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
  Linking.openURL(deep).catch(() => {
    Linking.openURL(web).catch(() => {});
  });
};

const AVATAR_SIZE = 100;
const AVATAR_BORDER = 4;
const AVATAR_OVERLAP = AVATAR_SIZE / 2;

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const { theme, isDark } = useTheme();
  const { t } = useApp();
  const route = useRoute<DoctorDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { width: W } = useWindowDimensions();

  const TXT = {
    route: "المسار",
    clinicInfo: "معلومات العيادة",
    clinic: "العيادة",
    workingHours: "ساعات العمل",
    distance: "المسافة",
    km: "كم",
  };

  const doctor = doctors.find((d) => d.id === route.params?.doctorId);

  if (!doctor) {
    return (
      <View
        style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      >
        <ThemedText>{t("error")}</ThemedText>
      </View>
    );
  }

  const name = doctor.nameAr;
  const specialty = doctor.specialtyAr;
  const province = doctor.provinceAr;
  const district = doctor.districtAr;
  const clinicAddress = doctor.clinicAddress;

  const handleBookAppointment = () => {
    navigation.navigate(
      "BookAppointment" as never,
      { doctorId: doctor.id } as never,
    );
  };

  const heroHeight = Math.round(W * 0.65);

  const shadow = Platform.select({
    ios: {
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
    },
    android: { elevation: 8 },
    default: {},
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeIn.duration(300)}>
          <LinearGradient
            colors={
              isDark
                ? [addAlpha(theme.primary, 0.19), theme.backgroundRoot]
                : [addAlpha(theme.primary, 0.15), theme.backgroundRoot]
            }
            style={{ height: heroHeight }}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(100).duration(400)}
          style={styles.profileSection}
        >
          <View style={[styles.avatarContainer, shadow]}>
            <View
              style={[styles.avatarRing, { borderColor: theme.backgroundRoot }]}
            >
              <View style={[styles.avatarImage, { alignItems: "center", justifyContent: "center", backgroundColor: addAlpha(theme.primary, 0.08) }]}>
                <Feather name="user" size={64} color={theme.primary} />
              </View>
            </View>
            {doctor.isVerified && (
              <View
                style={[
                  styles.verifiedBadge,
                  {
                    backgroundColor: theme.primary,
                    borderColor: theme.backgroundRoot,
                  },
                ]}
              >
                <Feather name="check" size={12} color="#FFF" />
              </View>
            )}
          </View>

          <View style={styles.nameBlock}>
            <ThemedText
              type="h2"
              style={[styles.nameText, { textAlign: "right" }]}
            >
              {name}
            </ThemedText>

            <ThemedText
              type="body"
              style={[styles.specialtyText, { color: theme.primary }]}
            >
              {specialty}
            </ThemedText>

            <View
              style={[
                styles.ratingRow,
                { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.ratingChip,
                  { backgroundColor: theme.warning + "18" },
                ]}
              >
                <Feather name="star" size={14} color={theme.warning} />
                <ThemedText
                  type="small"
                  style={{
                    fontWeight: "700",
                    marginLeft: 4,
                    color: theme.warning,
                  }}
                >
                  {doctor.rating}
                </ThemedText>
              </View>
              <View
                style={[
                  styles.locationChip,
                  { backgroundColor: theme.primary + "12" },
                ]}
              >
                <Feather name="map-pin" size={12} color={theme.primary} />
                <ThemedText
                  type="caption"
                  style={{
                    color: theme.primary,
                    marginLeft: 4,
                    fontWeight: "500",
                  }}
                >
                  {province} - {district}
                </ThemedText>
              </View>
            </View>

            <TouchableOpacity
              activeOpacity={1}
              onPress={() => openWaze(doctor.lat, doctor.lng)}
              style={[styles.wazeBtn, { backgroundColor: theme.primary }]}
            >
              <Feather name="navigation" size={16} color="#FFF" />
              <ThemedText
                type="small"
                style={{ color: "#FFF", fontWeight: "700", marginLeft: 8 }}
              >
                {TXT.route}
              </ThemedText>
            </TouchableOpacity>
          </View>
        </Animated.View>

        <Animated.View
          entering={FadeInUp.delay(200).duration(300)}
          style={styles.content}
        >
          <View
            style={[
              styles.sectionHeader,
              { flexDirection: "row-reverse" },
            ]}
          >
            <View
              style={[
                styles.sectionIcon,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Feather name="info" size={20} color={theme.primary} />
            </View>
            <ThemedText
              type="h4"
              style={{
                fontWeight: "600",
                marginRight: Spacing.md,
              }}
            >
              {TXT.clinicInfo}
            </ThemedText>
          </View>

          <View
            style={[
              styles.infoCard,
              {
                backgroundColor: isDark ? theme.card : theme.backgroundDefault,
              },
              shadow,
            ]}
          >
            <View
              style={[
                styles.infoRow,
                { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: theme.primary + "12" },
                ]}
              >
                <Feather name="map-pin" size={18} color={theme.primary} />
              </View>
              <View
                style={[
                  styles.infoContent,
                  { marginRight: Spacing.md, marginLeft: 0 },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: theme.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {TXT.clinic}
                </ThemedText>
                <ThemedText
                  style={[{ marginTop: 2 }, { textAlign: "right" }]}
                >
                  {clinicAddress}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={[
                    { color: theme.textSecondary, marginTop: 2 },
                    { textAlign: "right" },
                  ]}
                >
                  {province} - {district}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View
              style={[
                styles.infoRow,
                { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: theme.primary + "12" },
                ]}
              >
                <Feather name="clock" size={18} color={theme.primary} />
              </View>
              <View
                style={[
                  styles.infoContent,
                  { marginRight: Spacing.md, marginLeft: 0 },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: theme.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {TXT.workingHours}
                </ThemedText>
                <ThemedText
                  style={[{ marginTop: 2 }, { textAlign: "right" }]}
                >
                  {doctor.workingHours}
                </ThemedText>
                <ThemedText
                  type="caption"
                  style={[
                    { color: theme.textSecondary, marginTop: 2 },
                    { textAlign: "right" },
                  ]}
                >
                  {doctor.workingDays.join(" - ")}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View
              style={[
                styles.infoRow,
                { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.infoIcon,
                  { backgroundColor: theme.primary + "12" },
                ]}
              >
                <Feather name="navigation" size={18} color={theme.primary} />
              </View>
              <View
                style={[
                  styles.infoContent,
                  { marginRight: Spacing.md, marginLeft: 0 },
                ]}
              >
                <ThemedText
                  type="caption"
                  style={{
                    color: theme.textSecondary,
                    textTransform: "uppercase",
                    letterSpacing: 0.5,
                  }}
                >
                  {TXT.distance}
                </ThemedText>
                <ThemedText
                  style={[{ marginTop: 2 }, { textAlign: "right" }]}
                >
                  {doctor.distance} {TXT.km}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      <Animated.View
        entering={FadeInUp.delay(300).duration(300)}
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
            borderTopColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
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
  container: { flex: 1 },

  profileSection: {
    alignItems: "center",
    marginTop: -AVATAR_OVERLAP,
    paddingHorizontal: Spacing.lg,
  },

  avatarContainer: {
    position: "relative",
    marginBottom: Spacing.md,
  },

  avatarRing: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: AVATAR_BORDER,
    overflow: "hidden",
  },

  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: AVATAR_SIZE / 2,
  },

  verifiedBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },

  nameBlock: {
    alignItems: "center",
    width: "100%",
  },

  nameText: {
    textAlign: "center",
    fontWeight: "700",
  },

  specialtyText: {
    textAlign: "center",
    marginTop: 4,
    fontWeight: "600",
  },

  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },

  ratingChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },

  locationChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },

  wazeBtn: {
    marginTop: Spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: BorderRadius.full,
  },

  content: {
    padding: Spacing.lg,
    paddingTop: Spacing.xl,
  },

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },

  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  infoCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  infoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
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
  },

  bookButton: { width: "100%" },
});
