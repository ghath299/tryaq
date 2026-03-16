import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  FadeInUp,
} from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";

interface PharmacyCardProps {
  id: string;
  nameAr: string;
  nameEn: string;
  districtAr: string;
  districtEn: string;
  distance: number;
  isVerified: boolean;
  hasDelivery: boolean;
  workingHours: string;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function PharmacyCard({
  nameAr,
  nameEn,
  districtAr,
  districtEn,
  distance,
  isVerified,
  hasDelivery,
  workingHours,
  onPress,
  index = 0,
}: PharmacyCardProps) {
  const { theme } = useTheme();
  const { language, t } = useApp();
  const scale = useSharedValue(1);

  const name = language === "ar" ? nameAr : nameEn;
  const district = language === "ar" ? districtAr : districtEn;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, { damping: 15, stiffness: 150 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 150 });
  };

  return (
    <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
      <AnimatedPressable
        android_ripple={{ color: "transparent" }}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.card,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
        <View style={styles.header}>
          <View
            style={[styles.icon, { backgroundColor: theme.primary + "20" }]}
          >
            <Feather name="plus-square" size={24} color={theme.primary} />
          </View>
          <View style={styles.headerInfo}>
            <View style={styles.nameRow}>
              <ThemedText type="h4" style={styles.name} numberOfLines={1}>
                {name}
              </ThemedText>
              {isVerified ? (
                <Feather name="check-circle" size={16} color={theme.primary} />
              ) : null}
            </View>
            <View style={styles.badges}>
              {hasDelivery ? (
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: theme.success + "20" },
                  ]}
                >
                  <Feather name="truck" size={12} color={theme.success} />
                  <ThemedText
                    type="caption"
                    style={{ color: theme.success, marginLeft: 4 }}
                  >
                    {t("delivery")}
                  </ThemedText>
                </View>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.footer}>
          <View style={styles.infoItem}>
            <Feather name="map-pin" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              {district}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="navigation" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              {distance} {t("km")}
            </ThemedText>
          </View>
          <View style={styles.infoItem}>
            <Feather name="clock" size={14} color={theme.textSecondary} />
            <ThemedText
              type="small"
              style={[styles.infoText, { color: theme.textSecondary }]}
            >
              {workingHours}
            </ThemedText>
          </View>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xs,
  },
  name: {
    flex: 1,
  },
  badges: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  infoText: {
    marginLeft: 2,
  },
});
