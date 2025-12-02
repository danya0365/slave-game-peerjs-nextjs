import localforage from "localforage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

/**
 * User interface for local storage
 */
export interface User {
  id: string;
  name: string;
  avatar: string;
  createdAt: string;
  stats: UserStats;
}

export interface UserStats {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  winStreak: number;
  bestWinStreak: number;
}

interface UserState {
  user: User | null;
  isLoading: boolean;
  hasHydrated: boolean;
}

interface UserActions {
  createUser: (name: string, avatar?: string) => void;
  updateUser: (updates: Partial<Pick<User, "name" | "avatar">>) => void;
  updateStats: (result: "win" | "loss") => void;
  resetStats: () => void;
  deleteUser: () => void;
  setHasHydrated: (state: boolean) => void;
}

type UserStore = UserState & UserActions;

/**
 * Generate a unique user ID
 */
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
};

/**
 * Get default avatar based on index
 */
const avatarOptions = [
  "🎴",
  "🃏",
  "♠️",
  "♥️",
  "♦️",
  "♣️",
  "👤",
  "👨",
  "👩",
  "🧑",
  "👦",
  "👧",
  "🐱",
  "🐶",
  "🦊",
  "🐼",
  "🐨",
  "🦁",
];

const getRandomAvatar = (): string => {
  return avatarOptions[Math.floor(Math.random() * avatarOptions.length)];
};

/**
 * Default user stats
 */
const defaultStats: UserStats = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  winStreak: 0,
  bestWinStreak: 0,
};

/**
 * Custom storage adapter for localforage
 * This allows zustand persist to use localforage instead of localStorage
 */
const localforageStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await localforage.getItem<string>(name);
    return value;
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await localforage.setItem(name, value);
  },
  removeItem: async (name: string): Promise<void> => {
    await localforage.removeItem(name);
  },
};

/**
 * User Store
 * Manages user data with persistence to localforage
 */
export const useUserStore = create<UserStore>()(
  persist(
    (set, get) => ({
      // State
      user: null,
      isLoading: true,
      hasHydrated: false,

      // Actions
      createUser: (name: string, avatar?: string) => {
        const newUser: User = {
          id: generateUserId(),
          name: name.trim() || "ผู้เล่น",
          avatar: avatar || getRandomAvatar(),
          createdAt: new Date().toISOString(),
          stats: { ...defaultStats },
        };
        set({ user: newUser, isLoading: false });
      },

      updateUser: (updates) => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            ...updates,
          },
        });
      },

      updateStats: (result) => {
        const currentUser = get().user;
        if (!currentUser) return;

        const newStats = { ...currentUser.stats };
        newStats.gamesPlayed += 1;

        if (result === "win") {
          newStats.gamesWon += 1;
          newStats.winStreak += 1;
          if (newStats.winStreak > newStats.bestWinStreak) {
            newStats.bestWinStreak = newStats.winStreak;
          }
        } else {
          newStats.gamesLost += 1;
          newStats.winStreak = 0;
        }

        set({
          user: {
            ...currentUser,
            stats: newStats,
          },
        });
      },

      resetStats: () => {
        const currentUser = get().user;
        if (!currentUser) return;

        set({
          user: {
            ...currentUser,
            stats: { ...defaultStats },
          },
        });
      },

      deleteUser: () => {
        set({ user: null, isLoading: false });
      },

      setHasHydrated: (state: boolean) => {
        set({ hasHydrated: state, isLoading: !state });
      },
    }),
    {
      name: "slave-game-user",
      storage: createJSONStorage(() => localforageStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);

/**
 * Hook to check if user exists
 */
export const useHasUser = () => {
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  return hasHydrated && user !== null;
};

/**
 * Hook to get user ID
 */
export const useUserId = () => {
  return useUserStore((state) => state.user?.id ?? null);
};

/**
 * Hook to get user name
 */
export const useUserName = () => {
  return useUserStore((state) => state.user?.name ?? "ผู้เล่น");
};

/**
 * Hook to get user stats
 */
export const useUserStats = () => {
  return useUserStore((state) => state.user?.stats ?? defaultStats);
};

/**
 * Available avatar options for selection
 */
export { avatarOptions };
