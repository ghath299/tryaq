import React, { useState, useMemo } from "react";
import { View, StyleSheet, FlatList, ScrollView, Pressable, Platform } from "react-native";
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
import { pharmacies, provinces } from "@/data/mockData";

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

interface PharmacyCardNewProps {
  pharmacy: (typeof pharmacies)[0];
  onPress: () => void;
  index: number;
}

function PharmacyCardNew({ pharmacy, onPress, index }: PharmacyCardNewProps) {
  const { theme } = useTheme();
  const { language, t } = useApp();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const name = language === "ar" ? pharmacy.nameAr : pharmacy.nameEn;
  const province = language === "ar" ? pharmacy.provinceAr : pharmacy.provinceEn;
  const district = language === "ar" ? pharmacy.districtAr : pharmacy.districtEn;

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
          styles.pharmacyCard,
          { backgroundColor: theme.backgroundDefault },
          shadowStyle,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={["#4CD96425", "#4CD96415"]}
          style={styles.pharmacyIcon}
        >
          <Feather name="plus-square" size={28} color="#4CD964" />
        </LinearGradient>

        <View style={styles.pharmacyInfo}>
          <View style={styles.pharmacyHeader}>
            <ThemedText type="h4" style={styles.pharmacyName} numberOfLines={1}>
              {name}
            </ThemedText>
            {pharmacy.workingHours.includes("24") ? (
              <View style={[styles.badge24h, { backgroundColor: "#4CD964" }]}>
                <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                  24h
                </ThemedText>
              </View>
            ) : null}
          </View>

          <View style={styles.pharmacyMeta}>
            <View style={styles.metaItem}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {province} - {district}
              </ThemedText>
            </View>
          </View>

          <View style={styles.pharmacyFooter}>
            {pharmacy.hasDelivery ? (
              <View style={[styles.deliveryChip, { backgroundColor: theme.primary + "15" }]}>
                <Feather name="truck" size={12} color={theme.primary} />
                <ThemedText type="caption" style={{ color: theme.primary, marginLeft: 4, fontWeight: "500" }}>
                  {t("delivery")}
                </ThemedText>
              </View>
            ) : null}

            <View style={[styles.distanceChip, { backgroundColor: theme.backgroundSecondary }]}>
              <Feather name="navigation" size={12} color={theme.textSecondary} />
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 4 }}>
                {pharmacy.distance} {t("km")}
              </ThemedText>
            </View>
          </View>
        </View>

        <View style={[styles.arrowContainer, { backgroundColor: "#4CD96415" }]}>
          <Feather name="chevron-right" size={20} color="#4CD964" />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function PharmaciesScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);

  const filteredPharmacies = useMemo(() => {
    let results = pharmacies;

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (pharmacy) =>
          pharmacy.nameAr.toLowerCase().includes(query) ||
          pharmacy.nameEn.toLowerCase().includes(query)
      );
    }

    if (selectedProvince) {
      results = results.filter((pharmacy) => pharmacy.provinceId === selectedProvince);
    }

    return results;
  }, [searchQuery, selectedProvince]);

  const handlePharmacyPress = (pharmacyId: string) => {
    navigation.navigate("PharmacyDetail" as never, { pharmacyId } as never);
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-pharmacies.png")}
      title={t("emptyPharmacies")}
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
          placeholder={t("search")}
        />
      </View>

      <Animated.View entering={FadeIn.duration(400)} style={styles.filtersContainer}>
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
        data={filteredPharmacies}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          { paddingBottom: tabBarHeight + Spacing.xl },
          filteredPharmacies.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={({ item, index }) => (
          <PharmacyCardNew
            pharmacy={item}
            onPress={() => handlePharmacyPress(item.id)}
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
  pharmacyCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  pharmacyIcon: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.lg,
  },
  pharmacyInfo: {
    flex: 1,
  },
  pharmacyHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 2,
  },
  pharmacyName: {
    flex: 1,
  },
  badge24h: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginLeft: Spacing.xs,
  },
  pharmacyMeta: {
    marginTop: Spacing.xs,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  pharmacyFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  deliveryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
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
