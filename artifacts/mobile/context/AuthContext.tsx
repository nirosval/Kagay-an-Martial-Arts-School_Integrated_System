import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AdminUser } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_ADMINS: Array<AdminUser & { password: string }> = [
  {
    id: "1",
    email: "sensei@kagayan.com",
    password: "sensei123",
    name: "Sensei Rivera",
    role: "sensei",
  },
  {
    id: "2",
    email: "senpai@kagayan.com",
    password: "senpai123",
    name: "Senpai Santos",
    role: "senpai",
  },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem("kagayan_user").then((stored) => {
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch {
          setUser(null);
        }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const found = MOCK_ADMINS.find(
        (a) => a.email === email.toLowerCase() && a.password === password
      );
      if (!found) return false;
      const { password: _pw, ...adminUser } = found;
      setUser(adminUser);
      await AsyncStorage.setItem("kagayan_user", JSON.stringify(adminUser));
      return true;
    },
    []
  );

  const logout = useCallback(async () => {
    setUser(null);
    await AsyncStorage.removeItem("kagayan_user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
