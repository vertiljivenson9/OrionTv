#!/usr/bin/env node
/**
 * Script para agregar canales POPULARES que la gente quiere ver
 * - Películas 24/7 (Pluto TV, etc)
 * - Deportes en vivo
 * - Series
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CHANNELS_FILE = path.join(__dirname, '../public/data/channels.json');

// Categorías populares de iptv-org
const POPULAR_CATEGORIES = [
  { name: 'movies', url: 'https://iptv-org.github.io/iptv/categories/movies.m3u', section: 'peliculas' },
  { name: 'sports', url: 'https://iptv-org.github.io/iptv/categories/sports.m3u', section: 'deportes' },
  { name: 'series', url: 'https://iptv-org.github.io/iptv/categories/series.m3u', section: 'series' },
  { name: 'kids', url: 'https://iptv-org.github.io/iptv/categories/kids.m3u', section: 'infantil' },
  { name: 'news', url: 'https://iptv-org.github.io/iptv/categories/news.m3u', section: 'general' },
  { name: 'entertainment', url: 'https://iptv-org.github.io/iptv/categories/entertainment.m3u', section: 'general' }
];

// Países de habla inglesa y española
const ALLOWED_COUNTRIES = [
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY',
  'US', 'GB', 'CA', 'AU', 'NZ', 'IE'
];

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

function parseM3U(content, section) {
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
      name = name.replace(/\s*\(\d+p\)/g, '').replace(/\s*\[.*?\]/g, '').trim();

      currentChannel = {
        id: tvgIdMatch ? tvgIdMatch[1] : null,
        name: name,
        logo: tvgLogoMatch ? tvgLogoMatch[1] : null,
        group: groupMatch ? groupMatch[1] : 'General',
        url: null,
        section: section
      };
    } else if (line && !line.startsWith('#') && currentChannel) {
      currentChannel.url = line;
      
      // Solo agregar si es un stream válido
      if (line.includes('.m3u') && !line.includes('youtube.com') && !line.includes('twitch.tv')) {
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

async function addPopularChannels() {
  console.log('🚀 Agregando canales POPULARES...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Cargar canales existentes
    console.log('\n📂 Cargando canales existentes...');
    const existingData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    const existingChannels = existingData.channels;

    const existingUrls = new Set(existingChannels.map(c => c.url.toLowerCase()));
    const existingNames = existingChannels.map(c => c.name);

    console.log(`✅ Cargados ${existingChannels.length} canales existentes`);

    // Obtener canales de todas las categorías
    const allNewChannels = [];

    for (const category of POPULAR_CATEGORIES) {
      console.log(`\n📥 Obteniendo ${category.name}...`);
      
      try {
        const content = await fetchText(category.url);
        const channels = parseM3U(content, category.section);
        console.log(`   Encontrados ${channels.length} canales`);

        let added = 0;
        for (const channel of channels) {
          // Verificar duplicados por URL
          if (existingUrls.has(channel.url.toLowerCase())) continue;

          // Verificar duplicados por nombre
          let isDuplicate = false;
          for (const existingName of existingNames) {
            if (stringSimilarity(channel.name, existingName) > 0.85) {
              isDuplicate = true;
              break;
            }
          }
          if (isDuplicate) continue;

          const newChannel = {
            id: channel.id || `popular_${allNewChannels.length}`,
            name: channel.name,
            logo: channel.logo,
            url: channel.url,
            country: 'International',
            countryCode: 'XX',
            language_primary: 'English',
            is_spanish: false,
            is_adult: false,
            section: channel.section,
            categories: [channel.group],
            altNames: [],
            network: null,
            owners: [],
            source: 'iptv-popular'
          };

          allNewChannels.push(newChannel);
          existingUrls.add(channel.url.toLowerCase());
          existingNames.push(channel.name);
          added++;
        }
        console.log(`   Agregados ${added} nuevos`);
      } catch (error) {
        console.error(`   Error: ${error.message}`);
      }
    }

    // Combinar todos los canales
    const allChannels = [...existingChannels, ...allNewChannels];

    // Ordenar
    allChannels.sort((a, b) => {
      if (a.is_adult !== b.is_adult) return a.is_adult ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    // Actualizar estadísticas
    const stats = {
      total: allChannels.length,
      spanish: allChannels.filter(c => c.is_spanish).length,
      adult: allChannels.filter(c => c.is_adult).length,
      bySection: {}
    };

    for (const channel of allChannels) {
      stats.bySection[channel.section] = (stats.bySection[channel.section] || 0) + 1;
    }

    // Construir salida
    const output = {
      channels: allChannels,
      sections: existingData.sections.map(s => ({
        ...s,
        count: stats.bySection[s.id] || 0
      })),
      stats: stats,
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };

    // Guardar
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(output, null, 2));

    // Resumen
    console.log('\n✅ Canales populares agregados!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total canales: ${stats.total}`);
    console.log(`➕ Nuevos agregados: ${allNewChannels.length}`);
    console.log(`🇪🇸 Español: ${stats.spanish}`);
    console.log('\n📋 Por sección:');
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
  addPopularChannels();
}

module.exports = { addPopularChannels };
