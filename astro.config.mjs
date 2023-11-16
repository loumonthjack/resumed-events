import { defineConfig } from 'astro/config';
import node from '@astrojs/node';

import viteExpressDevPlugin from "./dev/vite-express-dev-plugin";

// NOTE this feels dangerous
import { env } from "./src/server/constants";

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
    plugins: [viteExpressDevPlugin("src/server/main.ts")],
    ssr: {
      noExternal: ['path-to-regexp'],
    },
  },
  server: {
    port: env.PORT
  }
});