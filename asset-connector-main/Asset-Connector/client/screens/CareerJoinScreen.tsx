import React from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius } from "@/constants/theme";

interface CareerJoinScreenProps {
  type: "doctor" | "pharmacist";
}

export default function CareerJoinScreen({ route }: any) {
  const { type } = route.params as CareerJoinScreenProps;
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const title = type === "doctor" ? "انضم كطبيب" : "انضم كصيدلاني";
  const message = type === "doctor" 
    ? "سيتم فتح باب التقديم للأطباء قريبًا" 
    : "سيتم فتح باب التقديم للصيادلة قريبًا";

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + Spacing.xl, paddingBottom: insets.bottom + Spacing.xl }
        ]}
      >
        <View style={[styles.iconContainer, { backgroundColor: theme.primary + "15" }]}>
          <Feather 
            name={type === "doctor" ? "user-plus" : "plus-square"} 
            size={48} 
            color={theme.primary} 
          />
        </View>
        
        <ThemedText type="h2" style={styles.title}>
          {title}
        </ThemedText>
        
        <View style={[styles.card, { backgroundColor: theme.backgroundDefault }]}>
          <ThemedText type="body" style={styles.message}>
            {message}
          </ThemedText>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
    justifyContent: "center",
    flexGrow: 1,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.lg,
    textAlign: "center",
  },
  card: {
    padding: Spacing.xl,
    borderRadius: BorderRadius.lg,
    width: "100%",
    alignItems: "center",
  },
  message: {
    textAlign: "center",
    lineHeight: 24,
  },
});
