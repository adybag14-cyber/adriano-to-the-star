
export default {
    async fetch(request, env) {
        const url = new URL(request.url);
        let key = url.pathname.slice(1); // Remove leading slash

        // CORS headers for all responses
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Expose-Headers': 'content-length,content-type,content-range,accept-ranges,etag,x-hal-debug',
            // 'Access-Control-Allow-Credentials': 'true', // Optional
            'Access-Control-Max-Age': '86400',
            'x-hal-debug': 'worker-v2-integrated'
        };

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            // --- REDIRECTIONS ---
            // Security.txt Redirect (Root -> .well-known)
            if (url.pathname === '/security.txt') {
                return Response.redirect('https://adrianotothestar.com/.well-known/security.txt', 301);
            }

            // --- API ROUTING LOGIC ---
            // Route /api/planets/search requests to NASA TAP
            if (url.pathname.startsWith('/api/planets')) {
                return await this.handleApiRequest(request, url, corsHeaders);
            }

            // --- CHEERPJ CDN PROXY ---
            // Serve CheerpJ runtime assets from R2 bucket
            let bucket;
            if (key.startsWith('cheerpj/')) {
                // Route to STARSECTOR_BUCKET for CheerpJ files
                bucket = env.STARSECTOR_BUCKET;
            }

// --- R2 BUCKET LOGIC ---
            // Strip /resolve/main/ from path (HuggingFace URL format used by WebLLM)
            key = key.replace(/\/resolve\/main\//g, '/');

            // Strip leading slash from key for R2 lookup
            if (key.startsWith('/')) {
                key = key.substring(1);
            }

            // Route Starsector assets to STARSECTOR_BUCKET
            // R2 keys include bucket name prefix: starsector/{relative_path}
            // Worker must strip bucket name prefix when fetching
            if (key === 'Starsector-0.97a-RC11/starsector.html') {
                bucket = env.STARSECTOR_BUCKET;
            } else if (key === 'log' || key === 'ita_logo.png') {
                // Serve CheerpJ UI assets from STARSECTOR_BUCKET
                bucket = env.STARSECTOR_BUCKET;
            } else if (key.startsWith('Starsector-0.97a-RC11/')) {
                // Map /Starsector-0.97a-RC11/* to R2 key
                // R2 key format: starsector/starsector/{file}
                // Worker key: Starsector-0.97a-RC11/starsector/{file}
                // Transform: Starsector-0.97a-RC11/starsector/{file} -> starsector/{file}
                // (Strip the version prefix)
                const subpath = key.substring('Starsector-0.97a-RC11/'.length);
                key = subpath;
                bucket = env.STARSECTOR_BUCKET;
            } else if (key.startsWith('cheerpj/')) {
                // Serve CheerpJ runtime files from R2 (already set in CDN PROXY section)
                if (!bucket) {
                    bucket = env.STARSECTOR_BUCKET;
                }
            } else if (key.startsWith('cheerpj-natives/')) {
                // Serve CheerpJ natives from R2
                bucket = env.STARSECTOR_BUCKET;
            } else if (key.startsWith('lwjgl-browsercraft/')) {
                // Serve LWJGL browsercraft from R2
                bucket = env.STARSECTOR_BUCKET;
            } else if (key.startsWith('starsector/')) {
                bucket = env.STARSECTOR_BUCKET;
            } else if (!bucket) {
                // Route all other requests to SWF_BUCKET (starisdons-swf-files)
                bucket = env.SWF_BUCKET;
            }

            if (!bucket) {
                return this.createErrorResponse('Bucket binding not found', 500, corsHeaders);
            }

            // Debug logging for CheerpJ requests
            if (key.startsWith('cheerpj/')) {
                console.log(`[DEBUG] Fetching CheerpJ file: ${key} from bucket: ${bucket.constructor.name}`);
            }

            // Handle Range requests for R2
            const object = await this.fetchObject(bucket, key, request);

            if (object === null) {
                return this.createErrorResponse(`Object Not Found: ${key}`, 404, corsHeaders);
            }

            return this.createSuccessResponse(object, key, corsHeaders);
        } catch (error) {
            return this.createErrorResponse(`Worker Error: ${error.message}\nKey: ${key}`, 500, corsHeaders);
        }
    },

    // New API Handler System
    async handleApiRequest(request, url, corsHeaders) {
        const searchQuery = url.searchParams.get('q') || '';

        // Construct NASA TAP Query
        // Optimized for performance: Limit columns and rows
        const tapQuery = searchQuery
            ? `select pl_name, hostname, discoverymethod, pl_orbper, pl_rade, pl_eqt, sy_dist from ps where pl_name like '%${searchQuery}%' or hostname like '%${searchQuery}%' order by sy_dist asc`
            : `select top 100 pl_name, hostname, discoverymethod, pl_orbper, pl_rade, pl_eqt, sy_dist from ps order by sy_dist asc`;

        const encodedQuery = encodeURIComponent(tapQuery);
        const targetUrl = `https://exoplanetarchive.ipac.caltech.edu/TAP/sync?query=${encodedQuery}&format=json`;

        try {
            const response = await fetch(targetUrl, {
                headers: {
                    'User-Agent': 'AdrianoToTheStar-Worker/1.0'
                }
            });

            if (!response.ok) {
                throw new Error(`NASA Archive Error: ${response.statusText}`);
            }

            const data = await response.json();

            // Return JSON with CORS
            return new Response(JSON.stringify(data), {
                headers: {
                    ...corsHeaders,
                    'Content-Type': 'application/json'
                }
            });

        } catch (err) {
            return this.createErrorResponse(`API Proxy Failed: ${err.message}`, 502, corsHeaders);
        }
    },

    async fetchObject(bucket, key, request) {
        // Handle Range requests for R2 (for .bin shards and .jar files)
        const rangeHeader = request.headers.get('Range');
        if (rangeHeader && (key.endsWith('.bin') || key.endsWith('.jar'))) {
            return await bucket.get(key, { range: request.headers });
        }
        return await bucket.get(key);
    },

    createSuccessResponse(object, key, corsHeaders) {
        // Create a fresh headers object
        const headers = new Headers();

        // Standard metadata
        object.writeHttpMetadata(headers);
        headers.set('etag', object.httpEtag);
        headers.set('accept-ranges', 'bytes');

        // Explicitly set content-range if it exists
        if (object.range) {
            const start = object.range.offset;
            const end = object.range.offset + object.range.length - 1;
            headers.set('content-range', `bytes ${start}-${end}/${object.size}`);
        }

        // Set correct MIME type for module scripts
        if (key.endsWith('.wasm')) {
            headers.set('content-type', 'application/wasm');
        } else if (key.endsWith('.js')) {
            headers.set('content-type', 'application/javascript');
        }

        // Add caching headers for static assets
        // Cache static assets for 1 year (immutable)
        if (key.endsWith('.js') || key.endsWith('.wasm') || key.endsWith('.css') || 
            key.endsWith('.png') || key.endsWith('.jpg') || key.endsWith('.jpeg') || 
            key.endsWith('.gif') || key.endsWith('.svg') || key.endsWith('.ico') ||
            key.endsWith('.woff') || key.endsWith('.woff2') || key.endsWith('.ttf') ||
            key.endsWith('.eot')) {
            headers.set('Cache-Control', 'public, max-age=31536000, immutable');
        } else if (key.endsWith('.html') || key.endsWith('.htm')) {
            // Cache HTML for 1 hour
            headers.set('Cache-Control', 'public, max-age=3600');
        }

        // Apply CORS headers
        Object.entries(corsHeaders).forEach(([k, v]) => headers.set(k, v));

        const status = (object.range && key.endsWith('.bin')) ? 206 : 200;

        const response = new Response(object.body, { status });

        // Set headers on the response object
        headers.forEach((v, k) => response.headers.set(k, v));

        return response;
    },

    createErrorResponse(message, status, corsHeaders) {
        return new Response(message, {
            status,
            headers: {
                ...corsHeaders,
                'Content-Type': 'text/plain'
            }
        });
    },
};
