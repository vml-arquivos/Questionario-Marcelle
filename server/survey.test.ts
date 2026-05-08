import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database
vi.mock("./db", () => ({
  createSurveyResponse: vi.fn(async () => ({ id: 1 })),
  getAllSurveyResponses: vi.fn(async () => [
    {
      id: 1,
      userType: "student",
      age: 20,
      gender: "male",
      weight: "70",
      height: "175",
      bmi: "22.86",
      ultraProcessedFreq: "sometimes",
      fruitsVegetablesFreq: "frequently",
      sweetsFreq: "rarely",
      mealsPerDay: "3",
      waterLitersPerDay: "2",
      physicalActivityHours: ">=4",
      smokingStatus: "never",
      alcoholFrequency: "rarely",
      sleepQuality: "good",
      bloodPressureMedication: null,
      symptomFatigue: 0,
      symptomWeightChange: 0,
      symptomExcessiveThirst: 0,
      symptomTemperatureSensitivity: 0,
      symptomDrySkin: 0,
      symptomMoodChanges: 0,
      highBloodGlucoseHistory: null,
      familyDiabetes: null,
      familyThyroidIssues: null,
      familyObesity: null,
      findrisc_score: 0,
      findrisc_risk_category: "low",
      submittedAt: new Date(),
      ipAddress: "127.0.0.1",
      userAgent: "test",
    },
  ]),
}));

function createPublicContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin User",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "Regular User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: {
      protocol: "https",
      headers: {},
      socket: { remoteAddress: "127.0.0.1" },
    } as any,
    res: {
      clearCookie: vi.fn(),
    } as any,
  };
}

describe("Survey API", () => {
  describe("survey.submit", () => {
    it("should accept valid survey submission", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const weight = 70;
      const height = 175;
      const bmi = weight / ((height / 100) ** 2);

      const result = await caller.survey.submit({
        userType: "student",
        age: 20,
        gender: "male",
        weight,
        height,
        bmi,
        ultraProcessedFreq: "sometimes",
        fruitsVegetablesFreq: "frequently",
        sweetsFreq: "rarely",
        mealsPerDay: 3,
        waterLitersPerDay: 2,
        physicalActivityHours: ">=4",
        smokingStatus: "never",
        alcoholFrequency: "rarely",
        sleepQuality: "good",
        bloodPressureMedication: null,
        symptomFatigue: 0,
        symptomWeightChange: 0,
        symptomExcessiveThirst: 0,
        symptomTemperatureSensitivity: 0,
        symptomDrySkin: 0,
        symptomMoodChanges: 0,
        highBloodGlucoseHistory: null,
        familyDiabetes: null,
        familyThyroidIssues: null,
        familyObesity: null,
      });

      expect(result.success).toBe(true);
    });

    it("should accept survey with high risk factors", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);
      const weight = 95;
      const height = 175;
      const bmi = weight / ((height / 100) ** 2);

      const result = await caller.survey.submit({
        userType: "employee",
        age: 60,
        gender: "male",
        weight,
        height,
        bmi,
        ultraProcessedFreq: "frequently",
        fruitsVegetablesFreq: "rarely",
        sweetsFreq: "frequently",
        mealsPerDay: 2,
        waterLitersPerDay: 1,
        physicalActivityHours: "<4",
        smokingStatus: "yes",
        alcoholFrequency: "frequently",
        sleepQuality: "poor",
        bloodPressureMedication: "yes",
        symptomFatigue: 1,
        symptomWeightChange: 1,
        symptomExcessiveThirst: 1,
        symptomTemperatureSensitivity: 0,
        symptomDrySkin: 0,
        symptomMoodChanges: 0,
        highBloodGlucoseHistory: "yes",
        familyDiabetes: "1st_degree",
        familyThyroidIssues: null,
        familyObesity: null,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("survey.getStats", () => {
    it("should require authentication", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.survey.getStats();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).code).toBe("UNAUTHORIZED");
      }
    });

    it("should return stats for authenticated users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const stats = await caller.survey.getStats();

      expect(stats).toBeDefined();
      expect(stats.total).toBeGreaterThanOrEqual(0);
      expect(stats.averageBMI).toBeDefined();
      expect(stats.averageFINDRISC).toBeDefined();
      expect(stats.byUserType).toBeDefined();
      expect(stats.byGender).toBeDefined();
      expect(stats.byAgeGroup).toBeDefined();
      expect(stats.byBMICategory).toBeDefined();
      expect(stats.byFINDRISCRisk).toBeDefined();
    });
  });

  describe("survey.getResponses", () => {
    it("should deny access for non-admin users", async () => {
      const ctx = createUserContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.survey.getResponses();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).code).toBe("FORBIDDEN");
      }
    });

    it("should deny access for unauthenticated users", async () => {
      const ctx = createPublicContext();
      const caller = appRouter.createCaller(ctx);

      try {
        await caller.survey.getResponses();
        expect.fail("Should have thrown an error");
      } catch (error) {
        expect((error as any).code).toBe("UNAUTHORIZED");
      }
    });

    it("should return responses for admin users", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const responses = await caller.survey.getResponses();

      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBeGreaterThanOrEqual(0);
    });
  });

  describe("auth.logout", () => {
    it("should clear session cookie on logout", async () => {
      const ctx = createAdminContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.auth.logout();

      expect(result.success).toBe(true);
    });
  });
});
