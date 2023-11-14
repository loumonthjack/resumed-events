import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'middleware',
  }),
  // srcDir: './src/',
  // publicDir: "./src/public",
  outDir: './dist/astro',
  // idk some bug, delete and google to find out lol
  vite: {
    ssr: {
      noExternal: ['path-to-regexp'],
    },
  },
});