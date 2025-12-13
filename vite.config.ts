
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate', // Met à jour le SW automatiquement dès qu'une nouvelle version est dispo
      includeAssets: ['icon.svg', 'index.html'], // Assets statiques à inclure hors du build JS
      manifest: {
        name: 'Memoraid',
        short_name: 'Memoraid',
        description: "Assistant personnel d'apprentissage intelligent.",
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          {
            src: 'icon.svg',
            sizes: '192x192',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          },
          {
            src: 'icon.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Stratégies de mise en cache
        navigateFallback: '/index.html', // Fallback pour le SPA hors ligne
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'], // Cache tous les assets générés
        cleanupOutdatedCaches: true,
        runtimeCaching: [
          // Cache des polices Google (CacheFirst car elles changent peu)
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 an
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          // Stratégie NetworkFirst pour les appels API (données fraîches en priorité, cache si hors ligne)
          {
            urlPattern: ({ url }) => url.href.includes('firebase') || url.href.includes('googleapis'),
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              networkTimeoutSeconds: 5,
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 1 jour
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ]
});
