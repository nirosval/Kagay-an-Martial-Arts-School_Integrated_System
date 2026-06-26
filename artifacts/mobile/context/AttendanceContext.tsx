import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { supabase } from "@/lib/supabase";
import { AttendanceRecord, StaffAttendanceRecord, UserRole } from "@/types";

const STORAGE_KEY = "kagayan_attendance";
const STAFF_STORAGE_KEY = "kagayan_staff_attendance";
const SESSIONS_PER_PROMO = 12;

const SUPABASE_CONFIGURED =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

function computeStatus(timeInIso: string): AttendanceRecord["status"] {
  const d = new Date(timeInIso);
  const day = d.getDay();
  const totalMins = d.getHours() * 60 + d.getMinutes();
  if (day === 2 || day === 4) return totalMins > 17 * 60 ? "late" : "present";
  if (day === 6) return totalMins > 13 * 60 ? "late" : "present";
  return "present";
}

interface AttendanceContextType {
  records: AttendanceRecord[];
  isLoading: boolean;
  timeIn: (playerId: string) => Promise<AttendanceRecord>;
  timeOut: (playerId: string) => Promise<void>;
  getTodayRecord: (playerId: string) => AttendanceRecord | undefined;
  getPlayerRecords: (playerId: string) => AttendanceRecord[];
  getCompletedSessionCount: (playerId: string) => number;
  getPromoProgress: (playerId: string) => { completed: number; remaining: number; block: number };
  getTodayAll: () => AttendanceRecord[];
  staffRecords: StaffAttendanceRecord[];
  staffTimeIn: (staffId: string, staffName: string, staffRole: UserRole, staffPhotoUrl?: string) => Promise<void>;
  staffTimeOut: (staffId: string) => Promise<void>;
  getTodayStaffRecord: (staffId: string) => StaffAttendanceRecord | undefined;
  getTodayPresentStaff: () => StaffAttendanceRecord[];
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

function rowToRecord(row: Record<string, unknown>): AttendanceRecord {
  return {
    id: row.id as string,
    playerId: row.player_id as string,
    date: row.date as string,
    time_in: row.time_in as string,
    time_out: (row.time_out as string | null) ?? null,
    status: row.status as AttendanceRecord["status"],
  };
}

function rowToStaffRecord(row: Record<string, unknown>): StaffAttendanceRecord {
  return {
    id: row.id as string,
    staffId: row.staff_id as string,
    staffName: row.staff_name as string,
    staffRole: row.staff_role as UserRole,
    staffPhotoUrl: (row.staff_photo_url as string | undefined) ?? undefined,
    date: row.date as string,
    time_in: row.time_in as string,
    time_out: (row.time_out as string | null) ?? null,
  };
}

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const usingSupabase = useRef(false);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const [{ data: attData, error: attErr }, { data: staffData, error: staffErr }] =
            await Promise.all([
              supabase.from("attendance").select("*").order("time_in"),
              supabase.from("staff_attendance").select("*").order("time_in"),
            ]);
          if (!attErr && attData !== null && !staffErr && staffData !== null) {
            usingSupabase.current = true;
            setRecords(attData.map(rowToRecord));
            setStaffRecords(staffData.map(rowToStaffRecord));
            setIsLoading(false);
            return;
          }
        } catch {
          // fall through to AsyncStorage
        }
      }

      // Fallback: AsyncStorage
      Promise.all([
        AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
        AsyncStorage.getItem(STAFF_STORAGE_KEY).catch(() => null),
      ])
        .then(([stored, storedStaff]) => {
          if (stored) { try { setRecords(JSON.parse(stored)); } catch { /* ignore */ } }
          if (storedStaff) { try { setStaffRecords(JSON.parse(storedStaff)); } catch { /* ignore */ } }
        })
        .catch(() => { /* storage unavailable */ })
        .finally(() => { setIsLoading(false); });
    })();
  }, []);

  const persistLocal = useCallback(async (updated: AttendanceRecord[]) => {
    setRecords(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const persistStaffLocal = useCallback(async (updated: StaffAttendanceRecord[]) => {
    setStaffRecords(updated);
    await AsyncStorage.setItem(STAFF_STORAGE_KEY, JSON.stringify(updated));
  }, []);

  // ── Player attendance ──────────────────────────────────────
  const timeIn = useCallback(async (playerId: string): Promise<AttendanceRecord> => {
    const now = new Date().toISOString();
    const newRecord: AttendanceRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      playerId,
      date: todayStr(),
      time_in: now,
      time_out: null,
      status: computeStatus(now),
    };

    if (usingSupabase.current) {
      const { error } = await supabase.from("attendance").insert({
        id: newRecord.id,
        player_id: newRecord.playerId,
        date: newRecord.date,
        time_in: newRecord.time_in,
        time_out: newRecord.time_out,
        status: newRecord.status,
      });
      if (error) throw error;
      setRecords((prev) => [...prev, newRecord]);
    } else {
      await persistLocal([...records, newRecord]);
    }
    return newRecord;
  }, [records, persistLocal]);

  const timeOut = useCallback(async (playerId: string): Promise<void> => {
    const today = todayStr();
    const now = new Date().toISOString();
    const rec = records.find((r) => r.playerId === playerId && r.date === today && r.time_out === null);

    if (usingSupabase.current && rec) {
      const { error } = await supabase.from("attendance").update({ time_out: now }).eq("id", rec.id);
      if (error) throw error;
      setRecords((prev) =>
        prev.map((r) => r.id === rec.id ? { ...r, time_out: now } : r)
      );
    } else {
      await persistLocal(records.map((r) =>
        r.playerId === playerId && r.date === today && r.time_out === null
          ? { ...r, time_out: now }
          : r
      ));
    }
  }, [records, persistLocal]);

  const getTodayRecord = useCallback(
    (playerId: string) => records.find((r) => r.playerId === playerId && r.date === todayStr()),
    [records]
  );

  const getPlayerRecords = useCallback(
    (playerId: string) =>
      records.filter((r) => r.playerId === playerId).sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const getCompletedSessionCount = useCallback(
    (playerId: string) => records.filter((r) => r.playerId === playerId && r.time_out !== null).length,
    [records]
  );

  const getPromoProgress = useCallback((playerId: string) => {
    const completed = records.filter((r) => r.playerId === playerId && r.time_out !== null).length;
    const posInBlock = completed % SESSIONS_PER_PROMO;
    const block = Math.floor(completed / SESSIONS_PER_PROMO) + 1;
    return {
      completed: posInBlock === 0 && completed > 0 ? SESSIONS_PER_PROMO : posInBlock,
      remaining: posInBlock === 0 && completed > 0 ? 0 : SESSIONS_PER_PROMO - posInBlock,
      block,
    };
  }, [records]);

  const getTodayAll = useCallback(
    () => records.filter((r) => r.date === todayStr()),
    [records]
  );

  // ── Staff attendance ───────────────────────────────────────
  const staffTimeIn = useCallback(async (staffId: string, staffName: string, staffRole: UserRole, staffPhotoUrl?: string): Promise<void> => {
    const now = new Date().toISOString();
    const newRecord: StaffAttendanceRecord = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
      staffId,
      staffName,
      staffRole,
      staffPhotoUrl,
      date: todayStr(),
      time_in: now,
      time_out: null,
    };

    if (usingSupabase.current) {
      const { error } = await supabase.from("staff_attendance").insert({
        id: newRecord.id,
        staff_id: newRecord.staffId,
        staff_name: newRecord.staffName,
        staff_role: newRecord.staffRole,
        staff_photo_url: newRecord.staffPhotoUrl ?? null,
        date: newRecord.date,
        time_in: newRecord.time_in,
        time_out: newRecord.time_out,
      });
      if (error) throw error;
      setStaffRecords((prev) => [...prev, newRecord]);
    } else {
      await persistStaffLocal([...staffRecords, newRecord]);
    }
  }, [staffRecords, persistStaffLocal]);

  const staffTimeOut = useCallback(async (staffId: string): Promise<void> => {
    const today = todayStr();
    const now = new Date().toISOString();
    const rec = staffRecords.find((r) => r.staffId === staffId && r.date === today && r.time_out === null);

    if (usingSupabase.current && rec) {
      const { error } = await supabase.from("staff_attendance").update({ time_out: now }).eq("id", rec.id);
      if (error) throw error;
      setStaffRecords((prev) =>
        prev.map((r) => r.id === rec.id ? { ...r, time_out: now } : r)
      );
    } else {
      await persistStaffLocal(staffRecords.map((r) =>
        r.staffId === staffId && r.date === today && r.time_out === null
          ? { ...r, time_out: now }
          : r
      ));
    }
  }, [staffRecords, persistStaffLocal]);

  const getTodayStaffRecord = useCallback(
    (staffId: string) => staffRecords.find((r) => r.staffId === staffId && r.date === todayStr()),
    [staffRecords]
  );

  const getTodayPresentStaff = useCallback(
    () => staffRecords.filter((r) => r.date === todayStr()).sort((a, b) => a.time_in.localeCompare(b.time_in)),
    [staffRecords]
  );

  return (
    <AttendanceContext.Provider value={{
      records, isLoading,
      timeIn, timeOut, getTodayRecord, getPlayerRecords,
      getCompletedSessionCount, getPromoProgress, getTodayAll,
      staffRecords, staffTimeIn, staffTimeOut,
      getTodayStaffRecord, getTodayPresentStaff,
    }}>
      {children}
    </AttendanceContext.Provider>
  );
}

export function useAttendance() {
  const ctx = useContext(AttendanceContext);
  if (!ctx) throw new Error("useAttendance must be used within AttendanceProvider");
  return ctx;
}
