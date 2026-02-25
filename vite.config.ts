import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files; process.env has system env vars (Vercel, CI, etc.)
  const env = loadEnv(mode, '.', '');
  const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const API_BASE_URL = env.API_BASE_URL || process.env.API_BASE_URL || '';
  const USE_MOCK = env.USE_MOCK_BACKEND || process.env.USE_MOCK_BACKEND || 'true';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
      proxy: {
        '/api': {
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      }
    },
    plugins: [react()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(GEMINI_API_KEY),
      'process.env.API_BASE_URL': JSON.stringify(API_BASE_URL),
      'process.env.USE_MOCK_BACKEND': JSON.stringify(USE_MOCK),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          }
        }
      }
    }
  };
});
