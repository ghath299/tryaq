import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, ScrollView, Platform, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInRight,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";
import { doctors, specialties, provinces } from "@/data/mockData";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FilterChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  index: number;
}

function FilterChip({ label, selected, onPress, index }: FilterChipProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    scale.value = withSpring(0.95, Animation.spring.snappy);
    setTimeout(() => {
      scale.value = withSpring(1, Animation.spring.gentle);
    }, 100);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
      <AnimatedPressable onPress={handlePress} style={animatedStyle}>
        {selected ? (
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.chipGradient}
          >
            <ThemedText type="small" style={{ color: "#FFFFFF", fontWeight: "500" }}>
              {label}
            </ThemedText>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.chip,
              { backgroundColor: theme.backgroundSecondary, borderColor: theme.border },
            ]}
          >
            <ThemedText type="small" style={{ color: theme.text }}>
              {label}
            </ThemedText>
          </View>
        )}
      </AnimatedPressable>
    </Animated.View>
  );
}

interface DoctorCardNewProps {
  doctor: (typeof doctors)[0];
  onPress: () => void;
  index: number;
}

function DoctorCardNew({ doctor, onPress, index }: DoctorCardNewProps) {
  const { theme } = useTheme();
  const { language, t } = useApp();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const name = language === "ar" ? doctor.nameAr : doctor.nameEn;
  const specialty = language === "ar" ? doctor.specialtyAr : doctor.specialtyEn;
  const province = language === "ar" ? doctor.provinceAr : doctor.provinceEn;
  const district = language === "ar" ? doctor.districtAr : doctor.districtEn;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, Animation.spring.snappy);
    translateY.value = withSpring(-2, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.gentle);
    translateY.value = withSpring(0, Animation.spring.gentle);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
    },
    android: { elevation: 3 },
    default: {},
  });

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(400).springify()}>
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.doctorCard,
          { backgroundColor: theme.backgroundDefault },
          shadowStyle,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.primary + "25", theme.primaryDark + "15"]}
          style={[styles.doctorAvatar, language === "ar" && { marginRight: 0, marginLeft: Spacing.lg }]}
        >
          <Feather name="user" size={28} color={theme.primary} />
        </LinearGradient>

        <View style={styles.doctorInfo}>
          <View style={[styles.doctorHeader, language === "ar" && { flexDirection: "row-reverse" }]}>
            <ThemedText type="h4" style={[styles.doctorName, language === "ar" && { textAlign: "right" }]} numberOfLines={1}>
              {name}
            </ThemedText>
            {doctor.isVerified ? (
              <View style={[styles.verifiedIcon, { backgroundColor: theme.primary }, language === "ar" && { marginLeft: 0, marginRight: Spacing.xs }]}>
                <Feather name="check" size={10} color="#FFFFFF" />
              </View>
            ) : null}
          </View>

          <ThemedText type="small" style={[{ color: theme.primaryDark, fontWeight: "500" }, language === "ar" && { textAlign: "right" }]}>
            {specialty}
          </ThemedText>

          <View style={[styles.doctorMeta, language === "ar" && { alignItems: "flex-end" }]}>
            <View style={[styles.metaItem, language === "ar" && { flexDirection: "row-reverse" }]}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={[{ color: theme.textSecondary, marginLeft: 4 }, language === "ar" && { marginLeft: 0, marginRight: 4 }]}>
                {province} - {district}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.doctorFooter, language === "ar" && { flexDirection: "row-reverse" }]}>
            <View style={[styles.ratingContainer, language === "ar" && { flexDirection: "row-reverse" }]}>
              <Feather name="star" size={14} color="#FFB800" />
              <ThemedText type="small" style={[{ fontWeight: "600", marginLeft: 4 }, language === "ar" && { marginLeft: 0, marginRight: 4 }]}>
                {doctor.rating}
              </ThemedText>
            </View>

            <View style={[styles.distanceChip, { backgroundColor: theme.primary + "15" }, language === "ar" && { flexDirection: "row-reverse" }]}>
              <Feather name="navigation" size={12} color={theme.primary} />
              <ThemedText type="caption" style={[{ color: theme.primary, marginLeft: 4, fontWeight: "500" }, language === "ar" && { marginLeft: 0, marginRight: 4 }]}>
                {doctor.distance} {t("km")}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.arrowContainer, { backgroundColor: theme.primary + "10" }, language === "ar" && { marginLeft: 0, marginRight: Spacing.sm }]}>
          <Feather name={language === "ar" ? "chevron-left" : "chevron-right"} size={20} color={theme.primary} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const filteredDoctors = useMemo(() => {
    let results = doctors;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (doctor) =>
          doctor.nameAr.toLowerCase().includes(query) ||
          doctor.nameEn.toLowerCase().includes(query)
      );
    }

    if (selectedSpecialty) {
      results = results.filter((doctor) => doctor.specialtyId === selectedSpecialty);
    }

    if (selectedProvince) {
      results = results.filter((doctor) => doctor.provinceId === selectedProvince);
    }

    return results;
  }, [searchQuery, selectedSpecialty, selectedProvince]);

  const handleDoctorPress = (doctorId: string) => {
    navigation.navigate("DoctorDetail" as never, { doctorId } as never);
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-doctors.png")}
      title={t("emptyDoctors")}
      description={t("noResults")}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View
        style={[
          styles.searchContainer,
          {
            paddingTop: Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <GlowingSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("searchDoctorName")}
        />
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={styles.filtersContainer}>
        <ThemedText type="caption" style={[styles.filterLabel, { color: theme.textSecondary }]}>
          {t("selectSpecialty")}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {specialties.map((specialty, index) => (
            <FilterChip
              key={specialty.id}
              label={language === "ar" ? specialty.nameAr : specialty.nameEn}
              selected={selectedSpecialty === specialty.id}
              onPress={() =>
                setSelectedSpecialty(
                  selectedSpecialty === specialty.id ? null : specialty.id
                )
              }
              index={index}
            />
          ))}
        </ScrollView>

        <ThemedText type="caption" style={[styles.filterLabel, { color: theme.textSecondary }]}>
          {t("selectProvince")}
        </ThemedText>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterScroll}
        >
          {provinces.map((province, index) => (
            <FilterChip
              key={province.id}
              label={language === "ar" ? province.nameAr : province.nameEn}
              selected={selectedProvince === province.id}
              onPress={() =>
                setSelectedProvince(
                  selectedProvince === province.id ? null : province.id
                )
              }
              index={index}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
          filteredDoctors.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <DoctorCardNew
            doctor={item}
            onPress={() => handleDoctorPress(item.id)}
            index={index}
          />
        )}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  filtersContainer: {
    paddingBottom: Spacing.sm,
  },
  filterLabel: {
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.xs,
    marginTop: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
    fontSize: 11,
    fontWeight: "600",
  },
  filterScroll: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  chip: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  chipGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  emptyList: {
    flex: 1,
  },
  doctorCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  doctorAvatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  doctorInfo: {
    flex: 1,
  },
  doctorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  doctorName: {
    flex: 1,
  },
  verifiedIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  doctorMeta: {
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  doctorFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  distanceChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  arrowContainer: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
});
