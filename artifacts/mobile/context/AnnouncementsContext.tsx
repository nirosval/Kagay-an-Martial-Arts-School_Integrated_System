import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
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

const SUPABASE_CONFIGURED =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

function rowToAnnouncement(row: Record<string, unknown>): Announcement {
  return {
    id: row.id as string,
    category: row.category as AnnouncementCategory,
    title: row.title as string,
    body: row.body as string,
    venue: (row.venue as string | undefined) ?? undefined,
    eventDate: (row.event_date as string | undefined) ?? undefined,
    createdBy: row.created_by as string,
    createdByRole: row.created_by_role as UserRole,
    createdAt: row.created_at as string,
  };
}

export function AnnouncementsProvider({ children }: { children: React.ReactNode }) {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const usingSupabase = useRef(false);

  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const { data, error } = await supabase
            .from("announcements")
            .select("*")
            .order("created_at", { ascending: false });
          if (!error && data !== null) {
            usingSupabase.current = true;
            setAnnouncements(data.map(rowToAnnouncement));
            return;
          }
        } catch {
          // fall through to AsyncStorage
        }
      }

      // Fallback: AsyncStorage
      AsyncStorage.getItem(KEY).then((stored) => {
        if (stored) {
          try { setAnnouncements(JSON.parse(stored)); } catch { /* ignore */ }
        }
      });
    })();
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

      if (usingSupabase.current) {
        const { error } = await supabase.from("announcements").insert({
          id: newAnn.id,
          category: newAnn.category,
          title: newAnn.title,
          body: newAnn.body,
          venue: newAnn.venue ?? null,
          event_date: newAnn.eventDate ?? null,
          created_by: newAnn.createdBy,
          created_by_role: newAnn.createdByRole,
          created_at: newAnn.createdAt,
        });
        if (error) throw error;
        setAnnouncements((prev) => [newAnn, ...prev]);
        return;
      }

      // AsyncStorage path
      const stored = await AsyncStorage.getItem(KEY);
      const list: Announcement[] = stored ? JSON.parse(stored) : [];
      const updated = [newAnn, ...list];
      setAnnouncements(updated);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    },
    []
  );

  const deleteAnnouncement = useCallback(
    async (id: string) => {
      if (usingSupabase.current) {
        const { error } = await supabase.from("announcements").delete().eq("id", id);
        if (error) throw error;
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
        return;
      }

      // AsyncStorage path
      const stored = await AsyncStorage.getItem(KEY);
      const list: Announcement[] = stored ? JSON.parse(stored) : [];
      const updated = list.filter((a) => a.id !== id);
      setAnnouncements(updated);
      await AsyncStorage.setItem(KEY, JSON.stringify(updated));
    },
    []
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
