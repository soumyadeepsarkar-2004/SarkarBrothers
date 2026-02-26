import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // loadEnv reads .env files; process.env has system env vars (Vercel, CI, etc.)
  const env = loadEnv(mode, '.', '');
  const GEMINI_API_KEY = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || '';
  const API_BASE_URL = env.API_BASE_URL || process.env.API_BASE_URL || '';
  const USE_MOCK = env.USE_MOCK_BACKEND || process.env.USE_MOCK_BACKEND || 'true';

  // Firebase config – .trim() strips stray newlines injected by some CI env-var tools
  const FIREBASE_API_KEY = (env.FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || '').trim();
  const FIREBASE_AUTH_DOMAIN = (env.FIREBASE_AUTH_DOMAIN || process.env.FIREBASE_AUTH_DOMAIN || '').trim();
  const FIREBASE_PROJECT_ID = (env.FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || '').trim();
  const FIREBASE_STORAGE_BUCKET = (env.FIREBASE_STORAGE_BUCKET || process.env.FIREBASE_STORAGE_BUCKET || '').trim();
  const FIREBASE_MESSAGING_SENDER_ID = (env.FIREBASE_MESSAGING_SENDER_ID || process.env.FIREBASE_MESSAGING_SENDER_ID || '').trim();
  const FIREBASE_APP_ID = (env.FIREBASE_APP_ID || process.env.FIREBASE_APP_ID || '').trim();

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
      'process.env.FIREBASE_API_KEY': JSON.stringify(FIREBASE_API_KEY),
      'process.env.FIREBASE_AUTH_DOMAIN': JSON.stringify(FIREBASE_AUTH_DOMAIN),
      'process.env.FIREBASE_PROJECT_ID': JSON.stringify(FIREBASE_PROJECT_ID),
      'process.env.FIREBASE_STORAGE_BUCKET': JSON.stringify(FIREBASE_STORAGE_BUCKET),
      'process.env.FIREBASE_MESSAGING_SENDER_ID': JSON.stringify(FIREBASE_MESSAGING_SENDER_ID),
      'process.env.FIREBASE_APP_ID': JSON.stringify(FIREBASE_APP_ID),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      }
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
      chunkSizeWarningLimit: 800,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'firebase-vendor': ['firebase/app', 'firebase/auth'],
          }
        }
      }
    }
  };
});
