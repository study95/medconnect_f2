import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],

  optimizeDeps: {
    include: [
      '@tabler/icons-react',
      'lucide-react',
      'react-bootstrap',
      'swiper',
      'swiper/react',
      'swiper/modules',
      '@tanstack/react-query'
    ]
  },

  build: {
    sourcemap: false,
    cssCodeSplit: true,
    // Target modern browsers — smaller bundles, better tree-shaking
    target: 'es2020',
    rollupOptions: {
      output: {
        // ─── Granular manual chunk splitting ───────────────────────────────────
        // Strategy: isolate heavy libraries so they get their own cached chunk.
        // When app code changes, users only re-download THEIR changed chunk.
        // When a library version bumps, only THAT vendor chunk gets re-fetched.
        manualChunks(id) {
          // ── Core React runtime (smallest, most stable) ──
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }

          // ── TanStack Query ──
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query'
          }

          // ── Icon libraries (large but rarely change) ──
          if (id.includes('node_modules/@tabler/') ||
              id.includes('node_modules/lucide-react/')) {
            return 'vendor-icons'
          }

          // ── UI framework ──
          if (id.includes('node_modules/react-bootstrap/') ||
              id.includes('node_modules/bootstrap/') ||
              id.includes('node_modules/swiper/')) {
            return 'vendor-ui'
          }

          // ── Recharts — only needed in admin dashboard/reports ──
          // Split into its own chunk so public pages don't download it
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor/')) {
            return 'vendor-recharts'
          }

          // ── PDF generation — only in prescription + ticket + commission ──
          // These are 390KB + 201KB — isolate completely
          if (id.includes('node_modules/jspdf/') ||
              id.includes('node_modules/html2canvas/')) {
            return 'vendor-pdf'
          }

          // ── Rich text editor (Quill) — only in content manager ──
          if (id.includes('node_modules/quill/') ||
              id.includes('node_modules/react-quill/')) {
            return 'vendor-quill'
          }

          // ── i18n (translation) ──
          if (id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next/')) {
            return 'vendor-i18n'
          }

          // ── WebSocket / Real-time (Pusher + Echo) ──
          if (id.includes('node_modules/pusher-js/') ||
              id.includes('node_modules/laravel-echo/')) {
            return 'vendor-realtime'
          }

          // ── HTML2PDF (separate from html2canvas — different import path) ──
          if (id.includes('node_modules/html2pdf')) {
            return 'vendor-pdf'
          }

          // ── React-to-print ──
          if (id.includes('node_modules/react-to-print/')) {
            return 'vendor-print'
          }

          // ── Chart helpers used only in reports ──
          if (id.includes('node_modules/file-saver/') ||
              id.includes('node_modules/xlsx/')) {
            return 'vendor-export'
          }
        }
      }
    },
    // Raise warning limit — icon libraries are legitimately large
    chunkSizeWarningLimit: 600,
  }
})
