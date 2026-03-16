import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { useNavigation, useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { pharmacies as allPharmacies } from "@/data/mockData";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const isRTL = (lang: string) => lang === "ar";

type PharmacyLocal = (typeof allPharmacies)[number];

type SortMode = "nearest" | "alphabetical";

function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const toRad = (v: number) => (v * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export default function PharmacyPickerScreen() {
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "PharmacyPicker">>();

  const pharmacyIds: string[] | undefined = route.params?.pharmacyIds;
  const medicineName: string | undefined = route.params?.medicineName;

  const [searchText, setSearchText] = useState("");
  const [sortMode, setSortMode] = useState<SortMode>("nearest");
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationLoading, setLocationLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status === "granted") {
          const loc = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          setUserLocation({
            lat: loc.coords.latitude,
            lng: loc.coords.longitude,
          });
        }
      } catch {
        // location not available
      } finally {
        setLocationLoading(false);
      }
    })();
  }, []);

  const sourcePharmacies = useMemo(() => {
    if (pharmacyIds && pharmacyIds.length > 0) {
      return allPharmacies.filter((p) => pharmacyIds.includes(p.id));
    }
    return allPharmacies;
  }, [pharmacyIds]);

  const filteredAndSorted = useMemo(() => {
    let list = [...sourcePharmacies];

    if (searchText.trim()) {
      const q = searchText.trim().toLowerCase();
      list = list.filter(
        (p) =>
          p.nameAr.toLowerCase().includes(q) ||
          p.nameEn.toLowerCase().includes(q) ||
          p.address.toLowerCase().includes(q) ||
          (p.addressEn && p.addressEn.toLowerCase().includes(q)),
      );
    }

    if (sortMode === "nearest" && userLocation) {
      list.sort(
        (a, b) =>
          haversineKm(userLocation.lat, userLocation.lng, a.lat, a.lng) -
          haversineKm(userLocation.lat, userLocation.lng, b.lat, b.lng),
      );
    } else {
      list.sort((a, b) => {
        const nameA = language === "ar" ? a.nameAr : a.nameEn;
        const nameB = language === "ar" ? b.nameAr : b.nameEn;
        return nameA.localeCompare(nameB);
      });
    }

    return list;
  }, [sourcePharmacies, searchText, sortMode, userLocation, language]);

  const getDistance = useCallback(
    (pharmacy: PharmacyLocal) => {
      if (!userLocation) return null;
      return haversineKm(
        userLocation.lat,
        userLocation.lng,
        pharmacy.lat,
        pharmacy.lng,
      );
    },
    [userLocation],
  );

  const renderPharmacy = useCallback(
    ({ item, index }: { item: PharmacyLocal; index: number }) => {
      const rtl = isRTL(language);
      const name = language === "ar" ? item.nameAr : item.nameEn;
      const address = language === "ar" ? item.address : item.addressEn;
      const province = language === "ar" ? item.provinceAr : item.provinceEn;
      const dist = getDistance(item);

      const handleOpenWaze = async (lat: number, lng: number) => {
        const dlink = `waze://?ll=${lat},${lng}&navigate=yes`;
        const wlink = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
        try {
          const supported = await Linking.canOpenURL(dlink);
          if (supported) {
            await Linking.openURL(dlink);
          } else {
            await Linking.openURL(wlink);
          }
        } catch (err) {
          console.error("Failed to open Waze:", err);
          await Linking.openURL(wlink);
        }
      };

      return (
        <Animated.View entering={FadeInUp.delay(index * 60).duration(400)}>
          <View
            style={[
              styles.card,
              { backgroundColor: theme.card, ...Shadows.medium },
            ]}
          >
            <View
              style={[
                styles.cardHeader,
                rtl && { flexDirection: "row-reverse" },
              ]}
            >
              <View
                style={[
                  styles.pharmacyIcon,
                  { backgroundColor: theme.primary + "20" },
                ]}
              >
                <Feather name="plus-circle" size={24} color={theme.primary} />
              </View>
              <View style={styles.cardInfo}>
                <ThemedText
                  type="h4"
                  style={{
                    fontWeight: "700",
                    textAlign: rtl ? "right" : "left",
                  }}
                >
                  {name}
                </ThemedText>
                <View
                  style={[
                    styles.locationRow,
                    rtl && { flexDirection: "row-reverse" },
                  ]}
                >
                  <Feather
                    name="map-pin"
                    size={12}
                    color={theme.textSecondary}
                  />
                  <ThemedText
                    type="caption"
                    style={{
                      color: theme.textSecondary,
                      [rtl ? "marginRight" : "marginLeft"]: 4,
                    }}
                  >
                    {province} - {address}
                  </ThemedText>
                </View>
                {dist !== null && (
                  <View
                    style={[
                      styles.distanceBadge,
                      rtl && { alignItems: "flex-end" },
                    ]}
                  >
                    <View
                      style={[
                        styles.distancePill,
                        { backgroundColor: theme.primary + "15" },
                        rtl && { flexDirection: "row-reverse" },
                      ]}
                    >
                      <Feather
                        name="navigation"
                        size={10}
                        color={theme.primary}
                      />
                      <ThemedText
                        type="caption"
                        style={{
                          color: theme.primary,
                          fontWeight: "600",
                          [rtl ? "marginRight" : "marginLeft"]: 4,
                        }}
                      >
                        {dist.toFixed(1)} {language === "ar" ? "كم" : "km"}
                      </ThemedText>
                    </View>
                  </View>
                )}
              </View>
            </View>

            <View
              style={[
                styles.cardActions,
                rtl && { flexDirection: "row-reverse" },
              ]}
            >
              <Pressable
                android_ripple={{ color: "transparent" }}
                style={[styles.actionBtn, { backgroundColor: theme.primary }]}
                onPress={() => handleOpenWaze(item.lat, item.lng)}
              >
                <Feather name="navigation" size={16} color="#FFF" />
                <ThemedText
                  type="small"
                  style={{
                    color: "#FFF",
                    fontWeight: "600",
                    [rtl ? "marginRight" : "marginLeft"]: 6,
                  }}
                >
                  {language === "ar" ? "المسار" : "Route"}
                </ThemedText>
              </Pressable>
              <Pressable
                android_ripple={{ color: "transparent" }}
                style={[
                  styles.actionBtn,
                  {
                    backgroundColor: theme.backgroundSecondary,
                    borderWidth: 1,
                    borderColor: theme.border,
                  },
                ]}
                onPress={() =>
                  navigation.navigate("PharmacyDetail", {
                    pharmacyId: item.id,
                  })
                }
              >
                <Feather name="info" size={16} color={theme.text} />
                <ThemedText
                  type="small"
                  style={{
                    fontWeight: "600",
                    [rtl ? "marginRight" : "marginLeft"]: 6,
                  }}
                >
                  {language === "ar" ? "معلومات" : "Info"}
                </ThemedText>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      );
    },
    [language, theme, getDistance, navigation],
  );

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot, paddingTop: headerHeight },
      ]}
    >
      {medicineName ? (
        <View
          style={[
            styles.medicineHeader,
            { backgroundColor: theme.primary + "10" },
          ]}
        >
          <Feather name="package" size={16} color={theme.primary} />
          <ThemedText
            type="small"
            style={{ color: theme.primary, fontWeight: "600", marginLeft: 8 }}
          >
            {medicineName}
          </ThemedText>
        </View>
      ) : null}

      <View style={styles.searchSection}>
        <View
          style={[
            styles.searchInput,
            {
              backgroundColor: theme.backgroundSecondary,
              borderColor: theme.border,
            },
          ]}
        >
          <Feather name="search" size={18} color={theme.textSecondary} />
          <TextInput
            value={searchText}
            onChangeText={setSearchText}
            placeholder={
              language === "ar" ? "ابحث عن صيدلية..." : "Search pharmacy..."
            }
            placeholderTextColor={theme.textSecondary}
            style={[
              styles.input,
              {
                color: theme.text,
                textAlign: language === "ar" ? "right" : "left",
              },
            ]}
          />
        </View>

        <View style={styles.sortRow}>
          <Pressable
            android_ripple={{ color: "transparent" }}
            style={[
              styles.sortBtn,
              {
                backgroundColor:
                  sortMode === "nearest"
                    ? theme.primary
                    : theme.backgroundSecondary,
                borderColor:
                  sortMode === "nearest" ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSortMode("nearest")}
          >
            <Feather
              name="navigation"
              size={14}
              color={sortMode === "nearest" ? "#FFF" : theme.text}
            />
            <ThemedText
              type="caption"
              style={{
                color: sortMode === "nearest" ? "#FFF" : theme.text,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {language === "ar" ? "الأقرب" : "Nearest"}
            </ThemedText>
          </Pressable>
          <Pressable
            android_ripple={{ color: "transparent" }}
            style={[
              styles.sortBtn,
              {
                backgroundColor:
                  sortMode === "alphabetical"
                    ? theme.primary
                    : theme.backgroundSecondary,
                borderColor:
                  sortMode === "alphabetical" ? theme.primary : theme.border,
              },
            ]}
            onPress={() => setSortMode("alphabetical")}
          >
            <Feather
              name="type"
              size={14}
              color={sortMode === "alphabetical" ? "#FFF" : theme.text}
            />
            <ThemedText
              type="caption"
              style={{
                color: sortMode === "alphabetical" ? "#FFF" : theme.text,
                fontWeight: "600",
                marginLeft: 4,
              }}
            >
              {language === "ar" ? "أبجدي" : "A-Z"}
            </ThemedText>
          </Pressable>

          {locationLoading && (
            <ActivityIndicator
              size="small"
              color={theme.primary}
              style={{ marginLeft: 8 }}
            />
          )}
        </View>
      </View>

      <FlatList
        data={filteredAndSorted}
        keyExtractor={(item) => item.id}
        renderItem={renderPharmacy}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Feather name="inbox" size={48} color={theme.border} />
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, marginTop: Spacing.md }}
            >
              {language === "ar" ? "لا توجد صيدليات" : "No pharmacies found"}
            </ThemedText>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  medicineHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
  },
  searchSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm,
  },
  searchInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    height: 48,
    gap: Spacing.sm,
  },
  input: { flex: 1, fontSize: 15 },
  sortRow: { flexDirection: "row", gap: Spacing.sm, alignItems: "center" },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
  },
  listContent: { padding: Spacing.lg, gap: Spacing.md },
  card: {
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    marginBottom: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.md,
  },
  pharmacyIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  cardInfo: { flex: 1 },
  locationRow: { flexDirection: "row", alignItems: "center", marginTop: 4 },
  distanceBadge: { marginTop: 6 },
  distancePill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  cardActions: { flexDirection: "row", gap: Spacing.sm, marginTop: Spacing.md },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  empty: { alignItems: "center", justifyContent: "center", marginTop: 80 },
});
