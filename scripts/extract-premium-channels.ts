import fs from 'fs';

interface Channel {
  id: string;
  name: string;
  url: string;
  logo: string;
  group: string;
  language: string;
  country: string;
}

// Parse the scraped M3U data
function parseM3UContent(content: string, source: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');
  let currentChannel: Partial<Channel> = {};
  let idCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Look for channel name and URL pattern (simple format: Name,URL)
    if (trimmed.includes(',') && !trimmed.startsWith('#')) {
      const parts = trimmed.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const url = parts.slice(1).join(',').trim();
        
        if (url.startsWith('http') && name.length > 0) {
          const channel: Channel = {
            id: `${source}-${idCounter++}`,
            name: name,
            url: url,
            logo: '',
            group: categorizeChannel(name),
            language: detectLanguage(name),
            country: detectCountry(name)
          };
          channels.push(channel);
        }
      }
    }
    
    // Look for #EXTINF format
    if (trimmed.startsWith('#EXTINF:')) {
      const nameMatch = trimmed.match(/,(.+)$/);
      const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      
      currentChannel = {
        name: nameMatch ? nameMatch[1].trim() : '',
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Sports'
      };
    } else if (trimmed.startsWith('http') && currentChannel.name) {
      currentChannel.url = trimmed;
      currentChannel.id = `${source}-${idCounter++}`;
      currentChannel.language = detectLanguage(currentChannel.name);
      currentChannel.country = detectCountry(currentChannel.name);
      channels.push(currentChannel as Channel);
      currentChannel = {};
    }
  }

  return channels;
}

function categorizeChannel(name: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('espn') || nameLower.includes('fox sport') || 
      nameLower.includes('bein') || nameLower.includes('b31n') ||
      nameLower.includes('eurospor') || nameLower.includes('tnt sport') ||
      nameLower.includes('sky sport') || nameLower.includes('dubai sport') ||
      nameLower.includes('abu dhabi sport') || nameLower.includes('cctv5') ||
      nameLower.includes('match') || nameLower.includes('sport')) {
    return 'Sports';
  }
  if (nameLower.includes('hbo') || nameLower.includes('cinemax') ||
      nameLower.includes('showtime') || nameLower.includes('fx') ||
      nameLower.includes('amc') || nameLower.includes('tnt')) {
    return 'Movies';
  }
  if (nameLower.includes('news') || nameLower.includes('cnn') ||
      nameLower.includes('bbc') || nameLower.includes('fox news')) {
    return 'News';
  }
  return 'Entertainment';
}

function detectLanguage(name: string): string {
  const nameLower = name.toLowerCase();
  
  // Chinese characters
  if (/[\u4e00-\u9fff]/.test(name)) return 'Chinese';
  // Arabic
  if (/[\u0600-\u06ff]/.test(name)) return 'Arabic';
  // Russian
  if (/[\u0400-\u04ff]/.test(name)) return 'Russian';
  // Spanish indicators
  if (nameLower.includes('deportes') || nameLower.includes('latino') ||
      nameLower.includes('español') || nameLower.includes('mx')) {
    return 'Spanish';
  }
  return 'English';
}

function detectCountry(name: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('abu dhabi') || nameLower.includes('dubai')) return 'AE';
  if (nameLower.includes('cctv') || /[\u4e00-\u9fff]/.test(name)) return 'CN';
  if (nameLower.includes('eurospor')) return 'EU';
  if (nameLower.includes('b31n') || nameLower.includes('bein')) return 'QA';
  if (nameLower.includes('espn')) return 'US';
  if (nameLower.includes('fox sport')) return 'US';
  if (nameLower.includes('dd sport')) return 'IN';
  if (nameLower.includes('bahrain')) return 'BH';
  if (nameLower.includes('oman')) return 'OM';
  if (nameLower.includes('türkmenistan')) return 'TM';
  
  return 'US';
}

// Premium channel filter
function isPremiumChannel(channel: Channel): boolean {
  const premiumKeywords = [
    'espn', 'fox sport', 'bein', 'b31n', 'eurospor', 'tnt sport',
    'sky sport', 'hbo', 'showtime', 'cinemax', 'la liga', 'premier',
    'champions', 'ufc', 'wwe', 'formula', 'f1', 'nfl', 'nba', 'mlb',
    'dubai sport', 'abu dhabi sport', 'cctv5', 'match', 'sport'
  ];
  
  const nameLower = channel.name.toLowerCase();
  return premiumKeywords.some(kw => nameLower.includes(kw));
}

// Main execution
async function main() {
  console.log('🔍 Extracting premium channels from scraped data...\n');
  
  // Read the scraped data
  const scrapedFile = '/home/z/my-project/download/wcb1969-sport.json';
  const scrapedData = JSON.parse(fs.readFileSync(scrapedFile, 'utf8'));
  const htmlContent = scrapedData.data?.html || '';
  
  // Parse channels
  const allChannels = parseM3UContent(htmlContent, 'wcb1969');
  console.log(`📺 Total channels parsed: ${allChannels.length}`);
  
  // Filter premium channels
  const premiumChannels = allChannels.filter(isPremiumChannel);
  console.log(`⭐ Premium channels found: ${premiumChannels.length}`);
  
  // Filter English/Spanish only
  const filteredChannels = premiumChannels.filter(ch => 
    ch.language === 'English' || ch.language === 'Spanish'
  );
  console.log(`🌍 English/Spanish channels: ${filteredChannels.length}`);
  
  // Remove duplicates by name
  const uniqueChannels: Channel[] = [];
  const seen = new Set<string>();
  
  for (const ch of filteredChannels) {
    const key = ch.name.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      uniqueChannels.push(ch);
    }
  }
  console.log(`✨ Unique channels: ${uniqueChannels.length}`);
  
  // Group by category
  const byGroup: Record<string, Channel[]> = {};
  for (const ch of uniqueChannels) {
    if (!byGroup[ch.group]) byGroup[ch.group] = [];
    byGroup[ch.group].push(ch);
  }
  
  console.log('\n📊 Channels by group:');
  for (const [group, channels] of Object.entries(byGroup)) {
    console.log(`   ${group}: ${channels.length}`);
  }
  
  // Save results
  const outputPath = '/home/z/my-project/download/premium-channels-extracted.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    total: uniqueChannels.length,
    extracted: new Date().toISOString(),
    channels: uniqueChannels
  }, null, 2));
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  // Print sample channels
  console.log('\n📺 Sample premium channels:');
  uniqueChannels.slice(0, 30).forEach((ch, i) => {
    console.log(`   ${i + 1}. ${ch.name} [${ch.group}] [${ch.language}]`);
  });
  
  return uniqueChannels;
}

main().catch(console.error);
