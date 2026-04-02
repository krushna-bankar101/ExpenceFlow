import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import {
  type User,
  type Company,
  apiLogin,
  apiSignup,
  apiGetMe,
  apiLogout,
  getToken,
} from "../store/data";

interface SignupData {
  name: string;
  email: string;
  password: string;
  companyName: string;
  country: string;
  countryCode: string;
  currency: string;
  currencySymbol: string;
  currencyName: string;
}

interface AuthContextType {
  currentUser: User | null;
  company: Company | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  signup: (data: SignupData) => Promise<{ success: boolean; error?: string }>;
  refreshUser: () => void;
  refreshCompany: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const loadSession = useCallback(async () => {
    const token = getToken();
    if (token) {
      try {
        const { user, company: comp } = await apiGetMe();
        if (user && user.isActive) {
          setCurrentUser(user);
          setCompany(comp);
        } else {
          apiLogout();
        }
      } catch {
        apiLogout();
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const login = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiLogin(email, password);
        setCurrentUser(result.user);
        setCompany(result.company);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Login failed" };
      }
    },
    []
  );

  const logout = useCallback(() => {
    apiLogout();
    setCurrentUser(null);
    setCompany(null);
  }, []);

  const signup = useCallback(
    async (data: SignupData): Promise<{ success: boolean; error?: string }> => {
      try {
        const result = await apiSignup(data);
        setCurrentUser(result.user);
        setCompany(result.company);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Signup failed" };
      }
    },
    []
  );

  const refreshUser = useCallback(async () => {
    try {
      const { user } = await apiGetMe();
      setCurrentUser(user);
    } catch {
      // ignore
    }
  }, []);

  const refreshCompany = useCallback(async () => {
    try {
      const { company: comp } = await apiGetMe();
      setCompany(comp);
    } catch {
      // ignore
    }
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, company, isLoading, login, logout, signup, refreshUser, refreshCompany }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}