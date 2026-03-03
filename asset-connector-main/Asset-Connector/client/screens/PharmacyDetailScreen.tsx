import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  KeyboardAvoidingView,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { ThemedText } from "@/components/ThemedText";
import { MapViewComponent } from "@/components/MapView";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { BorderRadius, Spacing } from "@/constants/theme";
import { pharmacies } from "@/data/mockData";
import { getApiUrl } from "@/lib/query-client";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

type PharmacyDetailRouteProp = RouteProp<
  { PharmacyDetail: { pharmacyId: string } },
  "PharmacyDetail"
>;

type ChatMessage = {
  id: string;
  text?: string;
  imageUrl?: string;
  sender: "patient" | "pharmacy";
  createdAt: string;
  status?: "sending" | "sent" | "failed";
};

type MessagesResponse = {
  items: ChatMessage[];
  hasMore?: boolean;
  nextBefore?: string | null;
};

const CHAT_PAGE_SIZE = 30;

const QUICK_ACTIONS = [
  "اسأل عن السعر",
  "هل الدواء متوفر؟",
  "متى يمكنني الاستلام؟",
];

export default function PharmacyDetailScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { language, t } = useApp();
  const route = useRoute<PharmacyDetailRouteProp>();
  const apiUrl = getApiUrl();
  const chatListRef = useRef<FlatList<ChatMessage>>(null);

  const pharmacyId = route.params?.pharmacyId;
  const pharmacy = useMemo(
    () => pharmacies.find((p) => p.id === pharmacyId),
    [pharmacyId],
  );

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [isMapExpanded, setIsMapExpanded] = useState(false);

  const mapHeight = useSharedValue(220);

  const animatedMapStyle = useAnimatedStyle(() => ({
    height: mapHeight.value,
  }));

  const toggleMap = () => {
    const nextValue = isMapExpanded ? 220 : SCREEN_HEIGHT * 0.5;
    mapHeight.value = withSpring(nextValue, { damping: 15 });
    setIsMapExpanded(!isMapExpanded);
  };

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      chatListRef.current?.scrollToEnd({ animated: true });
    });
  }, []);

  const mergeMessages = useCallback(
    (current: ChatMessage[], incoming: ChatMessage[]) => {
      const map = new Map<string, ChatMessage>();
      [...current, ...incoming].forEach((msg) => map.set(msg.id, msg));

      return [...map.values()].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      );
    },
    [],
  );

  const fetchMessages = useCallback(
    async (before?: string | null) => {
      if (!pharmacyId) return null;
      const params = new URLSearchParams({ limit: String(CHAT_PAGE_SIZE) });
      if (before) params.set("before", before);
      const url = `${apiUrl}/api/chats/${pharmacyId}/messages?${params.toString()}`;
      try {
        const response = await fetch(url);
        if (!response.ok)
          throw new Error(`Failed to fetch chat messages: ${response.status}`);
        return (await response.json()) as MessagesResponse;
      } catch (err) {
        console.error("PharmacyDetailScreen: GET error", err);
        throw err;
      }
    },
    [apiUrl, pharmacyId],
  );

  useEffect(() => {
    const loadInitialMessages = async () => {
      if (!pharmacyId) return;
      setIsLoadingMessages(true);
      try {
        const data = await fetchMessages();
        if (!data) return;
        setMessages(data.items || []);
        setHasMoreMessages(Boolean(data.hasMore));
        setNextBefore(data.nextBefore || null);
      } catch (error) {
        console.error("PharmacyDetailScreen: Initial load error", error);
      } finally {
        setIsLoadingMessages(false);
        setTimeout(scrollToBottom, 100);
      }
    };
    loadInitialMessages();
  }, [fetchMessages, pharmacyId, scrollToBottom]);

  if (!pharmacy) {
    return (
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.backgroundRoot,
            justifyContent: "center",
            alignItems: "center",
          },
        ]}
      >
        <ThemedText type="body">{t("error")}</ThemedText>
      </View>
    );
  }

  const name = language === "ar" ? pharmacy.nameAr : pharmacy.nameEn;
  const province =
    language === "ar" ? pharmacy.provinceAr : pharmacy.provinceEn;

  const callPhone = () =>
    Linking.openURL(`tel:${pharmacy.phone.replace(/\s+/g, "")}`);
  const openWhatsApp = () =>
    Linking.openURL(`https://wa.me/${pharmacy.phone.replace(/\D/g, "")}`);
  const copyPhone = async () => {
    const clipboard = (globalThis as any)?.navigator?.clipboard;
    if (Platform.OS === "web" && clipboard) {
      await clipboard.writeText(pharmacy.phone);
      Alert.alert("تم", "تم نسخ الرقم.");
      return;
    }
    Alert.alert("نسخ الرقم", pharmacy.phone);
  };

  const handleSendText = async () => {
    const text = messageText.trim();
    if (!text) return;
    setMessageText("");
    await sendOptimisticMessage({ text });
  };

  const sendOptimisticMessage = async (payload: {
    text?: string;
    imageUrl?: string;
  }) => {
    const optimisticId = `local-${Date.now()}`;
    const optimisticMessage: ChatMessage = {
      id: optimisticId,
      sender: "patient",
      createdAt: new Date().toISOString(),
      status: "sending",
      ...payload,
    };
    setMessages((prev) => mergeMessages(prev, [optimisticMessage]));
    scrollToBottom();
    try {
      const url = `${apiUrl}/api/chats/${pharmacyId}/messages`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok)
        throw new Error(`Failed to send message: ${response.status}`);
      const data = await response.json();
      const confirmedMessage = data.item as ChatMessage;
      setMessages((prev) => {
        const next = prev.filter((item) => item.id !== optimisticId);
        return mergeMessages(next, [{ ...confirmedMessage, status: "sent" }]);
      });
      scrollToBottom();
    } catch {
      setMessages((prev) =>
        prev.map((item) =>
          item.id === optimisticId ? { ...item, status: "failed" } : item,
        ),
      );
    }
  };

  const handleSendImage = async () => {
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (cameraStatus !== "granted" && libraryStatus !== "granted") {
      Alert.alert("خطأ", "يلزم السماح بالوصول إلى الكاميرا أو المعرض.");
      return;
    }
    Alert.alert("إرسال صورة", "اختر المصدر", [
      {
        text: "Camera",
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri)
            await uploadImageFromUri(result.assets[0].uri);
        },
      },
      {
        text: "Gallery",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0]?.uri)
            await uploadImageFromUri(result.assets[0].uri);
        },
      },
      { text: "إلغاء", style: "cancel" },
    ]);
  };

  const uploadImageFromUri = async (uri: string) => {
    try {
      const resized = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 900 } }],
        { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG },
      );
      await sendOptimisticMessage({ imageUrl: resized.uri });
      const formData = new FormData();
      const filename = resized.uri.split("/").pop() || `chat-${Date.now()}.jpg`;
      // @ts-ignore
      formData.append("image", {
        uri: resized.uri,
        type: "image/jpeg",
        name: filename,
      });
      const response = await fetch(`${apiUrl}/api/uploads/chat-image`, {
        method: "POST",
        headers: { Accept: "application/json" },
        body: formData,
      });
      if (!response.ok) throw new Error("Upload failed");
      const data = await response.json();
      setMessages((prev) =>
        prev.map((m) =>
          m.imageUrl === resized.uri
            ? { ...m, imageUrl: data.imageUrl, status: "sent" }
            : m,
        ),
      );
    } catch (error) {
      Alert.alert("خطأ", "فشل رفع الصورة.");
    }
  };

  const handleLoadMore = async () => {
    if (!hasMoreMessages || !nextBefore || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await fetchMessages(nextBefore);
      if (!data) return;
      setMessages((prev) => mergeMessages(data.items || [], prev));
      setHasMoreMessages(Boolean(data.hasMore));
      setNextBefore(data.nextBefore || null);
    } catch (error) {
      Alert.alert("خطأ", "فشل تحميل الرسائل الأقدم.");
    } finally {
      setIsLoadingMore(false);
    }
  };

  const sortedMessages = useMemo(
    () =>
      [...messages].sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      ),
    [messages],
  );

  const renderHeader = () => (
    <Animated.View entering={FadeIn.duration(600)} style={styles.header}>
      <Animated.View style={[styles.mapContainer, animatedMapStyle]}>
        <MapViewComponent lat={pharmacy.lat} lng={pharmacy.lng} title={name} />
        <Pressable
          style={[
            styles.mapToggleBtn,
            { backgroundColor: theme.backgroundSecondary },
          ]}
          onPress={toggleMap}
        >
          <Feather
            name={isMapExpanded ? "minimize-2" : "maximize-2"}
            size={18}
            color={theme.primary}
          />
        </Pressable>
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.pharmacyHeaderInfo}>
          <ThemedText type="h2" style={styles.pharmacyNameText}>
            {name}
          </ThemedText>
          <View style={styles.provinceRow}>
            <Feather name="map-pin" size={14} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.textSecondary }}>
              {province}
            </ThemedText>
          </View>
        </View>

        <View style={styles.actionGrid}>
          <Pressable
            style={[styles.gridActionBtn, { backgroundColor: theme.primary }]}
            onPress={callPhone}
          >
            <Feather name="phone-call" size={18} color="#FFF" />
            <ThemedText
              type="small"
              style={{ color: "#FFF", fontWeight: "600" }}
            >
              اتصال
            </ThemedText>
          </Pressable>
          <Pressable
            style={[styles.gridActionBtn, { backgroundColor: "#25D366" }]}
            onPress={openWhatsApp}
          >
            <Feather name="message-circle" size={18} color="#FFF" />
            <ThemedText
              type="small"
              style={{ color: "#FFF", fontWeight: "600" }}
            >
              واتساب
            </ThemedText>
          </Pressable>
          <Pressable
            style={[
              styles.gridActionBtn,
              {
                backgroundColor: theme.backgroundSecondary,
                borderWidth: 1,
                borderColor: theme.border,
              },
            ]}
            onPress={copyPhone}
          >
            <Feather name="copy" size={18} color={theme.text} />
            <ThemedText type="small" style={{ fontWeight: "600" }}>
              نسخ الرقم
            </ThemedText>
          </Pressable>
        </View>

        <View
          style={[
            styles.chatHeaderSection,
            { borderBottomColor: theme.border },
          ]}
        >
          <View style={styles.chatTitleRow}>
            <View style={[styles.dot, { backgroundColor: "#4CD964" }]} />
            <ThemedText type="h4">المحادثة المباشرة</ThemedText>
          </View>
          {hasMoreMessages && (
            <Pressable
              style={styles.inlineLoadMore}
              onPress={handleLoadMore}
              disabled={isLoadingMore}
            >
              <ThemedText type="caption" style={{ color: theme.primary }}>
                {isLoadingMore ? "جاري التحميل..." : "رسائل أقدم"}
              </ThemedText>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundRoot }]}
    >
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={headerHeight}
      >
        <FlatList
          ref={chatListRef}
          data={sortedMessages}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={renderHeader}
          contentContainerStyle={styles.chatListContent}
          onContentSizeChange={scrollToBottom}
          ListEmptyComponent={
            isLoadingMessages ? (
              <ActivityIndicator
                color={theme.primary}
                style={{ marginTop: 40 }}
              />
            ) : (
              <View style={styles.emptyChat}>
                <Feather name="message-square" size={40} color={theme.border} />
                <ThemedText
                  type="caption"
                  style={{ color: theme.textSecondary, marginTop: Spacing.sm }}
                >
                  ابدأ المحادثة مع الصيدلية
                </ThemedText>
              </View>
            )
          }
          renderItem={({ item }) => (
            <Animated.View
              entering={FadeInUp.duration(400)}
              style={[
                styles.messageContainer,
                {
                  alignItems:
                    item.sender === "patient" ? "flex-end" : "flex-start",
                },
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  {
                    backgroundColor:
                      item.sender === "patient"
                        ? theme.primary
                        : theme.backgroundSecondary,
                    borderBottomRightRadius:
                      item.sender === "patient" ? 4 : BorderRadius.lg,
                    borderBottomLeftRadius:
                      item.sender === "pharmacy" ? 4 : BorderRadius.lg,
                  },
                ]}
              >
                {item.text ? (
                  <ThemedText
                    type="body"
                    style={{
                      color: item.sender === "patient" ? "#FFF" : theme.text,
                    }}
                  >
                    {item.text}
                  </ThemedText>
                ) : null}
                {item.imageUrl ? (
                  <Image
                    source={{ uri: item.imageUrl }}
                    style={styles.messageImage}
                    resizeMode="cover"
                  />
                ) : null}
                <View style={styles.messageMeta}>
                  <ThemedText
                    type="caption"
                    style={[
                      styles.messageTime,
                      {
                        color:
                          item.sender === "patient"
                            ? "rgba(255,255,255,0.7)"
                            : theme.textSecondary,
                      },
                    ]}
                  >
                    {new Date(item.createdAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </ThemedText>
                  {item.sender === "patient" && (
                    <Feather
                      name={
                        item.status === "failed"
                          ? "alert-circle"
                          : item.status === "sending"
                            ? "clock"
                            : "check"
                      }
                      size={10}
                      color={
                        item.status === "failed"
                          ? "#FF3B30"
                          : "rgba(255,255,255,0.7)"
                      }
                    />
                  )}
                </View>
              </View>
            </Animated.View>
          )}
        />

        <View
          style={[
            styles.chatInputWrapper,
            {
              paddingBottom: insets.bottom + Spacing.sm,
              backgroundColor: theme.backgroundRoot,
            },
          ]}
        >
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.quickActionsScroll}
            contentContainerStyle={styles.quickActionsContent}
          >
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action}
                style={[
                  styles.quickActionChip,
                  { backgroundColor: theme.backgroundSecondary },
                ]}
                onPress={() => setMessageText(action)}
              >
                <ThemedText type="caption" style={{ color: theme.text }}>
                  {action}
                </ThemedText>
              </Pressable>
            ))}
          </ScrollView>
          <View style={styles.composerContainer}>
            <Pressable
              onPress={handleSendImage}
              style={[
                styles.attachBtn,
                { backgroundColor: theme.backgroundSecondary },
              ]}
            >
              <Feather name="image" size={20} color={theme.primary} />
            </Pressable>
            <TextInput
              value={messageText}
              onChangeText={setMessageText}
              placeholder="اكتب رسالة..."
              multiline
              style={[
                styles.composerInput,
                {
                  backgroundColor: theme.backgroundSecondary,
                  color: theme.text,
                },
              ]}
              placeholderTextColor={theme.textSecondary}
            />
            <Pressable
              onPress={handleSendText}
              disabled={!messageText.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: messageText.trim()
                    ? theme.primary
                    : theme.border,
                },
              ]}
            >
              <Feather name="send" size={18} color="#FFF" />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { width: "100%" },
  mapContainer: {
    height: 220,
    width: "100%",
    marginBottom: Spacing.md,
    position: "relative",
  },
  mapToggleBtn: {
    position: "absolute",
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  content: { paddingHorizontal: Spacing.lg },
  pharmacyHeaderInfo: { marginBottom: Spacing.lg, alignItems: "center" },
  pharmacyNameText: { fontWeight: "800", textAlign: "center", marginBottom: 4 },
  provinceRow: { flexDirection: "row-reverse", alignItems: "center", gap: 6 },
  actionGrid: {
    flexDirection: "row-reverse",
    gap: Spacing.sm,
    marginBottom: Spacing.xl,
    flexWrap: "wrap",
  },
  gridActionBtn: {
    minWidth: "30%",
    flex: 1,
    height: 44,
    borderRadius: BorderRadius.lg,
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  chatHeaderSection: {
    flexDirection: "row-reverse",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    marginBottom: Spacing.md,
  },
  chatTitleRow: { flexDirection: "row-reverse", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  inlineLoadMore: { padding: 4 },
  chatListContent: { paddingHorizontal: Spacing.lg, paddingBottom: 140 },
  messageContainer: { marginBottom: Spacing.md, width: "100%" },
  messageBubble: {
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxWidth: "80%",
    gap: 4,
  },
  messageImage: {
    width: 200,
    height: 150,
    borderRadius: BorderRadius.sm,
    marginTop: 4,
  },
  messageMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  messageTime: { fontSize: 10 },
  emptyChat: { alignItems: "center", marginTop: 40 },
  chatInputWrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  quickActionsScroll: { maxHeight: 50 },
  quickActionsContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
    flexDirection: "row-reverse",
  },
  quickActionChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
  },
  composerContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  attachBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  composerInput: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    maxHeight: 100,
    textAlign: "right",
    fontSize: 15,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
