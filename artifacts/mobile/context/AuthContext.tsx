import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AdminAccount, AdminUser, UserRole } from "@/types";

interface AuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  register: (name: string, email: string, password: string, role: UserRole) => Promise<{ success: boolean; error?: string }>;
  updateProfilePhoto: (photoUri: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ACCOUNTS_KEY = "kagayan_admin_accounts";

const DEFAULT_ACCOUNTS: AdminAccount[] = [
  { id: "1", email: "sensei@kagayan.com", password: "sensei123", name: "Sensei Rivera", role: "sensei" },
  { id: "2", email: "senpai@kagayan.com", password: "senpai123", name: "Senpai Santos", role: "senpai" },
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [accounts, setAccounts] = useState<AdminAccount[]>(DEFAULT_ACCOUNTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem("kagayan_user"),
      AsyncStorage.getItem(ACCOUNTS_KEY),
    ]).then(([storedUser, storedAccounts]) => {
      if (storedUser) {
        try { setUser(JSON.parse(storedUser)); } catch { /* ignore */ }
      }
      if (storedAccounts) {
        try { setAccounts(JSON.parse(storedAccounts)); } catch { /* ignore */ }
      }
      setIsLoading(false);
    });
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<boolean> => {
      const all = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const list: AdminAccount[] = all ? JSON.parse(all) : DEFAULT_ACCOUNTS;
      const found = list.find(
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

  const register = useCallback(
    async (name: string, email: string, password: string, role: UserRole): Promise<{ success: boolean; error?: string }> => {
      const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const list: AdminAccount[] = stored ? JSON.parse(stored) : DEFAULT_ACCOUNTS;
      if (list.find((a) => a.email === email.toLowerCase())) {
        return { success: false, error: "An account with this email already exists." };
      }
      const newAccount: AdminAccount = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        email: email.toLowerCase(),
        password,
        name,
        role,
      };
      const updated = [...list, newAccount];
      await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
      setAccounts(updated);
      const { password: _pw, ...adminUser } = newAccount;
      setUser(adminUser);
      await AsyncStorage.setItem("kagayan_user", JSON.stringify(adminUser));
      return { success: true };
    },
    []
  );

  const updateProfilePhoto = useCallback(async (photoUri: string): Promise<void> => {
    if (!user) return;
    const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const list: AdminAccount[] = stored ? JSON.parse(stored) : DEFAULT_ACCOUNTS;
    const updated = list.map((a) => a.id === user.id ? { ...a, photo_url: photoUri } : a);
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
    setAccounts(updated);
    const updatedUser: AdminUser = { ...user, photo_url: photoUri };
    setUser(updatedUser);
    await AsyncStorage.setItem("kagayan_user", JSON.stringify(updatedUser));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register, updateProfilePhoto }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
