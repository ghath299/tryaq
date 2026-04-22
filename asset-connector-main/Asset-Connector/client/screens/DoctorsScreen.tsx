import React, { useState, useMemo, useLayoutEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  ScrollView,
  Pressable,
  Modal,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  SlideInUp,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";
import { doctors, specialties, provinces } from "@/data/mockData";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type FilterType = "specialty" | "province";

interface FilterOption {
  id: string;
  label: string;
}

function FilterButton({
  icon,
  label,
  activeLabel,
  isActive,
  count,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  activeLabel?: string;
  isActive: boolean;
  count?: number;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const progress = useSharedValue(isActive ? 1 : 0);

  // Pre-compute colors outside useAnimatedStyle (worklet can't call addAlpha)
  const colorBgActive = addAlpha(theme.primary, 0.09);
  const colorBorderActive = addAlpha(theme.primary, 0.38);

  React.useEffect(() => {
    progress.value = withTiming(isActive ? 1 : 0, { duration: 250 });
  }, [isActive]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.backgroundSecondary, colorBgActive]
    ),
    borderColor: interpolateColor(
      progress.value,
      [0, 1],
      [theme.border, colorBorderActive]
    ),
  }));

  return (
    <AnimatedPressable
      android_ripple={{ color: "transparent" }}
      onPress={() => {
        scale.value = withTiming(0.97, { duration: 80 });
        setTimeout(() => {
          scale.value = withTiming(1, { duration: 150 });
        }, 80);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.filterBtn, animatedStyle]}
    >
      <Feather
        name={icon}
        size={16}
        color={isActive ? theme.primary : theme.textSecondary}
      />
      <ThemedText
        type="small"
        style={{
          color: isActive ? theme.primary : theme.text,
          fontWeight: isActive ? "700" : "500",
          marginRight: 6,
        }}
        numberOfLines={1}
      >
        {isActive && activeLabel ? activeLabel : label}
      </ThemedText>
      {isActive && count ? (
        <Animated.View
          entering={FadeIn.duration(200)}
          style={[styles.badge, { backgroundColor: theme.primary }]}
        >
          <ThemedText type="caption" style={{ color: "#FFF", fontSize: 10, fontWeight: "700" }}>
            {count}
          </ThemedText>
        </Animated.View>
      ) : (
        <Feather
          name="chevron-down"
          size={14}
          color={isActive ? theme.primary : theme.textSecondary}
        />
      )}
    </AnimatedPressable>
  );
}

function FilterSheet({
  visible,
  title,
  options,
  selectedId,
  onSelect,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: FilterOption[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  onClose: () => void;
}) {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable style={styles.sheetOverlay} onPress={onClose}>
        <Animated.View
          entering={SlideInUp.duration(320).damping(18)}
          exiting={SlideOutDown.duration(250)}
          style={[
            styles.sheetContainer,
            {
              backgroundColor: theme.backgroundDefault,
              paddingBottom: insets.bottom + Spacing.lg,
              borderColor: theme.border,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()} style={{ flex: 1 }}>
            <View style={styles.sheetHandle}>
              <View style={[styles.handleBar, { backgroundColor: theme.border }]} />
            </View>

            <View style={[styles.sheetHeader, { borderBottomColor: theme.border }]}>
              <ThemedText type="h4" style={{ textAlign: "right", flex: 1 }}>
                {title}
              </ThemedText>
              {selectedId && (
                <Pressable
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onSelect(null);
                  }}
                  style={[styles.clearBtn, { backgroundColor: theme.error + "15" }]}
                >
                  <Feather name="x" size={14} color={theme.error} />
                  <ThemedText
                    type="caption"
                    style={{ color: theme.error, fontWeight: "600", marginRight: 4 }}
                  >
                    مسح
                  </ThemedText>
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={{ flex: 1 }}
              contentContainerStyle={styles.sheetGrid}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((option, index) => {
                const isSelected = selectedId === option.id;
                return (
                  <Animated.View
                    key={option.id}
                    entering={FadeInUp.delay(index * 30).duration(250)}
                  >
                    <Pressable
                      android_ripple={{ color: "transparent" }}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onSelect(isSelected ? null : option.id);
                        setTimeout(onClose, 200);
                      }}
                      style={({ pressed }) => [
                        styles.sheetOption,
                        {
                          backgroundColor: isSelected
                            ? theme.primary + "15"
                            : pressed
                            ? theme.backgroundSecondary
                            : theme.backgroundDefault,
                          borderColor: isSelected ? theme.primary : theme.border,
                        },
                      ]}
                    >
                      {isSelected && (
                        <View style={[styles.optionCheck, { backgroundColor: theme.primary }]}>
                          <Feather name="check" size={12} color="#FFF" />
                        </View>
                      )}
                      <ThemedText
                        type="body"
                        style={{
                          textAlign: "center",
                          fontWeight: isSelected ? "700" : "400",
                          color: isSelected ? theme.primary : theme.text,
                        }}
                      >
                        {option.label}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

function DoctorCardNew({
  doctor,
  onPress,
  index,
}: {
  doctor: (typeof doctors)[0];
  onPress: () => void;
  index: number;
}) {
  const { theme } = useTheme();
  const { t } = useApp();
  const scale = useSharedValue(1);

  const name = doctor.nameAr;
  const specialty = doctor.specialtyAr;
  const province = doctor.provinceAr;
  const district = doctor.districtAr;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.98, { duration: 80 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, { duration: 150 });
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 40).duration(300)}
    >
      <AnimatedPressable
        android_ripple={{ color: theme.backgroundRoot }}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.doctorCard,
          {
            backgroundColor: theme.backgroundDefault,
            elevation: 0,
            borderWidth: 1,
            borderColor: theme.border,
          },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[addAlpha(theme.primary, 0.15), addAlpha(theme.primaryDark, 0.08)]}
          style={[styles.doctorAvatar, { marginRight: 0, marginLeft: Spacing.lg }]}
        >
          <Feather name="user" size={28} color={theme.primary} />
        </LinearGradient>

        <View style={styles.doctorInfo}>
          <View style={[styles.doctorHeader, { flexDirection: "row-reverse" }]}>
            <ThemedText
              type="h4"
              style={[styles.doctorName, { textAlign: "right" }]}
              numberOfLines={1}
            >
              {name}
            </ThemedText>
            {doctor.isVerified && (
              <View
                style={[
                  styles.verifiedIcon,
                  { backgroundColor: theme.primary, marginLeft: 0, marginRight: Spacing.xs },
                ]}
              >
                <Feather name="check" size={10} color="#FFFFFF" />
              </View>
            )}
          </View>

          <ThemedText
            type="small"
            style={{ color: theme.primaryDark, fontWeight: "500", textAlign: "right" }}
          >
            {specialty}
          </ThemedText>

          <View style={[styles.doctorMeta, { alignItems: "flex-end" }]}>
            <View style={[styles.metaItem, { flexDirection: "row-reverse" }]}>
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, marginLeft: 0, marginRight: 4 }}
              >
                {province} - {district}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.doctorFooter, { flexDirection: "row-reverse" }]}>
            <View style={[styles.ratingContainer, { flexDirection: "row-reverse" }]}>
              <Feather name="star" size={14} color="#FFB800" />
              <ThemedText
                type="small"
                style={{ fontWeight: "600", marginLeft: 0, marginRight: 4 }}
              >
                {doctor.rating}
              </ThemedText>
            </View>

            <View
              style={[
                styles.distanceChip,
                { backgroundColor: theme.primary + "15", flexDirection: "row-reverse" },
              ]}
            >
              <Feather name="navigation" size={12} color={theme.primary} />
              <ThemedText
                type="caption"
                style={{
                  color: theme.primary,
                  marginLeft: 0,
                  marginRight: 4,
                  fontWeight: "500",
                }}
              >
                {doctor.distance} {t("km")}
              </ThemedText>
            </View>
          </View>
        </View>

        <View
          style={[
            styles.arrowContainer,
            { backgroundColor: theme.primary + "10", marginLeft: 0, marginRight: Spacing.sm },
          ]}
        >
          <Feather name="chevron-left" size={20} color={theme.primary} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function DoctorsScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t } = useApp();
  const navigation = useNavigation<any>();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [selectedProvince, setSelectedProvince] = useState<string | null>(null);
  const [activeSheet, setActiveSheet] = useState<FilterType | null>(null);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.backgroundRoot },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text },
      headerShadowVisible: false,
    });
  }, [navigation, theme]);

  const filteredDoctors = useMemo(() => {
    let results = doctors;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (doctor) =>
          doctor.nameAr.toLowerCase().includes(query),
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

  const activeFilterCount = (selectedSpecialty ? 1 : 0) + (selectedProvince ? 1 : 0);

  const activeSpecialtyIds = useMemo(
    () => new Set(doctors.map((d) => d.specialtyId)),
    [],
  );

  const specialtyOptions: FilterOption[] = specialties
    .filter((s) => activeSpecialtyIds.has(s.id))
    .map((s) => ({ id: s.id, label: s.nameAr }));

  const provinceOptions: FilterOption[] = provinces.map((p) => ({
    id: p.id,
    label: p.nameAr,
  }));

  const selectedSpecialtyLabel = selectedSpecialty
    ? specialties.find((s) => s.id === selectedSpecialty)?.nameAr
    : undefined;

  const selectedProvinceLabel = selectedProvince
    ? provinces.find((p) => p.id === selectedProvince)?.nameAr
    : undefined;

  const handleDoctorPress = (doctorId: string) => {
    navigation.navigate("DoctorDetail" as never, { doctorId } as never);
  };

  const handleClearAll = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedSpecialty(null);
    setSelectedProvince(null);
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
      <StatusBar style="auto" />

      <View
        style={[
          styles.searchContainer,
          { paddingTop: Spacing.md, backgroundColor: theme.backgroundRoot },
        ]}
      >
        <GlowingSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t("searchDoctorName")}
        />
      </View>

      <View style={styles.filterBar}>
        <View style={styles.filterBtnRow}>
          <FilterButton
            icon="grid"
            label="التخصص"
            activeLabel={selectedSpecialtyLabel}
            isActive={!!selectedSpecialty}
            onPress={() => setActiveSheet("specialty")}
          />
          <FilterButton
            icon="map-pin"
            label="المحافظة"
            activeLabel={selectedProvinceLabel}
            isActive={!!selectedProvince}
            onPress={() => setActiveSheet("province")}
          />
        </View>

        {activeFilterCount > 0 && (
          <Animated.View entering={FadeIn.duration(200)}>
            <Pressable
              android_ripple={{ color: "transparent" }}
              onPress={handleClearAll}
              style={[styles.clearAllBtn, { backgroundColor: theme.error + "12" }]}
            >
              <Feather name="x-circle" size={14} color={theme.error} />
              <ThemedText
                type="caption"
                style={{ color: theme.error, fontWeight: "600", marginRight: 4 }}
              >
                مسح الكل ({activeFilterCount})
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}
      </View>

      <FlatList
        data={filteredDoctors}
        keyExtractor={(item) => item.id}
        style={{ flex: 1 }}
        overScrollMode="never"
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

      <FilterSheet
        visible={activeSheet === "specialty"}
        title="اختر التخصص"
        options={specialtyOptions}
        selectedId={selectedSpecialty}
        onSelect={setSelectedSpecialty}
        onClose={() => setActiveSheet(null)}
      />

      <FilterSheet
        visible={activeSheet === "province"}
        title="اختر المحافظة"
        options={provinceOptions}
        selectedId={selectedProvince}
        onSelect={setSelectedProvince}
        onClose={() => setActiveSheet(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  searchContainer: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm },
  filterBar: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterBtnRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
    flex: 1,
  },
  filterBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 2,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    gap: 4,
    flex: 1,
  },
  badge: {
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  clearAllBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
    gap: 2,
  },
  sheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  sheetContainer: {
    borderTopLeftRadius: BorderRadius.xl + 4,
    borderTopRightRadius: BorderRadius.xl + 4,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "82%",
  },
  sheetHandle: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  sheetHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  clearBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: Spacing.xs + 2,
    borderRadius: BorderRadius.full,
    gap: 2,
  },
  sheetGrid: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
    paddingBottom: Spacing.lg,
  },
  sheetOption: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    minWidth: (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm * 2) / 3,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  optionCheck: {
    position: "absolute",
    top: -6,
    left: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm },
  emptyList: { flex: 1 },
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
  doctorInfo: { flex: 1 },
  doctorHeader: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  doctorName: { flex: 1 },
  verifiedIcon: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.xs,
  },
  doctorMeta: { marginTop: Spacing.xs },
  metaItem: { flexDirection: "row", alignItems: "center" },
  doctorFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.sm,
    gap: Spacing.md,
  },
  ratingContainer: { flexDirection: "row", alignItems: "center" },
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
