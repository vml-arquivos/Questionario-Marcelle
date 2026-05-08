import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { CheckCircle2, Loader2, ChevronLeft, ChevronRight } from "lucide-react";

interface FormData {
  age: string;
  gender: string;
  weight: string;
  height: string;
  existingDiagnosis: string;
  onMedication: string;
  ultraProcessedFreq: string;
  fruitsVegetablesFreq: string;
  sweetsFreq: string;
  sugaryDrinksFrequency: string;
  fastFoodFrequency: string;
  breakfastFrequency: string;
  lateNightEating: string;
  dietType: string;
  mealsPerDay: string;
  waterLitersPerDay: string;
  physicalActivityHours: string;
  smokingStatus: string;
  alcoholFrequency: string;
  screenTimeHours: string;
  socialMediaHours: string;
  sleepQuality: string;
  sleepHoursPerNight: string;
  wakeUpTired: string;
  sleepLatency: string;
  bloodPressureMedication: string;
  stressLevel: string;
  anxietyFrequency: string;
  mentalHealthDiagnosis: string;
  symptomFatigue: boolean;
  symptomWeightChange: boolean;
  symptomExcessiveThirst: boolean;
  symptomTemperatureSensitivity: boolean;
  symptomDrySkin: boolean;
  symptomMoodChanges: boolean;
  highBloodGlucoseHistory: string;
  symptomHairLoss: boolean;
  symptomBrainFog: boolean;
  symptomConstantHunger: boolean;
  symptomFrequentUrination: boolean;
  symptomPalpitations: boolean;
  irregularMenstrualCycle: string;
  pcosDiagnosis: string;
  familyDiabetes: string;
  familyThyroidIssues: string;
  familyObesity: string;
}

const initialFormData: FormData = {
  age: "",
  gender: "",
  weight: "",
  height: "",
  existingDiagnosis: "",
  onMedication: "",
  ultraProcessedFreq: "",
  fruitsVegetablesFreq: "",
  sweetsFreq: "",
  sugaryDrinksFrequency: "",
  fastFoodFrequency: "",
  breakfastFrequency: "",
  lateNightEating: "",
  dietType: "",
  mealsPerDay: "",
  waterLitersPerDay: "",
  physicalActivityHours: "",
  smokingStatus: "",
  alcoholFrequency: "",
  screenTimeHours: "",
  socialMediaHours: "",
  sleepQuality: "",
  sleepHoursPerNight: "",
  wakeUpTired: "",
  sleepLatency: "",
  bloodPressureMedication: "",
  stressLevel: "",
  anxietyFrequency: "",
  mentalHealthDiagnosis: "",
  symptomFatigue: false,
  symptomWeightChange: false,
  symptomExcessiveThirst: false,
  symptomTemperatureSensitivity: false,
  symptomDrySkin: false,
  symptomMoodChanges: false,
  highBloodGlucoseHistory: "",
  symptomHairLoss: false,
  symptomBrainFog: false,
  symptomConstantHunger: false,
  symptomFrequentUrination: false,
  symptomPalpitations: false,
  irregularMenstrualCycle: "",
  pcosDiagnosis: "",
  familyDiabetes: "",
  familyThyroidIssues: "",
  familyObesity: "",
};

function getAgeGroup(age: number): string {
  if (age < 13) return "Criança (até 12)";
  if (age <= 17) return "Adolescente (13-17)";
  if (age <= 24) return "Jovem Adulto (18-24)";
  if (age <= 39) return "Adulto (25-39)";
  if (age <= 59) return "Adulto Maduro (40-59)";
  return "Idoso (60+)";
}

export default function SurveyForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = trpc.survey.submit.useMutation();

  const bmi = useMemo(() => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100;
      if (w > 0 && h > 0) return (w / (h * h)).toFixed(1);
    }
    return null;
  }, [formData.weight, formData.height]);

  const bmiCategory = useMemo(() => {
    if (!bmi) return null;
    const b = parseFloat(bmi);
    if (b < 18.5) return { label: "Abaixo do peso", color: "text-blue-600" };
    if (b < 25) return { label: "Peso normal", color: "text-green-600" };
    if (b < 30) return { label: "Sobrepeso", color: "text-yellow-600" };
    return { label: "Obesidade", color: "text-red-600" };
  }, [bmi]);

  const showFemaleSection = formData.gender === "female";
  const totalSections = showFemaleSection ? 7 : 6;

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleNext = () => {
    if (currentSection === 4 && !showFemaleSection) {
      setCurrentSection(5);
    } else {
      setCurrentSection((prev) => Math.min(totalSections - 1, prev + 1));
    }
  };

  const handlePrev = () => {
    if (currentSection === 5 && !showFemaleSection) {
      setCurrentSection(4);
    } else {
      setCurrentSection((prev) => Math.max(0, prev - 1));
    }
  };

  const isLastSection = showFemaleSection ? currentSection === 6 : currentSection === 5;
  const isFirstSection = currentSection === 0;

  const handleSubmit = async () => {
    try {
      if (!formData.age || !formData.gender || !formData.weight || !formData.height) {
        toast.error("Por favor, preencha os campos obrigatórios: idade, sexo, peso e altura.");
        return;
      }
      if (!bmi) {
        toast.error("Não foi possível calcular o IMC. Verifique peso e altura.");
        return;
      }

      const ageNum = parseInt(formData.age);
      const ageGroup = getAgeGroup(ageNum);

      await submitMutation.mutateAsync({
        userType: ageGroup,
        age: ageNum,
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        bmi: parseFloat(bmi),
        existingDiagnosis: formData.existingDiagnosis || null,
        onMedication: formData.onMedication || null,
        ultraProcessedFreq: formData.ultraProcessedFreq || null,
        fruitsVegetablesFreq: formData.fruitsVegetablesFreq || null,
        sweetsFreq: formData.sweetsFreq || null,
        sugaryDrinksFrequency: formData.sugaryDrinksFrequency || null,
        fastFoodFrequency: formData.fastFoodFrequency || null,
        breakfastFrequency: formData.breakfastFrequency || null,
        lateNightEating: formData.lateNightEating || null,
        dietType: formData.dietType || null,
        mealsPerDay: formData.mealsPerDay ? parseFloat(formData.mealsPerDay) : null,
        waterLitersPerDay: formData.waterLitersPerDay ? parseFloat(formData.waterLitersPerDay) : null,
        physicalActivityHours: formData.physicalActivityHours || null,
        smokingStatus: formData.smokingStatus || null,
        alcoholFrequency: formData.alcoholFrequency || null,
        screenTimeHours: formData.screenTimeHours || null,
        socialMediaHours: formData.socialMediaHours || null,
        sleepQuality: formData.sleepQuality || null,
        sleepHoursPerNight: formData.sleepHoursPerNight || null,
        wakeUpTired: formData.wakeUpTired || null,
        sleepLatency: formData.sleepLatency || null,
        bloodPressureMedication: formData.bloodPressureMedication || null,
        stressLevel: formData.stressLevel || null,
        anxietyFrequency: formData.anxietyFrequency || null,
        mentalHealthDiagnosis: formData.mentalHealthDiagnosis || null,
        symptomFatigue: formData.symptomFatigue ? 1 : 0,
        symptomWeightChange: formData.symptomWeightChange ? 1 : 0,
        symptomExcessiveThirst: formData.symptomExcessiveThirst ? 1 : 0,
        symptomTemperatureSensitivity: formData.symptomTemperatureSensitivity ? 1 : 0,
        symptomDrySkin: formData.symptomDrySkin ? 1 : 0,
        symptomMoodChanges: formData.symptomMoodChanges ? 1 : 0,
        highBloodGlucoseHistory: formData.highBloodGlucoseHistory || null,
        symptomHairLoss: formData.symptomHairLoss ? 1 : 0,
        symptomBrainFog: formData.symptomBrainFog ? 1 : 0,
        symptomConstantHunger: formData.symptomConstantHunger ? 1 : 0,
        symptomFrequentUrination: formData.symptomFrequentUrination ? 1 : 0,
        symptomPalpitations: formData.symptomPalpitations ? 1 : 0,
        irregularMenstrualCycle: formData.irregularMenstrualCycle || null,
        pcosDiagnosis: formData.pcosDiagnosis || null,
        familyDiabetes: formData.familyDiabetes || null,
        familyThyroidIssues: formData.familyThyroidIssues || null,
        familyObesity: formData.familyObesity || null,
      });

      setSubmitted(true);
      toast.success("Pesquisa salva com sucesso! Obrigado por participar.");
      setTimeout(() => {
        setFormData(initialFormData);
        setCurrentSection(0);
        setSubmitted(false);
      }, 4000);
    } catch (error) {
      toast.error("Erro ao salvar a pesquisa. Tente novamente.");
      console.error(error);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <Card className="w-full max-w-md shadow-lg">
          <CardContent className="pt-8 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2 text-indigo-900">Obrigado!</h2>
            <p className="text-gray-600 mb-2">Sua pesquisa foi salva com sucesso.</p>
            <p className="text-sm text-gray-500">Redirecionando em alguns segundos...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sectionTitles = [
    "Informações Básicas",
    "Hábitos Alimentares",
    "Estilo de Vida",
    "Saúde Mental e Estresse",
    "Sintomas",
    ...(showFemaleSection ? ["Saúde Feminina"] : []),
    "Histórico Familiar",
  ];

  const sectionTitle = sectionTitles[currentSection] ?? "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-1">EndocriCheck</h1>
          <p className="text-gray-600 text-sm">Pesquisa de Saúde Endocrinológica · Anônima e Voluntária</p>
        </div>

        <div className="mb-4">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Seção {currentSection + 1} de {totalSections}</span>
            <span>{Math.round(((currentSection + 1) / totalSections) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / totalSections) * 100}%` }}
            />
          </div>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle className="text-xl text-indigo-900">{sectionTitle}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">

            {/* ===== SEÇÃO 0 — INFORMAÇÕES BÁSICAS ===== */}
            {currentSection === 0 && (
              <>
                <div>
                  <Label htmlFor="age" className="text-base font-semibold mb-2 block">Idade <span className="text-red-500">*</span></Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 16"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    min={1}
                    max={120}
                  />
                  {formData.age && (
                    <p className="text-xs text-indigo-600 mt-1">
                      Faixa etária: <strong>{getAgeGroup(parseInt(formData.age))}</strong>
                    </p>
                  )}
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Sexo <span className="text-red-500">*</span></Label>
                  <RadioGroup value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                    {[
                      { value: "male", label: "Masculino" },
                      { value: "female", label: "Feminino" },
                      { value: "other", label: "Outro" },
                      { value: "prefer_not_to_say", label: "Prefiro não dizer" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`gender-${opt.value}`} />
                        <Label htmlFor={`gender-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="weight" className="text-base font-semibold mb-2 block">Peso (kg) <span className="text-red-500">*</span></Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="Ex: 65"
                      value={formData.weight}
                      onChange={(e) => handleInputChange("weight", e.target.value)}
                      min={1}
                    />
                  </div>
                  <div>
                    <Label htmlFor="height" className="text-base font-semibold mb-2 block">Altura (cm) <span className="text-red-500">*</span></Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="Ex: 168"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                {bmi && bmiCategory && (
                  <div className="p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-sm text-indigo-700">
                      IMC: <strong>{bmi}</strong> — <span className={bmiCategory.color}>{bmiCategory.label}</span>
                    </p>
                  </div>
                )}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Você tem algum diagnóstico médico?</Label>
                  <Select value={formData.existingDiagnosis} onValueChange={(v) => handleInputChange("existingDiagnosis", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Nenhum</SelectItem>
                      <SelectItem value="diabetes">Diabetes</SelectItem>
                      <SelectItem value="hypertension">Hipertensão</SelectItem>
                      <SelectItem value="thyroid">Problema de Tireoide</SelectItem>
                      <SelectItem value="obesity">Obesidade</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Toma algum medicamento regularmente?</Label>
                  <RadioGroup value={formData.onMedication} onValueChange={(v) => handleInputChange("onMedication", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`med-${opt.value}`} />
                        <Label htmlFor={`med-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 1 — HÁBITOS ALIMENTARES ===== */}
            {currentSection === 1 && (
              <>
                {[
                  { field: "ultraProcessedFreq", label: "Com que frequência você come alimentos ultraprocessados? (salgadinhos, biscoitos, macarrão instantâneo, nuggets...)" },
                  { field: "fruitsVegetablesFreq", label: "Com que frequência você come frutas e verduras?" },
                  { field: "sweetsFreq", label: "Com que frequência você come doces, bolos ou sobremesas?" },
                  { field: "sugaryDrinksFrequency", label: "Com que frequência você bebe refrigerantes ou sucos industrializados?" },
                  { field: "fastFoodFrequency", label: "Com que frequência você come fast food (McDonald's, pizza, hambúrguer...)?" },
                  { field: "breakfastFrequency", label: "Com que frequência você toma café da manhã?" },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <Label className="text-base font-semibold mb-3 block">{label}</Label>
                    <RadioGroup value={(formData as Record<string, string>)[field]} onValueChange={(v) => handleInputChange(field as keyof FormData, v)}>
                      {[
                        { value: "never", label: "Nunca" },
                        { value: "rarely", label: "Raramente (1-2x/semana)" },
                        { value: "sometimes", label: "Às vezes (3-4x/semana)" },
                        { value: "often", label: "Frequentemente (5-6x/semana)" },
                        { value: "daily", label: "Todos os dias" },
                      ].map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2 mb-1">
                          <RadioGroupItem value={opt.value} id={`${field}-${opt.value}`} />
                          <Label htmlFor={`${field}-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você come após as 22h?</Label>
                  <RadioGroup value={formData.lateNightEating} onValueChange={(v) => handleInputChange("lateNightEating", v)}>
                    {[{ value: "yes", label: "Sim, frequentemente" }, { value: "sometimes", label: "Às vezes" }, { value: "no", label: "Não" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`late-${opt.value}`} />
                        <Label htmlFor={`late-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Quantas refeições você faz por dia?</Label>
                  <Select value={formData.mealsPerDay} onValueChange={(v) => handleInputChange("mealsPerDay", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      {["1", "2", "3", "4", "5", "6+"].map((n) => (
                        <SelectItem key={n} value={n}>{n} refeição{n !== "1" ? "s" : ""}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Quantos litros de água você bebe por dia?</Label>
                  <Select value={formData.waterLitersPerDay} onValueChange={(v) => handleInputChange("waterLitersPerDay", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="0.5">Menos de 1 litro</SelectItem>
                      <SelectItem value="1">1 litro</SelectItem>
                      <SelectItem value="1.5">1,5 litro</SelectItem>
                      <SelectItem value="2">2 litros</SelectItem>
                      <SelectItem value="2.5">2,5 litros</SelectItem>
                      <SelectItem value="3">3 litros ou mais</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Como você descreveria sua alimentação?</Label>
                  <Select value={formData.dietType} onValueChange={(v) => handleInputChange("dietType", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Onívora (como de tudo)</SelectItem>
                      <SelectItem value="vegetarian">Vegetariana</SelectItem>
                      <SelectItem value="vegan">Vegana</SelectItem>
                      <SelectItem value="low_carb">Low carb / Cetogênica</SelectItem>
                      <SelectItem value="other">Outra</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 2 — ESTILO DE VIDA ===== */}
            {currentSection === 2 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Quantas horas por semana você pratica atividade física?</Label>
                  <RadioGroup value={formData.physicalActivityHours} onValueChange={(v) => handleInputChange("physicalActivityHours", v)}>
                    {[
                      { value: "none", label: "Não pratico" },
                      { value: "1-2", label: "1-2 horas" },
                      { value: "3-4", label: "3-4 horas" },
                      { value: "5-7", label: "5-7 horas" },
                      { value: "8+", label: "8 horas ou mais" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`act-${opt.value}`} />
                        <Label htmlFor={`act-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você fuma?</Label>
                  <RadioGroup value={formData.smokingStatus} onValueChange={(v) => handleInputChange("smokingStatus", v)}>
                    {[{ value: "never", label: "Nunca fumei" }, { value: "ex", label: "Ex-fumante" }, { value: "yes", label: "Sim, fumo" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`smoke-${opt.value}`} />
                        <Label htmlFor={`smoke-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com que frequência você consome bebidas alcoólicas?</Label>
                  <RadioGroup value={formData.alcoholFrequency} onValueChange={(v) => handleInputChange("alcoholFrequency", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "weekly", label: "Semanalmente" },
                      { value: "daily", label: "Diariamente" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`alc-${opt.value}`} />
                        <Label htmlFor={`alc-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Quantas horas por dia você fica em frente a telas (celular, TV, computador)?</Label>
                  <RadioGroup value={formData.screenTimeHours} onValueChange={(v) => handleInputChange("screenTimeHours", v)}>
                    {[
                      { value: "0-2", label: "Menos de 2 horas" },
                      { value: "2-4", label: "2-4 horas" },
                      { value: "4-6", label: "4-6 horas" },
                      { value: "6-8", label: "6-8 horas" },
                      { value: "8+", label: "Mais de 8 horas" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`screen-${opt.value}`} />
                        <Label htmlFor={`screen-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Como você avalia sua qualidade de sono?</Label>
                  <RadioGroup value={formData.sleepQuality} onValueChange={(v) => handleInputChange("sleepQuality", v)}>
                    {[
                      { value: "very_good", label: "Muito boa" },
                      { value: "good", label: "Boa" },
                      { value: "fair", label: "Regular" },
                      { value: "poor", label: "Ruim" },
                      { value: "very_poor", label: "Muito ruim" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`sleep-${opt.value}`} />
                        <Label htmlFor={`sleep-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Quantas horas você dorme por noite em média?</Label>
                  <RadioGroup value={formData.sleepHoursPerNight} onValueChange={(v) => handleInputChange("sleepHoursPerNight", v)}>
                    {[
                      { value: "less5", label: "Menos de 5 horas" },
                      { value: "5-6", label: "5-6 horas" },
                      { value: "7-8", label: "7-8 horas (ideal)" },
                      { value: "9+", label: "9 horas ou mais" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`sleeph-${opt.value}`} />
                        <Label htmlFor={`sleeph-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 3 — SAÚDE MENTAL ===== */}
            {currentSection === 3 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Como você avalia seu nível de estresse no dia a dia?</Label>
                  <RadioGroup value={formData.stressLevel} onValueChange={(v) => handleInputChange("stressLevel", v)}>
                    {[
                      { value: "low", label: "Baixo — me sinto tranquilo(a)" },
                      { value: "moderate", label: "Moderado — estresso às vezes" },
                      { value: "high", label: "Alto — estresso com frequência" },
                      { value: "very_high", label: "Muito alto — estresse constante" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`stress-${opt.value}`} />
                        <Label htmlFor={`stress-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com que frequência você sente ansiedade?</Label>
                  <RadioGroup value={formData.anxietyFrequency} onValueChange={(v) => handleInputChange("anxietyFrequency", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "often", label: "Frequentemente" },
                      { value: "always", label: "Sempre" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`anx-${opt.value}`} />
                        <Label htmlFor={`anx-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você tem diagnóstico de algum transtorno de saúde mental?</Label>
                  <RadioGroup value={formData.mentalHealthDiagnosis} onValueChange={(v) => handleInputChange("mentalHealthDiagnosis", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "unsure", label: "Não sei" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`mh-${opt.value}`} />
                        <Label htmlFor={`mh-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 4 — SINTOMAS ===== */}
            {currentSection === 4 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Marque os sintomas que você sente com frequência:</Label>
                  <div className="space-y-3">
                    {[
                      { field: "symptomFatigue", label: "Cansaço / Fadiga excessiva" },
                      { field: "symptomWeightChange", label: "Variação de peso sem motivo aparente" },
                      { field: "symptomExcessiveThirst", label: "Sede excessiva" },
                      { field: "symptomTemperatureSensitivity", label: "Sensibilidade ao calor ou frio" },
                      { field: "symptomDrySkin", label: "Pele seca ou ressecada" },
                      { field: "symptomMoodChanges", label: "Alterações de humor frequentes" },
                      { field: "symptomHairLoss", label: "Queda de cabelo" },
                      { field: "symptomBrainFog", label: "Névoa mental / dificuldade de concentração" },
                      { field: "symptomConstantHunger", label: "Fome constante" },
                      { field: "symptomFrequentUrination", label: "Urinar com muita frequência" },
                      { field: "symptomPalpitations", label: "Palpitações cardíacas" },
                    ].map(({ field, label }) => (
                      <div key={field} className="flex items-center space-x-3">
                        <Checkbox
                          id={field}
                          checked={(formData as Record<string, boolean>)[field]}
                          onCheckedChange={(checked) => handleInputChange(field as keyof FormData, checked === true)}
                        />
                        <Label htmlFor={field} className="font-normal cursor-pointer">{label}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você já teve glicemia (açúcar no sangue) alta?</Label>
                  <RadioGroup value={formData.highBloodGlucoseHistory} onValueChange={(v) => handleInputChange("highBloodGlucoseHistory", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "unknown", label: "Não sei" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`gluc-${opt.value}`} />
                        <Label htmlFor={`gluc-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você toma medicação para pressão arterial?</Label>
                  <RadioGroup value={formData.bloodPressureMedication} onValueChange={(v) => handleInputChange("bloodPressureMedication", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`bp-${opt.value}`} />
                        <Label htmlFor={`bp-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 5 — SAÚDE FEMININA (condicional) ===== */}
            {showFemaleSection && currentSection === 5 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Seu ciclo menstrual é irregular?</Label>
                  <RadioGroup value={formData.irregularMenstrualCycle} onValueChange={(v) => handleInputChange("irregularMenstrualCycle", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "unsure", label: "Não sei" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`mc-${opt.value}`} />
                        <Label htmlFor={`mc-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você tem diagnóstico de SOP (Síndrome dos Ovários Policísticos)?</Label>
                  <RadioGroup value={formData.pcosDiagnosis} onValueChange={(v) => handleInputChange("pcosDiagnosis", v)}>
                    {[{ value: "yes", label: "Sim" }, { value: "no", label: "Não" }, { value: "unsure", label: "Não sei" }].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-1">
                        <RadioGroupItem value={opt.value} id={`pcos-${opt.value}`} />
                        <Label htmlFor={`pcos-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO FINAL — HISTÓRICO FAMILIAR ===== */}
            {((!showFemaleSection && currentSection === 5) || (showFemaleSection && currentSection === 6)) && (
              <>
                {[
                  { field: "familyDiabetes", label: "Alguém na sua família tem diabetes?" },
                  { field: "familyThyroidIssues", label: "Alguém na sua família tem problemas de tireoide?" },
                  { field: "familyObesity", label: "Alguém na sua família tem obesidade?" },
                ].map(({ field, label }) => (
                  <div key={field}>
                    <Label className="text-base font-semibold mb-3 block">{label}</Label>
                    <RadioGroup value={(formData as Record<string, string>)[field]} onValueChange={(v) => handleInputChange(field as keyof FormData, v)}>
                      {[
                        { value: "no", label: "Não" },
                        { value: "2nd_degree", label: "Sim, parente de 2º grau (avós, tios)" },
                        { value: "1st_degree", label: "Sim, parente de 1º grau (pais, irmãos)" },
                        { value: "unknown", label: "Não tenho certeza" },
                      ].map((opt) => (
                        <div key={opt.value} className="flex items-center space-x-2 mb-1">
                          <RadioGroupItem value={opt.value} id={`${field}-${opt.value}`} />
                          <Label htmlFor={`${field}-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                ))}
              </>
            )}

          </CardContent>
        </Card>

        {/* Navegação */}
        <div className="flex justify-between mt-4 gap-4">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={isFirstSection}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="w-4 h-4" /> Anterior
          </Button>

          {isLastSection ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold"
            >
              {submitMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" />Enviando...</>
              ) : (
                "Enviar Pesquisa"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700"
            >
              Próximo <ChevronRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
