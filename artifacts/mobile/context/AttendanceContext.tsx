import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { AttendanceRecord, StaffAttendanceRecord, UserRole } from "@/types";

const STORAGE_KEY = "kagayan_attendance";
const STAFF_STORAGE_KEY = "kagayan_staff_attendance";
const SESSIONS_PER_PROMO = 12;

// Schedule: Tue & Thu 5pm-8pm, Saturday 1pm-4pm
// Late = arrived after session start time
function computeStatus(timeInIso: string): AttendanceRecord["status"] {
  const d = new Date(timeInIso);
  const day = d.getDay(); // 0=Sun,1=Mon,2=Tue,3=Wed,4=Thu,5=Fri,6=Sat
  const totalMins = d.getHours() * 60 + d.getMinutes();

  if (day === 2 || day === 4) {
    // Tuesday / Thursday: session starts 5:00 PM
    return totalMins > 17 * 60 ? "late" : "present";
  }
  if (day === 6) {
    // Saturday: session starts 1:00 PM
    return totalMins > 13 * 60 ? "late" : "present";
  }
  return "present";
}

interface AttendanceContextType {
  // Player attendance
  records: AttendanceRecord[];
  isLoading: boolean;
  timeIn: (playerId: string) => Promise<AttendanceRecord>;
  timeOut: (playerId: string) => Promise<void>;
  getTodayRecord: (playerId: string) => AttendanceRecord | undefined;
  getPlayerRecords: (playerId: string) => AttendanceRecord[];
  getCompletedSessionCount: (playerId: string) => number;
  getPromoProgress: (playerId: string) => { completed: number; remaining: number; block: number };
  getTodayAll: () => AttendanceRecord[];
  // Staff attendance
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

export function AttendanceProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [staffRecords, setStaffRecords] = useState<StaffAttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      AsyncStorage.getItem(STORAGE_KEY).catch(() => null),
      AsyncStorage.getItem(STAFF_STORAGE_KEY).catch(() => null),
    ]).then(([stored, storedStaff]) => {
      if (stored) { try { setRecords(JSON.parse(stored)); } catch { /* ignore */ } }
      if (storedStaff) { try { setStaffRecords(JSON.parse(storedStaff)); } catch { /* ignore */ } }
    }).catch(() => { /* storage unavailable */ }).finally(() => {
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (updated: AttendanceRecord[]) => {
    setRecords(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

  const persistStaff = useCallback(async (updated: StaffAttendanceRecord[]) => {
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
    await persist([...records, newRecord]);
    return newRecord;
  }, [records, persist]);

  const timeOut = useCallback(async (playerId: string): Promise<void> => {
    const today = todayStr();
    const now = new Date().toISOString();
    await persist(records.map((r) =>
      r.playerId === playerId && r.date === today && r.time_out === null
        ? { ...r, time_out: now }
        : r
    ));
  }, [records, persist]);

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
    await persistStaff([...staffRecords, newRecord]);
  }, [staffRecords, persistStaff]);

  const staffTimeOut = useCallback(async (staffId: string): Promise<void> => {
    const today = todayStr();
    const now = new Date().toISOString();
    await persistStaff(staffRecords.map((r) =>
      r.staffId === staffId && r.date === today && r.time_out === null
        ? { ...r, time_out: now }
        : r
    ));
  }, [staffRecords, persistStaff]);

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
