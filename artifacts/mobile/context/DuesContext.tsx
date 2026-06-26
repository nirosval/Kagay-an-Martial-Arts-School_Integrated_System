import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

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

const SUPABASE_CONFIGURED =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

function rowToRecord(row: Record<string, unknown>): DuesRecord {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    month: row.month as string,
    amount: Number(row.amount),
    status: row.status as DuesStatus,
    paidDate: (row.paid_date as string | undefined) ?? undefined,
    notes: (row.notes as string | undefined) ?? undefined,
    createdAt: row.created_at as string,
  };
}

export function DuesProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<DuesRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const usingSupabase = useRef(false);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const { data, error } = await supabase.from("dues").select("*").order("month");
          if (!error && data !== null) {
            usingSupabase.current = true;
            setRecords(data.map(rowToRecord));
            setIsLoading(false);
            return;
          }
        } catch {
          // fall through to AsyncStorage
        }
      }

      // Fallback: AsyncStorage
      AsyncStorage.getItem(STORAGE_KEY)
        .catch(() => null)
        .then((stored) => {
          if (stored) {
            try { setRecords(JSON.parse(stored)); } catch { /* ignore */ }
          }
        })
        .finally(() => setIsLoading(false));
    })();
  }, []);

  const persistLocal = useCallback(async (updated: DuesRecord[]) => {
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

      if (usingSupabase.current) {
        if (existing) {
          const { error } = await supabase.from("dues").update({
            status: patch.status ?? existing.status,
            amount: patch.amount ?? existing.amount,
            paid_date: patch.paidDate ?? null,
            notes: patch.notes ?? null,
          }).eq("id", existing.id);
          if (error) throw error;
          setRecords((prev) =>
            prev.map((r) =>
              r.playerId === playerId && r.month === month ? { ...r, ...patch } : r
            )
          );
        } else {
          const newRec: DuesRecord = {
            id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
            playerId,
            month,
            amount: DEFAULT_DUES_AMOUNT,
            status: "pending",
            createdAt: new Date().toISOString(),
            ...patch,
          };
          const { error } = await supabase.from("dues").insert({
            id: newRec.id,
            player_id: newRec.playerId,
            month: newRec.month,
            amount: newRec.amount,
            status: newRec.status,
            paid_date: newRec.paidDate ?? null,
            notes: newRec.notes ?? null,
            created_at: newRec.createdAt,
          });
          if (error) throw error;
          setRecords((prev) => [...prev, newRec]);
        }
        return;
      }

      // AsyncStorage path
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
      await persistLocal(updated);
    },
    [records, persistLocal]
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
