import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
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

const STORAGE_KEY = "kagayan_players";

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

export function PlayersProvider({ children }: { children: React.ReactNode }) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((stored) => {
      if (stored) {
        try {
          setPlayers(JSON.parse(stored));
        } catch {
          setPlayers(SEED_PLAYERS);
        }
      } else {
        setPlayers(SEED_PLAYERS);
        AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_PLAYERS));
      }
      setIsLoading(false);
    });
  }, []);

  const persist = useCallback(async (updated: Player[]) => {
    setPlayers(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  }, []);

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
      await persist([...players, newPlayer]);
      return newPlayer;
    },
    [players, persist]
  );

  const updatePlayer = useCallback(
    async (id: string, input: Partial<PlayerInput>) => {
      const updated = players.map((p) => {
        if (p.id !== id) return p;
        const merged = { ...p, ...input, updated_at: new Date().toISOString() };
        if (input.birthdate) merged.age = calcAge(input.birthdate);
        return merged;
      });
      await persist(updated);
    },
    [players, persist]
  );

  const deletePlayer = useCallback(
    async (id: string) => {
      await persist(players.filter((p) => p.id !== id));
    },
    [players, persist]
  );

  const addAchievement = useCallback(
    async (playerId: string, achievement: Omit<Achievement, "id">) => {
      const newAch: Achievement = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        ...achievement,
      };
      const updated = players.map((p) => {
        if (p.id !== playerId) return p;
        return { ...p, achievements: [...p.achievements, newAch], updated_at: new Date().toISOString() };
      });
      await persist(updated);
    },
    [players, persist]
  );

  const deleteAchievement = useCallback(
    async (playerId: string, achievementId: string) => {
      const updated = players.map((p) => {
        if (p.id !== playerId) return p;
        return {
          ...p,
          achievements: p.achievements.filter((a) => a.id !== achievementId),
          updated_at: new Date().toISOString(),
        };
      });
      await persist(updated);
    },
    [players, persist]
  );

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
