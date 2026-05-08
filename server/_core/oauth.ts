import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { getSessionCookieOptions } from "./cookies";
import { sdk } from "./sdk";

/**
 * Simple password-based authentication (replaces OAuth).
 * Configure via environment variable:
 *   DASHBOARD_PASSWORD  — senha para acessar o dashboard (padrão: "endocricheck2025")
 */
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "endocricheck2025";
const ADMIN_OPEN_ID = "admin-local";

export function registerOAuthRoutes(app: Express) {
  // ── POST /api/auth/login — verifica senha e cria sessão
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };

    if (!password || password !== DASHBOARD_PASSWORD) {
      res.status(401).json({ ok: false, error: "Senha incorreta" });
      return;
    }

    try {
      const sessionToken = await sdk.createSessionToken(ADMIN_OPEN_ID, {
        name: "Administrador",
        expiresInMs: ONE_YEAR_MS,
      });
      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      res.json({ ok: true });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ ok: false, error: "Erro interno ao criar sessão" });
    }
  });

  // ── POST /api/auth/logout — remove cookie de sessão
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    const cookieOptions = getSessionCookieOptions(req);
    res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
    res.json({ ok: true });
  });

  // ── Manter compatibilidade com callback OAuth antigo (redireciona para home)
  app.get("/api/oauth/callback", (_req: Request, res: Response) => {
    res.redirect(302, "/");
  });
}
