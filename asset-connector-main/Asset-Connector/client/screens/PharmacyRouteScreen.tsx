import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  View,
} from "react-native";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import { Feather, MaterialIcons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { pharmacies as allPharmacies } from "@/data/mockData";
import { Spacing, BorderRadius, Shadows } from "@/constants/theme";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

let RNMapView: any = null;
let RNMarker: any = null;
let RNPolyline: any = null;
let RNUrlTile: any = null;
if (Platform.OS !== "web") {
  const maps = require("react-native-maps");
  RNMapView = maps.default;
  RNMarker = maps.Marker;
  RNPolyline = maps.Polyline;
  RNUrlTile = maps.UrlTile;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const LIGHT_TILE = "https://a.tile.openstreetmap.org/{z}/{x}/{y}.png";
const DARK_TILE = "https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";

const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";
const ROUTE_FETCH_TIMEOUT = 10000;
const RECALC_INTERVAL = 15000;

type Coord = { latitude: number; longitude: number };

function decodePolyline6(encoded: string): Coord[] {
  const coords: Coord[] = [];
  let index = 0;
  let lat = 0;
  let lng = 0;

  while (index < encoded.length) {
    let shift = 0;
    let result = 0;
    let byte: number;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lat += result & 1 ? ~(result >> 1) : result >> 1;

    shift = 0;
    result = 0;
    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);
    lng += result & 1 ? ~(result >> 1) : result >> 1;

    coords.push({ latitude: lat / 1e6, longitude: lng / 1e6 });
  }

  return coords;
}

function roundCoord(n: number): number {
  return Math.round(n * 1e5) / 1e5;
}

function cacheKey(from: Coord, to: Coord): string {
  return `${roundCoord(from.latitude)},${roundCoord(from.longitude)}-${roundCoord(to.latitude)},${roundCoord(to.longitude)}`;
}

type RouteData = {
  coords: Coord[];
  distanceKm: number;
  durationMin: number;
};

const routeCache = new Map<string, RouteData>();

async function fetchRoute(from: Coord, to: Coord): Promise<RouteData> {
  const key = cacheKey(from, to);
  if (routeCache.has(key)) return routeCache.get(key)!;

  const url = `${OSRM_BASE}/${from.longitude},${from.latitude};${to.longitude},${to.latitude}?overview=full&geometries=polyline6`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ROUTE_FETCH_TIMEOUT);

  try {
    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`OSRM ${res.status}`);
    const data = await res.json();

    if (!data.routes || data.routes.length === 0) {
      throw new Error("No route found");
    }

    const route = data.routes[0];
    const coords = decodePolyline6(route.geometry);
    const result: RouteData = {
      coords,
      distanceKm: route.distance / 1000,
      durationMin: route.duration / 60,
    };

    routeCache.set(key, result);
    return result;
  } catch (err) {
    clearTimeout(timer);
    throw err;
  }
}

export default function PharmacyRouteScreen() {
  const { theme, isDark } = useTheme();
  const { language, t } = useApp();
  const navigation = useNavigation<any>();
  const route = useRoute<RouteProp<RootStackParamList, "PharmacyRoute">>();

  const pharmacyId = route.params?.pharmacyId;
  const pharmacy = useMemo(
    () => allPharmacies.find((p) => p.id === pharmacyId),
    [pharmacyId],
  );

  const mapRef = useRef<any>(null);
  const lastRecalcRef = useRef(0);
  const watchRef = useRef<Location.LocationSubscription | null>(null);

  const [userLocation, setUserLocation] = useState<Coord | null>(null);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<RouteData | null>(null);
  const [isLoadingRoute, setIsLoadingRoute] = useState(true);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [trackMe, setTrackMe] = useState(false);
  const [gpsEnabled, setGpsEnabled] = useState(true);

  const sheetTranslate = useSharedValue(0);
  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslate.value }],
  }));

  const pharmacyCoord: Coord | null = useMemo(
    () =>
      pharmacy ? { latitude: pharmacy.lat, longitude: pharmacy.lng } : null,
    [pharmacy],
  );

  const tileUrl = useMemo(() => (isDark ? DARK_TILE : LIGHT_TILE), [isDark]);

  const fetchUserLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setGpsEnabled(false);
        Alert.alert(
          language === "ar" ? "الموقع مطلوب" : "Location Required",
          language === "ar"
            ? "يرجى تفعيل خدمة الموقع من الإعدادات"
            : "Please enable location services in Settings",
          [
            {
              text: language === "ar" ? "الإعدادات" : "Settings",
              onPress: () => Linking.openSettings(),
            },
            { text: language === "ar" ? "إلغاء" : "Cancel", style: "cancel" },
          ],
        );
        return null;
      }
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      const coord: Coord = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserLocation(coord);
      setLocationAccuracy(loc.coords.accuracy ?? null);
      setGpsEnabled(true);
      return coord;
    } catch {
      setGpsEnabled(false);
      return null;
    }
  }, [language]);

  const loadRoute = useCallback(
    async (from?: Coord | null) => {
      const origin = from || userLocation;
      if (!origin || !pharmacyCoord) return;

      setIsLoadingRoute(true);
      setRouteError(null);

      try {
        const data = await fetchRoute(origin, pharmacyCoord);
        setRouteData(data);
      } catch (err: any) {
        setRouteError(
          language === "ar"
            ? "فشل في حساب المسار. تحقق من الاتصال."
            : "Failed to calculate route. Check connection.",
        );

        try {
          const data = await fetchRoute(origin, pharmacyCoord);
          setRouteData(data);
          setRouteError(null);
        } catch {
          // keep error
        }
      } finally {
        setIsLoadingRoute(false);
      }
    },
    [userLocation, pharmacyCoord, language],
  );

  useEffect(() => {
    (async () => {
      const loc = await fetchUserLocation();
      if (loc && pharmacyCoord) {
        await loadRoute(loc);
        fitMapToMarkers(loc, pharmacyCoord);
      } else {
        setIsLoadingRoute(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (!trackMe) {
      if (watchRef.current) {
        watchRef.current.remove();
        watchRef.current = null;
      }
      return;
    }

    if (!gpsEnabled) {
      setTrackMe(false);
      return;
    }

    let mounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setGpsEnabled(false);
          setTrackMe(false);
          return;
        }

        const sub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            distanceInterval: 10,
            timeInterval: 3000,
          },
          (loc) => {
            if (!mounted) return;
            const coord: Coord = {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            };
            setUserLocation(coord);
            setLocationAccuracy(loc.coords.accuracy ?? null);

            mapRef.current?.animateCamera({ center: coord }, { duration: 500 });

            const now = Date.now();
            if (
              now - lastRecalcRef.current > RECALC_INTERVAL &&
              pharmacyCoord
            ) {
              lastRecalcRef.current = now;
              loadRoute(coord);
            }
          },
        );
        if (mounted) watchRef.current = sub;
      } catch {
        if (mounted) {
          setGpsEnabled(false);
          setTrackMe(false);
        }
      }
    })();

    return () => {
      mounted = false;
      watchRef.current?.remove();
      watchRef.current = null;
    };
  }, [trackMe, pharmacyCoord, loadRoute]);

  const fitMapToMarkers = useCallback((from: Coord, to: Coord) => {
    mapRef.current?.fitToCoordinates([from, to], {
      edgePadding: { top: 100, right: 60, bottom: 300, left: 60 },
      animated: true,
    });
  }, []);

  const handleRecenter = useCallback(() => {
    if (userLocation && pharmacyCoord) {
      fitMapToMarkers(userLocation, pharmacyCoord);
    }
  }, [userLocation, pharmacyCoord, fitMapToMarkers]);

  const handleNorthReset = useCallback(() => {
    mapRef.current?.animateCamera({ heading: 0 }, { duration: 300 });
  }, []);

  const handleZoom = useCallback((zoomIn: boolean) => {
    mapRef.current?.getCamera().then((cam) => {
      const newZoom = (cam.zoom || 14) + (zoomIn ? 1 : -1);
      mapRef.current?.animateCamera(
        { zoom: Math.max(3, Math.min(20, newZoom)) },
        { duration: 300 },
      );
    });
  }, []);

  const handleRetry = useCallback(() => {
    loadRoute();
  }, [loadRoute]);

  const handleCallPhone = useCallback(() => {
    if (pharmacy?.phone)
      Linking.openURL(`tel:${pharmacy.phone.replace(/\s+/g, "")}`);
  }, [pharmacy]);

  const handleWhatsApp = useCallback(() => {
    if (pharmacy?.phone)
      Linking.openURL(`https://wa.me/${pharmacy.phone.replace(/\D/g, "")}`);
  }, [pharmacy]);

  const handleOpenWaze = useCallback(async () => {
    if (!pharmacyCoord) return;

    const lat = pharmacyCoord.latitude;
    const lng = pharmacyCoord.longitude;

    const wazeAppUrl = `waze://?ll=${lat},${lng}&navigate=yes`;
    const wazeWebUrl = `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;

    try {
      const canOpen = await Linking.canOpenURL(wazeAppUrl);
      if (canOpen) {
        await Linking.openURL(wazeAppUrl);
      } else {
        await Linking.openURL(wazeWebUrl);
      }
    } catch {
      await Linking.openURL(wazeWebUrl);
    }
  }, [pharmacyCoord]);

  const handleOpenMaps = useCallback(() => {
    if (!pharmacyCoord) return;
    const url = Platform.select({
      ios: `http://maps.apple.com/?daddr=${pharmacyCoord.latitude},${pharmacyCoord.longitude}`,
      default: `https://www.google.com/maps/dir/?api=1&destination=${pharmacyCoord.latitude},${pharmacyCoord.longitude}`,
    });
    if (url) Linking.openURL(url);
  }, [pharmacyCoord]);

  const handleShare = useCallback(async () => {
    if (!pharmacyCoord) return;
    const name = language === "ar" ? pharmacy?.nameAr : pharmacy?.nameEn;
    await Share.share({
      message: `${name}\nhttps://www.google.com/maps?q=${pharmacyCoord.latitude},${pharmacyCoord.longitude}`,
    });
  }, [pharmacyCoord, pharmacy, language]);

  const handleInfo = useCallback(() => {
    if (pharmacy)
      navigation.navigate("PharmacyDetail", { pharmacyId: pharmacy.id });
  }, [pharmacy, navigation]);

  if (!pharmacy || !pharmacyCoord) {
    return (
      <View style={[styles.center, { backgroundColor: theme.backgroundRoot }]}>
        <ThemedText type="body">{t("error")}</ThemedText>
      </View>
    );
  }

  const rtl = language === "ar";
  const pharmacyName = language === "ar" ? pharmacy.nameAr : pharmacy.nameEn;
  const pharmacyAddress =
    language === "ar" ? pharmacy.address : pharmacy.addressEn;
  const routeColor = isDark ? "#5EDFFF" : "#1F6AE1";
  const routeOutlineColor = isDark ? "#1F6AE1" : "#5EDFFF40";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {Platform.OS === "web" ? (
        <View style={StyleSheet.absoluteFill}>
          <iframe
            width="100%"
            height="100%"
            frameBorder="0"
            scrolling="no"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${pharmacyCoord.longitude - 0.02}%2C${pharmacyCoord.latitude - 0.02}%2C${pharmacyCoord.longitude + 0.02}%2C${pharmacyCoord.latitude + 0.02}&layer=mapnik&marker=${pharmacyCoord.latitude}%2C${pharmacyCoord.longitude}`}
            style={{
              border: "none",
              width: "100%",
              height: "100%",
              filter: isDark
                ? "invert(0.9) hue-rotate(180deg) saturate(0.6)"
                : "none",
            }}
          />
        </View>
      ) : RNMapView ? (
        <RNMapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          mapType="none"
          initialRegion={{
            latitude: pharmacyCoord.latitude,
            longitude: pharmacyCoord.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={false}
          showsCompass={false}
          showsMyLocationButton={false}
        >
          <RNUrlTile
            urlTemplate={tileUrl}
            maximumZ={19}
            flipY={false}
            tileSize={256}
          />

          {userLocation && (
            <RNMarker coordinate={userLocation} anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.userMarkerOuter}>
                <View
                  style={[
                    styles.userMarkerGlow,
                    { backgroundColor: theme.primary + "30" },
                  ]}
                />
                <View
                  style={[
                    styles.userMarkerInner,
                    { backgroundColor: theme.primary, borderColor: "#FFF" },
                  ]}
                />
              </View>
            </RNMarker>
          )}

          <RNMarker coordinate={pharmacyCoord} anchor={{ x: 0.5, y: 1 }}>
            <View style={styles.pharmacyMarkerContainer}>
              <View
                style={[
                  styles.pharmacyMarkerBubble,
                  { backgroundColor: isDark ? "#FF6B6B" : "#E53935" },
                ]}
              >
                <Feather name="plus" size={18} color="#FFF" />
              </View>
              <View
                style={[
                  styles.pharmacyMarkerTail,
                  { borderTopColor: isDark ? "#FF6B6B" : "#E53935" },
                ]}
              />
            </View>
          </RNMarker>

          {routeData && routeData.coords.length > 1 && (
            <>
              <RNPolyline
                coordinates={routeData.coords}
                strokeColor={routeOutlineColor}
                strokeWidth={8}
                lineCap="round"
                lineJoin="round"
              />
              <RNPolyline
                coordinates={routeData.coords}
                strokeColor={routeColor}
                strokeWidth={4}
                lineCap="round"
                lineJoin="round"
              />
            </>
          )}
        </RNMapView>
      ) : null}

      {locationAccuracy !== null && locationAccuracy > 50 && (
        <View style={[styles.gpsBadge, { backgroundColor: theme.warning }]}>
          <Feather name="alert-triangle" size={12} color="#000" />
          <ThemedText
            type="caption"
            style={{ color: "#000", marginLeft: 4, fontWeight: "600" }}
          >
            GPS {language === "ar" ? "ضعيف" : "weak"}
          </ThemedText>
        </View>
      )}

      <View style={styles.controlsColumn}>
        <Pressable
          style={[
            styles.controlBtn,
            { backgroundColor: theme.card, ...Shadows.small },
          ]}
          onPress={handleNorthReset}
        >
          <MaterialIcons name="explore" size={22} color={theme.text} />
        </Pressable>
        <Pressable
          style={[
            styles.controlBtn,
            { backgroundColor: theme.card, ...Shadows.small },
          ]}
          onPress={() => handleZoom(true)}
        >
          <Feather name="plus" size={20} color={theme.text} />
        </Pressable>
        <Pressable
          style={[
            styles.controlBtn,
            { backgroundColor: theme.card, ...Shadows.small },
          ]}
          onPress={() => handleZoom(false)}
        >
          <Feather name="minus" size={20} color={theme.text} />
        </Pressable>
        <Pressable
          style={[
            styles.controlBtn,
            {
              backgroundColor: trackMe ? theme.primary : theme.card,
              ...Shadows.small,
            },
          ]}
          onPress={() => setTrackMe((v) => !v)}
        >
          <Feather
            name="crosshair"
            size={20}
            color={trackMe ? "#FFF" : theme.text}
          />
        </Pressable>
        <Pressable
          style={[
            styles.controlBtn,
            { backgroundColor: theme.card, ...Shadows.small },
          ]}
          onPress={handleRecenter}
        >
          <Feather name="maximize" size={20} color={theme.text} />
        </Pressable>
      </View>

      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        style={[
          styles.bottomSheet,
          { backgroundColor: theme.card },
          sheetStyle,
        ]}
      >
        <View style={[styles.sheetHandle, { backgroundColor: theme.border }]} />

        <View style={styles.sheetHeader}>
          <View
            style={[
              styles.sheetNameRow,
              rtl && { flexDirection: "row-reverse" },
            ]}
          >
            <ThemedText
              type="h4"
              style={{
                fontWeight: "700",
                flex: 1,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {pharmacyName}
            </ThemedText>
            <Pressable>
              <Feather name="star" size={22} color={theme.warning} />
            </Pressable>
          </View>
          {pharmacyAddress ? (
            <View
              style={{
                flexDirection: rtl ? "row-reverse" : "row",
                alignItems: "center",
                marginTop: 4,
              }}
            >
              <Feather name="map-pin" size={12} color={theme.textSecondary} />
              <ThemedText
                type="caption"
                style={{
                  color: theme.textSecondary,
                  [rtl ? "marginRight" : "marginLeft"]: 4,
                }}
              >
                {pharmacyAddress}
              </ThemedText>
            </View>
          ) : null}
        </View>

        {isLoadingRoute ? (
          <View
            style={[
              styles.loadingRoute,
              rtl && { flexDirection: "row-reverse" },
            ]}
          >
            <ActivityIndicator size="small" color={theme.primary} />
            <ThemedText
              type="small"
              style={{
                color: theme.textSecondary,
                [rtl ? "marginRight" : "marginLeft"]: Spacing.sm,
              }}
            >
              {language === "ar"
                ? "جاري حساب المسار..."
                : "Calculating route..."}
            </ThemedText>
          </View>
        ) : routeError && !routeData ? (
          <View
            style={[styles.errorRow, rtl && { flexDirection: "row-reverse" }]}
          >
            <ThemedText
              type="small"
              style={{
                color: theme.error,
                flex: 1,
                textAlign: rtl ? "right" : "left",
              }}
            >
              {routeError}
            </ThemedText>
            <Pressable
              style={[styles.retryBtn, { backgroundColor: theme.primary }]}
              onPress={handleRetry}
            >
              <Feather name="refresh-cw" size={14} color="#FFF" />
              <ThemedText
                type="caption"
                style={{
                  color: "#FFF",
                  [rtl ? "marginRight" : "marginLeft"]: 4,
                }}
              >
                {language === "ar" ? "إعادة" : "Retry"}
              </ThemedText>
            </Pressable>
          </View>
        ) : routeData ? (
          <View
            style={[styles.pillsRow, rtl && { flexDirection: "row-reverse" }]}
          >
            <View
              style={[styles.pill, { backgroundColor: theme.primary + "15" }]}
            >
              <Feather name="navigation" size={14} color={theme.primary} />
              <ThemedText
                type="small"
                style={{
                  color: theme.primary,
                  fontWeight: "700",
                  [rtl ? "marginRight" : "marginLeft"]: 4,
                }}
              >
                {routeData.distanceKm.toFixed(1)}{" "}
                {language === "ar" ? "كم" : "km"}
              </ThemedText>
            </View>
            <View
              style={[styles.pill, { backgroundColor: theme.accent + "15" }]}
            >
              <Feather name="clock" size={14} color={theme.accent} />
              <ThemedText
                type="small"
                style={{
                  color: theme.accent,
                  fontWeight: "700",
                  [rtl ? "marginRight" : "marginLeft"]: 4,
                }}
              >
                {Math.ceil(routeData.durationMin)}{" "}
                {language === "ar" ? "دقيقة" : "min"}
              </ThemedText>
            </View>
          </View>
        ) : null}

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.buttonsScroll}
        >
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: "#8B5CF6" }]}
            onPress={handleOpenWaze}
          >
            <MaterialIcons name="navigation" size={18} color="#FFF" />
            <ThemedText
              type="caption"
              style={{ color: "#FFF", fontWeight: "600", marginTop: 2 }}
            >
              Waze
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: "#1F6AE1" }]}
            onPress={handleOpenMaps}
          >
            <Feather name="map" size={18} color="#FFF" />
            <ThemedText
              type="caption"
              style={{ color: "#FFF", fontWeight: "600", marginTop: 2 }}
            >
              {language === "ar" ? "خرائط" : "Maps"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: "#4CD964" }]}
            onPress={handleCallPhone}
          >
            <Feather name="phone" size={18} color="#FFF" />
            <ThemedText
              type="caption"
              style={{ color: "#FFF", fontWeight: "600", marginTop: 2 }}
            >
              {language === "ar" ? "اتصال" : "Call"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: "#25D366" }]}
            onPress={handleWhatsApp}
          >
            <Feather name="message-circle" size={18} color="#FFF" />
            <ThemedText
              type="caption"
              style={{ color: "#FFF", fontWeight: "600", marginTop: 2 }}
            >
              {language === "ar" ? "واتساب" : "WhatsApp"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.sheetBtn, { backgroundColor: theme.primary }]}
            onPress={handleShare}
          >
            <Feather name="share-2" size={18} color="#FFF" />
            <ThemedText
              type="caption"
              style={{ color: "#FFF", fontWeight: "600", marginTop: 2 }}
            >
              {language === "ar" ? "مشاركة" : "Share"}
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.sheetBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              },
            ]}
            onPress={handleInfo}
          >
            <Feather name="info" size={18} color={theme.text} />
            <ThemedText
              type="caption"
              style={{ fontWeight: "600", marginTop: 2 }}
            >
              {language === "ar" ? "معلومات" : "Info"}
            </ThemedText>
          </Pressable>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  gpsBadge: {
    position: "absolute",
    top: 60,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    zIndex: 10,
  },
  controlsColumn: {
    position: "absolute",
    right: 16,
    top: 100,
    gap: 8,
    zIndex: 10,
  },
  controlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerOuter: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  userMarkerGlow: {
    position: "absolute",
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  userMarkerInner: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
  },
  pharmacyMarkerContainer: { alignItems: "center" },
  pharmacyMarkerBubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFF",
  },
  pharmacyMarkerTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: "transparent",
    borderRightColor: "transparent",
    marginTop: -2,
  },
  bottomSheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 40,
    ...Shadows.large,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  sheetHeader: { marginBottom: Spacing.md },
  sheetNameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loadingRoute: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  retryBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  pillsRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
  },
  buttonsScroll: {
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  sheetBtn: {
    width: 70,
    height: 70,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
});
