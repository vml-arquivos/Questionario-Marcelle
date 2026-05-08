import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serves the pre-built client bundle in production.
 * This file intentionally has NO imports from vite or any dev-only package
 * so that it is safe to load when NODE_ENV=production and devDependencies
 * are not installed.
 *
 * The esbuild output lands in dist/index.js (server) and dist/public/ (client).
 * At runtime, import.meta.dirname resolves to the dist/ directory, so
 * "public" resolves to dist/public — exactly where vite build writes the SPA.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  app.use(express.static(distPath));

  // Fall through to index.html for client-side routing
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
