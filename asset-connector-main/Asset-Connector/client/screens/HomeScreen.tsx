import React, { useRef, useEffect, useState, useLayoutEffect } from "react";
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
} from "react-native-reanimated"; // ❌ شلنا FadeIn من هنا لأنه يسبب الرمشة
import { useNavigation } from "@react-navigation/native";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";
import { doctors, pharmacies, announcements } from "@/data/mockData";

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
      <ThemedText type="h3">{title}</ThemedText>
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
              style={{ color: theme.primaryDark, fontWeight: "600" }}
            >
              {viewAllLabel}
            </ThemedText>
            <Feather name="chevron-right" size={16} color={theme.primaryDark} />
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
}

function PromotedDoctorCard({
  doctor,
  onPress,
  index,
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
        // ✅ تمويه التحديد بلون الخلفية
        android_ripple={{ color: theme.backgroundRoot }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.promotedCard,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.primary + "20", theme.primaryDark + "10"]}
          style={styles.promotedIconGradient}
        >
          <Feather name="user" size={28} color={theme.primary} />
        </LinearGradient>

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

        {doctor.isVerified ? (
          <View
            style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}
          >
            <Feather name="check" size={10} color="#FFFFFF" />
          </View>
        ) : null}
      </AnimatedPressable>
    </Animated.View>
  );
}

interface PromotedPharmacyCardProps {
  pharmacy: (typeof pharmacies)[0];
  onPress: () => void;
  index: number;
}

function PromotedPharmacyCard({
  pharmacy,
  onPress,
  index,
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
        // ✅ تمويه التحديد بلون الخلفية
        android_ripple={{ color: theme.backgroundRoot }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.promotedCard,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.primaryDark + "20", theme.primary + "10"]}
          style={styles.promotedIconGradient}
        >
          <Feather name="plus-square" size={28} color={theme.primaryDark} />
        </LinearGradient>

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

        {pharmacy.hasDelivery ? (
          <View
            style={[
              styles.deliveryBadge,
              { backgroundColor: theme.success + "15" },
            ]}
          >
            <Feather name="truck" size={10} color={theme.success} />
            <ThemedText
              type="caption"
              style={{ color: theme.success, marginLeft: 4 }}
            >
              {t("delivery")}
            </ThemedText>
          </View>
        ) : null}
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
        data={doctors.slice(0, 5)}
        horizontal
        inverted={language === "ar"}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item, index }) => (
          <PromotedDoctorCard
            doctor={item}
            index={index}
            onPress={() =>
              navigation.navigate("DoctorDetail", { doctorId: item.id })
            }
          />
        )}
      />

      <View style={[styles.sectionDivider, { backgroundColor: "#909090" }]} />

      <SectionHeader
        title={t("promotedPharmacies")}
        onViewAll={() => navigation.navigate("PharmaciesTab" as never)}
        viewAllLabel={t("viewAll")}
        index={1}
      />
      <FlatList
        data={pharmacies}
        horizontal
        inverted={language === "ar"}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.horizontalList}
        renderItem={({ item, index }) => (
          <PromotedPharmacyCard
            pharmacy={item}
            index={index}
            onPress={() =>
              navigation.navigate("PharmacyDetail", { pharmacyId: item.id })
            }
          />
        )}
      />

      <View style={[styles.sectionDivider, { backgroundColor: "#909090" }]} />

      <SectionHeader
        title={t("healthEvents")}
        viewAllLabel={t("viewAll")}
        index={2}
      />
      <View style={styles.eventsContainer}>
        {announcements
          .filter((a) => a.type === "event")
          .map((event, index) => {
            const eventTitle =
              language === "ar" ? event.titleAr : event.titleEn;
            const eventDesc =
              language === "ar" ? event.descriptionAr : event.descriptionEn;

            return (
              <Animated.View
                key={event.id}
                entering={FadeInUp.delay(400 + index * 80)
                  .duration(400)
                  .springify()}
              >
                <Pressable
                  // ✅ تمويه التحديد بلون الخلفية
                  android_ripple={{ color: theme.backgroundRoot }}
                  style={[
                    styles.eventCard,
                    { backgroundColor: theme.backgroundDefault },
                  ]}
                >
                  <LinearGradient
                    colors={[theme.primary + "20", theme.primaryDark + "10"]}
                    style={styles.eventIcon}
                  >
                    <Feather name="calendar" size={20} color={theme.primary} />
                  </LinearGradient>

                  <View style={styles.eventInfo}>
                    <ThemedText
                      type="body"
                      numberOfLines={1}
                      style={{ fontWeight: "500" }}
                    >
                      {eventTitle}
                    </ThemedText>
                    <ThemedText
                      type="small"
                      style={{ color: theme.textSecondary }}
                      numberOfLines={1}
                    >
                      {eventDesc}
                    </ThemedText>
                  </View>

                  <View
                    style={[
                      styles.eventArrow,
                      { backgroundColor: theme.primary + "10" },
                    ]}
                  >
                    <Feather
                      name="chevron-right"
                      size={18}
                      color={theme.primary}
                    />
                  </View>
                </Pressable>
              </Animated.View>
            );
          })}
      </View>
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
    backgroundColor: "#F5F5F5",
  },
  viewAllButton: { flexDirection: "row", alignItems: "center" },
  horizontalList: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  promotedCard: {
    width: 150,
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginRight: Spacing.md,
    alignItems: "center",
    position: "relative",
  },
  promotedIconGradient: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
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
  deliveryBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.sm,
  },
  eventsContainer: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  eventCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.md,
  },
  eventIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  eventInfo: { flex: 1, marginRight: Spacing.md },
  eventArrow: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
  },
});
