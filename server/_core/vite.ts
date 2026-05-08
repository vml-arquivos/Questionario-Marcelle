import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
import { createServer as createViteServer } from "vite";
// NOTE: Do NOT import vite.config.ts here.
// It has static top-level imports of @tailwindcss/vite, @vitejs/plugin-react,
// etc. which are devDependencies. esbuild externalises them, so they end up
// as unresolvable requires in dist/index.js when the production image runs
// with only prod deps installed. Instead, tell Vite where the config file is
// on disk and let Vite load it in its own process (dev only).

export async function setupVite(app: Express, server: Server) {
  const vite = await createViteServer({
    // Point Vite to the config file on disk. Vite loads it in its own context,
    // so devDependency imports inside vite.config.ts never touch this bundle.
    configFile: path.resolve(import.meta.dirname, "../../vite.config.ts"),
    server: {
      middlewareMode: true,
      hmr: { server },
      allowedHosts: true as true,
    },
    appType: "custom",
  });

  app.use(vite.middlewares);
  app.use("*", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      const clientTemplate = path.resolve(
        import.meta.dirname,
        "../..",
        "client",
        "index.html"
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
