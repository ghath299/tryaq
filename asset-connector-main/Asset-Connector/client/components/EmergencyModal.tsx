import React, { useState } from "react";
import {
  View,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Feather, FontAwesome5 } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import * as Haptics from "expo-haptics";
import Animated, { FadeIn, SlideInUp, SlideOutDown } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";

type Step = "menu" | "locating" | "denied";

interface EmergencyModalProps {
  visible: boolean;
  onClose: () => void;
}

export default function EmergencyModal({ visible, onClose }: EmergencyModalProps) {
  const { theme, isDark } = useTheme();
  const [step, setStep] = useState<Step>("menu");

  const handleClose = () => {
    setStep("menu");
    onClose();
  };

  const handleCall122 = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    Linking.openURL("tel:122");
  };

  const handleFindHospital = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep("locating");

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();

      if (status !== "granted") {
        setStep("denied");
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      const { latitude, longitude } = loc.coords;

      const mapsUrl = Platform.select({
        ios: `comgooglemaps://?center=${latitude},${longitude}&q=hospital&zoom=14`,
        android: `geo:${latitude},${longitude}?q=hospital`,
        default: `https://www.google.com/maps/search/hospital/@${latitude},${longitude},14z`,
      });

      const webFallback = `https://www.google.com/maps/search/hospital/@${latitude},${longitude},14z`;

      const canOpen = await Linking.canOpenURL(mapsUrl!);
      if (canOpen) {
        await Linking.openURL(mapsUrl!);
      } else {
        await Linking.openURL(webFallback);
      }

      handleClose();
    } catch {
      setStep("denied");
    }
  };

  const handleManualSearch = () => {
    Linking.openURL("https://www.google.com/maps/search/hospital");
    handleClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <Animated.View
          entering={FadeIn.duration(200)}
          style={styles.backdropInner}
        />
      </Pressable>

      <Animated.View
        entering={SlideInUp.springify().damping(18).stiffness(180)}
        exiting={SlideOutDown.duration(250)}
        style={[
          styles.sheet,
          {
            backgroundColor: isDark ? theme.card : "#FFFFFF",
          },
        ]}
      >
        <View style={[styles.handle, { backgroundColor: theme.border }]} />

        <View style={styles.topRow}>
          <Pressable onPress={handleClose} hitSlop={12} style={styles.closeBtn}>
            <Feather name="x" size={20} color={theme.textSecondary} />
          </Pressable>
          <View style={styles.titleWrap}>
            <View style={[styles.titleIcon, { backgroundColor: addAlpha("#EF4444", 0.12) }]}>
              <FontAwesome5 name="ambulance" size={20} color="#EF4444" />
            </View>
            <ThemedText
              type="h4"
              style={{ color: theme.text, fontWeight: "700", textAlign: "right" }}
            >
              الطوارئ
            </ThemedText>
          </View>
        </View>

        {step === "menu" && (
          <Animated.View entering={FadeIn.duration(250)} style={styles.menuWrap}>
            <Pressable
              onPress={handleCall122}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={["#EF4444", "#DC2626"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGrad}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionTextWrap}>
                    <ThemedText style={styles.actionTitle}>اتصل بالإسعاف</ThemedText>
                    <ThemedText style={styles.actionSub}>الرقم الوطني للطوارئ</ThemedText>
                  </View>
                  <View style={styles.actionNumBox}>
                    <ThemedText style={styles.actionNum}>122</ThemedText>
                  </View>
                  <View style={styles.actionIcon}>
                    <FontAwesome5 name="ambulance" size={22} color="#FFF" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <Pressable
              onPress={handleFindHospital}
              android_ripple={{ color: "rgba(255,255,255,0.2)" }}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && { opacity: 0.85 },
              ]}
            >
              <LinearGradient
                colors={["#1F6AE1", "#1558CC"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.actionGrad}
              >
                <View style={styles.actionContent}>
                  <View style={styles.actionTextWrap}>
                    <ThemedText style={styles.actionTitle}>أقرب مستشفى / مستوصف</ThemedText>
                    <ThemedText style={styles.actionSub}>يفتح Google Maps تلقائياً</ThemedText>
                  </View>
                  <View style={styles.actionIcon}>
                    <FontAwesome5 name="hospital-alt" size={22} color="#FFF" />
                  </View>
                </View>
              </LinearGradient>
            </Pressable>

            <ThemedText
              type="caption"
              style={[styles.disclaimer, { color: theme.textSecondary }]}
            >
              في حالات الخطر الشديد اتصل فوراً بـ 122
            </ThemedText>
          </Animated.View>
        )}

        {step === "locating" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerWrap}>
            <ActivityIndicator size="large" color="#1F6AE1" />
            <ThemedText
              type="body"
              style={[styles.statusText, { color: theme.text }]}
            >
              جاري تحديد موقعك...
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, textAlign: "center", marginTop: 4 }}
            >
              يرجى السماح بالوصول إلى موقعك
            </ThemedText>
          </Animated.View>
        )}

        {step === "denied" && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.centerWrap}>
            <View
              style={[
                styles.deniedIcon,
                { backgroundColor: addAlpha("#F59E0B", 0.12) },
              ]}
            >
              <Feather name="map-off" size={36} color="#F59E0B" />
            </View>
            <ThemedText
              type="body"
              style={[styles.statusText, { color: theme.text }]}
            >
              لم يتم الحصول على الموقع
            </ThemedText>
            <ThemedText
              type="caption"
              style={{
                color: theme.textSecondary,
                textAlign: "center",
                marginTop: 4,
                lineHeight: 20,
                paddingHorizontal: Spacing.md,
              }}
            >
              يمكنك البحث يدوياً عن أقرب مستشفى في منطقتك
            </ThemedText>

            <Pressable
              onPress={handleManualSearch}
              style={[
                styles.manualBtn,
                { backgroundColor: addAlpha("#1F6AE1", 0.1), borderColor: addAlpha("#1F6AE1", 0.3) },
              ]}
            >
              <Feather name="search" size={16} color="#1F6AE1" style={{ marginLeft: 6 }} />
              <ThemedText
                style={{ color: "#1F6AE1", fontWeight: "600", fontSize: 14 }}
              >
                بحث عام على Google Maps
              </ThemedText>
            </Pressable>

            <Pressable
              onPress={() => setStep("menu")}
              style={styles.backLink}
            >
              <ThemedText
                type="caption"
                style={{ color: theme.textSecondary, textAlign: "center" }}
              >
                العودة
              </ThemedText>
            </Pressable>
          </Animated.View>
        )}
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  backdropInner: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 20,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginTop: 12,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  titleWrap: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
  },
  titleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  menuWrap: {
    paddingHorizontal: Spacing.lg,
    gap: Spacing.md,
  },
  actionBtn: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  actionGrad: {
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
  },
  actionContent: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.md,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextWrap: {
    flex: 1,
    gap: 2,
  },
  actionTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700",
    textAlign: "right",
  },
  actionSub: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 12,
    textAlign: "right",
  },
  actionNumBox: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  actionNum: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "900",
  },
  disclaimer: {
    textAlign: "center",
    marginTop: 4,
    lineHeight: 18,
  },
  centerWrap: {
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  statusText: {
    fontWeight: "700",
    textAlign: "center",
    fontSize: 16,
    marginTop: 4,
  },
  deniedIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  manualBtn: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: 4,
  },
  backLink: {
    paddingVertical: 8,
    marginTop: 4,
  },
});
