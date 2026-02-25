import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing } from "@/constants/theme";

interface MapViewComponentProps {
  lat: number;
  lng: number;
  title?: string;
  description?: string;
  style?: any;
}

export function MapViewComponent({
  lat,
  lng,
  title,
  description,
  style,
}: MapViewComponentProps) {
  const { theme } = useTheme();
  const { t } = useApp();

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }, style]}>
      <Feather name="map-pin" size={48} color={theme.textSecondary} />
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
        {t("map")}
      </ThemedText>
      {title ? (
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.xs }}>
          {title}
        </ThemedText>
      ) : null}
      <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 10 }}>
        ({lat.toFixed(4)}, {lng.toFixed(4)})
      </ThemedText>
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
