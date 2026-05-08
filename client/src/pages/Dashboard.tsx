import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
} from "recharts";
import {
  Users, Download, RefreshCw, TrendingUp, AlertTriangle, Activity,
  Utensils, Brain, Heart, Moon, Zap,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Paleta ───────────────────────────────────────────────────────────────────
const C = ["#6366f1","#22c55e","#f59e0b","#ef4444","#8b5cf6","#06b6d4","#f97316","#ec4899","#14b8a6","#a855f7"];
const AGE_ORDER = ["Criança (até 12)","Adolescente (13-17)","Jovem (18-24)","Adulto (25-39)","Adulto Maduro (40-59)","Idoso (60+)"];

// ── Helpers ──────────────────────────────────────────────────────────────────
const toNum = (v: unknown): number => {
  if (v === null || v === undefined || v === "") return 0;
  const n = typeof v === "number" ? v : parseFloat(String(v));
  return isNaN(n) ? 0 : n;
};

function getAgeGroup(age: number): string {
  if (age < 13) return "Criança (até 12)";
  if (age <= 17) return "Adolescente (13-17)";
  if (age <= 24) return "Jovem (18-24)";
  if (age <= 39) return "Adulto (25-39)";
  if (age <= 59) return "Adulto Maduro (40-59)";
  return "Idoso (60+)";
}

function bmiCat(bmi: number): string {
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  if (bmi < 35) return "Obesidade Grau I";
  return "Obesidade Grau II+";
}

const FREQ_LABEL: Record<string, string> = {
  never: "Nunca", rarely: "Raramente", sometimes: "Às vezes",
  often: "Frequentemente", daily: "Diariamente",
  "3-5x_week": "3-5x/sem", "1-2x_week": "1-2x/sem",
  "3-5x_week_ff": "3-5x/sem",
};
const fl = (v: unknown) => FREQ_LABEL[String(v ?? "")] ?? String(v ?? "—");

const GENDER_LABEL: Record<string, string> = {
  male: "Masculino", female: "Feminino", other: "Outro", prefer_not_to_say: "Prefiro não dizer",
};
const gl = (v: unknown) => GENDER_LABEL[String(v ?? "")] ?? String(v ?? "—");

const ACTIVITY_LABEL: Record<string, string> = {
  none: "Sedentário", light: "Leve (<1h)", "1-2": "1-2h/sem", "1-3": "1-3h/sem",
  "3-4": "3-4h/sem", "5-7": "5-7h/sem", ">=4": "4+h/sem", "8+": "8+h/sem",
};
const al = (v: unknown) => ACTIVITY_LABEL[String(v ?? "")] ?? String(v ?? "—");

const SLEEP_LABEL: Record<string, string> = {
  very_good: "Muito boa", good: "Boa", fair: "Regular", poor: "Ruim", very_poor: "Muito ruim",
};
const sl = (v: unknown) => SLEEP_LABEL[String(v ?? "")] ?? String(v ?? "—");

const STRESS_LABEL: Record<string, string> = { low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto" };
const stl = (v: unknown) => STRESS_LABEL[String(v ?? "")] ?? String(v ?? "—");

const DIET_LABEL: Record<string, string> = {
  omnivore: "Onívoro", vegetarian: "Vegetariano", vegan: "Vegano",
  pescatarian: "Pescetariano", other: "Outro",
};
const dtl = (v: unknown) => DIET_LABEL[String(v ?? "")] ?? String(v ?? "—");

// Frequência → score numérico para comparação
const FREQ_SCORE: Record<string, number> = {
  never: 0, rarely: 1, "1-2x_week": 1.5, sometimes: 2, "3-5x_week": 3.5, often: 3, daily: 4,
};
const fs = (v: unknown) => FREQ_SCORE[String(v ?? "")] ?? -1;

// Contador simples
function countBy<T>(arr: T[], fn: (r: T) => string): { name: string; valor: number }[] {
  const map: Record<string, number> = {};
  arr.forEach((r) => { const k = fn(r); map[k] = (map[k] ?? 0) + 1; });
  return Object.entries(map)
    .filter(([n]) => n && n !== "—" && n !== "undefined" && n !== "null")
    .map(([name, valor]) => ({ name, valor }))
    .sort((a, b) => b.valor - a.valor);
}

// Tooltip customizado
const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if (!active || !payload || !(payload as unknown[]).length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-3 shadow-lg text-sm">
      <p className="font-semibold text-gray-700 mb-1">{String(label ?? "")}</p>
      {(payload as { name: string; value: number; color: string }[]).map((p, i) => (
        <p key={i} style={{ color: p.color }}>
          {p.name}: <strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

// ── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [filterAge, setFilterAge] = useState("all");
  const [filterGender, setFilterGender] = useState("all");

  const { data: rawResponses, isLoading, refetch } = trpc.survey.getResponses.useQuery();

  // Normalizar tipos (bmi vem como string do banco)
  const responses = useMemo(() => {
    if (!rawResponses) return [];
    return rawResponses.map((r) => ({
      ...r,
      age: toNum(r.age),
      bmi: toNum(r.bmi),
    }));
  }, [rawResponses]);

  // Filtro
  const filtered = useMemo(() => {
    return responses.filter((r) => {
      if (filterAge !== "all" && getAgeGroup(r.age) !== filterAge) return false;
      if (filterGender !== "all" && r.gender !== filterGender) return false;
      return true;
    });
  }, [responses, filterAge, filterGender]);

  const total = filtered.length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const avgBmi = useMemo(() => {
    const valid = filtered.filter((r) => r.bmi > 0);
    if (!valid.length) return null;
    return (valid.reduce((s, r) => s + r.bmi, 0) / valid.length).toFixed(1);
  }, [filtered]);

  const avgAge = useMemo(() => {
    if (!filtered.length) return null;
    return (filtered.reduce((s, r) => s + r.age, 0) / filtered.length).toFixed(0);
  }, [filtered]);

  const sedentaryPct = useMemo(() => {
    if (!filtered.length) return 0;
    const sed = filtered.filter((r) => r.physicalActivityHours === "none" || r.physicalActivityHours === "light").length;
    return Math.round((sed / filtered.length) * 100);
  }, [filtered]);

  const highUltraPct = useMemo(() => {
    if (!filtered.length) return 0;
    const high = filtered.filter((r) => r.ultraProcessedFreq === "often" || r.ultraProcessedFreq === "daily").length;
    return Math.round((high / filtered.length) * 100);
  }, [filtered]);

  // ── Gráficos ──────────────────────────────────────────────────────────────

  // 1. Faixa etária
  const ageGroupData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const g = getAgeGroup(r.age); counts[g] = (counts[g] ?? 0) + 1; });
    return AGE_ORDER.filter((g) => counts[g]).map((g) => ({ name: g.split(" ")[0] + " " + (g.match(/\(.*\)/) ?? [""])[0], participantes: counts[g] }));
  }, [filtered]);

  // 2. Sexo
  const genderData = useMemo(() => countBy(filtered, (r) => gl(r.gender)).map(({ name, valor }) => ({ name, valor })), [filtered]);

  // 3. IMC por faixa etária
  const bmiByAge = useMemo(() => {
    const groups: Record<string, number[]> = {};
    filtered.forEach((r) => {
      if (r.bmi <= 0) return;
      const g = getAgeGroup(r.age).split(" ")[0];
      if (!groups[g]) groups[g] = [];
      groups[g].push(r.bmi);
    });
    return Object.entries(groups).map(([name, arr]) => ({
      name,
      "IMC Médio": parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(1)),
    }));
  }, [filtered]);

  // 4. Distribuição IMC
  const bmiDist = useMemo(() => {
    const cats: Record<string, number> = {};
    filtered.forEach((r) => {
      if (r.bmi <= 0) return;
      const c = bmiCat(r.bmi);
      cats[c] = (cats[c] ?? 0) + 1;
    });
    return Object.entries(cats).map(([name, valor]) => ({ name, valor }));
  }, [filtered]);

  // 5. Hábitos alimentares por faixa etária (score médio 0-4)
  const foodByAge = useMemo(() => {
    const groups: Record<string, { ultra: number[]; fruits: number[]; sweets: number[]; drinks: number[]; ff: number[] }> = {};
    filtered.forEach((r) => {
      const g = getAgeGroup(r.age).split(" ")[0];
      if (!groups[g]) groups[g] = { ultra: [], fruits: [], sweets: [], drinks: [], ff: [] };
      const u = fs(r.ultraProcessedFreq); if (u >= 0) groups[g].ultra.push(u);
      const f = fs(r.fruitsVegetablesFreq); if (f >= 0) groups[g].fruits.push(f);
      const s = fs(r.sweetsFreq); if (s >= 0) groups[g].sweets.push(s);
      const d = fs((r as Record<string, unknown>).sugaryDrinksFrequency); if (d >= 0) groups[g].drinks.push(d);
      const ff = fs((r as Record<string, unknown>).fastFoodFrequency); if (ff >= 0) groups[g].ff.push(ff);
    });
    const avg = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
    return Object.entries(groups).map(([name, v]) => ({
      name,
      "Ultraprocessados": avg(v.ultra),
      "Frutas/Verduras": avg(v.fruits),
      "Doces": avg(v.sweets),
      "Refrigerantes": avg(v.drinks),
      "Fast Food": avg(v.ff),
    }));
  }, [filtered]);

  // 6. Ultraprocessados distribuição
  const ultraDist = useMemo(() => countBy(filtered, (r) => fl(r.ultraProcessedFreq)), [filtered]);

  // 7. Frutas e verduras
  const fruitsDist = useMemo(() => countBy(filtered, (r) => fl(r.fruitsVegetablesFreq)), [filtered]);

  // 8. Café da manhã
  const breakfastDist = useMemo(() => countBy(filtered, (r) => fl((r as Record<string, unknown>).breakfastFrequency)), [filtered]);

  // 9. Tipo de dieta
  const dietDist = useMemo(() => countBy(filtered, (r) => dtl((r as Record<string, unknown>).dietType)), [filtered]);

  // 10. Refeições por dia
  const mealsDist = useMemo(() => countBy(filtered, (r) => `${(r as Record<string, unknown>).mealsPerDay ?? "—"} refeições`), [filtered]);

  // 11. Atividade física
  const activityDist = useMemo(() => countBy(filtered, (r) => al(r.physicalActivityHours)), [filtered]);

  // 12. Qualidade do sono
  const sleepDist = useMemo(() => countBy(filtered, (r) => sl(r.sleepQuality)), [filtered]);

  // 13. Horas de sono
  const sleepHoursDist = useMemo(() => countBy(filtered, (r) => String((r as Record<string, unknown>).sleepHoursPerNight ?? "—") + "h"), [filtered]);

  // 14. Estresse
  const stressDist = useMemo(() => countBy(filtered, (r) => stl((r as Record<string, unknown>).stressLevel)), [filtered]);

  // 15. Ansiedade
  const anxietyDist = useMemo(() => countBy(filtered, (r) => fl((r as Record<string, unknown>).anxietyFrequency)), [filtered]);

  // 16. Sintomas mais comuns
  const symptomsData = useMemo(() => {
    const fields = [
      { key: "symptomFatigue", label: "Fadiga / Cansaço" },
      { key: "symptomWeightChange", label: "Variação de peso" },
      { key: "symptomExcessiveThirst", label: "Sede excessiva" },
      { key: "symptomDrySkin", label: "Pele seca" },
      { key: "symptomMoodChanges", label: "Alteração de humor" },
      { key: "symptomHairLoss", label: "Queda de cabelo" },
      { key: "symptomBrainFog", label: "Névoa mental / Dificuldade de concentração" },
      { key: "symptomConstantHunger", label: "Fome constante" },
      { key: "symptomFrequentUrination", label: "Urinar com frequência" },
      { key: "symptomPalpitations", label: "Palpitações" },
      { key: "symptomTemperatureSensitivity", label: "Sensibilidade ao frio/calor" },
    ];
    return fields
      .map(({ key, label }) => {
        const count = filtered.filter((r) => (r as Record<string, unknown>)[key] === 1).length;
        return { sintoma: label, quantidade: count, "%": total > 0 ? Math.round((count / total) * 100) : 0 };
      })
      .filter((s) => s.quantidade > 0)
      .sort((a, b) => b.quantidade - a.quantidade);
  }, [filtered, total]);

  // 17. Sintomas por faixa etária (radar)
  const symptomsRadar = useMemo(() => {
    const keys = ["symptomFatigue", "symptomWeightChange", "symptomBrainFog", "symptomConstantHunger", "symptomHairLoss", "symptomPalpitations"];
    const labels = ["Fadiga", "Variação Peso", "Névoa Mental", "Fome Const.", "Queda Cabelo", "Palpitações"];
    return labels.map((label, i) => {
      const key = keys[i];
      const entry: Record<string, unknown> = { sintoma: label };
      AGE_ORDER.forEach((ag) => {
        const group = filtered.filter((r) => getAgeGroup(r.age) === ag);
        if (group.length > 0) {
          entry[ag.split(" ")[0]] = Math.round((group.filter((r) => (r as Record<string, unknown>)[key] === 1).length / group.length) * 100);
        }
      });
      return entry;
    });
  }, [filtered]);

  // 18. Histórico familiar
  const familyHistory = useMemo(() => {
    const fields = [
      { key: "familyDiabetes", label: "Diabetes na família" },
      { key: "familyThyroidIssues", label: "Tireoide na família" },
      { key: "familyObesity", label: "Obesidade na família" },
    ];
    return fields.map(({ key, label }) => {
      const sim = filtered.filter((r) => {
        const v = String((r as Record<string, unknown>)[key] ?? "");
        return v === "yes" || v === "1st_degree" || v === "2nd_degree";
      }).length;
      return { doença: label, "Com histórico": sim, "Sem histórico": total - sim };
    });
  }, [filtered, total]);

  // 19. Fumo e álcool
  const smokingDist = useMemo(() => countBy(filtered, (r) => {
    const m: Record<string, string> = { never: "Nunca fumou", former: "Ex-fumante", occasional: "Ocasional", regular: "Fumante regular" };
    return m[r.smokingStatus ?? ""] ?? r.smokingStatus ?? "—";
  }), [filtered]);

  const alcoholDist = useMemo(() => countBy(filtered, (r) => {
    const m: Record<string, string> = { never: "Nunca", rarely: "Raramente", social: "Social", weekly: "Semanal", daily: "Diário" };
    return m[r.alcoholFrequency ?? ""] ?? r.alcoholFrequency ?? "—";
  }), [filtered]);

  // 20. Tempo de tela
  const screenTimeDist = useMemo(() => countBy(filtered, (r) => String((r as Record<string, unknown>).screenTimeHours ?? "—") + "h/dia"), [filtered]);

  // ── Exportar Excel ────────────────────────────────────────────────────────
  function exportExcel() {
    if (!filtered.length) { toast.error("Nenhuma resposta para exportar."); return; }

    const LABEL_MAP: Record<string, string> = {
      id: "ID", age: "Idade", gender: "Sexo", weight: "Peso (kg)", height: "Altura (cm)", bmi: "IMC",
      existingDiagnosis: "Diagnóstico existente", onMedication: "Usa medicamento",
      ultraProcessedFreq: "Ultraprocessados", fruitsVegetablesFreq: "Frutas/Verduras",
      sweetsFreq: "Doces", mealsPerDay: "Refeições/dia", waterLitersPerDay: "Água (L/dia)",
      sugaryDrinksFrequency: "Refrigerantes", fastFoodFrequency: "Fast Food",
      breakfastFrequency: "Café da manhã", lateNightEating: "Come à noite",
      dietType: "Tipo de dieta", physicalActivityHours: "Atividade física",
      smokingStatus: "Fumo", alcoholFrequency: "Álcool",
      sleepQuality: "Qualidade do sono", sleepHoursPerNight: "Horas de sono",
      wakeUpTired: "Acorda cansado", sleepLatency: "Tempo para dormir",
      screenTimeHours: "Tempo de tela", socialMediaHours: "Redes sociais",
      stressLevel: "Nível de estresse", anxietyFrequency: "Frequência de ansiedade",
      mentalHealthDiagnosis: "Diagnóstico saúde mental",
      symptomFatigue: "Sintoma: Fadiga", symptomWeightChange: "Sintoma: Variação peso",
      symptomExcessiveThirst: "Sintoma: Sede excessiva", symptomTemperatureSensitivity: "Sintoma: Sensibilidade temp.",
      symptomDrySkin: "Sintoma: Pele seca", symptomMoodChanges: "Sintoma: Alteração humor",
      symptomHairLoss: "Sintoma: Queda cabelo", symptomBrainFog: "Sintoma: Névoa mental",
      symptomConstantHunger: "Sintoma: Fome constante", symptomFrequentUrination: "Sintoma: Urinar frequente",
      symptomPalpitations: "Sintoma: Palpitações", bloodPressureMedication: "Medicação pressão",
      highBloodGlucoseHistory: "Histórico glicemia alta",
      irregularMenstrualCycle: "Ciclo menstrual irregular", pcosDiagnosis: "Diagnóstico SOP",
      familyDiabetes: "Família: Diabetes", familyThyroidIssues: "Família: Tireoide",
      familyObesity: "Família: Obesidade", findrisc_score: "Score FINDRISC",
      findrisc_risk_category: "Risco FINDRISC", submittedAt: "Data de envio",
    };

    const rows = filtered.map((r) => {
      const row: Record<string, unknown> = {};
      row["Faixa Etária"] = getAgeGroup(r.age);
      const keys = Object.keys(LABEL_MAP);
      keys.forEach((k) => {
        const val = (r as Record<string, unknown>)[k];
        row[LABEL_MAP[k]] = val instanceof Date ? val.toLocaleString("pt-BR") : (val ?? "");
      });
      return row;
    });

    const wb = XLSX.utils.book_new();

    // Aba 1: Respostas completas
    const ws1 = XLSX.utils.json_to_sheet(rows);
    const colWidths = Object.keys(rows[0] ?? {}).map((k) => ({ wch: Math.max(k.length + 2, 18) }));
    ws1["!cols"] = colWidths;
    XLSX.utils.book_append_sheet(wb, ws1, "Respostas");

    // Aba 2: Resumo KPIs
    const summary = [
      ["Indicador", "Valor"],
      ["Total de participantes", total],
      ["IMC médio", avgBmi ?? "—"],
      ["Idade média", avgAge ? `${avgAge} anos` : "—"],
      ["% Sedentários", `${sedentaryPct}%`],
      ["% Consomem muito ultraprocessado", `${highUltraPct}%`],
      ["", ""],
      ["Distribuição por sexo", ""],
      ...genderData.map(({ name, valor }) => [name, valor]),
      ["", ""],
      ["Distribuição por faixa etária", ""],
      ...ageGroupData.map(({ name, participantes }) => [name, participantes]),
      ["", ""],
      ["Distribuição de IMC", ""],
      ...bmiDist.map(({ name, valor }) => [name, valor]),
    ];
    const ws2 = XLSX.utils.aoa_to_sheet(summary);
    ws2["!cols"] = [{ wch: 40 }, { wch: 20 }];
    XLSX.utils.book_append_sheet(wb, ws2, "Resumo");

    XLSX.writeFile(wb, `EndocriCheck_Dados_${new Date().toLocaleDateString("pt-BR").replace(/\//g, "-")}.xlsx`);
    toast.success("Planilha Excel exportada com sucesso!");
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando dados da pesquisa...</p>
        </div>
      </div>
    );
  }

  const ageGroups = [...new Set(responses.map((r) => getAgeGroup(r.age)))].sort((a, b) => AGE_ORDER.indexOf(a) - AGE_ORDER.indexOf(b));
  const radarAgeKeys = [...new Set(filtered.map((r) => getAgeGroup(r.age).split(" ")[0]))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 p-4 md:p-6">
      {/* ── Cabeçalho ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-indigo-700">Dashboard EndocriCheck</h1>
          <p className="text-gray-500 mt-1">Análise de saúde endocrinológica e hábitos alimentares</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={() => refetch()} className="gap-2">
            <RefreshCw className="w-4 h-4" /> Atualizar
          </Button>
          <Button onClick={exportExcel} className="gap-2 bg-green-600 hover:bg-green-700 text-white">
            <Download className="w-4 h-4" /> Exportar Excel
          </Button>
        </div>
      </div>

      {/* ── Filtros ── */}
      <Card className="mb-6 border-0 shadow-sm">
        <CardContent className="pt-4 pb-3">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-medium text-gray-600">Faixa etária:</span>
              {["all", ...ageGroups].map((ag) => (
                <button
                  key={ag}
                  onClick={() => setFilterAge(ag)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterAge === ag ? "bg-indigo-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-indigo-100"
                  }`}
                >
                  {ag === "all" ? "Todas" : ag.split(" ")[0]}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Sexo:</span>
              {[["all","Todos"],["male","Masc."],["female","Fem."],["other","Outro"]].map(([v, l]) => (
                <button
                  key={v}
                  onClick={() => setFilterGender(v)}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                    filterGender === v ? "bg-purple-600 text-white shadow" : "bg-gray-100 text-gray-600 hover:bg-purple-100"
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {total === 0 ? (
        <Card className="border-0 shadow-sm">
          <CardContent className="py-20 text-center">
            <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-500">Nenhuma resposta ainda</h3>
            <p className="text-gray-400 mt-2">Compartilhe o QR Code para começar a coletar dados.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* ── KPIs ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { icon: <Users className="w-5 h-5 text-indigo-500" />, label: "Total de Respostas", value: total, sub: "participantes", color: "indigo" },
              { icon: <Activity className="w-5 h-5 text-blue-500" />, label: "IMC Médio", value: avgBmi ?? "—", sub: "índice de massa corporal", color: "blue" },
              { icon: <TrendingUp className="w-5 h-5 text-green-500" />, label: "Idade Média", value: avgAge ? `${avgAge} anos` : "—", sub: "dos participantes", color: "green" },
              { icon: <AlertTriangle className="w-5 h-5 text-orange-500" />, label: "Sedentários", value: `${sedentaryPct}%`, sub: "sem atividade física regular", color: "orange" },
            ].map((kpi, i) => (
              <Card key={i} className="border-0 shadow-sm hover:shadow-md transition-shadow">
                <CardContent className="pt-5 pb-4">
                  <div className="flex items-center gap-2 mb-2">{kpi.icon}<span className="text-xs text-gray-500 font-medium">{kpi.label}</span></div>
                  <div className="text-2xl font-bold text-gray-800">{kpi.value}</div>
                  <div className="text-xs text-gray-400 mt-1">{kpi.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Alerta ultraprocessados */}
          {highUltraPct >= 30 && (
            <Card className="mb-6 border-l-4 border-l-red-500 bg-red-50 border-0 shadow-sm">
              <CardContent className="py-3 flex items-center gap-3">
                <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <p className="text-sm text-red-700">
                  <strong>Atenção:</strong> {highUltraPct}% dos participantes consomem ultraprocessados com frequência ou diariamente — acima do limite recomendado de 30%.
                </p>
              </CardContent>
            </Card>
          )}

          {/* ── Seção 1: Perfil dos participantes ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-5 h-5 text-indigo-500" /> Perfil dos Participantes</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {/* Faixa etária */}
            <Card className="border-0 shadow-sm md:col-span-2">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Participantes por Faixa Etária</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={ageGroupData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="participantes" fill="#6366f1" radius={[4,4,0,0]}>
                      {ageGroupData.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Sexo */}
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Distribuição por Sexo</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie data={genderData} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${Math.round((percent ?? 0) * 100)}%`} labelLine={false}>
                      {genderData.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Participantes"]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* IMC */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">IMC Médio por Faixa Etária</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={bmiByAge} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 40]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="IMC Médio" fill="#06b6d4" radius={[4,4,0,0]}>
                      {bmiByAge.map((_, i) => <Cell key={i} fill={C[(i + 4) % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Classificação de IMC</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={bmiDist} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, percent }) => percent && percent > 0.05 ? `${name.split(" ")[0]} ${Math.round(percent * 100)}%` : ""} labelLine={false}>
                      {bmiDist.map((_, i) => <Cell key={i} fill={["#22c55e","#06b6d4","#f59e0b","#ef4444","#dc2626"][i % 5]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => [v, "Participantes"]} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Seção 2: Alimentação ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Utensils className="w-5 h-5 text-green-500" /> Hábitos Alimentares</h2>

          {foodByAge.length > 0 && (
            <Card className="border-0 shadow-sm mb-4">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Consumo Alimentar por Faixa Etária (escala 0=Nunca → 4=Diário)</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={foodByAge} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 4]} tick={{ fontSize: 11 }} />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend wrapperStyle={{ fontSize: 11 }} />
                    <Bar dataKey="Ultraprocessados" fill="#ef4444" radius={[3,3,0,0]} />
                    <Bar dataKey="Frutas/Verduras" fill="#22c55e" radius={[3,3,0,0]} />
                    <Bar dataKey="Doces" fill="#f59e0b" radius={[3,3,0,0]} />
                    <Bar dataKey="Refrigerantes" fill="#06b6d4" radius={[3,3,0,0]} />
                    <Bar dataKey="Fast Food" fill="#f97316" radius={[3,3,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Ultraprocessados", data: ultraDist },
              { title: "Frutas e Verduras", data: fruitsDist },
              { title: "Café da Manhã", data: breakfastDist },
              { title: "Tipo de Dieta", data: dietDist },
            ].map(({ title, data }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">{title}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={data} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={65} label={({ percent }) => percent && percent > 0.08 ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                        {data.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "Participantes"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-2 space-y-1">
                    {data.slice(0, 4).map(({ name, valor }, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: C[i % C.length] }} />{name}</span>
                        <Badge variant="secondary" className="text-xs">{valor}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Número de Refeições por Dia</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={mealsDist} layout="vertical" margin={{ top: 5, right: 20, left: 60, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={70} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Participantes" fill="#22c55e" radius={[0,4,4,0]}>
                      {mealsDist.map((_, i) => <Cell key={i} fill={C[(i+1) % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Atividade Física Semanal</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityDist} layout="vertical" margin={{ top: 5, right: 20, left: 70, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="valor" name="Participantes" fill="#6366f1" radius={[0,4,4,0]}>
                      {activityDist.map((_, i) => <Cell key={i} fill={C[(i+2) % C.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* ── Seção 3: Sono e Estresse ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Moon className="w-5 h-5 text-purple-500" /> Sono, Estresse e Bem-estar</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { title: "Qualidade do Sono", data: sleepDist },
              { title: "Horas de Sono por Noite", data: sleepHoursDist },
              { title: "Nível de Estresse", data: stressDist },
              { title: "Frequência de Ansiedade", data: anxietyDist },
            ].map(({ title, data }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">{title}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={data} dataKey="valor" nameKey="name" cx="50%" cy="50%" outerRadius={60} label={({ percent }) => percent && percent > 0.08 ? `${Math.round(percent * 100)}%` : ""} labelLine={false}>
                        {data.map((_, i) => <Cell key={i} fill={C[(i+3) % C.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: number) => [v, "Participantes"]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-1 space-y-1">
                    {data.slice(0, 4).map(({ name, valor }, i) => (
                      <div key={i} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: C[(i+3) % C.length] }} />{name}</span>
                        <Badge variant="secondary" className="text-xs">{valor}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Fumo, Álcool, Tela */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {[
              { title: "Hábito de Fumar", data: smokingDist },
              { title: "Consumo de Álcool", data: alcoholDist },
              { title: "Tempo de Tela por Dia", data: screenTimeDist },
            ].map(({ title, data }) => (
              <Card key={title} className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">{title}</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 30 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" />
                      <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="valor" name="Participantes" radius={[4,4,0,0]}>
                        {data.map((_, i) => <Cell key={i} fill={C[(i+5) % C.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* ── Seção 4: Sintomas ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Zap className="w-5 h-5 text-yellow-500" /> Sintomas Endócrinos</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Sintomas Mais Relatados</CardTitle></CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={symptomsData} layout="vertical" margin={{ top: 5, right: 40, left: 160, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis type="category" dataKey="sintoma" tick={{ fontSize: 10 }} width={165} />
                    <Tooltip formatter={(v: number, name: string) => [name === "%" ? `${v}%` : v, name]} />
                    <Bar dataKey="quantidade" name="Participantes" fill="#8b5cf6" radius={[0,4,4,0]}>
                      {symptomsData.map((_, i) => <Cell key={i} fill={C[(i+6) % C.length]} />)}
                    </Bar>
                    <Bar dataKey="%" name="% do total" fill="#c4b5fd" radius={[0,4,4,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {radarAgeKeys.length > 1 && (
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold text-gray-600">Sintomas por Faixa Etária (% com sintoma)</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={280}>
                    <RadarChart data={symptomsRadar} margin={{ top: 10, right: 30, left: 30, bottom: 10 }}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="sintoma" tick={{ fontSize: 10 }} />
                      {radarAgeKeys.map((ag, i) => (
                        <Radar key={ag} name={ag} dataKey={ag} stroke={C[i % C.length]} fill={C[i % C.length]} fillOpacity={0.15} />
                      ))}
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Tooltip />
                    </RadarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}
          </div>

          {/* ── Seção 5: Histórico familiar ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Heart className="w-5 h-5 text-red-500" /> Histórico Familiar de Doenças</h2>
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="pt-4">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={familyHistory} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="doença" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="Com histórico" fill="#ef4444" radius={[4,4,0,0]} />
                  <Bar dataKey="Sem histórico" fill="#22c55e" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* ── Seção 6: Tabela de respostas ── */}
          <h2 className="text-lg font-bold text-gray-700 mb-3 flex items-center gap-2"><Brain className="w-5 h-5 text-indigo-500" /> Últimas Respostas</h2>
          <Card className="border-0 shadow-sm mb-6">
            <CardContent className="pt-4 overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="border-b border-gray-200">
                    {["#","Faixa Etária","Sexo","IMC","Ultraprocessados","Frutas/Verduras","Atividade Física","Sono","Estresse","Data"].map((h) => (
                      <th key={h} className="pb-2 pr-4 font-semibold text-gray-500 whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(-50).reverse().map((r, i) => (
                    <tr key={r.id} className={`border-b border-gray-50 ${i % 2 === 0 ? "bg-gray-50/50" : ""}`}>
                      <td className="py-2 pr-4 text-gray-400">{r.id}</td>
                      <td className="py-2 pr-4 whitespace-nowrap">{getAgeGroup(r.age)}</td>
                      <td className="py-2 pr-4">{gl(r.gender)}</td>
                      <td className="py-2 pr-4">
                        <Badge variant={r.bmi > 0 && r.bmi < 25 ? "default" : "destructive"} className="text-xs">
                          {r.bmi > 0 ? r.bmi.toFixed(1) : "—"}
                        </Badge>
                      </td>
                      <td className="py-2 pr-4">{fl(r.ultraProcessedFreq)}</td>
                      <td className="py-2 pr-4">{fl(r.fruitsVegetablesFreq)}</td>
                      <td className="py-2 pr-4">{al(r.physicalActivityHours)}</td>
                      <td className="py-2 pr-4">{sl(r.sleepQuality)}</td>
                      <td className="py-2 pr-4">{stl((r as Record<string, unknown>).stressLevel)}</td>
                      <td className="py-2 pr-4 text-gray-400 whitespace-nowrap">
                        {r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("pt-BR") : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
