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
          
          if (!document.getElementById('leaflet-css')) {
            const link = document.createElement('link');
            link.id = 'leaflet-css';
            link.rel = 'stylesheet';
            link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
            link.integrity = 'sha256-p4NxAoJBhIIN+hmNHrzRCf9tD/miZyoHS5obTRR9BMY=';
            link.crossOrigin = '';
            document.head.appendChild(link);
          }

          leafletMap.current = Leaflet.map(mapRef.current).setView([lat, lng], 15);
          
          Leaflet.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap'
          }).addTo(leafletMap.current);

          Leaflet.marker([lat, lng])
            .addTo(leafletMap.current)
            .bindPopup(title || "")
            .openPopup();
          
          setTimeout(() => {
            leafletMap.current?.invalidateSize();
          }, 200);
        } else {
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
            minHeight: '400px',
            borderRadius: '12px',
            zIndex: 1
          }} 
        />
        <style dangerouslySetInnerHTML={{ __html: `
          .leaflet-container { height: 100%; width: 100%; z-index: 1; }
        `}} />
      </View>
    );
  }

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
  },
  webContainer: {
    flex: 1,
    width: '100%',
    height: 400,
    minHeight: 400,
    borderRadius: 12,
    overflow: 'hidden'
  }
});
