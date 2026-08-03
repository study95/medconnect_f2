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
    // Split large vendor libraries into separate chunks.
    // This improves browser caching — when YOUR code changes,
    // the vendor chunks stay cached. Users only re-download what changed.
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],
          'vendor-ui': ['react-bootstrap', 'bootstrap', 'swiper'],
          'vendor-query': ['@tanstack/react-query'],
          'vendor-icons': ['@tabler/icons-react', 'lucide-react'],
        }
      }
    },
    // Increase chunk size warning limit (icon libraries are large)
    chunkSizeWarningLimit: 800,
  }
})
