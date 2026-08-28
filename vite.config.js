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
    target: 'es2020',
    chunkSizeWarningLimit: 850,
    rollupOptions: {
      output: {
        // Granular manual chunk splitting: isolates heavy vendor packages into independently cacheable async bundles
        manualChunks(id) {
          // Core React runtime
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react-router-dom/') ||
              id.includes('node_modules/scheduler/')) {
            return 'vendor-react'
          }

          // TanStack Query
          if (id.includes('node_modules/@tanstack/')) {
            return 'vendor-query'
          }

          // Icon libraries split by family
          if (id.includes('node_modules/@tabler/')) {
            return 'vendor-tabler'
          }
          if (id.includes('node_modules/lucide-react/')) {
            return 'vendor-lucide'
          }

          // UI framework & carousels
          if (id.includes('node_modules/react-bootstrap/') ||
              id.includes('node_modules/bootstrap/') ||
              id.includes('node_modules/swiper/')) {
            return 'vendor-ui'
          }

          // Analytics charts (admin only)
          if (id.includes('node_modules/recharts/') ||
              id.includes('node_modules/d3-') ||
              id.includes('node_modules/victory-vendor/')) {
            return 'vendor-recharts'
          }

          // Rich text editor (admin content & messages only)
          if (id.includes('node_modules/quill/') ||
              id.includes('node_modules/react-quill/')) {
            return 'vendor-quill'
          }

          // PDF generation libraries (split individually for optimal lazy loading on print triggers)
          if (id.includes('node_modules/jspdf/')) {
            return 'vendor-jspdf'
          }
          if (id.includes('node_modules/html2canvas/')) {
            return 'vendor-html2canvas'
          }
          if (id.includes('node_modules/html2pdf')) {
            return 'vendor-html2pdf'
          }

          // Translation & i18n
          if (id.includes('node_modules/i18next') ||
              id.includes('node_modules/react-i18next/')) {
            return 'vendor-i18n'
          }

          // Real-time WebSockets
          if (id.includes('node_modules/pusher-js/') ||
              id.includes('node_modules/laravel-echo/')) {
            return 'vendor-realtime'
          }

          // React-to-print
          if (id.includes('node_modules/react-to-print/')) {
            return 'vendor-print'
          }

          // Spreadsheet / export helpers
          if (id.includes('node_modules/file-saver/') ||
              id.includes('node_modules/xlsx/')) {
            return 'vendor-export'
          }
        }
      }
    }
  }
})
