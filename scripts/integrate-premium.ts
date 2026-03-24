import fs from 'fs';

// Read existing channels
const existingPath = 'public/data/channels.json';
const existing = JSON.parse(fs.readFileSync(existingPath, 'utf8'));
const existingChannels = existing.channels || [];
console.log(`📺 Existing channels: ${existingChannels.length}`);

// Read premium channels
const premiumPath = '/home/z/my-project/download/oriontv-premium-channels.json';
const premium = JSON.parse(fs.readFileSync(premiumPath, 'utf8'));
const premiumChannels = premium.channels || [];
console.log(`⭐ Premium channels to add: ${premiumChannels.length}`);

// Create a set of existing URLs to avoid duplicates
const existingUrls = new Set(existingChannels.map((ch: any) => ch.url));

// Filter out duplicates
const newChannels = premiumChannels.filter((ch: any) => !existingUrls.has(ch.url));
console.log(`✨ New unique channels: ${newChannels.length}`);

// Add premium channels with proper format
const channelsToAdd = newChannels.map((ch: any, i: number) => ({
  id: `premium-${Date.now()}-${i}`,
  name: ch.name,
  url: ch.url,
  logo: ch.logo || '',
  group: ch.group || 'Sports',
  language: ch.language || 'English',
  country: ch.country || 'US'
}));

// Merge and sort
const allChannels = [...existingChannels, ...channelsToAdd];

// Save updated channels
const output = {
  total: allChannels.length,
  updated: new Date().toISOString(),
  channels: allChannels
};

fs.writeFileSync(existingPath, JSON.stringify(output, null, 2));
console.log(`\n💾 Updated channels.json: ${allChannels.length} total channels`);
console.log(`   Previous: ${existingChannels.length}`);
console.log(`   Added: ${channelsToAdd.length}`);

// Summary by group
const byGroup: Record<string, number> = {};
allChannels.forEach((ch: any) => {
  byGroup[ch.group] = (byGroup[ch.group] || 0) + 1;
});
console.log('\n📊 By Group:');
Object.entries(byGroup).sort((a,b) => b[1] - a[1]).slice(0, 10).forEach(([k,v]) => 
  console.log(`   ${k}: ${v}`));
