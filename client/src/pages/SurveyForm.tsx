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
  participantName: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  // Social determinants
  existingDiagnosis: string;
  onMedication: string;
  // Eating habits
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
  // Lifestyle
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
  // Mental health
  stressLevel: string;
  anxietyFrequency: string;
  mentalHealthDiagnosis: string;
  // Symptoms
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
  // Female health
  irregularMenstrualCycle: string;
  pcosDiagnosis: string;
  // Family history
  familyDiabetes: string;
  familyThyroidIssues: string;
  familyObesity: string;
}

const initialFormData: FormData = {
  participantName: "",
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

export default function SurveyForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const submitMutation = trpc.survey.submit.useMutation();

  const bmi = useMemo(() => {
    if (formData.weight && formData.height) {
      const w = parseFloat(formData.weight);
      const h = parseFloat(formData.height) / 100;
      if (w > 0 && h > 0) {
        return (w / (h * h)).toFixed(1);
      }
    }
    return null;
  }, [formData.weight, formData.height]);

  const showFemaleSection = formData.gender === "female";
  const totalSections = showFemaleSection ? 7 : 6;

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [field]: checked }));
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
        toast.error("Por favor, preencha os campos obrigatórios: idade, gênero, peso e altura.");
        return;
      }
      if (!bmi) {
        toast.error("Não foi possível calcular o IMC. Verifique peso e altura.");
        return;
      }

      await submitMutation.mutateAsync({
        userType: parseInt(formData.age) < 18 ? "student" : "adult",
        age: parseInt(formData.age),
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
      }, 3000);
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
            <h2 className="text-2xl font-bold mb-2">Obrigado!</h2>
            <p className="text-gray-600 mb-4">Sua pesquisa foi salva com sucesso.</p>
            <p className="text-sm text-gray-500">Redirecionando...</p>
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
          <p className="text-gray-600 text-sm">Pesquisa de Saúde Endocrinológica</p>
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
                  <Label htmlFor="participantName" className="text-base font-semibold mb-2 block">Nome (opcional)</Label>
                  <Input
                    id="participantName"
                    placeholder="Seu nome ou apelido"
                    value={formData.participantName}
                    onChange={(e) => handleInputChange("participantName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="age" className="text-base font-semibold mb-2 block">Idade <span className="text-red-500">*</span></Label>
                  <Input
                    id="age"
                    type="number"
                    placeholder="Ex: 25"
                    value={formData.age}
                    onChange={(e) => handleInputChange("age", e.target.value)}
                    min={1}
                    max={120}
                  />
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Gênero <span className="text-red-500">*</span></Label>
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
                      placeholder="Ex: 70"
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
                      placeholder="Ex: 170"
                      value={formData.height}
                      onChange={(e) => handleInputChange("height", e.target.value)}
                      min={1}
                    />
                  </div>
                </div>
                {bmi && (
                  <div className="p-3 bg-indigo-50 rounded-lg text-center">
                    <p className="text-sm text-indigo-700">IMC calculado: <strong>{bmi}</strong></p>
                  </div>
                )}
                <div>
                  <Label className="text-base font-semibold mb-2 block">Você tem algum diagnóstico médico já existente?</Label>
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
                  <Label className="text-base font-semibold mb-3 block">Você toma algum medicamento regularmente?</Label>
                  <RadioGroup value={formData.onMedication} onValueChange={(v) => handleInputChange("onMedication", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="med-yes" />
                      <Label htmlFor="med-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="med-no" />
                      <Label htmlFor="med-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 1 — HÁBITOS ALIMENTARES ===== */}
            {currentSection === 1 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com que frequência você consome alimentos ultraprocessados? (salgadinhos, biscoitos recheados, embutidos)</Label>
                  <RadioGroup value={formData.ultraProcessedFreq} onValueChange={(v) => handleInputChange("ultraProcessedFreq", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "frequently", label: "Frequentemente" },
                      { value: "always", label: "Todos os dias" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`ultra-${opt.value}`} />
                        <Label htmlFor={`ultra-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com que frequência você consome frutas e vegetais?</Label>
                  <RadioGroup value={formData.fruitsVegetablesFreq} onValueChange={(v) => handleInputChange("fruitsVegetablesFreq", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "frequently", label: "Frequentemente" },
                      { value: "always", label: "Todos os dias" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`fv-${opt.value}`} />
                        <Label htmlFor={`fv-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Com que frequência você consome doces e açúcar?</Label>
                  <RadioGroup value={formData.sweetsFreq} onValueChange={(v) => handleInputChange("sweetsFreq", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "frequently", label: "Frequentemente" },
                      { value: "always", label: "Todos os dias" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sweets-${opt.value}`} />
                        <Label htmlFor={`sweets-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Refrigerantes e bebidas açucaradas:</Label>
                  <RadioGroup value={formData.sugaryDrinksFrequency} onValueChange={(v) => handleInputChange("sugaryDrinksFrequency", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "frequently", label: "Frequentemente" },
                      { value: "always", label: "Todos os dias" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sugary-${opt.value}`} />
                        <Label htmlFor={`sugary-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Fast food ou delivery (hambúrguer, pizza, frango frito):</Label>
                  <RadioGroup value={formData.fastFoodFrequency} onValueChange={(v) => handleInputChange("fastFoodFrequency", v)}>
                    {[
                      { value: "never", label: "Nunca" },
                      { value: "rarely", label: "Raramente" },
                      { value: "1-2x_week", label: "1-2x por semana" },
                      { value: "3-5x_week", label: "3-5x por semana" },
                      { value: "daily", label: "Todos os dias" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`ff-${opt.value}`} />
                        <Label htmlFor={`ff-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você toma café da manhã?</Label>
                  <RadioGroup value={formData.breakfastFrequency} onValueChange={(v) => handleInputChange("breakfastFrequency", v)}>
                    {[
                      { value: "always", label: "Sempre" },
                      { value: "sometimes", label: "Às vezes" },
                      { value: "rarely", label: "Raramente" },
                      { value: "never", label: "Nunca" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`bf-${opt.value}`} />
                        <Label htmlFor={`bf-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você come após as 22h regularmente?</Label>
                  <RadioGroup value={formData.lateNightEating} onValueChange={(v) => handleInputChange("lateNightEating", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="lne-yes" />
                      <Label htmlFor="lne-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="sometimes" id="lne-sometimes" />
                      <Label htmlFor="lne-sometimes" className="font-normal cursor-pointer">Às vezes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="lne-no" />
                      <Label htmlFor="lne-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-2 block">Tipo de dieta:</Label>
                  <Select value={formData.dietType} onValueChange={(v) => handleInputChange("dietType", v)}>
                    <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="omnivore">Onívoro (como tudo)</SelectItem>
                      <SelectItem value="vegetarian">Vegetariano</SelectItem>
                      <SelectItem value="vegan">Vegano</SelectItem>
                      <SelectItem value="keto">Low carb / Keto</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="mealsPerDay" className="text-base font-semibold mb-2 block">Quantas refeições você faz por dia?</Label>
                  <Input
                    id="mealsPerDay"
                    type="number"
                    placeholder="Ex: 3"
                    value={formData.mealsPerDay}
                    onChange={(e) => handleInputChange("mealsPerDay", e.target.value)}
                    min={1}
                    max={10}
                  />
                </div>
                <div>
                  <Label htmlFor="waterLitersPerDay" className="text-base font-semibold mb-2 block">Quantos litros de água você bebe por dia?</Label>
                  <Input
                    id="waterLitersPerDay"
                    type="number"
                    placeholder="Ex: 2"
                    value={formData.waterLitersPerDay}
                    onChange={(e) => handleInputChange("waterLitersPerDay", e.target.value)}
                    min={0}
                    step={0.5}
                  />
                </div>
              </>
            )}

            {/* ===== SEÇÃO 2 — ESTILO DE VIDA ===== */}
            {currentSection === 2 && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Nível de atividade física semanal:</Label>
                  <RadioGroup value={formData.physicalActivityHours} onValueChange={(v) => handleInputChange("physicalActivityHours", v)}>
                    {[
                      { value: "sedentary", label: "Sedentário (menos de 1h/semana)" },
                      { value: "light", label: "Pouco ativo (1-2h/semana)" },
                      { value: "moderate", label: "Moderadamente ativo (3-4h/semana)" },
                      { value: "active", label: "Ativo (5-7h/semana)" },
                      { value: "very_active", label: "Muito ativo (mais de 7h/semana)" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`pa-${opt.value}`} />
                        <Label htmlFor={`pa-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você fuma?</Label>
                  <RadioGroup value={formData.smokingStatus} onValueChange={(v) => handleInputChange("smokingStatus", v)}>
                    {[
                      { value: "never", label: "Nunca fumei" },
                      { value: "former", label: "Ex-fumante" },
                      { value: "occasional", label: "Fumo ocasionalmente" },
                      { value: "daily", label: "Fumo diariamente" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
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
                      { value: "social", label: "Socialmente (fins de semana)" },
                      { value: "frequent", label: "Frequentemente" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`alc-${opt.value}`} />
                        <Label htmlFor={`alc-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Horas de tela por dia (celular, computador, TV):</Label>
                  <RadioGroup value={formData.screenTimeHours} onValueChange={(v) => handleInputChange("screenTimeHours", v)}>
                    {[
                      { value: "<2", label: "Menos de 2h" },
                      { value: "2-4", label: "2-4h" },
                      { value: "4-6", label: "4-6h" },
                      { value: "6-8", label: "6-8h" },
                      { value: ">8", label: "Mais de 8h" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`st-${opt.value}`} />
                        <Label htmlFor={`st-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Horas em redes sociais por dia:</Label>
                  <RadioGroup value={formData.socialMediaHours} onValueChange={(v) => handleInputChange("socialMediaHours", v)}>
                    {[
                      { value: "<1", label: "Menos de 1h" },
                      { value: "1-2", label: "1-2h" },
                      { value: "2-4", label: "2-4h" },
                      { value: ">4", label: "Mais de 4h" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sm-${opt.value}`} />
                        <Label htmlFor={`sm-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Como você avalia a qualidade do seu sono?</Label>
                  <RadioGroup value={formData.sleepQuality} onValueChange={(v) => handleInputChange("sleepQuality", v)}>
                    {[
                      { value: "poor", label: "Ruim" },
                      { value: "fair", label: "Regular" },
                      { value: "good", label: "Boa" },
                      { value: "excellent", label: "Excelente" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sq-${opt.value}`} />
                        <Label htmlFor={`sq-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Quantas horas você dorme por noite?</Label>
                  <RadioGroup value={formData.sleepHoursPerNight} onValueChange={(v) => handleInputChange("sleepHoursPerNight", v)}>
                    {[
                      { value: "<5", label: "Menos de 5h" },
                      { value: "5-6", label: "5-6h" },
                      { value: "6-7", label: "6-7h" },
                      { value: "7-8", label: "7-8h" },
                      { value: "8-9", label: "8-9h" },
                      { value: ">9", label: "Mais de 9h" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sh-${opt.value}`} />
                        <Label htmlFor={`sh-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você acorda cansado mesmo depois de dormir?</Label>
                  <RadioGroup value={formData.wakeUpTired} onValueChange={(v) => handleInputChange("wakeUpTired", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="wut-yes" />
                      <Label htmlFor="wut-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="sometimes" id="wut-sometimes" />
                      <Label htmlFor="wut-sometimes" className="font-normal cursor-pointer">Às vezes</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="wut-no" />
                      <Label htmlFor="wut-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Quanto tempo você leva para dormir depois de deitar?</Label>
                  <RadioGroup value={formData.sleepLatency} onValueChange={(v) => handleInputChange("sleepLatency", v)}>
                    {[
                      { value: "<15min", label: "Menos de 15 minutos" },
                      { value: "15-30min", label: "15-30 minutos" },
                      { value: "30-60min", label: "30-60 minutos" },
                      { value: ">60min", label: "Mais de 1 hora" },
                    ].map((opt) => (
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`sl-${opt.value}`} />
                        <Label htmlFor={`sl-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 3 — SAÚDE MENTAL E ESTRESSE ===== */}
            {currentSection === 3 && (
              <>
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-2">
                  <p className="text-sm text-blue-800">
                    <strong>Saúde mental e estresse têm impacto direto no sistema endócrino.</strong> Suas respostas são completamente anônimas e serão usadas apenas para fins científicos.
                  </p>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Qual é o seu nível de estresse atual?</Label>
                  <RadioGroup value={formData.stressLevel} onValueChange={(v) => handleInputChange("stressLevel", v)}>
                    {[
                      { value: "low", label: "Baixo" },
                      { value: "moderate", label: "Moderado" },
                      { value: "high", label: "Alto" },
                      { value: "very_high", label: "Muito alto" },
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
                      <div key={opt.value} className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value={opt.value} id={`anx-${opt.value}`} />
                        <Label htmlFor={`anx-${opt.value}`} className="font-normal cursor-pointer">{opt.label}</Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você tem diagnóstico de ansiedade, depressão ou outro transtorno mental?</Label>
                  <RadioGroup value={formData.mentalHealthDiagnosis} onValueChange={(v) => handleInputChange("mentalHealthDiagnosis", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="mhd-yes" />
                      <Label htmlFor="mhd-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="mhd-no" />
                      <Label htmlFor="mhd-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="mhd-unsure" />
                      <Label htmlFor="mhd-unsure" className="font-normal cursor-pointer">Prefiro não dizer</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 4 — SINTOMAS ===== */}
            {currentSection === 4 && (
              <>
                <p className="text-sm text-gray-600 mb-4">Selecione todos os sintomas que você apresenta ou apresentou recentemente:</p>
                <div className="space-y-3">
                  {[
                    { field: "symptomFatigue" as keyof FormData, label: "Cansaço excessivo / fadiga constante" },
                    { field: "symptomWeightChange" as keyof FormData, label: "Ganho ou perda de peso sem motivo aparente" },
                    { field: "symptomExcessiveThirst" as keyof FormData, label: "Sede excessiva" },
                    { field: "symptomTemperatureSensitivity" as keyof FormData, label: "Sensibilidade ao calor ou ao frio" },
                    { field: "symptomDrySkin" as keyof FormData, label: "Pele seca ou ressecada" },
                    { field: "symptomMoodChanges" as keyof FormData, label: "Alterações de humor frequentes" },
                    { field: "symptomHairLoss" as keyof FormData, label: "Queda de cabelo além do normal" },
                    { field: "symptomBrainFog" as keyof FormData, label: '"Névoa mental" (dificuldade de concentração, esquecimento)' },
                    { field: "symptomConstantHunger" as keyof FormData, label: "Fome constante mesmo após comer" },
                    { field: "symptomFrequentUrination" as keyof FormData, label: "Urinar com muita frequência" },
                    { field: "symptomPalpitations" as keyof FormData, label: "Palpitações cardíacas sem causa aparente" },
                  ].map((item) => (
                    <div key={item.field} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50">
                      <Checkbox
                        id={item.field}
                        checked={formData[item.field] as boolean}
                        onCheckedChange={(checked) => handleCheckboxChange(item.field, checked as boolean)}
                        className="mt-0.5"
                      />
                      <Label htmlFor={item.field} className="font-normal cursor-pointer leading-snug">{item.label}</Label>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Label className="text-base font-semibold mb-3 block">Você toma medicação para pressão arterial?</Label>
                  <RadioGroup value={formData.bloodPressureMedication} onValueChange={(v) => handleInputChange("bloodPressureMedication", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="bpm-yes" />
                      <Label htmlFor="bpm-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="bpm-no" />
                      <Label htmlFor="bpm-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div className="mt-4">
                  <Label className="text-base font-semibold mb-3 block">Você já teve histórico de glicemia alta (açúcar no sangue)?</Label>
                  <RadioGroup value={formData.highBloodGlucoseHistory} onValueChange={(v) => handleInputChange("highBloodGlucoseHistory", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="hbg-yes" />
                      <Label htmlFor="hbg-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="no" id="hbg-no" />
                      <Label htmlFor="hbg-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO 5 — SAÚDE FEMININA (condicional) ===== */}
            {currentSection === 5 && showFemaleSection && (
              <>
                <div className="p-4 bg-pink-50 rounded-lg border border-pink-200 mb-2">
                  <p className="text-sm text-pink-800">
                    Esta seção é específica para saúde feminina. Condições como SOP e irregularidades menstruais têm forte relação com o sistema endócrino.
                  </p>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Seu ciclo menstrual é regular?</Label>
                  <RadioGroup value={formData.irregularMenstrualCycle} onValueChange={(v) => handleInputChange("irregularMenstrualCycle", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="imc-no" />
                      <Label htmlFor="imc-no" className="font-normal cursor-pointer">Sim, é regular</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="imc-yes" />
                      <Label htmlFor="imc-yes" className="font-normal cursor-pointer">Não, é irregular</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id="imc-na" />
                      <Label htmlFor="imc-na" className="font-normal cursor-pointer">Não se aplica (menopausa, etc.)</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Você tem diagnóstico de SOP (Síndrome dos Ovários Policísticos)?</Label>
                  <RadioGroup value={formData.pcosDiagnosis} onValueChange={(v) => handleInputChange("pcosDiagnosis", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="pcos-yes" />
                      <Label htmlFor="pcos-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="pcos-no" />
                      <Label htmlFor="pcos-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="unsure" id="pcos-unsure" />
                      <Label htmlFor="pcos-unsure" className="font-normal cursor-pointer">Não sei</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="na" id="pcos-na" />
                      <Label htmlFor="pcos-na" className="font-normal cursor-pointer">Não se aplica</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

            {/* ===== SEÇÃO HISTÓRICO FAMILIAR (5 sem feminino, 6 com feminino) ===== */}
            {((currentSection === 5 && !showFemaleSection) || (currentSection === 6 && showFemaleSection)) && (
              <>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem diabetes?</Label>
                  <RadioGroup value={formData.familyDiabetes} onValueChange={(v) => handleInputChange("familyDiabetes", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="fd-no" />
                      <Label htmlFor="fd-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="2nd_degree" id="fd-2nd" />
                      <Label htmlFor="fd-2nd" className="font-normal cursor-pointer">Sim, parente de 2º grau (avós, tios)</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="1st_degree" id="fd-1st" />
                      <Label htmlFor="fd-1st" className="font-normal cursor-pointer">Sim, parente de 1º grau (pais, irmãos)</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="fd-unsure" />
                      <Label htmlFor="fd-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem problemas de tireoide?</Label>
                  <RadioGroup value={formData.familyThyroidIssues} onValueChange={(v) => handleInputChange("familyThyroidIssues", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="ft-no" />
                      <Label htmlFor="ft-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="ft-yes" />
                      <Label htmlFor="ft-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="ft-unsure" />
                      <Label htmlFor="ft-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                    </div>
                  </RadioGroup>
                </div>
                <div>
                  <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem obesidade?</Label>
                  <RadioGroup value={formData.familyObesity} onValueChange={(v) => handleInputChange("familyObesity", v)}>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="no" id="fo-no" />
                      <Label htmlFor="fo-no" className="font-normal cursor-pointer">Não</Label>
                    </div>
                    <div className="flex items-center space-x-2 mb-2">
                      <RadioGroupItem value="yes" id="fo-yes" />
                      <Label htmlFor="fo-yes" className="font-normal cursor-pointer">Sim</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="unsure" id="fo-unsure" />
                      <Label htmlFor="fo-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                    </div>
                  </RadioGroup>
                </div>
              </>
            )}

          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={handlePrev}
            disabled={isFirstSection}
            variant="outline"
            className="flex-1 py-6 text-base"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            Anterior
          </Button>
          {isLastSection ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1 py-6 text-base bg-green-600 hover:bg-green-700"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Enviar Pesquisa"
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex-1 py-6 text-base"
            >
              Próximo
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
