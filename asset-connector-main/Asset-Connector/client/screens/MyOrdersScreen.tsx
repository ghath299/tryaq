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
import { orders } from "@/data/mockData";

export default function MyOrdersScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();

  const renderOrder = ({
    item,
    index,
  }: {
    item: (typeof orders)[0];
    index: number;
  }) => {
    const pharmacyName =
      language === "ar" ? item.pharmacyNameAr : item.pharmacyNameEn;

    const getStatusColor = () => {
      switch (item.status) {
        case "delivered":
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
          android_ripple={{ color: "transparent" }}
          style={[
            styles.orderCard,
            { backgroundColor: theme.backgroundDefault },
          ]}
        >
          <View style={styles.orderHeader}>
            <View
              style={[styles.icon, { backgroundColor: theme.primary + "20" }]}
            >
              <Feather name="package" size={24} color={theme.primary} />
            </View>
            <View style={styles.orderInfo}>
              <ThemedText type="h4" numberOfLines={1}>
                {pharmacyName}
              </ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {item.medicines.length} {language === "ar" ? "عنصر" : "items"}
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

          <View style={styles.orderDetails}>
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
              <Feather
                name={
                  item.deliveryType === "delivery" ? "truck" : "shopping-bag"
                }
                size={14}
                color={theme.textSecondary}
              />
              <ThemedText
                type="small"
                style={{ color: theme.textSecondary, marginLeft: Spacing.xs }}
              >
                {item.deliveryType === "delivery" ? t("delivery") : t("pickUp")}
              </ThemedText>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: theme.border }]} />

          <View style={styles.medicinesList}>
            {item.medicines.map((medicine, i) => (
              <View key={i} style={styles.medicineItem}>
                <ThemedText type="small">{medicine.name}</ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  x{medicine.quantity}
                </ThemedText>
              </View>
            ))}
          </View>
        </Pressable>
      </Animated.View>
    );
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-medicines.png")}
      title={t("emptyOrders")}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <FlatList
        data={orders}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.list,
          {
            paddingTop: headerHeight + Spacing.lg,
            paddingBottom: insets.bottom + Spacing.xl,
          },
          orders.length === 0 && styles.emptyList,
        ]}
        scrollIndicatorInsets={{ bottom: insets.bottom }}
        showsVerticalScrollIndicator={false}
        renderItem={renderOrder}
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
  orderCard: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.md,
  },
  orderHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.md,
  },
  icon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  orderInfo: {
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  orderDetails: {
    flexDirection: "row",
    gap: Spacing.lg,
    marginLeft: 64,
    marginBottom: Spacing.md,
  },
  detailItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    marginBottom: Spacing.md,
  },
  medicinesList: {
    marginLeft: 64,
  },
  medicineItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
});
