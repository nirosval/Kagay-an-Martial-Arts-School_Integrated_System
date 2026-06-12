import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AttendanceRecord } from "@/types";

const STORAGE_KEY = "kagayan_attendance";
const SESSIONS_PER_PROMO = 12;

// Schedule: Tue & Thu 5pm-8pm, Saturday 1pm-4pm
// Late = arrived after session start time
function computeStatus(timeInIso: string): AttendanceRecord["status"] {
  const d = new Date(timeInIso);
  const day = d.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const totalMins = d.getHours() * 60 + d.getMinutes();

  if (day === 2 || day === 4) {
    // Tuesday / Thursday: session starts 5:00 PM (300 mins past noon = 17*60)
    return totalMins > 17 * 60 ? "late" : "present";
  }
  if (day === 6) {
    // Saturday: session starts 1:00 PM
    return totalMins > 13 * 60 ? "late" : "present";
  }
  // Non-training days: mark as present
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
}

const AttendanceContext = createContext<AttendanceContextType | undefined>(undefined);

function todayStr(): string {
  return new Date().toISOString().split("T")[0];
}

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try { setRecords(JSON.parse(stored)); } catch { /* ignore */ }
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (updated: AttendanceRecord[]) => {
    setRecords(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

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
    await persist([...records, newRecord]);
    return newRecord;
  }, [records, persist]);

  const timeOut = useCallback(async (playerId: string): Promise<void> => {
    const today = todayStr();
    const now = new Date().toISOString();
    const updated = records.map((r) => {
      if (r.playerId === playerId && r.date === today && r.time_out === null) {
        return { ...r, time_out: now };
      }
      return r;
    });
    await persist(updated);
  }, [records, persist]);

  const getTodayRecord = useCallback(
    (playerId: string) =>
      records.find((r) => r.playerId === playerId && r.date === todayStr()),
    [records]
  );

  const getPlayerRecords = useCallback(
    (playerId: string) =>
      records.filter((r) => r.playerId === playerId).sort((a, b) => b.date.localeCompare(a.date)),
    [records]
  );

  const getCompletedSessionCount = useCallback(
    (playerId: string) =>
      records.filter((r) => r.playerId === playerId && r.time_out !== null).length,
    [records]
  );

  const getPromoProgress = useCallback(
    (playerId: string) => {
      const completed = records.filter((r) => r.playerId === playerId && r.time_out !== null).length;
      const posInBlock = completed % SESSIONS_PER_PROMO;
      const block = Math.floor(completed / SESSIONS_PER_PROMO) + 1;
      return {
        completed: posInBlock === 0 && completed > 0 ? SESSIONS_PER_PROMO : posInBlock,
        remaining: posInBlock === 0 && completed > 0 ? 0 : SESSIONS_PER_PROMO - posInBlock,
        block,
      };
    },
    [records]
  );

  const getTodayAll = useCallback(
    () => records.filter((r) => r.date === todayStr()),
    [records]
  );

  return (
    <AttendanceContext.Provider value={{
      records,
      isLoading,
      timeIn,
      timeOut,
      getTodayRecord,
      getPlayerRecords,
      getCompletedSessionCount,
      getPromoProgress,
      getTodayAll,
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
