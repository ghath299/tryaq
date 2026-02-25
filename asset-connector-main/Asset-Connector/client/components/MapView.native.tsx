import React from "react";
import { StyleSheet, View } from "react-native";
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
      <View style={[styles.iconCircle, { backgroundColor: theme.primary + '15' }]}>
        <Feather name="map" size={40} color={theme.primary} />
      </View>
      
      <ThemedText type="h4" style={{ color: theme.text, marginTop: Spacing.md }}>
        {t("map") || "الخريطة"}
      </ThemedText>
      
      {title ? (
        <ThemedText type="body" style={{ color: theme.textSecondary, marginTop: 4, textAlign: 'center' }}>
          {title}
        </ThemedText>
      ) : null}

      <View style={[styles.coordsBadge, { backgroundColor: theme.backgroundRoot }]}>
        <Feather name="map-pin" size={12} color={theme.primary} />
        <ThemedText type="caption" style={{ color: theme.textSecondary, marginLeft: 6, fontWeight: '600' }}>
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 220,
    padding: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  coordsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  }
});
