import express, { type Express } from "express";
import fs from "fs";
import { type Server } from "http";
import { nanoid } from "nanoid";
import path from "path";
// NOTE: Do NOT use a static top-level import for 'vite' here.
// esbuild with --packages=external still emits a top-level `import ... from "vite"`
// in dist/index.js. Node.js resolves ALL top-level imports before executing any code,
// so even though the call is guarded by `if (NODE_ENV === "development")`, the
// production container (which has no vite installed) crashes immediately with
// ERR_MODULE_NOT_FOUND. Using a dynamic import() defers the resolution to runtime,
// only when this function is actually called (dev mode only).

export async function setupVite(app: Express, server: Server) {
  // Dynamic import ensures vite is only resolved at runtime in dev mode,
  // never bundled as a static top-level import that would break production.
  const { createServer: createViteServer } = await import("vite");

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
