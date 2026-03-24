import ZAI from 'z-ai-web-dev-sdk';

interface ScrapedChannel {
  name: string;
  url: string;
  logo?: string;
  group?: string;
  source: string;
}

interface ScrapingResult {
  channels: ScrapedChannel[];
  m3uLinks: string[];
  errors: string[];
}

// Sites from DMCA document that were verified as active
const ACTIVE_SITES = [
  'https://xoilacxc.cc',
  'https://cakhiao.cc',
  'https://drakulastream.xyz',
  'https://time4tv.site',
  'https://rojadirectatv.top',
  'https://rojadirectahd.mx',
  'https://iptvcat.com',
  'https://stream2watch.ws',
  'https://cricfree.sc',
  'https://livetv.sx',
  'https://vipbox.lc',
  'https://socagol.tv',
  'https://totalsportek.org',
  'https://footybite.to'
];

// Search queries for M3U playlists
const SEARCH_QUERIES = [
  'm3u iptv playlist 2024 espn fox sports',
  'm3u8 playlist premium sports channels free',
  'iptv m3u la liga premier league 2024',
  'free iptv m3u hbo showtime cinemax',
  'm3u playlist bein sports espn deportes',
  'iptv github m3u sports channels 2024',
  'm3u8 streaming list fox sports espn',
  'free m3u playlist latino deportes',
  'iptv m3u updated 2024 premium channels',
  'github iptv m3u sports entertainment'
];

async function scrapeSite(zai: any, url: string): Promise<{ content: string; m3uLinks: string[] }> {
  try {
    console.log(`📖 Reading: ${url}`);
    const result = await zai.functions.invoke('page_reader', { url });
    
    const html = result.data?.html || '';
    
    // Extract M3U/M3U8 links from the page
    const m3uRegex = /https?:\/\/[^\s"'<>]+\.m3u8?/gi;
    const m3uLinks = html.match(m3uRegex) || [];
    
    // Also look for streaming URLs
    const streamRegex = /https?:\/\/[^\s"'<>]*(?:stream|live|play|video|tv)[^\s"'<>]*/gi;
    const streamLinks = html.match(streamRegex) || [];
    
    console.log(`   Found ${m3uLinks.length} M3U links, ${streamLinks.length} stream URLs`);
    
    return {
      content: html,
      m3uLinks: [...new Set([...m3uLinks, ...streamLinks])].slice(0, 50)
    };
  } catch (error) {
    console.log(`   ❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return { content: '', m3uLinks: [] };
  }
}

async function searchM3U(zai: any, query: string): Promise<string[]> {
  try {
    console.log(`🔍 Searching: ${query}`);
    const results = await zai.functions.invoke('web_search', { query, num: 15 });
    
    const links: string[] = [];
    
    if (Array.isArray(results)) {
      for (const result of results) {
        // Look for M3U links in URLs
        if (result.url && (result.url.includes('.m3u') || result.url.includes('iptv') || result.url.includes('playlist'))) {
          links.push(result.url);
        }
        
        // Look for M3U links in snippets
        const m3uMatches = result.snippet?.match(/https?:\/\/[^\s]+\.m3u8?/gi) || [];
        links.push(...m3uMatches);
      }
    }
    
    console.log(`   Found ${links.length} potential M3U sources`);
    return [...new Set(links)];
  } catch (error) {
    console.log(`   ❌ Search error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

async function fetchM3UContent(zai: any, url: string): Promise<ScrapedChannel[]> {
  try {
    console.log(`📺 Fetching M3U: ${url}`);
    const result = await zai.functions.invoke('page_reader', { url });
    const content = result.data?.html || '';
    
    const channels: ScrapedChannel[] = [];
    
    // Parse M3U format
    const lines = content.split('\n');
    let currentChannel: Partial<ScrapedChannel> = {};
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (line.startsWith('#EXTINF:')) {
        // Extract channel info
        const nameMatch = line.match(/,(.+)$/);
        const logoMatch = line.match(/tvg-logo="([^"]+)"/);
        const groupMatch = line.match(/group-title="([^"]+)"/);
        
        currentChannel = {
          name: nameMatch ? nameMatch[1].trim() : `Channel ${channels.length + 1}`,
          logo: logoMatch ? logoMatch[1] : undefined,
          group: groupMatch ? groupMatch[1] : 'Unknown',
          source: url
        };
      } else if (line.startsWith('http') && currentChannel.name) {
        currentChannel.url = line;
        channels.push(currentChannel as ScrapedChannel);
        currentChannel = {};
      }
    }
    
    console.log(`   Found ${channels.length} channels`);
    return channels;
  } catch (error) {
    console.log(`   ❌ M3U fetch error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return [];
  }
}

async function main() {
  console.log('🚀 Starting Premium Channel Scraping...');
  console.log('========================================\n');
  
  const zai = await ZAI.create();
  const allChannels: ScrapedChannel[] = [];
  const allM3ULinks: string[] = [];
  const errors: string[] = [];
  
  // PHASE 1: Search for M3U playlists
  console.log('📍 PHASE 1: Searching for M3U playlists...\n');
  
  for (const query of SEARCH_QUERIES.slice(0, 5)) { // Limit to 5 searches initially
    try {
      const links = await searchM3U(zai, query);
      allM3ULinks.push(...links);
      await new Promise(r => setTimeout(r, 1000)); // Rate limit
    } catch (e) {
      errors.push(`Search failed: ${query}`);
    }
  }
  
  console.log(`\n✅ Found ${allM3ULinks.length} potential M3U sources\n`);
  
  // PHASE 2: Scrape active sites
  console.log('📍 PHASE 2: Scraping active streaming sites...\n');
  
  for (const site of ACTIVE_SITES.slice(0, 8)) { // Limit to 8 sites initially
    try {
      const { m3uLinks } = await scrapeSite(zai, site);
      allM3ULinks.push(...m3uLinks);
      await new Promise(r => setTimeout(r, 1500)); // Rate limit
    } catch (e) {
      errors.push(`Site scrape failed: ${site}`);
    }
  }
  
  // Deduplicate M3U links
  const uniqueM3ULinks = [...new Set(allM3ULinks)];
  console.log(`\n✅ Total unique M3U/stream links: ${uniqueM3ULinks.length}\n`);
  
  // PHASE 3: Try to fetch and parse some M3U files
  console.log('📍 PHASE 3: Parsing M3U files...\n');
  
  const m3uUrlsToFetch = uniqueM3ULinks
    .filter(link => link.includes('.m3u') || link.includes('playlist') || link.includes('iptv'))
    .slice(0, 5);
  
  for (const url of m3uUrlsToFetch) {
    try {
      const channels = await fetchM3UContent(zai, url);
      allChannels.push(...channels);
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      errors.push(`M3U parse failed: ${url}`);
    }
  }
  
  // Save results
  const result: ScrapingResult = {
    channels: allChannels,
    m3uLinks: uniqueM3ULinks,
    errors
  };
  
  // Write to JSON file
  const fs = await import('fs');
  const outputPath = '/home/z/my-project/download/scraped-premium-sources.json';
  
  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`\n💾 Results saved to: ${outputPath}`);
  
  // Print summary
  console.log('\n========================================');
  console.log('📊 SCRAPING SUMMARY');
  console.log('========================================');
  console.log(`📺 Channels extracted: ${allChannels.length}`);
  console.log(`🔗 M3U/Stream links: ${uniqueM3ULinks.length}`);
  console.log(`❌ Errors: ${errors.length}`);
  
  if (uniqueM3ULinks.length > 0) {
    console.log('\n🔗 Sample M3U/Stream links found:');
    uniqueM3ULinks.slice(0, 20).forEach((link, i) => {
      console.log(`   ${i + 1}. ${link}`);
    });
  }
  
  if (allChannels.length > 0) {
    console.log('\n📺 Sample channels extracted:');
    allChannels.slice(0, 10).forEach((ch, i) => {
      console.log(`   ${i + 1}. ${ch.name} - ${ch.group || 'No group'}`);
    });
  }
  
  return result;
}

main().catch(console.error);
