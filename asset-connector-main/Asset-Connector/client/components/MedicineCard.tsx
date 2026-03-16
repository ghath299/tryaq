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

interface MedicineCardProps {
  id: string;
  nameAr: string;
  nameEn: string;
  companyAr: string;
  companyEn: string;
  usageAr: string;
  usageEn: string;
  dosage: string;
  onPress: () => void;
  index?: number;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function MedicineCard({
  nameAr,
  nameEn,
  companyAr,
  companyEn,
  usageAr,
  usageEn,
  dosage,
  onPress,
  index = 0,
}: MedicineCardProps) {
  const { theme } = useTheme();
  const { language } = useApp();
  const scale = useSharedValue(1);

  const name = language === "ar" ? nameAr : nameEn;
  const company = language === "ar" ? companyAr : companyEn;
  const usage = language === "ar" ? usageAr : usageEn;

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
          <View style={[styles.icon, { backgroundColor: theme.accent + "20" }]}>
            <Feather name="package" size={24} color={theme.accent} />
          </View>
          <View style={styles.headerInfo}>
            <ThemedText type="h4" style={styles.name} numberOfLines={1}>
              {name}
            </ThemedText>
            <ThemedText type="small" style={{ color: theme.textSecondary }}>
              {company} - {dosage}
            </ThemedText>
          </View>
        </View>

        <ThemedText
          type="small"
          style={[styles.usage, { color: theme.textSecondary }]}
          numberOfLines={2}
        >
          {usage}
        </ThemedText>
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
    marginBottom: Spacing.sm,
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
  name: {
    marginBottom: 2,
  },
  usage: {
    marginLeft: 64,
  },
});
