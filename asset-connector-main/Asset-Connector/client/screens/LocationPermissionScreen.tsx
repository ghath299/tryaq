import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  Modal,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { BorderRadius, Spacing } from "@/constants/theme";
import { provinces } from "@/data/mockData";
import {
  getClosestGovernorateFromCoords,
  saveGovernorate,
} from "@/lib/governorate";

export default function LocationPermissionScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { setLocationGranted } = useAuth();

  const [isRequesting, setIsRequesting] = useState(false);
  const [showDeniedMessage, setShowDeniedMessage] = useState(false);
  const [showGovernorates, setShowGovernorates] = useState(false);

  const completeWithGovernorate = async (nameEn: string) => {
    await saveGovernorate(nameEn);
    await setLocationGranted();
  };

  const handleRequestPermission = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRequesting(true);
    setShowDeniedMessage(false);

    try {
      if (Platform.OS === "web") {
        await completeWithGovernorate("Baghdad");
        return;
      }

      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setShowDeniedMessage(true);
        setShowGovernorates(true);
        return;
      }

      const coords = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const governorate = getClosestGovernorateFromCoords(
        coords.coords.latitude,
        coords.coords.longitude,
      );
      await completeWithGovernorate(governorate);
    } catch (error) {
      console.error("Permission request error:", error);
      setShowGovernorates(true);
    } finally {
      setIsRequesting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[theme.primary + "10", "transparent"]}
        style={styles.topGradient}
      />
      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        <View style={styles.header}>
          <View
            style={[styles.iconContainer, { backgroundColor: theme.primary }]}
          >
            <Feather name="map-pin" size={48} color="#fff" />
          </View>
          <ThemedText type="h1" style={styles.title}>
            الموقع الجغرافي
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.subtitle, { color: theme.textSecondary }]}
          >
            نحتاج موقعك لتحديد المحافظة وعرض الصيدليات المتوفرة فقط.
          </ThemedText>
        </View>

        {showDeniedMessage ? (
          <View
            style={[
              styles.deniedBox,
              { backgroundColor: "#FF3B3015", borderColor: "#FF3B30" },
            ]}
          >
            <Feather name="alert-circle" size={20} color="#FF3B30" />
            <ThemedText type="body" style={{ color: "#FF3B30" }}>
              تم رفض GPS، اختر المحافظة يدوياً.
            </ThemedText>
          </View>
        ) : null}

        <View style={styles.buttonContainer}>
          <Pressable
            android_ripple={{ color: "transparent" }}
            onPress={handleRequestPermission}
            disabled={isRequesting}
            style={styles.button}
          >
            <LinearGradient
              colors={[theme.primary, theme.primaryDark]}
              style={styles.buttonGradient}
            >
              <Feather
                name={isRequesting ? "loader" : "check-circle"}
                size={24}
                color="#FFFFFF"
              />
              <ThemedText type="body" style={styles.buttonText}>
                السماح بالوصول للموقع
              </ThemedText>
            </LinearGradient>
          </Pressable>

          <Pressable
            android_ripple={{ color: "transparent" }}
            onPress={() => setShowGovernorates(true)}
            style={[styles.manualButton, { borderColor: theme.border }]}
          >
            <ThemedText type="body">اختيار المحافظة يدوياً</ThemedText>
          </Pressable>

          {Platform.OS !== "web" ? (
            <Pressable
              android_ripple={{ color: "transparent" }}
              onPress={() => Linking.openSettings()}
              style={styles.settingsLink}
            >
              <ThemedText type="small" style={{ color: theme.primary }}>
                فتح الإعدادات
              </ThemedText>
            </Pressable>
          ) : null}
        </View>
      </View>

      <Modal transparent visible={showGovernorates} animationType="fade">
        <Pressable
          android_ripple={{ color: "transparent" }}
          style={styles.modalOverlay}
          onPress={() => setShowGovernorates(false)}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: theme.backgroundDefault },
            ]}
          >
            <ThemedText type="h4" style={{ marginVertical: Spacing.sm }}>
              اختر المحافظة
            </ThemedText>
            <FlatList
              data={provinces}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Pressable
                  android_ripple={{ color: "transparent" }}
                  style={[styles.row, { borderBottomColor: theme.border }]}
                  onPress={async () => {
                    await completeWithGovernorate(item.nameEn);
                    setShowGovernorates(false);
                  }}
                >
                  <ThemedText type="body">{item.nameAr}</ThemedText>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  content: { flex: 1, paddingHorizontal: Spacing.xl },
  header: { alignItems: "center", marginBottom: Spacing["2xl"] },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: { textAlign: "center", lineHeight: 24 },
  deniedBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    padding: Spacing.md,
    borderWidth: 1,
    borderRadius: BorderRadius.md,
  },
  buttonContainer: { marginTop: "auto", gap: Spacing.md },
  button: { borderRadius: BorderRadius.full, overflow: "hidden" },
  buttonGradient: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonText: { color: "#fff", fontWeight: "700" },
  manualButton: {
    borderWidth: 1,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.md,
  },
  settingsLink: { alignItems: "center" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    padding: Spacing.xl,
  },
  modalCard: {
    borderRadius: BorderRadius.md,
    maxHeight: "70%",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  row: { paddingVertical: Spacing.md, borderBottomWidth: 1 },
});
