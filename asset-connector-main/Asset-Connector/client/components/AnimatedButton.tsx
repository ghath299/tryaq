import React, { ReactNode, useState } from "react";
import { StyleSheet, Pressable, ViewStyle, StyleProp, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withSequence,
  withTiming,
  interpolateColor,
  runOnJS,
} from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { BorderRadius, Spacing, Animation } from "@/constants/theme";

interface AnimatedButtonProps {
  onPress?: () => void;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "outline" | "ghost";
  size?: "small" | "medium" | "large";
  fullWidth?: boolean;
  icon?: ReactNode;
  pulse?: boolean;
}

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function AnimatedButton({
  onPress,
  children,
  style,
  disabled = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  icon,
  pulse = false,
}: AnimatedButtonProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);
  const rippleScale = useSharedValue(0);
  const rippleOpacity = useSharedValue(0);
  const pulseValue = useSharedValue(1);
  const [ripplePosition, setRipplePosition] = useState({ x: 0, y: 0 });

  const triggerHaptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * pulseValue.value }],
  }));

  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: rippleScale.value }],
    opacity: rippleOpacity.value,
  }));

  React.useEffect(() => {
    if (pulse && !disabled) {
      pulseValue.value = withSequence(
        withTiming(1.02, { duration: 800 }),
        withTiming(1, { duration: 800 })
      );
      const interval = setInterval(() => {
        pulseValue.value = withSequence(
          withTiming(1.02, { duration: 800 }),
          withTiming(1, { duration: 800 })
        );
      }, 1600);
      return () => clearInterval(interval);
    }
  }, [pulse, disabled]);

  const handlePressIn = (e: any) => {
    if (!disabled) {
      scale.value = withSpring(0.96, Animation.spring.snappy);
      const { locationX, locationY } = e.nativeEvent;
      setRipplePosition({ x: locationX, y: locationY });
      rippleScale.value = 0;
      rippleOpacity.value = 0.3;
      rippleScale.value = withTiming(4, { duration: 400 });
    }
  };

  const handlePressOut = () => {
    if (!disabled) {
      scale.value = withSpring(1, Animation.spring.gentle);
      rippleOpacity.value = withTiming(0, { duration: 300 });
    }
  };

  const handlePress = () => {
    if (!disabled && onPress) {
      runOnJS(triggerHaptic)();
      onPress();
    }
  };

  const sizeStyles = {
    small: { height: 40, paddingHorizontal: Spacing.lg, fontSize: 14 },
    medium: { height: 52, paddingHorizontal: Spacing.xl, fontSize: 16 },
    large: { height: 60, paddingHorizontal: Spacing["2xl"], fontSize: 18 },
  };

  const currentSize = sizeStyles[size];

  const getVariantStyles = () => {
    switch (variant) {
      case "secondary":
        return {
          backgroundColor: theme.backgroundSecondary,
          textColor: theme.primaryDark,
        };
      case "outline":
        return {
          backgroundColor: "transparent",
          textColor: theme.primaryDark,
          borderWidth: 2,
          borderColor: theme.primary,
        };
      case "ghost":
        return {
          backgroundColor: "transparent",
          textColor: theme.primaryDark,
        };
      default:
        return {
          gradient: true,
          textColor: theme.buttonText,
        };
    }
  };

  const variantStyles = getVariantStyles();

  const content = (
    <>
      <Animated.View
        style={[
          styles.ripple,
          {
            left: ripplePosition.x - 50,
            top: ripplePosition.y - 50,
            backgroundColor: theme.primary,
          },
          rippleStyle,
        ]}
      />
      <View style={styles.contentRow}>
        {icon ? <View style={styles.iconContainer}>{icon}</View> : null}
        <ThemedText
          type="body"
          style={[
            styles.buttonText,
            { color: variantStyles.textColor, fontSize: currentSize.fontSize },
          ]}
        >
          {children}
        </ThemedText>
      </View>
    </>
  );

  if (variantStyles.gradient) {
    return (
      <AnimatedPressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          styles.button,
          {
            height: currentSize.height,
            paddingHorizontal: currentSize.paddingHorizontal,
            opacity: disabled ? 0.5 : 1,
          },
          fullWidth && styles.fullWidth,
          style,
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, { borderRadius: BorderRadius.full }]}
        >
          {content}
        </LinearGradient>
      </AnimatedPressable>
    );
  }

  return (
    <AnimatedPressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled}
      style={[
        styles.button,
        styles.buttonInner,
        {
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: variantStyles.backgroundColor,
          borderWidth: variantStyles.borderWidth || 0,
          borderColor: variantStyles.borderColor,
          opacity: disabled ? 0.5 : 1,
        },
        fullWidth && styles.fullWidth,
        style,
        animatedStyle,
      ]}
    >
      {content}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  buttonInner: {
    alignItems: "center",
    justifyContent: "center",
  },
  gradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  fullWidth: {
    width: "100%",
  },
  buttonText: {
    fontWeight: "600",
  },
  contentRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  ripple: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
  },
});
