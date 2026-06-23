import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { PlayerAccount } from "@/types";

interface PlayerAuthContextType {
  playerAccount: PlayerAccount | null;
  isLoading: boolean;
  playerLogin: (email: string, password: string) => Promise<{ success: boolean; playerId?: string; error?: string }>;
  playerLogout: () => Promise<void>;
  addPlayerAccount: (account: PlayerAccount) => Promise<void>;
  playerAccounts: PlayerAccount[];
}

const PlayerAuthContext = createContext<PlayerAuthContextType | undefined>(undefined);

const ACCOUNTS_KEY = "kagayan_player_accounts";
const SESSION_KEY = "kagayan_player_session";

export function PlayerAuthProvider({ children }: { children: React.ReactNode }) {
  const [playerAccount, setPlayerAccount] = useState<PlayerAccount | null>(null);
  const [playerAccounts, setPlayerAccounts] = useState<PlayerAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(SESSION_KEY).catch(() => null),
      AsyncStorage.getItem(ACCOUNTS_KEY).catch(() => null),
    ]).then(([session, accounts]) => {
      if (session) {
        try { setPlayerAccount(JSON.parse(session)); } catch { /* ignore */ }
      }
      if (accounts) {
        try { setPlayerAccounts(JSON.parse(accounts)); } catch { /* ignore */ }
      }
    }).catch(() => { /* storage unavailable */ }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const playerLogin = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; playerId?: string; error?: string }> => {
      const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
      const list: PlayerAccount[] = stored ? JSON.parse(stored) : [];
      const found = list.find(
        (a) => a.email === email.toLowerCase() && a.password === password
      );
      if (!found) return { success: false, error: "Invalid email or password." };
      setPlayerAccount(found);
      await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(found));
      return { success: true, playerId: found.playerId };
    },
    []
  );

  const playerLogout = useCallback(async () => {
    setPlayerAccount(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  }, []);

  const addPlayerAccount = useCallback(async (account: PlayerAccount) => {
    const stored = await AsyncStorage.getItem(ACCOUNTS_KEY);
    const list: PlayerAccount[] = stored ? JSON.parse(stored) : [];
    const updated = [...list, account];
    await AsyncStorage.setItem(ACCOUNTS_KEY, JSON.stringify(updated));
    setPlayerAccounts(updated);
    setPlayerAccount(account);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(account));
  }, []);

  return (
    <PlayerAuthContext.Provider value={{ playerAccount, isLoading, playerLogin, playerLogout, addPlayerAccount, playerAccounts }}>
      {children}
    </PlayerAuthContext.Provider>
  );
}

export function usePlayerAuth() {
  const ctx = useContext(PlayerAuthContext);
  if (!ctx) throw new Error("usePlayerAuth must be used within PlayerAuthProvider");
  return ctx;
}
