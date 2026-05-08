import { eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import {
  InsertSurveyResponse,
  InsertUser,
  surveyResponses,
  users,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;
let _migrated = false;

/**
 * Runs all schema migrations inline using raw SQL with IF NOT EXISTS guards.
 * This approach is container-safe and does not depend on migration files on disk.
 */
async function runInlineMigrations(db: ReturnType<typeof drizzle>) {
  const statements = [
    // ── Initial table (idempotent) ─────────────────────────────────────────
    `CREATE TABLE IF NOT EXISTS "survey_responses" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "userType" varchar(50) NOT NULL,
      "age" integer NOT NULL,
      "gender" varchar(50) NOT NULL,
      "weight" varchar(10) NOT NULL,
      "height" varchar(10) NOT NULL,
      "bmi" varchar(10) NOT NULL,
      "ultraProcessedFreq" varchar(50),
      "fruitsVegetablesFreq" varchar(50),
      "sweetsFreq" varchar(50),
      "mealsPerDay" varchar(10),
      "waterLitersPerDay" varchar(10),
      "physicalActivityHours" varchar(50),
      "smokingStatus" varchar(50),
      "alcoholFrequency" varchar(50),
      "sleepQuality" varchar(50),
      "bloodPressureMedication" varchar(50),
      "symptomFatigue" integer,
      "symptomWeightChange" integer,
      "symptomExcessiveThirst" integer,
      "symptomTemperatureSensitivity" integer,
      "symptomDrySkin" integer,
      "symptomMoodChanges" integer,
      "highBloodGlucoseHistory" varchar(50),
      "familyDiabetes" varchar(50),
      "familyThyroidIssues" varchar(50),
      "familyObesity" varchar(50),
      "findrisc_score" integer,
      "findrisc_risk_category" varchar(50),
      "submittedAt" timestamp DEFAULT now() NOT NULL,
      "ipAddress" varchar(45),
      "userAgent" text
    )`,
    // ── Survey enrichment columns (Parte 2) ───────────────────────────────
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "existingDiagnosis" varchar(100)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "onMedication" varchar(10)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sugaryDrinksFrequency" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "fastFoodFrequency" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "breakfastFrequency" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "lateNightEating" varchar(10)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "dietType" varchar(30)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "screenTimeHours" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "socialMediaHours" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sleepHoursPerNight" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "wakeUpTired" varchar(10)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sleepLatency" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "stressLevel" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "anxietyFrequency" varchar(20)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "mentalHealthDiagnosis" varchar(10)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomHairLoss" integer`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomBrainFog" integer`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomConstantHunger" integer`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomFrequentUrination" integer`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomPalpitations" integer`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "irregularMenstrualCycle" varchar(10)`,
    `ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "pcosDiagnosis" varchar(10)`,
    // ── Users table (idempotent) ───────────────────────────────────────────
    `DO $$ BEGIN
      IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE user_role AS ENUM ('user', 'admin');
      END IF;
    END $$`,
    `CREATE TABLE IF NOT EXISTS "users" (
      "id" integer PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
      "openId" varchar(64) NOT NULL UNIQUE,
      "name" text,
      "email" varchar(320),
      "loginMethod" varchar(64),
      "role" user_role DEFAULT 'user' NOT NULL,
      "createdAt" timestamp DEFAULT now() NOT NULL,
      "updatedAt" timestamp DEFAULT now() NOT NULL,
      "lastSignedIn" timestamp DEFAULT now() NOT NULL
    )`,
  ];

  for (const stmt of statements) {
    try {
      await db.execute(sql.raw(stmt));
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      // Ignore "already exists" errors — they are expected on re-runs
      if (!msg.includes("already exists") && !msg.includes("duplicate")) {
        console.warn("[Migration] Non-fatal warning:", msg.substring(0, 200));
      }
    }
  }
  console.log("[Database] Inline migrations complete");
}

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      const pool = new Pool({ connectionString: process.env.DATABASE_URL });
      _db = drizzle(pool);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  // Run migrations once after connection is established
  if (_db && !_migrated) {
    _migrated = true; // Set early to prevent concurrent runs
    await runInlineMigrations(_db);
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
