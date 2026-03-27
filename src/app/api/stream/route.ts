// Stream Proxy API - Node.js runtime for full functionality
// Proxies HLS streams, follows redirects, and rewrites m3u8 playlists

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const STREAM_TIMEOUT = 25000;
const MAX_REDIRECTS = 5;

function getContentType(url: string, responseContentType?: string): string {
  if (responseContentType && !responseContentType.includes('octet-stream')) {
    return responseContentType;
  }

  const urlLower = url.toLowerCase();

  if (urlLower.includes('.m3u8')) {
    return 'application/vnd.apple.mpegurl';
  }
  if (urlLower.includes('.mpd')) {
    return 'application/dash+xml';
  }
  if (urlLower.includes('.ts')) {
    return 'video/mp2t';
  }
  if (urlLower.includes('.mp4')) {
    return 'video/mp4';
  }
  if (urlLower.includes('.key')) {
    return 'application/octet-stream';
  }

  return 'application/vnd.apple.mpegurl';
}

function isM3u8(url: string, contentType: string): boolean {
  const urlLower = url.toLowerCase();
  return urlLower.includes('.m3u8') || contentType.includes('mpegurl');
}

function rewriteM3u8(content: string, baseUrl: string): string {
  const lines = content.split('\n');
  
  try {
    const base = new URL(baseUrl);
    const basePath = base.pathname.substring(0, base.pathname.lastIndexOf('/') + 1);
    const baseOrigin = base.origin;

    return lines.map(line => {
      const trimmed = line.trim();
      
      if (!trimmed || trimmed.startsWith('#')) {
        if (trimmed.includes('URI="')) {
          return trimmed.replace(/URI="([^"]+)"/g, (match, uri) => {
            const absoluteUrl = resolveUrl(uri, baseOrigin, basePath);
            return `URI="/api/stream?url=${encodeURIComponent(absoluteUrl)}"`;
          });
        }
        return line;
      }
      
      const absoluteUrl = resolveUrl(trimmed, baseOrigin, basePath);
      return `/api/stream?url=${encodeURIComponent(absoluteUrl)}`;
    }).join('\n');
  } catch (e) {
    console.error('[Proxy] Error rewriting m3u8:', e);
    return content;
  }
}

function resolveUrl(url: string, baseOrigin: string, basePath: string): string {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  if (url.startsWith('//')) {
    return 'http:' + url;
  }
  if (url.startsWith('/')) {
    return baseOrigin + url;
  }
  return baseOrigin + basePath + url;
}

// Fetch following redirects manually to track final URL
async function fetchWithRedirects(url: string, maxRedirects: number = MAX_REDIRECTS): Promise<{
  response: Response;
  finalUrl: string;
}> {
  let currentUrl = url;
  let redirects = 0;

  while (redirects <= maxRedirects) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT);

    try {
      console.log(`[Proxy] Fetching: ${currentUrl.substring(0, 60)}...`);
      
      const response = await fetch(currentUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
          'Accept': '*/*',
          'Accept-Encoding': 'gzip, deflate',
          'Connection': 'keep-alive',
          'Icy-MetaData': '1',
        },
        redirect: 'manual', // Handle redirects manually to track final URL
      });

      clearTimeout(timeoutId);

      // Check for redirect
      if (response.status === 301 || response.status === 302 || response.status === 307 || response.status === 308) {
        const location = response.headers.get('location');
        if (location) {
          console.log(`[Proxy] Redirect ${response.status} -> ${location.substring(0, 60)}...`);
          
          // Handle relative redirects
          if (location.startsWith('/')) {
            const baseUrl = new URL(currentUrl);
            currentUrl = baseUrl.origin + location;
          } else if (location.startsWith('http')) {
            currentUrl = location;
          } else {
            const baseUrl = new URL(currentUrl);
            currentUrl = baseUrl.origin + baseUrl.pathname.substring(0, baseUrl.pathname.lastIndexOf('/') + 1) + location;
          }
          
          redirects++;
          continue;
        }
      }

      // Not a redirect, return the response
      return { response, finalUrl: currentUrl };
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  throw new Error('Too many redirects');
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get('url');

  if (!streamUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing url parameter' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    new URL(streamUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid URL' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }

  try {
    const { response, finalUrl } = await fetchWithRedirects(streamUrl);

    if (!response.ok) {
      console.log(`[Proxy] Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({ error: 'Stream unavailable', status: response.status }),
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        }
      );
    }

    const responseContentType = response.headers.get('content-type') || '';
    const contentType = getContentType(finalUrl, responseContentType);
    console.log(`[Proxy] Success: ${contentType} from ${finalUrl.substring(0, 50)}...`);

    // For m3u8 playlists, rewrite URLs to use proxy
    if (isM3u8(finalUrl, contentType)) {
      const text = await response.text();
      
      if (!text || text.length < 10) {
        console.log('[Proxy] Empty m3u8 response');
        return new Response(
          JSON.stringify({ error: 'Empty playlist' }),
          { status: 502, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }
        );
      }
      
      const rewritten = rewriteM3u8(text, finalUrl);
      console.log('[Proxy] Rewrote m3u8 playlist, length:', rewritten.length);
      
      return new Response(rewritten, {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.apple.mpegurl',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Cache-Control': 'no-cache',
        },
      });
    }

    // For other content (ts segments, keys, etc), stream directly
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (error) {
    console.error(`[Proxy] Error:`, error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout');
    
    return new Response(
      JSON.stringify({
        error: isTimeout ? 'Stream timeout' : 'Stream fetch failed',
        message: errorMessage,
      }),
      {
        status: isTimeout ? 504 : 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      }
    );
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': '*',
      'Access-Control-Max-Age': '86400',
    },
  });
}
