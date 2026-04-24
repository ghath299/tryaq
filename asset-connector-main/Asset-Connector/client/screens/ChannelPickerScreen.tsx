import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  Pressable,
  Linking,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInDown,
  FadeInUp,
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Animation, addAlpha } from "@/constants/theme";
import { getApiUrl } from "@/lib/query-client";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function ChannelPickerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { pendingPhone, sendOTPAndProceed } = useAuth();

  const [telegramBotUrl, setTelegramBotUrl] = useState<string | null>(null);
  const [loadingChannel, setLoadingChannel] = useState<"telegram" | "whatsapp" | null>(null);
  const [error, setError] = useState("");

  const telegramScale = useSharedValue(1);
  const whatsappScale = useSharedValue(1);

  useEffect(() => {
    // جلب رابط البوت من الخادم
    const fetchBotUrl = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/config/telegram`);
        const data = await res.json();
        setTelegramBotUrl(data.botUrl || null);
      } catch {
        setTelegramBotUrl(null);
      }
    };
    fetchBotUrl();
  }, []);

  const telegramAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: telegramScale.value }],
  }));

  const whatsappAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: whatsappScale.value }],
  }));

  const handleTelegram = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingChannel("telegram");
    setError("");

    try {
      // افتح البوت أولاً
      if (telegramBotUrl) {
        await Linking.openURL(telegramBotUrl);
        // انتظر قليلاً حتى يفتح المستخدم البوت
        await new Promise((r) => setTimeout(r, 1500));
      }

      // ثم أرسل الـ OTP
      const result = await sendOTPAndProceed("telegram");
      if (!result.success) {
        setError(result.message || "فشل إرسال الرمز");
      }
    } catch {
      setError("تحقق من اتصالك وحاول مجدداً");
    } finally {
      setLoadingChannel(null);
    }
  };

  const handleWhatsApp = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoadingChannel("whatsapp");
    setError("");

    try {
      const result = await sendOTPAndProceed("whatsapp");
      if (!result.success) {
        setError(result.message || "فشل إرسال الرمز");
      }
    } catch {
      setError("تحقق من اتصالك وحاول مجدداً");
    } finally {
      setLoadingChannel(null);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[addAlpha(theme.primary, 0.06), "transparent"]}
        style={styles.topGradient}
      />

      <View
        style={[
          styles.content,
          {
            paddingTop: insets.top + Spacing["2xl"],
            paddingBottom: insets.bottom + Spacing.xl,
          },
        ]}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.delay(100).duration(600)} style={styles.header}>
          <LinearGradient
            colors={[theme.primary, theme.primaryDark]}
            style={styles.iconContainer}
          >
            <Feather name="send" size={36} color="#FFFFFF" />
          </LinearGradient>

          <ThemedText type="h1" style={styles.title}>
            اختر قناة الإرسال
          </ThemedText>

          <ThemedText type="body" style={[styles.subtitle, { color: theme.textSecondary }]}>
            سيصلك رمز التحقق على الرقم
          </ThemedText>

          <View style={[styles.phoneBadge, { backgroundColor: addAlpha(theme.primary, 0.12) }]}>
            <Feather name="phone" size={16} color={theme.primary} />
            <ThemedText type="body" style={{ color: theme.primary, fontWeight: "600" }}>
              {pendingPhone || "07XXXXXXXXX"}
            </ThemedText>
          </View>
        </Animated.View>

        {/* Buttons */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.buttonsContainer}>

          {/* زر تلكرام */}
          <AnimatedPressable
            android_ripple={{ color: "transparent" }}
            onPress={handleTelegram}
            onPressIn={() => { telegramScale.value = withSpring(0.95, Animation.spring.snappy); }}
            onPressOut={() => { telegramScale.value = withSpring(1, Animation.spring.gentle); }}
            disabled={loadingChannel !== null}
            style={[
              styles.channelButton,
              telegramAnimatedStyle,
              {
                backgroundColor: addAlpha("#2CA5E0", 0.12),
                borderColor: "#2CA5E0",
                opacity: loadingChannel !== null && loadingChannel !== "telegram" ? 0.4 : 1,
              },
            ]}
          >
            <View style={styles.channelButtonInner}>
              <View style={[styles.channelIcon, { backgroundColor: "#2CA5E0" }]}>
                {loadingChannel === "telegram" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="send" size={26} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.channelTextContainer}>
                <ThemedText type="h4" style={{ color: "#2CA5E0", fontWeight: "700" }}>
                  تلكرام
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  {telegramBotUrl ? "يفتح البوت ويرسل الرمز" : "يرسل رمز التحقق"}
                </ThemedText>
              </View>
              <Feather
                name="chevron-left"
                size={20}
                color="#2CA5E0"
                style={{ opacity: loadingChannel === "telegram" ? 0 : 1 }}
              />
            </View>
          </AnimatedPressable>

          {/* زر واتساب */}
          <AnimatedPressable
            android_ripple={{ color: "transparent" }}
            onPress={handleWhatsApp}
            onPressIn={() => { whatsappScale.value = withSpring(0.95, Animation.spring.snappy); }}
            onPressOut={() => { whatsappScale.value = withSpring(1, Animation.spring.gentle); }}
            disabled={loadingChannel !== null}
            style={[
              styles.channelButton,
              whatsappAnimatedStyle,
              {
                backgroundColor: addAlpha("#25D366", 0.12),
                borderColor: "#25D366",
                opacity: loadingChannel !== null && loadingChannel !== "whatsapp" ? 0.4 : 1,
              },
            ]}
          >
            <View style={styles.channelButtonInner}>
              <View style={[styles.channelIcon, { backgroundColor: "#25D366" }]}>
                {loadingChannel === "whatsapp" ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Feather name="message-circle" size={26} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.channelTextContainer}>
                <ThemedText type="h4" style={{ color: "#25D366", fontWeight: "700" }}>
                  واتساب
                </ThemedText>
                <ThemedText type="small" style={{ color: theme.textSecondary }}>
                  يرسل رمز التحقق
                </ThemedText>
              </View>
              <Feather
                name="chevron-left"
                size={20}
                color="#25D366"
                style={{ opacity: loadingChannel === "whatsapp" ? 0 : 1 }}
              />
            </View>
          </AnimatedPressable>
        </Animated.View>

        {/* Error */}
        {error ? (
          <Animated.View
            entering={FadeIn.duration(200)}
            style={[styles.errorContainer, { backgroundColor: addAlpha("#FF3B30", 0.08) }]}
          >
            <Feather name="alert-circle" size={16} color="#FF3B30" />
            <ThemedText type="small" style={{ color: "#FF3B30", marginRight: Spacing.xs }}>
              {error}
            </ThemedText>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topGradient: { position: "absolute", top: 0, left: 0, right: 0, height: 300 },
  content: {
    flex: 1, paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: { alignItems: "center", marginBottom: Spacing["2xl"] },
  iconContainer: {
    width: 80, height: 80, borderRadius: 40,
    alignItems: "center", justifyContent: "center", marginBottom: Spacing.lg,
  },
  title: { fontSize: 26, fontWeight: "700", marginBottom: Spacing.sm, textAlign: "center" },
  subtitle: { textAlign: "center", marginBottom: Spacing.sm },
  phoneBadge: {
    flexDirection: "row-reverse", alignItems: "center",
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full, gap: Spacing.sm, marginTop: Spacing.xs,
  },
  buttonsContainer: { gap: Spacing.md },
  channelButton: {
    borderWidth: 1.5, borderRadius: BorderRadius.xl,
    overflow: "hidden",
  },
  channelButtonInner: {
    flexDirection: "row-reverse", alignItems: "center",
    padding: Spacing.lg, gap: Spacing.md,
  },
  channelIcon: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  channelTextContainer: { flex: 1, alignItems: "flex-end" },
  errorContainer: {
    flexDirection: "row-reverse", alignItems: "center",
    gap: Spacing.xs, padding: Spacing.md,
    borderRadius: BorderRadius.md, marginTop: Spacing.lg,
  },
});
