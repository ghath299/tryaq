import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { I18nManager } from "react-native";

export type UserRole = "patient" | "doctor" | "pharmacist" | "admin" | null;

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
  language: "ar";
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  logout: () => void;
  t: (key: string) => string;
}

const translations: Record<string, string> = {
  appName: "منصة صحية ذكية",
  home: "الرئيسية",
  doctors: "الأطباء",
  medicines: "العلاجات",
  pharmacies: "الصيدليات",
  profile: "الملف الشخصي",
  settings: "الإعدادات",
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
  healthTips: "نصائح صحية",
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
  km: "كم",
  emptyDoctors: "لا يوجد أطباء",
  emptyPharmacies: "لا يوجد صيدليات",
  emptyMedicines: "لا يوجد علاجات",
  emptyBookings: "لا يوجد حجوزات",
  emptyOrders: "لا يوجد طلبات",
  noResults: "لا توجد نتائج مطابقة",
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    I18nManager.allowRTL(true);
    I18nManager.forceRTL(true);
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const savedUser = await AsyncStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    } catch (error) {
      console.error("Failed to load settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setUser(null);
    await AsyncStorage.removeItem("user");
  };

  const t = (key: string): string => {
    return translations[key] || key;
  };

  return (
    <AppContext.Provider
      value={{
        language: "ar",
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
