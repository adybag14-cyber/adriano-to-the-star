/**
 * Exoplanet Pioneer Assets Worker
 * Serves large game assets from R2 bucket to bypass Cloudflare Pages 25MB limit
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
          'Access-Control-Allow-Headers': '*',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    // Only allow GET and HEAD requests
    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405 });
    }

    // Remove leading slash
    const key = path.startsWith('/') ? path.slice(1) : path;

    // Serve index for root
    if (!key || key === '') {
      return new Response(JSON.stringify({
        name: 'Exoplanet Pioneer Assets',
        version: '1.0.0',
        endpoints: {
          assets: '/assets/*',
          models: '/models/*',
          textures: '/textures/*'
        }
      }), {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      });
    }

    try {
      // Get object from R2
      const object = await env.EXOPLANET_ASSETS.get(key);

      if (!object) {
        return new Response('Asset not found', { 
          status: 404,
          headers: {
            'Access-Control-Allow-Origin': '*'
          }
        });
      }

      // Get object metadata
      const headers = new Headers();
      
      // Copy R2 object headers
      object.writeHttpMetadata(headers);
      headers.set('etag', object.httpEtag);
      headers.set('Access-Control-Allow-Origin', '*');
      headers.set('Access-Control-Expose-Headers', '*');
      
      // Add cache headers
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
      
      // Add content type if not set
      if (!headers.has('Content-Type')) {
        const contentType = getContentType(key);
        if (contentType) {
          headers.set('Content-Type', contentType);
        }
      }

      // Handle Range requests for large files
      const range = request.headers.get('Range');
      if (range && object.size) {
        const rangeParts = range.replace('bytes=', '').split('-');
        const start = parseInt(rangeParts[0]);
        const end = rangeParts[1] ? parseInt(rangeParts[1]) : object.size - 1;

        if (start >= object.size || end >= object.size || start > end) {
          return new Response('Invalid range', { 
            status: 416,
            headers: {
              'Content-Range': `bytes */${object.size}`,
              'Access-Control-Allow-Origin': '*'
            }
          });
        }

        const contentLength = end - start + 1;
        headers.set('Content-Range', `bytes ${start}-${end}/${object.size}`);
        headers.set('Content-Length', String(contentLength));
        headers.set('Content-Type', object.httpMetadata?.contentType || getContentType(key) || 'application/octet-stream');

        const rangeResponse = new Response(object.slice(start, end + 1), {
          status: 206,
          headers
        });

        return rangeResponse;
      }

      // Return full object
      return new Response(object.body, {
        headers
      });

    } catch (error) {
      console.error('R2 fetch error:', error);
      return new Response('Error fetching asset', { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*'
        }
      });
    }
  }
};

/**
 * Get content type based on file extension
 */
function getContentType(filename) {
  const ext = filename.split('.').pop().toLowerCase();
  const types = {
    'glb': 'model/gltf-binary',
    'gltf': 'model/gltf+json',
    'png': 'image/png',
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'webp': 'image/webp',
    'svg': 'image/svg+xml',
    'json': 'application/json',
    'txt': 'text/plain',
    'html': 'text/html',
    'css': 'text/css',
    'js': 'application/javascript',
    'wasm': 'application/wasm',
    'mp3': 'audio/mpeg',
    'wav': 'audio/wav',
    'ogg': 'audio/ogg',
    'mp4': 'video/mp4',
    'webm': 'video/webm',
    'bin': 'application/octet-stream',
    'dat': 'application/octet-stream'
  };
  return types[ext] || 'application/octet-stream';
}
