import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import type { Plugin } from "vite";

/**
 * Plugin to handle .well-known paths before they reach React Router
 * Prevents route matching errors for browser extension requests
 */
function handleWellKnownPaths(): Plugin {
  return {
    name: "handle-well-known-paths",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        if (req.url?.startsWith("/.well-known/")) {
          res.writeHead(404);
          res.end();
          return;
        }
        next();
      });
    },
  };
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    tsconfigPaths(),
    handleWellKnownPaths(),
  ],
});
