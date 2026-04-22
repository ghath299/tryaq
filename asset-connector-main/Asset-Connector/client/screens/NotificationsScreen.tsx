import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeIn,
  FadeInDown,
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
  clearAllNotifications,
  sendImmediateNotification,
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
}: {
  item: TaryaqNotification;
  index: number;
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
        onPressIn={() => { scale.value = withSpring(0.98); }}
        onPressOut={() => { scale.value = withSpring(1); }}
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
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    const data = await getStoredNotifications();
    setNotifs(data);
    await markAllRead();
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleClearAll = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    await clearAllNotifications();
    setNotifs([]);
  };

  const handleTestNotif = async () => {
    if (sending) return;
    setSending(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const messages = [
      {
        title: "💊 نصيحة صحية من ترياق",
        body: "تناول وجبة الإفطار يومياً يساعد على تنظيم مستوى السكر في الدم.",
      },
      {
        title: "🏥 تذكير بالموعد",
        body: "لا تنسَ مراجعة طبيبك بشكل دوري للفحص الوقائي والمتابعة الصحية.",
      },
      {
        title: "🎁 عرض جديد من صيدلية النيل",
        body: "خصم 15% على مستلزمات الضغط والسكر هذا الأسبوع فقط.",
      },
      {
        title: "🩺 طبيب جديد متاح",
        body: "د. علي كريم — اختصاصي قلب — بدأ الحجوزات في عيادة البصرة.",
      },
    ];
    const msg = messages[Math.floor(Math.random() * messages.length)];
    await sendImmediateNotification(msg.title, msg.body);
    setTimeout(() => setSending(false), 3000);
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
            { paddingBottom: insets.bottom + 120 },
          ]}
          showsVerticalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <NotifCard item={item} index={index} />
          )}
        />
      )}

      {Platform.OS !== "web" && (
        <Animated.View
          entering={FadeIn.delay(200).duration(400)}
          style={[
            styles.fab,
            { bottom: insets.bottom + 24 },
          ]}
        >
          <Pressable
            onPress={handleTestNotif}
            android_ripple={{ color: "rgba(255,255,255,0.2)", borderless: true }}
            style={{ alignItems: "center", justifyContent: "center", flex: 1 }}
          >
            <LinearGradient
              colors={["#5EDFFF", "#1F6AE1"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.fabGradient}
            >
              {sending ? (
                <Feather name="check-circle" size={22} color="#FFF" />
              ) : (
                <Feather name="send" size={22} color="#FFF" />
              )}
              <ThemedText
                style={{
                  color: "#FFF",
                  fontWeight: "700",
                  marginRight: 8,
                  fontSize: 14,
                }}
              >
                {sending ? "تم الإرسال!" : "اختبر إشعاراً خارجياً"}
              </ThemedText>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      )}
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
  fab: {
    position: "absolute",
    left: Spacing.lg,
    right: Spacing.lg,
    height: 54,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#1F6AE1",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
  },
  fabGradient: {
    flex: 1,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderRadius: BorderRadius.lg,
  },
});
