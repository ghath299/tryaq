import React, { useState, useEffect } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Pressable,
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
import { Spacing, BorderRadius, Animation, addAlpha } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { login } = useAuth();

  const [fullName, setFullName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const buttonScale = useSharedValue(1);
  const pulseScale = useSharedValue(1);
  const orb1Y = useSharedValue(0);
  const orb2X = useSharedValue(0);

  useEffect(() => {
    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.05, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );

    orb1Y.value = withRepeat(
      withSequence(
        withTiming(-20, { duration: 3000 }),
        withTiming(20, { duration: 3000 }),
      ),
      -1,
      true,
    );

    orb2X.value = withRepeat(
      withSequence(
        withTiming(-15, { duration: 2500 }),
        withTiming(15, { duration: 2500 }),
      ),
      -1,
      true,
    );
  }, []);

  const orb1Style = useAnimatedStyle(() => ({
    transform: [{ translateY: orb1Y.value }],
  }));

  const orb2Style = useAnimatedStyle(() => ({
    transform: [{ translateX: orb2X.value }],
  }));

  const buttonAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: buttonScale.value }],
  }));

  const pulseAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const handleSubmit = async () => {
    setError("");
    
    if (!fullName.trim() || !phoneNumber.trim()) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("يرجى ملء جميع الحقول");
      return;
    }

    const nameWords = fullName.trim().split(/\s+/).length;
    if (nameWords < 3) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError("الاسم يجب أن يكون اسماً ثلاثياً (3 كلمات على الأقل)");
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsLoading(true);

    try {
      await login(fullName.trim(), phoneNumber.trim());
    } catch (error) {
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePressIn = () => {
    buttonScale.value = withSpring(0.95, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    buttonScale.value = withSpring(1, Animation.spring.gentle);
  };

  const isFormValid =
    fullName.trim().length > 0 && phoneNumber.trim().length >= 10;

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <Animated.View style={[styles.orb1, orb1Style]}>
        <LinearGradient
          colors={[addAlpha(theme.primary, 0.19), addAlpha(theme.primary, 0.06)]}
          style={styles.orbGradient}
        />
      </Animated.View>
      <Animated.View style={[styles.orb2, orb2Style]}>
        <LinearGradient
          colors={[addAlpha(theme.primaryDark, 0.15), addAlpha(theme.primaryDark, 0.03)]}
          style={styles.orbGradient2}
        />
      </Animated.View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingTop: insets.top + Spacing["2xl"],
              paddingBottom: insets.bottom + Spacing.xl,
              justifyContent: "center",
            },
          ]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Animated.View
            entering={FadeInDown.delay(100).duration(600)}
            style={styles.header}
          >
            <Animated.View style={pulseAnimatedStyle}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.logoContainer}
              >
                <Feather name="activity" size={40} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            <ThemedText type="h1" style={styles.title}>
              مرحباً بك
            </ThemedText>

            <View
              style={[
                styles.appNamePill,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.appNameGradient}
              >
                <ThemedText type="body" style={styles.appNameText}>
                  منصة صحية ذكية
                </ThemedText>
              </LinearGradient>
            </View>

            <ThemedText
              type="body"
              style={[styles.subtitle, { color: theme.textSecondary }]}
            >
              أدخل بياناتك للمتابعة
            </ThemedText>
          </Animated.View>

          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.form}
          >
            <View style={styles.inputGroup}>
              <ThemedText
                type="caption"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                الاسم الثلاثي (بالعربية)
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: fullName ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name="user"
                  size={20}
                  color={fullName ? theme.primary : theme.textSecondary}
                />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  placeholder="مثال: أحمد محمد علي"
                  placeholderTextColor={theme.textSecondary}
                  value={fullName}
                  onChangeText={setFullName}
                  textAlign="right"
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <ThemedText
                type="caption"
                style={[styles.label, { color: theme.textSecondary }]}
              >
                رقم الهاتف
              </ThemedText>
              <View
                style={[
                  styles.inputContainer,
                  styles.phoneInputContainer,
                  {
                    backgroundColor: theme.backgroundDefault,
                    borderColor: phoneNumber ? theme.primary : theme.border,
                  },
                ]}
              >
                <Feather
                  name="phone"
                  size={20}
                  color={phoneNumber ? theme.primary : theme.textSecondary}
                />
                <TextInput
                  style={[
                    styles.input,
                    styles.phoneInput,
                    { color: theme.text },
                  ]}
                  placeholder="07XXXXXXXXX"
                  placeholderTextColor={theme.textSecondary}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                  maxLength={11}
                />
              </View>
            </View>

            {error && (
              <View style={[styles.errorContainer, { borderLeftColor: theme.primary }]}>
                <Feather name="alert-circle" size={18} color={theme.primary} />
                <ThemedText type="small" style={[styles.errorText, { color: theme.primary }]}>
                  {error}
                </ThemedText>
              </View>
            )}

            <Animated.View entering={FadeIn.delay(500).duration(400)}>
              <AnimatedPressable
                android_ripple={{ color: "transparent" }}
                onPress={handleSubmit}
                onPressIn={handlePressIn}
                onPressOut={handlePressOut}
                disabled={!isFormValid || isLoading}
                style={[
                  styles.submitButton,
                  { opacity: isFormValid && !isLoading ? 1 : 0.6 },
                  buttonAnimatedStyle,
                ]}
              >
                <LinearGradient
                  colors={[theme.primary, theme.primaryDark]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.submitGradient}
                >
                  {isLoading ? (
                    <Feather name="loader" size={24} color="#FFFFFF" />
                  ) : (
                    <>
                      <ThemedText type="body" style={styles.submitText}>
                        متابعة
                      </ThemedText>
                      <Feather name="chevron-left" size={20} color="#FFFFFF" />
                    </>
                  )}
                </LinearGradient>
              </AnimatedPressable>
            </Animated.View>
          </Animated.View>

          <Animated.View
            entering={FadeIn.delay(700).duration(400)}
            style={styles.footer}
          >
            <ThemedText
              type="caption"
              style={[styles.footerText, { color: theme.textSecondary }]}
            >
              بمتابعتك، أنت توافق على شروط الاستخدام وسياسة الخصوصية
            </ThemedText>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  orb1: {
    position: "absolute",
    top: -50,
    right: -80,
    width: 250,
    height: 250,
    zIndex: 0,
  },
  orb2: {
    position: "absolute",
    bottom: 100,
    left: -100,
    width: 300,
    height: 300,
    zIndex: 0,
  },
  orbGradient: {
    width: "100%",
    height: "100%",
    borderRadius: 150,
  },
  orbGradient2: {
    width: "100%",
    height: "100%",
    borderRadius: 175,
  },
  keyboardView: {
    flex: 1,
    zIndex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.xl,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    marginBottom: Spacing.md,
    textAlign: "center",
  },
  appNamePill: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
  },
  appNameGradient: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  appNameText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  subtitle: {
    textAlign: "center",
  },
  form: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: Spacing.lg,
  },
  label: {
    marginBottom: Spacing.sm,
    textAlign: "right",
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row-reverse",
    alignItems: "center",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 2,
    gap: Spacing.md,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Tajawal_400Regular",
  },
  phoneInputContainer: {
    flexDirection: "row",
  },
  phoneInput: {
    textAlign: "left",
    writingDirection: "ltr",
  },
  submitButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginTop: Spacing.lg,
  },
  submitGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  submitText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 18,
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: "rgba(255,59,48,0.08)",
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  errorText: {
    flex: 1,
    fontWeight: "500",
  },
  footer: {
    marginTop: Spacing.xl,
    alignItems: "center",
  },
  footerText: {
    textAlign: "center",
  },
});
