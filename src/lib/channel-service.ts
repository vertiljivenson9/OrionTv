// Channel Service - Types and utilities for channel management
// Supports the new enriched channel data structure

// Core channel interface matching the new data structure
export interface Channel {
  id: string;
  name: string;
  logo: string | null;
  url: string;
  country: string;
  countryCode: string;
  language_primary: string | null;
  is_spanish: boolean;
  is_adult: boolean;
  section: 'deportes' | 'peliculas' | 'series' | 'infantil' | 'español' | 'general';
  categories: string[];
  altNames?: string[];
  network?: string | null;
  owners?: string[];
  
  // Legacy compatibility fields
  category?: string;
  group?: string;
  sources?: string[];
  status?: 'online' | 'offline' | 'unknown';
  lastChecked?: number;
}

// Section configuration
export interface Section {
  id: string;
  name: string;
  count: number;
}

// Section display configuration
export const SECTION_CONFIG: Record<string, { icon: string; color: string }> = {
  'deportes': { icon: '⚽', color: 'text-green-400' },
  'peliculas': { icon: '🎬', color: 'text-purple-400' },
  'series': { icon: '📺', color: 'text-blue-400' },
  'infantil': { icon: '👶', color: 'text-yellow-400' },
  'español': { icon: '🇪🇸', color: 'text-red-400' },
  'general': { icon: '📡', color: 'text-gray-400' },
};

// Spanish-speaking countries
export const SPANISH_SPEAKING_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY', 'GQ'
];

// Helper to check if channel is Spanish
export function isSpanishChannel(channel: Channel): boolean {
  return channel.is_spanish || SPANISH_SPEAKING_COUNTRIES.includes(channel.countryCode);
}

// Helper to get display category (first category or section)
export function getDisplayCategory(channel: Channel): string {
  if (channel.categories && channel.categories.length > 0) {
    return channel.categories[0];
  }
  return channel.section;
}
