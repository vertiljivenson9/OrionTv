// Recent Channels Storage - Manages recently watched channels
// Stored in localStorage for persistence

const RECENT_CHANNELS_KEY = 'oriontv_recent_channels';
const MAX_RECENT_CHANNELS = 10;

// Support both old and new channel formats
export interface RecentChannel {
  id: string;
  name: string;
  logo?: string | null;
  url: string;
  country?: string | null;
  countryCode?: string;
  section?: string;
  category?: string;
  categories?: string[];
  is_spanish?: boolean;
  is_adult?: boolean;
  watchedAt: string;
}

// Get recent channels from localStorage
export function getRecentChannels(): RecentChannel[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(RECENT_CHANNELS_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch {
    return [];
  }
}

// Add channel to recent list
export function addRecentChannel(channel: any): RecentChannel[] {
  if (typeof window === 'undefined') return [];

  try {
    const recent = getRecentChannels();

    // Remove if already exists
    const filtered = recent.filter(ch => ch.id !== channel.id);

    // Add to beginning
    const newRecent: RecentChannel = {
      id: channel.id,
      name: channel.name,
      logo: channel.logo || null,
      url: channel.url,
      country: channel.country || null,
      countryCode: channel.countryCode,
      section: channel.section,
      category: channel.category,
      categories: channel.categories,
      is_spanish: channel.is_spanish,
      is_adult: channel.is_adult,
      watchedAt: new Date().toISOString(),
    };

    const updated = [newRecent, ...filtered].slice(0, MAX_RECENT_CHANNELS);

    localStorage.setItem(RECENT_CHANNELS_KEY, JSON.stringify(updated));

    return updated;
  } catch {
    return [];
  }
}

// Clear recent channels
export function clearRecentChannels(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(RECENT_CHANNELS_KEY);
}

// Get random channel from a list
export function getRandomChannel(channels: any[]): any | null {
  if (!channels.length) return null;

  const randomIndex = Math.floor(Math.random() * channels.length);
  return channels[randomIndex];
}
