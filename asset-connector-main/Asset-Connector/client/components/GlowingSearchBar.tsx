import React, { useState, useEffect } from "react";
import { View, TextInput, StyleSheet, Platform } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
  interpolate,
} from "react-native-reanimated";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

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
  const { language, t } = useApp();
  const [isFocused, setIsFocused] = useState(false);
  
  const glowOpacity = useSharedValue(0.3);
  const scale = useSharedValue(1);
  const borderProgress = useSharedValue(0);

  useEffect(() => {
    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.5, { duration: 1500 }),
        withTiming(0.3, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const handleFocus = () => {
    setIsFocused(true);
    scale.value = withSpring(1.02, Animation.spring.gentle);
    borderProgress.value = withTiming(1, { duration: Animation.duration.normal });
  };

  const handleBlur = () => {
    setIsFocused(false);
    scale.value = withSpring(1, Animation.spring.gentle);
    borderProgress.value = withTiming(0, { duration: Animation.duration.normal });
  };

  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: isFocused ? 0.6 : glowOpacity.value,
  }));

  const borderStyle = useAnimatedStyle(() => ({
    borderWidth: interpolate(borderProgress.value, [0, 1], [0, 2]),
    borderColor: theme.primary,
  }));

  return (
    <Animated.View style={[styles.wrapper, containerStyle]}>
      <Animated.View style={[styles.glowContainer, glowStyle]}>
        <LinearGradient
          colors={[theme.primary + "40", theme.primaryDark + "20", "transparent"]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.glow}
        />
      </Animated.View>
      
      <Animated.View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundDefault,
          },
          Platform.select({
            ios: {
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isFocused ? 0.3 : 0.15,
              shadowRadius: isFocused ? 16 : 8,
            },
            android: {
              elevation: isFocused ? 8 : 4,
            },
            default: {},
          }),
          borderStyle,
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
              textAlign: language === "ar" ? "right" : "left",
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
          <Animated.View style={styles.clearButton}>
            <Feather
              name="x-circle"
              size={20}
              color={theme.textSecondary}
              onPress={() => onChangeText("")}
            />
          </Animated.View>
        ) : null}
      </Animated.View>
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
