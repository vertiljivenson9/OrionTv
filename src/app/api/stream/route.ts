// Stream Proxy API - Edge runtime for fast response
// Implements timeout, validation, and proper error handling

export const runtime = 'edge';

const STREAM_TIMEOUT = 4000; // 4 seconds max

// Detect content type from URL or response
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

  return 'application/vnd.apple.mpegurl'; // Default to HLS
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const streamUrl = searchParams.get('url');

  if (!streamUrl) {
    return new Response(
      JSON.stringify({ error: 'Missing url parameter' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Validate URL
  try {
    new URL(streamUrl);
  } catch {
    return new Response(
      JSON.stringify({ error: 'Invalid URL' }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }

  // Create abort controller for timeout
  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, STREAM_TIMEOUT);

  try {
    console.log(`[Stream Proxy] Fetching: ${streamUrl.substring(0, 80)}...`);

    const response = await fetch(streamUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'VLC/3.0.0 LibVLC/3.0.0',
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Connection': 'keep-alive',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`[Stream Proxy] Error: ${response.status} ${response.statusText}`);
      return new Response(
        JSON.stringify({
          error: 'Stream unavailable',
          status: response.status,
          statusText: response.statusText,
        }),
        {
          status: response.status >= 500 ? 502 : response.status,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    const contentType = getContentType(streamUrl, response.headers.get('content-type') || undefined);
    console.log(`[Stream Proxy] Success: ${contentType}`);

    // Stream the response
    return new Response(response.body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': '*',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === 'AbortError') {
      console.log(`[Stream Proxy] Timeout after ${STREAM_TIMEOUT}ms`);
      return new Response(
        JSON.stringify({
          error: 'Stream timeout',
          message: `Stream did not respond within ${STREAM_TIMEOUT / 1000}s`,
        }),
        {
          status: 504,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    console.error(`[Stream Proxy] Error:`, error);
    return new Response(
      JSON.stringify({
        error: 'Stream fetch failed',
        message: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 502,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
}

// Handle CORS preflight
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
