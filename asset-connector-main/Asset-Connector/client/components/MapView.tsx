import React, { useEffect, useRef } from "react";
import { Platform, View, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing } from "@/constants/theme";

// Conditional import for Leaflet on web
let L: any;
if (Platform.OS === "web") {
  try {
    // We'll use a script injection approach for simplicity in this environment
    // or rely on the user having added the CDN links to the index.html
  } catch (e) {}
}

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
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMap = useRef<any>(null);

  useEffect(() => {
    if (Platform.OS === "web" && mapRef.current) {
      const initMap = () => {
        // @ts-ignore
        if (typeof window !== "undefined" && window.L) {
          // @ts-ignore
          const Leaflet = window.L;
          if (leafletMap.current) {
            leafletMap.current.remove();
          }
          
          leafletMap.current = Leaflet.map(mapRef.current).setView([lat, lng], 13);
          
          Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(leafletMap.current);

          Leaflet.marker([lat, lng])
            .addTo(leafletMap.current)
            .bindPopup(title || "")
            .openPopup();
        } else {
          // Retry if Leaflet isn't loaded yet
          setTimeout(initMap, 500);
        }
      };

      initMap();
    }

    return () => {
      if (leafletMap.current) {
        leafletMap.current.remove();
        leafletMap.current = null;
      }
    };
  }, [lat, lng, title]);

  if (Platform.OS === "web") {
    return (
      <View style={[styles.webContainer, style]}>
        <div 
          ref={mapRef} 
          style={{ 
            width: '100%', 
            height: '100%', 
            minHeight: '200px',
            borderRadius: '12px'
          }} 
        />
      </View>
    );
  }

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
  webContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
    minHeight: 200,
  }
});
