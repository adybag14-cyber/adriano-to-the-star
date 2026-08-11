/**
 * Cloudflare Worker API Proxy for Exoplanet Pioneer
 * Proxies API requests from adrianotothestar.com to exoplanet-pioneer.pages.dev
 * Handles CORS and authentication
 */

const ALLOWED_ORIGINS = [
  'https://adrianotothestar.com',
  'https://www.adrianotothestar.com',
  'http://localhost:3000',
  'http://localhost:4173'
];

const API_BASE = 'https://exoplanet-pioneer.pages.dev';

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCorsPreflight(origin);
    }

    // Only proxy API requests
    if (url.pathname.startsWith('/api/')) {
      return proxyApiRequest(request, env, ctx);
    }

    // For non-API requests, return 404 or forward as needed
    return new Response('Not Found', { status: 404 });
  }
};

function handleCorsPreflight(origin) {
  const headers = {
    'Access-Control-Allow-Origin': origin || '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400'
  };

  return new Response(null, { status: 204, headers });
}

async function proxyApiRequest(request, env, ctx) {
  const url = new URL(request.url);
  const origin = request.headers.get('Origin');
  const referer = request.headers.get('Referer');

  // Validate origin
  const allowedOrigin = ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];

  // Build target URL
  const targetUrl = `${API_BASE}${url.pathname}${url.search}`;

  try {
    // Clone the request with modified headers
    const headers = new Headers(request.headers);
    headers.set('X-Forwarded-For', request.headers.get('CF-Connecting-IP'));
    headers.set('X-Forwarded-Host', url.hostname);
    headers.set('X-Forwarded-Proto', url.protocol.replace(':', ''));

    // Forward the request
    const response = await fetch(targetUrl, {
      method: request.method,
      headers,
      body: request.body
    });

    // Clone response to modify headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': allowedOrigin,
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Type, X-Cache'
    };

    // Copy response headers
    response.headers.forEach((value, key) => {
      if (!key.toLowerCase().startsWith('access-control-')) {
        corsHeaders[key] = value;
      }
    });

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: corsHeaders
    });

  } catch (error) {
    console.error('API Proxy Error:', error);
    
    return new Response(JSON.stringify({
      error: 'API Proxy Error',
      message: error.message
    }), {
      status: 502,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': allowedOrigin
      }
    });
  }
}
