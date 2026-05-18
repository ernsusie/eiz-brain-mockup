import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

/**
 * `base` defaults to `/` for local dev/preview. When embedding the
 * built dist into another app under a sub-path, set `VITE_BASE_PATH`
 * — e.g. `VITE_BASE_PATH=/mockup-static/ npm run build` to serve from
 * `/mockup-static/` (the eiz Next.js host does this).
 */
export default defineConfig({
  base: process.env.VITE_BASE_PATH ?? '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
    open: true,
  },
})
