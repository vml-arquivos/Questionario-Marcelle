import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import path from "path";
import { fileURLToPath } from "url";
import { Pool } from "pg";
import {
  InsertSurveyResponse,
  InsertUser,
  surveyResponses,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let _db: ReturnType<typeof drizzle> | null = null;
let _migrated = false;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(pool);
      // Run migrations automatically on first connection
      if (!_migrated) {
        try {
          const migrationsFolder = path.resolve(__dirname, "../drizzle");
          await migrate(_db, { migrationsFolder });
          _migrated = true;
          console.log("[Database] Migrations applied successfully");
        } catch (migErr) {
          console.warn("[Database] Migration warning (non-fatal):", migErr);
          _migrated = true; // Don't retry on every request
        }
      }
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = { openId: user.openId };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = "admin";
      updateSet.role = "admin";
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    // PostgreSQL upsert — uses onConflictDoUpdate instead of MySQL's onDuplicateKeyUpdate
    await db
      .insert(users)
      .values(values)
      .onConflictDoUpdate({
        target: users.openId,
        set: updateSet,
      });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);

  return result.length > 0 ? result[0] : undefined;
}

export async function createSurveyResponse(data: InsertSurveyResponse) {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db.insert(surveyResponses).values(data);
    return result;
  } catch (error) {
    console.error("[Database] Failed to create survey response:", error);
    throw error;
  }
}

export async function getAllSurveyResponses() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const results = await db.select().from(surveyResponses);
    return results;
  } catch (error) {
    console.error("[Database] Failed to fetch survey responses:", error);
    throw error;
  }
}

export async function getSurveyResponseCount() {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  try {
    const result = await db
      .select({ count: sql`COUNT(*)` })
      .from(surveyResponses);
    return result[0]?.count || 0;
  } catch (error) {
    console.error("[Database] Failed to count survey responses:", error);
    throw error;
  }
}

// TODO: add feature queries here as your schema grows.
