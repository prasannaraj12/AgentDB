import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
  }
})
