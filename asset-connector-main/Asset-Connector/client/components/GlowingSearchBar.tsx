import React, { useState } from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

const isAndroid = Platform.OS === "android";

interface GlowingSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  autoFocus?: boolean;
}

export function GlowingSearchBar({
  value,
  onChangeText,
  placeholder,
  autoFocus = false,
}: GlowingSearchBarProps) {
  const { theme } = useTheme();
  const { t } = useApp();
  const [isFocused, setIsFocused] = useState(false);

  const scale = useSharedValue(1);

  const handleFocus = () => {
    setIsFocused(true);
    if (!isAndroid) {
      scale.value = withSpring(1.02, Animation.spring.gentle);
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (!isAndroid) {
      scale.value = withSpring(1, Animation.spring.gentle);
    }
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.wrapper, !isAndroid && containerStyle]}>
      {!isAndroid && (
        <View style={[styles.glowContainer, { opacity: isFocused ? 0.6 : 0.3 }]}>
          <LinearGradient
            colors={[
              theme.primary + "40",
              theme.primaryDark + "20",
              "transparent",
            ]}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.glow}
          />
        </View>
      )}

      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundDefault,
          },
          isAndroid
            ? {
                elevation: 0,
                borderWidth: 1,
                borderColor: isFocused ? theme.primary : theme.border,
              }
            : {
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isFocused ? 0.3 : 0.15,
                shadowRadius: isFocused ? 16 : 8,
              },
        ]}
      >
        <View style={styles.iconContainer}>
          <Feather
            name="search"
            size={22}
            color={isFocused ? theme.primary : theme.textSecondary}
          />
        </View>
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              textAlign: "right",
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder || t("search")}
          placeholderTextColor={theme.textSecondary}
          onFocus={handleFocus}
          onBlur={handleBlur}
          autoFocus={autoFocus}
        />
        {value.length > 0 ? (
          <View style={styles.clearButton}>
            <Feather
              name="x-circle"
              size={20}
              color={theme.textSecondary}
              onPress={() => onChangeText("")}
            />
          </View>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative",
  },
  glowContainer: {
    position: "absolute",
    top: -10,
    left: -10,
    right: -10,
    bottom: -10,
    borderRadius: BorderRadius.xl + 10,
    overflow: "hidden",
  },
  glow: {
    flex: 1,
  },
  container: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight,
  },
  iconContainer: {
    marginRight: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  clearButton: {
    marginLeft: Spacing.sm,
  },
});
