import React from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  Linking,
  useWindowDimensions,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
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

export default function DoctorDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();
  const route = useRoute<DoctorDetailRouteProp>();
  const navigation = useNavigation<any>();
  const { width: W } = useWindowDimensions();

  const isRTL = language === "ar";

  // ✅ ترجمة داخل الملف بدون AppContext
  const TXT = {
    route: isRTL ? "المسار" : "Route",
    clinicInfo: isRTL ? "معلومات العيادة" : "Clinic Info",
    clinic: isRTL ? "العيادة" : "Clinic",
    workingHours: isRTL ? "ساعات العمل" : "Working Hours",
    distance: isRTL ? "المسافة" : "Distance",
    km: isRTL ? "كم" : "km",
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

  const name = isRTL ? doctor.nameAr : doctor.nameEn;
  const specialty = isRTL ? doctor.specialtyAr : doctor.specialtyEn;
  const province = isRTL ? doctor.provinceAr : doctor.provinceEn;
  const district = isRTL ? doctor.districtAr : doctor.districtEn;
  const clinicAddress = isRTL ? doctor.clinicAddress : doctor.clinicAddressEn;

  // ✅ صور افتراضية
  const clinicSource = require("../assets/placeholders/clinic.jpg");
  const doctorSource = require("../assets/placeholders/doctor.png");

  const handleBookAppointment = () => {
    navigation.navigate(
      "BookAppointment" as never,
      { doctorId: doctor.id } as never,
    );
  };

  /**
   * ✅ Safe header universal:
   * نأخذ الأكبر حتى لا يقص على أي جهاز.
   */
  const SAFE_HEADER_FALLBACK = 44;
  const safeHeader = Math.max(headerHeight, insets.top + SAFE_HEADER_FALLBACK);

  /**
   * ✅ كل القياسات ديناميكية حسب الجهاز (بدون عرض ثابت):
   * heroWidth = عرض الشاشة ناقص padding
   * heroHeight = يعتمد على aspectRatio ثابت (شكل موحد على كل الأجهزة)
   */
  const heroSidePadding = Spacing.lg * 2;
  const heroWidth = Math.max(0, W - heroSidePadding);
  const heroAspect = 16 / 10; // شكل ثابت (تقدر تغيّره لِـ 16/9 أو 16/11 حسب ذوقك)
  const heroHeight = Math.round(heroWidth / heroAspect);

  /**
   * ✅ الافاتار يعتمد على عرض الهيرو (مو على رقم ثابت)
   */
  const avatarSize = Math.round(heroWidth * 0.26);

  /**
   * ✅ مكان الافاتار: نصفه داخل ونصفه خارج (ستايل فخم)
   * هذا ديناميكي ويشتغل على كل الأجهزة بدون سالب -170
   */
  const avatarTop = Math.round(heroHeight - avatarSize / 2);

  /**
   * ✅ حتى ما ينضغط محتوى الهيرو على الأجهزة الصغيرة:
   * ننزل محتوى النصوص (الاسم/زر المسار) تحت الافاتار بشكل محسوب
   */
  const heroContentTopPadding = avatarTop + avatarSize + Spacing.sm;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: 0,
          paddingBottom: insets.bottom + 110,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* HERO */}
        <Animated.View entering={FadeIn.duration(280)}>
          <View style={styles.heroWrap}>
            <View
              style={[
                styles.heroCard,
                { width: heroWidth, height: heroHeight },
              ]}
            >
              {/* الخلفية */}
              <ImageBackground
                source={clinicSource}
                style={RNStyleSheet.absoluteFill}
                resizeMode="cover"
                imageStyle={{ borderRadius: BorderRadius.lg }}
              >
                {/* ✅ overlay لا يغطي النصوص ولا يمنع اللمس */}
                <View
                  pointerEvents="none"
                  style={[
                    styles.heroOverlay,
                    { backgroundColor: "rgba(0,0,0,0.45)" },
                  ]}
                />
              </ImageBackground>

              {/* ✅ مسافة آمنة تحت الهيدر/النوتش */}
              <View style={{ height: safeHeader }} />

              {/* ✅ Avatar فوق الكل (حل Honor/Xiaomi) */}
              <View
                style={[
                  styles.avatarFloating,
                  {
                    top: avatarTop,
                    width: avatarSize,
                    height: avatarSize,
                    borderRadius: 999,
                    borderColor: theme.primary + "AA",
                  },
                ]}
              >
                  <ImageBackground
                    source={doctorSource}
                    style={{ width: "100%", height: "100%" }}
                    imageStyle={{ borderRadius: 999 }}
                    resizeMode="cover"
                  />
              </View>

              {/* ✅ طبقة محتوى الهيرو فوق كلشي (حل اختفاء النصوص على Honor) */}
              <View style={styles.heroContentLayer}>
                <View
                  style={[
                    styles.heroContent,
                    {
                      paddingTop: heroContentTopPadding,
                    },
                  ]}
                >
                  <View style={[styles.heroNameRow, isRTL && styles.rtlRow]}>
                    <ThemedText
                      type="h2"
                      style={[styles.heroName, { color: "#fff" }]}
                    >
                      {name}
                    </ThemedText>
                    {doctor.isVerified ? (
                      <Feather
                        name="check-circle"
                        size={20}
                        color={theme.primary}
                      />
                    ) : null}
                  </View>

                  <ThemedText style={{ color: "rgba(255,255,255,0.85)" }}>
                    {specialty}
                  </ThemedText>

                  <View style={[styles.heroRatingRow, isRTL && styles.rtlRow]}>
                    <Feather name="star" size={16} color={theme.warning} />
                    <ThemedText
                      style={{ marginHorizontal: Spacing.xs, color: "#fff" }}
                    >
                      {doctor.rating}
                    </ThemedText>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => openWaze(doctor.lat, doctor.lng)}
                    style={[
                      styles.wazeBtn,
                      {
                        borderColor: "rgba(255,255,255,0.25)",
                        backgroundColor: "rgba(255,255,255,0.14)",
                      },
                    ]}
                  >
                    <Feather name="navigation" size={18} color="#fff" />
                    <ThemedText style={{ color: "#fff", fontWeight: "800" }}>
                      {TXT.route}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* CONTENT */}
        <Animated.View
          entering={FadeInUp.delay(120).duration(300)}
          style={styles.content}
        >
          <View style={[styles.headerSection, isRTL && styles.rtlRow]}>
            <View
              style={[
                styles.miniIcon,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="info" size={22} color={theme.primary} />
            </View>

            <View style={styles.headerInfo}>
              <ThemedText style={{ color: theme.textSecondary }}>
                {TXT.clinicInfo}
              </ThemedText>
            </View>
          </View>

          <View
            style={[
              styles.infoCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
              <Feather name="map-pin" size={20} color={theme.primary} />
              <View
                style={[styles.infoContent, isRTL && styles.infoContentRTL]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>
                  {TXT.clinic}
                </ThemedText>
                <ThemedText>{clinicAddress}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>
                  {province} - {district}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
              <Feather name="clock" size={20} color={theme.primary} />
              <View
                style={[styles.infoContent, isRTL && styles.infoContentRTL]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>
                  {TXT.workingHours}
                </ThemedText>
                <ThemedText>{doctor.workingHours}</ThemedText>
                <ThemedText style={{ color: theme.textSecondary }}>
                  {doctor.workingDays.join(" - ")}
                </ThemedText>
              </View>
            </View>

            <View style={[styles.divider, { backgroundColor: theme.border }]} />

            <View style={[styles.infoRow, isRTL && styles.rtlRow]}>
              <Feather name="navigation" size={20} color={theme.primary} />
              <View
                style={[styles.infoContent, isRTL && styles.infoContentRTL]}
              >
                <ThemedText style={{ color: theme.textSecondary }}>
                  {TXT.distance}
                </ThemedText>
                <ThemedText>
                  {doctor.distance} {TXT.km}
                </ThemedText>
              </View>
            </View>
          </View>
        </Animated.View>
      </ScrollView>

      {/* FOOTER */}
      <Animated.View
        entering={FadeInUp.delay(220).duration(300)}
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
  container: { flex: 1 },

  heroWrap: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },

  heroCard: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    position: "relative",
  },

  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
  },

  // ✅ طبقة فوق كلشي (حل Honor: zIndex وحده ما يكفي، نضيف elevation)
  heroContentLayer: {
    position: "relative",
    zIndex: 20,
    elevation: 20,
  },

  heroContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.xs,
  },

  avatarFloating: {
    position: "absolute",
    alignSelf: "center",
    borderWidth: 3,
    padding: 3,
    backgroundColor: "rgba(255,255,255,0.08)",
    zIndex: 30,
    elevation: 30,
  },

  heroNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },

  heroName: { textAlign: "center" },

  heroRatingRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  wazeBtn: {
    marginTop: Spacing.md,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },

  content: { padding: Spacing.lg },

  headerSection: {
    flexDirection: "row",
    marginBottom: Spacing.lg,
    alignItems: "center",
  },

  miniIcon: {
    width: 44,
    height: 44,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },

  headerInfo: { flex: 1 },

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

  infoContentRTL: {
    marginLeft: 0,
    marginRight: Spacing.md,
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

  bookButton: { width: "100%" },

  rtlRow: {
    flexDirection: "row-reverse",
  },
});
