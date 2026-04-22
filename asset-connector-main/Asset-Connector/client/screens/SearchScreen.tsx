import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  FlatList,
  Platform,
  Keyboard,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  SlideInRight,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";
import { doctors, pharmacies } from "@/data/mockData";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const RECENT_KEY = "@taryaq_recent_searches";
const MAX_RECENT = 8;

type Filter = "all" | "doctors" | "pharmacies";

const FILTER_LABELS: { key: Filter; label: string; icon: string }[] = [
  { key: "all", label: "الكل", icon: "grid" },
  { key: "doctors", label: "الأطباء", icon: "user-check" },
  { key: "pharmacies", label: "الصيدليات", icon: "plus-square" },
];

const QUICK_SUGGESTIONS = [
  "طب عام",
  "طب أطفال",
  "طب قلب",
  "طب أسنان",
  "بغداد",
  "البصرة",
];

function FilterChip({
  label,
  icon,
  active,
  onPress,
}: {
  label: string;
  icon: string;
  active: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPress={() => {
        scale.value = withSpring(0.92, { damping: 10 });
        setTimeout(() => { scale.value = withSpring(1); }, 80);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={animStyle}
    >
      <View
        style={[
          styles.chip,
          {
            backgroundColor: active ? theme.primary : addAlpha(theme.primary, 0.08),
            borderColor: active ? theme.primary : theme.border,
          },
        ]}
      >
        <Feather
          name={icon as any}
          size={13}
          color={active ? "#FFF" : theme.primary}
          style={{ marginLeft: 5 }}
        />
        <ThemedText
          type="small"
          style={{ color: active ? "#FFF" : theme.primary, fontWeight: "600" }}
        >
          {label}
        </ThemedText>
      </View>
    </AnimatedPressable>
  );
}

function DoctorResult({
  doctor,
  index,
  onPress,
}: {
  doctor: (typeof doctors)[0];
  index: number;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(300)}
      exiting={FadeOut.duration(150)}
    >
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={animStyle}
      >
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: isDark ? theme.card : "#FFF",
              borderColor: isDark ? theme.border : "rgba(94,223,255,0.15)",
            },
          ]}
        >
          <View style={[styles.resultAvatar, { borderColor: addAlpha(theme.primary, 0.3), backgroundColor: addAlpha(theme.primary, 0.08) }]}>
            <Feather name="user" size={26} color={theme.primary} />
            {doctor.isVerified && (
              <View style={[styles.verifiedBadge, { backgroundColor: theme.primary }]}>
                <Feather name="check" size={7} color="#FFF" />
              </View>
            )}
          </View>

          <View style={{ flex: 1, marginRight: Spacing.md }}>
            <ThemedText type="body" style={{ fontWeight: "700", textAlign: "right", color: theme.text }}>
              {doctor.nameAr}
            </ThemedText>
            <View style={styles.resultMeta}>
              <View style={[styles.metaChip, { backgroundColor: addAlpha(theme.primary, 0.1) }]}>
                <ThemedText type="caption" style={{ color: theme.primary, fontSize: 11 }}>
                  {doctor.specialtyAr}
                </ThemedText>
              </View>
              <View style={styles.metaChip2}>
                <Feather name="map-pin" size={10} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11, marginRight: 3 }}>
                  {doctor.districtAr}
                </ThemedText>
              </View>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Feather
                  key={i}
                  name="star"
                  size={10}
                  color={i <= Math.floor(doctor.rating) ? "#FFB800" : "#DDE2E8"}
                  style={{ marginLeft: 1 }}
                />
              ))}
              <ThemedText type="caption" style={{ color: "#FFB800", marginRight: 4, fontWeight: "700" }}>
                {doctor.rating}
              </ThemedText>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                • {doctor.distance} كم
              </ThemedText>
            </View>
          </View>

          <View style={[styles.resultTag, { backgroundColor: addAlpha("#4CD964", 0.12) }]}>
            <ThemedText type="caption" style={{ color: "#4CD964", fontSize: 10, fontWeight: "700" }}>
              طبيب
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function PharmacyResult({
  pharmacy,
  index,
  onPress,
}: {
  pharmacy: (typeof pharmacies)[0];
  index: number;
  onPress: () => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  const isOpen24 = pharmacy.workingHours?.includes("24");

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 40).duration(300)}
      exiting={FadeOut.duration(150)}
    >
      <AnimatedPressable
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }}
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        style={animStyle}
      >
        <View
          style={[
            styles.resultCard,
            {
              backgroundColor: isDark ? theme.card : "#FFF",
              borderColor: isDark ? theme.border : "rgba(94,223,255,0.15)",
            },
          ]}
        >
          <View style={[styles.resultLogoBox, { backgroundColor: addAlpha(theme.primary, 0.1), borderColor: addAlpha(theme.primary, 0.25) }]}>
            <Feather name="plus-square" size={26} color={theme.primary} />
          </View>

          <View style={{ flex: 1, marginRight: Spacing.md }}>
            <ThemedText type="body" style={{ fontWeight: "700", textAlign: "right", color: theme.text }}>
              {pharmacy.nameAr}
            </ThemedText>
            <View style={styles.resultMeta}>
              <View style={styles.metaChip2}>
                <Feather name="map-pin" size={10} color={theme.textSecondary} />
                <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11, marginRight: 3 }}>
                  {pharmacy.districtAr} • {pharmacy.distance} كم
                </ThemedText>
              </View>
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Feather
                  key={i}
                  name="star"
                  size={10}
                  color={i <= Math.floor(pharmacy.rating) ? "#FFB800" : "#DDE2E8"}
                  style={{ marginLeft: 1 }}
                />
              ))}
              <ThemedText type="caption" style={{ color: "#FFB800", marginRight: 4, fontWeight: "700" }}>
                {pharmacy.rating}
              </ThemedText>
              {isOpen24 && (
                <ThemedText type="caption" style={{ color: "#4CD964" }}>• مفتوح 24 ساعة</ThemedText>
              )}
              {pharmacy.hasDelivery && (
                <ThemedText type="caption" style={{ color: theme.primary }}>• توصيل</ThemedText>
              )}
            </View>
          </View>

          <View style={[styles.resultTag, { backgroundColor: addAlpha(theme.primary, 0.12) }]}>
            <ThemedText type="caption" style={{ color: theme.primary, fontSize: 10, fontWeight: "700" }}>
              صيدلية
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function EmptyState({ query }: { query: string }) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeIn.duration(300)} style={styles.emptyWrap}>
      <View style={[styles.emptyIcon, { backgroundColor: addAlpha(theme.primary, 0.08) }]}>
        <Feather name="search" size={36} color={addAlpha(theme.primary, 0.5)} />
      </View>
      <ThemedText type="h4" style={{ color: theme.text, textAlign: "center", marginBottom: 8 }}>
        لا توجد نتائج
      </ThemedText>
      <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center" }}>
        لم نجد نتائج لـ "{query}"
      </ThemedText>
    </Animated.View>
  );
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 200);
    loadRecent();
  }, []);

  const loadRecent = async () => {
    try {
      const raw = await AsyncStorage.getItem(RECENT_KEY);
      if (raw) setRecentSearches(JSON.parse(raw));
    } catch {}
  };

  const saveRecent = async (term: string) => {
    try {
      const trimmed = term.trim();
      if (!trimmed) return;
      const updated = [trimmed, ...recentSearches.filter((r) => r !== trimmed)].slice(0, MAX_RECENT);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {}
  };

  const clearRecent = async () => {
    setRecentSearches([]);
    await AsyncStorage.removeItem(RECENT_KEY);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return { doctors: [], pharmacies: [] };

    const matchedDoctors =
      filter !== "pharmacies"
        ? doctors.filter(
            (d) =>
              d.nameAr.toLowerCase().includes(q) ||
              d.specialtyAr.toLowerCase().includes(q) ||
              d.provinceAr.toLowerCase().includes(q) ||
              d.districtAr.toLowerCase().includes(q)
          )
        : [];

    const matchedPharmacies =
      filter !== "doctors"
        ? pharmacies.filter(
            (p) =>
              p.nameAr.toLowerCase().includes(q) ||
              p.districtAr.toLowerCase().includes(q) ||
              p.provinceAr.toLowerCase().includes(q)
          )
        : [];

    return { doctors: matchedDoctors, pharmacies: matchedPharmacies };
  }, [query, filter]);

  const totalResults = results.doctors.length + results.pharmacies.length;
  const hasQuery = query.trim().length > 0;

  const handleSelectSuggestion = (term: string) => {
    setQuery(term);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleSubmit = () => {
    if (query.trim()) saveRecent(query.trim());
  };

  const handleRemoveRecent = async (term: string) => {
    const updated = recentSearches.filter((r) => r !== term);
    setRecentSearches(updated);
    await AsyncStorage.setItem(RECENT_KEY, JSON.stringify(updated));
  };

  const goToDoctor = (id: string) => {
    saveRecent(query.trim());
    navigation.navigate("DoctorDetail", { doctorId: id });
  };

  const goBack = () => {
    Keyboard.dismiss();
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View
        entering={FadeInDown.duration(250)}
        style={[
          styles.header,
          {
            backgroundColor: isDark ? theme.card : "#FFF",
            paddingTop: insets.top + 8,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={goBack} style={[styles.backBtn, { backgroundColor: addAlpha(theme.primary, 0.1) }]}>
            <Feather name="arrow-right" size={20} color={theme.primary} />
          </Pressable>

          <View style={[styles.inputWrap, { backgroundColor: theme.backgroundRoot, borderColor: theme.border }]}>
            <Feather name="search" size={16} color={theme.textSecondary} style={{ marginLeft: 10 }} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSubmit}
              placeholder="ابحث عن طبيب، أو صيدلية..."
              placeholderTextColor={theme.textSecondary}
              returnKeyType="search"
              style={[styles.input, { color: theme.text }]}
              textAlign="right"
            />
            {hasQuery && (
              <Pressable onPress={() => setQuery("")} style={styles.clearBtn}>
                <View style={[styles.clearCircle, { backgroundColor: theme.textSecondary }]}>
                  <Feather name="x" size={10} color="#FFF" />
                </View>
              </Pressable>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
        >
          {FILTER_LABELS.map((f) => (
            <FilterChip
              key={f.key}
              label={f.label}
              icon={f.icon}
              active={filter === f.key}
              onPress={() => setFilter(f.key)}
            />
          ))}
        </ScrollView>
      </Animated.View>

      <ScrollView
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      >
        {!hasQuery && (
          <Animated.View entering={FadeIn.duration(300)}>
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Pressable onPress={clearRecent}>
                    <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                      مسح الكل
                    </ThemedText>
                  </Pressable>
                  <View style={styles.sectionTitleRow}>
                    <ThemedText type="body" style={{ color: theme.text, fontWeight: "700" }}>
                      عمليات البحث الأخيرة
                    </ThemedText>
                    <Feather name="clock" size={15} color={theme.textSecondary} style={{ marginRight: 6 }} />
                  </View>
                </View>
                <View style={styles.recentList}>
                  {recentSearches.map((term, i) => (
                    <Animated.View key={term} entering={SlideInRight.delay(i * 30).duration(250)}>
                      <View style={[styles.recentItem, { borderBottomColor: theme.border }]}>
                        <Pressable onPress={() => handleRemoveRecent(term)}>
                          <Feather name="x" size={14} color={theme.textSecondary} />
                        </Pressable>
                        <Pressable
                          style={{ flex: 1 }}
                          onPress={() => handleSelectSuggestion(term)}
                        >
                          <ThemedText type="body" style={{ textAlign: "right", color: theme.text }}>
                            {term}
                          </ThemedText>
                        </Pressable>
                        <Feather name="clock" size={14} color={theme.textSecondary} style={{ marginRight: 4 }} />
                      </View>
                    </Animated.View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View />
                <View style={styles.sectionTitleRow}>
                  <ThemedText type="body" style={{ color: theme.text, fontWeight: "700" }}>
                    اقتراحات سريعة
                  </ThemedText>
                  <Feather name="zap" size={15} color={theme.primary} style={{ marginRight: 6 }} />
                </View>
              </View>
              <View style={styles.tagsWrap}>
                {QUICK_SUGGESTIONS.map((s, i) => (
                  <Animated.View key={s} entering={FadeInDown.delay(i * 40).duration(250)}>
                    <Pressable
                      onPress={() => handleSelectSuggestion(s)}
                      style={[styles.suggestionTag, { backgroundColor: addAlpha(theme.primary, 0.08), borderColor: addAlpha(theme.primary, 0.2) }]}
                    >
                      <ThemedText type="small" style={{ color: theme.primary, fontWeight: "600" }}>
                        {s}
                      </ThemedText>
                    </Pressable>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>
        )}

        {hasQuery && (
          <Animated.View entering={FadeIn.duration(200)}>
            <View style={styles.resultsHeader}>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {totalResults} نتيجة
              </ThemedText>
              <ThemedText type="body" style={{ color: theme.text, fontWeight: "700" }}>
                نتائج البحث
              </ThemedText>
            </View>

            {totalResults === 0 ? (
              <EmptyState query={query} />
            ) : (
              <View style={{ paddingHorizontal: Spacing.lg }}>
                {results.doctors.length > 0 && (
                  <>
                    {filter === "all" && (
                      <View style={styles.subHeader}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {results.doctors.length} طبيب
                        </ThemedText>
                        <View style={styles.sectionTitleRow}>
                          <ThemedText type="body" style={{ fontWeight: "700", color: theme.text }}>
                            الأطباء
                          </ThemedText>
                          <Feather name="user-check" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                        </View>
                      </View>
                    )}
                    {results.doctors.map((doctor, i) => (
                      <DoctorResult
                        key={doctor.id}
                        doctor={doctor}
                        index={i}
                        onPress={() => goToDoctor(doctor.id)}
                      />
                    ))}
                  </>
                )}

                {results.pharmacies.length > 0 && (
                  <>
                    {filter === "all" && (
                      <View style={[styles.subHeader, { marginTop: results.doctors.length > 0 ? Spacing.lg : 0 }]}>
                        <ThemedText type="small" style={{ color: theme.textSecondary }}>
                          {results.pharmacies.length} صيدلية
                        </ThemedText>
                        <View style={styles.sectionTitleRow}>
                          <ThemedText type="body" style={{ fontWeight: "700", color: theme.text }}>
                            الصيدليات
                          </ThemedText>
                          <Feather name="plus-square" size={14} color={theme.primary} style={{ marginRight: 6 }} />
                        </View>
                      </View>
                    )}
                    {results.pharmacies.map((pharmacy, i) => (
                      <PharmacyResult
                        key={pharmacy.id}
                        pharmacy={pharmacy}
                        index={i}
                        onPress={() => {}}
                      />
                    ))}
                  </>
                )}
              </View>
            )}
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 4,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    height: 46,
    paddingHorizontal: 4,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingHorizontal: 8,
    fontFamily: Platform.OS === "ios" ? "Tajawal" : "Tajawal-Regular",
  },
  clearBtn: { padding: 6 },
  clearCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  chips: {
    flexDirection: "row-reverse",
    paddingTop: 2,
    paddingBottom: 6,
    gap: Spacing.sm,
  },
  chip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  section: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  sectionTitleRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  recentList: { gap: 0 },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: Spacing.sm,
  },
  tagsWrap: {
    flexDirection: "row-reverse",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  suggestionTag: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  subHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  resultCard: {
    flexDirection: "row-reverse",
    alignItems: "center",
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    shadowColor: "#1F6AE1",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  resultAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    overflow: "hidden",
    position: "relative",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 15,
    height: 15,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "#FFF",
  },
  resultLogoBox: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  resultMeta: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
    marginBottom: 4,
  },
  metaChip: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  metaChip2: {
    flexDirection: "row-reverse",
    alignItems: "center",
  },
  starRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: 3,
  },
  resultTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: "flex-start",
  },
  emptyWrap: {
    alignItems: "center",
    paddingTop: 60,
    paddingHorizontal: 40,
    gap: 12,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
});
