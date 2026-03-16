import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import Animated, {
  FadeIn,
  FadeInUp,
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
const OTP_LENGTH = 6;

export default function OTPVerificationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { pendingPhone, verifyOTP } = useAuth();

  const [otp, setOtp] = useState<string[]>(Array(OTP_LENGTH).fill(""));
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendTimer, setResendTimer] = useState(60);
  const [error, setError] = useState("");

  const inputRefs = useRef<(TextInput | null)[]>([]);

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const shakeX = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );

    const timer = setInterval(() => {
      setResendTimer((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    // Auto focus first input
    setTimeout(() => {
      inputRefs.current[0]?.focus();
    }, 500);

    return () => clearInterval(timer);
  }, []);

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const shakeAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shakeX.value }],
  }));

  const handleOtpChange = (value: string, index: number) => {
    setError("");
    const newOtp = [...otp];

    if (value.length > 1) {
      const digits = value.replace(/\D/g, "").slice(0, OTP_LENGTH - index);
      digits.split("").forEach((digit, i) => {
        if (index + i < OTP_LENGTH) {
          newOtp[index + i] = digit;
        }
      });
      setOtp(newOtp);
      const nextIndex = Math.min(index + digits.length, OTP_LENGTH - 1);
      inputRefs.current[nextIndex]?.focus();
    } else {
      newOtp[index] = value.replace(/\D/g, "");
      setOtp(newOtp);

      if (value && index < OTP_LENGTH - 1) {
        inputRefs.current[index + 1]?.focus();
      }
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async () => {
    const code = otp.join("");

    // MANDATORY Mock logic for Preview/Development
    if (__DEV__ || Platform.OS === "web") {
      if (code.length === OTP_LENGTH) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsVerifying(true);
        console.log("[OTP] MOCK VERIFICATION FOR PREVIEW");
        try {
          // Accepting any 6-digit code in preview
          await verifyOTP(code);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch {
          setError("حدث خطأ");
        } finally {
          setIsVerifying(false);
        }
        return;
      }
    }

    if (code.length !== OTP_LENGTH) {
      setError("الرجاء إدخال الرمز كاملاً");
      shakeX.value = withSequence(
        withTiming(-10, { duration: 50 }),
        withTiming(10, { duration: 50 }),
        withTiming(-10, { duration: 50 }),
        withTiming(0, { duration: 50 }),
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsVerifying(true);

    try {
      const success = await verifyOTP(code);
      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setError("الرمز غير صحيح");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    } catch {
      setError("حدث خطأ، حاول مرة أخرى");
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = () => {
    if (resendTimer > 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setResendTimer(60);
    setOtp(Array(OTP_LENGTH).fill(""));
    setError("");
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, Animation.spring.gentle);
  };

  const isComplete = otp.every((digit) => digit !== "");

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <LinearGradient
        colors={[theme.primary + "10", "transparent"]}
        style={styles.topGradient}
      />

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View
          style={[
            styles.content,
            {
              paddingTop: insets.top + Spacing["2xl"],
              paddingBottom: insets.bottom + Spacing.xl,
            },
          ]}
        >
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Animated.View style={pulseAnimatedStyle}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.iconContainer}
              >
                <Feather name="shield" size={40} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <ThemedText type="h1" style={styles.title}>
              التحقق من الرقم
            </ThemedText>

            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              أدخل الرمز المرسل إلى
            </ThemedText>

            <View
              style={[
                styles.phoneBadge,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Feather name="phone" size={16} color={theme.primary} />
              <ThemedText
                type="body"
                style={{ color: theme.primary, fontWeight: "600" }}
              >
                {pendingPhone || "07XXXXXXXXX"}
              </ThemedText>
            </View>

            <Animated.View
              entering={FadeIn.delay(400)}
              style={styles.sentMessageContainer}
            >
              <View
                style={[
                  styles.sentMessage,
                  { backgroundColor: "#4CD964" + "15" },
                ]}
              >
                <Feather name="check-circle" size={14} color="#4CD964" />
                <ThemedText
                  type="small"
                  style={{ color: "#4CD964", marginRight: Spacing.xs }}
                >
                  تم إرسال رمز التحقق
                </ThemedText>
              </View>
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={[styles.otpContainer, shakeAnimatedStyle]}
          >
            {otp.map((digit, index) => (
              <Animated.View
                key={index}
                entering={FadeIn.delay(400 + index * 50).duration(300)}
              >
                <TextInput
                  ref={(ref) => {
                    inputRefs.current[index] = ref;
                  }}
                  style={[
                    styles.otpInput,
                    {
                      backgroundColor: theme.backgroundDefault,
                      borderColor: digit
                        ? theme.primary
                        : error
                          ? "#FF3B30"
                          : theme.border,
                      color: theme.text,
                    },
                  ]}
                  value={digit}
                  onChangeText={(value) => handleOtpChange(value, index)}
                  onKeyPress={(e) => handleKeyPress(e, index)}
                  keyboardType="number-pad"
                  maxLength={index === 0 ? OTP_LENGTH : 1}
                  textAlign="center"
                  selectTextOnFocus
                  contextMenuHidden={true}
                />
              </Animated.View>
            ))}
          </Animated.View>

          {error ? (
            <Animated.View
              entering={FadeIn.duration(200)}
              style={styles.errorContainer}
            >
              <Feather name="alert-circle" size={16} color="#FF3B30" />
              <ThemedText type="caption" style={{ color: "#FF3B30" }}>
                {error}
              </ThemedText>
            </Animated.View>
          ) : null}

          <Animated.View
            entering={FadeIn.delay(500).duration(400)}
            style={styles.resendContainer}
          >
            {resendTimer > 0 ? (
              <ThemedText type="body" style={{ color: theme.textSecondary }}>
                إعادة الإرسال بعد {resendTimer} ثانية
              </ThemedText>
            ) : (
              <Pressable
                android_ripple={{ color: "transparent" }}
                onPress={handleResend}
                style={styles.resendButton}
              >
                <ThemedText
                  type="body"
                  style={{ color: theme.primary, fontWeight: "600" }}
                >
                  إعادة إرسال الرمز
                </ThemedText>
              </Pressable>
            )}
          </Animated.View>

          <View style={styles.methodsContainer}>
            <ThemedText
              type="caption"
              style={[styles.methodsLabel, { color: theme.textSecondary }]}
            >
              لم تستلم الرمز؟ جرّب:
            </ThemedText>
            <View style={styles.methodsRow}>
              <Pressable
                android_ripple={{ color: "transparent" }}
                style={[styles.methodChip, { backgroundColor: "#25D36615" }]}
              >
                <Feather name="message-circle" size={16} color="#25D366" />
                <ThemedText
                  type="caption"
                  style={{ color: "#25D366", fontWeight: "500" }}
                >
                  WhatsApp
                </ThemedText>
              </Pressable>
              <Pressable
                android_ripple={{ color: "transparent" }}
                style={[
                  styles.methodChip,
                  { backgroundColor: theme.primary + "15" },
                ]}
              >
                <Feather name="smartphone" size={16} color={theme.primary} />
                <ThemedText
                  type="caption"
                  style={{ color: theme.primary, fontWeight: "500" }}
                >
                  SMS
                </ThemedText>
              </Pressable>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <AnimatedPressable
              android_ripple={{ color: "transparent" }}
              onPress={handleVerify}
              onPressIn={handlePressIn}
              onPressOut={handlePressOut}
              disabled={!isComplete || isVerifying}
              style={[
                styles.button,
                { opacity: isComplete && !isVerifying ? 1 : 0.6 },
                buttonAnimatedStyle,
              ]}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.buttonGradient}
              >
                {isVerifying ? (
                  <Feather name="loader" size={24} color="#FFFFFF" />
                ) : (
                  <>
                    <ThemedText type="body" style={styles.buttonText}>
                      تأكيد
                    </ThemedText>
                    <Feather name="check" size={20} color="#FFFFFF" />
                  </>
                )}
              </LinearGradient>
            </AnimatedPressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topGradient: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  keyboardView: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: Spacing.sm,
  },
  phoneBadge: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.sm,
  },
  sentMessageContainer: {
    marginTop: Spacing.md,
  },
  sentMessage: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  otpContainer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  otpInput: {
    width: 48,
    height: 56,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    fontSize: 24,
    fontWeight: "700",
    fontFamily: "Tajawal_700Bold",
    textAlign: "center",
    padding: 0,
    lineHeight: Platform.OS === "ios" ? 56 : undefined,
    includeFontPadding: false,
    textAlignVertical: "center",
  },
  errorContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  resendContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  resendButton: {
    padding: Spacing.sm,
  },
  methodsContainer: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  methodsLabel: {
    marginBottom: Spacing.sm,
  },
  methodsRow: {
    flexDirection: "row-reverse",
    gap: Spacing.md,
  },
  methodChip: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    gap: Spacing.xs,
  },
  buttonContainer: {
    marginTop: "auto",
  },
  button: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  buttonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  buttonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
});
