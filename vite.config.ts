import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, (process as any).cwd(), '');

  return {
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || env.VITE_API_KEY || ''),
      'process.env.VITE_FIREBASE_API_KEY': JSON.stringify(env.VITE_FIREBASE_API_KEY || env.API_KEY || '')
    },
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        injectRegister: 'auto',
        filename: 'service-worker.js',
        manifestFilename: 'manifest.json',
        includeAssets: ['icon.svg', 'index.html'],
        // Désactivé en DEV pour éviter les erreurs de redirection Auth persistantes
        devOptions: {
          enabled: false, 
          type: 'module',
        },
        manifest: {
          name: 'Memoraid',
          short_name: 'Memoraid',
          description: "Assistant personnel d'apprentissage intelligent.",
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          orientation: 'portrait',
          start_url: '/',
          id: '/',
          icons: [
            {
              src: '/icon.svg',
              sizes: '192x192',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            },
            {
              src: '/icon.svg',
              sizes: '512x512',
              type: 'image/svg+xml',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          navigateFallback: '/index.html',
          navigateFallbackDenylist: [
            /^\/__/, 
            /firestore\.googleapis\.com/, 
            /identitytoolkit\.googleapis\.com/,
            /firebasestorage\.googleapis\.com/,
            /accounts\.google\.com/
          ],
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: ({ url }) => 
                url.origin.includes('googleapis.com') || 
                url.origin.includes('firebase') || 
                url.pathname.startsWith('/__/'),
              handler: 'NetworkOnly'
            }
          ]
        }
      })
    ]
  };
});