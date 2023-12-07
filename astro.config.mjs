import { defineConfig } from 'astro/config';
import node from '@astrojs/node';
import viteExpressDevPlugin from "./dev/vite-express-dev-plugin";
import react from "@astrojs/react";
// NOTE this feels dangerous
import { env } from "./src/server/constants";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  output: 'hybrid',
  adapter: node({
    mode: 'middleware'
  }),
  integrations: [react(), tailwind()],
  // srcDir: './src/',
  // publicDir: "./src/public",
  outDir: './dist/astro',
  // idk some bug, delete and google to find out lol
  vite: {
    // plugins: [viteExpressDevPlugin("src/server/main.ts")],
    ssr: {
      noExternal: ['path-to-regexp']
    }
    // NOTE causing error with vite import anaylsis(?)
    // define: {
    //   'process.env.DEFAULT_IMAGE': "https://s3.amazonaws.com/app.local.resumed.website/profile_pics/default.png"
    // }
  },
  server: {
    port: env.PORT
  }
});