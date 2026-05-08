import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Survey responses table - stores all participant responses
 */
export const surveyResponses = mysqlTable("survey_responses", {
  id: int("id").autoincrement().primaryKey(),
  
  // Demographic data
  userType: varchar("userType", { length: 50 }).notNull(), // "student", "employee", "adult"
  age: int("age").notNull(),
  gender: varchar("gender", { length: 50 }).notNull(), // "male", "female", "other", "prefer_not_to_say"
  weight: decimal("weight", { precision: 5, scale: 2 }).notNull(), // kg
  height: decimal("height", { precision: 5, scale: 2 }).notNull(), // cm
  bmi: decimal("bmi", { precision: 5, scale: 2 }).notNull(), // calculated
  
  // Eating habits
  ultraProcessedFreq: varchar("ultraProcessedFreq", { length: 50 }), // "never", "rarely", "sometimes", "frequently", "always"
  fruitsVegetablesFreq: varchar("fruitsVegetablesFreq", { length: 50 }),
  sweetsFreq: varchar("sweetsFreq", { length: 50 }),
  mealsPerDay: varchar("mealsPerDay", { length: 10 }),
  waterLitersPerDay: varchar("waterLitersPerDay", { length: 10 }),
  
  // Lifestyle
  physicalActivityHours: varchar("physicalActivityHours", { length: 50 }), // ">=4", "<4"
  smokingStatus: varchar("smokingStatus", { length: 50 }), // "never", "former", "occasional", "daily"
  alcoholFrequency: varchar("alcoholFrequency", { length: 50 }), // "never", "rarely", "social", "frequent"
  sleepQuality: varchar("sleepQuality", { length: 50 }), // "poor", "fair", "good", "excellent"
  bloodPressureMedication: varchar("bloodPressureMedication", { length: 50 }), // "yes", "no" - FINDRISC
  
  // Endocrine symptoms (boolean flags)
  symptomFatigue: int("symptomFatigue"), // 0 or 1
  symptomWeightChange: int("symptomWeightChange"),
  symptomExcessiveThirst: int("symptomExcessiveThirst"),
  symptomTemperatureSensitivity: int("symptomTemperatureSensitivity"),
  symptomDrySkin: int("symptomDrySkin"),
  symptomMoodChanges: int("symptomMoodChanges"),
  highBloodGlucoseHistory: varchar("highBloodGlucoseHistory", { length: 50 }), // "yes", "no" - FINDRISC
  
  // Family history
  familyDiabetes: varchar("familyDiabetes", { length: 50 }), // "no", "2nd_degree", "1st_degree" - FINDRISC
  familyThyroidIssues: varchar("familyThyroidIssues", { length: 50 }), // "yes", "no"
  familyObesity: varchar("familyObesity", { length: 50 }), // "yes", "no"
  
  // FINDRISC scoring
  findrisc_score: int("findrisc_score"),
  findrisc_risk_category: varchar("findrisc_risk_category", { length: 50 }), // "low", "slightly_moderate", "moderate", "high", "very_high"
  
  // Metadata
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;