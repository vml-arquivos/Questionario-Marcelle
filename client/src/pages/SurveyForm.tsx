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
  participantName: string; // Opcional
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
  familyDiabetes: "",
  familyThyroidIssues: "",
  familyObesity: "",
};

// Seções simplificadas
const sections = [
  {
    title: "Informações Básicas",
    description: "Vamos começar com algumas informações simples",
    fields: ["participantName", "age", "gender", "weight", "height"],
  },
  {
    title: "Hábitos Alimentares",
    description: "Como é sua alimentação?",
    fields: ["ultraProcessedFreq", "fruitsVegetablesFreq", "sweetsFreq", "mealsPerDay", "waterLitersPerDay"],
  },
  {
    title: "Estilo de Vida",
    description: "Sua rotina e hábitos",
    fields: ["physicalActivityHours", "smokingStatus", "alcoholFrequency", "sleepQuality"],
  },
  {
    title: "Sintomas",
    description: "Você sente algum destes sintomas?",
    fields: ["symptomFatigue", "symptomWeightChange", "symptomExcessiveThirst", "symptomTemperatureSensitivity", "symptomDrySkin", "symptomMoodChanges", "bloodPressureMedication"],
  },
  {
    title: "Histórico Familiar",
    description: "Tem alguém na família com estas condições?",
    fields: ["familyDiabetes", "familyThyroidIssues", "familyObesity"],
  },
];

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
    try {
      // Validação mínima - apenas campos obrigatórios
      if (!formData.age || !formData.gender || !formData.weight || !formData.height) {
        toast.error("Por favor, preencha os campos obrigatórios");
        return;
      }

      const profileType = formData.age ? (parseInt(formData.age) < 18 ? "student" : "adult") : "unknown";

      await submitMutation.mutateAsync({
        participantName: formData.participantName || "Anônimo",
        profileType,
        gender: formData.gender,
        ageRange: formData.age,
        weight: parseFloat(formData.weight),
        height: parseFloat(formData.height),
        ultraProcessedFreq: formData.ultraProcessedFreq,
        fruitsVegetablesFreq: formData.fruitsVegetablesFreq,
        sweetsFreq: formData.sweetsFreq,
        mealsPerDay: formData.mealsPerDay,
        waterLitersPerDay: formData.waterLitersPerDay,
        physicalActivityHours: formData.physicalActivityHours,
        smokingStatus: formData.smokingStatus,
        alcoholFrequency: formData.alcoholFrequency,
        sleepQuality: formData.sleepQuality,
        bloodPressureMedication: formData.bloodPressureMedication,
        symptomFatigue: formData.symptomFatigue,
        symptomWeightChange: formData.symptomWeightChange,
        symptomExcessiveThirst: formData.symptomExcessiveThirst,
        symptomTemperatureSensitivity: formData.symptomTemperatureSensitivity,
        symptomDrySkin: formData.symptomDrySkin,
        symptomMoodChanges: formData.symptomMoodChanges,
        familyDiabetes: formData.familyDiabetes,
        familyThyroidIssues: formData.familyThyroidIssues,
        familyObesity: formData.familyObesity,
      });

      setSubmitted(true);
      toast.success("Pesquisa salva com sucesso! Obrigado por participar.");
      
      // Limpar após 3 segundos
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

  const section = sections[currentSection];
  const isLastSection = currentSection === sections.length - 1;
  const isFirstSection = currentSection === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 py-8">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">EndocriCheck</h1>
          <p className="text-gray-600">Pesquisa sobre Saúde Endócrina</p>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Seção {currentSection + 1} de {sections.length}</span>
            <span>{Math.round(((currentSection + 1) / sections.length) * 100)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
            />
          </div>
        </div>

        {/* Form Card */}
        <Card className="shadow-lg">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-t-lg">
            <CardTitle className="text-2xl">{section.title}</CardTitle>
            <p className="text-blue-100 mt-2">{section.description}</p>
          </CardHeader>

          <CardContent className="pt-8">
            <div className="space-y-6">
              {/* Seção 1: Informações Básicas */}
              {currentSection === 0 && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">
                      Seu nome (opcional)
                    </Label>
                    <Input
                      placeholder="Deixe em branco se preferir responder anonimamente"
                      value={formData.participantName}
                      onChange={(e) => handleInputChange("participantName", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Idade *</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 25"
                      value={formData.age}
                      onChange={(e) => handleInputChange("age", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Gênero *</Label>
                    <RadioGroup value={formData.gender} onValueChange={(value) => handleInputChange("gender", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="male" id="male" />
                        <Label htmlFor="male" className="font-normal cursor-pointer">Masculino</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="female" id="female" />
                        <Label htmlFor="female" className="font-normal cursor-pointer">Feminino</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="other" id="other" />
                        <Label htmlFor="other" className="font-normal cursor-pointer">Outro</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Peso (kg) *</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 70"
                        value={formData.weight}
                        onChange={(e) => handleInputChange("weight", e.target.value)}
                        className="text-lg"
                      />
                    </div>
                    <div>
                      <Label className="text-base font-semibold mb-2 block">Altura (cm) *</Label>
                      <Input
                        type="number"
                        placeholder="Ex: 175"
                        value={formData.height}
                        onChange={(e) => handleInputChange("height", e.target.value)}
                        className="text-lg"
                      />
                    </div>
                  </div>

                  {bmi && (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-gray-600">Seu IMC: <span className="font-bold text-lg text-blue-600">{bmi}</span></p>
                    </div>
                  )}
                </>
              )}

              {/* Seção 2: Hábitos Alimentares */}
              {currentSection === 1 && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Com que frequência você consome alimentos ultraprocessados?</Label>
                    <Select value={formData.ultraProcessedFreq} onValueChange={(value) => handleInputChange("ultraProcessedFreq", value)}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="sometimes">Às vezes</SelectItem>
                        <SelectItem value="frequently">Frequentemente</SelectItem>
                        <SelectItem value="always">Sempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Com que frequência você consome frutas e vegetais?</Label>
                    <Select value={formData.fruitsVegetablesFreq} onValueChange={(value) => handleInputChange("fruitsVegetablesFreq", value)}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="sometimes">Às vezes</SelectItem>
                        <SelectItem value="frequently">Frequentemente</SelectItem>
                        <SelectItem value="always">Sempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Com que frequência você consome doces e açúcar?</Label>
                    <Select value={formData.sweetsFreq} onValueChange={(value) => handleInputChange("sweetsFreq", value)}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="sometimes">Às vezes</SelectItem>
                        <SelectItem value="frequently">Frequentemente</SelectItem>
                        <SelectItem value="always">Sempre</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Quantas refeições por dia?</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 3"
                      value={formData.mealsPerDay}
                      onChange={(e) => handleInputChange("mealsPerDay", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-2 block">Quantos litros de água por dia?</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 2"
                      value={formData.waterLitersPerDay}
                      onChange={(e) => handleInputChange("waterLitersPerDay", e.target.value)}
                      className="text-lg"
                    />
                  </div>
                </>
              )}

              {/* Seção 3: Estilo de Vida */}
              {currentSection === 2 && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Horas de atividade física por semana?</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 5"
                      value={formData.physicalActivityHours}
                      onChange={(e) => handleInputChange("physicalActivityHours", e.target.value)}
                      className="text-lg"
                    />
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Você fuma?</Label>
                    <RadioGroup value={formData.smokingStatus} onValueChange={(value) => handleInputChange("smokingStatus", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="never" id="smoke-never" />
                        <Label htmlFor="smoke-never" className="font-normal cursor-pointer">Nunca fumei</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="former" id="smoke-former" />
                        <Label htmlFor="smoke-former" className="font-normal cursor-pointer">Fumava, mas parei</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="current" id="smoke-current" />
                        <Label htmlFor="smoke-current" className="font-normal cursor-pointer">Fumo atualmente</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Com que frequência você consome álcool?</Label>
                    <Select value={formData.alcoholFrequency} onValueChange={(value) => handleInputChange("alcoholFrequency", value)}>
                      <SelectTrigger className="text-base">
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="never">Nunca</SelectItem>
                        <SelectItem value="rarely">Raramente</SelectItem>
                        <SelectItem value="sometimes">Às vezes</SelectItem>
                        <SelectItem value="frequently">Frequentemente</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Como é a qualidade do seu sono?</Label>
                    <RadioGroup value={formData.sleepQuality} onValueChange={(value) => handleInputChange("sleepQuality", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="poor" id="sleep-poor" />
                        <Label htmlFor="sleep-poor" className="font-normal cursor-pointer">Ruim</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="fair" id="sleep-fair" />
                        <Label htmlFor="sleep-fair" className="font-normal cursor-pointer">Regular</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="good" id="sleep-good" />
                        <Label htmlFor="sleep-good" className="font-normal cursor-pointer">Bom</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {/* Seção 4: Sintomas */}
              {currentSection === 3 && (
                <>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="fatigue"
                        checked={formData.symptomFatigue}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomFatigue", checked as boolean)}
                      />
                      <Label htmlFor="fatigue" className="font-normal cursor-pointer">Cansaço ou fadiga</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="weight"
                        checked={formData.symptomWeightChange}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomWeightChange", checked as boolean)}
                      />
                      <Label htmlFor="weight" className="font-normal cursor-pointer">Mudanças no peso</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="thirst"
                        checked={formData.symptomExcessiveThirst}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomExcessiveThirst", checked as boolean)}
                      />
                      <Label htmlFor="thirst" className="font-normal cursor-pointer">Sede excessiva</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="temperature"
                        checked={formData.symptomTemperatureSensitivity}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomTemperatureSensitivity", checked as boolean)}
                      />
                      <Label htmlFor="temperature" className="font-normal cursor-pointer">Sensibilidade à temperatura</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="skin"
                        checked={formData.symptomDrySkin}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomDrySkin", checked as boolean)}
                      />
                      <Label htmlFor="skin" className="font-normal cursor-pointer">Pele seca</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="mood"
                        checked={formData.symptomMoodChanges}
                        onCheckedChange={(checked) => handleCheckboxChange("symptomMoodChanges", checked as boolean)}
                      />
                      <Label htmlFor="mood" className="font-normal cursor-pointer">Mudanças de humor</Label>
                    </div>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Você toma medicação para pressão alta?</Label>
                    <RadioGroup value={formData.bloodPressureMedication} onValueChange={(value) => handleInputChange("bloodPressureMedication", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="no" id="bp-no" />
                        <Label htmlFor="bp-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="yes" id="bp-yes" />
                        <Label htmlFor="bp-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}

              {/* Seção 5: Histórico Familiar */}
              {currentSection === 4 && (
                <>
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem diabetes?</Label>
                    <RadioGroup value={formData.familyDiabetes} onValueChange={(value) => handleInputChange("familyDiabetes", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="no" id="diabetes-no" />
                        <Label htmlFor="diabetes-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="diabetes-yes" />
                        <Label htmlFor="diabetes-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unsure" id="diabetes-unsure" />
                        <Label htmlFor="diabetes-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem problemas de tireoide?</Label>
                    <RadioGroup value={formData.familyThyroidIssues} onValueChange={(value) => handleInputChange("familyThyroidIssues", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="no" id="thyroid-no" />
                        <Label htmlFor="thyroid-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="thyroid-yes" />
                        <Label htmlFor="thyroid-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unsure" id="thyroid-unsure" />
                        <Label htmlFor="thyroid-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                      </div>
                    </RadioGroup>
                  </div>

                  <div>
                    <Label className="text-base font-semibold mb-3 block">Alguém na sua família tem obesidade?</Label>
                    <RadioGroup value={formData.familyObesity} onValueChange={(value) => handleInputChange("familyObesity", value)}>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="no" id="obesity-no" />
                        <Label htmlFor="obesity-no" className="font-normal cursor-pointer">Não</Label>
                      </div>
                      <div className="flex items-center space-x-2 mb-2">
                        <RadioGroupItem value="yes" id="obesity-yes" />
                        <Label htmlFor="obesity-yes" className="font-normal cursor-pointer">Sim</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="unsure" id="obesity-unsure" />
                        <Label htmlFor="obesity-unsure" className="font-normal cursor-pointer">Não tenho certeza</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex gap-4 mt-8">
          <Button
            onClick={() => setCurrentSection(Math.max(0, currentSection - 1))}
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
              onClick={() => setCurrentSection(Math.min(sections.length - 1, currentSection + 1))}
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
