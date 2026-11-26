import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

const shareBypass = (req) => {
  const isPage = (req.headers.accept || '').includes('text/html');
  if (req.method === 'GET' && isPage && /^\/share\/[a-f0-9]+$/.test(req.url)) {
    return req.url; // serve the SPA, which renders SharedDashboard
  }
};

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'favicon-16x16.png', 'favicon-32x32.png', 'apple-touch-icon.png', 'brand/*.png', 'icons/*.png'],
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
        // Browser navigations to /share/:token get the SPA page; the page's own
        // fetch() of the same URL (Accept: */*) is proxied to the backend API.
        bypass: shareBypass,
      },
    }
  },
  preview: {
    host: true,
    proxy: {
      '/chat': 'https://agentdb-1.onrender.com',
      '/databases': 'https://agentdb-1.onrender.com',
      '/export': 'https://agentdb-1.onrender.com',
      '/report': 'https://agentdb-1.onrender.com',
      '/suggestions': 'https://agentdb-1.onrender.com',
      '/share': {
        target: 'https://agentdb-1.onrender.com',
        bypass: shareBypass,
      },
    }
  }
})
