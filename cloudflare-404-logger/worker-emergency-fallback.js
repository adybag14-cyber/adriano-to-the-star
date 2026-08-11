/**
 * Emergency Fallback Worker for adrianotothestar.com
 * Redirects 404s to Cloudflare Pages deployment when core pages are missing
 */

const CLOUDFLARE_PAGES_URL = 'https://exoplanet-pioneer.pages.dev';

// Core pages that should redirect to Cloudflare Pages
const CORE_PAGES = [
  '/exoplanet-pioneer.html',
  '/index.html',
  '/game.html',
  '/play.html'
];

// Files that should always redirect to Cloudflare Pages
const REDIRECT_PATTERNS = [
  'exoplanet-pioneer',
  'api/',
  'assets/models/',
  'assets/textures/'
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Serve cheerpj-natives directly from R2 bucket
    if (url.pathname.includes('/cheerpj-natives/')) {
      const key = url.pathname.slice(1); // Remove leading slash
      try {
        const object = await env.SWF_BUCKET.get(key);
        
        if (object) {
          const headers = new Headers();
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('Access-Control-Allow-Origin', '*');
          headers.set('Content-Type', 'application/javascript');
          
          return new Response(object.body, { headers });
        }
        
        return new Response('File not found', { status: 404 });
      } catch (error) {
        console.error('Error serving cheerpj-natives:', error);
        return new Response('Error serving file', { status: 500 });
      }
    }
    
    // Try to fetch from origin first
    try {
      const response = await fetch(request);
      
      // If successful, return the response
      if (response.ok) {
        return response;
      }
      
      // If 404, check if it's a core page or redirect pattern
      if (response.status === 404) {
        const shouldRedirect = shouldRedirectToCloudflare(url.pathname);
        
        if (shouldRedirect) {
          console.log(`Emergency redirect: ${url.pathname} -> ${CLOUDFLARE_PAGES_URL}${url.pathname}`);
          
          return Response.redirect(`${CLOUDFLARE_PAGES_URL}${url.pathname}`, 307);
        }
      }
      
      return response;
      
    } catch (error) {
      console.error('Emergency worker error:', error);
      
      // On any error, check if we should redirect
      if (shouldRedirectToCloudflare(url.pathname)) {
        return Response.redirect(`${CLOUDFLARE_PAGES_URL}${url.pathname}`, 307);
      }
      
      // Otherwise, return error
      return new Response('Service temporarily unavailable', { status: 503 });
    }
  }
};

function shouldRedirectToCloudflare(pathname) {
  // Don't redirect cheerpj-natives - they're served from R2 bucket
  if (pathname.includes('/cheerpj-natives/')) {
    return false;
  }
  
  // Check if it's a core page
  if (CORE_PAGES.includes(pathname)) {
    return true;
  }
  
  // Check if it matches redirect patterns
  for (const pattern of REDIRECT_PATTERNS) {
    if (pathname.includes(pattern)) {
      return true;
    }
  }
  
  // Check if it's a JavaScript file that might be missing
  if (pathname.endsWith('.js') && !pathname.includes('legacy')) {
    return true;
  }
  
  // Check if it's an API endpoint
  if (pathname.startsWith('/api/')) {
    return true;
  }
  
  return false;
}
