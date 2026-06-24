import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 3001,
        proxy: {
            '/api': {
                target: 'http://localhost:5000',
                changeOrigin: true,
            }
        }
    },
    build: {
        outDir: 'dist',
        target: 'ES2020',
        minify: false,
        sourcemap: false,
        rollupOptions: {
            output: {
                manualChunks: (id) => {
                    if (id.includes('node_modules')) {
                        if (id.includes('react')) {
                            return 'react-vendor';
                        }
                        if (id.includes('stripe')) {
                            return 'stripe-vendor';
                        }
                        return 'vendor';
                    }
                }
            }
        }
    }
});
