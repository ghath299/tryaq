import React, { useState } from "react";
import {
  View,
  StyleSheet,
  TextInput,
  Alert,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation, RouteProp } from "@react-navigation/native";
import Animated, { FadeInUp } from "react-native-reanimated";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import { ref, push } from "firebase/database";

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

type PaymentMethod = "cash" | "electronic" | null;
type ElectronicProvider = "zaincash" | "asia" | "card" | null;

function InputField({
  label, value, onChangeText, placeholder,
  keyboardType = "default", required = false,
  multiline = false, secureTextEntry = false,
  maxLength, error,
}: {
  label: string; value: string; onChangeText: (v: string) => void;
  placeholder: string; keyboardType?: "default" | "numeric" | "phone-pad";
  required?: boolean; multiline?: boolean; secureTextEntry?: boolean;
  maxLength?: number; error?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={{ marginBottom: Spacing.lg }}>
      <ThemedText type="small" style={{ color: theme.textSecondary, marginBottom: 6, textAlign: "right" }}>
        {label}{required && <ThemedText type="small" style={{ color: theme.error }}> *</ThemedText>}
      </ThemedText>
      <TextInput
        value={value} onChangeText={onChangeText} placeholder={placeholder}
        placeholderTextColor={theme.textSecondary} keyboardType={keyboardType}
        multiline={multiline} secureTextEntry={secureTextEntry} maxLength={maxLength}
        textAlign="right"
        style={[
          multiline ? styles.textArea : styles.input,
          { color: theme.text, backgroundColor: theme.card, borderColor: error ? theme.error : theme.border },
        ]}
      />
      {error ? <ThemedText type="caption" style={{ color: theme.error, marginTop: 4, textAlign: "right" }}>{error}</ThemedText> : null}
    </View>
  );
}

function PaymentCard({ selected, onPress, icon, title, subtitle }: {
  selected: boolean; onPress: () => void; icon: string; title: string; subtitle: string;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.paymentCard, { backgroundColor: theme.card, borderColor: selected ? theme.primaryDark : theme.border, borderWidth: selected ? 2 : 0.5 }]}>
      <ThemedText style={{ fontSize: 22, marginBottom: 4 }}>{icon}</ThemedText>
      <ThemedText type="small" style={{ fontWeight: "600", color: theme.text, marginBottom: 2 }}>{title}</ThemedText>
      <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "center" }}>{subtitle}</ThemedText>
    </TouchableOpacity>
  );
}

function ProviderOption({ selected, onPress, emoji, label }: {
  selected: boolean; onPress: () => void; emoji: string; label: string;
}) {
  const { theme } = useTheme();
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}
      style={[styles.providerRow, { backgroundColor: theme.card, borderColor: selected ? theme.primaryDark : theme.border, borderWidth: selected ? 1.5 : 0.5 }]}>
      <View style={[styles.radioCircle, { borderColor: selected ? theme.primaryDark : theme.border, backgroundColor: selected ? theme.primaryDark : "transparent" }]} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <ThemedText style={{ fontSize: 18 }}>{emoji}</ThemedText>
        <ThemedText type="small" style={{ fontWeight: "500", color: theme.text }}>{label}</ThemedText>
      </View>
    </TouchableOpacity>
  );
}

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useApp();
  const { user } = useAuth();
  const route = useRoute<BookAppointmentRouteProp>();
  const navigation = useNavigation();

  const doctor = doctors.find((d) => d.id === route.params?.doctorId);

  const [fullName, setFullName] = useState(user?.fullName || "");
  const [age, setAge] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(null);
  const [electronicProvider, setElectronicProvider] = useState<ElectronicProvider>(null);
  const [walletPhone, setWalletPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCVV, setCardCVV] = useState("");
  const [cardName, setCardName] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const formatCardNumber = (v: string) => v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
  const formatExpiry = (v: string) => { const d = v.replace(/\D/g, "").slice(0, 4); return d.length >= 3 ? d.slice(0, 2) + "/" + d.slice(2) : d; };

  const validate = (): boolean => {
    const e: Record<string, string> = {};
    if (!fullName.trim() || fullName.trim().split(/\s+/).length < 2) e.fullName = "يرجى إدخال الاسم الكامل (اسمين على الأقل)";
    if (!age.trim() || isNaN(Number(age)) || Number(age) < 1 || Number(age) > 120) e.age = "يرجى إدخال عمر صحيح";
    if (!paymentMethod) e.payment = "يرجى اختيار طريقة الدفع";
    if (paymentMethod === "electronic") {
      if (!electronicProvider) e.provider = "يرجى اختيار وسيلة الدفع";
      if ((electronicProvider === "zaincash" || electronicProvider === "asia") && !/^07[3-9]\d{8}$/.test(walletPhone)) e.walletPhone = "يرجى إدخال رقم هاتف عراقي صحيح";
      if (electronicProvider === "card") {
        if (cardNumber.replace(/\s/g, "").length < 16) e.cardNumber = "رقم البطاقة غير صحيح";
        if (!/^\d{2}\/\d{2}$/.test(cardExpiry)) e.cardExpiry = "تاريخ الانتهاء غير صحيح (MM/YY)";
        if (cardCVV.length < 3) e.cardCVV = "رمز CVV غير صحيح";
        if (!cardName.trim()) e.cardName = "يرجى إدخال اسم حامل البطاقة";
      }
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // ── معالجة الدفع الإلكتروني ──
  // TODO: اربط هذه الدالة بـ API السيرفر عند الجاهزية
  const processElectronicPayment = async (): Promise<{ success: boolean; transactionId?: string }> => {
    // مثال الربط بالسيرفر:
    // const res = await fetch(`${getApiUrl()}/api/payment/initiate`, {
    //   method: "POST",
    //   headers: { "Content-Type": "application/json" },
    //   body: JSON.stringify({
    //     provider: electronicProvider,
    //     walletPhone,
    //     cardNumber: cardNumber.replace(/\s/g, ""),
    //     cardExpiry, cardCVV, cardName,
    //   }),
    // });
    // return await res.json();
    await new Promise((r) => setTimeout(r, 1500));
    return { success: true, transactionId: `TXN-${Date.now()}` };
  };

  const handleSubmit = async () => {
    if (!validate()) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setIsSubmitting(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      let transactionId: string | undefined;
      if (paymentMethod === "electronic") {
        const result = await processElectronicPayment();
        if (!result.success) {
          setIsSubmitting(false);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          Alert.alert("فشل الدفع", "حدث خطأ أثناء معالجة الدفع، حاول مرة أخرى");
          return;
        }
        transactionId = result.transactionId;
      }
      await push(ref(database, "appointments"), {
        fullName: fullName.trim(), age: Number(age),
        phoneNumber: user?.phoneNumber || "",
        doctorId: route.params?.doctorId || "",
        doctorNameAr: doctor?.nameAr || "", doctorNameEn: doctor?.nameEn || "",
        notes: notes.trim() || null,
        paymentMethod, paymentProvider: electronicProvider || null,
        paymentStatus: paymentMethod === "cash" ? "pending" : "paid",
        transactionId: transactionId || null,
        status: "pending", createdAt: new Date().toISOString(),
      });
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("تم بنجاح ✓",
        paymentMethod === "cash" ? "تم تأكيد حجز موعدك، يرجى الدفع عند الوصول للطبيب" : "تم تأكيد حجز موعدك وإتمام الدفع بنجاح",
        [{ text: "حسناً", onPress: () => navigation.goBack() }]
      );
    } catch {
      setIsSubmitting(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(t("error"), "حدث خطأ أثناء الحجز، حاول مرة أخرى");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: insets.bottom + 110 }}>

          {/* هيدر */}
          <Animated.View entering={FadeInUp.delay(0).duration(400)}>
            <LinearGradient colors={[theme.primaryDark, theme.primary]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.header, { paddingTop: insets.top + 16 }]}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                <Ionicons name="chevron-back" size={20} color="white" />
              </TouchableOpacity>
              <ThemedText type="body" style={{ color: "white", fontWeight: "600", marginBottom: 20 }}>حجز موعد</ThemedText>
              <View style={styles.doctorRow}>
                <View style={styles.doctorAvatar}><Ionicons name="person" size={26} color="white" /></View>
                <View>
                  <ThemedText type="h4" style={{ color: "white", fontWeight: "600" }}>{doctor?.nameAr || ""}</ThemedText>
                  <ThemedText type="small" style={{ color: "rgba(255,255,255,0.8)" }}>{doctor?.specialtyAr || ""}</ThemedText>
                </View>
              </View>
            </LinearGradient>
          </Animated.View>

          {/* بطاقة الوقت */}
          <Animated.View entering={FadeInUp.delay(100).duration(400)}
            style={[styles.timeCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: 8, textAlign: "right" }}>وقت الحجز</ThemedText>
            <View style={styles.timeBadgeRow}>
              <View style={[styles.timeBadge, { backgroundColor: theme.backgroundTertiary }]}>
                <ThemedText type="small" style={{ color: theme.primaryDark }}>{doctor?.workingHours || "9:00 ص - 5:00 م"}</ThemedText>
              </View>
              <View style={[styles.timeBadge, { backgroundColor: theme.backgroundTertiary }]}>
                <ThemedText type="small" style={{ color: theme.primaryDark }}>{doctor?.workingDays?.[0] || "السبت"}</ThemedText>
              </View>
            </View>
          </Animated.View>

          {/* بيانات المريض */}
          <Animated.View entering={FadeInUp.delay(150).duration(400)}
            style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>بيانات المريض</ThemedText>
            <InputField label="الاسم الكامل" value={fullName} onChangeText={setFullName} placeholder="أدخل اسمك الكامل" required error={errors.fullName} />
            <InputField label="العمر" value={age} onChangeText={setAge} placeholder="أدخل عمرك" keyboardType="numeric" required maxLength={3} error={errors.age} />
            <InputField label="ملاحظات" value={notes} onChangeText={setNotes} placeholder="صف حالتك أو سبب الزيارة (اختياري)" multiline />
          </Animated.View>

          {/* الدفع */}
          <Animated.View entering={FadeInUp.delay(200).duration(400)}
            style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <ThemedText type="small" style={[styles.sectionTitle, { color: theme.textSecondary }]}>
              طريقة الدفع <ThemedText type="small" style={{ color: theme.error }}>*</ThemedText>
            </ThemedText>
            <View style={styles.paymentGrid}>
              <PaymentCard selected={paymentMethod === "cash"} onPress={() => { setPaymentMethod("cash"); setElectronicProvider(null); setErrors((e) => ({ ...e, payment: "", provider: "" })); }} icon="💵" title="كاش" subtitle="عند الوصول للطبيب" />
              <PaymentCard selected={paymentMethod === "electronic"} onPress={() => { setPaymentMethod("electronic"); setErrors((e) => ({ ...e, payment: "" })); }} icon="💳" title="دفع إلكتروني" subtitle="مسبق قبل الموعد" />
            </View>
            {errors.payment ? <ThemedText type="caption" style={{ color: theme.error, textAlign: "right", marginTop: 4 }}>{errors.payment}</ThemedText> : null}

            {paymentMethod === "electronic" && (
              <Animated.View entering={FadeInUp.delay(0).duration(300)}
                style={[styles.electronicBox, { backgroundColor: theme.backgroundSecondary, borderColor: theme.border }]}>
                <ThemedText type="caption" style={{ color: theme.textSecondary, textAlign: "right", marginBottom: 10 }}>اختر وسيلة الدفع</ThemedText>
                <ProviderOption selected={electronicProvider === "zaincash"} onPress={() => { setElectronicProvider("zaincash"); setErrors((e) => ({ ...e, provider: "" })); }} emoji="📱" label="زين كاش" />
                <ProviderOption selected={electronicProvider === "asia"} onPress={() => { setElectronicProvider("asia"); setErrors((e) => ({ ...e, provider: "" })); }} emoji="🏦" label="آسيا حوالة" />
                <ProviderOption selected={electronicProvider === "card"} onPress={() => { setElectronicProvider("card"); setErrors((e) => ({ ...e, provider: "" })); }} emoji="💳" label="ماستركارد / فيزا" />
                {errors.provider ? <ThemedText type="caption" style={{ color: theme.error, textAlign: "right", marginTop: 4 }}>{errors.provider}</ThemedText> : null}

                {(electronicProvider === "zaincash" || electronicProvider === "asia") && (
                  <Animated.View entering={FadeInUp.delay(0).duration(300)} style={{ marginTop: 14 }}>
                    <InputField label={electronicProvider === "zaincash" ? "رقم هاتف زين كاش" : "رقم هاتف آسيا حوالة"} value={walletPhone} onChangeText={setWalletPhone} placeholder="07XXXXXXXXX" keyboardType="phone-pad" required maxLength={11} error={errors.walletPhone} />
                    <View style={[styles.infoBox, { backgroundColor: theme.backgroundTertiary }]}>
                      <Ionicons name="information-circle-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1, textAlign: "right" }}>سيتم إرسال طلب تحويل إلى رقمك، يرجى الموافقة عليه</ThemedText>
                    </View>
                  </Animated.View>
                )}

                {electronicProvider === "card" && (
                  <Animated.View entering={FadeInUp.delay(0).duration(300)} style={{ marginTop: 14 }}>
                    <InputField label="رقم البطاقة" value={cardNumber} onChangeText={(v) => setCardNumber(formatCardNumber(v))} placeholder="XXXX XXXX XXXX XXXX" keyboardType="numeric" required maxLength={19} error={errors.cardNumber} />
                    <View style={{ flexDirection: "row", gap: 12 }}>
                      <View style={{ flex: 1 }}>
                        <InputField label="تاريخ الانتهاء" value={cardExpiry} onChangeText={(v) => setCardExpiry(formatExpiry(v))} placeholder="MM/YY" keyboardType="numeric" required maxLength={5} error={errors.cardExpiry} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <InputField label="CVV" value={cardCVV} onChangeText={(v) => setCardCVV(v.replace(/\D/g, "").slice(0, 4))} placeholder="XXX" keyboardType="numeric" required secureTextEntry maxLength={4} error={errors.cardCVV} />
                      </View>
                    </View>
                    <InputField label="اسم حامل البطاقة" value={cardName} onChangeText={setCardName} placeholder="الاسم كما يظهر على البطاقة" required error={errors.cardName} />
                    <View style={[styles.infoBox, { backgroundColor: theme.backgroundTertiary }]}>
                      <Ionicons name="lock-closed-outline" size={14} color={theme.textSecondary} />
                      <ThemedText type="caption" style={{ color: theme.textSecondary, flex: 1, textAlign: "right" }}>بياناتك محمية بتشفير SSL آمن</ThemedText>
                    </View>
                  </Animated.View>
                )}
              </Animated.View>
            )}
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* زر التأكيد */}
      <Animated.View entering={FadeInUp.delay(300).duration(400)}
        style={[styles.footer, { backgroundColor: theme.backgroundRoot, paddingBottom: insets.bottom + Spacing.lg, borderTopColor: theme.border }]}>
        <Button onPress={handleSubmit} disabled={isSubmitting} style={styles.submitButton}>
          {isSubmitting ? "جاري المعالجة..." : paymentMethod === "electronic" ? "تأكيد الحجز والدفع" : "تأكيد الحجز"}
        </Button>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: Spacing.lg, paddingBottom: 32 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  doctorRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  doctorAvatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center", borderWidth: 2, borderColor: "rgba(255,255,255,0.4)" },
  timeCard: { marginHorizontal: Spacing.lg, marginTop: -20, borderRadius: BorderRadius.md, padding: Spacing.md, borderWidth: 0.5, zIndex: 1 },
  timeBadgeRow: { flexDirection: "row", gap: 8, justifyContent: "flex-end" },
  timeBadge: { borderRadius: BorderRadius.sm, paddingHorizontal: 12, paddingVertical: 6 },
  section: { margin: Spacing.lg, marginTop: Spacing.md, borderRadius: BorderRadius.md, padding: Spacing.lg, borderWidth: 0.5 },
  sectionTitle: { marginBottom: Spacing.lg, textAlign: "right", fontWeight: "500" },
  input: { borderWidth: 0.5, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, height: 48 },
  textArea: { borderWidth: 0.5, borderRadius: BorderRadius.sm, paddingHorizontal: 14, paddingVertical: 10, fontSize: 15, minHeight: 90, textAlignVertical: "top" },
  paymentGrid: { flexDirection: "row", gap: 10, marginBottom: 4 },
  paymentCard: { flex: 1, borderRadius: BorderRadius.md, padding: 12, alignItems: "center" },
  electronicBox: { marginTop: 12, borderRadius: BorderRadius.md, padding: 14, borderWidth: 0.5 },
  providerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderRadius: BorderRadius.sm, padding: 10, marginBottom: 8 },
  radioCircle: { width: 18, height: 18, borderRadius: 9, borderWidth: 1.5 },
  infoBox: { flexDirection: "row", gap: 6, borderRadius: BorderRadius.sm, padding: 10, alignItems: "center", marginBottom: Spacing.md },
  footer: { position: "absolute", bottom: 0, left: 0, right: 0, padding: Spacing.lg, borderTopWidth: 0.5 },
  submitButton: { width: "100%" },
});
