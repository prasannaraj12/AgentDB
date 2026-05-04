import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: 'AgentDB',
        short_name: 'AgentDB',
        description: 'AI-powered database query and visualization agent',
        theme_color: '#863bff',
        background_color: '#0f0f0f',
        display: 'standalone',
        orientation: 'portrait-primary',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/icons/icon-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable'
          },
          {
            src: '/icons/icon-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 // 24 hours
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  server: {
    proxy: {
      '/chat': 'http://localhost:8000',
      '/databases': 'http://localhost:8000',
      '/export': 'http://localhost:8000',
      '/report': 'http://localhost:8000',
      '/suggestions': 'http://localhost:8000',
      '/share': {
        target: 'http://localhost:8000',
        bypass: (req) => {
          // Only proxy POST (create) and GET with token to backend API
          // Let the frontend handle /share/:token page rendering via SPA
          if (req.method === 'GET' && req.url.match(/^\/share\/[a-f0-9]+$/)) {
            return req.url; // serve frontend SPA
          }
        }
      },
    }
  },
  preview: {
    host: true,
    proxy: {
      '/chat': 'http://192.168.1.69:8000',
      '/databases': 'http://192.168.1.69:8000',
      '/export': 'http://192.168.1.69:8000',
      '/report': 'http://192.168.1.69:8000',
      '/suggestions': 'http://192.168.1.69:8000',
      '/share': {
        target: 'http://192.168.1.69:8000',
        bypass: (req) => {
          if (req.method === 'GET' && req.url.match(/^\/share\/[a-f0-9]+$/)) {
            return req.url;
          }
        }
      },
    }
  }
})
