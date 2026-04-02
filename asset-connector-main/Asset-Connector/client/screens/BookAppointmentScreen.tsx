import React, { useState } from "react";
import { View, StyleSheet, TextInput, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { ref, push } from "firebase/database";

import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { ThemedText } from "@/components/ThemedText";
import { Button } from "@/components/Button";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius } from "@/constants/theme";
import { doctors } from "@/data/mockData";
import { database } from "@/lib/firebase";

type BookAppointmentRouteProp = RouteProp<
  { BookAppointment: { doctorId: string } },
  "BookAppointment"
>;

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme } = useTheme();
  const { t } = useApp();
  const { user } = useAuth();
  const route = useRoute<BookAppointmentRouteProp>();
  const navigation = useNavigation();

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const doctor = doctors.find((d) => d.id === route.params?.doctorId);
  const doctorName = doctor ? doctor.nameAr : "";

  const handleSubmit = async () => {
    if (!fullName.trim()) {
      Alert.alert(
        t("error"),
        "يرجى إدخال الاسم الكامل",
      );
      return;
    }

    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const appointmentsRef = ref(database, "appointments");
      await push(appointmentsRef, {
        fullName: fullName.trim(),
        phoneNumber: user?.phoneNumber || "",
        doctorId: route.params?.doctorId || "",
        doctorNameAr: doctor?.nameAr || "",
        doctorNameEn: doctor?.nameEn || "",
        age: age.trim() || null,
        notes: notes.trim() || null,
        status: "pending",
        createdAt: new Date().toISOString(),
      });

      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      Alert.alert(
        "تم بنجاح",
        "تم تأكيد حجز موعدك بنجاح",
        [{ text: "حسناً", onPress: () => navigation.goBack() }],
      );
    } catch (error) {
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      Alert.alert(
        t("error"),
        "حدث خطأ أثناء الحجز، حاول مرة أخرى",
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.xl,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: Spacing.lg,
        }}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View entering={FadeInUp.delay(100).duration(400)}>
          <ThemedText type="h3" style={styles.title}>
            {t("bookAppointment")}
          </ThemedText>
          <ThemedText
            type="body"
            style={{ color: theme.textSecondary, marginBottom: Spacing.xl }}
          >
            {doctorName}
          </ThemedText>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(200).duration(400)}>
          <View style={styles.inputGroup}>
            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              {t("fullName")} *
            </ThemedText>
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder={t("fullName")}
              placeholderTextColor={theme.textSecondary}
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderBottomColor: theme.border,
                },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(250).duration(400)}>
          <View style={styles.inputGroup}>
            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              {t("age")} (اختياري)
            </ThemedText>
            <TextInput
              value={age}
              onChangeText={setAge}
              placeholder={t("age")}
              placeholderTextColor={theme.textSecondary}
              keyboardType="numeric"
              style={[
                styles.input,
                {
                  color: theme.text,
                  borderBottomColor: theme.border,
                },
              ]}
            />
          </View>
        </Animated.View>

        <Animated.View entering={FadeInUp.delay(300).duration(400)}>
          <View style={styles.inputGroup}>
            <ThemedText
              type="small"
              style={[styles.label, { color: theme.textSecondary }]}
            >
              {t("notes")} (اختياري)
            </ThemedText>
            <TextInput
              value={notes}
              onChangeText={setNotes}
              placeholder={t("notes")}
              placeholderTextColor={theme.textSecondary}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[
                styles.textArea,
                {
                  color: theme.text,
                  backgroundColor: theme.backgroundDefault,
                },
              ]}
            />
          </View>
        </Animated.View>
      </KeyboardAwareScrollViewCompat>

      <Animated.View
        entering={FadeInUp.delay(400).duration(400)}
        style={[
          styles.footer,
          {
            backgroundColor: theme.backgroundRoot,
            paddingBottom: insets.bottom + Spacing.lg,
          },
        ]}
      >
        <Button
          onPress={handleSubmit}
          disabled={isSubmitting}
          style={styles.submitButton}
        >
          {isSubmitting ? t("loading") : t("submit")}
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  title: {
    marginBottom: Spacing.sm,
  },
  inputGroup: {
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  input: {
    fontSize: 16,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
  },
  textArea: {
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    minHeight: 120,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
  },
  submitButton: {
    width: "100%",
  },
});
