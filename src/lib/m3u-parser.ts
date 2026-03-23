// M3U Parser for IPTV playlists
// Parses M3U format to extract channels with logos, categories, and stream URLs

export interface ParsedChannel {
  id: string;
  name: string;
  logo: string | null;
  group: string;
  category: string;
  url: string;
  tvgId?: string;
  tvgName?: string;
}

interface M3UExtInf {
  tvgId?: string;
  tvgName?: string;
  tvgLogo?: string;
  groupTitle?: string;
  name: string;
}

// Parse M3U content string
export function parseM3U(content: string): ParsedChannel[] {
  const lines = content.split('\n');
  const channels: ParsedChannel[] = [];
  let currentExtInf: M3UExtInf | null = null;
  let idCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Parse #EXTINF line
    if (line.startsWith('#EXTINF:')) {
      currentExtInf = parseExtInf(line);
      continue;
    }

    // Parse URL line (follows EXTINF)
    if (currentExtInf && line && !line.startsWith('#')) {
      const url = line.trim();

      // Skip obviously invalid URLs
      if (url.startsWith('http') || url.startsWith('rtmp')) {
        const category = normalizeCategory(currentExtInf.groupTitle || 'Sin Categoría');

        channels.push({
          id: `channel-${idCounter++}`,
          name: currentExtInf.name || `Canal ${idCounter}`,
          logo: currentExtInf.tvgLogo || null,
          group: currentExtInf.groupTitle || 'Sin Categoría',
          category: category,
          url: url,
          tvgId: currentExtInf.tvgId,
          tvgName: currentExtInf.tvgName,
        });
      }

      currentExtInf = null;
    }
  }

  return channels;
}

// Parse #EXTINF line to extract metadata
function parseExtInf(line: string): M3UExtInf {
  const result: M3UExtInf = {
    name: '',
  };

  // Extract attributes: tvg-id="..." tvg-name="..." tvg-logo="..." group-title="..."
  const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
  const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
  const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
  const groupTitleMatch = line.match(/group-title="([^"]*)"/i);

  if (tvgIdMatch) result.tvgId = tvgIdMatch[1];
  if (tvgNameMatch) result.tvgName = tvgNameMatch[1];
  if (tvgLogoMatch) result.tvgLogo = tvgLogoMatch[1];
  if (groupTitleMatch) result.groupTitle = groupTitleMatch[1];

  // Extract channel name (after the last comma)
  const commaIndex = line.lastIndexOf(',');
  if (commaIndex !== -1) {
    result.name = line.substring(commaIndex + 1).trim();
  }

  return result;
}

// Normalize category names
function normalizeCategory(category: string): string {
  const categoryMap: Record<string, string> = {
    'news': 'Noticias',
    'sports': 'Deportes',
    'movies': 'Películas',
    'entertainment': 'Entretenimiento',
    'music': 'Música',
    'kids': 'Infantil',
    'documentary': 'Documentales',
    'lifestyle': 'Estilo de Vida',
    'religion': 'Religión',
    'shop': 'Compras',
    'weather': 'Clima',
    'business': 'Negocios',
    'education': 'Educación',
    'legislative': 'Legislativo',
    'general': 'General',
    'animation': 'Animación',
    'comedy': 'Comedia',
    'science': 'Ciencia',
    'classic': 'Clásicos',
    'culture': 'Cultura',
    'auto': 'Automovilismo',
    'cook': 'Cocina',
    'travel': 'Viajes',
    'outdoor': 'Aire Libre',
    'series': 'Series',
    'local': 'Local',
    'regional': 'Regional',
  };

  const lowerCategory = category.toLowerCase();

  for (const [key, value] of Object.entries(categoryMap)) {
    if (lowerCategory.includes(key)) {
      return value;
    }
  }

  // Clean up original category
  return category.replace(/[|]/g, ' ').trim() || 'Otros';
}

// Group channels by category
export function groupByCategory(channels: ParsedChannel[]): Record<string, ParsedChannel[]> {
  const groups: Record<string, ParsedChannel[]> = {};

  for (const channel of channels) {
    if (!groups[channel.category]) {
      groups[channel.category] = [];
    }
    groups[channel.category].push(channel);
  }

  // Sort categories alphabetically
  const sortedGroups: Record<string, ParsedChannel[]> = {};
  const sortedKeys = Object.keys(groups).sort();

  for (const key of sortedKeys) {
    sortedGroups[key] = groups[key].sort((a, b) => a.name.localeCompare(b.name));
  }

  return sortedGroups;
}

// Get unique categories
export function getCategories(channels: ParsedChannel[]): string[] {
  const categories = new Set<string>();
  for (const channel of channels) {
    categories.add(channel.category);
  }
  return Array.from(categories).sort();
}

// Get unique countries/groups
export function getGroups(channels: ParsedChannel[]): string[] {
  const groups = new Set<string>();
  for (const channel of channels) {
    groups.add(channel.group);
  }
  return Array.from(groups).sort();
}
