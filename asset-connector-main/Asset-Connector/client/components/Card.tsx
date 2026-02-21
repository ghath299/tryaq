import React from "react";
import { StyleSheet, Pressable, ViewStyle, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

interface CardProps {
  elevation?: number;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  variant?: "default" | "gradient";
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function Card({
  elevation = 1,
  title,
  description,
  children,
  onPress,
  style,
  variant = "default",
}: CardProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const translateY = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { translateY: translateY.value },
    ],
  }));

  const handlePressIn = () => {
    if (onPress) {
      scale.value = withSpring(0.98, Animation.spring.snappy);
      translateY.value = withSpring(-2, Animation.spring.snappy);
    }
  };

  const handlePressOut = () => {
    if (onPress) {
      scale.value = withSpring(1, Animation.spring.gentle);
      translateY.value = withSpring(0, Animation.spring.gentle);
    }
  };

  const handlePress = () => {
    if (onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const shadowStyle = Platform.select({
    ios: {
      shadowColor: theme.primary,
      shadowOffset: { width: 0, height: 4 + elevation * 2 },
      shadowOpacity: 0.08 + elevation * 0.04,
      shadowRadius: 6 + elevation * 2,
    },
    android: { elevation: elevation * 2 },
    default: {},
  });

  if (variant === "gradient") {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={!onPress}
        style={[styles.card, shadowStyle, animatedStyle, style]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.gradientContent}
        >
          {title ? (
            <ThemedText type="h4" style={[styles.cardTitle, { color: "#FFFFFF" }]}>
              {title}
            </ThemedText>
          ) : null}
          {description ? (
            <ThemedText type="small" style={[styles.cardDescription, { color: "rgba(255,255,255,0.85)" }]}>
              {description}
            </ThemedText>
          ) : null}
          {children}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={!onPress}
      style={[
        styles.card,
        styles.cardContent,
        { backgroundColor: theme.backgroundDefault },
        shadowStyle,
        animatedStyle,
        style,
      ]}
    >
      {title ? (
        <ThemedText type="h4" style={styles.cardTitle}>
          {title}
        </ThemedText>
      ) : null}
      {description ? (
        <ThemedText type="small" style={[styles.cardDescription, { color: theme.textSecondary }]}>
          {description}
        </ThemedText>
      ) : null}
      {children}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  cardContent: {
    padding: Spacing.xl,
  },
  gradientContent: {
    padding: Spacing.xl,
  },
  cardTitle: {
    marginBottom: Spacing.sm,
  },
  cardDescription: {
    marginBottom: Spacing.md,
  },
});
