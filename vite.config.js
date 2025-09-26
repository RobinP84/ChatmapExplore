//vite.config.js
import { defineConfig } from 'vite'
import react          from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  define: {
    // Force React to pick its development build
    'process.env.NODE_ENV': JSON.stringify('development')
  },
  server: {
    host: true,  // eller '0.0.0.0'
  }
})