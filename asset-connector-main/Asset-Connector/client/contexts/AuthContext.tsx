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
  verifyOTP: (code: string) => Promise<boolean>;
  setLocationGranted: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_STORAGE_KEY = "@smart_health_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<
    "login" | "location" | "otp" | "complete"
  >("login");
  const [pendingPhone, setPendingPhone] = useState("");

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

  const login = async (fullName: string, phoneNumber: string) => {
    setPendingPhone(phoneNumber);
    const newUser: AuthUser = {
      fullName,
      phoneNumber,
      role: null,
      locationGranted: false,
      isVerified: false,
    };
    setUser(newUser);
    await saveAuthState(newUser);
    setAuthStep("location");
  };

  const setLocationGranted = async () => {
    console.log("[AuthContext] setLocationGranted called");
    setUser((currentUser) => {
      if (currentUser) {
        const updatedUser = { ...currentUser, locationGranted: true };
        saveAuthState(updatedUser);
        return updatedUser;
      }
      return currentUser;
    });

    setTimeout(() => {
      console.log("[AuthContext] Setting authStep to 'otp'");
      setAuthStep("otp");
    }, 50);
  };

  const fetchUserRole = async (phoneNumber: string): Promise<UserRole> => {
    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        new URL(`/api/users/role/${phoneNumber}`, apiUrl).toString(),
      );
      if (response.ok) {
        const data = await response.json();
        return data.role || "patient";
      }
    } catch {
      console.log(
        "[AuthContext] Could not fetch role from server, defaulting to patient",
      );
    }
    return "patient";
  };

  const verifyOTP = async (code: string): Promise<boolean> => {
    if (code.length !== 6) return false;

    const phone = user?.phoneNumber || pendingPhone;
    const name = user?.fullName || "";

    try {
      const apiUrl = getApiUrl();
      const response = await fetch(
        new URL("/api/auth/verify-otp", apiUrl).toString(),
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: code, name }),
        }
      );

      if (response.ok) {
        const data = await response.json() as { success: boolean; user?: { role?: string; name?: string } };
        if (data.success) {
          const role = (data.user?.role as UserRole) || await fetchUserRole(phone);
          console.log("[AuthContext] OTP verified via backend. Role:", role);
          setUser((currentUser) => {
            if (currentUser) {
              const updatedUser = { ...currentUser, isVerified: true, role };
              saveAuthState(updatedUser);
              return updatedUser;
            }
            return currentUser;
          });
          setAuthStep("complete");
          return true;
        }
        return false;
      }

      // 401 = invalid/expired OTP — real rejection
      if (response.status === 401) {
        console.log("[AuthContext] OTP rejected by backend.");
        return false;
      }
    } catch (err) {
      console.log("[AuthContext] Backend OTP check failed, using mock fallback:", err);
    }

    // Fallback: dev/mock mode — accept any 6-digit code when server unreachable
    console.log("[AuthContext] Mock OTP accepted.");
    const role = await fetchUserRole(phone);
    setUser((currentUser) => {
      if (currentUser) {
        const updatedUser = { ...currentUser, isVerified: true, role };
        saveAuthState(updatedUser);
        return updatedUser;
      }
      return currentUser;
    });
    setAuthStep("complete");
    return true;
  };

  const logout = async () => {
    setUser(null);
    setAuthStep("login");
    setPendingPhone("");
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
