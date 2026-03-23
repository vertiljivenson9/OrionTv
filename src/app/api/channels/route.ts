// Channels API - Returns channels from enriched data source
import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export const revalidate = 300; // Cache for 5 minutes

// Types for the enriched channel data
interface Channel {
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
  altNames: string[];
  network: string | null;
  owners: string[];
}

interface ChannelsData {
  channels: Channel[];
  sections: Array<{ id: string; name: string; count: number }>;
  stats: {
    total: number;
    withStreams: number;
    spanish: number;
    adult: number;
    bySection: Record<string, number>;
    topCountries: Array<{ code: string; count: number; name: string }>;
  };
  lastUpdated: string;
  source: string;
}

// Cache for channels data
let cachedData: ChannelsData | null = null;
let cacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getChannelsData(): Promise<ChannelsData> {
  // Return cached data if still valid
  if (cachedData && Date.now() - cacheTime < CACHE_TTL) {
    return cachedData;
  }

  try {
    const filePath = join(process.cwd(), 'public', 'data', 'channels.json');
    const fileContent = await readFile(filePath, 'utf-8');
    cachedData = JSON.parse(fileContent);
    cacheTime = Date.now();
    return cachedData!;
  } catch (error) {
    console.error('Error reading channels data:', error);
    // Return empty data structure on error
    return {
      channels: [],
      sections: [],
      stats: { total: 0, withStreams: 0, spanish: 0, adult: 0, bySection: {}, topCountries: [] },
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const section = searchParams.get('section');
    const search = searchParams.get('search');
    const spanish = searchParams.get('spanish');
    const adult = searchParams.get('adult');
    const grouped = searchParams.get('grouped') === 'true';
    const sectionsOnly = searchParams.get('sections') === 'true';
    const statsOnly = searchParams.get('stats') === 'true';
    const limit = parseInt(searchParams.get('limit') || '0', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const data = await getChannelsData();

    // Return only sections
    if (sectionsOnly) {
      return NextResponse.json({ sections: data.sections });
    }

    // Return only stats
    if (statsOnly) {
      return NextResponse.json({ 
        stats: data.stats, 
        lastUpdated: data.lastUpdated 
      });
    }

    // Filter channels
    let filteredChannels = data.channels;

    // Exclude adult content by default (unless explicitly requested)
    if (adult !== 'true') {
      filteredChannels = filteredChannels.filter(ch => !ch.is_adult);
    }

    // Filter by section
    if (section) {
      filteredChannels = filteredChannels.filter(
        ch => ch.section === section.toLowerCase()
      );
    }

    // Filter by Spanish
    if (spanish === 'true') {
      filteredChannels = filteredChannels.filter(ch => ch.is_spanish);
    }

    // Filter by search query
    if (search) {
      const searchLower = search.toLowerCase();
      filteredChannels = filteredChannels.filter(ch =>
        ch.name.toLowerCase().includes(searchLower) ||
        ch.categories.some(cat => cat.toLowerCase().includes(searchLower)) ||
        ch.country.toLowerCase().includes(searchLower) ||
        (ch.network && ch.network.toLowerCase().includes(searchLower))
      );
    }

    // Return grouped by section
    if (grouped) {
      const groupedChannels: Record<string, Channel[]> = {};
      
      for (const channel of filteredChannels) {
        if (!groupedChannels[channel.section]) {
          groupedChannels[channel.section] = [];
        }
        groupedChannels[channel.section].push(channel);
      }

      return NextResponse.json({
        grouped: groupedChannels,
        sections: data.sections.filter(s => groupedChannels[s.id]?.length > 0),
        total: filteredChannels.length,
        lastUpdated: data.lastUpdated
      });
    }

    // Apply pagination
    if (limit > 0) {
      filteredChannels = filteredChannels.slice(offset, offset + limit);
    }

    return NextResponse.json({
      channels: filteredChannels,
      total: filteredChannels.length,
      sections: data.sections,
      lastUpdated: data.lastUpdated
    });
  } catch (error) {
    console.error('Error in /api/channels:', error);
    return NextResponse.json(
      { error: 'Failed to fetch channels', channels: [], total: 0 },
      { status: 500 }
    );
  }
}
