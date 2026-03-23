// Channel Service - Fetches, parses, and caches M3U playlists
// Implements pre-validation and fallback system

import { parseM3U, groupByCategory, ParsedChannel } from './m3u-parser';

export interface Channel extends ParsedChannel {
  sources: string[]; // Multiple sources for fallback
  status: 'online' | 'offline' | 'unknown';
  lastChecked?: number;
}

// M3U playlist URL
const M3U_URL = 'https://iptv-org.github.io/iptv/index.m3u';

// In-memory cache
let cachedChannels: Channel[] | null = null;
let cachedCategories: string[] | null = null;
let cachedGroupedChannels: Record<string, Channel[]> | null = null;
let lastFetchTime = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Channel status cache (for pre-validation)
const channelStatusCache = new Map<string, { status: 'online' | 'offline'; timestamp: number }>();
const STATUS_CACHE_DURATION = 60 * 1000; // 1 minute

// Fetch and parse M3U playlist
export async function fetchAndParseM3U(): Promise<Channel[]> {
  const now = Date.now();

  // Return cached data if still valid
  if (cachedChannels && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedChannels;
  }

  try {
    console.log('Fetching M3U playlist from:', M3U_URL);

    const response = await fetch(M3U_URL, {
      next: { revalidate: 300 }, // Cache for 5 minutes
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch M3U: ${response.status}`);
    }

    const content = await response.text();
    const parsed = parseM3U(content);

    // Convert to Channel format with sources array
    const channels: Channel[] = parsed.map((ch) => ({
      ...ch,
      sources: [ch.url], // Initialize with single source
      status: 'unknown' as const,
    }));

    // Update cache
    cachedChannels = channels;
    cachedCategories = null; // Reset category cache
    cachedGroupedChannels = null; // Reset grouped cache
    lastFetchTime = now;

    console.log(`Parsed ${channels.length} channels from M3U`);

    return channels;
  } catch (error) {
    console.error('Error fetching M3U:', error);

    // Return cached data even if expired
    if (cachedChannels) {
      console.log('Returning cached channels due to fetch error');
      return cachedChannels;
    }

    return [];
  }
}

// Get all channels
export async function getChannels(): Promise<Channel[]> {
  return fetchAndParseM3U();
}

// Get channels grouped by category
export async function getChannelsByCategory(): Promise<Record<string, Channel[]>> {
  const now = Date.now();

  if (cachedGroupedChannels && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedGroupedChannels;
  }

  const channels = await getChannels();
  const grouped = groupByCategory(channels) as Record<string, Channel[]>;

  cachedGroupedChannels = grouped;

  return grouped;
}

// Get unique categories
export async function getCategories(): Promise<string[]> {
  if (cachedCategories) {
    return cachedCategories;
  }

  const channels = await getChannels();
  const categories = [...new Set(channels.map((ch) => ch.category))].sort();

  cachedCategories = categories;

  return categories;
}

// Search channels
export async function searchChannels(query: string): Promise<Channel[]> {
  const channels = await getChannels();
  const lowerQuery = query.toLowerCase();

  return channels.filter((ch) =>
    ch.name.toLowerCase().includes(lowerQuery) ||
    ch.category.toLowerCase().includes(lowerQuery) ||
    ch.group.toLowerCase().includes(lowerQuery)
  );
}

// Get channels by category
export async function getChannelsForCategory(category: string): Promise<Channel[]> {
  const grouped = await getChannelsByCategory();
  return grouped[category] || [];
}

// Pre-validate channel stream (quick check)
export async function validateChannel(url: string): Promise<'online' | 'offline'> {
  const now = Date.now();

  // Check cache first
  const cached = channelStatusCache.get(url);
  if (cached && (now - cached.timestamp) < STATUS_CACHE_DURATION) {
    return cached.status;
  }

  try {
    // Quick HEAD request with timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(url, {
      method: 'HEAD',
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    const status = response.ok ? 'online' : 'offline';
    channelStatusCache.set(url, { status, timestamp: now });

    return status;
  } catch {
    const status = 'offline';
    channelStatusCache.set(url, { status, timestamp: now });

    return status;
  }
}

// Validate multiple channels in parallel
export async function validateChannels(urls: string[]): Promise<Map<string, 'online' | 'offline'>> {
  const results = new Map<string, 'online' | 'offline'>();

  // Validate in batches of 5 to avoid overwhelming the server
  const batchSize = 5;

  for (let i = 0; i < urls.length; i += batchSize) {
    const batch = urls.slice(i, i + batchSize);
    const validations = await Promise.all(
      batch.map(async (url) => ({
        url,
        status: await validateChannel(url),
      }))
    );

    for (const { url, status } of validations) {
      results.set(url, status);
    }
  }

  return results;
}

// Force refresh cache
export async function refreshChannels(): Promise<Channel[]> {
  cachedChannels = null;
  cachedCategories = null;
  cachedGroupedChannels = null;
  lastFetchTime = 0;

  return getChannels();
}
