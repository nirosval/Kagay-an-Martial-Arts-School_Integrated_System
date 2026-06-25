import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

export type DuesStatus = "paid" | "overdue" | "pending";

export interface DuesRecord {
  id: string;
  playerId: string;
  month: string;
  amount: number;
  status: DuesStatus;
  paidDate?: string;
  notes?: string;
  createdAt: string;
}

interface DuesContextType {
  records: DuesRecord[];
  isLoading: boolean;
  getPlayerDues: (playerId: string) => DuesRecord[];
  getMonthStatus: (playerId: string, month: string) => DuesStatus;
  getMonthRecord: (playerId: string, month: string) => DuesRecord | undefined;
  markPaid: (playerId: string, month: string, amount?: number, notes?: string) => Promise<void>;
  markOverdue: (playerId: string, month: string) => Promise<void>;
  markPending: (playerId: string, month: string) => Promise<void>;
  getAllForMonth: (month: string) => DuesRecord[];
}

const DuesContext = createContext<DuesContextType | undefined>(undefined);

const STORAGE_KEY = "kagayan_dues";
export const DEFAULT_DUES_AMOUNT = 500;

export function DuesProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DuesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .catch(() => null)
      .then((stored) => {
        if (stored) {
          try { setRecords(JSON.parse(stored)); } catch { /* ignore */ }
        }
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (updated: DuesRecord[]) => {
    setRecords(updated);
    try { await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); } catch { /* ignore */ }
  }, []);

  const getPlayerDues = useCallback(
    (playerId: string) =>
      records.filter((r) => r.playerId === playerId).sort((a, b) => b.month.localeCompare(a.month)),
    [records]
  );

  const getMonthRecord = useCallback(
    (playerId: string, month: string) =>
      records.find((r) => r.playerId === playerId && r.month === month),
    [records]
  );

  const getMonthStatus = useCallback(
    (playerId: string, month: string): DuesStatus =>
      records.find((r) => r.playerId === playerId && r.month === month)?.status ?? "pending",
    [records]
  );

  const getAllForMonth = useCallback(
    (month: string) => records.filter((r) => r.month === month),
    [records]
  );

  const upsert = useCallback(
    async (playerId: string, month: string, patch: Partial<DuesRecord>) => {
      const existing = records.find((r) => r.playerId === playerId && r.month === month);
      let updated: DuesRecord[];
      if (existing) {
        updated = records.map((r) =>
          r.playerId === playerId && r.month === month ? { ...r, ...patch } : r
        );
      } else {
        updated = [
          ...records,
          {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            playerId,
            month,
            amount: DEFAULT_DUES_AMOUNT,
            status: "pending" as DuesStatus,
            createdAt: new Date().toISOString(),
            ...patch,
          },
        ];
      }
      await persist(updated);
    },
    [records, persist]
  );

  const markPaid = useCallback(
    async (playerId: string, month: string, amount?: number, notes?: string) => {
      await upsert(playerId, month, {
        status: "paid",
        amount: amount ?? DEFAULT_DUES_AMOUNT,
        paidDate: new Date().toISOString(),
        notes,
      });
    },
    [upsert]
  );

  const markOverdue = useCallback(
    async (playerId: string, month: string) => {
      await upsert(playerId, month, { status: "overdue", paidDate: undefined });
    },
    [upsert]
  );

  const markPending = useCallback(
    async (playerId: string, month: string) => {
      await upsert(playerId, month, { status: "pending", paidDate: undefined });
    },
    [upsert]
  );

  return (
    <DuesContext.Provider
      value={{ records, isLoading, getPlayerDues, getMonthStatus, getMonthRecord, markPaid, markOverdue, markPending, getAllForMonth }}
    >
      {children}
    </DuesContext.Provider>
  );
}

export function useDues() {
  const ctx = useContext(DuesContext);
  if (!ctx) throw new Error("useDues must be used within DuesProvider");
  return ctx;
}
