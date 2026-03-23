// Channel data fetching and caching logic
// Uses iptv-org API: channels.json + streams.json for actual stream URLs

export interface Channel {
  id: string;
  name: string;
  logo: string | null;
  country: string | null;
  categories: string[];
  url: string | null;
  languages: string[];
}

interface RawChannel {
  id: string;
  name: string;
  logo?: string;
  country?: string;
  categories?: string[];
  languages?: string[];
}

interface RawStream {
  channel: string;
  url: string;
  status?: string;
  width?: number;
  height?: number;
}

// In-memory cache for channels with stream URLs
let cachedChannels: Channel[] | null = null;
let lastFetchTime: number = 0;
const CACHE_DURATION = 6 * 60 * 60 * 1000; // 6 hours in milliseconds

// IPTV API endpoints
const CHANNELS_URL = "https://iptv-org.github.io/api/channels.json";
const STREAMS_URL = "https://iptv-org.github.io/api/streams.json";

// Combined fetch with parallel loading
export async function fetchChannels(): Promise<Channel[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (cachedChannels && (now - lastFetchTime) < CACHE_DURATION) {
    return cachedChannels;
  }

  try {
    // Fetch both channels and streams in parallel
    const [channelsResponse, streamsResponse] = await Promise.all([
      fetch(CHANNELS_URL, { next: { revalidate: 21600 } }), // Cache for 6 hours
      fetch(STREAMS_URL, { next: { revalidate: 21600 } }),
    ]);
    
    if (!channelsResponse.ok || !streamsResponse.ok) {
      throw new Error("Failed to fetch data");
    }
    
    const rawChannels: RawChannel[] = await channelsResponse.json();
    const rawStreams: RawStream[] = await streamsResponse.json();
    
    // Create a map of channel IDs to stream URLs (prefer working streams)
    const streamMap = new Map<string, string>();
    
    // Process streams - prefer ones with status "online" or without status issues
    const validStatuses = ['online', undefined, null, ''];
    
    rawStreams.forEach((stream) => {
      if (stream.channel && stream.url) {
        // Skip obviously broken streams
        if (stream.url.includes('example.com') || stream.url.includes('localhost')) {
          return;
        }
        
        // If no entry exists, or this stream is marked as online, use it
        const existing = streamMap.get(stream.channel);
        if (!existing || stream.status === 'online') {
          streamMap.set(stream.channel, stream.url);
        }
      }
    });
    
    // Process channels and join with stream URLs
    const processedChannels: Channel[] = rawChannels
      .filter((ch) => ch.name && ch.id)
      .map((ch) => {
        const streamUrl = streamMap.get(ch.id) || null;
        return {
          id: ch.id,
          name: ch.name,
          logo: ch.logo || null,
          country: ch.country || null,
          categories: Array.isArray(ch.categories) ? ch.categories : [],
          languages: Array.isArray(ch.languages) ? ch.languages : [],
          url: streamUrl,
        };
      })
      // Only include channels with stream URLs for better UX
      .filter((ch) => ch.url !== null);
    
    cachedChannels = processedChannels;
    lastFetchTime = now;
    
    console.log(`Loaded ${processedChannels.length} channels with streams`);
    
    return processedChannels;
  } catch (error) {
    console.error("Error fetching channels:", error);
    
    // Return cached data even if expired, or empty array if no cache
    return cachedChannels || [];
  }
}

// Quick fetch for initial load (limited set)
export async function fetchInitialChannels(limit: number = 100): Promise<Channel[]> {
  const allChannels = await fetchChannels();
  return allChannels.slice(0, limit);
}

export function getCountries(channels: Channel[]): string[] {
  const countries = new Set<string>();
  channels.forEach((ch) => {
    if (ch.country) {
      countries.add(ch.country);
    }
  });
  return Array.from(countries).sort();
}

export function getCategories(channels: Channel[]): string[] {
  const categories = new Set<string>();
  channels.forEach((ch) => {
    ch.categories.forEach((cat) => {
      if (cat && cat.trim()) {
        categories.add(cat.trim());
      }
    });
  });
  return Array.from(categories).sort();
}

export function filterChannels(
  channels: Channel[],
  search: string,
  country: string | null,
  category: string | null
): Channel[] {
  return channels.filter((ch) => {
    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      const nameMatch = ch.name.toLowerCase().includes(searchLower);
      if (!nameMatch) return false;
    }
    
    // Country filter
    if (country && ch.country !== country) {
      return false;
    }
    
    // Category filter
    if (category && !ch.categories.includes(category)) {
      return false;
    }
    
    return true;
  });
}

// Force refresh the cache
export async function refreshChannels(): Promise<Channel[]> {
  cachedChannels = null;
  lastFetchTime = 0;
  return fetchChannels();
}
