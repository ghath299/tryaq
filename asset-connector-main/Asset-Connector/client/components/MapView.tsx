import React, { useEffect, useRef } from "react";
import { Platform, View, StyleSheet } from "react-native";
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
  
  if (Platform.OS === "web") {
    // Leaflet often fails in Expo Web, using an iframe for reliability
    const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01}%2C${lat-0.01}%2C${lng+0.01}%2C${lat+0.01}&layer=mapnik&marker=${lat}%2C${lng}`;
    
    return (
      <View style={[styles.webContainer, style]}>
        <iframe
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="no"
          marginHeight={0}
          marginWidth={0}
          src={mapUrl}
          style={{ borderRadius: 12, border: '5px solid red', backgroundColor: 'yellow' }}
        />
      </View>
    );
  }

  // Native fallback
  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundSecondary }, style]}>
      <Feather name="map" size={48} color={theme.primary} />
      <ThemedText type="small" style={{ color: theme.textSecondary, marginTop: Spacing.md, fontWeight: '600' }}>
        الخريطة
      </ThemedText>
      {title ? (
        <ThemedText type="caption" style={{ color: theme.text, marginTop: Spacing.xs, fontWeight: 'bold' }}>
          {title}
        </ThemedText>
      ) : null}
      <View style={styles.coordsContainer}>
        <Feather name="map-pin" size={12} color={theme.primary} />
        <ThemedText type="caption" style={{ color: theme.textSecondary, fontSize: 11, marginLeft: 4 }}>
          {lat.toFixed(4)}, {lng.toFixed(4)}
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
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.05)',
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: 400,
    minHeight: 400,
    borderRadius: 12,
    overflow: 'hidden'
  },
  coordsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    backgroundColor: 'rgba(0,0,0,0.03)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  }
});
