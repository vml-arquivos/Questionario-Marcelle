import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: pgEnum("user_role", ["user", "admin"])("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt", { mode: "date" }).defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Survey responses table - stores all participant responses
 */
export const surveyResponses = pgTable("survey_responses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  
  // Demographic data
  userType: varchar("userType", { length: 50 }).notNull(), // "student", "employee", "adult"
  age: integer("age").notNull(),
  gender: varchar("gender", { length: 50 }).notNull(), // "male", "female", "other", "prefer_not_to_say"
  weight: varchar("weight", { length: 10 }).notNull(), // kg
  height: varchar("height", { length: 10 }).notNull(), // cm
  bmi: varchar("bmi", { length: 10 }).notNull(), // calculated

  // Social determinants of health
  educationLevel: varchar("educationLevel", { length: 30 }),     // "fundamental","medio","superior","pos_graduacao"
  incomeRange: varchar("incomeRange", { length: 20 }),           // "ate_1sm","1-3sm","3-5sm","5-10sm","acima_10sm"
  existingDiagnosis: varchar("existingDiagnosis", { length: 100 }), // "none","diabetes","hypertension","thyroid","obesity","other"
  onMedication: varchar("onMedication", { length: 10 }),         // "yes","no"

  // Eating habits
  ultraProcessedFreq: varchar("ultraProcessedFreq", { length: 50 }), // "never", "rarely", "sometimes", "frequently", "always"
  fruitsVegetablesFreq: varchar("fruitsVegetablesFreq", { length: 50 }),
  sweetsFreq: varchar("sweetsFreq", { length: 50 }),
  mealsPerDay: varchar("mealsPerDay", { length: 10 }),
  waterLitersPerDay: varchar("waterLitersPerDay", { length: 10 }),
  // New detailed food fields
  sugaryDrinksFrequency: varchar("sugaryDrinksFrequency", { length: 20 }), // "never","rarely","sometimes","frequently","always"
  fastFoodFrequency: varchar("fastFoodFrequency", { length: 20 }), // "never","rarely","1-2x_week","3-5x_week","daily"
  breakfastFrequency: varchar("breakfastFrequency", { length: 20 }), // "never","rarely","sometimes","always"
  lateNightEating: varchar("lateNightEating", { length: 10 }),   // "yes","no","sometimes"
  dietType: varchar("dietType", { length: 30 }),                 // "omnivore","vegetarian","vegan","keto","other"

  // Lifestyle
  physicalActivityHours: varchar("physicalActivityHours", { length: 50 }), // ">=4", "<4"
  smokingStatus: varchar("smokingStatus", { length: 50 }), // "never", "former", "occasional", "daily"
  alcoholFrequency: varchar("alcoholFrequency", { length: 50 }), // "never", "rarely", "social", "frequent"
  sleepQuality: varchar("sleepQuality", { length: 50 }), // "poor", "fair", "good", "excellent"
  bloodPressureMedication: varchar("bloodPressureMedication", { length: 50 }), // "yes", "no" - FINDRISC
  // New digital behavior fields
  screenTimeHours: varchar("screenTimeHours", { length: 20 }),   // "<2","2-4","4-6","6-8",">8"
  socialMediaHours: varchar("socialMediaHours", { length: 20 }), // "<1","1-2","2-4",">4"
  // New sleep quality fields
  sleepHoursPerNight: varchar("sleepHoursPerNight", { length: 20 }), // "<5","5-6","6-7","7-8","8-9",">9"
  wakeUpTired: varchar("wakeUpTired", { length: 10 }),           // "yes","no","sometimes"
  sleepLatency: varchar("sleepLatency", { length: 20 }),         // "<15min","15-30min","30-60min",">60min"

  // Mental health and stress (strong endocrine correlator)
  stressLevel: varchar("stressLevel", { length: 20 }),           // "low","moderate","high","very_high"
  anxietyFrequency: varchar("anxietyFrequency", { length: 20 }), // "never","rarely","sometimes","often","always"
  mentalHealthDiagnosis: varchar("mentalHealthDiagnosis", { length: 10 }), // "yes","no","unsure"

  // Endocrine symptoms (boolean flags)
  symptomFatigue: integer("symptomFatigue"), // 0 or 1
  symptomWeightChange: integer("symptomWeightChange"),
  symptomExcessiveThirst: integer("symptomExcessiveThirst"),
  symptomTemperatureSensitivity: integer("symptomTemperatureSensitivity"),
  symptomDrySkin: integer("symptomDrySkin"),
  symptomMoodChanges: integer("symptomMoodChanges"),
  highBloodGlucoseHistory: varchar("highBloodGlucoseHistory", { length: 50 }), // "yes", "no" - FINDRISC
  // New high-value diagnostic symptoms
  symptomHairLoss: integer("symptomHairLoss"),                   // 0 or 1
  symptomBrainFog: integer("symptomBrainFog"),                   // 0 or 1
  symptomConstantHunger: integer("symptomConstantHunger"),       // 0 or 1
  symptomFrequentUrination: integer("symptomFrequentUrination"), // 0 or 1
  symptomPalpitations: integer("symptomPalpitations"),           // 0 or 1

  // Female-specific health (thyroid, PCOS — high prevalence)
  irregularMenstrualCycle: varchar("irregularMenstrualCycle", { length: 10 }), // "yes","no","na"
  pcosDiagnosis: varchar("pcosDiagnosis", { length: 10 }),       // "yes","no","unsure","na"

  // Family history
  familyDiabetes: varchar("familyDiabetes", { length: 50 }), // "no", "2nd_degree", "1st_degree" - FINDRISC
  familyThyroidIssues: varchar("familyThyroidIssues", { length: 50 }), // "yes", "no"
  familyObesity: varchar("familyObesity", { length: 50 }), // "yes", "no"
  
  // FINDRISC scoring
  findrisc_score: integer("findrisc_score"),
  findrisc_risk_category: varchar("findrisc_risk_category", { length: 50 }), // "low", "slightly_moderate", "moderate", "high", "very_high"
  
  // Metadata
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
  ipAddress: varchar("ipAddress", { length: 45 }),
  userAgent: text("userAgent"),
});

export type SurveyResponse = typeof surveyResponses.$inferSelect;
export type InsertSurveyResponse = typeof surveyResponses.$inferInsert;