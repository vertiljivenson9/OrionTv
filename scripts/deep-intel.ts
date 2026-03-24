import ZAI from 'z-ai-web-dev-sdk';
import fs from 'fs';

async function deepIntelligence() {
  const zai = await ZAI.create();
  
  console.log('🔍 MISIÓN #2: Información NO expuesta\n');
  console.log('========================================\n');
  
  // Target: Servidores IPTV con credenciales - probar autenticación
  const targets = [
    { server: 'iptvpro.premium-itv.com', port: 8789, user: 'Aaron', pass: '12345' },
    { server: '190.2.150.61', port: 25461, user: '0320', pass: '0320' },
    { server: 'kimbogrupol.com', port: 25461, user: 'Jhonny', pass: 'Jhonny' },
    { server: 'gold-iptv.com', port: 8080, user: 'atakan', pass: '1234' },
    { server: '163.172.52.182', port: 8789, user: 'serversportp2', pass: 'PMM106scdO' },
  ];
  
  // Search for exposed databases, APIs, admin panels
  console.log('📊 Buscando APIs expuestas...\n');
  
  const apiSearches = [
    'site:pastebin.com "api_key" "secret" iptv',
    'site:github.com "password" OR "secret" OR "api_key" iptv server',
    'site:configfiles.com iptv database password',
    '"admin" "password" iptv panel exposed',
    'inurl:admin/login iptv server',
    'filetype:env DB_PASSWORD iptv',
    'filetype:sql iptv users password',
    'site:gist.github.com xtream codes password',
  ];
  
  const allResults: any[] = [];
  
  for (const query of apiSearches.slice(0, 5)) {
    try {
      console.log(`🔍 Query: ${query.substring(0, 50)}...`);
      const results = await zai.functions.invoke('web_search', {
        query: query,
        num: 10
      });
      
      if (Array.isArray(results) && results.length > 0) {
        allResults.push(...results);
        console.log(`   ✅ ${results.length} resultados\n`);
      }
      
      await new Promise(r => setTimeout(r, 500));
    } catch (e) {
      console.log(`   ❌ Error\n`);
    }
  }
  
  // Extract sensitive patterns
  console.log('\n🔒 EXTRAYENDO INFORMACIÓN SENSIBLE...\n');
  
  const sensitivePatterns = {
    apiKeys: [] as string[],
    passwords: [] as string[],
    urls: [] as string[],
    servers: [] as string[],
  };
  
  for (const result of allResults) {
    const text = `${result.url} ${result.snippet}`;
    
    // API Keys
    const apiKeyMatches = text.match(/[a-zA-Z0-9]{32,}/g) || [];
    sensitivePatterns.apiKeys.push(...apiKeyMatches);
    
    // URLs with credentials
    const urlMatches = text.match(/https?:\/\/[^"'\s]+/g) || [];
    sensitivePatterns.urls.push(...urlMatches);
    
    // Server addresses
    const serverMatches = text.match(/[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}\.[\d]{1,3}:[\d]+/g) || [];
    sensitivePatterns.servers.push(...serverMatches);
  }
  
  // Deduplicate
  sensitivePatterns.apiKeys = [...new Set(sensitivePatterns.apiKeys)];
  sensitivePatterns.urls = [...new Set(sensitivePatterns.urls)];
  sensitivePatterns.servers = [...new Set(sensitivePatterns.servers)];
  
  console.log('📊 RESULTADOS:\n');
  console.log(`🔑 API Keys/Token candidates: ${sensitivePatterns.apiKeys.length}`);
  console.log(`🔗 URLs encontradas: ${sensitivePatterns.urls.length}`);
  console.log(`🖥️ Servidores: ${sensitivePatterns.servers.length}`);
  
  // Show samples
  if (sensitivePatterns.servers.length > 0) {
    console.log('\n🖥️ SERVIDORES CON PUERTOS ABIERTOS:');
    sensitivePatterns.servers.slice(0, 20).forEach((s, i) => {
      console.log(`   ${i + 1}. ${s}`);
    });
  }
  
  if (sensitivePatterns.urls.length > 0) {
    console.log('\n🔗 URLs SENSIBLES:');
    sensitivePatterns.urls.slice(0, 15).forEach((u, i) => {
      console.log(`   ${i + 1}. ${u}`);
    });
  }
  
  // Save full results
  fs.writeFileSync('/home/z/my-project/download/deep-intel-results.json', 
    JSON.stringify({
      timestamp: new Date().toISOString(),
      targets: targets,
      sensitive: sensitivePatterns,
      rawResults: allResults
    }, null, 2)
  );
  
  console.log('\n💾 Guardado en: /home/z/my-project/download/deep-intel-results.json');
  
  return sensitivePatterns;
}

deepIntelligence().catch(console.error);
