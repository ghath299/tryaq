import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager, Platform } from "react-native";
import * as Updates from "expo-updates";

export type UserRole = "patient" | "doctor" | "pharmacist" | "admin" | null;
export type Language = "ar" | "en";

interface User {
  id: string;
  fullName: string;
  phone: string;
  role: UserRole;
  province?: string;
  specialty?: string;
  pharmacyName?: string;
  isVerified: boolean;
}

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  ar: {
    appName: "منصة صحية ذكية",
    home: "الرئيسية",
    doctors: "الأطباء",
    medicines: "العلاجات",
    pharmacies: "الصيدليات",
    profile: "الملف الشخصي",
    settings: "الإعدادات",
    language: "اللغة",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    systemMode: "تلقائي",
    about: "حول التطبيق",
    privacy: "سياسة الخصوصية",
    logout: "تسجيل الخروج",
    login: "تسجيل الدخول",
    register: "إنشاء حساب",
    myBookings: "حجوزاتي",
    myOrders: "طلباتي",
    search: "بحث",
    searchDoctorName: "البحث باسم الطبيب",
    selectSpecialty: "اختر التخصص",
    selectProvince: "اختر المحافظة",
    distance: "المسافة",
    book: "حجز",
    delivery: "توصيل",
    pickUp: "استلام",
    fullName: "الاسم الثلاثي",
    phone: "رقم الهاتف",
    age: "العمر",
    notes: "ملاحظات",
    submit: "إرسال",
    cancel: "إلغاء",
    aiSearch: "البحث بالذكاء الاصطناعي",
    textSearch: "البحث النصي",
    uploadImage: "رفع صورة",
    camera: "الكاميرا",
    gallery: "المعرض",
    chooseSource: "اختر مصدر الصورة",
    permissionRequired: "مطلوب إذن",
    cameraPermissionMessage: "نحتاج إلى إذن الكاميرا ومعرض الصور لمسح الأدوية.",
    medicineName: "اسم العلاج",
    company: "الشركة",
    usage: "الاستخدام",
    available: "متوفر",
    unavailable: "غير متوفر",
    loading: "جاري التحميل...",
    error: "حدث خطأ",
    retry: "إعادة المحاولة",
    clinic: "العيادة",
    workingHours: "ساعات العمل",
    viewAll: "عرض الكل",
    promotedDoctors: "أطباء مميزون",
    promotedPharmacies: "صيدليات مميزة",
    promotedMedicines: "علاجات مميزة",
    healthEvents: "أحداث صحية",
    announcements: "إعلانات",
    apply: "تطبيق",
    clear: "مسح",
    map: "الخريطة",
    info: "المعلومات",
    photos: "الصور",
    bookAppointment: "حجز موعد",
    orderMedicine: "طلب دواء",
    menu: "القائمة",
    careerJoinTitle: "التقديم المهني",
    joinAsDoctor: "انضم كطبيب",
    joinAsPharmacist: "انضم كصيدلاني",
  },
  en: {
    appName: "Smart Health Platform",
    home: "Home",
    doctors: "Doctors",
    medicines: "Medicines",
    pharmacies: "Pharmacies",
    profile: "Profile",
    settings: "Settings",
    language: "Language",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    systemMode: "System",
    about: "About App",
    privacy: "Privacy Policy",
    logout: "Logout",
    login: "Login",
    register: "Register",
    myBookings: "My Bookings",
    myOrders: "My Orders",
    search: "Search",
    searchDoctorName: "Search by doctor name",
    selectSpecialty: "Select Specialty",
    selectProvince: "Select Province",
    distance: "Distance",
    book: "Book",
    delivery: "Delivery",
    pickUp: "Pick Up",
    fullName: "Full Name",
    phone: "Phone Number",
    age: "Age",
    notes: "Notes",
    submit: "Submit",
    cancel: "Cancel",
    aiSearch: "AI Search",
    textSearch: "Text Search",
    uploadImage: "Upload Image",
    camera: "Camera",
    gallery: "Gallery",
    chooseSource: "Choose Image Source",
    permissionRequired: "Permission Required",
    cameraPermissionMessage:
      "We need camera and photo library permissions to scan medicines.",
    medicineName: "Medicine Name",
    company: "Company",
    usage: "Usage",
    available: "Available",
    unavailable: "Unavailable",
    loading: "Loading...",
    error: "An error occurred",
    retry: "Retry",
    clinic: "Clinic",
    workingHours: "Working Hours",
    viewAll: "View All",
    promotedDoctors: "Featured Doctors",
    promotedPharmacies: "Featured Pharmacies",
    promotedMedicines: "Featured Medicines",
    healthEvents: "Health Events",
    announcements: "Announcements",
    apply: "Apply",
    clear: "Clear",
    map: "Map",
    info: "Info",
    photos: "Photos",
    bookAppointment: "Book Appointment",
    orderMedicine: "Order Medicine",
    menu: "Menu",
    careerJoinTitle: "Professional Join",
    joinAsDoctor: "Join as Doctor",
    joinAsPharmacist: "Join as Pharmacist",
  },
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(
    I18nManager.isRTL ? "ar" : "en",
  );
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [savedLanguage, savedUser] = await Promise.all([
        AsyncStorage.getItem("language"),
        AsyncStorage.getItem("user"),
      ]);

      if (savedLanguage === "ar" || savedLanguage === "en") {
        setLanguageState(savedLanguage);
        // Sync RTL if mismatch (can happen on first load or after clear)
        const shouldBeRTL = savedLanguage === "ar";
        if (I18nManager.isRTL !== shouldBeRTL) {
          I18nManager.allowRTL(shouldBeRTL);
          I18nManager.forceRTL(shouldBeRTL);
          if (Platform.OS !== "web" && !__DEV__) {
            try {
              Updates.reloadAsync();
            } catch (e) {
              console.error("Reload failed", e);
            }
          }
        }
      }

      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const setLanguage = async (lang: Language) => {
    if (language === lang) return;

    setLanguageState(lang);
    await AsyncStorage.setItem("language", lang);

    const isAr = lang === "ar";
    I18nManager.allowRTL(isAr);
    I18nManager.forceRTL(isAr);

    // On native, we must reload to apply RTL changes properly
    if (Platform.OS !== "web" && !__DEV__) {
      setTimeout(() => {
        try {
          Updates.reloadAsync();
        } catch (e) {
          console.error("Reload failed", e);
        }
      }, 500);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language,
        setLanguage,
        user,
        setUser,
        isLoading,
        logout,
        t,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
}
