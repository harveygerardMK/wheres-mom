import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: '/wheres-mom/',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        journey: resolve(__dirname, 'journey.html'),
        about: resolve(__dirname, 'about.html'),
        howItWorks: resolve(__dirname, 'how-it-works.html'),
      },
    },
  },
});
