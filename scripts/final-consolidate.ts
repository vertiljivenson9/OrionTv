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

// Read all extracted channels
const premiumFile = '/home/z/my-project/download/all-premium-channels.json';
const premiumData = JSON.parse(fs.readFileSync(premiumFile, 'utf8'));
const channels: Channel[] = premiumData.channels || [];

console.log(`📺 Total channels loaded: ${channels.length}`);

// Create M3U playlist
let m3uContent = '#EXTM3U\n';
m3uContent += '# Created by OrionTV Premium Scraper\n';
m3uContent += `# Date: ${new Date().toISOString()}\n`;
m3uContent += `# Total channels: ${channels.length}\n\n`;

for (const ch of channels) {
  m3uContent += `#EXTINF:-1 tvg-id="${ch.id}" tvg-name="${ch.name}" tvg-logo="${ch.logo}" group-title="${ch.group}",${ch.name}\n`;
  m3uContent += `${ch.url}\n`;
}

// Save M3U
const m3uPath = '/home/z/my-project/download/oriontv-premium.m3u';
fs.writeFileSync(m3uPath, m3uContent);
console.log(`💾 M3U saved to: ${m3uPath}`);

// Create channels.json for OrionTV format
const orionChannels = channels.map((ch, i) => ({
  id: `premium-${i + 1}`,
  name: ch.name,
  url: ch.url,
  logo: ch.logo || `https://via.placeholder.com/100x60?text=${encodeURIComponent(ch.name)}`,
  group: ch.group,
  language: ch.language,
  country: ch.country
}));

const jsonPath = '/home/z/my-project/download/oriontv-premium-channels.json';
fs.writeFileSync(jsonPath, JSON.stringify({
  total: orionChannels.length,
  updated: new Date().toISOString(),
  channels: orionChannels
}, null, 2));
console.log(`💾 JSON saved to: ${jsonPath}`);

// Print summary
console.log('\n========================================');
console.log('📊 FINAL SUMMARY');
console.log('========================================');
console.log(`📺 Total premium channels: ${channels.length}`);

const byGroup: Record<string, number> = {};
const byLang: Record<string, number> = {};
const byCountry: Record<string, number> = {};

for (const ch of channels) {
  byGroup[ch.group] = (byGroup[ch.group] || 0) + 1;
  byLang[ch.language] = (byLang[ch.language] || 0) + 1;
  byCountry[ch.country] = (byCountry[ch.country] || 0) + 1;
}

console.log('\nBy Group:');
Object.entries(byGroup).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\nBy Language:');
Object.entries(byLang).sort((a,b) => b[1] - a[1]).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\nTop Countries:');
Object.entries(byCountry).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([k,v]) => console.log(`  ${k}: ${v}`));

console.log('\n========================================');
console.log('📺 Sample Premium Channels:');
console.log('========================================');
channels.slice(0, 50).forEach((ch, i) => {
  console.log(`${String(i + 1).padStart(3)}. ${ch.name.padEnd(35)} [${ch.group.substring(0,12).padEnd(12)}] [${ch.language.substring(0,7).padEnd(7)}]`);
});
