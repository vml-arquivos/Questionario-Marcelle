import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, PieChart, Pie, Cell, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ─── Paleta de cores ────────────────────────────────────────────────────────
const COLORS = ["#6366f1","#10b981","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#84cc16"];
const INDIGO = "#6366f1";
const GREEN  = "#10b981";
const AMBER  = "#f59e0b";
const RED    = "#ef4444";

// ─── Helpers ────────────────────────────────────────────────────────────────
const toNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? "0"));
  return isNaN(n) ? 0 : n;
};

const AGE_GROUPS = [
  { label: "Criança (até 12)",   min: 0,  max: 12  },
  { label: "Adolescente (13-17)",min: 13, max: 17  },
  { label: "Jovem (18-24)",      min: 18, max: 24  },
  { label: "Adulto (25-39)",     min: 25, max: 39  },
  { label: "Adulto Maduro (40-59)", min: 40, max: 59 },
  { label: "Idoso (60+)",        min: 60, max: 999 },
];

const getAgeGroup = (age: number) => {
  for (const g of AGE_GROUPS) if (age >= g.min && age <= g.max) return g.label;
  return "Outro";
};

const BMI_CLASS = (bmi: number) => {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25)   return "Peso normal";
  if (bmi < 30)   return "Sobrepeso";
  if (bmi < 35)   return "Obesidade I";
  if (bmi < 40)   return "Obesidade II";
  return "Obesidade III";
};

const FREQ_LABEL: Record<string, string> = {
  never: "Nunca", rarely: "Raramente", sometimes: "Às vezes",
  "1-2x_week": "1-2x/sem", "3-5x_week": "3-5x/sem", daily: "Diário",
  always: "Sempre", "every_day": "Todo dia",
};
const fl = (v: string | null | undefined) => FREQ_LABEL[v ?? ""] ?? v ?? "—";

const GENDER_LABEL: Record<string, string> = {
  male: "Masculino", female: "Feminino", other: "Outro",
};

const SLEEP_LABEL: Record<string, string> = {
  excellent: "Excelente", good: "Boa", fair: "Regular", poor: "Ruim",
};

const STRESS_LABEL: Record<string, string> = {
  low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto",
};

const ACTIVITY_LABEL: Record<string, string> = {
  none: "Sedentário", light: "Leve", moderate: "Moderado", intense: "Intenso",
};

const count = (arr: string[], val: string) => arr.filter(v => v === val).length;
const pct = (n: number, total: number) => total ? Math.round((n / total) * 100) : 0;

const groupBy = <T,>(arr: T[], key: (v: T) => string) => {
  const map: Record<string, T[]> = {};
  arr.forEach(v => { const k = key(v); (map[k] = map[k] || []).push(v); });
  return map;
};

const toPieData = (map: Record<string, number>) =>
  Object.entries(map).map(([name, value]) => ({ name, value }));

// ─── Componentes auxiliares ─────────────────────────────────────────────────
const Card = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {children}
  </div>
);

const SectionTitle = ({ icon, title, subtitle }: { icon: string; title: string; subtitle?: string }) => (
  <div className="flex items-center gap-3 mb-5">
    <span className="text-2xl">{icon}</span>
    <div>
      <h2 className="text-lg font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-sm text-gray-500">{subtitle}</p>}
    </div>
  </div>
);

const KPI = ({ label, value, sub, color = "indigo" }: { label: string; value: string | number; sub?: string; color?: string }) => {
  const colors: Record<string, string> = {
    indigo: "text-indigo-600", green: "text-emerald-600",
    amber: "text-amber-600", red: "text-red-600",
  };
  return (
    <Card>
      <p className="text-sm text-gray-500 font-medium mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colors[color] ?? colors.indigo}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
    </Card>
  );
};

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm">
      {label && <p className="font-semibold text-gray-700 mb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }}>
          {p.name}: <strong>{p.value}{typeof p.value === "number" && p.name?.includes("%") ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

// ─── Exportar Excel ─────────────────────────────────────────────────────────
const exportExcel = async (responses: any[]) => {
  const XLSX = await import("xlsx");
  const headers = [
    "ID","Idade","Faixa Etária","Sexo","Peso (kg)","Altura (cm)","IMC","Classificação IMC",
    "Diagnóstico Existente","Usa Medicamento",
    "Ultraprocessados","Frutas/Verduras","Doces","Refeições/dia","Água (L/dia)",
    "Refrigerantes","Fast Food","Café da Manhã","Come à Noite","Tipo de Dieta",
    "Atividade Física","Fuma","Álcool","Qualidade do Sono","Horas de Sono",
    "Acorda Cansado","Tempo p/ Dormir","Nível de Estresse","Ansiedade","Diagnóstico Mental",
    "Tempo de Tela","Redes Sociais",
    "Sintoma: Cansaço","Sintoma: Mudança de Peso","Sintoma: Sede Excessiva",
    "Sintoma: Sensibilidade Temp.","Sintoma: Pele Seca","Sintoma: Mudanças de Humor",
    "Sintoma: Queda de Cabelo","Sintoma: Névoa Mental","Sintoma: Fome Constante",
    "Sintoma: Urinar Frequente","Sintoma: Palpitações",
    "Histórico: Glicemia Alta","Histórico: Diabetes Familiar","Histórico: Tireoide Familiar","Histórico: Obesidade Familiar",
    "Ciclo Irregular","SOP","Score FINDRISC","Risco FINDRISC","Data de Envio"
  ];
  const rows = responses.map(r => [
    r.id, r.age, getAgeGroup(r.age),
    GENDER_LABEL[r.gender] ?? r.gender,
    r.weight, r.height, toNum(r.bmi).toFixed(1), BMI_CLASS(toNum(r.bmi)),
    r.existingDiagnosis === "none" ? "Nenhum" : r.existingDiagnosis,
    r.onMedication === "yes" ? "Sim" : "Não",
    fl(r.ultraProcessedFreq), fl(r.fruitsVegetablesFreq), fl(r.sweetsFreq),
    r.mealsPerDay, r.waterLitersPerDay,
    fl(r.sugaryDrinksFrequency), fl(r.fastFoodFrequency), fl(r.breakfastFrequency),
    r.lateNightEating === "yes" ? "Sim" : "Não", r.dietType,
    ACTIVITY_LABEL[r.physicalActivityHours] ?? r.physicalActivityHours,
    r.smokingStatus, r.alcoholFrequency,
    SLEEP_LABEL[r.sleepQuality] ?? r.sleepQuality,
    r.sleepHoursPerNight, r.wakeUpTired, r.sleepLatency,
    STRESS_LABEL[r.stressLevel] ?? r.stressLevel,
    r.anxietyFrequency, r.mentalHealthDiagnosis,
    r.screenTimeHours, r.socialMediaHours,
    r.symptomFatigue, r.symptomWeightChange, r.symptomExcessiveThirst,
    r.symptomTemperatureSensitivity, r.symptomDrySkin, r.symptomMoodChanges,
    r.symptomHairLoss, r.symptomBrainFog, r.symptomConstantHunger,
    r.symptomFrequentUrination, r.symptomPalpitations,
    r.highBloodGlucoseHistory, r.familyDiabetes, r.familyThyroidIssues, r.familyObesity,
    r.irregularMenstrualCycle, r.pcosDiagnosis,
    r.findrisc_score, r.findrisc_risk_category,
    new Date(r.submittedAt).toLocaleString("pt-BR")
  ]);
  const ws = XLSX.utils.aoa_to_sheet([headers, ...rows]);
  ws["!cols"] = headers.map(() => ({ wch: 22 }));
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Respostas");
  XLSX.writeFile(wb, `EndocriCheck_${new Date().toISOString().slice(0,10)}.xlsx`);
};

// ─── Dashboard principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [ageFilter, setAgeFilter] = useState("Todas");
  const [sexFilter, setSexFilter] = useState("Todos");

  const { data: rawResponses = [], isLoading, refetch } = useQuery(
    trpc.survey.getResponses.queryOptions()
  );

  // Filtrar
  const responses = useMemo(() => {
    let r = rawResponses as any[];
    if (ageFilter !== "Todas") {
      r = r.filter(x => getAgeGroup(x.age) === ageFilter);
    }
    if (sexFilter !== "Todos") {
      const map: Record<string, string> = { "Masc.": "male", "Fem.": "female", "Outro": "other" };
      r = r.filter(x => x.gender === map[sexFilter]);
    }
    return r;
  }, [rawResponses, ageFilter, sexFilter]);

  const total = responses.length;

  // ── KPIs ──
  const avgBmi = useMemo(() => {
    if (!total) return 0;
    const sum = responses.reduce((s, r) => s + toNum(r.bmi), 0);
    return sum / total;
  }, [responses, total]);

  const avgAge = useMemo(() => {
    if (!total) return 0;
    return responses.reduce((s, r) => s + toNum(r.age), 0) / total;
  }, [responses, total]);

  const sedentaryPct = useMemo(() => {
    if (!total) return 0;
    return pct(responses.filter(r => r.physicalActivityHours === "none").length, total);
  }, [responses, total]);

  const ultraProcessedAlert = useMemo(() => {
    if (!total) return false;
    const freq = responses.filter(r => ["daily","always","3-5x_week"].includes(r.ultraProcessedFreq)).length;
    return pct(freq, total) > 30;
  }, [responses, total]);

  // ── Faixa etária ──
  const ageGroupData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => {
      const g = getAgeGroup(r.age);
      map[g] = (map[g] || 0) + 1;
    });
    return AGE_GROUPS.map(g => ({ name: g.label.split(" (")[0], full: g.label, value: map[g.label] || 0 }))
      .filter(g => g.value > 0);
  }, [responses]);

  // ── Sexo ──
  const genderData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => {
      const g = GENDER_LABEL[r.gender] ?? r.gender;
      map[g] = (map[g] || 0) + 1;
    });
    return toPieData(map);
  }, [responses]);

  // ── IMC por faixa etária ──
  const bmiByAge = useMemo(() => {
    const groups = groupBy(responses, r => getAgeGroup(r.age).split(" (")[0]);
    return Object.entries(groups).map(([name, arr]) => ({
      name,
      "IMC Médio": parseFloat((arr.reduce((s, r) => s + toNum(r.bmi), 0) / arr.length).toFixed(1)),
    }));
  }, [responses]);

  // ── Classificação IMC ──
  const bmiClassData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => {
      const c = BMI_CLASS(toNum(r.bmi));
      map[c] = (map[c] || 0) + 1;
    });
    return toPieData(map);
  }, [responses]);

  // ── Ultraprocessados por faixa etária ──
  const ultraByAge = useMemo(() => {
    const groups = groupBy(responses, r => getAgeGroup(r.age).split(" (")[0]);
    return Object.entries(groups).map(([name, arr]) => ({
      name,
      "Diário/Sempre": pct(arr.filter(r => ["daily","always"].includes(r.ultraProcessedFreq)).length, arr.length),
      "3-5x/sem": pct(arr.filter(r => r.ultraProcessedFreq === "3-5x_week").length, arr.length),
      "Às vezes": pct(arr.filter(r => r.ultraProcessedFreq === "sometimes").length, arr.length),
      "Raramente/Nunca": pct(arr.filter(r => ["rarely","never"].includes(r.ultraProcessedFreq)).length, arr.length),
    }));
  }, [responses]);

  // ── Frutas/Verduras ──
  const fruitsData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = fl(r.fruitsVegetablesFreq); map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Café da manhã ──
  const breakfastData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = fl(r.breakfastFrequency); map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Fast food ──
  const fastFoodData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = fl(r.fastFoodFrequency); map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Tipo de dieta ──
  const dietData = useMemo(() => {
    const DIET: Record<string, string> = {
      omnivore: "Onívoro", vegetarian: "Vegetariano", vegan: "Vegano",
      low_carb: "Low Carb", other: "Outro",
    };
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = DIET[r.dietType] ?? r.dietType; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Atividade física ──
  const activityData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = ACTIVITY_LABEL[r.physicalActivityHours] ?? r.physicalActivityHours; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Qualidade do sono ──
  const sleepQualityData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = SLEEP_LABEL[r.sleepQuality] ?? r.sleepQuality; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Estresse ──
  const stressData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = STRESS_LABEL[r.stressLevel] ?? r.stressLevel; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Sintomas (ranking) ──
  const symptomsData = useMemo(() => {
    if (!total) return [];
    return [
      { name: "Cansaço", pct: pct(responses.filter(r => r.symptomFatigue).length, total) },
      { name: "Mudança de Peso", pct: pct(responses.filter(r => r.symptomWeightChange).length, total) },
      { name: "Sede Excessiva", pct: pct(responses.filter(r => r.symptomExcessiveThirst).length, total) },
      { name: "Sensib. Temperatura", pct: pct(responses.filter(r => r.symptomTemperatureSensitivity).length, total) },
      { name: "Pele Seca", pct: pct(responses.filter(r => r.symptomDrySkin).length, total) },
      { name: "Mudanças de Humor", pct: pct(responses.filter(r => r.symptomMoodChanges).length, total) },
      { name: "Queda de Cabelo", pct: pct(responses.filter(r => r.symptomHairLoss).length, total) },
      { name: "Névoa Mental", pct: pct(responses.filter(r => r.symptomBrainFog).length, total) },
      { name: "Fome Constante", pct: pct(responses.filter(r => r.symptomConstantHunger).length, total) },
      { name: "Urinar Frequente", pct: pct(responses.filter(r => r.symptomFrequentUrination).length, total) },
      { name: "Palpitações", pct: pct(responses.filter(r => r.symptomPalpitations).length, total) },
    ].sort((a, b) => b.pct - a.pct);
  }, [responses, total]);

  // ── Histórico familiar ──
  const familyData = useMemo(() => [
    { name: "Diabetes", sim: pct(responses.filter(r => r.familyDiabetes && r.familyDiabetes !== "no").length, total), nao: pct(responses.filter(r => r.familyDiabetes === "no").length, total) },
    { name: "Tireoide", sim: pct(responses.filter(r => r.familyThyroidIssues && r.familyThyroidIssues !== "no").length, total), nao: pct(responses.filter(r => r.familyThyroidIssues === "no").length, total) },
    { name: "Obesidade", sim: pct(responses.filter(r => r.familyObesity && r.familyObesity !== "no").length, total), nao: pct(responses.filter(r => r.familyObesity === "no").length, total) },
  ], [responses, total]);

  // ── FINDRISC ──
  const findriscData = useMemo(() => {
    const RISK: Record<string, string> = {
      low: "Baixo", slightly_elevated: "Levemente Elevado",
      moderate: "Moderado", high: "Alto", very_high: "Muito Alto",
    };
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = RISK[r.findrisc_risk_category] ?? r.findrisc_risk_category; if (l) map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Refeições/dia ──
  const mealsData = useMemo(() => {
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = `${r.mealsPerDay} refeições`; map[l] = (map[l]||0)+1; });
    return Object.entries(map).sort((a,b) => a[0].localeCompare(b[0])).map(([name, value]) => ({ name, value }));
  }, [responses]);

  // ── Álcool ──
  const alcoholData = useMemo(() => {
    const ALCO: Record<string, string> = {
      never: "Nunca", social: "Social", weekly: "Semanal", daily: "Diário",
    };
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = ALCO[r.alcoholFrequency] ?? r.alcoholFrequency; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Fuma ──
  const smokingData = useMemo(() => {
    const SMOKE: Record<string, string> = {
      never: "Nunca fumou", former: "Ex-fumante", current: "Fumante",
    };
    const map: Record<string, number> = {};
    responses.forEach(r => { const l = SMOKE[r.smokingStatus] ?? r.smokingStatus; map[l] = (map[l]||0)+1; });
    return toPieData(map);
  }, [responses]);

  // ── Hábitos alimentares por faixa etária (barras agrupadas) ──
  const foodByAge = useMemo(() => {
    const groups = groupBy(responses, r => getAgeGroup(r.age).split(" (")[0]);
    return Object.entries(groups).map(([name, arr]) => ({
      name,
      "Ultraproc. Diário": pct(arr.filter(r => ["daily","always"].includes(r.ultraProcessedFreq)).length, arr.length),
      "Frutas Raramente": pct(arr.filter(r => ["rarely","never"].includes(r.fruitsVegetablesFreq)).length, arr.length),
      "Sem Café da Manhã": pct(arr.filter(r => ["rarely","never"].includes(r.breakfastFrequency)).length, arr.length),
      "Fast Food Freq.": pct(arr.filter(r => ["3-5x_week","daily","always"].includes(r.fastFoodFrequency)).length, arr.length),
    }));
  }, [responses]);

  const FILTER_AGES = ["Todas", "Criança", "Adolescente", "Jovem", "Adulto", "Adulto Maduro", "Idoso"];
  const FILTER_SEX = ["Todos", "Masc.", "Fem.", "Outro"];

  const PieLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
    if (percent < 0.05) return null;
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={11} fontWeight="bold">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Dashboard EndocriCheck</h1>
            <p className="text-sm text-gray-500">Análise de saúde endocrinológica e hábitos alimentares</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
            >
              🔄 Atualizar
            </button>
            <button
              onClick={() => exportExcel(responses)}
              disabled={!total}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-40 transition"
            >
              📥 Exportar Excel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Filtros */}
        <Card>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-semibold text-gray-600">Faixa etária:</span>
              {FILTER_AGES.map(f => (
                <button
                  key={f}
                  onClick={() => setAgeFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    ageFilter === f
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-600">Sexo:</span>
              {FILTER_SEX.map(f => (
                <button
                  key={f}
                  onClick={() => setSexFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    sexFilter === f
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </Card>

        {/* Alerta */}
        {ultraProcessedAlert && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">Alerta: Alto consumo de ultraprocessados</p>
              <p className="text-sm text-red-600">Mais de 30% dos participantes consomem alimentos ultraprocessados com frequência diária ou muito alta.</p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI label="Total de Respostas" value={total} sub="participantes" color="indigo" />
          <KPI label="IMC Médio" value={total ? avgBmi.toFixed(1) : "—"} sub={total ? BMI_CLASS(avgBmi) : "sem dados"} color={avgBmi >= 25 ? "amber" : "green"} />
          <KPI label="Idade Média" value={total ? `${avgAge.toFixed(0)} anos` : "—"} sub="dos participantes" color="indigo" />
          <KPI label="Sedentários" value={total ? `${sedentaryPct}%` : "—"} sub="sem atividade física" color={sedentaryPct > 40 ? "red" : "green"} />
        </div>

        {total === 0 ? (
          <Card className="py-16 text-center">
            <p className="text-5xl mb-4">👥</p>
            <p className="text-xl font-semibold text-gray-600">Nenhuma resposta ainda</p>
            <p className="text-gray-400 mt-2">Compartilhe o QR Code para começar a coletar dados.</p>
          </Card>
        ) : (
          <>
            {/* ── SEÇÃO 1: Perfil ── */}
            <div>
              <SectionTitle icon="👤" title="Perfil dos Participantes" subtitle="Quem respondeu a pesquisa" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Por Faixa Etária</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={ageGroupData} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Participantes" fill={INDIGO} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Por Sexo</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={PieLabel}>
                        {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">IMC Médio por Faixa Etária</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={bmiByAge} margin={{ top: 5, right: 10, left: -20, bottom: 40 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-30} textAnchor="end" />
                      <YAxis tick={{ fontSize: 10 }} domain={[0, 40]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="IMC Médio" fill={AMBER} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Classificação de IMC</p>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={bmiClassData} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={PieLabel}>
                        {bmiClassData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            {/* ── SEÇÃO 2: Alimentação ── */}
            <div>
              <SectionTitle icon="🥗" title="Hábitos Alimentares" subtitle="O que e como as pessoas estão se alimentando" />

              <Card className="mb-4">
                <p className="text-sm font-semibold text-gray-600 mb-3">Comportamento Alimentar por Faixa Etária (%)</p>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={foodByAge} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Ultraproc. Diário" fill={RED} radius={[3,3,0,0]} />
                    <Bar dataKey="Frutas Raramente" fill={AMBER} radius={[3,3,0,0]} />
                    <Bar dataKey="Sem Café da Manhã" fill="#8b5cf6" radius={[3,3,0,0]} />
                    <Bar dataKey="Fast Food Freq." fill="#f97316" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Frutas e Verduras</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={fruitsData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {fruitsData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Café da Manhã</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={breakfastData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {breakfastData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Fast Food</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={fastFoodData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {fastFoodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Tipo de Dieta</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dietData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {dietData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Refeições por Dia</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={mealsData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="value" name="Participantes" fill={GREEN} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Atividade Física</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={activityData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {activityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            {/* ── SEÇÃO 3: Sono, Estresse e Bem-estar ── */}
            <div>
              <SectionTitle icon="😴" title="Sono, Estresse e Bem-estar" subtitle="Qualidade de vida e saúde mental" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Qualidade do Sono</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={sleepQualityData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {sleepQualityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Nível de Estresse</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={stressData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {stressData.map((_, i) => <Cell key={i} fill={[GREEN, AMBER, "#f97316", RED][i % 4]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Tabagismo</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={smokingData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {smokingData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Consumo de Álcool</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={alcoholData} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={PieLabel}>
                        {alcoholData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            {/* ── SEÇÃO 4: Sintomas ── */}
            <div>
              <SectionTitle icon="🩺" title="Sintomas Endócrinos" subtitle="Percentual de participantes que relataram cada sintoma" />
              <Card>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={symptomsData} layout="vertical" margin={{ top: 5, right: 40, left: 120, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={115} />
                    <Tooltip content={<CustomTooltip />} formatter={(v: any) => [`${v}%`, "Participantes"]} />
                    <Bar dataKey="pct" name="% com sintoma" fill={INDIGO} radius={[0,4,4,0]}>
                      {symptomsData.map((entry, i) => (
                        <Cell key={i} fill={entry.pct > 50 ? RED : entry.pct > 30 ? AMBER : INDIGO} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* ── SEÇÃO 5: Histórico Familiar e FINDRISC ── */}
            <div>
              <SectionTitle icon="🧬" title="Histórico Familiar e Risco Metabólico" subtitle="Predisposição genética e score FINDRISC" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Histórico Familiar de Doenças (%)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={familyData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="sim" name="Tem histórico" fill={RED} radius={[4,4,0,0]} />
                      <Bar dataKey="nao" name="Não tem" fill={GREEN} radius={[4,4,0,0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </Card>

                <Card>
                  <p className="text-sm font-semibold text-gray-600 mb-3">Risco de Diabetes (FINDRISC)</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={findriscData} cx="50%" cy="50%" outerRadius={80} dataKey="value" labelLine={false} label={PieLabel}>
                        {findriscData.map((_, i) => <Cell key={i} fill={[GREEN, "#84cc16", AMBER, "#f97316", RED][i % 5]} />)}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>

            {/* ── TABELA ── */}
            <div>
              <SectionTitle icon="📋" title="Últimas Respostas" subtitle={`Mostrando ${Math.min(total, 50)} de ${total} respostas`} />
              <Card className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100">
                      {["#","Idade","Faixa Etária","Sexo","IMC","Classificação","Ultraprocessados","Frutas","Atividade","Estresse","Sintomas","Data"].map(h => (
                        <th key={h} className="text-left py-2 px-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...responses].reverse().slice(0, 50).map((r: any) => {
                      const bmi = toNum(r.bmi);
                      const bmiClass = BMI_CLASS(bmi);
                      const bmiColor = bmi < 18.5 ? "text-blue-600" : bmi < 25 ? "text-emerald-600" : bmi < 30 ? "text-amber-600" : "text-red-600";
                      const symptoms = [r.symptomFatigue, r.symptomWeightChange, r.symptomExcessiveThirst, r.symptomTemperatureSensitivity, r.symptomDrySkin, r.symptomMoodChanges, r.symptomHairLoss, r.symptomBrainFog, r.symptomConstantHunger, r.symptomFrequentUrination, r.symptomPalpitations].filter(Boolean).length;
                      return (
                        <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50 transition">
                          <td className="py-2 px-3 text-gray-400">{r.id}</td>
                          <td className="py-2 px-3 font-medium">{r.age}</td>
                          <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{getAgeGroup(r.age).split(" (")[0]}</td>
                          <td className="py-2 px-3">{GENDER_LABEL[r.gender] ?? r.gender}</td>
                          <td className={`py-2 px-3 font-semibold ${bmiColor}`}>{bmi.toFixed(1)}</td>
                          <td className="py-2 px-3 text-gray-600 whitespace-nowrap">{bmiClass}</td>
                          <td className="py-2 px-3">{fl(r.ultraProcessedFreq)}</td>
                          <td className="py-2 px-3">{fl(r.fruitsVegetablesFreq)}</td>
                          <td className="py-2 px-3">{ACTIVITY_LABEL[r.physicalActivityHours] ?? r.physicalActivityHours}</td>
                          <td className="py-2 px-3">{STRESS_LABEL[r.stressLevel] ?? r.stressLevel}</td>
                          <td className="py-2 px-3">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${symptoms > 5 ? "bg-red-100 text-red-700" : symptoms > 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700"}`}>
                              {symptoms} sintoma{symptoms !== 1 ? "s" : ""}
                            </span>
                          </td>
                          <td className="py-2 px-3 text-gray-400 whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString("pt-BR")}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </Card>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
