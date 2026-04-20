import React, { useState, useMemo, useEffect, useLayoutEffect } from "react"; // ✅ أضفنا useLayoutEffect
import {
  View,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar"; // ✅ أضفنا الـ StatusBar
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import * as ImageManipulator from "expo-image-manipulator";

import { GlowingSearchBar } from "@/components/GlowingSearchBar";
import { EmptyState } from "@/components/EmptyState";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { getApiUrl } from "@/lib/query-client";
import { Spacing, BorderRadius, Animation, addAlpha } from "@/constants/theme";
import { medicines } from "@/data/mockData";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");
const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type SearchMode = "text" | "ai";

interface MedicineCardNewProps {
  medicine: (typeof medicines)[0];
  onPress: () => void;
  index: number;
}

function MedicineCardNew({ medicine, onPress, index }: MedicineCardNewProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const name = medicine.nameAr;
  const company = medicine.companyAr;
  const category = medicine.usageAr;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.98, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.gentle);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInUp.delay(index * 50).duration(400)}
    >
      <AnimatedPressable
        android_ripple={{ color: theme.backgroundRoot }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.medicineCard,
          { backgroundColor: theme.backgroundDefault },
          animatedStyle,
        ]}
      >
        <LinearGradient
          colors={[addAlpha(theme.primaryDark, 0.15), addAlpha(theme.primary, 0.08)]}
          style={styles.medicineIcon}
        >
          <Feather name="package" size={24} color={theme.primaryDark} />
        </LinearGradient>

        <View style={styles.medicineInfo}>
          <ThemedText
            type="body"
            style={{ fontWeight: "600" }}
            numberOfLines={1}
          >
            {name}
          </ThemedText>
          <ThemedText
            type="small"
            style={{ color: theme.textSecondary }}
            numberOfLines={1}
          >
            {company}
          </ThemedText>
          <View
            style={[
              styles.categoryChip,
              { backgroundColor: theme.primary + "15" },
            ]}
          >
            <ThemedText
              type="caption"
              style={{ color: theme.primary, fontWeight: "500" }}
            >
              {category}
            </ThemedText>
          </View>
        </View>

        <View
          style={[
            styles.arrowContainer,
            { backgroundColor: theme.primary + "10" },
          ]}
        >
          <Feather name="chevron-right" size={18} color={theme.primary} />
        </View>
      </AnimatedPressable>
    </Animated.View>
  );
}

function AISearchSection({
  onResultPress,
}: {
  onResultPress: (name: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useApp();
  const tabBarHeight = useBottomTabBarHeight();
  const [isProcessing, setIsProcessing] = useState(false);
  const [aiResult, setAiResult] = useState<any>(null);

  const scanPulse = useSharedValue(1);
  const scanRotate = useSharedValue(0);
  const glowOpacity = useSharedValue(0.4);

  useEffect(() => {
    scanPulse.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );

    glowOpacity.value = withRepeat(
      withSequence(
        withTiming(0.8, { duration: 1200 }),
        withTiming(0.4, { duration: 1200 }),
      ),
      -1,
      true,
    );

    scanRotate.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false,
    );
  }, []);

  const scanStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scanPulse.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowOpacity.value,
  }));

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${scanRotate.value}deg` }],
  }));

  const analyzeWithAI = async (uri: string) => {
    try {
      const apiUrl = getApiUrl();
      const uploadUrl = `${apiUrl}/api/analyze`;
      setIsProcessing(true);

      const formData = new FormData();
      const filename = uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename || "");
      const type = match ? `image/${match[1]}` : `image`;

      // @ts-ignore
      formData.append("image", { uri, name: filename, type });

      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
        headers: {
          Accept: "application/json",
        },
      });

      const rawText = await response.text();
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result = JSON.parse(rawText);
      setAiResult(result);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("AI Request Error:", error);
      Alert.alert("خطأ", "فشل تحليل الصورة بالذكاء الاصطناعي.");
    } finally {
      setIsProcessing(false);
    }
  };

  const processImage = async (uri: string) => {
    try {
      setIsProcessing(true);
      const result = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: 800 } }],
        { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG },
      );
      await analyzeWithAI(result.uri);
    } catch (error) {
      console.error("Error during image processing:", error);
      Alert.alert("خطأ", "فشلت عملية معالجة الصورة.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleUpload = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    const { status: cameraStatus } =
      await ImagePicker.requestCameraPermissionsAsync();
    const { status: libraryStatus } =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (cameraStatus !== "granted" || libraryStatus !== "granted") {
      Alert.alert(t("permissionRequired"), t("cameraPermissionMessage"));
      return;
    }

    Alert.alert(t("uploadImage"), t("chooseSource"), [
      {
        text: t("camera"),
        onPress: async () => {
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0].uri) {
            await processImage(result.assets[0].uri);
          }
        },
      },
      {
        text: t("gallery"),
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            allowsEditing: true,
            aspect: [4, 3],
            quality: 0.8,
          });
          if (!result.canceled && result.assets?.[0].uri) {
            await processImage(result.assets[0].uri);
          }
        },
      },
      { text: t("cancel"), style: "cancel" },
    ]);
  };

  return (
    <View style={styles.aiContainer}>
      {!aiResult ? (
        <>
          <View style={styles.aiHeader}>
            <LinearGradient
              colors={[addAlpha(theme.primary, 0.12), addAlpha(theme.primaryDark, 0.06)]}
              style={styles.aiHeaderGradient}
            >
              <Feather name="cpu" size={20} color={theme.primary} />
              <ThemedText
                type="h4"
                style={{ color: theme.primaryDark, marginLeft: Spacing.sm }}
              >
                {t("aiSearch")}
              </ThemedText>
            </LinearGradient>
          </View>

          <Pressable
            android_ripple={{ color: theme.backgroundRoot }}
            onPress={handleUpload}
            style={styles.scanArea}
          >
            <Animated.View style={[styles.glowRing, glowStyle]}>
              <LinearGradient
                colors={[
                  addAlpha(theme.primary, 0.25),
                  addAlpha(theme.primaryDark, 0.12),
                  "transparent",
                ]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
              />
            </Animated.View>

            <Animated.View style={[styles.scanRing, ringStyle]}>
              <View
                style={[styles.ringSegment, { backgroundColor: theme.primary }]}
              />
              <View
                style={[
                  styles.ringSegment,
                  styles.ringSegment2,
                  { backgroundColor: theme.primaryDark },
                ]}
              />
              <View
                style={[
                  styles.ringSegment,
                  styles.ringSegment3,
                  { backgroundColor: theme.primary + "80" },
                ]}
              />
            </Animated.View>

            <Animated.View style={scanStyle}>
              <LinearGradient
                colors={[theme.primary, theme.primaryDark]}
                style={styles.scanButton}
              >
                {isProcessing ? (
                  <ActivityIndicator color="#FFFFFF" size="large" />
                ) : (
                  <Feather name="camera" size={40} color="#FFFFFF" />
                )}
              </LinearGradient>
            </Animated.View>
          </Pressable>

          <ThemedText type="h3" style={styles.scanTitle}>
            {t("uploadImage")}
          </ThemedText>
          <ThemedText
            type="body"
            style={[styles.scanDescription, { color: theme.textSecondary }]}
          >
            {t("aiSearch")}
          </ThemedText>
        </>
      ) : (
        <Animated.View
          entering={FadeInUp.duration(500)}
          style={[
            styles.resultCard,
            {
              backgroundColor: "#1A1A1A",
              borderColor: theme.primary + "40",
              borderWidth: 1.5,
              maxHeight: SCREEN_HEIGHT - 300 - insets.top,
              marginBottom: tabBarHeight + insets.bottom + Spacing.xl,
            },
          ]}
        >
          <View style={styles.resultHeader}>
            <View
              style={[
                styles.iconBadge,
                { backgroundColor: theme.primary + "30" },
              ]}
            >
              <Feather name="search" size={20} color={theme.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: Spacing.md }}>
              <ThemedText
                type="h4"
                style={{ color: "#FFFFFF", fontSize: 18, fontWeight: "700" }}
              >
                نتائج تحليل الدواء
              </ThemedText>
              <ThemedText
                type="caption"
                style={{ color: "#AAAAAA", fontSize: 12 }}
              >
                تم التعرف بواسطة الذكاء الاصطناعي
              </ThemedText>
            </View>
            <Pressable
              android_ripple={{ color: theme.backgroundRoot }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setAiResult(null);
              }}
              style={styles.closeButton}
            >
              <Feather name="x" size={24} color="#FFFFFF" />
            </Pressable>
          </View>

          <ScrollView
            style={styles.resultScroll}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.resultContent}>
              <View style={styles.infoBlock}>
                <ThemedText
                  type="caption"
                  style={[styles.infoLabel, { color: "#CCCCCC" }]}
                >
                  اسم الدواء (Medicine Name)
                </ThemedText>
                <ThemedText
                  type="h3"
                  style={[styles.infoValuePrimary, { color: theme.primary }]}
                >
                  {aiResult.name || "غير معروف"}
                </ThemedText>
                {aiResult.extractedText && (
                  <ThemedText
                    type="caption"
                    style={{ color: "#888888", marginTop: 2 }}
                  >
                    النص الملتقط: {aiResult.extractedText}
                  </ThemedText>
                )}
              </View>

              <View style={styles.resultInfoRow}>
                <View style={styles.infoItem}>
                  <ThemedText
                    type="caption"
                    style={[styles.infoLabel, { color: "#CCCCCC" }]}
                  >
                    نسبة الثقة
                  </ThemedText>
                  <View style={styles.confidenceContainer}>
                    <ThemedText
                      type="body"
                      style={{ color: "#FFFFFF", fontWeight: "700" }}
                    >
                      {(aiResult.confidence * 100).toFixed(1)}%
                    </ThemedText>
                    <View
                      style={[
                        styles.confidenceBar,
                        { backgroundColor: "#333333" },
                      ]}
                    >
                      <View
                        style={[
                          styles.confidenceFill,
                          {
                            width: `${aiResult.confidence * 100}%`,
                            backgroundColor: theme.primary,
                          },
                        ]}
                      />
                    </View>
                  </View>
                </View>
                <View style={styles.infoItem}>
                  <ThemedText
                    type="caption"
                    style={[styles.infoLabel, { color: "#CCCCCC" }]}
                  >
                    الفئة
                  </ThemedText>
                  <ThemedText type="body" style={{ color: "#FFFFFF" }}>
                    {aiResult.category || "غير محدد"}
                  </ThemedText>
                </View>
              </View>

              <View
                style={[styles.infoDivider, { backgroundColor: "#333333" }]}
              />

              <View style={styles.infoBlock}>
                <ThemedText
                  type="caption"
                  style={[styles.infoLabel, { color: "#CCCCCC" }]}
                >
                  التعليمات
                </ThemedText>
                <ThemedText
                  type="body"
                  style={{ color: "#FFFFFF", lineHeight: 20 }}
                >
                  {aiResult.instructions || "لا توجد تعليمات متوفرة"}
                </ThemedText>
              </View>

              {aiResult.extractedText && (
                <View style={styles.infoBlock}>
                  <ThemedText
                    type="caption"
                    style={[styles.infoLabel, { color: "#CCCCCC" }]}
                  >
                    النص المستخرج
                  </ThemedText>
                  <View style={styles.extractedBox}>
                    <ThemedText type="caption" style={{ color: "#AAAAAA" }}>
                      {aiResult.extractedText}
                    </ThemedText>
                  </View>
                </View>
              )}
            </View>
          </ScrollView>

          <View style={[styles.resultActions, { borderTopColor: "#333333" }]}>
            <AnimatedPressable
              android_ripple={{ color: theme.backgroundRoot }}
              onPress={handleUpload}
              style={[
                styles.secondaryActionButton,
                { borderColor: theme.primary },
              ]}
            >
              <Feather name="refresh-cw" size={16} color={theme.primary} />
              <ThemedText
                type="small"
                style={{ color: theme.primary, fontWeight: "700" }}
              >
                إعادة
              </ThemedText>
            </AnimatedPressable>

            <AnimatedPressable
              android_ripple={{ color: theme.backgroundRoot }}
              onPress={() =>
                onResultPress(aiResult.name || aiResult.extractedText)
              }
              style={[styles.actionButton, { backgroundColor: theme.primary }]}
            >
              <ThemedText
                type="body"
                style={{ color: "#FFFFFF", fontWeight: "700" }}
              >
                بحث عن الصيدليات
              </ThemedText>
              <Feather name="arrow-left" size={18} color="#FFFFFF" />
            </AnimatedPressable>
          </View>
        </Animated.View>
      )}

      <View style={styles.aiFeatures}>
        {[
          { icon: "zap", label: "Smart Recognition" },
          { icon: "clock", label: "Instant Results" },
          { icon: "shield", label: "Verified Data" },
        ].map((feature, index) => (
          <Animated.View
            key={feature.icon}
            entering={FadeInUp.delay(400 + index * 100).duration(400)}
            style={[
              styles.aiFeature,
              { backgroundColor: theme.backgroundSecondary },
            ]}
          >
            <Feather
              name={feature.icon as any}
              size={16}
              color={theme.primary}
            />
            <ThemedText
              type="caption"
              style={{ marginLeft: Spacing.xs, color: theme.textSecondary }}
            >
              {feature.label}
            </ThemedText>
          </Animated.View>
        ))}
      </View>
    </View>
  );
}

export default function MedicinesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme } = useTheme();
  const { t } = useApp();
  const navigation = useNavigation<any>();

  const [searchMode, setSearchMode] = useState<SearchMode>("text");
  const [searchQuery, setSearchQuery] = useState("");

  // ✅ حل مشكلة اللون الأبيض في الهيدر لشاشة العلاجات
  useLayoutEffect(() => {
    navigation.setOptions({
      headerStyle: { backgroundColor: theme.backgroundRoot },
      headerTintColor: theme.text,
      headerTitleStyle: { color: theme.text },
      headerShadowVisible: false,
    });
  }, [navigation, theme]);

  const filteredMedicines = useMemo(() => {
    if (!searchQuery.trim()) return medicines;
    const query = searchQuery.toLowerCase();
    return medicines.filter(
      (m) =>
        m.nameAr.toLowerCase().includes(query) ||
        m.companyAr.toLowerCase().includes(query),
    );
  }, [searchQuery]);

  const handleMedicinePress = (medicineId: string) => {
    const medicine = medicines.find((m) => m.id === medicineId);
    if (medicine) {
      const name = medicine.nameAr;
      navigation.navigate(
        "MedicinePharmacies" as never,
        { initialQuery: name } as never,
      );
    }
  };

  const renderEmpty = () => (
    <EmptyState
      image={require("../../assets/images/empty-medicines.png")}
      title={t("emptyMedicines")}
      description={t("noResults")}
    />
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      {/* ✅ لإصلاح لون أيقونات النظام (الساعة والبطارية) */}
      <StatusBar style="auto" />

      <View
        style={[
          styles.header,
          {
            paddingTop: Spacing.md,
            backgroundColor: theme.backgroundRoot,
          },
        ]}
      >
        <View style={styles.modeSelector}>
          <View
            style={[
              styles.segmentedControl,
              {
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.border,
              },
            ]}
          >
            <Pressable
              android_ripple={{ color: theme.backgroundRoot }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSearchMode("text");
              }}
              style={[
                styles.segmentButton,
                searchMode === "text" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="type"
                size={18}
                color={searchMode === "text" ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.segmentLabel,
                  { color: searchMode === "text" ? "#FFFFFF" : theme.text },
                ]}
              >
                {t("textSearch")}
              </ThemedText>
            </Pressable>
            <Pressable
              android_ripple={{ color: theme.backgroundRoot }}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setSearchMode("ai");
              }}
              style={[
                styles.segmentButton,
                searchMode === "ai" && { backgroundColor: theme.primary },
              ]}
            >
              <Feather
                name="cpu"
                size={18}
                color={searchMode === "ai" ? "#FFFFFF" : theme.text}
              />
              <ThemedText
                style={[
                  styles.segmentLabel,
                  { color: searchMode === "ai" ? "#FFFFFF" : theme.text },
                ]}
              >
                {t("aiSearch")}
              </ThemedText>
            </Pressable>
          </View>
        </View>

        {searchMode === "text" && (
          <View style={styles.searchContainer}>
            <GlowingSearchBar
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={t("medicineName")}
            />
          </View>
        )}
      </View>

      <View style={{ flex: 1 }}>
        {searchMode === "ai" ? (
          <AISearchSection
            onResultPress={(name) => {
              setSearchMode("text");
              setSearchQuery(name);
              navigation.navigate(
                "MedicinePharmacies" as never,
                { initialQuery: name } as never,
              );
            }}
          />
        ) : (
          <FlatList
            data={filteredMedicines}
            keyExtractor={(item) => item.id}
            style={{ flex: 1 }}
            contentContainerStyle={[
              styles.list,
              { paddingBottom: tabBarHeight + insets.bottom + Spacing.xl },
            ]}
            renderItem={({ item, index }) => (
              <MedicineCardNew
                medicine={item}
                index={index}
                onPress={() => handleMedicinePress(item.id)}
              />
            )}
            ListEmptyComponent={renderEmpty}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    zIndex: 10,
  },
  modeSelector: { marginBottom: Spacing.md },
  segmentedControl: {
    flexDirection: "row",
    padding: 4,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  segmentButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    gap: Spacing.xs,
  },
  segmentLabel: { fontSize: 14, fontWeight: "600" },
  searchContainer: { marginTop: Spacing.sm },
  list: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md },
  medicineCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    marginBottom: Spacing.md,
  },
  medicineIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.md,
  },
  medicineInfo: { flex: 1 },
  categoryChip: {
    alignSelf: "flex-start",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.full,
    marginTop: Spacing.xs,
  },
  arrowContainer: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: Spacing.sm,
  },
  aiContainer: { flex: 1, padding: Spacing.lg, alignItems: "center" },
  aiHeader: { marginTop: Spacing.xl, marginBottom: Spacing.xl },
  aiHeaderGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
  },
  scanArea: {
    alignItems: "center",
    justifyContent: "center",
    width: 180,
    height: 180,
    marginBottom: Spacing.xl,
  },
  glowRing: {
    position: "absolute",
    width: 200,
    height: 200,
    borderRadius: 100,
    overflow: "hidden",
  },
  scanRing: {
    position: "absolute",
    width: 160,
    height: 160,
    alignItems: "center",
    justifyContent: "center",
  },
  ringSegment: {
    position: "absolute",
    width: 8,
    height: 36,
    borderRadius: 4,
    top: 0,
  },
  ringSegment2: { transform: [{ rotate: "120deg" }, { translateY: 62 }] },
  ringSegment3: { transform: [{ rotate: "240deg" }, { translateY: 62 }] },
  scanButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  scanTitle: { marginBottom: Spacing.sm, textAlign: "center" },
  scanDescription: { textAlign: "center", marginBottom: Spacing.xl },
  aiFeatures: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
    justifyContent: "center",
    marginTop: Spacing.xl,
  },
  aiFeature: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  resultCard: {
    width: "100%",
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  resultHeader: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  iconBadge: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButton: { padding: 4 },
  resultScroll: { flexGrow: 0 },
  resultContent: { paddingHorizontal: Spacing.lg, paddingBottom: Spacing.lg },
  resultInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  infoItem: { flex: 1 },
  infoLabel: { marginBottom: 4, fontSize: 12 },
  infoValuePrimary: { fontWeight: "700" },
  infoDivider: { height: 1, marginVertical: Spacing.md },
  infoBlock: { marginBottom: Spacing.md },
  confidenceContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  confidenceBar: { flex: 1, height: 4, borderRadius: 2, overflow: "hidden" },
  confidenceFill: { height: "100%" },
  extractedBox: {
    backgroundColor: "#252525",
    padding: 10,
    borderRadius: 8,
    marginTop: 4,
  },
  resultActions: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
    borderTopWidth: 1,
  },
  secondaryActionButton: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
    borderWidth: 1,
  },
  actionButton: {
    flex: 2,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
});
