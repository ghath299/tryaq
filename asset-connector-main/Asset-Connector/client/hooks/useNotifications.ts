import { useEffect, useRef } from "react";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const BADGE_KEY = "@taryaq_notif_badge";
const NOTIFS_KEY = "@taryaq_notifications";

export interface TaryaqNotification {
  id: string;
  type: "tip" | "appointment" | "offer" | "system" | "doctor";
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
}

const INITIAL_NOTIFICATIONS: TaryaqNotification[] = [
  {
    id: "n1",
    type: "system",
    title: "مرحباً في ترياق!",
    body: "منصتك الصحية الأولى في العراق. ابحث عن أطباء وصيدليات قريبة منك.",
    time: "الآن",
    read: false,
    icon: "heart",
  },
  {
    id: "n2",
    type: "doctor",
    title: "أطباء متاحون قريباً منك",
    body: "د. أحمد محمد علي — طب عام متاح للحجز اليوم في الكرادة.",
    time: "منذ ساعة",
    read: false,
    icon: "user",
  },
  {
    id: "n3",
    type: "offer",
    title: "عرض خاص من صيدلية الشفاء",
    body: "خصم 20% على الفيتامينات ومكملات المناعة لفترة محدودة.",
    time: "منذ 3 ساعات",
    read: false,
    icon: "tag",
  },
  {
    id: "n4",
    type: "tip",
    title: "نصيحة صحية اليوم",
    body: "شرب 8 أكواب من الماء يومياً يحسّن وظائف الكلى ويطرد السموم من جسمك.",
    time: "أمس",
    read: true,
    icon: "droplet",
  },
  {
    id: "n5",
    type: "appointment",
    title: "تذكير بالموعد",
    body: "موعدك مع د. سارة حسين غداً الساعة 10 صباحاً. لا تنسَ الحضور مبكراً.",
    time: "أمس",
    read: true,
    icon: "calendar",
  },
];

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getStoredNotifications(): Promise<TaryaqNotification[]> {
  try {
    const raw = await AsyncStorage.getItem(NOTIFS_KEY);
    if (raw) return JSON.parse(raw);
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(INITIAL_NOTIFICATIONS));
    return INITIAL_NOTIFICATIONS;
  } catch {
    return INITIAL_NOTIFICATIONS;
  }
}

export async function markAllRead(): Promise<void> {
  try {
    const notifs = await getStoredNotifications();
    const updated = notifs.map((n) => ({ ...n, read: true }));
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    await AsyncStorage.setItem(BADGE_KEY, "0");
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}

export async function markNotifRead(id: string): Promise<void> {
  try {
    const notifs = await getStoredNotifications();
    const updated = notifs.map((n) =>
      n.id === id ? { ...n, read: true } : n
    );
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify(updated));
    const unread = updated.filter((n) => !n.read).length;
    await AsyncStorage.setItem(BADGE_KEY, String(unread));
    await Notifications.setBadgeCountAsync(unread);
  } catch {}
}

export async function clearAllNotifications(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFS_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(BADGE_KEY, "0");
    await Notifications.setBadgeCountAsync(0);
  } catch {}
}

export async function getUnreadCount(): Promise<number> {
  try {
    const raw = await AsyncStorage.getItem(BADGE_KEY);
    if (raw !== null) return parseInt(raw, 10);
    const notifs = await getStoredNotifications();
    const count = notifs.filter((n) => !n.read).length;
    await AsyncStorage.setItem(BADGE_KEY, String(count));
    return count;
  } catch {
    return 0;
  }
}


export async function sendImmediateNotification(
  title: string,
  body: string
): Promise<void> {
  if (Platform.OS === "web") return;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return;
    await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: true },
      trigger: null,
    });
  } catch {}
}

export function useNotificationSetup() {
  const responseListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    (async () => {
      await requestNotificationPermission();
    })();

    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      () => {}
    );

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);
}
