import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  DrawerContentComponentProps,
  DrawerContentScrollView,
} from "@react-navigation/drawer";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInLeft,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme, ThemeMode } from "@/hooks/useTheme";
import { useApp } from "@/contexts/AppContext";
import { useAuth } from "@/contexts/AuthContext";
import { Spacing, BorderRadius, Animation } from "@/constants/theme";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface DrawerItemProps {
  icon: keyof typeof Feather.glyphMap;
  label: string;
  onPress: () => void;
  index: number;
}

function DrawerItem({ icon, label, onPress, index }: DrawerItemProps) {
  const { theme } = useTheme();
  const { language } = useApp();
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);

  const isRTL = language === "ar";

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { translateX: translateX.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, Animation.spring.snappy);
    translateX.value = withSpring(isRTL ? -8 : 8, Animation.spring.snappy);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, Animation.spring.gentle);
    translateX.value = withSpring(0, Animation.spring.gentle);
  };

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <Animated.View
      entering={FadeInLeft.delay(100 + index * 60)
        .duration(400)
        .springify()}
    >
      <AnimatedPressable
        android_ripple={{ color: "transparent" }}
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.drawerItem,
          isRTL && { flexDirection: "row-reverse" },
          animatedStyle,
        ]}
      >
        <View
          style={[styles.iconCircle, { backgroundColor: theme.primary + "15" }]}
        >
          <Feather name={icon} size={20} color={theme.primary} />
        </View>
        <ThemedText
          type="body"
          style={[
            styles.drawerItemLabel,
            isRTL && {
              marginLeft: 0,
              marginRight: Spacing.md,
              textAlign: "right",
            },
          ]}
        >
          {label}
        </ThemedText>
        <Feather
          name={isRTL ? "chevron-left" : "chevron-right"}
          size={18}
          color={theme.textSecondary}
        />
      </AnimatedPressable>
    </Animated.View>
  );
}

export function DrawerContent(props: DrawerContentComponentProps) {
  const { navigation } = props;
  const insets = useSafeAreaInsets();
  const { theme, isDark, themeMode, setThemeMode } = useTheme();
  const { language, setLanguage, t, logout: appLogout } = useApp();
  const { user, logout: authLogout } = useAuth();

  const patientItems = [
    { icon: "calendar" as const, label: t("myBookings"), screen: "MyBookings" },
    { icon: "shopping-bag" as const, label: t("myOrders"), screen: "MyOrders" },
  ];

  const handleLanguageToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const newLang = language === "ar" ? "en" : "ar";
    setLanguage(newLang);
    // Navigation will reset via the key in DrawerNavigator
  };

  const handleLogout = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    navigation.closeDrawer();
    appLogout();
    await authLogout();
  };

  const handleThemeToggle = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const modes: ThemeMode[] = ["light", "dark", "system"];
    const currentIndex = modes.indexOf(themeMode);
    const nextIndex = (currentIndex + 1) % modes.length;
    setThemeMode(modes[nextIndex]);
  };

  const getThemeLabel = () => {
    if (themeMode === "system") return t("systemMode");
    return themeMode === "dark" ? t("darkMode") : t("lightMode");
  };

  return (
    <DrawerContentScrollView
      {...props}
      contentContainerStyle={{
        paddingTop: 0,
        paddingBottom: insets.bottom,
      }}
      style={{ flex: 1, backgroundColor: theme.backgroundRoot }}
    >
      <Animated.View
        entering={FadeInUp.duration(500)}
        style={styles.headerContainer}
      >
        <LinearGradient
          colors={[theme.primary, theme.primaryDark]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.headerGradient,
            { paddingTop: insets.top + Spacing.xl },
            language === "ar" && { alignItems: "flex-end" },
          ]}
        >
          <View
            style={[
              styles.avatarContainer,
              language === "ar" && { alignSelf: "flex-end" },
            ]}
          >
            <View style={styles.avatar}>
              <Feather name="user" size={32} color={theme.primary} />
            </View>
            {user?.isVerified ? (
              <View style={styles.verifiedBadge}>
                <Feather name="check" size={12} color="#FFFFFF" />
              </View>
            ) : null}
          </View>
          <ThemedText
            type="h4"
            style={[
              styles.userName,
              language === "ar" && { textAlign: "right" },
            ]}
          >
            {user?.fullName || "مرحباً بك"}
          </ThemedText>
          {user?.phoneNumber ? (
            <ThemedText
              type="small"
              style={[
                styles.userInfo,
                language === "ar" && { textAlign: "right" },
              ]}
            >
              {user.phoneNumber}
            </ThemedText>
          ) : null}
        </LinearGradient>
      </Animated.View>

      <View style={styles.content}>
        <Animated.View entering={FadeInLeft.delay(50).duration(400)}>
          <ThemedText
            type="caption"
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary },
              language === "ar" && {
                textAlign: "right",
                marginRight: Spacing.sm,
                marginLeft: 0,
              },
            ]}
          >
            {t("menu")}
          </ThemedText>
        </Animated.View>

        {patientItems.map((item, index) => (
          <DrawerItem
            key={item.screen}
            icon={item.icon}
            label={item.label}
            onPress={() => {
              navigation.navigate(item.screen);
              navigation.closeDrawer();
            }}
            index={index}
          />
        ))}

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Animated.View entering={FadeInLeft.delay(200).duration(400)}>
          <ThemedText
            type="caption"
            style={[
              styles.sectionTitle,
              { color: theme.textSecondary },
              language === "ar" && {
                textAlign: "right",
                marginRight: Spacing.sm,
                marginLeft: 0,
              },
            ]}
          >
            {t("careerJoinTitle")}
          </ThemedText>
        </Animated.View>

        <DrawerItem
          icon="user-plus"
          label={t("joinAsDoctor")}
          onPress={() => {
            navigation.navigate("CareerJoin", { type: "doctor" });
            navigation.closeDrawer();
          }}
          index={patientItems.length + 1}
        />
        <DrawerItem
          icon="plus-square"
          label={t("joinAsPharmacist")}
          onPress={() => {
            navigation.navigate("CareerJoin", { type: "pharmacist" });
            navigation.closeDrawer();
          }}
          index={patientItems.length + 2}
        />

        <View style={[styles.divider, { backgroundColor: theme.border }]} />

        <Animated.View
          entering={FadeInLeft.delay(350).duration(400)}
          style={[
            styles.settingCard,
            { backgroundColor: theme.backgroundSecondary },
          ]}
        >
          <View
            style={[
              styles.settingItem,
              language === "ar" && { flexDirection: "row-reverse" },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Feather name="globe" size={20} color={theme.primary} />
            </View>
            <ThemedText
              type="body"
              style={[
                styles.settingLabel,
                language === "ar" && {
                  marginLeft: 0,
                  marginRight: Spacing.md,
                  textAlign: "right",
                },
              ]}
            >
              {t("language")}
            </ThemedText>
            <Pressable
              android_ripple={{ color: "transparent" }}
              onPress={handleLanguageToggle}
              style={[
                styles.langButton,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <ThemedText
                type="small"
                style={{ color: theme.primary, fontWeight: "600" }}
              >
                {language === "ar" ? "EN" : "عربي"}
              </ThemedText>
            </Pressable>
          </View>

          <View
            style={[
              styles.settingDivider,
              { backgroundColor: theme.border },
              language === "ar" && { marginLeft: 0, marginRight: 52 },
            ]}
          />

          <Pressable
            android_ripple={{ color: "transparent" }}
            onPress={handleThemeToggle}
            style={[
              styles.settingItem,
              language === "ar" && { flexDirection: "row-reverse" },
            ]}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: theme.primary + "15" },
              ]}
            >
              <Feather
                name={isDark ? "moon" : "sun"}
                size={20}
                color={theme.primary}
              />
            </View>
            <ThemedText
              type="body"
              style={[
                styles.settingLabel,
                language === "ar" && {
                  marginLeft: 0,
                  marginRight: Spacing.md,
                  textAlign: "right",
                },
              ]}
            >
              {getThemeLabel()}
            </ThemedText>
            <View
              style={[
                styles.langButton,
                { backgroundColor: theme.primary + "20" },
              ]}
            >
              <Feather name="repeat" size={14} color={theme.primary} />
            </View>
          </Pressable>
        </Animated.View>

        <View style={{ height: Spacing.xl }} />

        <Animated.View
          entering={FadeInUp.delay(500).duration(400)}
          style={styles.footer}
        >
          <Pressable
            android_ripple={{ color: "transparent" }}
            onPress={handleLogout}
            style={[
              styles.logoutButton,
              { borderColor: theme.error },
              language === "ar" && { flexDirection: "row-reverse" },
            ]}
          >
            <Feather name="log-out" size={20} color={theme.error} />
            <ThemedText
              type="body"
              style={[
                { color: theme.error, fontWeight: "500" },
                language === "ar"
                  ? { marginRight: Spacing.sm }
                  : { marginLeft: Spacing.sm },
              ]}
            >
              {t("logout")}
            </ThemedText>
          </Pressable>
        </Animated.View>

        <View style={{ height: Spacing["2xl"] }} />
      </View>
    </DrawerContentScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    overflow: "visible",
    borderBottomLeftRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xl,
  },
  headerGradient: {
    padding: Spacing.xl,
    paddingBottom: Spacing["2xl"],
  },
  avatarContainer: {
    position: "relative",
    alignSelf: "flex-start",
    marginBottom: Spacing.md,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: BorderRadius.full,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#4CD964",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    color: "#FFFFFF",
    marginBottom: Spacing.xs,
  },
  userInfo: {
    color: "rgba(255,255,255,0.8)",
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  sectionTitle: {
    marginBottom: Spacing.md,
    marginLeft: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
    fontSize: 11,
    fontWeight: "600",
  },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    alignItems: "center",
    justifyContent: "center",
  },
  drawerItemLabel: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.lg,
    marginHorizontal: Spacing.sm,
  },
  settingCard: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  settingDivider: {
    height: 1,
    marginVertical: Spacing.sm,
    marginLeft: 52,
  },
  settingLabel: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  langButton: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
  },
  footer: {
    padding: Spacing.lg,
  },
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
  },
});
