import { defineConfig } from 'vite';
import legacy from '@vitejs/plugin-legacy';
import compression from 'vite-plugin-compression';
import { VitePWA } from 'vite-plugin-pwa';

// Plugin to exclude large files from build
function excludeLargeFiles() {
  return {
    name: 'exclude-large-files',
    generateBundle(options, bundle) {
      for (const fileName in bundle) {
        // Exclude all .glb files and large files
        if (fileName.includes('.glb') || fileName.includes('.gltf')) {
          delete bundle[fileName];
        }
      }
    }
  };
}

export default defineConfig({
  plugins: [
    excludeLargeFiles(),
    legacy({
      targets: ['defaults', 'not IE 11'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime']
    }),
    compression({
      algorithm: 'gzip',
      ext: '.gz'
    }),
    compression({
      algorithm: 'brotliCompress',
      ext: '.br'
    }),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png'],
      manifest: {
        name: 'Exoplanet Pioneer',
        short_name: 'ExoPioneer',
        description: '3D Space Strategy Game - Explore and colonize exoplanets',
        theme_color: '#0a0e27',
        background_color: '#0a0e27',
        display: 'fullscreen',
        icons: [
          {
            src: '/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    target: 'esnext',
    outDir: 'dist',
    assetsDir: 'assets',
    publicDir: 'public',
    assetsInclude: ['**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.svg', '**/*.ico', '**/*.json', '**/*.txt'],
    assetsExclude: ['**/*.glb', '**/*.gltf', '**/assets/models/**'],
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log']
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'three-core': ['three'],
          'supabase': ['@supabase/supabase-js']
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]'
      },
      external: [],
      onwarn(warning, warn) {
        if (warning.code === 'MODULE_LEVEL_DIRECTIVE') return;
        if (warning.message.includes('asset size limit')) return;
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 1000
  },
  server: {
    port: 3000,
    open: true,
    cors: true,
    proxy: {
      '/api': {
        target: 'http://localhost:8787',
        changeOrigin: true
      }
    }
  },
  preview: {
    port: 4173,
    open: true
  },
  optimizeDeps: {
    include: ['three', '@supabase/supabase-js']
  }
});
