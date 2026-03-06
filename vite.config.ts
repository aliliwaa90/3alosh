
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    chunkSizeWarningLimit: 1000,
    rollupOptions: {
      output: {
        manualChunks(id) {
            if (id.includes('node_modules')) {
                if (id.includes('react')) {
                    return 'react-vendor';
                }
                if (id.includes('lucide-react')) {
                    return 'ui-vendor';
                }
            }
        }
      }
    }
  },
});
