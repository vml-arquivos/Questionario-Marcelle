import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import { createHmac, randomBytes } from "crypto";
import { getSessionCookieOptions } from "./cookies";

/**
 * Simple password-based authentication (replaces OAuth).
 * Configure via environment variable:
 *   DASHBOARD_PASSWORD  — senha para acessar o dashboard (padrão: "endocricheck2025")
 *   SESSION_SECRET or JWT_SECRET — segredo para assinar o JWT
 */
const DASHBOARD_PASSWORD = process.env.DASHBOARD_PASSWORD ?? "endocricheck2025";
const SESSION_SECRET = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "endocricheck-fallback-secret-2025";
const ADMIN_OPEN_ID = "admin-local";

/**
 * Minimal self-contained JWT (HS256) implementation using Node.js crypto.
 * Does NOT depend on the jose library or ENV.appId.
 */
function base64url(data: string | Buffer): string {
  const buf = typeof data === "string" ? Buffer.from(data, "utf8") : data;
  return buf.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

function createLocalJWT(payload: Record<string, unknown>, secret: string, expiresInMs: number): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const now = Math.floor(Date.now() / 1000);
  const exp = now + Math.floor(expiresInMs / 1000);
  const body = base64url(JSON.stringify({ ...payload, iat: now, exp }));
  const signingInput = `${header}.${body}`;
  const sig = base64url(createHmac("sha256", secret).update(signingInput).digest());
  return `${signingInput}.${sig}`;
}

function verifyLocalJWT(token: string, secret: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expected = base64url(createHmac("sha256", secret).update(`${header}.${body}`).digest());
    if (sig !== expected) return null;
    const payload = JSON.parse(Buffer.from(body, "base64").toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function registerOAuthRoutes(app: Express) {
  // ── POST /api/auth/login — verifica senha e cria sessão
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    const { password } = req.body as { password?: string };

    console.log("[Auth] Login attempt, password provided:", !!password);

    if (!password || password !== DASHBOARD_PASSWORD) {
      console.log("[Auth] Wrong password");
      res.status(401).json({ ok: false, error: "Senha incorreta" });
      return;
    }

    try {
      // Use self-contained JWT that doesn't depend on jose or ENV.appId
      const sessionToken = createLocalJWT(
        {
          openId: ADMIN_OPEN_ID,
          appId: "endocricheck-local",
          name: "Administrador",
        },
        SESSION_SECRET,
        ONE_YEAR_MS
      );

      const cookieOptions = getSessionCookieOptions(req);
      res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });
      console.log("[Auth] Login successful, cookie set");
      res.json({ ok: true });
    } catch (error) {
      console.error("[Auth] Login failed:", error);
      res.status(500).json({ ok: false, error: "Erro interno ao criar sessão", detail: String(error) });
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

// Export for use in sdk.ts to verify local tokens
export { verifyLocalJWT, SESSION_SECRET };
