import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { Announcement, AnnouncementCategory, UserRole } from "@/types";

interface AnnouncementsContextType {
  announcements: Announcement[];
  addAnnouncement: (
    category: AnnouncementCategory,
    title: string,
    body: string,
    createdBy: string,
    createdByRole: UserRole,
    venue?: string,
    eventDate?: string
  ) => Promise<void>;
  deleteAnnouncement: (id: string) => Promise<void>;
}

const AnnouncementsContext = createContext<AnnouncementsContextType | undefined>(undefined);
const KEY = "kagayan_announcements";

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((stored) => {
      if (stored) {
        try { setAnnouncements(JSON.parse(stored)); } catch { /* ignore */ }
      }
    });
  }, []);

  const persist = useCallback(async (list: Announcement[]) => {
    setAnnouncements(list);
    await AsyncStorage.setItem(KEY, JSON.stringify(list));
  }, []);

  const addAnnouncement = useCallback(
    async (
      category: AnnouncementCategory,
      title: string,
      body: string,
      createdBy: string,
      createdByRole: UserRole,
      venue?: string,
      eventDate?: string
    ) => {
      const newAnn: Announcement = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 6),
        category,
        title,
        body,
        venue,
        eventDate,
        createdBy,
        createdByRole,
        createdAt: new Date().toISOString(),
      };
      const stored = await AsyncStorage.getItem(KEY);
      const list: Announcement[] = stored ? JSON.parse(stored) : [];
      await persist([newAnn, ...list]);
    },
    [persist]
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      const stored = await AsyncStorage.getItem(KEY);
      const list: Announcement[] = stored ? JSON.parse(stored) : [];
      await persist(list.filter((a) => a.id !== id));
    },
    [persist]
  );

  return (
    <AnnouncementsContext.Provider value={{ announcements, addAnnouncement, deleteAnnouncement }}>
      {children}
    </AnnouncementsContext.Provider>
  );
}

export function useAnnouncements() {
  const ctx = useContext(AnnouncementsContext);
  if (!ctx) throw new Error("useAnnouncements must be used within AnnouncementsProvider");
  return ctx;
}
