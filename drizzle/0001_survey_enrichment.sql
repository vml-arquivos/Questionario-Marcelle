-- Migration: Survey Enrichment (Parte 2)
-- Adds all new columns to survey_responses table for research enrichment

-- Social determinants of health
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "educationLevel" varchar(30);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "incomeRange" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "existingDiagnosis" varchar(100);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "onMedication" varchar(10);

-- Detailed eating habits
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sugaryDrinksFrequency" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "fastFoodFrequency" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "breakfastFrequency" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "lateNightEating" varchar(10);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "dietType" varchar(30);

-- Digital behavior / screen time
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "screenTimeHours" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "socialMediaHours" varchar(20);

-- Sleep quality details
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sleepHoursPerNight" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "wakeUpTired" varchar(10);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "sleepLatency" varchar(20);

-- Mental health and stress
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "stressLevel" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "anxietyFrequency" varchar(20);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "mentalHealthDiagnosis" varchar(10);

-- New high-value diagnostic symptoms
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomHairLoss" integer;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomBrainFog" integer;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomConstantHunger" integer;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomFrequentUrination" integer;
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "symptomPalpitations" integer;

-- Female-specific health
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "irregularMenstrualCycle" varchar(10);
ALTER TABLE "survey_responses" ADD COLUMN IF NOT EXISTS "pcosDiagnosis" varchar(10);
