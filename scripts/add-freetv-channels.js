#!/usr/bin/env node
/**
 * Script to add unique channels from Free-TV/IPTV source
 * Avoids duplicates by comparing URLs and names
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

// Configuration
const FREETV_M3U_URL = 'https://raw.githubusercontent.com/Free-TV/IPTV/master/playlist.m3u8';
const CHANNELS_FILE = path.join(__dirname, '../public/data/channels.json');

// Spanish-speaking countries (ISO codes)
const SPANISH_SPEAKING_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY', 'GQ'
];

// Country code mapping from group-title
const COUNTRY_GROUPS = {
  'Albania': 'AL', 'Andorra': 'AD', 'Argentina': 'AR', 'Armenia': 'AM',
  'Australia': 'AU', 'Austria': 'AT', 'Azerbaijan': 'AZ', 'Belarus': 'BY',
  'Belgium': 'BE', 'Bosnia': 'BA', 'Brazil': 'BR', 'Bulgaria': 'BG',
  'Canada': 'CA', 'Chile': 'CL', 'China': 'CN', 'Colombia': 'CO',
  'Costa Rica': 'CR', 'Croatia': 'HR', 'Cyprus': 'CY', 'Czech': 'CZ',
  'Denmark': 'DK', 'Dominican Republic': 'DO', 'Ecuador': 'EC',
  'Egypt': 'EG', 'Estonia': 'EE', 'Finland': 'FI', 'France': 'FR',
  'Georgia': 'GE', 'Germany': 'DE', 'Greece': 'GR', 'Hong Kong': 'HK',
  'Hungary': 'HU', 'India': 'IN', 'Indonesia': 'ID', 'Ireland': 'IE',
  'Israel': 'IL', 'Italy': 'IT', 'Jamaica': 'JM', 'Japan': 'JP',
  'Kazakhstan': 'KZ', 'Kenya': 'KE', 'Korea': 'KR', 'Latvia': 'LV',
  'Lithuania': 'LT', 'Malta': 'MT', 'Mexico': 'MX', 'Moldova': 'MD',
  'Netherlands': 'NL', 'New Zealand': 'NZ', 'Nigeria': 'NG',
  'North Macedonia': 'MK', 'Norway': 'NO', 'Pakistan': 'PK',
  'Panama': 'PA', 'Paraguay': 'PY', 'Peru': 'PE', 'Philippines': 'PH',
  'Poland': 'PL', 'Portugal': 'PT', 'Romania': 'RO', 'Russia': 'RU',
  'Saudi Arabia': 'SA', 'Serbia': 'RS', 'Singapore': 'SG', 'Slovakia': 'SK',
  'Slovenia': 'SI', 'South Africa': 'ZA', 'Spain': 'ES', 'Sweden': 'SE',
  'Switzerland': 'CH', 'Taiwan': 'TW', 'Thailand': 'TH', 'Turkey': 'TR',
  'Ukraine': 'UA', 'United Arab Emirates': 'AE', 'United Kingdom': 'GB',
  'United States': 'US', 'Uruguay': 'UY', 'Venezuela': 'VE', 'Vietnam': 'VN'
};

// Category keywords for section classification
const CATEGORY_KEYWORDS = {
  deportes: ['sport', 'deport', 'football', 'soccer', 'basketball', 'baseball', 'tennis', 'golf', 'hockey', 'fight', 'boxing', 'espn', 'fox sports', 'bein', ' ESPN'],
  peliculas: ['movie', 'film', 'cine', 'cinema', 'hbo', 'cinemax', 'tcm', 'filmbox'],
  series: ['series', 'serie', 'novela', 'drama', 'comedy central', 'fx', 'tnt', 'axn', 'sony'],
  infantil: ['kids', 'child', 'infantil', 'children', 'disney', 'nickelodeon', 'cartoon', 'nick', 'baby', 'boomerang'],
  news: ['news', 'noticias', 'cnn', 'bbc news', 'sky news', 'al jazeera'],
  entertainment: ['entertainment', 'entretenimiento', 'variety', 'lifestyle']
};

// Country name mapping
const COUNTRY_NAMES = {
  'AL': 'Albania', 'AD': 'Andorra', 'AR': 'Argentina', 'AM': 'Armenia',
  'AU': 'Australia', 'AT': 'Austria', 'AZ': 'Azerbaijan', 'BY': 'Belarus',
  'BE': 'Belgium', 'BA': 'Bosnia and Herzegovina', 'BR': 'Brazil', 'BG': 'Bulgaria',
  'CA': 'Canada', 'CL': 'Chile', 'CN': 'China', 'CO': 'Colombia',
  'CR': 'Costa Rica', 'HR': 'Croatia', 'CY': 'Cyprus', 'CZ': 'Czech Republic',
  'DK': 'Denmark', 'DO': 'Dominican Republic', 'EC': 'Ecuador',
  'EG': 'Egypt', 'EE': 'Estonia', 'FI': 'Finland', 'FR': 'France',
  'GE': 'Georgia', 'DE': 'Germany', 'GR': 'Greece', 'HK': 'Hong Kong',
  'HU': 'Hungary', 'IN': 'India', 'ID': 'Indonesia', 'IE': 'Ireland',
  'IL': 'Israel', 'IT': 'Italy', 'JM': 'Jamaica', 'JP': 'Japan',
  'KZ': 'Kazakhstan', 'KE': 'Kenya', 'KR': 'South Korea', 'LV': 'Latvia',
  'LT': 'Lithuania', 'MT': 'Malta', 'MX': 'Mexico', 'MD': 'Moldova',
  'NL': 'Netherlands', 'NZ': 'New Zealand', 'NG': 'Nigeria',
  'MK': 'North Macedonia', 'NO': 'Norway', 'PK': 'Pakistan',
  'PA': 'Panama', 'PY': 'Paraguay', 'PE': 'Peru', 'PH': 'Philippines',
  'PL': 'Poland', 'PT': 'Portugal', 'RO': 'Romania', 'RU': 'Russia',
  'SA': 'Saudi Arabia', 'RS': 'Serbia', 'SG': 'Singapore', 'SK': 'Slovakia',
  'SI': 'Slovenia', 'ZA': 'South Africa', 'ES': 'Spain', 'SE': 'Sweden',
  'CH': 'Switzerland', 'TW': 'Taiwan', 'TH': 'Thailand', 'TR': 'Turkey',
  'UA': 'Ukraine', 'AE': 'United Arab Emirates', 'GB': 'United Kingdom',
  'US': 'United States', 'UY': 'Uruguay', 'VE': 'Venezuela', 'VN': 'Vietnam',
  'XX': 'Unknown'
};

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

// Parse M3U playlist
function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      // Parse channel info
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgCountryMatch = line.match(/tvg-country="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const nameMatch = line.match(/,(.+)$/);

      // Get name from tvg-name or the suffix after comma
      let name = tvgNameMatch ? tvgNameMatch[1] : (nameMatch ? nameMatch[1].trim() : 'Unknown');

      // Clean special markers from name (Ⓢ, Ⓨ, Ⓖ)
      name = name.replace(/[ⓈⓎⒼ]/g, '').trim();

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : null,
        name: name,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        countryCode: tvgCountryMatch ? tvgCountryMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'General',
        url: null
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      // This is the URL line
      currentChannel.url = line;

      // Skip non-stream URLs (YouTube, Twitch, etc.)
      if (!line.includes('youtube.com') &&
          !line.includes('youtu.be') &&
          !line.includes('twitch.tv') &&
          !line.includes('facebook.com') &&
          line.includes('.m3u')) {
        channels.push(currentChannel);
      }
      currentChannel = null;
    }
  }

  return channels;
}

// Determine section for a channel
function determineSection(name, group) {
  const nameLower = name.toLowerCase();
  const groupLower = group.toLowerCase();

  // Check for sports
  for (const keyword of CATEGORY_KEYWORDS.deportes) {
    if (nameLower.includes(keyword) || groupLower.includes(keyword)) {
      return 'deportes';
    }
  }

  // Check for movies
  for (const keyword of CATEGORY_KEYWORDS.peliculas) {
    if (nameLower.includes(keyword) || groupLower.includes(keyword)) {
      return 'peliculas';
    }
  }

  // Check for series
  for (const keyword of CATEGORY_KEYWORDS.series) {
    if (nameLower.includes(keyword) || groupLower.includes(keyword)) {
      return 'series';
    }
  }

  // Check for kids
  for (const keyword of CATEGORY_KEYWORDS.infantil) {
    if (nameLower.includes(keyword) || groupLower.includes(keyword)) {
      return 'infantil';
    }
  }

  return 'general';
}

// Get country code from group title
function getCountryCode(group) {
  // Direct match with country groups
  for (const [countryName, code] of Object.entries(COUNTRY_GROUPS)) {
    if (group.includes(countryName)) {
      return code;
    }
  }

  // Check for United Kingdom/UK
  if (group.includes('United Kingdom') || group.includes('UK')) {
    return 'GB';
  }

  // Check for USA
  if (group.includes('United States') || group.includes('USA')) {
    return 'US';
  }

  return 'XX';
}

// Calculate similarity between two strings (0-1)
function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');

  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;

  // Check if one contains the other
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Simple Levenshtein-based similarity
  const matrix = [];
  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1,
        matrix[i][j - 1] + 1,
        matrix[i - 1][j - 1] + cost
      );
    }
  }

  const distance = matrix[s1.length][s2.length];
  const maxLength = Math.max(s1.length, s2.length);
  return 1 - distance / maxLength;
}

// Main function
async function addFreeTVChannels() {
  console.log('🚀 Starting Free-TV channel import...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Load existing channels
    console.log('\n📂 Loading existing channels...');
    const existingData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    const existingChannels = existingData.channels;

    // Create sets for deduplication
    const existingUrls = new Set(existingChannels.map(c => c.url.toLowerCase()));
    const existingNames = existingChannels.map(c => c.name);

    console.log(`✅ Loaded ${existingChannels.length} existing channels`);

    // Fetch Free-TV playlist
    console.log('\n📥 Fetching Free-TV playlist...');
    const m3uContent = await fetchText(FREETV_M3U_URL);
    const freeTVChannels = parseM3U(m3uContent);
    console.log(`✅ Parsed ${freeTVChannels.length} channels from Free-TV`);

    // Filter and deduplicate
    console.log('\n🔍 Deduplicating channels...');
    const newChannels = [];
    let skippedByUrl = 0;
    let skippedByName = 0;

    for (const channel of freeTVChannels) {
      // Check URL duplication
      if (existingUrls.has(channel.url.toLowerCase())) {
        skippedByUrl++;
        continue;
      }

      // Check name similarity (threshold 0.85)
      let isDuplicate = false;
      for (const existingName of existingNames) {
        if (stringSimilarity(channel.name, existingName) > 0.85) {
          isDuplicate = true;
          break;
        }
      }

      if (isDuplicate) {
        skippedByName++;
        continue;
      }

      // Determine country
      let countryCode = channel.countryCode || getCountryCode(channel.group);
      if (!countryCode || countryCode === 'XX') {
        countryCode = 'XX';
      }

      // Check if Spanish-speaking
      const isSpanish = SPANISH_SPEAKING_COUNTRIES.includes(countryCode);

      // Determine section
      const section = determineSection(channel.name, channel.group);

      // Generate unique ID
      const id = channel.id || `freetv_${Buffer.from(channel.name).toString('base64').slice(0, 12)}`;

      // Build channel object
      const newChannel = {
        id: id,
        name: channel.name,
        logo: channel.logo || null,
        url: channel.url,
        country: COUNTRY_NAMES[countryCode] || 'Unknown',
        countryCode: countryCode,
        language_primary: isSpanish ? 'Español' : null,
        is_spanish: isSpanish,
        is_adult: false,
        section: section,
        categories: [channel.group],
        altNames: [],
        network: null,
        owners: [],
        source: 'freetv'
      };

      newChannels.push(newChannel);
      existingUrls.add(channel.url.toLowerCase());
      existingNames.push(channel.name);
    }

    console.log(`   Skipped by URL: ${skippedByUrl}`);
    console.log(`   Skipped by name similarity: ${skippedByName}`);
    console.log(`   New unique channels: ${newChannels.length}`);

    // Combine channels
    const allChannels = [...existingChannels, ...newChannels];

    // Sort channels (non-adult first, then by name)
    allChannels.sort((a, b) => {
      if (a.is_adult !== b.is_adult) return a.is_adult ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    // Update stats
    const stats = {
      total: allChannels.length,
      withStreams: allChannels.length,
      spanish: allChannels.filter(c => c.is_spanish).length,
      adult: allChannels.filter(c => c.is_adult).length,
      bySection: {},
      topCountries: {}
    };

    // Count by section
    for (const channel of allChannels) {
      stats.bySection[channel.section] = (stats.bySection[channel.section] || 0) + 1;
      stats.topCountries[channel.countryCode] = (stats.topCountries[channel.countryCode] || 0) + 1;
    }

    // Build output
    const output = {
      channels: allChannels,
      sections: existingData.sections.map(s => ({
        ...s,
        count: stats.bySection[s.id] || 0
      })),
      stats: {
        ...stats,
        topCountries: Object.entries(stats.topCountries)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([code, count]) => ({ code, count, name: COUNTRY_NAMES[code] || code }))
      },
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };

    // Save updated channels
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(output, null, 2));

    // Print summary
    console.log('\n✅ Channel import complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total channels: ${stats.total}`);
    console.log(`➕ New channels added: ${newChannels.length}`);
    console.log(`🇪🇸 Spanish channels: ${stats.spanish}`);
    console.log(`🔞 Adult channels: ${stats.adult}`);
    console.log('\n📋 Channels by section:');
    for (const section of Object.keys(stats.bySection)) {
      const count = stats.bySection[section];
      const icon = section === 'deportes' ? '⚽' :
                   section === 'peliculas' ? '🎬' :
                   section === 'series' ? '📺' :
                   section === 'infantil' ? '👶' :
                   section === 'español' ? '🇪🇸' : '📡';
      console.log(`   ${icon} ${section}: ${count}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`\n💾 Updated: ${CHANNELS_FILE}`);

    return output;

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  addFreeTVChannels();
}

module.exports = { addFreeTVChannels, parseM3U, stringSimilarity };
