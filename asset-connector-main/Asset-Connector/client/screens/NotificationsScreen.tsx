import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Modal,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  FadeOut,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, BorderRadius, addAlpha } from "@/constants/theme";
import {
  TaryaqNotification,
  getStoredNotifications,
  markAllRead,
  markNotifRead,
  clearAllNotifications,
} from "@/hooks/useNotifications";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

const TYPE_CONFIG: Record<
  TaryaqNotification["type"],
  { color: string; bg: string; icon: string; label: string }
> = {
  tip: {
    color: "#10B981",
    bg: "#10B98118",
    icon: "droplet",
    label: "نصيحة صحية",
  },
  appointment: {
    color: "#F59E0B",
    bg: "#F59E0B18",
    icon: "calendar",
    label: "موعد",
  },
  offer: {
    color: "#8B5CF6",
    bg: "#8B5CF618",
    icon: "tag",
    label: "عرض",
  },
  system: {
    color: "#5EDFFF",
    bg: "#5EDFFF18",
    icon: "bell",
    label: "إشعار",
  },
  doctor: {
    color: "#1F6AE1",
    bg: "#1F6AE118",
    icon: "user",
    label: "طبيب",
  },
};

function NotifCard({
  item,
  index,
  onPress,
}: {
  item: TaryaqNotification;
  index: number;
  onPress: (n: TaryaqNotification) => void;
}) {
  const { theme, isDark } = useTheme();
  const scale = useSharedValue(1);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  const cfg = TYPE_CONFIG[item.type];

  return (
    <Animated.View
      entering={FadeInDown.delay(index * 50).duration(300)}
      exiting={FadeOut.duration(200)}
    >
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.97); }}
        onPressOut={() => { scale.value = withSpring(1); }}
        onPress={() => onPress(item)}
        style={[
          styles.card,
          animStyle,
          {
            backgroundColor: isDark ? theme.card : "#FFFFFF",
            borderColor: item.read
              ? theme.border
              : addAlpha(cfg.color, 0.35),
            borderWidth: item.read ? 1 : 1.5,
          },
        ]}
      >
        {!item.read && (
          <View style={[styles.unreadDot, { backgroundColor: cfg.color }]} />
        )}

        <View
          style={[
            styles.iconWrap,
            { backgroundColor: cfg.bg },
          ]}
        >
          <Feather name={cfg.icon as any} size={20} color={cfg.color} />
        </View>

        <View style={styles.cardBody}>
          <View style={styles.cardTop}>
            <ThemedText
              type="caption"
              style={[styles.cardTime, { color: theme.textSecondary }]}
            >
              {item.time}
            </ThemedText>
            <View
              style={[
                styles.typeBadge,
                { backgroundColor: cfg.bg },
              ]}
            >
              <ThemedText
                type="caption"
                style={{ color: cfg.color, fontSize: 10, fontWeight: "700" }}
              >
                {cfg.label}
              </ThemedText>
            </View>
          </View>

          <ThemedText
            type="body"
            style={[
              styles.cardTitle,
              {
                color: item.read ? theme.textSecondary : theme.text,
                fontWeight: item.read ? "500" : "700",
              },
            ]}
            numberOfLines={1}
          >
            {item.title}
          </ThemedText>

          <ThemedText
            type="caption"
            style={[styles.cardDesc, { color: theme.textSecondary }]}
            numberOfLines={2}
          >
            {item.body}
          </ThemedText>
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<any>();
  const { theme, isDark } = useTheme();

  const [notifs, setNotifs] = useState<TaryaqNotification[]>([]);
  const [selectedNotif, setSelectedNotif] = useState<TaryaqNotification | null>(null);

  const load = useCallback(async () => {
    const data = await getStoredNotifications();
    setNotifs(data);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearAllNotifications();
    setNotifs([]);
  };

  const handleNotifPress = async (item: TaryaqNotification) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!item.read) {
      await markNotifRead(item.id);
      setNotifs((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
    setSelectedNotif({ ...item, read: true });
  };

  const handleModalNavigate = () => {
    if (!selectedNotif) return;
    setSelectedNotif(null);
    if (selectedNotif.type === "appointment") {
      navigation.navigate("MyBookings");
    } else if (selectedNotif.type === "doctor") {
      navigation.goBack();
    }
  };

  const unreadCount = notifs.filter((n) => !n.read).length;

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.backgroundRoot },
      ]}
    >
      <LinearGradient
        colors={
          isDark
            ? [theme.backgroundRoot, theme.backgroundRoot]
            : ["#E8F8FB", theme.backgroundRoot]
        }
        style={[styles.header, { paddingTop: insets.top + 4 }]}
      >
        <View style={styles.headerRow}>
          <Pressable
            onPress={() => navigation.goBack()}
            hitSlop={10}
            style={[
              styles.backBtn,
              { backgroundColor: addAlpha(theme.primary, 0.1) },
            ]}
          >
            <Feather name="arrow-right" size={20} color={theme.primary} />
          </Pressable>

          <ThemedText
            type="h4"
            style={{ color: theme.text, fontWeight: "700", flex: 1, textAlign: "center" }}
          >
            الإشعارات
          </ThemedText>

          {notifs.length > 0 ? (
            <Pressable
              onPress={handleClearAll}
              hitSlop={10}
              style={[
                styles.clearBtn,
                { backgroundColor: addAlpha(theme.error, 0.1) },
              ]}
            >
              <Feather name="trash-2" size={16} color={theme.error} />
            </Pressable>
          ) : (
            <View style={{ width: 36 }} />
          )}
        </View>

        {notifs.length > 0 && (
          <Animated.View entering={FadeIn.duration(300)} style={styles.statsRow}>
            <View
              style={[
                styles.statChip,
                { backgroundColor: addAlpha(theme.primary, 0.1) },
              ]}
            >
              <Feather name="bell" size={13} color={theme.primary} />
              <ThemedText
                type="caption"
                style={{ color: theme.primary, fontWeight: "700", marginRight: 4 }}
              >
                {notifs.length} إشعار
              </ThemedText>
            </View>
            {unreadCount > 0 && (
              <View
                style={[
                  styles.statChip,
                  { backgroundColor: addAlpha("#EF4444", 0.1) },
                ]}
              >
                <View
                  style={[
                    styles.dot,
                    { backgroundColor: "#EF4444" },
                  ]}
                />
                <ThemedText
                  type="caption"
                  style={{ color: "#EF4444", fontWeight: "700", marginRight: 4 }}
                >
                  {unreadCount} غير مقروء
                </ThemedText>
              </View>
            )}
          </Animated.View>
        )}
      </LinearGradient>

      {notifs.length === 0 ? (
        <Animated.View
          entering={FadeIn.duration(400)}
          style={styles.emptyWrap}
        >
          <View
            style={[
              styles.emptyIcon,
              { backgroundColor: addAlpha(theme.primary, 0.1) },
            ]}
          >
            <Feather name="bell-off" size={40} color={theme.primary} />
          </View>
          <ThemedText
            type="h4"
            style={{ color: theme.text, textAlign: "center", marginTop: Spacing.md }}
          >
            لا توجد إشعارات
          </ThemedText>
          <ThemedText
            type="body"
            style={{
              color: theme.textSecondary,
              textAlign: "center",
              marginTop: 6,
            }}
          >
            ستصلك الإشعارات الجديدة هنا
          </ThemedText>
        </Animated.View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.list,
            { paddingBottom: insets.bottom + 24 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NotifCard item={item} index={index} onPress={handleNotifPress} />
          )}
        />
      )}

      {/* Detail Modal */}
      <Modal
        visible={!!selectedNotif}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSelectedNotif(null)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setSelectedNotif(null)}
        >
          <Animated.View
            entering={FadeInUp.springify().damping(18).stiffness(160)}
            style={[
              styles.modalSheet,
              { backgroundColor: isDark ? theme.card : "#FFFFFF" },
            ]}
          >
            <Pressable onPress={() => {}}>
              {selectedNotif && (() => {
                const cfg = TYPE_CONFIG[selectedNotif.type];
                const showNav =
                  selectedNotif.type === "appointment" ||
                  selectedNotif.type === "doctor";
                return (
                  <>
                    {/* Handle */}
                    <View
                      style={[
                        styles.modalHandle,
                        { backgroundColor: addAlpha(theme.text, 0.15) },
                      ]}
                    />

                    {/* Icon + Type */}
                    <View style={styles.modalHeader}>
                      <View
                        style={[
                          styles.modalIcon,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <Feather name={cfg.icon as any} size={26} color={cfg.color} />
                      </View>
                      <View
                        style={[
                          styles.typeBadge,
                          { backgroundColor: cfg.bg },
                        ]}
                      >
                        <ThemedText
                          type="caption"
                          style={{ color: cfg.color, fontWeight: "700", fontSize: 12 }}
                        >
                          {cfg.label}
                        </ThemedText>
                      </View>
                    </View>

                    {/* Title */}
                    <ThemedText
                      type="h4"
                      style={[styles.modalTitle, { color: theme.text }]}
                    >
                      {selectedNotif.title}
                    </ThemedText>

                    {/* Time */}
                    <ThemedText
                      type="caption"
                      style={[styles.modalTime, { color: theme.textSecondary }]}
                    >
                      {selectedNotif.time}
                    </ThemedText>

                    {/* Body */}
                    <ScrollView style={styles.modalBodyScroll} showsVerticalScrollIndicator={false}>
                      <ThemedText
                        type="body"
                        style={[styles.modalBody, { color: theme.textSecondary }]}
                      >
                        {selectedNotif.body}
                      </ThemedText>
                    </ScrollView>

                    {/* Actions */}
                    <View style={styles.modalActions}>
                      <Pressable
                        onPress={() => setSelectedNotif(null)}
                        style={[
                          styles.modalBtn,
                          styles.modalBtnSecondary,
                          { backgroundColor: addAlpha(theme.text, 0.07) },
                        ]}
                      >
                        <ThemedText
                          type="body"
                          style={{ color: theme.textSecondary, fontWeight: "600" }}
                        >
                          إغلاق
                        </ThemedText>
                      </Pressable>

                      {showNav && (
                        <Pressable
                          onPress={handleModalNavigate}
                          style={[
                            styles.modalBtn,
                            styles.modalBtnPrimary,
                            { backgroundColor: cfg.color },
                          ]}
                        >
                          <ThemedText
                            type="body"
                            style={{ color: "#FFFFFF", fontWeight: "700" }}
                          >
                            {selectedNotif.type === "appointment"
                              ? "عرض المواعيد"
                              : "الأطباء"}
                          </ThemedText>
                          <Feather
                            name="arrow-left"
                            size={16}
                            color="#FFFFFF"
                            style={{ marginRight: 4 }}
                          />
                        </Pressable>
                      )}
                    </View>
                  </>
                );
              })()}
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  headerRow: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  clearBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  statChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.sm + 2,
  },
  card: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    flexDirection: "row-reverse",
    alignItems: "flex-start",
    gap: Spacing.md,
    position: "relative",
    overflow: "hidden",
  },
  unreadDot: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardBody: {
    flex: 1,
    gap: 3,
  },
  cardTop: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTime: {
    fontSize: 11,
  },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
  },
  cardTitle: {
    textAlign: "right",
    lineHeight: 20,
  },
  cardDesc: {
    textAlign: "right",
    lineHeight: 18,
    fontSize: 12,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 36,
    paddingTop: 12,
    maxHeight: "80%",
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: Spacing.md,
  },
  modalHeader: {
    flexDirection: "row-reverse",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalIcon: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    textAlign: "right",
    fontWeight: "700",
    lineHeight: 28,
    marginBottom: 6,
  },
  modalTime: {
    textAlign: "right",
    marginBottom: Spacing.md,
    fontSize: 12,
  },
  modalBodyScroll: {
    maxHeight: 140,
    marginBottom: Spacing.lg,
  },
  modalBody: {
    textAlign: "right",
    lineHeight: 24,
    fontSize: 15,
  },
  modalActions: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
  },
  modalBtn: {
    flex: 1,
    height: 48,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row-reverse",
  },
  modalBtnSecondary: {},
  modalBtnPrimary: {},
});
