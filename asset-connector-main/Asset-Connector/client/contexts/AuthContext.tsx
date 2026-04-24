import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getApiUrl } from "@/lib/query-client";

export type UserRole = "patient" | "doctor" | "pharmacist" | null;

export interface AuthUser {
  id?: string;
  fullName: string;
  phoneNumber: string;
  role: UserRole;
  locationGranted: boolean;
  isVerified: boolean;
}

interface OTPResult {
  success: boolean;
  message?: string;
  attemptsRemaining?: number;
  blocked?: boolean;
  expired?: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  authStep: "login" | "location" | "otp" | "complete";
  pendingPhone: string;
  setUser: (user: AuthUser | null) => void;
  setAuthStep: (step: "login" | "location" | "otp" | "complete") => void;
  setPendingPhone: (phone: string) => void;
  login: (fullName: string, phoneNumber: string) => Promise<void>;
  verifyOTP: (code: string) => Promise<OTPResult>;
  resendOTP: (channel?: string) => Promise<OTPResult>;
  setLocationGranted: (coords?: { lat: number; lng: number; province: string }) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_STORAGE_KEY = "@smart_health_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<"login" | "location" | "otp" | "complete">("login");
  const [pendingPhone, setPendingPhone] = useState("");
  const [pendingName, setPendingName] = useState("");
  const [pendingLocation, setPendingLocation] = useState<{ lat: number; lng: number; province: string } | undefined>();

  useEffect(() => {
    loadAuthState();
  }, []);

  const loadAuthState = async () => {
    try {
      const stored = await AsyncStorage.getItem(AUTH_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as AuthUser;
        setUser(parsed);
        if (parsed.role && parsed.isVerified && parsed.locationGranted) {
          setAuthStep("complete");
        }
      }
    } catch (error) {
      console.error("Failed to load auth state:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveAuthState = async (authUser: AuthUser | null) => {
    try {
      if (authUser) {
        await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(authUser));
      } else {
        await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
      }
    } catch (error) {
      console.error("Failed to save auth state:", error);
    }
  };

  // ── إرسال OTP مع بيانات الجهاز والموقع ───────────────────────────────────────
  const sendOTP = async (
    fullName: string,
    phoneNumber: string,
    channel: string = "telegram",
    location?: { lat: number; lng: number; province: string }
  ): Promise<OTPResult> => {
    const apiUrl = getApiUrl();
    const res = await fetch(`${apiUrl}/api/auth/send-otp`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phoneNumber,
        fullName,
        channel,
        location,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      return {
        success: false,
        message: data.message || "فشل إرسال رمز التحقق",
        blocked: res.status === 429,
      };
    }
    return { success: true };
  };

  // ── تسجيل الدخول ─────────────────────────────────────────────────────────────
  const login = async (fullName: string, phoneNumber: string) => {
    setPendingPhone(phoneNumber);
    setPendingName(fullName);

    const newUser: AuthUser = {
      fullName,
      phoneNumber,
      role: null,
      locationGranted: false,
      isVerified: false,
    };
    setUser(newUser);
    await saveAuthState(newUser);

    // ننتقل لشاشة الموقع أولاً — OTP يُرسل بعد الموقع
    setAuthStep("location");
  };

  // ── بعد الموقع — يرسل OTP مع الموقع ─────────────────────────────────────────
  const setLocationGranted = async (coords?: { lat: number; lng: number; province: string }) => {
    setPendingLocation(coords);

    setUser((currentUser) => {
      if (currentUser) {
        const updatedUser = { ...currentUser, locationGranted: true };
        saveAuthState(updatedUser);
        return updatedUser;
      }
      return currentUser;
    });

    // إرسال OTP مع الموقع
    await sendOTP(pendingName, pendingPhone, "telegram", coords);

    setTimeout(() => setAuthStep("otp"), 50);
  };

  const fetchUserRole = async (phoneNumber: string): Promise<UserRole> => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/users/role/${phoneNumber}`, apiUrl).toString()
      );
      if (response.ok) {
        const data = await response.json();
        return data.role || "patient";
      }
    } catch {
      console.log("[AuthContext] Could not fetch role");
    }
    return "patient";
  };

  // ── التحقق من OTP ─────────────────────────────────────────────────────────────
  const verifyOTP = async (code: string): Promise<OTPResult> => {
    if (code.length !== 6) {
      return { success: false, message: "الرمز يجب أن يكون 6 أرقام" };
    }

    try {
      const apiUrl = getApiUrl();
      const phoneNumber = user?.phoneNumber || pendingPhone;

      const res = await fetch(`${apiUrl}/api/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phoneNumber, otp: code }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        return {
          success: false,
          message: data.message,
          attemptsRemaining: data.attemptsRemaining,
          blocked: res.status === 429,
          expired: data.message?.includes("انتهت الصلاحية"),
        };
      }

      // ✅ OTP صحيح
      const role = await fetchUserRole(phoneNumber);

      setUser((currentUser) => {
        if (currentUser) {
          const updatedUser = { ...currentUser, isVerified: true, role };
          saveAuthState(updatedUser);
          return updatedUser;
        }
        return currentUser;
      });

      setAuthStep("complete");
      return { success: true };
    } catch (err) {
      console.error("[AuthContext] verifyOTP error:", err);
      return { success: false, message: "حدث خطأ — تحقق من اتصالك" };
    }
  };

  // ── إعادة إرسال OTP ───────────────────────────────────────────────────────────
  const resendOTP = async (channel: string = "telegram"): Promise<OTPResult> => {
    const phoneNumber = user?.phoneNumber || pendingPhone;
    const fullName = user?.fullName || pendingName;
    if (!phoneNumber) return { success: false, message: "رقم الهاتف غير موجود" };
    return sendOTP(fullName, phoneNumber, channel, pendingLocation);
  };

  const logout = async () => {
    setUser(null);
    setAuthStep("login");
    setPendingPhone("");
    setPendingName("");
    setPendingLocation(undefined);
    await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
  };

  const isAuthenticated =
    user !== null &&
    user.isVerified &&
    user.locationGranted &&
    user.role !== null;

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        authStep,
        pendingPhone,
        setUser,
        setAuthStep,
        setPendingPhone,
        login,
        verifyOTP,
        resendOTP,
        setLocationGranted,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
