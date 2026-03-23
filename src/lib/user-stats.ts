// User Statistics and Achievements System
// Stores viewing history, streaks, and achievements in localStorage

const STATS_KEY = 'oriontv_user_stats';
const ACHIEVEMENTS_KEY = 'oriontv_achievements';

export interface UserStats {
  totalChannelsViewed: number;
  totalWatchTime: number; // in minutes
  sessionsCount: number;
  currentStreak: number; // days
  lastVisitDate: string;
  categoriesWatched: Record<string, number>;
  countriesWatched: Record<string, number>;
  channelsViewedToday: number;
  todayDate: string;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

// Default stats
const defaultStats: UserStats = {
  totalChannelsViewed: 0,
  totalWatchTime: 0,
  sessionsCount: 0,
  currentStreak: 0,
  lastVisitDate: '',
  categoriesWatched: {},
  countriesWatched: {},
  channelsViewedToday: 0,
  todayDate: '',
};

// Available achievements
export const AVAILABLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first_channel',
    name: 'Bienvenido',
    description: 'Ve tu primer canal',
    icon: '🎉',
    maxProgress: 1,
  },
  {
    id: 'explorer_10',
    name: 'Explorador',
    description: 'Ve 10 canales diferentes',
    icon: '🗺️',
    maxProgress: 10,
  },
  {
    id: 'explorer_50',
    name: 'Viajero',
    description: 'Ve 50 canales diferentes',
    icon: '✈️',
    maxProgress: 50,
  },
  {
    id: 'explorer_100',
    name: 'Mundial',
    description: 'Ve 100 canales diferentes',
    icon: '🌍',
    maxProgress: 100,
  },
  {
    id: 'marathon_5',
    name: 'Maratonista',
    description: 'Ve 5 canales en una sesión',
    icon: '🏃',
    maxProgress: 5,
  },
  {
    id: 'marathon_10',
    name: 'Imparable',
    description: 'Ve 10 canales en una sesión',
    icon: '💪',
    maxProgress: 10,
  },
  {
    id: 'streak_3',
    name: 'Constante',
    description: 'Mantén una racha de 3 días',
    icon: '🔥',
    maxProgress: 3,
  },
  {
    id: 'streak_7',
    name: 'Dedicado',
    description: 'Mantén una racha de 7 días',
    icon: '⭐',
    maxProgress: 7,
  },
  {
    id: 'categories_5',
    name: 'Versátil',
    description: 'Explora 5 categorías diferentes',
    icon: '🎭',
    maxProgress: 5,
  },
  {
    id: 'countries_5',
    name: 'Internacional',
    description: 'Ve canales de 5 países diferentes',
    icon: '🌐',
    maxProgress: 5,
  },
  {
    id: 'favorite_5',
    name: 'Fan',
    description: 'Agrega 5 canales a favoritos',
    icon: '❤️',
    maxProgress: 5,
  },
  {
    id: 'random_5',
    name: 'Aventurero',
    description: 'Usa el canal sorpresa 5 veces',
    icon: '🎲',
    maxProgress: 5,
  },
];

// Get user stats
export function getUserStats(): UserStats {
  if (typeof window === 'undefined') return defaultStats;

  try {
    const stored = localStorage.getItem(STATS_KEY);
    if (!stored) return defaultStats;
    return JSON.parse(stored);
  } catch {
    return defaultStats;
  }
}

// Save user stats
function saveStats(stats: UserStats): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STATS_KEY, JSON.stringify(stats));
}

// Get unlocked achievements
export function getAchievements(): Achievement[] {
  if (typeof window === 'undefined') return AVAILABLE_ACHIEVEMENTS;

  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY);
    if (!stored) return AVAILABLE_ACHIEVEMENTS;

    const unlocked = JSON.parse(stored) as Record<string, string>;
    return AVAILABLE_ACHIEVEMENTS.map((a) => ({
      ...a,
      unlockedAt: unlocked[a.id],
    }));
  } catch {
    return AVAILABLE_ACHIEVEMENTS;
  }
}

// Unlock achievement
function unlockAchievement(achievementId: string): void {
  if (typeof window === 'undefined') return;

  try {
    const stored = localStorage.getItem(ACHIEVEMENTS_KEY) || '{}';
    const unlocked = JSON.parse(stored);
    if (!unlocked[achievementId]) {
      unlocked[achievementId] = new Date().toISOString();
      localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(unlocked));
    }
  } catch {
    // ignore
  }
}

// Track channel view
export function trackChannelView(channel: {
  id: string;
  category: string;
  country?: string | null;
}): { newAchievements: Achievement[] } {
  const stats = getUserStats();
  const today = new Date().toISOString().split('T')[0];
  const newAchievements: Achievement[] = [];

  // Reset daily counter if new day
  if (stats.todayDate !== today) {
    stats.channelsViewedToday = 0;
    stats.todayDate = today;
  }

  // Update stats
  stats.totalChannelsViewed++;
  stats.channelsViewedToday++;

  // Track category
  stats.categoriesWatched[channel.category] = (stats.categoriesWatched[channel.category] || 0) + 1;

  // Track country
  if (channel.country) {
    stats.countriesWatched[channel.country] = (stats.countriesWatched[channel.country] || 0) + 1;
  }

  // Update streak
  updateStreak(stats);

  // Check achievements
  if (stats.totalChannelsViewed === 1) {
    unlockAchievement('first_channel');
    newAchievements.push(AVAILABLE_ACHIEVEMENTS.find(a => a.id === 'first_channel')!);
  }
  if (stats.totalChannelsViewed >= 10) {
    unlockAchievement('explorer_10');
  }
  if (stats.totalChannelsViewed >= 50) {
    unlockAchievement('explorer_50');
  }
  if (stats.totalChannelsViewed >= 100) {
    unlockAchievement('explorer_100');
  }
  if (stats.channelsViewedToday >= 5) {
    unlockAchievement('marathon_5');
  }
  if (stats.channelsViewedToday >= 10) {
    unlockAchievement('marathon_10');
  }
  if (stats.currentStreak >= 3) {
    unlockAchievement('streak_3');
  }
  if (stats.currentStreak >= 7) {
    unlockAchievement('streak_7');
  }
  if (Object.keys(stats.categoriesWatched).length >= 5) {
    unlockAchievement('categories_5');
  }
  if (Object.keys(stats.countriesWatched).length >= 5) {
    unlockAchievement('countries_5');
  }

  saveStats(stats);

  return { newAchievements };
}

// Track random channel usage
let randomChannelCount = 0;
export function trackRandomChannel(): Achievement | null {
  randomChannelCount++;

  if (randomChannelCount >= 5) {
    unlockAchievement('random_5');
    return AVAILABLE_ACHIEVEMENTS.find(a => a.id === 'random_5') || null;
  }
  return null;
}

// Track favorites
export function trackFavorite(count: number): Achievement | null {
  if (count >= 5) {
    unlockAchievement('favorite_5');
    return AVAILABLE_ACHIEVEMENTS.find(a => a.id === 'favorite_5') || null;
  }
  return null;
}

// Update streak
function updateStreak(stats: UserStats): void {
  const today = new Date().toISOString().split('T')[0];
  const lastVisit = stats.lastVisitDate;

  if (!lastVisit) {
    stats.currentStreak = 1;
  } else {
    const lastDate = new Date(lastVisit);
    const todayDate = new Date(today);
    const diffDays = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      stats.currentStreak++;
    } else if (diffDays > 1) {
      stats.currentStreak = 1;
    }
    // If diffDays === 0, same day, don't change streak
  }

  stats.lastVisitDate = today;
  stats.sessionsCount++;
}

// Track watch time
export function trackWatchTime(minutes: number): void {
  const stats = getUserStats();
  stats.totalWatchTime += minutes;
  saveStats(stats);
}

// Get formatted stats for display
export function getFormattedStats(): {
  totalChannels: number;
  watchTimeFormatted: string;
  streak: number;
  categories: number;
  countries: number;
  todayChannels: number;
} {
  const stats = getUserStats();

  const hours = Math.floor(stats.totalWatchTime / 60);
  const mins = stats.totalWatchTime % 60;
  const watchTimeFormatted = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;

  return {
    totalChannels: stats.totalChannelsViewed,
    watchTimeFormatted,
    streak: stats.currentStreak,
    categories: Object.keys(stats.categoriesWatched).length,
    countries: Object.keys(stats.countriesWatched).length,
    todayChannels: stats.channelsViewedToday,
  };
}
