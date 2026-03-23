#!/usr/bin/env node
/**
 * Script to add channels from iptv-org category playlists
 * Focuses on sports, movies, series, and kids categories
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const CHANNELS_FILE = path.join(__dirname, '../public/data/channels.json');

// Category M3U URLs from iptv-org
const CATEGORY_URLS = {
  sports: 'https://iptv-org.github.io/iptv/categories/sports.m3u',
  movies: 'https://iptv-org.github.io/iptv/categories/movies.m3u',
  series: 'https://iptv-org.github.io/iptv/categories/series.m3u',
  kids: 'https://iptv-org.github.io/iptv/categories/kids.m3u',
  news: 'https://iptv-org.github.io/iptv/categories/news.m3u',
  entertainment: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u'
};

// Category to section mapping
const CATEGORY_TO_SECTION = {
  'sports': 'deportes',
  'movies': 'peliculas',
  'series': 'series',
  'kids': 'infantil',
  'animation': 'infantil',
  'news': 'general',
  'entertainment': 'general'
};

// Spanish-speaking countries
const SPANISH_SPEAKING_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY', 'GQ'
];

const COUNTRY_NAMES = {
  'US': 'United States', 'GB': 'United Kingdom', 'ES': 'Spain',
  'MX': 'Mexico', 'AR': 'Argentina', 'BR': 'Brazil', 'FR': 'France',
  'DE': 'Germany', 'IT': 'Italy', 'CA': 'Canada', 'AU': 'Australia',
  'IN': 'India', 'JP': 'Japan', 'KR': 'South Korea', 'CN': 'China',
  'RU': 'Russia', 'TR': 'Turkey', 'SA': 'Saudi Arabia', 'AE': 'UAE',
  'EG': 'Egypt', 'NG': 'Nigeria', 'ZA': 'South Africa', 'ID': 'Indonesia',
  'TH': 'Thailand', 'VN': 'Vietnam', 'PH': 'Philippines', 'MY': 'Malaysia',
  'PK': 'Pakistan', 'BD': 'Bangladesh', 'IR': 'Iran', 'IQ': 'Iraq',
  'PL': 'Poland', 'NL': 'Netherlands', 'BE': 'Belgium', 'SE': 'Sweden',
  'NO': 'Norway', 'DK': 'Denmark', 'FI': 'Finland', 'GR': 'Greece',
  'PT': 'Portugal', 'RO': 'Romania', 'CZ': 'Czech Republic', 'HU': 'Hungary',
  'UA': 'Ukraine', 'AT': 'Austria', 'CH': 'Switzerland', 'BG': 'Bulgaria',
  'HR': 'Croatia', 'RS': 'Serbia', 'SK': 'Slovakia', 'SI': 'Slovenia',
  'CO': 'Colombia', 'PE': 'Peru', 'VE': 'Venezuela', 'CL': 'Chile',
  'EC': 'Ecuador', 'BO': 'Bolivia', 'PY': 'Paraguay', 'UY': 'Uruguay',
  'CU': 'Cuba', 'DO': 'Dominican Republic', 'CR': 'Costa Rica', 'PA': 'Panama',
  'GT': 'Guatemala', 'HN': 'Honduras', 'SV': 'El Salvador', 'NI': 'Nicaragua',
  'PR': 'Puerto Rico', 'XX': 'Unknown'
};

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        const loc = res.headers.location;
        const client = loc.startsWith('https') ? https : require('http');
        return client.get(loc, (res2) => {
          let data = '';
          res2.on('data', chunk => data += chunk);
          res2.on('end', () => resolve(data));
        }).on('error', reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseM3U(content, categoryName) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const nameMatch = line.match(/,(.+)$/);

      let name = nameMatch ? nameMatch[1].trim() : 'Unknown';
      // Clean resolution markers
      name = name.replace(/\s*\(\d+p\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : null,
        name: name,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : categoryName,
        url: null,
        category: categoryName
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      if (line.includes('.m3u')) {
        channels.push(currentChannel);
      }
      currentChannel = null;
    }
  }

  return channels;
}

function stringSimilarity(str1, str2) {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '');
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (s1 === s2) return 1;
  if (s1.length === 0 || s2.length === 0) return 0;
  if (s1.includes(s2) || s2.includes(s1)) return 0.85;

  const matrix = [];
  for (let i = 0; i <= s1.length; i++) matrix[i] = [i];
  for (let j = 0; j <= s2.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(matrix[i - 1][j] + 1, matrix[i][j - 1] + 1, matrix[i - 1][j - 1] + cost);
    }
  }
  return 1 - matrix[s1.length][s2.length] / Math.max(s1.length, s2.length);
}

async function addCategoryChannels() {
  console.log('🚀 Starting category channel import from iptv-org...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Load existing channels
    console.log('\n📂 Loading existing channels...');
    const existingData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    const existingChannels = existingData.channels;

    const existingUrls = new Set(existingChannels.map(c => c.url.toLowerCase()));
    const existingNames = existingChannels.map(c => c.name);

    console.log(`✅ Loaded ${existingChannels.length} existing channels`);

    // Fetch and process each category
    const allNewChannels = [];

    for (const [category, url] of Object.entries(CATEGORY_URLS)) {
      console.log(`\n📥 Fetching ${category} category...`);

      try {
        const content = await fetchText(url);
        const channels = parseM3U(content, category);
        console.log(`   Parsed ${channels.length} ${category} channels`);

        let addedCount = 0;

        for (const channel of channels) {
          // Skip if URL exists
          if (existingUrls.has(channel.url.toLowerCase())) continue;

          // Skip if name is too similar
          let isDuplicate = false;
          for (const existingName of existingNames) {
            if (stringSimilarity(channel.name, existingName) > 0.85) {
              isDuplicate = true;
              break;
            }
          }
          if (isDuplicate) continue;

          // Determine section
          const section = CATEGORY_TO_SECTION[category] || 'general';

          // Extract country from groups or default
          let countryCode = 'XX';
          const groups = channel.group.toLowerCase();
          if (groups.includes('spain') || groups.includes('español')) countryCode = 'ES';
          else if (groups.includes('mexico')) countryCode = 'MX';
          else if (groups.includes('argentina')) countryCode = 'AR';
          else if (groups.includes('usa') || groups.includes('united states')) countryCode = 'US';
          else if (groups.includes('uk') || groups.includes('united kingdom')) countryCode = 'GB';

          const isSpanish = SPANISH_SPEAKING_COUNTRIES.includes(countryCode);

          const newChannel = {
            id: channel.id || `iptv_${category}_${allNewChannels.length}`,
            name: channel.name,
            logo: channel.logo,
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
            source: 'iptv-org-category'
          };

          allNewChannels.push(newChannel);
          existingUrls.add(channel.url.toLowerCase());
          existingNames.push(channel.name);
          addedCount++;
        }

        console.log(`   Added ${addedCount} new ${category} channels`);

      } catch (error) {
        console.error(`   Error fetching ${category}: ${error.message}`);
      }
    }

    // Combine all channels
    const allChannels = [...existingChannels, ...allNewChannels];

    // Sort
    allChannels.sort((a, b) => {
      if (a.is_adult !== b.is_adult) return a.is_adult ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    // Update stats
    const stats = {
      total: allChannels.length,
      spanish: allChannels.filter(c => c.is_spanish).length,
      adult: allChannels.filter(c => c.is_adult).length,
      bySection: {}
    };

    for (const channel of allChannels) {
      stats.bySection[channel.section] = (stats.bySection[channel.section] || 0) + 1;
    }

    // Build output
    const output = {
      channels: allChannels,
      sections: existingData.sections.map(s => ({
        ...s,
        count: stats.bySection[s.id] || 0
      })),
      stats: existingData.stats,
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };

    // Update stats
    output.stats.total = stats.total;
    output.stats.spanish = stats.spanish;
    output.stats.adult = stats.adult;
    output.stats.bySection = stats.bySection;

    // Save
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(output, null, 2));

    // Summary
    console.log('\n✅ Category channel import complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total channels: ${stats.total}`);
    console.log(`➕ New channels added: ${allNewChannels.length}`);
    console.log(`🇪🇸 Spanish channels: ${stats.spanish}`);
    console.log('\n📋 By section:');
    for (const [section, count] of Object.entries(stats.bySection)) {
      const icon = section === 'deportes' ? '⚽' :
                   section === 'peliculas' ? '🎬' :
                   section === 'series' ? '📺' :
                   section === 'infantil' ? '👶' :
                   section === 'español' ? '🇪🇸' : '📡';
      console.log(`   ${icon} ${section}: ${count}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return output;

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  addCategoryChannels();
}

module.exports = { addCategoryChannels };
