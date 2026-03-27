#!/usr/bin/env python3
"""Extract channels from M3U and save as JSON"""
import json
import re

def parse_m3u(filepath, source_name):
    channels = []
    
    with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
        content = f.read()
    
    lines = content.split('\n')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        if line.startswith('#EXTINF'):
            # Parse channel info
            name_match = re.search(r',(.+)$', line)
            logo_match = re.search(r'tvg-logo="([^"]+)"', line)
            group_match = re.search(r'group-title="([^"]+)"', line)
            
            name = name_match.group(1) if name_match else "Unknown"
            logo = logo_match.group(1) if logo_match else None
            group = group_match.group(1) if group_match else "General"
            
            # Next line is URL
            i += 1
            if i < len(lines):
                url = lines[i].strip()
                if url and not url.startswith('#'):
                    channel = {
                        "id": f"{source_name}-{len(channels)}",
                        "name": name,
                        "logo": logo,
                        "url": url,
                        "country": group.split(';')[0] if ';' in group else group,
                        "countryCode": "",
                        "categories": [group],
                        "section": "general",
                        "source": source_name
                    }
                    channels.append(channel)
        
        i += 1
    
    return channels

# Parse iptv-org
print("Parsing iptv-org.m3u...")
channels = parse_m3u('/home/z/my-project/download/iptv-org.m3u', 'iptv-org')
print(f"Found {len(channels)} channels")

# Group by category
by_category = {}
for ch in channels:
    cat = ch['categories'][0] if ch['categories'] else 'General'
    if cat not in by_category:
        by_category[cat] = []
    by_category[cat].append(ch)

print(f"\nCategories: {len(by_category)}")
for cat, chs in sorted(by_category.items(), key=lambda x: -len(x[1]))[:10]:
    print(f"  {cat}: {len(chs)} channels")

# Save all channels
output = {
    "total": len(channels),
    "sources": ["iptv-org"],
    "channels": channels
}

with open('/home/z/my-project/download/iptv_channels.json', 'w', encoding='utf-8') as f:
    json.dump(output, f, indent=2, ensure_ascii=False)

print(f"\nSaved to iptv_channels.json")

# Also save categorized
with open('/home/z/my-project/download/iptv_by_category.json', 'w', encoding='utf-8') as f:
    json.dump(by_category, f, indent=2, ensure_ascii=False)

print("Saved to iptv_by_category.json")
