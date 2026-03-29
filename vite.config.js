import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  define: {
    '__BUILD_TIME__': '1774750164',
  },
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // Vite 8 / rolldown requires manualChunks as a function
        manualChunks(id) {
          if (id.includes('node_modules/react') || id.includes('node_modules/react-dom') || id.includes('node_modules/react-router')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/@phosphor-icons')) {
            return 'vendor-ui'
          }
          if (id.includes('node_modules/jspdf') || id.includes('node_modules/html2canvas')) {
            return 'vendor-pdf'
          }
          if (id.includes('node_modules/dexie')) {
            return 'vendor-dexie'
          }
        },
      },
    },
    chunkSizeWarningLimit: 600,
  },
})
