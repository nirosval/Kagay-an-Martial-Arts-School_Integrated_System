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
import { Achievement, Player, PlayerInput } from "@/types";

interface PlayersContextType {
  players: Player[];
  isLoading: boolean;
  addPlayer: (input: PlayerInput) => Promise<Player>;
  updatePlayer: (id: string, input: Partial<PlayerInput>) => Promise<void>;
  deletePlayer: (id: string) => Promise<void>;
  addAchievement: (playerId: string, achievement: Omit<Achievement, "id">) => Promise<void>;
  deleteAchievement: (playerId: string, achievementId: string) => Promise<void>;
  getPlayer: (id: string) => Player | undefined;
}

const PlayersContext = createContext<PlayersContextType | undefined>(undefined);

const LOCAL_KEY = "kagayan_players";

function calcAge(birthdate: string): number {
  const birth = new Date(birthdate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
  return age;
}

const SEED_PLAYERS: Player[] = [
  {
    id: "seed-1",
    name: "Carlos Dela Cruz",
    birthdate: "2005-03-15",
    age: 20,
    weight_kg: 68,
    height_cm: 172,
    year_started: 2018,
    membership_status: "active_member",
    belt_rank: "Black Belt",
    photo_url: null,
    achievements: [
      { id: "a1", title: "Regional Champion", date: "2023-08-12", description: "1st place kumite division" },
      { id: "a2", title: "National Silver Medal", date: "2024-03-05", description: "Kata team event" },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-2",
    name: "Maria Santos",
    birthdate: "2008-07-22",
    age: 16,
    weight_kg: 52,
    height_cm: 158,
    year_started: 2020,
    membership_status: "active_nonmember",
    belt_rank: "Brown Belt",
    photo_url: null,
    achievements: [
      { id: "a3", title: "City Gold Medal", date: "2024-01-20", description: "Kata individual" },
    ],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "seed-3",
    name: "Jose Reyes",
    birthdate: "2010-11-08",
    age: 14,
    weight_kg: 45,
    height_cm: 155,
    year_started: 2022,
    membership_status: "inactive",
    belt_rank: "Blue Belt",
    photo_url: null,
    achievements: [],
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

function rowToPlayer(row: Record<string, unknown>): Player {
  return {
    id: row.id as string,
    name: row.name as string,
    birthdate: row.birthdate as string,
    age: calcAge(row.birthdate as string),
    weight_kg: Number(row.weight_kg),
    height_cm: Number(row.height_cm),
    year_started: Number(row.year_started),
    membership_status: row.membership_status as Player["membership_status"],
    belt_rank: row.belt_rank as string,
    photo_url: (row.photo_url as string | null) ?? null,
    achievements: (row.achievements as Achievement[]) ?? [],
    created_at: row.created_at as string,
    updated_at: row.updated_at as string,
  };
}

const SUPABASE_CONFIGURED =
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_URL) &&
  Boolean(process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY);

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const usingSupabase = useRef(false);

  // ── Load ──────────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      if (SUPABASE_CONFIGURED) {
        try {
          const { data, error } = await supabase.from("players").select("*").order("created_at");
          if (!error && data) {
            usingSupabase.current = true;
            if (data.length === 0) {
              // Seed into Supabase on first run
              const inserts = SEED_PLAYERS.map((p) => ({
                id: p.id,
                name: p.name,
                birthdate: p.birthdate,
                age: p.age,
                weight_kg: p.weight_kg,
                height_cm: p.height_cm,
                year_started: p.year_started,
                membership_status: p.membership_status,
                belt_rank: p.belt_rank,
                photo_url: p.photo_url,
                achievements: p.achievements,
                created_at: p.created_at,
                updated_at: p.updated_at,
              }));
              await supabase.from("players").insert(inserts);
              setPlayers(SEED_PLAYERS);
            } else {
              setPlayers(data.map(rowToPlayer));
            }
            setIsLoading(false);
            return;
          }
        } catch {
          // fall through to AsyncStorage
        }
      }

      // Fallback: AsyncStorage
      try {
        const stored = await AsyncStorage.getItem(LOCAL_KEY);
        if (stored) {
          try { setPlayers(JSON.parse(stored)); } catch { setPlayers(SEED_PLAYERS); }
        } else {
          setPlayers(SEED_PLAYERS);
          try { await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(SEED_PLAYERS)); } catch { /* ignore */ }
        }
      } catch {
        setPlayers(SEED_PLAYERS);
      }
      setIsLoading(false);
    })();
  }, []);

  // ── Persist helper ────────────────────────────────────────────────────
  const persistLocal = useCallback(async (updated: Player[]) => {
    await AsyncStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
  }, []);

  // ── addPlayer ─────────────────────────────────────────────────────────
  const addPlayer = useCallback(
    async (input: PlayerInput): Promise<Player> => {
      const newPlayer: Player = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...input,
        age: calcAge(input.birthdate),
        achievements: [],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (usingSupabase.current) {
        const { error } = await supabase.from("players").insert({
          id: newPlayer.id,
          name: newPlayer.name,
          birthdate: newPlayer.birthdate,
          age: newPlayer.age,
          weight_kg: newPlayer.weight_kg,
          height_cm: newPlayer.height_cm,
          year_started: newPlayer.year_started,
          membership_status: newPlayer.membership_status,
          belt_rank: newPlayer.belt_rank,
          photo_url: newPlayer.photo_url,
          achievements: newPlayer.achievements,
          created_at: newPlayer.created_at,
          updated_at: newPlayer.updated_at,
        });
        if (error) throw error;
      }

      const updated = [...players, newPlayer];
      setPlayers(updated);
      if (!usingSupabase.current) await persistLocal(updated);
      return newPlayer;
    },
    [players, persistLocal]
  );

  // ── updatePlayer ──────────────────────────────────────────────────────
  const updatePlayer = useCallback(
    async (id: string, input: Partial<PlayerInput>) => {
      const now = new Date().toISOString();
      const updated = players.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...input, updated_at: now };
        if (input.birthdate) merged.age = calcAge(input.birthdate);
        return merged;
      });

      if (usingSupabase.current) {
        const patch: Record<string, unknown> = { ...input, updated_at: now };
        if (input.birthdate) patch.age = calcAge(input.birthdate);
        const { error } = await supabase.from("players").update(patch).eq("id", id);
        if (error) throw error;
      }

      setPlayers(updated);
      if (!usingSupabase.current) await persistLocal(updated);
    },
    [players, persistLocal]
  );

  // ── deletePlayer ──────────────────────────────────────────────────────
  const deletePlayer = useCallback(
    async (id: string) => {
      if (usingSupabase.current) {
        const { error } = await supabase.from("players").delete().eq("id", id);
        if (error) throw error;
      }
      const updated = players.filter((p) => p.id !== id);
      setPlayers(updated);
      if (!usingSupabase.current) await persistLocal(updated);
    },
    [players, persistLocal]
  );

  // ── addAchievement ────────────────────────────────────────────────────
  const addAchievement = useCallback(
    async (playerId: string, achievement: Omit<Achievement, "id">) => {
      const newAch: Achievement = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...achievement,
      };
      const now = new Date().toISOString();
      const updated = players.map((p) => {
        if (p.id !== playerId) return p;
        return { ...p, achievements: [...p.achievements, newAch], updated_at: now };
      });

      if (usingSupabase.current) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          const newAchs = [...player.achievements, newAch];
          const { error } = await supabase
            .from("players")
            .update({ achievements: newAchs, updated_at: now })
            .eq("id", playerId);
          if (error) throw error;
        }
      }

      setPlayers(updated);
      if (!usingSupabase.current) await persistLocal(updated);
    },
    [players, persistLocal]
  );

  // ── deleteAchievement ─────────────────────────────────────────────────
  const deleteAchievement = useCallback(
    async (playerId: string, achievementId: string) => {
      const now = new Date().toISOString();
      const updated = players.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          achievements: p.achievements.filter((a) => a.id !== achievementId),
          updated_at: now,
        };
      });

      if (usingSupabase.current) {
        const player = players.find((p) => p.id === playerId);
        if (player) {
          const newAchs = player.achievements.filter((a) => a.id !== achievementId);
          const { error } = await supabase
            .from("players")
            .update({ achievements: newAchs, updated_at: now })
            .eq("id", playerId);
          if (error) throw error;
        }
      }

      setPlayers(updated);
      if (!usingSupabase.current) await persistLocal(updated);
    },
    [players, persistLocal]
  );

  // ── getPlayer ─────────────────────────────────────────────────────────
  const getPlayer = useCallback(
    (id: string) => players.find((p) => p.id === id),
    [players]
  );

  return (
    <PlayersContext.Provider
      value={{
        players,
        isLoading,
        addPlayer,
        updatePlayer,
        deletePlayer,
        addAchievement,
        deleteAchievement,
        getPlayer,
      }}
    >
      {children}
    </PlayersContext.Provider>
  );
}

export function usePlayers() {
  const ctx = useContext(PlayersContext);
  if (!ctx) throw new Error("usePlayers must be used within PlayersProvider");
  return ctx;
}
