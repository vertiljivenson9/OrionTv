#!/usr/bin/env node
/**
 * Script to add channels from TDTChannels (legal Spanish TV)
 * https://www.tdtchannels.com
 */

const fs = require('fs');
const path = require('path');
const https = require('https');

const TDTCHANNELS_URL = 'https://www.tdtchannels.com/lists/tv.m3u8';
const CHANNELS_FILE = path.join(__dirname, '../public/data/channels.json');

// Category to section mapping
const CATEGORY_TO_SECTION = {
  'Deportivos': 'deportes',
  'Deportivos Int.': 'deportes',
  'Infantiles': 'infantil',
  'Generalistas': 'español',
  'Informativos': 'general',
  'Musicales': 'general',
  'Eventuales': 'general',
  'Religiosos': 'general'
};

// Provincial categories go to español
const PROVINCIAL_CATEGORIES = [
  'Andalucía', 'Cataluña', 'C. Valenciana', 'País Vasco', 'Galicia',
  'Canarias', 'Castilla-La Mancha', 'C. de Madrid', 'Castilla y León',
  'R. de Murcia', 'La Rioja', 'Cantabria', 'C. Foral de Navarra',
  'Illes Balears', 'Aragón', 'P. de Asturias', 'Melilla', 'Extremadura'
];

function fetchText(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

function parseM3U(content) {
  const lines = content.split('\n');
  const channels = [];
  let currentChannel = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (line.startsWith('#EXTINF:')) {
      const tvgIdMatch = line.match(/tvg-id="([^"]*)"/i);
      const tvgLogoMatch = line.match(/tvg-logo="([^"]*)"/i);
      const groupMatch = line.match(/group-title="([^"]*)"/i);
      const tvgNameMatch = line.match(/tvg-name="([^"]*)"/i);
      const nameMatch = line.match(/,(.+)$/);

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : null,
        name: tvgNameMatch ? tvgNameMatch[1] : (nameMatch ? nameMatch[1].trim() : 'Unknown'),
        logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'General',
        url: null
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

function determineSection(group) {
  if (CATEGORY_TO_SECTION[group]) {
    return CATEGORY_TO_SECTION[group];
  }
  if (PROVINCIAL_CATEGORIES.includes(group)) {
    return 'español';
  }
  if (group.startsWith('Int.')) {
    return 'general';
  }
  return 'general';
}

async function addTDTChannels() {
  console.log('🚀 Starting TDTChannels import...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Load existing channels
    console.log('\n📂 Loading existing channels...');
    const existingData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    const existingChannels = existingData.channels;

    const existingUrls = new Set(existingChannels.map(c => c.url.toLowerCase()));
    const existingNames = existingChannels.map(c => c.name);

    console.log(`✅ Loaded ${existingChannels.length} existing channels`);

    // Fetch TDTChannels
    console.log('\n📥 Fetching TDTChannels...');
    const m3uContent = await fetchText(TDTCHANNELS_URL);
    const tdtChannels = parseM3U(m3uContent);
    console.log(`✅ Parsed ${tdtChannels.length} channels from TDTChannels`);

    // Filter and deduplicate
    console.log('\n🔍 Deduplicating channels...');
    const newChannels = [];
    let skippedByUrl = 0;
    let skippedByName = 0;

    for (const channel of tdtChannels) {
      if (existingUrls.has(channel.url.toLowerCase())) {
        skippedByUrl++;
        continue;
      }

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

      const section = determineSection(channel.group);
      const id = channel.id || `tdt_${Buffer.from(channel.name).toString('base64').slice(0, 12)}`;

      const newChannel = {
        id: id,
        name: channel.name,
        logo: channel.logo,
        url: channel.url,
        country: 'Spain',
        countryCode: 'ES',
        language_primary: 'Español',
        is_spanish: true,
        is_adult: false,
        section: section,
        categories: [channel.group],
        altNames: [],
        network: null,
        owners: [],
        source: 'tdtchannels'
      };

      newChannels.push(newChannel);
      existingUrls.add(channel.url.toLowerCase());
      existingNames.push(channel.name);
    }

    console.log(`   Skipped by URL: ${skippedByUrl}`);
    console.log(`   Skipped by name similarity: ${skippedByName}`);
    console.log(`   New unique channels: ${newChannels.length}`);

    // Combine
    const allChannels = [...existingChannels, ...newChannels];

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
      stats: {
        ...existingData.stats,
        total: stats.total,
        spanish: stats.spanish,
        adult: stats.adult,
        bySection: stats.bySection
      },
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };

    // Save
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(output, null, 2));

    // Summary
    console.log('\n✅ TDTChannels import complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total channels: ${stats.total}`);
    console.log(`➕ New channels added: ${newChannels.length}`);
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
  addTDTChannels();
}

module.exports = { addTDTChannels };
