// Script para obtener canales premium de FILEX IPTV
import { writeFileSync } from 'fs';
import { join } from 'path';

const IPTV_SERVER = {
  server: 'filex.me',
  port: 8080,
  username: '10101010',
  password: '10101010'
};

interface RawChannel {
  num: number;
  name: string;
  stream_type: string;
  stream_id: number;
  stream_icon: string;
  category_id: string;
  epg_channel_id?: string;
}

interface Category {
  category_id: string;
  category_name: string;
  stream_count?: number;
}

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

// Mapeo de categorías a secciones
function getSection(categoryName: string): Channel['section'] {
  const name = categoryName.toLowerCase();
  
  if (name.includes('sport') || name.includes('cricket') || name.includes('football') || 
      name.includes('wwe') || name.includes('ufc') || name.includes('golf') ||
      name.includes('tennis') || name.includes('racing') || name.includes('nba') ||
      name.includes('nfl') || name.includes('mlb') || name.includes('nhl')) {
    return 'deportes';
  }
  
  if (name.includes('movie') || name.includes('cinema') || name.includes('hollywood') ||
      name.includes('bollywood') || name.includes('netflix') || name.includes('amazon')) {
    return 'peliculas';
  }
  
  if (name.includes('series') || name.includes('tv show') || name.includes('drama')) {
    return 'series';
  }
  
  if (name.includes('kids') || name.includes('cartoon') || name.includes('animation') ||
      name.includes('infantil') || name.includes('children')) {
    return 'infantil';
  }
  
  if (name.includes('español') || name.includes('spain') || name.includes('latino') ||
      name.includes('mexico') || name.includes('argentina')) {
    return 'español';
  }
  
  return 'general';
}

// Mapeo de países por categoría
function getCountryFromCategory(categoryName: string): { country: string; code: string } {
  const name = categoryName.toLowerCase();
  
  if (name.includes('usa') || name.includes('america')) return { country: 'United States', code: 'US' };
  if (name.includes('uk') || name.includes('britain')) return { country: 'United Kingdom', code: 'GB' };
  if (name.includes('ind') || name.includes('india')) return { country: 'India', code: 'IN' };
  if (name.includes('pk') || name.includes('pakistan')) return { country: 'Pakistan', code: 'PK' };
  if (name.includes('canada')) return { country: 'Canada', code: 'CA' };
  if (name.includes('australia') || name.includes('au ')) return { country: 'Australia', code: 'AU' };
  if (name.includes('germany') || name.includes('alemania')) return { country: 'Germany', code: 'DE' };
  if (name.includes('france')) return { country: 'France', code: 'FR' };
  if (name.includes('spain') || name.includes('español')) return { country: 'Spain', code: 'ES' };
  if (name.includes('italy')) return { country: 'Italy', code: 'IT' };
  if (name.includes('brazil')) return { country: 'Brazil', code: 'BR' };
  if (name.includes('mexico')) return { country: 'Mexico', code: 'MX' };
  if (name.includes('arab') || name.includes('arabic') || name.includes('qatar') ||
      name.includes('uae') || name.includes('saudi') || name.includes('kuwait')) {
    return { country: 'Arabic', code: 'AE' };
  }
  if (name.includes('turkey')) return { country: 'Turkey', code: 'TR' };
  if (name.includes('bangladesh')) return { country: 'Bangladesh', code: 'BD' };
  if (name.includes('afganistan')) return { country: 'Afghanistan', code: 'AF' };
  if (name.includes('iran')) return { country: 'Iran', code: 'IR' };
  if (name.includes('poland')) return { country: 'Poland', code: 'PL' };
  if (name.includes('portugal')) return { country: 'Portugal', code: 'PT' };
  if (name.includes('greece')) return { country: 'Greece', code: 'GR' };
  if (name.includes('russia')) return { country: 'Russia', code: 'RU' };
  if (name.includes('netherlands')) return { country: 'Netherlands', code: 'NL' };
  if (name.includes('sweden')) return { country: 'Sweden', code: 'SE' };
  if (name.includes('denmark')) return { country: 'Denmark', code: 'DK' };
  if (name.includes('norway')) return { country: 'Norway', code: 'NO' };
  if (name.includes('finland')) return { country: 'Finland', code: 'FI' };
  if (name.includes('albania')) return { country: 'Albania', code: 'AL' };
  if (name.includes('serbia')) return { country: 'Serbia', code: 'RS' };
  if (name.includes('croatia')) return { country: 'Croatia', code: 'HR' };
  if (name.includes('romania')) return { country: 'Romania', code: 'RO' };
  if (name.includes('bulgaria')) return { country: 'Bulgaria', code: 'BG' };
  if (name.includes('hungary')) return { country: 'Hungary', code: 'HU' };
  if (name.includes('africa')) return { country: 'South Africa', code: 'ZA' };
  if (name.includes('philippines')) return { country: 'Philippines', code: 'PH' };
  
  return { country: 'International', code: 'INT' };
}

async function fetchAllChannels() {
  console.log('🚀 Obteniendo canales premium de FILEX IPTV...');
  
  // Fetch categories
  const categoriesUrl = `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_categories`;
  
  console.log('📡 Obteniendo categorías...');
  const categoriesRes = await fetch(categoriesUrl);
  const categories: Category[] = await categoriesRes.json();
  console.log(`✅ ${categories.length} categorías encontradas`);
  
  // Create category map
  const categoryMap: Record<string, string> = {};
  categories.forEach(cat => {
    categoryMap[cat.category_id] = cat.category_name;
  });
  
  // Fetch all streams
  console.log('📡 Obteniendo todos los canales...');
  const streamsUrl = `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/player_api.php?username=${IPTV_SERVER.username}&password=${IPTV_SERVER.password}&action=get_live_streams`;
  const streamsRes = await fetch(streamsUrl);
  const streams: RawChannel[] = await streamsRes.json();
  console.log(`✅ ${streams.length} canales encontrados`);
  
  // Transform to our format
  const channels: Channel[] = streams.map(stream => {
    const categoryName = categoryMap[stream.category_id] || 'General';
    const { country, code } = getCountryFromCategory(categoryName);
    const section = getSection(categoryName);
    
    return {
      id: `filex-${stream.stream_id}`,
      name: stream.name,
      logo: stream.stream_icon || null,
      url: `http://${IPTV_SERVER.server}:${IPTV_SERVER.port}/live/${IPTV_SERVER.username}/${IPTV_SERVER.password}/${stream.stream_id}.m3u8`,
      country,
      countryCode: code,
      language_primary: null,
      is_spanish: categoryName.toLowerCase().includes('español') || 
                   categoryName.toLowerCase().includes('spain') ||
                   categoryName.toLowerCase().includes('latino'),
      is_adult: false,
      section,
      categories: [categoryName],
      altNames: [],
      network: null,
      owners: []
    };
  });
  
  // Group by sections for stats
  const bySection: Record<string, number> = {};
  channels.forEach(ch => {
    bySection[ch.section] = (bySection[ch.section] || 0) + 1;
  });
  
  console.log('\n📊 Estadísticas:');
  console.log(`   Total canales: ${channels.length}`);
  Object.entries(bySection).forEach(([section, count]) => {
    console.log(`   ${section}: ${count}`);
  });
  
  // Create sections array
  const sections = [
    { id: 'deportes', name: 'Deportes', count: bySection['deportes'] || 0 },
    { id: 'peliculas', name: 'Películas', count: bySection['peliculas'] || 0 },
    { id: 'series', name: 'Series', count: bySection['series'] || 0 },
    { id: 'infantil', name: 'Infantil', count: bySection['infantil'] || 0 },
    { id: 'español', name: 'Español', count: bySection['español'] || 0 },
    { id: 'general', name: 'General', count: bySection['general'] || 0 },
  ].filter(s => s.count > 0);
  
  // Create output
  const output = {
    channels,
    sections,
    stats: {
      total: channels.length,
      withStreams: channels.length,
      spanish: channels.filter(c => c.is_spanish).length,
      adult: channels.filter(c => c.is_adult).length,
      bySection,
      topCountries: [
        { code: 'US', count: channels.filter(c => c.countryCode === 'US').length, name: 'United States' },
        { code: 'GB', count: channels.filter(c => c.countryCode === 'GB').length, name: 'United Kingdom' },
        { code: 'IN', count: channels.filter(c => c.countryCode === 'IN').length, name: 'India' },
        { code: 'PK', count: channels.filter(c => c.countryCode === 'PK').length, name: 'Pakistan' },
        { code: 'AE', count: channels.filter(c => c.countryCode === 'AE').length, name: 'Arabic' },
      ].sort((a, b) => b.count - a.count)
    },
    lastUpdated: new Date().toISOString(),
    source: 'FILEX IPTV Premium'
  };
  
  // Write to file
  const outputPath = join(process.cwd(), 'public', 'data', 'channels.json');
  writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Canales guardados en: ${outputPath}`);
  
  return output;
}

fetchAllChannels().catch(console.error);
