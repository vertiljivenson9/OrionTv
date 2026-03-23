// Recent Channels Storage - Manages recently watched channels
// Stored in localStorage for persistence

import type { Channel } from './channel-service';

const RECENT_CHANNELS_KEY = 'oriontv_recent_channels';
const MAX_RECENT_CHANNELS = 10;

export interface RecentChannel extends Channel {
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
export function addRecentChannel(channel: Channel): RecentChannel[] {
  if (typeof window === 'undefined') return [];

  try {
    const recent = getRecentChannels();

    // Remove if already exists
    const filtered = recent.filter(ch => ch.id !== channel.id);

    // Add to beginning
    const newRecent: RecentChannel = {
      ...channel,
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
export function getRandomChannel(channels: Channel[]): Channel | null {
  if (!channels.length) return null;

  const randomIndex = Math.floor(Math.random() * channels.length);
  return channels[randomIndex];
}
