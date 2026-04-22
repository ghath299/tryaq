import React, {
  useRef,
  useEffect,
  useState,
  useLayoutEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Pressable,
  Dimensions,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeIn,
  FadeInUp,
  cancelAnimation,
} from "react-native-reanimated";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";
import { doctors, pharmacies } from "@/data/mockData";
import {
  getUnreadCount,
  useNotificationSetup,
  requestNotificationPermission,
} from "@/hooks/useNotifications";
import EmergencyModal from "@/components/EmergencyModal";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const PROMO_SLIDES = [
  {
    id: "1",
    title: "احجز موعدك الأول",
    highlight: "بخصم 20%",
    sub: "خصومات وعروض حصرية",
    colors: ["#4DC9C9", "#3AAFAF"] as [string, string],
  },
  {
    id: "2",
    title: "أطباء متخصصون",
    highlight: "في انتظارك",
    sub: "استشارة طبية موثوقة وسريعة",
    colors: ["#5EDFFF", "#1F6AE1"] as [string, string],
  },
  {
    id: "3",
    title: "صيدليات قريبة منك",
    highlight: "24 ساعة",
    sub: "ابحث عن دوائك بسهولة",
    colors: ["#43C6AC", "#1F6AE1"] as [string, string],
  },
];

const HEALTH_TIPS = [
  "شرب كمية كافية من الماء يومياً يحسن وظائف الجسم ويحافظ على صحتك.",
  "النوم لساعات كافية يقوي جهاز المناعة ويحسن التركيز.",
  "ممارسة الرياضة 30 دقيقة يومياً تقلل خطر أمراض القلب.",
  "تناول الفواكه والخضروات يومياً يمنحك الفيتامينات والمعادن الضرورية.",
  "تجنب التدخين يحمي رئتيك ويحسن صحتك العامة بشكل كبير.",
];

function SearchBar({ onPress }: { onPress: () => void }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.searchWrap}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={animStyle}
      >
        <View style={[styles.searchBox, { backgroundColor: isDark ? theme.card : "#FFFFFF", borderColor: theme.border }]}>
          <Feather name="search" size={18} color={theme.textSecondary} style={{ marginLeft: 12 }} />
          <View style={[styles.searchInput, { flex: 1 }]}>
            <ThemedText style={{ color: theme.textSecondary, textAlign: "right", fontSize: 14 }}>
              ابحث عن طبيب، دواء، أو صيدلية...
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function PromoSlide({ item, active }: { item: typeof PROMO_SLIDES[0]; active: boolean }) {
  const scale = useSharedValue(active ? 1 : 1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  useEffect(() => {
    if (active) {
      scale.value = withRepeat(
        withSequence(withTiming(1.015, { duration: 2500 }), withTiming(1, { duration: 2500 })),
        -1,
        true
      );
    } else {
      cancelAnimation(scale);
      scale.value = withTiming(1, { duration: 200 });
    }
  }, [active]);

  return (
    <Animated.View style={[{ width: SCREEN_WIDTH - Spacing.lg * 2 }, animStyle]}>
      <LinearGradient
        colors={item.colors}
        start={{ x: 1, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.promoCard}
      >
        <View style={styles.promoBubble1} />
        <View style={styles.promoBubble2} />

        <View style={styles.promoContent}>
          <ThemedText style={styles.promoTitle}>{item.title}</ThemedText>
          <ThemedText style={styles.promoHighlight}>{item.highlight}</ThemedText>
          <ThemedText style={styles.promoSub}>{item.sub}</ThemedText>
        </View>

        <View style={styles.promoImageWrap}>
          <View style={styles.promoAvatarCircle}>
            <Feather name="user" size={52} color="rgba(255,255,255,0.85)" />
          </View>
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

function SectionRow({ title, onViewAll }: { title: string; onViewAll?: () => void }) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const press = () => {
    if (!onViewAll) return;
    scale.value = withSequence(withSpring(0.9), withSpring(1));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onViewAll();
  };

  return (
    <View style={styles.sectionRow}>
      {onViewAll ? (
        <AnimatedPressable onPress={press} style={animStyle}>
          <View style={styles.viewAllRow}>
            <ThemedText type="small" style={[styles.viewAllText, { color: theme.primary }]}>
              عرض الكل
            </ThemedText>
            <Feather name="chevron-left" size={14} color={theme.primary} />
          </View>
        </AnimatedPressable>
      ) : <View />}
      <ThemedText type="h3" style={[styles.sectionTitle, { color: theme.text }]}>
        {title}
      </ThemedText>
    </View>
  );
}

function StarRow({ rating }: { rating: number }) {
  const full = Math.floor(rating);
  return (
    <View style={styles.starRow}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Feather
          key={i}
          name="star"
          size={11}
          color={i <= full ? "#FFB800" : "#DDE2E8"}
          style={{ marginRight: 1 }}
        />
      ))}
      <ThemedText style={styles.ratingText}>{rating}</ThemedText>
    </View>
  );
}

function DoctorCard({ doctor, onPress, index }: { doctor: typeof doctors[0]; onPress: () => void; index: number }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  return (
    <Animated.View entering={FadeInUp.delay(100 + index * 60).duration(400)}>
      <AnimatedPressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.95); translateY.value = withSpring(-3); }}
        onPressOut={() => { scale.value = withSpring(1); translateY.value = withSpring(0); }}
        style={[styles.doctorCard, animStyle, {
          backgroundColor: isDark ? theme.card : "#FFFFFF",
          shadowColor: isDark ? "transparent" : "#1F6AE1",
          borderColor: isDark ? theme.border : "rgba(94,223,255,0.15)",
        }]}
      >
        <View style={[styles.avatarWrap, { borderColor: addAlpha(theme.primary, 0.3), backgroundColor: addAlpha(theme.primary, 0.07) }]}>
          <Feather name="user" size={32} color={theme.primary} />
          {doctor.isVerified && (
            <View style={[styles.verifiedDot, { backgroundColor: theme.primary }]}>
              <Feather name="check" size={7} color="#FFF" />
            </View>
          )}
        </View>
        <ThemedText type="small" style={[styles.doctorName, { color: theme.text }]} numberOfLines={1}>
          {doctor.nameAr}
        </ThemedText>
        <ThemedText type="caption" style={[styles.doctorSpecialty, { color: theme.textSecondary }]} numberOfLines={1}>
          {doctor.specialtyAr}
        </ThemedText>
        <StarRow rating={doctor.rating} />
      </AnimatedPressable>
    </Animated.View>
  );
}

function PharmacyCard({ pharmacy, onPress, index }: { pharmacy: typeof pharmacies[0]; onPress: () => void; index: number }) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const isOpen24 = pharmacy.workingHours?.includes("24");

  return (
    <Animated.View entering={FadeInUp.delay(150 + index * 60).duration(400)}>
      <AnimatedPressable
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
        onPressIn={() => { scale.value = withSpring(0.95); translateY.value = withSpring(-3); }}
        onPressOut={() => { scale.value = withSpring(1); translateY.value = withSpring(0); }}
        style={[styles.pharmacyCard, animStyle, {
          backgroundColor: isDark ? theme.card : "#FFFFFF",
          shadowColor: isDark ? "transparent" : "#1F6AE1",
          borderColor: isDark ? theme.border : "rgba(94,223,255,0.15)",
        }]}
      >
        <View style={[styles.pharmacyLogoWrap, { borderColor: addAlpha(theme.primary, 0.25), backgroundColor: addAlpha(theme.primary, 0.06) }]}>
          <LinearGradient
            colors={[addAlpha(theme.primary, 0.15), addAlpha(theme.primaryDark, 0.1)]}
            style={styles.pharmacyLogoGrad}
          >
            <Feather name="plus-square" size={28} color={theme.primary} />
          </LinearGradient>
        </View>
        <ThemedText type="small" style={[styles.pharmacyName, { color: theme.text }]} numberOfLines={1}>
          {pharmacy.nameAr}
        </ThemedText>
        <View style={[styles.pharmacyBadge, { backgroundColor: addAlpha(theme.primary, 0.12) }]}>
          <ThemedText type="caption" style={{ color: theme.primary, fontSize: 10, fontWeight: "600" }}>
            قريب
          </ThemedText>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function HealthTipBanner() {
  const { theme, isDark } = useTheme();
  const [active, setActive] = useState(0);

  useEffect(() => {
    const t = setInterval(() => setActive((p) => (p + 1) % HEALTH_TIPS.length), 6000);
    return () => clearInterval(t);
  }, []);

  return (
    <Animated.View entering={FadeInUp.delay(400).duration(400)} style={[styles.tipBanner, {
      backgroundColor: isDark ? theme.card : "#FFFFFF",
      borderColor: isDark ? theme.border : "rgba(94,223,255,0.2)",
      shadowColor: isDark ? "transparent" : "#1F6AE1",
    }]}>
      <View style={styles.tipHeader}>
        <Feather name="chevron-left" size={16} color={theme.primary} />
        <ThemedText type="body" style={[styles.tipTitle, { color: theme.text }]}>
          نصائح طبية اليوم
        </ThemedText>
      </View>
      <ThemedText type="body" style={[styles.tipText, { color: theme.textSecondary }]}>
        {HEALTH_TIPS[active]}
      </ThemedText>
      <View style={styles.tipDots}>
        {HEALTH_TIPS.map((_, i) => (
          <View
            key={i}
            style={[styles.tipDot, {
              backgroundColor: i === active ? theme.primary : theme.border,
              width: i === active ? 16 : 6,
            }]}
          />
        ))}
      </View>
    </Animated.View>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, isDark } = useTheme();
  const { t } = useApp();
  const navigation = useNavigation<any>();

  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);
  const [badgeCount, setBadgeCount] = useState(0);
  const [emergencyVisible, setEmergencyVisible] = useState(false);

  useNotificationSetup();

  useFocusEffect(
    useCallback(() => {
      getUnreadCount().then(setBadgeCount);
      if (Platform.OS !== "web") {
        requestNotificationPermission();
      }
    }, [])
  );

  const handleBellPress = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate("Notifications" as never);
  }, [navigation]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: false,
    });
  }, [navigation]);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeSlide + 1) % PROMO_SLIDES.length;
      sliderRef.current?.scrollToOffset({ offset: next * (SCREEN_WIDTH - Spacing.lg), animated: true });
      setActiveSlide(next);
    }, 5000);
    return () => clearInterval(interval);
  }, [activeSlide]);

  const handleViewable = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) setActiveSlide(viewableItems[0].index);
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  const sortedDoctors = [...doctors].sort((a, b) => b.rating - a.rating).slice(0, 6);
  const sortedPharmacies = [...pharmacies].sort((a, b) => b.rating - a.rating).slice(0, 6);

  return (
    <View style={{ flex: 1, backgroundColor: theme.backgroundRoot }}>
      <LinearGradient
        colors={isDark
          ? [theme.backgroundRoot, theme.backgroundRoot]
          : ["#E8F8FB", theme.backgroundRoot]
        }
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={handleBellPress}
            hitSlop={10}
            style={[styles.bellBtn, { backgroundColor: addAlpha(theme.primary, 0.1) }]}
          >
            <Feather name="bell" size={20} color={theme.primary} />
            {badgeCount > 0 && (
              <Animated.View
                entering={FadeIn.duration(200)}
                style={[styles.bellBadge, { backgroundColor: "#EF4444" }]}
              >
                <ThemedText style={styles.bellBadgeText}>
                  {badgeCount > 9 ? "9+" : String(badgeCount)}
                </ThemedText>
              </Animated.View>
            )}
          </Pressable>
          <View style={styles.headerCenter}>
            <ThemedText type="small" style={{ color: theme.textSecondary, textAlign: "center" }}>
              مرحباً بك في
            </ThemedText>
            <ThemedText type="h4" style={{ color: theme.text, textAlign: "center", fontWeight: "700" }}>
              ترياق
            </ThemedText>
          </View>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
              setEmergencyVisible(true);
            }}
            hitSlop={10}
            style={[styles.logoBox, { backgroundColor: addAlpha("#EF4444", 0.12) }]}
          >
            <FontAwesome5 name="ambulance" size={17} color="#EF4444" />
          </Pressable>
        </View>
        <SearchBar onPress={() => navigation.navigate("Search" as never)} />
      </LinearGradient>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingBottom: tabBarHeight + insets.bottom + Spacing.xl,
          paddingTop: Spacing.md,
        }}
        showsVerticalScrollIndicator={false}
        overScrollMode="never"
      >
        <Animated.View entering={FadeIn.duration(500)} style={styles.promoSection}>
          <FlatList
            ref={sliderRef}
            data={PROMO_SLIDES}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={handleViewable}
            viewabilityConfig={viewabilityConfig}
            keyExtractor={(item) => item.id}
            contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.lg }}
            decelerationRate="fast"
            snapToInterval={SCREEN_WIDTH - Spacing.lg * 2 + Spacing.lg}
            renderItem={({ item, index }) => (
              <PromoSlide item={item} active={index === activeSlide} />
            )}
          />
          <View style={styles.dots}>
            {PROMO_SLIDES.map((_, i) => (
              <View
                key={i}
                style={[styles.dot, {
                  backgroundColor: i === activeSlide ? theme.primary : theme.border,
                  width: i === activeSlide ? 20 : 7,
                }]}
              />
            ))}
          </View>
        </Animated.View>

        <SectionRow
          title={t("promotedDoctors")}
          onViewAll={() => navigation.navigate("DoctorsTab" as never)}
        />
        <FlatList
          data={sortedDoctors}
          horizontal
          inverted
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.hList}
          renderItem={({ item, index }) => (
            <DoctorCard
              doctor={item}
              index={index}
              onPress={() => navigation.navigate("DoctorDetail", { doctorId: item.id })}
            />
          )}
        />

        <SectionRow title={t("promotedPharmacies")} />
        <View style={styles.comingSoonBox}>
          <ThemedText
            type="body"
            style={[styles.comingSoonText, { color: theme.textSecondary }]}
          >
            ستتوفر هذه الخدمة قريباً
          </ThemedText>
        </View>

        <View style={styles.tipSection}>
          <HealthTipBanner />
        </View>
      </ScrollView>

      <EmergencyModal
        visible={emergencyVisible}
        onClose={() => setEmergencyVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  headerCenter: { flex: 1, alignItems: "center" },
  logoBox: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  bellBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -4,
    left: -4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "transparent",
  },
  bellBadgeText: {
    color: "#FFF",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
  searchWrap: { marginBottom: 4 },
  searchBox: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 48,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 10,
    fontFamily: Platform.OS === "ios" ? "Tajawal" : "Tajawal-Regular",
  },
  promoSection: { marginBottom: Spacing.md },
  promoCard: {
    borderRadius: 20,
    height: 160,
    flexDirection: "row-reverse",
    overflow: "hidden",
    position: "relative",
  },
  promoBubble1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.12)",
    top: -40,
    left: -30,
  },
  promoBubble2: {
    position: "absolute",
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255,255,255,0.08)",
    bottom: -20,
    left: 60,
  },
  promoContent: {
    flex: 1,
    justifyContent: "center",
    paddingRight: Spacing.xl,
    paddingLeft: Spacing.sm,
    paddingVertical: Spacing.lg,
  },
  promoTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "right",
    lineHeight: 22,
  },
  promoHighlight: {
    color: "#FFFFFF",
    fontSize: 26,
    fontWeight: "900",
    textAlign: "right",
    lineHeight: 34,
  },
  promoSub: {
    color: "rgba(255,255,255,0.85)",
    fontSize: 12,
    textAlign: "right",
    marginTop: 2,
  },
  promoImageWrap: {
    width: 120,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 0,
  },
  promoAvatarCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  promoImage: {
    width: 110,
    height: 150,
    borderRadius: 12,
  },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
    gap: 5,
  },
  dot: { height: 7, borderRadius: 3.5 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  sectionTitle: { fontWeight: "700", textAlign: "right" },
  viewAllRow: { flexDirection: "row", alignItems: "center", gap: 2 },
  viewAllText: { fontWeight: "600", fontSize: 13 },
  hList: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  doctorCard: {
    width: 120,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  avatarWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2.5,
    overflow: "hidden",
    marginBottom: Spacing.sm,
    position: "relative",
  },
  avatarImg: { width: "100%", height: "100%" },
  verifiedDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  doctorName: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 2,
  },
  doctorSpecialty: {
    textAlign: "center",
    fontSize: 11,
    marginBottom: 5,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  ratingText: {
    fontSize: 10,
    color: "#FFB800",
    fontWeight: "600",
    marginLeft: 3,
  },
  pharmacyCard: {
    width: 120,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: "center",
    borderWidth: 1,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  pharmacyLogoWrap: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 2,
    overflow: "hidden",
    marginBottom: Spacing.sm,
  },
  pharmacyLogoGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pharmacyName: {
    fontWeight: "600",
    textAlign: "center",
    fontSize: 12,
    marginBottom: 6,
  },
  pharmacyBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  tipSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  tipBanner: {
    borderRadius: 16,
    padding: Spacing.lg,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  tipHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  tipTitle: {
    fontWeight: "700",
    textAlign: "right",
  },
  tipText: {
    textAlign: "right",
    lineHeight: 24,
    fontSize: 14,
  },
  tipDots: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: Spacing.md,
    gap: 5,
  },
  tipDot: { height: 6, borderRadius: 3 },
});
