#!/usr/bin/env node
/**
 * OrionTV Channel Update Script
 * Updates channel data with enriched metadata
 * Runs daily via GitHub Actions
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const CHANNELS_JSON_URL = 'https://iptv-org.github.io/api/channels.json';
const STREAMS_JSON_URL = 'https://iptv-org.github.io/api/streams.json';
const COUNTRIES_JSON_URL = 'https://iptv-org.github.io/api/countries.json';
const CATEGORIES_JSON_URL = 'https://iptv-org.github.io/api/categories.json';
const ADULT_M3U_URL = 'https://raw.githubusercontent.com/hujingguang/ChinaIPTV/main/xxx.m3u8';
const OUTPUT_FILE = path.join(__dirname, '../public/data/channels.json');

// Spanish-speaking countries (ISO 3166-1 alpha-2 codes)
const SPANISH_SPEAKING_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY', 'GQ'
];

// Section priority mapping
const SECTION_PRIORITY = [
  { name: 'deportes', check: (cats) => cats.includes('sports') },
  { name: 'peliculas', check: (cats) => cats.includes('movies') },
  { name: 'series', check: (cats) => cats.includes('series') },
  { name: 'infantil', check: (cats) => cats.includes('kids') || cats.includes('animation') },
  { name: 'español', check: (cats, isSpanish) => isSpanish },
  { name: 'general', check: () => true }
];

// Category translations to Spanish
const CATEGORY_TRANSLATIONS = {
  'sports': 'Deportes',
  'movies': 'Películas',
  'series': 'Series',
  'kids': 'Infantil',
  'animation': 'Animación',
  'news': 'Noticias',
  'entertainment': 'Entretenimiento',
  'music': 'Música',
  'documentary': 'Documentales',
  'general': 'General',
  'religious': 'Religioso',
  'shop': 'Compras',
  'weather': 'Clima',
  'auto': 'Automovilismo',
  'business': 'Negocios',
  'classic': 'Clásico',
  'comedy': 'Comedia',
  'cooking': 'Cocina',
  'culture': 'Cultura',
  'education': 'Educación',
  'family': 'Familia',
  'health': 'Salud',
  'history': 'Historia',
  'hobby': 'Pasatiempos',
  'legislative': 'Legislativo',
  'lifestyle': 'Estilo de Vida',
  'local': 'Local',
  'outdoor': 'Aire Libre',
  'science': 'Ciencia',
  'travel': 'Viajes',
  'xxx': 'Adultos'
};

// Section display names (Spanish)
const SECTION_NAMES = {
  'deportes': 'Deportes',
  'peliculas': 'Películas',
  'series': 'Series',
  'infantil': 'Infantil',
  'español': 'Español',
  'general': 'General'
};

// Fetch JSON from URL
function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchJSON(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(new Error(`Failed to parse JSON from ${url}: ${e.message}`));
        }
      });
    }).on('error', reject);
  });
}

// Fetch text content from URL
function fetchText(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    
    client.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return fetchText(res.headers.location).then(resolve).catch(reject);
      }
      
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

// Parse M3U playlist for adult channels
function parseAdultM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('#EXTINF:')) {
      // Parse channel info
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const nameMatch = line.match(/,(.+)$/);
      
      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : `adult_${channels.length}`,
        name: nameMatch ? nameMatch[1].trim() : 'Adult Channel',
        logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'XXX',
        url: null
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the URL line
      currentChannel.url = line;
      channels.push(currentChannel);
      currentChannel = null;
    }
  }
  
  return channels;
}

// Determine section for a channel
function determineSection(categories, isSpanish) {
  const cats = categories.map(c => c.toLowerCase());
  
  for (const section of SECTION_PRIORITY) {
    if (section.check(cats, isSpanish)) {
      return section.name;
    }
  }
  
  return 'general';
}

// Main processing function
async function updateChannels() {
  console.log('🚀 Starting channel update process...');
  console.log('📅 Timestamp:', new Date().toISOString());
  
  try {
    // Fetch all data sources
    console.log('\n📥 Fetching data sources...');
    
    const [channelsData, streamsData, countriesData, categoriesData, adultM3U] = await Promise.all([
      fetchJSON(CHANNELS_JSON_URL).catch(e => { console.error('Error fetching channels:', e.message); return []; }),
      fetchJSON(STREAMS_JSON_URL).catch(e => { console.error('Error fetching streams:', e.message); return []; }),
      fetchJSON(COUNTRIES_JSON_URL).catch(e => { console.error('Error fetching countries:', e.message); return []; }),
      fetchJSON(CATEGORIES_JSON_URL).catch(e => { console.error('Error fetching categories:', e.message); return []; }),
      fetchText(ADULT_M3U_URL).catch(e => { console.error('Error fetching adult M3U:', e.message); return ''; })
    ]);
    
    console.log(`✅ Fetched ${channelsData.length} channels`);
    console.log(`✅ Fetched ${streamsData.length} streams`);
    console.log(`✅ Fetched ${countriesData.length} countries`);
    console.log(`✅ Fetched ${categoriesData.length} categories`);
    
    // Parse adult M3U
    const adultChannels = parseAdultM3U(adultM3U);
    console.log(`✅ Parsed ${adultChannels.length} adult channels from M3U`);
    
    // Create lookup maps
    const countryMap = new Map(countriesData.map(c => [c.code, c]));
    const categoryMap = new Map(categoriesData.map(c => [c.id, c]));
    
    // Create stream lookup by channel ID (from API)
    const streamMap = new Map();
    for (const stream of streamsData) {
      if (stream.channel) {
        if (!streamMap.has(stream.channel)) {
          streamMap.set(stream.channel, []);
        }
        streamMap.get(stream.channel).push(stream.url);
      }
    }
    
    console.log(`📊 Created stream map with ${streamMap.size} channel entries`);
    
    // Process channels
    console.log('\n⚙️ Processing channels...');
    
    const processedChannels = [];
    const stats = {
      total: 0,
      withStreams: 0,
      bySection: {},
      spanish: 0,
      adult: 0,
      byCountry: {}
    };
    
    // Process regular channels from iptv-org
    for (const channel of channelsData) {
      stats.total++;
      
      // Skip adult channels from iptv-org (we use our own source)
      const categoryIds = channel.categories || [];
      const isNsfw = channel.is_nsfw === true || categoryIds.includes('xxx');
      if (isNsfw) continue;
      
      // Get streams for this channel
      const streams = streamMap.get(channel.id) || [];
      if (streams.length === 0) continue;
      
      stats.withStreams++;
      
      // Get primary stream URL
      const url = streams[0];
      
      // Get country info
      const country = countryMap.get(channel.country);
      const countryName = country?.name || 'Unknown';
      const countryCode = channel.country || 'XX';
      
      // Track country stats
      stats.byCountry[countryCode] = (stats.byCountry[countryCode] || 0) + 1;
      
      // Determine if Spanish-speaking based on country
      const isSpanish = SPANISH_SPEAKING_COUNTRIES.includes(countryCode);
      if (isSpanish) stats.spanish++;
      
      // Process categories
      const categoryNames = categoryIds
        .map(id => CATEGORY_TRANSLATIONS[id.toLowerCase()] || categoryMap.get(id)?.name || id)
        .filter(Boolean);
      
      // Determine section
      const section = determineSection(categoryIds, isSpanish);
      stats.bySection[section] = (stats.bySection[section] || 0) + 1;
      
      // Build processed channel object
      const processedChannel = {
        id: channel.id,
        name: channel.name.trim(),
        logo: channel.logo || null,
        url: url,
        country: countryName,
        countryCode: countryCode,
        language_primary: isSpanish ? 'Español' : null,
        is_spanish: isSpanish,
        is_adult: false,
        section: section,
        categories: categoryNames.length > 0 ? categoryNames : ['General'],
        altNames: channel.alt_names || [],
        network: channel.network || null,
        owners: channel.owners || []
      };
      
      processedChannels.push(processedChannel);
    }
    
    // Process adult channels from M3U
    for (const adultChannel of adultChannels) {
      if (!adultChannel.url) continue;
      
      stats.total++;
      stats.withStreams++;
      stats.adult++;
      
      // Build adult channel object
      const processedChannel = {
        id: adultChannel.id || `adult_${stats.adult}`,
        name: adultChannel.name,
        logo: adultChannel.logo || 'https://i.imgur.com/cqKFF8A.png',
        url: adultChannel.url,
        country: 'United States',
        countryCode: 'US',
        language_primary: null,
        is_spanish: false,
        is_adult: true,
        section: 'general',
        categories: ['Adultos'],
        altNames: [],
        network: 'AdultIPTV.net',
        owners: []
      };
      
      processedChannels.push(processedChannel);
    }
    
    // Sort channels: non-adult first, then by name
    processedChannels.sort((a, b) => {
      if (a.is_adult !== b.is_adult) return a.is_adult ? 1 : -1;
      return a.name.localeCompare(b.name);
    });
    
    // Build output object
    const output = {
      channels: processedChannels,
      sections: Object.keys(SECTION_NAMES).map(key => ({
        id: key,
        name: SECTION_NAMES[key],
        count: stats.bySection[key] || 0
      })),
      stats: {
        total: stats.total,
        withStreams: stats.withStreams,
        spanish: stats.spanish,
        adult: stats.adult,
        bySection: stats.bySection,
        topCountries: Object.entries(stats.byCountry)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([code, count]) => ({ code, count, name: countryMap.get(code)?.name || code }))
      },
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };
    
    // Ensure output directory exists
    const outputDir = path.dirname(OUTPUT_FILE);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // Write output file
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));
    
    // Print summary
    console.log('\n✅ Channel update complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total channels processed: ${stats.total}`);
    console.log(`📺 Channels with streams: ${stats.withStreams}`);
    console.log(`🇪🇸 Spanish channels: ${stats.spanish}`);
    console.log(`🔞 Adult channels: ${stats.adult}`);
    console.log('\n📋 Channels by section:');
    for (const section of Object.keys(SECTION_NAMES)) {
      const count = stats.bySection[section] || 0;
      const icon = section === 'deportes' ? '⚽' :
                   section === 'peliculas' ? '🎬' :
                   section === 'series' ? '📺' :
                   section === 'infantil' ? '👶' :
                   section === 'español' ? '🇪🇸' : '📡';
      console.log(`   ${icon} ${SECTION_NAMES[section]}: ${count}`);
    }
    console.log('\n🌍 Top countries:');
    for (const { code, count, name } of output.stats.topCountries.slice(0, 5)) {
      console.log(`   ${code}: ${count} (${name})`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n💾 Output saved to: ${OUTPUT_FILE}`);
    
    return output;
    
  } catch (error) {
    console.error('❌ Error updating channels:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  updateChannels();
}

module.exports = { updateChannels, fetchJSON, fetchText, parseAdultM3U };
