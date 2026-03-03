import React from "react";
import { View, StyleSheet, FlatList, Pressable } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";

import { ThemedText } from "@/components/ThemedText";
import { EmptyState } from "@/components/EmptyState";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { bookings } from "@/data/mockData";

export default function MyBookingsScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();

  const renderBooking = ({
    item,
    index,
  }: {
    item: (typeof bookings)[0];
    index: number;
  }) => {
    const doctorName =
      language === "ar" ? item.doctorNameAr : item.doctorNameEn;
    const specialty = language === "ar" ? item.specialtyAr : item.specialtyEn;

    const getStatusColor = () => {
      switch (item.status) {
        case "confirmed":
          return theme.success;
        case "pending":
          return theme.warning;
        case "cancelled":
          return theme.error;
        default:
          return theme.textSecondary;
      }
    };

    return (
      <Animated.View entering={FadeInUp.delay(index * 50).duration(300)}>
        <Pressable
          style={[
            styles.bookingCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.bookingHeader}>
            <View
              style={[styles.avatar, { backgroundColor: theme.primary + "20" }]}
            >
              <Feather name="user" size={24} color={theme.primary} />
            </View>
            <View style={styles.bookingInfo}>
              <ThemedText type="h4" numberOfLines={1}>
                {doctorName}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {specialty}
              </ThemedText>
            </View>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor() + "20" },
              ]}
            >
              <ThemedText type="caption" style={{ color: getStatusColor() }}>
                {item.status}
              </ThemedText>
            </View>
          </View>

          <View style={styles.bookingDetails}>
            <View style={styles.detailItem}>
              <Feather name="calendar" size={14} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
              >
                {item.date}
              </ThemedText>
            </View>
            <View style={styles.detailItem}>
              <Feather name="clock" size={14} color={theme.textSecondary} />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
              >
                {item.time}
              </ThemedText>
            </View>
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-bookings.png")}
      title={t("emptyBookings")}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={bookings}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          bookings.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={renderBooking}
        ListEmptyComponent={renderEmpty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: Spacing.lg,
  },
  emptyList: {
    flex: 1,
  },
  bookingCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  bookingHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  bookingInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  bookingDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginLeft: 64,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
});
