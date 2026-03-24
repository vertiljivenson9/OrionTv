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

function parseM3UExtended(content: string, source: string): Channel[] {
  const channels: Channel[] = [];
  const lines = content.split('\n');
  let currentChannel: Partial<Channel> = {};
  let idCounter = 1;

  for (const line of lines) {
    const trimmed = line.trim();
    
    // Parse #EXTINF format
    if (trimmed.startsWith('#EXTINF:')) {
      const nameMatch = trimmed.match(/,(.+)$/);
      const logoMatch = trimmed.match(/tvg-logo="([^"]+)"/);
      const groupMatch = trimmed.match(/group-title="([^"]+)"/);
      
      let name = nameMatch ? nameMatch[1].trim() : '';
      // Clean up the name
      name = name.replace(/[🇦🇫🇦🇱🇩🇿🇦🇸🇦🇩🇦🇴🇦🇮🇦🇶🇦🇬🇦🇷🇦🇲🇦🇼🇦🇺🇦🇹🇦🇿🇧🇸🇧🇭🇧🇩🇧🇧🇧🇾🇧🇪🇧🇿🇧🇯🇧🇲🇧🇹🇧🇴🇧🇦🇧🇼🇧🇷🇮🇴🇻🇬🇧🇳🇧🇬🇧🇫🇧🇮🇰🇭🇨🇲🇨🇦🇮🇨🇨🇻🇰🇾🇨🇫🇹🇩🇨🇱🇨🇳🇨🇽🇨🇨🇨🇴🇰🇲🇨🇬🇨🇩🇨🇰🇨🇷🇨🇮🇭🇷🇨🇺🇨🇼🇨🇾🇨🇿🇩🇰🇩🇯🇩🇲🇩🇴🇪🇨🇪🇬🇸🇻🇬🇶🇪🇷🇪🇪🇸🇿🇪🇹🇫🇰🇫🇴🇫🇯🇫🇮🇫🇷🇬🇫🇵🇫🇹🇫🇬🇦🇬🇲🇬🇪🇩🇪🇬🇭🇬🇮🇬🇷🇬🇱🇬🇩🇬🇵🇬🇺🇬🇹🇬🇬🇬🇳🇬🇼🇬🇾🇭🇹🇭🇲🇻🇦🇭🇳🇭🇰🇭🇺🇮🇸🇮🇳🇮🇩🇮🇷🇮🇶🇮🇪🇮🇲🇮🇱🇮🇹🇯🇲🇯🇵🎌🇯🇪🇯🇴🇰🇿🇰🇪🇰🇮🇽🇰🇰🇼🇰🇬🇱🇦🇱🇻🇱🇧🇱🇸🇱🇷🇱🇾🇱🇮🇱🇹🇱🇺🇲🇴🇲🇰🇲🇬🇲🇼🇲🇾🇲🇻🇲🇱🇲🇹🇲🇭🇲🇶🇲🇷🇲🇺🇾🇹🇲🇽🇫🇲🇲🇩🇲🇨🇲🇳🇲🇪🇲🇸🇲🇦🇲🇿🇲🇲🇳🇦🇳🇷🇳🇵🇳🇱🇳🇨🇳🇿🇳🇮🇳🇪🇳🇬🇳🇺🇳🇫🇰🇵🇲🇵🇳🇴🇴🇲🇵🇰🇵🇼🇵🇸🇵🇦🇵🇬🇵🇾🇵🇪🇵🇭🇵🇳🇵🇱🇵🇹🇵🇷🇶🇦🇷🇪🇷🇴🇷🇺🇷🇼🇼🇸🇸🇲🇸🇹🇸🇦🇸🇳🇷🇸🇨🇸🇱🇸🇬🇸🇽🇸🇰🇸🇮🇸🇧🇸🇴🇿🇦🇬🇸🇰🇷🇸🇸🇪🇸🇻🇸🇩🇸🇷🇸🇪🇸🇿🇸🇪🇨🇭🇸🇾🇹🇼🇹🇯🇹🇿🇹🇭🇹🇱🇹🇬🇹🇰🇹🇴🇹🇹🇹🇳🇹🇷🇹🇲🇹🇨🇹🇻🇺🇬🇺🇦🇦🇪🇬🇧🇺🇸🇺🇾🇺🇿🇻🇺🇻🇦🇻🇪🇻🇳🇻🇮🇪🇭🇾🇪🇿🇲🇿🇼]/g, '').trim();
      
      currentChannel = {
        name: name,
        logo: logoMatch ? logoMatch[1] : '',
        group: groupMatch ? groupMatch[1] : 'Sports'
      };
    } else if (trimmed.startsWith('http') && currentChannel.name) {
      currentChannel.url = trimmed;
      currentChannel.id = `${source}-${idCounter++}`;
      currentChannel.language = detectLanguage(currentChannel.name);
      currentChannel.country = detectCountry(currentChannel.name, trimmed);
      currentChannel.group = categorizeChannel(currentChannel.name);
      channels.push(currentChannel as Channel);
      currentChannel = {};
    }
    
    // Also parse simple format (Name,URL)
    if (!trimmed.startsWith('#') && trimmed.includes(',')) {
      const parts = trimmed.split(',');
      if (parts.length >= 2) {
        const name = parts[0].trim();
        const url = parts.slice(1).join(',').trim();
        
        if (url.startsWith('http') && name.length > 0) {
          channels.push({
            id: `${source}-simple-${idCounter++}`,
            name: name,
            url: url,
            logo: '',
            group: categorizeChannel(name),
            language: detectLanguage(name),
            country: detectCountry(name, url)
          });
        }
      }
    }
  }

  return channels;
}

function categorizeChannel(name: string): string {
  const nameLower = name.toLowerCase();
  
  if (nameLower.includes('sport') || nameLower.includes('espn') || 
      nameLower.includes('fox sport') || nameLower.includes('bein') ||
      nameLower.includes('eurospor') || nameLower.includes('tnt sport') ||
      nameLower.includes('sky sport') || nameLower.includes('tsn') ||
      nameLower.includes('cbs sport') || nameLower.includes('laliga') ||
      nameLower.includes('premier') || nameLower.includes('champions') ||
      nameLower.includes('ufc') || nameLower.includes('wwe') ||
      nameLower.includes('tennis') || nameLower.includes('golf') ||
      nameLower.includes('f1') || nameLower.includes('formula')) {
    return 'Sports';
  }
  if (nameLower.includes('hbo') || nameLower.includes('cinemax') ||
      nameLower.includes('showtime') || nameLower.includes('movie') ||
      nameLower.includes('film') || nameLower.includes('cine')) {
    return 'Movies';
  }
  if (nameLower.includes('news') || nameLower.includes('cnn') ||
      nameLower.includes('bbc') || nameLower.includes('fox news')) {
    return 'News';
  }
  if (nameLower.includes('tv1') || nameLower.includes('la1') || nameLower.includes('telemundo')) {
    return 'Entertainment';
  }
  return 'Entertainment';
}

function detectLanguage(name: string): string {
  const nameLower = name.toLowerCase();
  
  // Spanish indicators
  if (nameLower.includes('deportes') || nameLower.includes('latino') ||
      nameLower.includes('español') || nameLower.includes('ñ') ||
      nameLower.includes('méxico') || nameLower.includes('mexico') ||
      nameLower.includes('argentina') || nameLower.includes('colombia') ||
      nameLower.includes('españa') || nameLower.includes('esp') ||
      nameLower.includes('vivo') || nameLower.includes('tudn') ||
      nameLower.includes('unimas') || nameLower.includes('telemundo')) {
    return 'Spanish';
  }
  
  // Chinese
  if (/[\u4e00-\u9fff]/.test(name)) return 'Chinese';
  // Arabic
  if (/[\u0600-\u06ff]/.test(name)) return 'Arabic';
  // Russian
  if (/[\u0400-\u04ff]/.test(name)) return 'Russian';
  // Portuguese
  if (nameLower.includes('sportv') || nameLower.includes('premiere') ||
      nameLower.includes('brasil') || nameLower.includes('ponto')) {
    return 'Portuguese';
  }
  
  return 'English';
}

function detectCountry(name: string, url?: string): string {
  const nameLower = name.toLowerCase();
  const urlLower = url?.toLowerCase() || '';
  
  // Spanish/Latino
  if (nameLower.includes('español') || nameLower.includes('esp ') ||
      nameLower.includes('españa') || nameLower.includes('la1')) return 'ES';
  if (nameLower.includes('méxico') || nameLower.includes('mexico') ||
      nameLower.includes('tudn') || nameLower.includes('telemundo') ||
      nameLower.includes('unimas')) return 'MX';
  if (nameLower.includes('argentina') || nameLower.includes('🇦🇷') ||
      nameLower.includes('vivo')) return 'AR';
  if (nameLower.includes('colombia') || nameLower.includes('🇨🇴')) return 'CO';
  
  // US
  if (nameLower.includes('espn') && !nameLower.includes('deportes')) return 'US';
  if (nameLower.includes('fox sport') && !nameLower.includes('latino')) return 'US';
  if (nameLower.includes('cbs sport')) return 'US';
  if (nameLower.includes('fs 1') || nameLower.includes('fs1')) return 'US';
  if (nameLower.includes('tudn usa') || nameLower.includes('tudn us')) return 'US';
  
  // Canada
  if (nameLower.includes('tsn')) return 'CA';
  
  // UK
  if (nameLower.includes('sky sport') || nameLower.includes('tnt sport')) return 'GB';
  if (nameLower.includes('bein sport') && nameLower.includes('gb')) return 'GB';
  
  // Qatar/Middle East
  if (nameLower.includes('bein') || nameLower.includes('b31n')) return 'QA';
  if (nameLower.includes('abu dhabi') || nameLower.includes('dubai')) return 'AE';
  
  // Latin America general
  if (nameLower.includes('latino') || nameLower.includes('latin')) return 'LATAM';
  
  return 'US';
}

function isPremiumChannel(channel: Channel): boolean {
  const premiumKeywords = [
    'espn', 'fox sport', 'bein', 'b31n', 'eurospor', 'tnt sport',
    'sky sport', 'hbo', 'showtime', 'cinemax', 'la liga', 'laliga', 'premier',
    'champions', 'ufc', 'wwe', 'formula', 'f1', 'nfl', 'nba', 'mlb',
    'dubai sport', 'abu dhabi sport', 'cctv5', 'match', 'tsn', 'cbs sport',
    'sportv', 'premiere', 'tudn', 'telemundo', 'unimas', 'real madrid',
    'tyc', 'arena sport', 'setanta', 'ten sport', 'sony ten', 'star sport'
  ];
  
  const nameLower = channel.name.toLowerCase();
  return premiumKeywords.some(kw => nameLower.includes(kw)) || channel.group === 'Sports';
}

// Main execution
async function main() {
  console.log('🔧 Consolidating all premium channels...\n');
  
  const allChannels: Channel[] = [];
  
  // Process freecatv
  try {
    const freecatvFile = '/home/z/my-project/download/freecatv.json';
    const freecatvData = JSON.parse(fs.readFileSync(freecatvFile, 'utf8'));
    const freecatvContent = freecatvData.data?.html || '';
    const freecatvChannels = parseM3UExtended(freecatvContent, 'freecatv');
    console.log(`📺 freecatv: ${freecatvChannels.length} channels`);
    allChannels.push(...freecatvChannels);
  } catch (e) {
    console.log('❌ Error processing freecatv');
  }
  
  // Process wcb1969
  try {
    const wcbFile = '/home/z/my-project/download/wcb1969-sport.json';
    const wcbData = JSON.parse(fs.readFileSync(wcbFile, 'utf8'));
    const wcbContent = wcbData.data?.html || '';
    const wcbChannels = parseM3UExtended(wcbContent, 'wcb1969');
    console.log(`📺 wcb1969: ${wcbChannels.length} channels`);
    allChannels.push(...wcbChannels);
  } catch (e) {
    console.log('❌ Error processing wcb1969');
  }
  
  // Filter premium and language
  const premiumChannels = allChannels.filter(isPremiumChannel);
  console.log(`\n⭐ Premium channels: ${premiumChannels.length}`);
  
  const filteredChannels = premiumChannels.filter(ch => 
    ch.language === 'English' || ch.language === 'Spanish'
  );
  console.log(`🌍 English/Spanish: ${filteredChannels.length}`);
  
  // Remove duplicates by name (keep first occurrence with best URL)
  const uniqueChannels: Channel[] = [];
  const seen = new Map<string, Channel>();
  
  for (const ch of filteredChannels) {
    const key = ch.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!seen.has(key)) {
      seen.set(key, ch);
      uniqueChannels.push(ch);
    }
  }
  console.log(`✨ Unique channels: ${uniqueChannels.length}`);
  
  // Group stats
  const byGroup: Record<string, number> = {};
  const byLanguage: Record<string, number> = {};
  const byCountry: Record<string, number> = {};
  
  for (const ch of uniqueChannels) {
    byGroup[ch.group] = (byGroup[ch.group] || 0) + 1;
    byLanguage[ch.language] = (byLanguage[ch.language] || 0) + 1;
    byCountry[ch.country] = (byCountry[ch.country] || 0) + 1;
  }
  
  console.log('\n📊 By Group:');
  Object.entries(byGroup).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`   ${k}: ${v}`));
  
  console.log('\n📊 By Language:');
  Object.entries(byLanguage).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`   ${k}: ${v}`));
  
  console.log('\n📊 Top Countries:');
  Object.entries(byCountry).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([k,v]) => console.log(`   ${k}: ${v}`));
  
  // Save final result
  const outputPath = '/home/z/my-project/download/all-premium-channels.json';
  fs.writeFileSync(outputPath, JSON.stringify({
    total: uniqueChannels.length,
    extracted: new Date().toISOString(),
    stats: { byGroup, byLanguage, byCountry },
    channels: uniqueChannels
  }, null, 2));
  
  console.log(`\n💾 Saved to: ${outputPath}`);
  
  // Print sample
  console.log('\n📺 Sample premium channels:');
  uniqueChannels.slice(0, 40).forEach((ch, i) => {
    console.log(`   ${i + 1}. ${ch.name} [${ch.group}] [${ch.language}] [${ch.country}]`);
  });
  
  return uniqueChannels;
}

main().catch(console.error);
