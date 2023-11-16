import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    https: true,
    proxy: {
      '/api': {
        target:
          process.env.VITE_API_URL || 'https://bet-app-4w2c.onrender.com/',
        changeOrigin: true,
      },
    },
  },
  build: {
    minify: true,
  },
})
