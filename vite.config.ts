import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = process.env.API_URL || env.API_URL || process.env.VITE_API_URL || env.VITE_API_URL || '';

  return {
    plugins: [react()],
    envPrefix: ['VITE_', 'API_'],
    define: {
      'import.meta.env.API_URL': JSON.stringify(apiUrl),
    },
    server: {
      proxy: {
        '/api': {
          target: 'http://localhost:5005',
          changeOrigin: true,
        },
        '/uploads': {
          target: 'http://localhost:5005',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'esnext',
      cssCodeSplit: true,
      chunkSizeWarningLimit: 600,
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (id.includes('node_modules')) {
              if (id.includes('react-quill') || id.includes('quill')) {
                return 'vendor-editor';
              }
              if (id.includes('framer-motion')) {
                return 'vendor-motion';
              }
              if (id.includes('@reduxjs/toolkit') || id.includes('react-redux')) {
                return 'vendor-redux';
              }
              if (id.includes('lucide-react')) {
                return 'vendor-icons';
              }
              if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) {
                return 'vendor-react';
              }
            }
          },
        },
      },
    },
  };
});
