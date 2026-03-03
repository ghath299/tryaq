import React, { useEffect } from "react";
import { ViewStyle } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSpring,
  interpolate,
  Extrapolation,
} from "react-native-reanimated";

import { Animation } from "@/constants/theme";

interface ScrollFadeInProps {
  children: React.ReactNode;
  index?: number;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  style?: ViewStyle;
}

export function ScrollFadeIn({
  children,
  index = 0,
  delay = 0,
  direction = "up",
  style,
}: ScrollFadeInProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    const totalDelay = delay + index * Animation.stagger.normal;
    progress.value = withDelay(
      totalDelay,
      withSpring(1, Animation.spring.gentle),
    );
  }, []);

  const getTranslation = () => {
    switch (direction) {
      case "up":
        return { translateY: 30 };
      case "down":
        return { translateY: -30 };
      case "left":
        return { translateX: 30 };
      case "right":
        return { translateX: -30 };
    }
  };

  const translation = getTranslation();

  const animatedStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      progress.value,
      [0, 1],
      [0, 1],
      Extrapolation.CLAMP,
    );

    if ("translateY" in translation) {
      return {
        opacity,
        transform: [
          {
            translateY: interpolate(
              progress.value,
              [0, 1],
              [translation.translateY ?? 0, 0],
              Extrapolation.CLAMP,
            ),
          },
        ],
      };
    } else {
      return {
        opacity,
        transform: [
          {
            translateX: interpolate(
              progress.value,
              [0, 1],
              [translation.translateX ?? 0, 0],
              Extrapolation.CLAMP,
            ),
          },
        ],
      };
    }
  });

  return (
    <Animated.View style={[animatedStyle, style]}>{children}</Animated.View>
  );
}

interface StaggeredListProps {
  children: React.ReactNode[];
  direction?: "up" | "down" | "left" | "right";
  containerStyle?: ViewStyle;
  itemStyle?: ViewStyle;
}

export function StaggeredList({
  children,
  direction = "up",
  containerStyle,
  itemStyle,
}: StaggeredListProps) {
  return (
    <Animated.View style={containerStyle}>
      {React.Children.map(children, (child, index) => (
        <ScrollFadeIn
          key={index}
          index={index}
          direction={direction}
          style={itemStyle}
        >
          {child}
        </ScrollFadeIn>
      ))}
    </Animated.View>
  );
}
