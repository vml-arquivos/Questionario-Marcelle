import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { createSurveyResponse, getAllSurveyResponses } from "./db";

function calculateFINDRISC(input: {
  age: number;
  gender: string;
  bmi: number;
  bloodPressureMedication: string | null;
  highBloodGlucoseHistory: string | null;
  physicalActivityHours: string | null;
  fruitsVegetablesFreq: string | null;
  familyDiabetes: string | null;
}) {
  let score = 0;

  if (input.age >= 45 && input.age < 55) score += 2;
  else if (input.age >= 55 && input.age < 65) score += 3;
  else if (input.age >= 65) score += 4;

  if (input.bmi >= 25 && input.bmi < 30) score += 1;
  else if (input.bmi >= 30) score += 3;

  if (input.bloodPressureMedication === "yes") score += 2;

  if (input.highBloodGlucoseHistory === "yes") score += 5;

  if (input.physicalActivityHours === "<4") score += 2;

  if (input.fruitsVegetablesFreq !== "yes" && input.fruitsVegetablesFreq !== "always" && input.fruitsVegetablesFreq !== "frequently") {
    score += 1;
  }

  if (input.familyDiabetes === "2nd_degree") score += 3;
  else if (input.familyDiabetes === "1st_degree") score += 5;

  let category: string;
  if (score < 7) category = "low";
  else if (score >= 7 && score < 12) category = "slightly_moderate";
  else if (score >= 12 && score < 15) category = "moderate";
  else if (score >= 15 && score < 21) category = "high";
  else category = "very_high";

  return { score, category };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  survey: router({
    submit: publicProcedure
      .input(
        z.object({
          userType: z.string(),
          age: z.number(),
          gender: z.string(),
          weight: z.number(),
          height: z.number(),
          bmi: z.number(),
          ultraProcessedFreq: z.string().nullable(),
          fruitsVegetablesFreq: z.string().nullable(),
          sweetsFreq: z.string().nullable(),
          mealsPerDay: z.number().nullable(),
          waterLitersPerDay: z.number().nullable(),
          physicalActivityHours: z.string().nullable(),
          smokingStatus: z.string().nullable(),
          alcoholFrequency: z.string().nullable(),
          sleepQuality: z.string().nullable(),
          bloodPressureMedication: z.string().nullable(),
          symptomFatigue: z.number(),
          symptomWeightChange: z.number(),
          symptomExcessiveThirst: z.number(),
          symptomTemperatureSensitivity: z.number(),
          symptomDrySkin: z.number(),
          symptomMoodChanges: z.number(),
          highBloodGlucoseHistory: z.string().nullable(),
          familyDiabetes: z.string().nullable(),
          familyThyroidIssues: z.string().nullable(),
          familyObesity: z.string().nullable(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const findrisc = calculateFINDRISC({
          age: input.age,
          gender: input.gender,
          bmi: input.bmi,
          bloodPressureMedication: input.bloodPressureMedication,
          highBloodGlucoseHistory: input.highBloodGlucoseHistory,
          physicalActivityHours: input.physicalActivityHours,
          fruitsVegetablesFreq: input.fruitsVegetablesFreq,
          familyDiabetes: input.familyDiabetes,
        });

        const ipAddress = (ctx.req.headers["x-forwarded-for"] as string) || ctx.req.socket?.remoteAddress || "";
        const userAgent = (ctx.req.headers["user-agent"] as string) || "";

        await createSurveyResponse({
          userType: input.userType,
          age: input.age,
          gender: input.gender,
          weight: input.weight.toString(),
          height: input.height.toString(),
          bmi: input.bmi.toString(),
          ultraProcessedFreq: input.ultraProcessedFreq,
          fruitsVegetablesFreq: input.fruitsVegetablesFreq,
          sweetsFreq: input.sweetsFreq,
          mealsPerDay: input.mealsPerDay ? input.mealsPerDay.toString() : null,
          waterLitersPerDay: input.waterLitersPerDay ? input.waterLitersPerDay.toString() : null,
          physicalActivityHours: input.physicalActivityHours,
          smokingStatus: input.smokingStatus,
          alcoholFrequency: input.alcoholFrequency,
          sleepQuality: input.sleepQuality,
          bloodPressureMedication: input.bloodPressureMedication,
          symptomFatigue: input.symptomFatigue,
          symptomWeightChange: input.symptomWeightChange,
          symptomExcessiveThirst: input.symptomExcessiveThirst,
          symptomTemperatureSensitivity: input.symptomTemperatureSensitivity,
          symptomDrySkin: input.symptomDrySkin,
          symptomMoodChanges: input.symptomMoodChanges,
          highBloodGlucoseHistory: input.highBloodGlucoseHistory,
          familyDiabetes: input.familyDiabetes,
          familyThyroidIssues: input.familyThyroidIssues,
          familyObesity: input.familyObesity,
          findrisc_score: findrisc.score,
          findrisc_risk_category: findrisc.category,
          ipAddress,
          userAgent,
        });

        return { success: true };
      }),

    getStats: protectedProcedure.query(async () => {
      const responses = await getAllSurveyResponses();
      const bmiValues = responses.map(r => parseFloat(String(r.bmi)));
      const findriScores = responses.map(r => r.findrisc_score || 0);

      return {
        total: responses.length,
        byUserType: {
          student: responses.filter((r) => r.userType === "student").length,
          employee: responses.filter((r) => r.userType === "employee").length,
          adult: responses.filter((r) => r.userType === "adult").length,
        },
        byGender: {
          male: responses.filter((r) => r.gender === "male").length,
          female: responses.filter((r) => r.gender === "female").length,
          other: responses.filter((r) => r.gender === "other").length,
          prefer_not_to_say: responses.filter((r) => r.gender === "prefer_not_to_say").length,
        },
        byAgeGroup: {
          "18-25": responses.filter((r) => r.age >= 18 && r.age < 26).length,
          "26-35": responses.filter((r) => r.age >= 26 && r.age < 36).length,
          "36-45": responses.filter((r) => r.age >= 36 && r.age < 46).length,
          "46-55": responses.filter((r) => r.age >= 46 && r.age < 56).length,
          "56+": responses.filter((r) => r.age >= 56).length,
        },
        byBMICategory: {
          underweight: responses.filter((r) => parseFloat(String(r.bmi)) < 18.5).length,
          normal: responses.filter((r) => parseFloat(String(r.bmi)) >= 18.5 && parseFloat(String(r.bmi)) < 25).length,
          overweight: responses.filter((r) => parseFloat(String(r.bmi)) >= 25 && parseFloat(String(r.bmi)) < 30).length,
          obese: responses.filter((r) => parseFloat(String(r.bmi)) >= 30).length,
        },
        byFINDRISCRisk: {
          low: responses.filter((r) => r.findrisc_risk_category === "low").length,
          slightly_moderate: responses.filter((r) => r.findrisc_risk_category === "slightly_moderate").length,
          moderate: responses.filter((r) => r.findrisc_risk_category === "moderate").length,
          high: responses.filter((r) => r.findrisc_risk_category === "high").length,
          very_high: responses.filter((r) => r.findrisc_risk_category === "very_high").length,
        },
        averageBMI: bmiValues.length > 0 ? (bmiValues.reduce((a, b) => a + b, 0) / bmiValues.length).toFixed(1) : "0",
        averageFINDRISC: findriScores.length > 0 ? (findriScores.reduce((a, b) => a + b, 0) / findriScores.length).toFixed(1) : "0",
      };
    }),

    getResponses: protectedProcedure.query(async ({ ctx }) => {
      if (ctx.user?.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Apenas administradores podem acessar as respostas completas",
        });
      }
      return await getAllSurveyResponses();
    }),
  }),
});

export type AppRouter = typeof appRouter;
