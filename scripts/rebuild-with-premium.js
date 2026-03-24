#!/usr/bin/env node
/**
 * Script to rebuild channel list with premium channels from images
 * - Keep only English and Spanish channels
 * - Add verified channels from images
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');

const CHANNELS_FILE = path.join(__dirname, '../public/data/channels.json');

// Countries to keep (English and Spanish speaking)
const ALLOWED_COUNTRIES = [
  // Spanish speaking
  'ES', 'MX', 'AR', 'CO', 'PE', 'VE', 'CL', 'EC', 'GT', 'CU',
  'BO', 'DO', 'HN', 'PY', 'SV', 'NI', 'CR', 'PA', 'PR', 'UY', 'GQ',
  // English speaking
  'US', 'GB', 'CA', 'AU', 'NZ', 'IE', 'ZA', 'PH', 'JM', 'TT',
  'BB', 'BS', 'BZ', 'DM', 'GD', 'KN', 'LC', 'VC', 'AG', 'BB'
];

// Premium channels extracted from images
const PREMIUM_CHANNELS = [
  // Image 1 - Claro TV channels
  { name: 'Universal Channel', url: 'http://161.0.157.9/PLTV/88888888/224/3221226828/index.m3u8', logo: 'http://www.totalplay.com.mx/images/logos/canales/entretenimiento/15.png', section: 'peliculas' },
  { name: 'Fox Cinema', url: 'http://161.0.157.7/PLTV/88888888/224/3221226793/03.m3u8', logo: 'http://puu.sh/mb4wQ/6cd02167d4.png', section: 'peliculas' },
  { name: 'Fox Action', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=753994&f=.m3u8', section: 'peliculas' },
  { name: 'Space', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=753995&f=.m3u8', section: 'peliculas' },
  { name: 'Telemundo Int', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762211&f=.m3u8', section: 'español' },
  { name: 'DHE', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762212&f=.m3u8', section: 'peliculas' },
  { name: 'Fox Comedy', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762213&f=.m3u8', section: 'series' },
  { name: 'Golden Plus', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762214&f=.m3u8', section: 'peliculas' },
  { name: 'Golden Premier', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762230&f=.m3u8', section: 'peliculas' },
  { name: 'Fox Movies', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762231&f=.m3u8', section: 'peliculas' },
  { name: 'Nick', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762232&f=.m3u8', section: 'infantil' },
  { name: 'Claro Cinema', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762233&f=.m3u8', section: 'peliculas' },
  { name: 'HBO Family', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762234&f=.m3u8', section: 'peliculas' },
  { name: 'FX', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762235&f=.m3u8', section: 'series' },
  { name: 'TNT Series', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762236&f=.m3u8', section: 'series' },
  { name: 'Cine Latino', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762237&f=.m3u8', section: 'peliculas' },
  { name: 'Fox Life', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762242&f=.m3u8', section: 'series' },
  { name: 'Nat Geo Wild', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762243&f=.m3u8', section: 'general' },
  { name: 'Warner', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762245&f=.m3u8', section: 'peliculas' },

  // Image 2 - More Claro TV
  { name: 'Lifetime', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762246&f=.m3u8', section: 'series' },
  { name: 'Fox Classics', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762247&f=.m3u8', section: 'peliculas' },
  { name: 'Cinecanal', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762249&f=.m3u8', section: 'peliculas' },
  { name: 'TNT', url: 'http://158.69.199.21/claroltv/claro.php2?calidad=4&canal=762252&f=.m3u8', section: 'peliculas' },
  { name: 'Max Up', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762262&f=.m3u8', section: 'peliculas' },
  { name: 'HBO 2', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762271&f=.m3u8', section: 'peliculas' },
  { name: 'AXN', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762272&f=.m3u8', section: 'series' },
  { name: 'Cinemax', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762275&f=.m3u8', section: 'peliculas' },
  { name: 'Las Estrellas', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762276&f=.m3u8', section: 'español' },
  { name: 'Universal', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762277&f=.m3u8', section: 'series' },
  { name: 'Tooncast', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762278&f=.m3u8', section: 'infantil' },
  { name: 'Sony', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762280&f=.m3u8', section: 'series' },
  { name: 'Entertainment', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762281&f=.m3u8', section: 'general' },
  { name: 'Azmundo', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762282&f=.m3u8', section: 'series' },
  { name: 'Multipremier', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762283&f=.m3u8', section: 'peliculas' },
  { name: 'Pasiones', url: 'http://158.69.199.21/claroltv/claro.php2?calidad=4&canal=762286&f=.m3u8', section: 'series' },
  { name: 'Max Prime', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762288&f=.m3u8', section: 'peliculas' },
  { name: 'Cinema Dinamita', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762299&f=.m3u8', section: 'peliculas' },
  { name: 'Fox', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762300&f=.m3u8', section: 'series' },
  { name: 'HBO Signature', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762301&f=.m3u8', section: 'peliculas' },
  { name: 'Paramount', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762302&f=.m3u8', section: 'peliculas' },
  { name: 'De Pelicula', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=762305&f=.m3u8', section: 'peliculas' },
  { name: 'ID', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=758453&f=.m3u8', section: 'general' },
  { name: 'Fox Family', url: 'http://158.69.199.21/claroltv/claro.php?calidad=4&canal=758477&f=.m3u8', section: 'peliculas' },

  // Image 3 - Fox Sports and ESPN
  { name: 'Fox Sports 3 Argentina', url: 'http://tv.nousiptv.com:25462/live/Demetrio/Demetrio/3615.m3u8', logo: 'http://i.imgur.com/tsBxDxY.png', section: 'deportes' },
  { name: 'Fox Sports 2 Argentina', url: 'http://tv.nousiptv.com:25462/live/Demetrio/Demetrio/2045.m3u8', logo: 'http://i.imgur.com/qXuM4hT.png', section: 'deportes' },
  { name: 'Fox Sports Argentina', url: 'http://aleman.mine.nu:8000/live/j1632Dq7IC/bKkMD2tBv6/3272.m3u8', logo: 'http://i.imgur.com/qXuM4hT.png', section: 'deportes' },
  { name: 'ESPN Plus Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/313.m3u8', section: 'deportes' },
  { name: 'ESPN Plus MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/312.m3u8', section: 'deportes' },
  { name: 'ESPN 3 Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/311.m3u8', section: 'deportes' },
  { name: 'ESPN 3 MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/310.m3u8', section: 'deportes' },
  { name: 'ESPN 2 Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/309.m3u8', section: 'deportes' },
  { name: 'ESPN 2 MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/308.m3u8', section: 'deportes' },
  { name: 'ESPN Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/307.m3u8', section: 'deportes' },
  { name: 'ESPN MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/306.m3u8', section: 'deportes' },
  { name: 'Fox Sports 3 Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/256.m3u8', section: 'deportes' },
  { name: 'Fox Sports 3 MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/255.m3u8', section: 'deportes' },
  { name: 'Fox Sports 2 Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/254.m3u8', section: 'deportes' },
  { name: 'Fox Sports 2 MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/253.m3u8', section: 'deportes' },
  { name: 'Fox Sports Sur', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/252.m3u8', section: 'deportes' },
  { name: 'Fox Sports MX', url: 'http://micine.club:8080/live/Desdetuiphoneapp/buenosdias/251.m3u8', section: 'deportes' },

  // Image 4 - TSN and Sky Sports
  { name: 'TSN1', url: 'http://196.234.81.22:25461/live/12341234/12341234/3684.m3u8', logo: 'https://www.stream2watch.org/images/streams/236/600x400/15045155241416.png', section: 'deportes' },
  { name: 'TSN2', url: 'http://196.234.81.22:25461/live/12341234/12341234/3683.m3u8', logo: 'https://soombo.com/assets/images/200_1456428050.png', section: 'deportes' },
  { name: 'TSN3', url: 'http://196.234.81.22:25461/live/12341234/12341234/3682.m3u8', logo: 'http://guide.live/images/stations/a190.png', section: 'deportes' },
  { name: 'TSN4', url: 'http://196.234.81.22:25461/live/12341234/12341234/3681.m3u8', section: 'deportes' },
  { name: 'TSN5', url: 'http://196.234.81.22:25461/live/12341234/12341234/3680.m3u8', section: 'deportes' },
  { name: 'Sky Sports News', url: 'http://196.234.81.22:25461/live/12341234/12341234/4785.m3u8', logo: 'http://teammutz.xyz/guide/logos/Sky%20Sports%20News.png', section: 'deportes' },
  { name: 'Sky Sports 1', url: 'http://196.234.81.22:25461/live/12341234/12341234/4784.m3u8', logo: 'http://futbolonline.xyz/images/Sky1.jpg', section: 'deportes' },
  { name: 'Sky Sports 2', url: 'http://196.234.81.22:25461/live/12341234/12341234/4783.m3u8', section: 'deportes' },
  { name: 'Sky Sports 3', url: 'http://196.234.81.22:25461/live/12341234/12341234/4778.m3u8', section: 'deportes' },
  { name: 'Sky Sports 4', url: 'http://196.234.81.22:25461/live/12341234/12341234/4782.m3u8', section: 'deportes' },
  { name: 'Sky Sports 5', url: 'http://196.234.81.22:25461/live/12341234/12341234/4779.m3u8', section: 'deportes' },
  { name: 'Bein Sport La Liga', url: 'http://tv.iptv5region.com:25461/live/DanielZavala02/U6uRED7RTQi/4352.ts', section: 'deportes' },

  // Image 5 - More sports
  { name: 'Fox Sports 2', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/1709.m3u8', section: 'deportes' },
  { name: 'Fox Sports 3', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/694.m3u8', section: 'deportes' },
  { name: 'TyC Sports', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/1714.m3u8', section: 'deportes' },
  { name: 'Super TV', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/1612.m3u8', section: 'general' },
  { name: 'Movistar MotoGP', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/1697.m3u8', section: 'deportes' },
  { name: 'Real Madrid TV', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/1484.m3u8', section: 'deportes' },
  { name: 'DeporTV', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/294.m3u8', section: 'deportes' },
  { name: 'Eurosport', url: 'http://186.33.227.198/DXTV/smil:DXTV_smil/playlist.m3u8', section: 'deportes' },
  { name: 'MLB HD', url: 'http://aleman.mine.nu:8000/live/ji63ZDq7IC/bKkMD2tBv6/2311.m3u8', section: 'deportes' },
  { name: 'MLB Network', url: 'http://mlblive-akc.mlb.com/ls01/mlbam/mlb_network/NETWORK_LINEAR_1/master_wired.m3u8', section: 'deportes' },
  { name: 'Pac 12 Arizona', url: 'http://pl2a-1h.akamaihd.net/i/arizona_delivery@199730/master.m3u8', section: 'deportes' },
  { name: 'Pac 12 Bay Area', url: 'http://pl2b-1h.akamaihd.net/i/bayarea_delivery@429334/master.m3u8', section: 'deportes' },
  { name: 'Pac 12 Los Angeles', url: 'http://pl21-1h.akamaihd.net/i/la_delivery@425541/master.m3u8', section: 'deportes' },
  { name: 'Pac 12 Mountain', url: 'http://pl2m-1h.akamaihd.net/i/mountain_delivery@428912/master.m3u8', section: 'deportes' },
  { name: 'Pac 12 Oregon', url: 'http://pl20-1h.akamaihd.net/i/oregon_delivery@103261/master.m3u8', section: 'deportes' },
  { name: 'Pac 12 Washington', url: 'http://pl2w-1h.akamaihd.net/i/washington_delivery@426584/master.m3u8', section: 'deportes' },

  // Image 6 - More channels
  { name: 'Dubai Sports', url: 'http://dmi.mangomolo.com:1935/dubaisports/smil:dubaisports.smil/master.m3u8', section: 'deportes' },
  { name: 'Wapa Deportes', url: 'https://dcunwlive30-lh.akamaihd.net/i/dclive_10535231/master.m3u8', section: 'deportes' },
  { name: 'TNT Sports HD', url: 'http://aleiptv.mine.nu:8000/aaron/1234/14109', logo: 'https://4.bp.blogspot.com/-VKh-H8rmYA0/WyAgnI9OTI/AAAAAAAAAxc/kc91Mg1KcHchG2uGTsx9GqHuJzaJz7rOwCLcBGA/s1600/tntsports.jpg', section: 'deportes' },
  { name: 'Claro Sport', url: 'http://aleiptv.mine.nu:8000/aaron/1234/277', logo: 'https://img3.s3wfg.com/web/img/images_uploaded/7/3/claro_sport_rio_2016.png', section: 'deportes' }
];

// Test if a URL is accessible
function testUrl(url, timeout = 5000) {
  return new Promise((resolve) => {
    if (!url || !url.startsWith('http')) {
      resolve(false);
      return;
    }

    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, { timeout }, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 400) {
        resolve(true);
      } else if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        // Follow redirect
        testUrl(res.headers.location, timeout).then(resolve);
      } else {
        resolve(false);
      }
    });

    req.on('error', () => resolve(false));
    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });
  });
}

// Channel logos database
const CHANNEL_LOGOS = {
  'fox sports': 'https://i.imgur.com/qXuM4hT.png',
  'fox movies': 'https://i.imgur.com/7a8W2hS.png',
  'fox cinema': 'http://puu.sh/mb4wQ/6cd02167d4.png',
  'fox action': 'https://i.imgur.com/8jP5sgF.png',
  'fox life': 'https://i.imgur.com/9KgTgFP.png',
  'fox family': 'https://i.imgur.com/4R4WgXG.png',
  'fox classics': 'https://i.imgur.com/zSgONHv.png',
  'fox comedy': 'https://i.imgur.com/U6hLhXS.png',
  'hbo': 'https://i.imgur.com/iJ8Yf8V.png',
  'hbo 2': 'https://i.imgur.com/iJ8Yf8V.png',
  'hbo family': 'https://i.imgur.com/iJ8Yf8V.png',
  'hbo signature': 'https://i.imgur.com/iJ8Yf8V.png',
  'espn': 'https://i.imgur.com/8K5pX2F.png',
  'espn 2': 'https://i.imgur.com/8K5pX2F.png',
  'espn 3': 'https://i.imgur.com/8K5pX2F.png',
  'espn plus': 'https://i.imgur.com/8K5pX2F.png',
  'tsn': 'https://www.stream2watch.org/images/streams/236/600x400/15045155241416.png',
  'sky sports': 'http://futbolonline.xyz/images/Sky1.jpg',
  'warner': 'https://i.imgur.com/nSMZm8j.png',
  'universal': 'http://www.totalplay.com.mx/images/logos/canales/entretenimiento/15.png',
  'universal channel': 'http://www.totalplay.com.mx/images/logos/canales/entretenimiento/15.png',
  'tnt': 'https://i.imgur.com/J7zYH4E.png',
  'tnt series': 'https://i.imgur.com/J7zYH4E.png',
  'cinemax': 'https://i.imgur.com/jMbZKxv.png',
  'axn': 'https://i.imgur.com/XxLgW7I.png',
  'sony': 'https://i.imgur.com/lOKbEJv.png',
  'paramount': 'https://i.imgur.com/Uw6W3Nt.png',
  'fx': 'https://i.imgur.com/aZgWLLa.png',
  'nick': 'https://i.imgur.com/nTPsJvR.png',
  'nickelodeon': 'https://i.imgur.com/nTPsJvR.png',
  'golden': 'https://i.imgur.com/TIXHnKB.png',
  'golden premier': 'https://i.imgur.com/TIXHnKB.png',
  'nat geo': 'https://i.imgur.com/Uw6W3Nt.png',
  'nat geo wild': 'https://i.imgur.com/4tzqGjV.png',
  'discovery': 'https://i.imgur.com/dE9vHRA.png',
  'lifetime': 'https://i.imgur.com/c5YqJhF.png',
  'cinecanal': 'https://i.imgur.com/J7zYH4E.png',
  'max': 'https://i.imgur.com/lOKbEJv.png',
  'max prime': 'https://i.imgur.com/lOKbEJv.png',
  'max up': 'https://i.imgur.com/lOKbEJv.png',
  'las estrellas': 'https://i.imgur.com/AgYyZLp.png',
  'telemundo': 'https://i.imgur.com/oEJoEoK.png',
  'azmundo': 'https://i.imgur.com/XxLgW7I.png',
  'pasiones': 'https://i.imgur.com/lOKbEJv.png',
  'de pelicula': 'https://i.imgur.com/TIXHnKB.png',
  'cinema dinamita': 'https://i.imgur.com/TIXHnKB.png',
  'claro cinema': 'https://i.imgur.com/lOKbEJv.png',
  'claro sport': 'https://img3.s3wfg.com/web/img/images_uploaded/7/3/claro_sport_rio_2016.png',
  'tyc sports': 'https://i.imgur.com/tsBxDxY.png',
  'real madrid': 'https://i.imgur.com/rmtWeNS.png',
  'deportv': 'https://i.imgur.com/tsBxDxY.png',
  'eurosport': 'https://i.imgur.com/tsBxDxY.png',
  'mlb': 'https://i.imgur.com/tsBxDxY.png',
  'pac 12': 'https://i.imgur.com/tsBxDxY.png',
  'tooncast': 'https://i.imgur.com/nTPsJvR.png'
};

function getLogo(channelName) {
  const name = channelName.toLowerCase();
  for (const [key, logo] of Object.entries(CHANNEL_LOGOS)) {
    if (name.includes(key)) {
      return logo;
    }
  }
  return null;
}

async function rebuildChannels() {
  console.log('🚀 Starting channel rebuild...');
  console.log('📅 Timestamp:', new Date().toISOString());

  try {
    // Load existing channels
    console.log('\n📂 Loading existing channels...');
    const existingData = JSON.parse(fs.readFileSync(CHANNELS_FILE, 'utf8'));
    const existingChannels = existingData.channels;

    console.log(`✅ Loaded ${existingChannels.length} existing channels`);

    // Filter: keep only English and Spanish channels
    console.log('\n🔍 Filtering channels (English/Spanish only)...');
    const filteredChannels = existingChannels.filter(channel => {
      // Keep adult channels
      if (channel.is_adult) return true;

      // Keep Spanish speaking countries
      if (channel.is_spanish) return true;

      // Keep allowed countries (English speaking)
      if (ALLOWED_COUNTRIES.includes(channel.countryCode)) return true;

      // Keep if language_primary is English
      if (channel.language_primary === 'English') return true;

      // Check categories for Spanish/English content
      const cats = (channel.categories || []).join(' ').toLowerCase();
      if (cats.includes('español') || cats.includes('spanish')) return true;
      if (cats.includes('english') || cats.includes('inglés')) return true;

      return false;
    });

    console.log(`✅ Filtered to ${filteredChannels.length} English/Spanish channels`);

    // Test premium channels
    console.log('\n🧪 Testing premium channels from images...');
    const verifiedPremium = [];

    for (const channel of PREMIUM_CHANNELS) {
      process.stdout.write(`   Testing ${channel.name}... `);
      const isValid = await testUrl(channel.url);
      if (isValid) {
        console.log('✅');
        verifiedPremium.push({
          id: `premium_${verifiedPremium.length}`,
          name: channel.name,
          logo: channel.logo || getLogo(channel.name),
          url: channel.url,
          country: channel.name.includes('MX') || channel.name.includes('Argentina') || channel.name.includes('Sur') ? 'Mexico' :
                   channel.name.includes('TSN') || channel.name.includes('Sky') ? 'United Kingdom' : 'United States',
          countryCode: channel.name.includes('MX') || channel.name.includes('Argentina') || channel.name.includes('Sur') ? 'MX' :
                       channel.name.includes('TSN') ? 'CA' :
                       channel.name.includes('Sky') ? 'GB' : 'US',
          language_primary: 'Español',
          is_spanish: true,
          is_adult: false,
          section: channel.section,
          categories: ['Premium'],
          altNames: [],
          network: null,
          owners: [],
          source: 'premium_images'
        });
      } else {
        console.log('❌');
      }
    }

    console.log(`\n✅ ${verifiedPremium.length} premium channels verified`);

    // Combine all channels
    const allChannels = [...filteredChannels, ...verifiedPremium];

    // Deduplicate by URL
    const uniqueUrls = new Set();
    const uniqueChannels = [];
    for (const channel of allChannels) {
      const urlKey = channel.url.toLowerCase();
      if (!uniqueUrls.has(urlKey)) {
        uniqueUrls.add(urlKey);
        uniqueChannels.push(channel);
      }
    }

    // Sort
    uniqueChannels.sort((a, b) => {
      if (a.is_adult !== b.is_adult) return a.is_adult ? 1 : -1;
      return a.name.localeCompare(b.name);
    });

    // Update stats
    const stats = {
      total: uniqueChannels.length,
      spanish: uniqueChannels.filter(c => c.is_spanish).length,
      adult: uniqueChannels.filter(c => c.is_adult).length,
      bySection: {}
    };

    for (const channel of uniqueChannels) {
      stats.bySection[channel.section] = (stats.bySection[channel.section] || 0) + 1;
    }

    // Build output
    const output = {
      channels: uniqueChannels,
      sections: existingData.sections.map(s => ({
        ...s,
        count: stats.bySection[s.id] || 0
      })),
      stats: stats,
      lastUpdated: new Date().toISOString(),
      source: 'orion-stream'
    };

    // Save
    fs.writeFileSync(CHANNELS_FILE, JSON.stringify(output, null, 2));

    // Summary
    console.log('\n✅ Channel rebuild complete!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📊 Total channels: ${stats.total}`);
    console.log(`🇪🇸 Spanish channels: ${stats.spanish}`);
    console.log(`🔞 Adult channels: ${stats.adult}`);
    console.log(`➕ Premium verified: ${verifiedPremium.length}`);
    console.log('\n📋 By section:');
    for (const [section, count] of Object.entries(stats.bySection)) {
      const icon = section === 'deportes' ? '⚽' :
                   section === 'peliculas' ? '🎬' :
                   section === 'series' ? '📺' :
                   section === 'infantil' ? '👶' :
                   section === 'español' ? '🇪🇸' : '📡';
      console.log(`   ${icon} ${section}: ${count}`);
    }
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

    return output;

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  rebuildChannels();
}

module.exports = { rebuildChannels };
