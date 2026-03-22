import React, { useRef, useEffect, useState, useLayoutEffect, useCallback } from "react";
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
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  withSequence,
  withRepeat,
  FadeInUp,
  cancelAnimation,
} from "react-native-reanimated";
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";
import { doctors, pharmacies, announcements } from "@/data/mockData";

const HEALTH_TIPS = [
  {
    id: "1",
    icon: "droplet" as const,
    titleAr: "اشرب 8 أكواب ماء يومياً",
    titleEn: "Drink 8 glasses of water daily",
    descAr: "الماء ضروري لصحة الجسم والبشرة ويساعد على تحسين وظائف الأعضاء",
    descEn: "Water is essential for body and skin health and improves organ function",
    colors: ["#00B4DB", "#0083B0"] as [string, string],
  },
  {
    id: "2",
    icon: "moon" as const,
    titleAr: "نم 7-8 ساعات كل ليلة",
    titleEn: "Sleep 7-8 hours every night",
    descAr: "النوم الكافي يقوي المناعة ويحسن التركيز والصحة النفسية",
    descEn: "Adequate sleep strengthens immunity and improves focus and mental health",
    colors: ["#6C63FF", "#4834DF"] as [string, string],
  },
  {
    id: "3",
    icon: "heart" as const,
    titleAr: "مارس الرياضة 30 دقيقة يومياً",
    titleEn: "Exercise 30 minutes daily",
    descAr: "النشاط البدني يقلل خطر أمراض القلب ويحسن المزاج والطاقة",
    descEn: "Physical activity reduces heart disease risk and boosts mood and energy",
    colors: ["#FF6B6B", "#EE5A24"] as [string, string],
  },
  {
    id: "4",
    icon: "sun" as const,
    titleAr: "تعرض لأشعة الشمس صباحاً",
    titleEn: "Get morning sunlight exposure",
    descAr: "أشعة الشمس الصباحية تمنحك فيتامين D وتحسن النوم والمزاج",
    descEn: "Morning sunlight provides vitamin D and improves sleep and mood",
    colors: ["#F9A826", "#F39C12"] as [string, string],
  },
  {
    id: "5",
    icon: "smile" as const,
    titleAr: "تناول الفواكه والخضروات يومياً",
    titleEn: "Eat fruits and vegetables daily",
    descAr: "الفواكه والخضروات غنية بالفيتامينات والمعادن الضرورية للجسم",
    descEn: "Fruits and vegetables are rich in vitamins and minerals essential for the body",
    colors: ["#00C851", "#007E33"] as [string, string],
  },
  {
    id: "6",
    icon: "wind" as const,
    titleAr: "تنفس بعمق لتقليل التوتر",
    titleEn: "Practice deep breathing to reduce stress",
    descAr: "التنفس العميق يهدئ الأعصاب ويخفض ضغط الدم ويحسن التركيز",
    descEn: "Deep breathing calms nerves, lowers blood pressure and improves focus",
    colors: ["#A29BFE", "#6C5CE7"] as [string, string],
  },
  {
    id: "7",
    icon: "coffee" as const,
    titleAr: "قلل من تناول الكافيين",
    titleEn: "Reduce caffeine intake",
    descAr: "الإفراط في الكافيين يسبب الأرق والقلق وزيادة ضربات القلب",
    descEn: "Excess caffeine causes insomnia, anxiety and increased heart rate",
    colors: ["#E17055", "#D63031"] as [string, string],
  },
  {
    id: "8",
    icon: "eye" as const,
    titleAr: "أرح عينيك من الشاشات",
    titleEn: "Rest your eyes from screens",
    descAr: "اتبع قاعدة 20-20-20: كل 20 دقيقة انظر لمسافة 20 قدم لمدة 20 ثانية",
    descEn: "Follow the 20-20-20 rule: every 20 min look 20 feet away for 20 seconds",
    colors: ["#00CEC9", "#0984E3"] as [string, string],
  },
  {
    id: "9",
    icon: "users" as const,
    titleAr: "حافظ على علاقاتك الاجتماعية",
    titleEn: "Maintain your social relationships",
    descAr: "العلاقات الاجتماعية الصحية تقلل التوتر وتحسن الصحة النفسية",
    descEn: "Healthy social relationships reduce stress and improve mental health",
    colors: ["#FD79A8", "#E84393"] as [string, string],
  },
  {
    id: "10",
    icon: "clipboard" as const,
    titleAr: "قم بفحص طبي دوري",
    titleEn: "Get regular health checkups",
    descAr: "الفحوصات الدورية تساعد في الكشف المبكر عن الأمراض وعلاجها",
    descEn: "Regular checkups help in early disease detection and treatment",
    colors: ["#74B9FF", "#0984E3"] as [string, string],
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const SLIDER_WIDTH = SCREEN_WIDTH - Spacing.lg * 2;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface SectionHeaderProps {
  title: string;
  onViewAll?: () => void;
  viewAllLabel: string;
  index?: number;
}

function SectionHeader({
  title,
  onViewAll,
  viewAllLabel,
  index = 0,
}: SectionHeaderProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    if (onViewAll) {
      scale.value = withSequence(
        withSpring(0.95, Animation.spring.snappy),
        withSpring(1, Animation.spring.gentle),
      );
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onViewAll();
    }
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 100).duration(400)}
      style={styles.sectionHeader}
    >
      <ThemedText type="h3" style={{ color: "#FFFFFF" }}>{title}</ThemedText>
      {onViewAll ? (
        <AnimatedPressable
          // ✅ تمويه التحديد بلون الخلفية للقضاء على المربع الرمادي
          android_ripple={{ color: theme.backgroundRoot }}
          onPress={handlePress}
          style={animatedStyle}
        >
          <View style={styles.viewAllButton}>
            <ThemedText
              type="small"
              style={{ color: "#FFFFFF", fontWeight: "600" }}
            >
              {viewAllLabel}
            </ThemedText>
            <Feather name="chevron-right" size={16} color="#FFFFFF" />
          </View>
        </AnimatedPressable>
      ) : null}
    </Animated.View>
  );
}

interface PromotedDoctorCardProps {
  doctor: (typeof doctors)[0];
  onPress: () => void;
  index: number;
  rank: number;
}

function PromotedDoctorCard({
  doctor,
  onPress,
  index,
  rank,
}: PromotedDoctorCardProps) {
  const { theme } = useTheme();
  const { language } = useApp();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const name = language === "ar" ? doctor.nameAr : doctor.nameEn;
  const specialty = language === "ar" ? doctor.specialtyAr : doctor.specialtyEn;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Animation.spring.snappy);
    translateY.value = withSpring(-4, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.gentle);
    translateY.value = withSpring(0, Animation.spring.gentle);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(200 + index * 80)
        .duration(400)
        .springify()}
    >
      <AnimatedPressable
        android_ripple={{ color: "transparent" }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.promotedCardWrapper, animatedStyle]}
      >
        <LinearGradient
          colors={["#5EDFFF15", "#1F6AE115"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promotedCard}
        >
          <View style={styles.promotedCardInner}>
            <View style={styles.promotedIconWrapper}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promotedIconGradient}
              >
                <Feather name="activity" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <ThemedText type="body" style={styles.promotedName} numberOfLines={1}>
              {name}
            </ThemedText>

            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {specialty}
            </ThemedText>

            <View style={styles.promotedRating}>
              <Feather name="star" size={12} color="#FFB800" />
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginLeft: 4 }}
              >
                {doctor.rating}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.rankBadge, { backgroundColor: theme.primary }]}>
            <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {rank}
            </ThemedText>
          </View>

          {doctor.isVerified ? (
            <View
              style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}
            >
              <Feather name="check" size={10} color="#FFFFFF" />
            </View>
          ) : null}
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

interface PromotedPharmacyCardProps {
  pharmacy: (typeof pharmacies)[0];
  onPress: () => void;
  index: number;
  rank: number;
}

function PromotedPharmacyCard({
  pharmacy,
  onPress,
  index,
  rank,
}: PromotedPharmacyCardProps) {
  const { theme } = useTheme();
  const { language, t } = useApp();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const name = language === "ar" ? pharmacy.nameAr : pharmacy.nameEn;
  const district =
    language === "ar" ? pharmacy.districtAr : pharmacy.districtEn;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateY: translateY.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.95, Animation.spring.snappy);
    translateY.value = withSpring(-4, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.gentle);
    translateY.value = withSpring(0, Animation.spring.gentle);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(300 + index * 80)
        .duration(400)
        .springify()}
    >
      <AnimatedPressable
        android_ripple={{ color: "transparent" }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[styles.promotedCardWrapper, animatedStyle]}
      >
        <LinearGradient
          colors={["#5EDFFF15", "#1F6AE115"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.promotedCard}
        >
          <View style={styles.promotedCardInner}>
            <View style={styles.promotedIconWrapper}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.promotedIconGradient}
              >
                <Feather name="briefcase" size={32} color="#FFFFFF" />
              </LinearGradient>
            </View>

            <ThemedText type="body" style={styles.promotedName} numberOfLines={1}>
              {name}
            </ThemedText>

            <ThemedText
              type="small"
              style={{ color: theme.textSecondary }}
              numberOfLines={1}
            >
              {district}
            </ThemedText>

            <View style={styles.promotedRating}>
              <Feather name="star" size={12} color="#FFB800" />
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginLeft: 4 }}
              >
                {pharmacy.rating}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.rankBadge, { backgroundColor: theme.primary }]}>
            <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
              {rank}
            </ThemedText>
          </View>
        </LinearGradient>
      </AnimatedPressable>
    </Animated.View>
  );
}

interface AnnouncementSlideProps {
  item: (typeof announcements)[0];
  index: number;
  activeIndex: number;
}

function AnnouncementSlide({
  item,
  index,
  activeIndex,
}: AnnouncementSlideProps) {
  const { theme } = useTheme();
  const { language } = useApp();
  const pulseValue = useSharedValue(1);

  const title = language === "ar" ? item.titleAr : item.titleEn;
  const description =
    language === "ar" ? item.descriptionAr : item.descriptionEn;

  useEffect(() => {
    if (index === activeIndex) {
      pulseValue.value = withRepeat(
        withSequence(
          withTiming(1.02, { duration: 2000 }),
          withTiming(1, { duration: 2000 }),
        ),
        -1,
        true,
      );
    }
  }, [index, activeIndex]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: index === activeIndex ? pulseValue.value : 1 }],
  }));

  const getColors = (): [string, string] => {
    switch (item.type) {
      case "event":
        return [theme.primary, theme.primaryDark];
      case "promotion":
        return ["#FF6B9D", "#FF8E53"];
      default:
        return [theme.primary, "#4FACFE"];
    }
  };

  return (
    <Animated.View style={animatedStyle}>
      <LinearGradient
        colors={getColors()}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.slide}
      >
        <View style={styles.slidePattern}>
          {[...Array(6)].map((_, i) => (
            <View
              key={i}
              style={[
                styles.patternCircle,
                {
                  width: 80 + i * 40,
                  height: 80 + i * 40,
                  right: -40 - i * 20,
                  top: -20 + i * 10,
                  opacity: 0.1 - i * 0.015,
                },
              ]}
            />
          ))}
        </View>

        <View style={styles.slideContent}>
          <ThemedText type="h2" style={styles.slideTitle}>
            {title}
          </ThemedText>
          <ThemedText type="body" style={styles.slideDescription}>
            {description}
          </ThemedText>
        </View>

        <View style={styles.slideIcon}>
          <Feather
            name={
              item.type === "event"
                ? "calendar"
                : item.type === "promotion"
                  ? "gift"
                  : "bell"
            }
            size={64}
            color="rgba(255,255,255,0.2)"
          />
        </View>
      </LinearGradient>
    </Animated.View>
  );
}

const TIP_CARD_WIDTH = SCREEN_WIDTH;

function HealthTipCard() {
  const { theme } = useTheme();
  const { language } = useApp();
  const isRTL = language === "ar";
  const [activeTip, setActiveTip] = useState(0);
  const tipListRef = useRef<FlatList>(null);
  const pulseAnim = useSharedValue(1);

  const handleViewableTips = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveTip(viewableItems[0].index);
    }
  }).current;

  const tipViewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  useEffect(() => {
    pulseAnim.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 1800 }),
        withTiming(1, { duration: 1800 })
      ),
      -1,
      true
    );
    return () => {
      cancelAnimation(pulseAnim);
    };
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      const next = (activeTip + 1) % HEALTH_TIPS.length;
      tipListRef.current?.scrollToIndex({ index: next, animated: true });
      setActiveTip(next);
    }, 10000);
    return () => clearInterval(interval);
  }, [activeTip]);

  const pulseStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseAnim.value }],
  }));

  const renderTipItem = useCallback(({ item, index }: { item: typeof HEALTH_TIPS[0]; index: number }) => {
    const tipTitle = language === "ar" ? item.titleAr : item.titleEn;
    const desc = language === "ar" ? item.descAr : item.descEn;
    const sectionTitle = language === "ar" ? "نصائح صحية" : "Health Tips";

    return (
      <LinearGradient
        colors={item.colors}
        start={{ x: isRTL ? 1 : 0, y: 0 }}
        end={{ x: isRTL ? 0 : 1, y: 1 }}
        style={styles.tipCard}
      >
        <ThemedText
          type="small"
          style={[styles.tipSectionLabel, { textAlign: isRTL ? "right" : "left" }]}
        >
          {sectionTitle}
        </ThemedText>

        <Animated.View style={[
          styles.tipIconContainer,
          isRTL ? { alignSelf: "flex-end" } : { alignSelf: "flex-start" },
          pulseStyle,
        ]}>
          <View style={styles.tipIconCircle}>
            <Feather name={item.icon} size={32} color={item.colors[0]} />
          </View>
        </Animated.View>

        <ThemedText
          type="h3"
          style={[styles.tipTitle, { textAlign: isRTL ? "right" : "left" }]}
        >
          {tipTitle}
        </ThemedText>
        <ThemedText
          type="body"
          style={[styles.tipDesc, { textAlign: isRTL ? "right" : "left" }]}
        >
          {desc}
        </ThemedText>

        <View style={styles.tipDotsRow}>
          {HEALTH_TIPS.map((_, i) => (
            <View
              key={i}
              style={[
                styles.tipDot,
                {
                  backgroundColor:
                    i === index ? "#FFFFFF" : "rgba(255,255,255,0.35)",
                  width: i === index ? 18 : 6,
                },
              ]}
            />
          ))}
        </View>

        <View style={[
          styles.tipPattern,
          isRTL && { right: undefined, left: 0 },
        ]}>
          <View style={[
            styles.tipPatternCircle,
            isRTL
              ? { top: -20, left: -20, width: 100, height: 100 }
              : { top: -20, right: -20, width: 100, height: 100 },
          ]} />
          <View style={[
            styles.tipPatternCircle,
            isRTL
              ? { bottom: 10, left: 50, width: 50, height: 50 }
              : { bottom: 10, right: 50, width: 50, height: 50 },
          ]} />
        </View>
      </LinearGradient>
    );
  }, [language, isRTL, pulseStyle]);

  return (
    <FlatList
      ref={tipListRef}
      data={HEALTH_TIPS}
      horizontal
      pagingEnabled
      showsHorizontalScrollIndicator={false}
      onViewableItemsChanged={handleViewableTips}
      viewabilityConfig={tipViewabilityConfig}
      keyExtractor={(item) => item.id}
      renderItem={renderTipItem}
      decelerationRate="fast"
      snapToInterval={TIP_CARD_WIDTH}
      style={styles.tipContainer}
    />
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t, language } = useApp();
  const navigation = useNavigation<any>();

  const [activeSlide, setActiveSlide] = useState(0);
  const sliderRef = useRef<FlatList>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.backgroundRoot },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text },
      headerShadowVisible: false,
      headerTransparent: false,
    });
  }, [navigation, theme.backgroundRoot, theme.text]);

  useEffect(() => {
    const interval = setInterval(() => {
      const nextSlide = (activeSlide + 1) % announcements.length;
      sliderRef.current?.scrollToIndex({ index: nextSlide, animated: true });
      setActiveSlide(nextSlide);
    }, 5000);

    return () => clearInterval(interval);
  }, [activeSlide]);

  const handleViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setActiveSlide(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  return (
    <ScrollView
      // ✅ السر الأول للقضاء على الرمشة: إجبار الخلفية على لون الثيم ومنع الـ OverScroll
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
      contentContainerStyle={{
        backgroundColor: theme.backgroundRoot,
        paddingTop: Spacing.md,
        paddingBottom: tabBarHeight + insets.bottom + Spacing.xl,
      }}
      showsVerticalScrollIndicator={false}
      overScrollMode="never"
      removeClippedSubviews={false}
    >
      <View style={[styles.bannerSection, { backgroundColor: theme.bannerBackground }]}>
        <ThemedText type="h3" style={styles.announcementTitle}>{t("announcements")}</ThemedText>
        <FlatList
          ref={sliderRef}
          data={announcements}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onViewableItemsChanged={handleViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <AnnouncementSlide
              item={item}
              index={index}
              activeIndex={activeSlide}
            />
          )}
          style={styles.slider}
          contentContainerStyle={styles.sliderContent}
          decelerationRate="fast"
          snapToInterval={SLIDER_WIDTH + Spacing.md}
        />

        <View style={styles.dots}>
          {announcements.map((_, index) => (
            <Animated.View
              key={index}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    index === activeSlide ? theme.primary : theme.border,
                  width: index === activeSlide ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>
      </View>

      <SectionHeader
        title={t("promotedDoctors")}
        onViewAll={() => navigation.navigate("DoctorsTab" as never)}
        viewAllLabel={t("viewAll")}
        index={0}
      />
      <FlatList
        data={[...doctors].sort((a, b) => b.rating - a.rating).slice(0, 5)}
        horizontal
        inverted={language === "ar"}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item, index }) => (
          <PromotedDoctorCard
            doctor={item}
            index={index}
            rank={index + 1}
            onPress={() =>
              navigation.navigate("DoctorDetail", { doctorId: item.id })
            }
          />
        )}
      />

      <SectionHeader
        title={t("promotedPharmacies")}
        onViewAll={() => navigation.navigate("PharmaciesTab" as never)}
        viewAllLabel={t("viewAll")}
        index={1}
      />
      <FlatList
        data={[...pharmacies].sort((a, b) => b.rating - a.rating)}
        horizontal
        inverted={language === "ar"}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item, index }) => (
          <PromotedPharmacyCard
            pharmacy={item}
            index={index}
            rank={index + 1}
            onPress={() =>
              navigation.navigate("PharmacyDetail", { pharmacyId: item.id })
            }
          />
        )}
      />

      <HealthTipCard />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  bannerSection: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  announcementTitle: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    fontWeight: "600",
  },
  sectionDivider: {
    height: 1,
    marginVertical: Spacing.lg,
    borderRadius: 0,
  },
  slider: { marginBottom: Spacing.md },
  sliderContent: { paddingHorizontal: Spacing.lg },
  slide: {
    width: SLIDER_WIDTH,
    height: 180,
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    marginRight: Spacing.md,
    overflow: "hidden",
    position: "relative",
  },
  slidePattern: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "50%",
  },
  patternCircle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "#FFFFFF",
  },
  slideContent: { flex: 1, justifyContent: "center", maxWidth: "70%" },
  slideTitle: { color: "#FFFFFF", marginBottom: Spacing.sm, fontSize: 22 },
  slideDescription: { color: "rgba(255,255,255,0.9)", lineHeight: 22 },
  slideIcon: { position: "absolute", right: Spacing.xl, bottom: Spacing.xl },
  dots: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  dot: { height: 8, borderRadius: 4, marginHorizontal: 4 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
    marginTop: Spacing.md,
    backgroundColor: "#34495E",
  },
  viewAllButton: { flexDirection: "row", alignItems: "center" },
  horizontalList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  promotedCardWrapper: {
    width: 150,
    marginRight: Spacing.md,
  },
  promotedCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(94, 223, 255, 0.2)",
    shadowColor: "#1F6AE1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 4,
  },
  promotedCardInner: {
    alignItems: "center",
    width: "100%",
  },
  promotedIconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
    shadowColor: "#1F6AE1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  promotedIconGradient: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  promotedName: {
    textAlign: "center",
    marginBottom: Spacing.xs,
    fontWeight: "500",
  },
  promotedRating: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
  },
  verifiedBadge: {
    position: "absolute",
    top: Spacing.md,
    right: Spacing.md,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rankBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  tipContainer: {
    marginBottom: Spacing.md,
  },
  tipCard: {
    width: TIP_CARD_WIDTH,
    padding: Spacing.xl,
    paddingVertical: Spacing.xl,
    overflow: "hidden",
    position: "relative",
  },
  tipSectionLabel: {
    color: "rgba(255,255,255,0.7)",
    fontSize: 13,
    fontWeight: "600",
    marginBottom: Spacing.md,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  tipIconContainer: {
    marginBottom: Spacing.md,
  },
  tipIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  tipTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    lineHeight: 30,
  },
  tipDesc: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 15,
    lineHeight: 24,
  },
  tipDotsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: Spacing.md,
  },
  tipDot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  tipPattern: {
    position: "absolute",
    top: 0,
    right: 0,
    bottom: 0,
    width: "40%",
  },
  tipPatternCircle: {
    position: "absolute",
    borderRadius: 9999,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
});
