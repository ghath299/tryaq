import React from "react";
import { View, StyleSheet, Platform } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing } from "@/constants/theme";

interface MapPlaceholderProps {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  style?: any;
}

export function MapPlaceholder({
  lat,
  lng,
  title,
  description,
  style,
}: MapPlaceholderProps) {
  const { theme } = useTheme();
  const { t } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }, style]}>
      <Feather name="map-pin" size={48} color={theme.textSecondary} />
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
        TESTING: AI IS WORKING
      </ThemedText>
      {title ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {title}
        </ThemedText>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 200,
  },
});
