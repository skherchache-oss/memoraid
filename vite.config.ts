
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      filename: 'service-worker.js', // Nom explicite pour éviter conflit avec un ancien sw.js
      manifestFilename: 'manifest.json',
      includeAssets: ['icon.svg', 'index.html'], // Ces fichiers doivent être dans /public pour être inclus
      devOptions: {
        enabled: true,
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
            src: '/icon.svg', // Chemin absolu (nécessite icon.svg dans le dossier public/)
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
        ],
        screenshots: [
           {
              src: "/icon.svg", 
              sizes: "512x512",
              type: "image/svg+xml",
              form_factor: "wide",
              label: "Memoraid Desktop"
           },
           {
              src: "/icon.svg", 
              sizes: "512x512",
              type: "image/svg+xml",
              form_factor: "narrow",
              label: "Memoraid Mobile"
           }
        ]
      },
      workbox: {
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] }
            }
          },
          {
            urlPattern: ({ url }) => url.href.includes('firebase') || url.href.includes('googleapis'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
              cacheableResponse: { statuses: [0, 200] }
            }
          }
        ]
      }
    })
  ]
});
