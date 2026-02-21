import React from "react";
import { Platform, StyleSheet } from "react-native";
import RNMapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";

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
  return (
    <RNMapView
      style={[styles.map, style]}
      provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
      initialRegion={{
        latitude: lat,
        longitude: lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      }}
    >
      <Marker
        coordinate={{ latitude: lat, longitude: lng }}
        title={title}
        description={description}
      />
    </RNMapView>
  );
}

const styles = StyleSheet.create({
  map: {
    flex: 1,
    minHeight: 200,
  },
});
