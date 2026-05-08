import { describe, expect, it } from "vitest";

/**
 * Calculate FINDRISC score based on survey input
 * Returns score (0-26) and risk category
 */
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

  // Age: <45 (0), 45-54 (+2), 55-64 (+3), >64 (+4)
  if (input.age >= 45 && input.age < 55) score += 2;
  else if (input.age >= 55 && input.age < 65) score += 3;
  else if (input.age >= 65) score += 4;

  // BMI: <25 (0), 25-29.9 (+1), >=30 (+3)
  if (input.bmi >= 25 && input.bmi < 30) score += 1;
  else if (input.bmi >= 30) score += 3;

  // Blood pressure medication: No (0), Yes (+2)
  if (input.bloodPressureMedication === "yes") score += 2;

  // High blood glucose history: No (0), Yes (+5)
  if (input.highBloodGlucoseHistory === "yes") score += 5;

  // Physical activity: >=4h/week (0), <4h/week (+2)
  if (input.physicalActivityHours === "<4") score += 2;

  // Fruits/vegetables consumption: Yes (0), No (+1)
  if (input.fruitsVegetablesFreq !== "yes" && input.fruitsVegetablesFreq !== "always" && input.fruitsVegetablesFreq !== "frequently") {
    score += 1;
  }

  // Family history of diabetes: No (0), 2nd degree (+3), 1st degree (+5)
  if (input.familyDiabetes === "2nd_degree") score += 3;
  else if (input.familyDiabetes === "1st_degree") score += 5;

  // Determine risk category
  let category: string;
  if (score < 7) category = "low";
  else if (score >= 7 && score < 12) category = "slightly_moderate";
  else if (score >= 12 && score < 15) category = "moderate";
  else if (score >= 15 && score < 21) category = "high";
  else category = "very_high";

  return { score, category };
}

describe("calculateFINDRISC", () => {
  it("should return low risk for young person with healthy BMI and no risk factors", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "male",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(0);
    expect(result.category).toBe("low");
  });

  it("should calculate age score correctly for 45-54 age group", () => {
    const result = calculateFINDRISC({
      age: 50,
      gender: "female",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(2);
    expect(result.category).toBe("low");
  });

  it("should calculate age score correctly for 55-64 age group", () => {
    const result = calculateFINDRISC({
      age: 60,
      gender: "female",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(3);
    expect(result.category).toBe("low");
  });

  it("should calculate age score correctly for 65+ age group", () => {
    const result = calculateFINDRISC({
      age: 70,
      gender: "male",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(4);
    expect(result.category).toBe("low");
  });

  it("should calculate BMI score correctly for overweight (25-29.9)", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "male",
      bmi: 27,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(1);
    expect(result.category).toBe("low");
  });

  it("should calculate BMI score correctly for obese (>=30)", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "female",
      bmi: 32,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(3);
    expect(result.category).toBe("low");
  });

  it("should add points for blood pressure medication", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "male",
      bmi: 22,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(2);
    expect(result.category).toBe("low");
  });

  it("should add points for high blood glucose history", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "female",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: "yes",
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(5);
    expect(result.category).toBe("low");
  });

  it("should add points for low physical activity", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "male",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: null,
    });

    expect(result.score).toBe(2);
    expect(result.category).toBe("low");
  });

  it("should add points for low fruit/vegetable consumption", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "female",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "rarely",
      familyDiabetes: null,
    });

    expect(result.score).toBe(1);
    expect(result.category).toBe("low");
  });

  it("should add points for family history of diabetes (2nd degree)", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "male",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: "2nd_degree",
    });

    expect(result.score).toBe(3);
    expect(result.category).toBe("low");
  });

  it("should add points for family history of diabetes (1st degree)", () => {
    const result = calculateFINDRISC({
      age: 30,
      gender: "female",
      bmi: 22,
      bloodPressureMedication: null,
      highBloodGlucoseHistory: null,
      physicalActivityHours: ">=4",
      fruitsVegetablesFreq: "frequently",
      familyDiabetes: "1st_degree",
    });

    expect(result.score).toBe(5);
    expect(result.category).toBe("low");
  });

  it("should categorize as slightly_moderate (7-11 points)", () => {
    const result = calculateFINDRISC({
      age: 50,
      gender: "male",
      bmi: 27,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: null,
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "rarely",
      familyDiabetes: null,
    });

    expect(result.score).toBeGreaterThanOrEqual(7);
    expect(result.score).toBeLessThan(12);
    expect(result.category).toBe("slightly_moderate");
  });

  it("should categorize as moderate (12-14 points)", () => {
    const result = calculateFINDRISC({
      age: 60,
      gender: "female",
      bmi: 32,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: null,
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "rarely",
      familyDiabetes: "2nd_degree",
    });

    expect(result.score).toBeGreaterThanOrEqual(12);
    expect(result.score).toBeLessThan(15);
    expect(result.category).toBe("moderate");
  });

  it("should categorize as high (15-20 points)", () => {
    const result = calculateFINDRISC({
      age: 60,
      gender: "male",
      bmi: 32,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: "yes",
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "rarely",
      familyDiabetes: "2nd_degree",
    });

    expect(result.score).toBeGreaterThanOrEqual(15);
    expect(result.score).toBeLessThan(21);
    expect(result.category).toBe("high");
  });

  it("should categorize as very_high (21+ points)", () => {
    const result = calculateFINDRISC({
      age: 70,
      gender: "female",
      bmi: 32,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: "yes",
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "rarely",
      familyDiabetes: "1st_degree",
    });

    expect(result.score).toBeGreaterThanOrEqual(21);
    expect(result.category).toBe("very_high");
  });

  it("should handle maximum score correctly", () => {
    const result = calculateFINDRISC({
      age: 70,
      gender: "male",
      bmi: 35,
      bloodPressureMedication: "yes",
      highBloodGlucoseHistory: "yes",
      physicalActivityHours: "<4",
      fruitsVegetablesFreq: "never",
      familyDiabetes: "1st_degree",
    });

    // 4 (age) + 3 (bmi) + 2 (bp) + 5 (glucose) + 2 (activity) + 1 (fruits) + 5 (family) = 22
    expect(result.score).toBe(22);
    expect(result.category).toBe("very_high");
  });
});
