import "dotenv/config";
import express from "express";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./oauth";
import { registerStorageProxy } from "./storageProxy";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { runMigrations, getPool } from "../db";

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // ── Run migrations eagerly on startup ────────────────────────────────────
  try {
    const result = await runMigrations();
    console.log("[Startup] Migrations OK. Applied:", result.applied.length, "items");
  } catch (err) {
    console.warn("[Startup] Migration warning (non-fatal):", err);
  }

  // ── /api/migrate — force re-run migrations + show DB column state ────────
  app.post("/api/migrate", async (_req, res) => {
    try {
      const result = await runMigrations();

      // Also return current columns for diagnosis
      const pool = getPool();
      const client = await pool.connect();
      let columns: string[] = [];
      try {
        const r = await client.query(`
          SELECT column_name FROM information_schema.columns
          WHERE table_name = 'survey_responses'
          ORDER BY ordinal_position
        `);
        columns = r.rows.map((row: { column_name: string }) => row.column_name);
      } finally {
        client.release();
      }

      res.json({
        ok: true,
        message: "Migrations applied",
        applied: result.applied,
        warnings: result.warnings,
        columns,
        columnCount: columns.length,
      });
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  // ── /api/db-status — read-only diagnostic endpoint ───────────────────────
  app.get("/api/db-status", async (_req, res) => {
    try {
      const pool = getPool();
      const client = await pool.connect();
      try {
        const colsResult = await client.query(`
          SELECT column_name, data_type FROM information_schema.columns
          WHERE table_name = 'survey_responses'
          ORDER BY ordinal_position
        `);
        const countResult = await client.query(`SELECT COUNT(*) as total FROM "survey_responses"`);
        res.json({
          ok: true,
          columns: colsResult.rows,
          responseCount: countResult.rows[0].total,
        });
      } finally {
        client.release();
      }
    } catch (err) {
      res.status(500).json({ ok: false, error: String(err) });
    }
  });

  registerStorageProxy(app);
  registerOAuthRoutes(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    })
  );

  if (process.env.NODE_ENV === "development") {
    const { setupVite } = await import("./vite");
    await setupVite(app, server);
  } else {
    const { serveStatic } = await import("./static");
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
