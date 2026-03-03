import React from "react";
import { StyleSheet, Image, ImageSourcePropType } from "react-native";
import Animated, { FadeIn, FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { Spacing } from "@/constants/theme";

interface EmptyStateProps {
  image: ImageSourcePropType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  image,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.container}>
      <Animated.View entering={FadeInUp.delay(100).duration(400)}>
        <Image source={image} style={styles.image} resizeMode="contain" />
      </Animated.View>
      <Animated.View
        entering={FadeInUp.delay(200).duration(400)}
        style={styles.textContainer}
      >
        <ThemedText type="h3" style={styles.title}>
          {title}
        </ThemedText>
        {description ? (
          <ThemedText
            type="body"
            style={[styles.description, { color: theme.textSecondary }]}
          >
            {description}
          </ThemedText>
        ) : null}
      </Animated.View>
      {actionLabel && onAction ? (
        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <Button onPress={onAction} style={styles.button}>
            {actionLabel}
          </Button>
        </Animated.View>
      ) : null}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing["3xl"],
  },
  image: {
    width: 180,
    height: 180,
    marginBottom: Spacing["2xl"],
  },
  textContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  description: {
    textAlign: "center",
  },
  button: {
    paddingHorizontal: Spacing["3xl"],
  },
});
