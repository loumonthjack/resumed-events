import { ViteDevServer } from "vite";
// import { getViteConfig } from "astro/config";

export default function viteExpressDevPlugin(path: string) {
  if (!path) {
    throw new Error("no path defined in plugin, check your config `viteExpressDevPlugin(\"src/string\")`");
  }

  // TODO add support for astro build
  return {
    name: "vite-express-plugin",
    configureServer: async (server: ViteDevServer) => {
      server.middlewares.use(async (req, res, next) => {
        // TODO load server path from config
        // const configFn = getViteConfig({});
        // const config = await configFn({
        //   command: "serve",
        //   mode: "development",
        // });
        // console.log("vite-express-dev-plugin", path)
        
        process.env["VITE"] = "true";
        
        try {
          // TODO type?
          const { expressServer } = await server.ssrLoadModule(path);
          expressServer(req, res, next);
        } catch (err) {
          console.error(err);
        }
      });
    },
  };
}
