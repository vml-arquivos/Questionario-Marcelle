import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { QRCodeSVG as QRCode } from "qrcode.react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

interface FormData {
  userType: string;
  age: string;
  gender: string;
  weight: string;
  height: string;
  ultraProcessedFreq: string;
  fruitsVegetablesFreq: string;
  sweetsFreq: string;
  mealsPerDay: string;
  waterLitersPerDay: string;
  physicalActivityHours: string;
  smokingStatus: string;
  alcoholFrequency: string;
  sleepQuality: string;
  bloodPressureMedication: string;
  symptomFatigue: boolean;
  symptomWeightChange: boolean;
  symptomExcessiveThirst: boolean;
  symptomTemperatureSensitivity: boolean;
  symptomDrySkin: boolean;
  symptomMoodChanges: boolean;
  highBloodGlucoseHistory: string;
  familyDiabetes: string;
  familyThyroidIssues: string;
  familyObesity: string;
}

const initialFormData: FormData = {
  userType: "",
  age: "",
  gender: "",
  weight: "",
  height: "",
  ultraProcessedFreq: "",
  fruitsVegetablesFreq: "",
  sweetsFreq: "",
  mealsPerDay: "",
  waterLitersPerDay: "",
  physicalActivityHours: "",
  smokingStatus: "",
  alcoholFrequency: "",
  sleepQuality: "",
  bloodPressureMedication: "",
  symptomFatigue: false,
  symptomWeightChange: false,
  symptomExcessiveThirst: false,
  symptomTemperatureSensitivity: false,
  symptomDrySkin: false,
  symptomMoodChanges: false,
  highBloodGlucoseHistory: "",
  familyDiabetes: "",
  familyThyroidIssues: "",
  familyObesity: "",
};

const frequencyOptions = [
  { value: "never", label: "Nunca" },
  { value: "rarely", label: "Raramente" },
  { value: "sometimes", label: "Às vezes" },
  { value: "frequently", label: "Frequentemente" },
  { value: "always", label: "Sempre" },
];

export default function SurveyForm() {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [currentSection, setCurrentSection] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
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

  const handleInputChange = (field: keyof FormData, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckboxChange = (field: keyof FormData, checked: boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: checked,
    }));
  };

  const handleSubmit = async () => {
    if (!formData.userType || !formData.age || !formData.gender || !formData.weight || !formData.height) {
      toast.error("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    try {
      await submitMutation.mutateAsync({
        userType: formData.userType,
        age: parseInt(formData.age),
        gender: formData.gender,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        bmi: parseFloat(bmi || "0"),
        ultraProcessedFreq: formData.ultraProcessedFreq || null,
        fruitsVegetablesFreq: formData.fruitsVegetablesFreq || null,
        sweetsFreq: formData.sweetsFreq || null,
        mealsPerDay: formData.mealsPerDay ? parseInt(formData.mealsPerDay) : null,
        waterLitersPerDay: formData.waterLitersPerDay ? parseFloat(formData.waterLitersPerDay) : null,
        physicalActivityHours: formData.physicalActivityHours || null,
        smokingStatus: formData.smokingStatus || null,
        alcoholFrequency: formData.alcoholFrequency || null,
        sleepQuality: formData.sleepQuality || null,
        bloodPressureMedication: formData.bloodPressureMedication || null,
        symptomFatigue: formData.symptomFatigue ? 1 : 0,
        symptomWeightChange: formData.symptomWeightChange ? 1 : 0,
        symptomExcessiveThirst: formData.symptomExcessiveThirst ? 1 : 0,
        symptomTemperatureSensitivity: formData.symptomTemperatureSensitivity ? 1 : 0,
        symptomDrySkin: formData.symptomDrySkin ? 1 : 0,
        symptomMoodChanges: formData.symptomMoodChanges ? 1 : 0,
        highBloodGlucoseHistory: formData.highBloodGlucoseHistory || null,
        familyDiabetes: formData.familyDiabetes || null,
        familyThyroidIssues: formData.familyThyroidIssues || null,
        familyObesity: formData.familyObesity || null,
      });

      setSubmitted(true);
      toast.success("Pesquisa enviada com sucesso!");
      setFormData(initialFormData);
      setTimeout(() => setSubmitted(false), 5000);
    } catch (error) {
      toast.error("Erro ao enviar pesquisa. Tente novamente.");
      console.error(error);
    }
  };

  const sections = [
    {
      title: "Perfil Demográfico",
      description: "Informações básicas sobre você",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Você é:</Label>
            <RadioGroup value={formData.userType} onValueChange={(v) => handleInputChange("userType", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="student" id="student" />
                <Label htmlFor="student" className="font-normal cursor-pointer">
                  Aluno
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="employee" id="employee" />
                <Label htmlFor="employee" className="font-normal cursor-pointer">
                  Funcionário
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="adult" id="adult" />
                <Label htmlFor="adult" className="font-normal cursor-pointer">
                  Adulto
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="age">Idade (anos) *</Label>
              <Input
                id="age"
                type="number"
                min="1"
                max="120"
                value={formData.age}
                onChange={(e) => handleInputChange("age", e.target.value)}
                placeholder="Ex: 25"
              />
            </div>
            <div>
              <Label htmlFor="gender">Gênero *</Label>
              <Select value={formData.gender} onValueChange={(v) => handleInputChange("gender", v)}>
                <SelectTrigger id="gender">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Masculino</SelectItem>
                  <SelectItem value="female">Feminino</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                  <SelectItem value="prefer_not_to_say">Prefiro não dizer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="weight">Peso (kg) *</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                min="0"
                value={formData.weight}
                onChange={(e) => handleInputChange("weight", e.target.value)}
                placeholder="Ex: 70"
              />
            </div>
            <div>
              <Label htmlFor="height">Altura (cm) *</Label>
              <Input
                id="height"
                type="number"
                step="0.1"
                min="0"
                value={formData.height}
                onChange={(e) => handleInputChange("height", e.target.value)}
                placeholder="Ex: 175"
              />
            </div>
          </div>

          {bmi && (
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600">Seu IMC (Índice de Massa Corporal):</p>
                <p className="text-3xl font-bold text-blue-600">{bmi}</p>
                <p className="text-xs text-gray-500 mt-2">
                  {parseFloat(bmi) < 18.5 && "Baixo peso"}
                  {parseFloat(bmi) >= 18.5 && parseFloat(bmi) < 25 && "Peso normal"}
                  {parseFloat(bmi) >= 25 && parseFloat(bmi) < 30 && "Sobrepeso"}
                  {parseFloat(bmi) >= 30 && "Obeso"}
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      title: "Hábitos Alimentares",
      description: "Informações sobre sua alimentação",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Consumo de alimentos ultraprocessados</Label>
            <RadioGroup value={formData.ultraProcessedFreq} onValueChange={(v) => handleInputChange("ultraProcessedFreq", v)}>
              {frequencyOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`ultra_${opt.value}`} />
                  <Label htmlFor={`ultra_${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Consumo de frutas e verduras</Label>
            <RadioGroup value={formData.fruitsVegetablesFreq} onValueChange={(v) => handleInputChange("fruitsVegetablesFreq", v)}>
              {frequencyOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`fruits_${opt.value}`} />
                  <Label htmlFor={`fruits_${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Consumo de doces e açúcares</Label>
            <RadioGroup value={formData.sweetsFreq} onValueChange={(v) => handleInputChange("sweetsFreq", v)}>
              {frequencyOptions.map((opt) => (
                <div key={opt.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={opt.value} id={`sweets_${opt.value}`} />
                  <Label htmlFor={`sweets_${opt.value}`} className="font-normal cursor-pointer">
                    {opt.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mealsPerDay">Refeições por dia</Label>
              <Input
                id="mealsPerDay"
                type="number"
                min="1"
                max="6"
                value={formData.mealsPerDay}
                onChange={(e) => handleInputChange("mealsPerDay", e.target.value)}
                placeholder="Ex: 3"
              />
            </div>
            <div>
              <Label htmlFor="water">Água por dia (litros)</Label>
              <Input
                id="water"
                type="number"
                step="0.5"
                min="0"
                value={formData.waterLitersPerDay}
                onChange={(e) => handleInputChange("waterLitersPerDay", e.target.value)}
                placeholder="Ex: 2"
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Estilo de Vida",
      description: "Informações sobre seus hábitos",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Atividade Física</Label>
            <RadioGroup value={formData.physicalActivityHours} onValueChange={(v) => handleInputChange("physicalActivityHours", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value=">=4" id="activity_high" />
                <Label htmlFor="activity_high" className="font-normal cursor-pointer">
                  4 horas ou mais por semana
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="<4" id="activity_low" />
                <Label htmlFor="activity_low" className="font-normal cursor-pointer">
                  Menos de 4 horas por semana
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Hábito de Fumar</Label>
            <RadioGroup value={formData.smokingStatus} onValueChange={(v) => handleInputChange("smokingStatus", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="smoke_never" />
                <Label htmlFor="smoke_never" className="font-normal cursor-pointer">
                  Nunca fumei
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="former" id="smoke_former" />
                <Label htmlFor="smoke_former" className="font-normal cursor-pointer">
                  Ex-fumante
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="occasional" id="smoke_occasional" />
                <Label htmlFor="smoke_occasional" className="font-normal cursor-pointer">
                  Fumo ocasionalmente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="daily" id="smoke_daily" />
                <Label htmlFor="smoke_daily" className="font-normal cursor-pointer">
                  Fumo diariamente
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Consumo de Álcool</Label>
            <RadioGroup value={formData.alcoholFrequency} onValueChange={(v) => handleInputChange("alcoholFrequency", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="never" id="alcohol_never" />
                <Label htmlFor="alcohol_never" className="font-normal cursor-pointer">
                  Nunca
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="rarely" id="alcohol_rarely" />
                <Label htmlFor="alcohol_rarely" className="font-normal cursor-pointer">
                  Raramente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="social" id="alcohol_social" />
                <Label htmlFor="alcohol_social" className="font-normal cursor-pointer">
                  Socialmente
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="frequent" id="alcohol_frequent" />
                <Label htmlFor="alcohol_frequent" className="font-normal cursor-pointer">
                  Frequentemente
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Qualidade do Sono</Label>
            <RadioGroup value={formData.sleepQuality} onValueChange={(v) => handleInputChange("sleepQuality", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="poor" id="sleep_poor" />
                <Label htmlFor="sleep_poor" className="font-normal cursor-pointer">
                  Ruim
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="fair" id="sleep_fair" />
                <Label htmlFor="sleep_fair" className="font-normal cursor-pointer">
                  Regular
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="good" id="sleep_good" />
                <Label htmlFor="sleep_good" className="font-normal cursor-pointer">
                  Boa
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="excellent" id="sleep_excellent" />
                <Label htmlFor="sleep_excellent" className="font-normal cursor-pointer">
                  Excelente
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Usa medicação para pressão arterial?</Label>
            <RadioGroup value={formData.bloodPressureMedication} onValueChange={(v) => handleInputChange("bloodPressureMedication", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="bp_med_no" />
                <Label htmlFor="bp_med_no" className="font-normal cursor-pointer">
                  Não
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="bp_med_yes" />
                <Label htmlFor="bp_med_yes" className="font-normal cursor-pointer">
                  Sim
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: "Sintomas Endócrinos",
      description: "Marque os sintomas que você apresenta",
      content: (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="fatigue"
                checked={formData.symptomFatigue}
                onCheckedChange={(checked) => handleCheckboxChange("symptomFatigue", checked as boolean)}
              />
              <Label htmlFor="fatigue" className="font-normal cursor-pointer">
                Cansaço excessivo ou fadiga constante
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="weight_change"
                checked={formData.symptomWeightChange}
                onCheckedChange={(checked) => handleCheckboxChange("symptomWeightChange", checked as boolean)}
              />
              <Label htmlFor="weight_change" className="font-normal cursor-pointer">
                Alterações bruscas de peso
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="thirst"
                checked={formData.symptomExcessiveThirst}
                onCheckedChange={(checked) => handleCheckboxChange("symptomExcessiveThirst", checked as boolean)}
              />
              <Label htmlFor="thirst" className="font-normal cursor-pointer">
                Sede excessiva e vontade frequente de urinar
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="temp_sensitivity"
                checked={formData.symptomTemperatureSensitivity}
                onCheckedChange={(checked) => handleCheckboxChange("symptomTemperatureSensitivity", checked as boolean)}
              />
              <Label htmlFor="temp_sensitivity" className="font-normal cursor-pointer">
                Sensibilidade incomum ao frio ou calor
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="dry_skin"
                checked={formData.symptomDrySkin}
                onCheckedChange={(checked) => handleCheckboxChange("symptomDrySkin", checked as boolean)}
              />
              <Label htmlFor="dry_skin" className="font-normal cursor-pointer">
                Pele muito seca ou queda de cabelo excessiva
              </Label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="mood_changes"
                checked={formData.symptomMoodChanges}
                onCheckedChange={(checked) => handleCheckboxChange("symptomMoodChanges", checked as boolean)}
              />
              <Label htmlFor="mood_changes" className="font-normal cursor-pointer">
                Irritabilidade ou alterações de humor frequentes
              </Label>
            </div>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Histórico de glicemia elevada?</Label>
            <RadioGroup value={formData.highBloodGlucoseHistory} onValueChange={(v) => handleInputChange("highBloodGlucoseHistory", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="glucose_no" />
                <Label htmlFor="glucose_no" className="font-normal cursor-pointer">
                  Não
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="glucose_yes" />
                <Label htmlFor="glucose_yes" className="font-normal cursor-pointer">
                  Sim
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ),
    },
    {
      title: "Histórico Familiar",
      description: "Informações sobre sua família",
      content: (
        <div className="space-y-6">
          <div>
            <Label className="text-base font-semibold mb-3 block">Casos de Diabetes na família?</Label>
            <RadioGroup value={formData.familyDiabetes} onValueChange={(v) => handleInputChange("familyDiabetes", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="diabetes_no" />
                <Label htmlFor="diabetes_no" className="font-normal cursor-pointer">
                  Não
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="2nd_degree" id="diabetes_2nd" />
                <Label htmlFor="diabetes_2nd" className="font-normal cursor-pointer">
                  Sim, parente de 2º grau
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="1st_degree" id="diabetes_1st" />
                <Label htmlFor="diabetes_1st" className="font-normal cursor-pointer">
                  Sim, parente de 1º grau
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Casos de problemas de Tireoide?</Label>
            <RadioGroup value={formData.familyThyroidIssues} onValueChange={(v) => handleInputChange("familyThyroidIssues", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="thyroid_no" />
                <Label htmlFor="thyroid_no" className="font-normal cursor-pointer">
                  Não
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="thyroid_yes" />
                <Label htmlFor="thyroid_yes" className="font-normal cursor-pointer">
                  Sim
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div>
            <Label className="text-base font-semibold mb-3 block">Casos de Obesidade?</Label>
            <RadioGroup value={formData.familyObesity} onValueChange={(v) => handleInputChange("familyObesity", v)}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="no" id="obesity_no" />
                <Label htmlFor="obesity_no" className="font-normal cursor-pointer">
                  Não
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="yes" id="obesity_yes" />
                <Label htmlFor="obesity_yes" className="font-normal cursor-pointer">
                  Sim
                </Label>
              </div>
            </RadioGroup>
          </div>
        </div>
      ),
    },
  ];

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-green-200 bg-white shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <CheckCircle2 className="w-16 h-16 text-green-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Pesquisa Enviada!</h2>
            <p className="text-gray-600 mb-6">Obrigado por participar da pesquisa sobre saúde endócrina. Seus dados foram registrados com sucesso.</p>
            <Button onClick={() => window.location.reload()} className="w-full">
              Enviar Outra Pesquisa
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">EndocriCheck</h1>
          <p className="text-lg text-gray-600">Pesquisa sobre Saúde Endócrina</p>
          {showQRCode && (
            <div className="mt-6 flex justify-center">
              <Card className="p-6 bg-white shadow-lg">
                <QRCode value={window.location.href} size={256} level="H" includeMargin={true} />
                <p className="text-sm text-gray-600 mt-4 text-center">Escaneie para compartilhar este formulário</p>
              </Card>
            </div>
          )}
          <Button variant="outline" onClick={() => setShowQRCode(!showQRCode)} className="mt-4">
            {showQRCode ? "Ocultar" : "Mostrar"} QR Code
          </Button>
        </div>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {sections.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 flex-1 mx-1 rounded-full transition-colors ${
                  idx <= currentSection ? "bg-blue-600" : "bg-gray-200"
                }`}
              />
            ))}
          </div>
          <p className="text-sm text-gray-600 text-center">
            Seção {currentSection + 1} de {sections.length}
          </p>
        </div>

        <Card className="bg-white shadow-lg border-0 mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">{sections[currentSection].title}</CardTitle>
            <CardDescription className="text-base">{sections[currentSection].description}</CardDescription>
          </CardHeader>
          <CardContent>{sections[currentSection].content}</CardContent>
        </Card>

        <div className="flex justify-between gap-4">
          <Button
            variant="outline"
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
            disabled={currentSection === 0}
            className="flex-1"
          >
            Anterior
          </Button>

          {currentSection === sections.length - 1 ? (
            <Button
              onClick={handleSubmit}
              disabled={submitMutation.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              {submitMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Pesquisa"
              )}
            </Button>
          ) : (
            <Button
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
              className="flex-1"
            >
              Próximo
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
