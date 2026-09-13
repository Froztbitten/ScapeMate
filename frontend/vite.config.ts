/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(() => {
  return {
    plugins: [react()],
    build: {
      outDir: 'dist',
      rollupOptions: {
        input: {
          main: path.resolve(__dirname, 'index.html'),
        },
        output: {
          // Keep the heavy, rarely-changing libraries out of the app chunk so
          // they stay cached across deploys.
          manualChunks: {
            react: ['react', 'react-dom', 'react-router-dom'],
            firebase: [
              'firebase/app',
              'firebase/auth',
              'firebase/database',
              'firebase/analytics',
            ],
            mui: ['@mui/material', '@mui/icons-material'],
            charts: ['@mui/x-charts', '@mui/x-data-grid'],
            konva: ['konva', 'react-konva'],
          },
        },
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/setupTests.ts'],
      coverage: {
        reporter: ['text', 'json', 'html'],
      },
    },
  };
});
