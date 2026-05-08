import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, RadarChart, Radar, PolarGrid, PolarAngleAxis,
  LineChart, Line,
} from "recharts";
import {
  Users, Download, RefreshCw, TrendingUp, AlertTriangle, Activity, Utensils, Brain, Heart,
} from "lucide-react";
import * as XLSX from "xlsx";

// ── Paleta de cores ──────────────────────────────────────────────────────────
const COLORS = ["#6366f1", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#f97316", "#ec4899"];
const AGE_ORDER = ["Criança (até 12)", "Adolescente (13-17)", "Jovem Adulto (18-24)", "Adulto (25-39)", "Adulto Maduro (40-59)", "Idoso (60+)"];

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAgeGroup(age: number): string {
  if (age < 13) return "Criança (até 12)";
  if (age <= 17) return "Adolescente (13-17)";
  if (age <= 24) return "Jovem Adulto (18-24)";
  if (age <= 39) return "Adulto (25-39)";
  if (age <= 59) return "Adulto Maduro (40-59)";
  return "Idoso (60+)";
}

function freqScore(v: string | null | undefined): number {
  const map: Record<string, number> = { never: 0, rarely: 1, sometimes: 2, often: 3, daily: 4 };
  return map[v ?? ""] ?? -1;
}

function freqLabel(v: string | null | undefined): string {
  const map: Record<string, string> = {
    never: "Nunca", rarely: "Raramente", sometimes: "Às vezes", often: "Frequentemente", daily: "Diariamente",
  };
  return map[v ?? ""] ?? v ?? "—";
}

function genderLabel(v: string | null | undefined): string {
  const map: Record<string, string> = { male: "Masculino", female: "Feminino", other: "Outro", prefer_not_to_say: "Prefiro não dizer" };
  return map[v ?? ""] ?? v ?? "—";
}

function bmiCategory(bmi: number | null | undefined): string {
  if (!bmi) return "Desconhecido";
  if (bmi < 18.5) return "Abaixo do peso";
  if (bmi < 25) return "Peso normal";
  if (bmi < 30) return "Sobrepeso";
  return "Obesidade";
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Dashboard() {
  const [filterAgeGroup, setFilterAgeGroup] = useState<string>("all");
  const [filterGender, setFilterGender] = useState<string>("all");

  const { data: responses, isLoading, refetch } = trpc.survey.getAll.useQuery();

  // ── Filtro ──────────────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!responses) return [];
    return responses.filter((r) => {
      const ag = getAgeGroup(r.age);
      if (filterAgeGroup !== "all" && ag !== filterAgeGroup) return false;
      if (filterGender !== "all" && r.gender !== filterGender) return false;
      return true;
    });
  }, [responses, filterAgeGroup, filterGender]);

  const total = filtered.length;

  // ── Distribuição por faixa etária ───────────────────────────────────────────
  const ageGroupData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => {
      const g = getAgeGroup(r.age);
      counts[g] = (counts[g] ?? 0) + 1;
    });
    return AGE_ORDER.filter((g) => counts[g]).map((g) => ({ name: g, quantidade: counts[g] }));
  }, [filtered]);

  // ── Distribuição por sexo ───────────────────────────────────────────────────
  const genderData = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const g = genderLabel(r.gender); counts[g] = (counts[g] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── IMC por faixa etária ────────────────────────────────────────────────────
  const bmiByAgeGroup = useMemo(() => {
    const groups: Record<string, { sum: number; count: number }> = {};
    filtered.forEach((r) => {
      if (!r.bmi) return;
      const g = getAgeGroup(r.age);
      if (!groups[g]) groups[g] = { sum: 0, count: 0 };
      groups[g].sum += r.bmi;
      groups[g].count++;
    });
    return AGE_ORDER.filter((g) => groups[g]).map((g) => ({
      name: g.split(" ")[0],
      "IMC Médio": parseFloat((groups[g].sum / groups[g].count).toFixed(1)),
    }));
  }, [filtered]);

  // ── Distribuição de IMC ─────────────────────────────────────────────────────
  const bmiDistribution = useMemo(() => {
    const cats: Record<string, number> = { "Abaixo do peso": 0, "Peso normal": 0, "Sobrepeso": 0, "Obesidade": 0 };
    filtered.forEach((r) => { const c = bmiCategory(r.bmi); if (c in cats) cats[c]++; });
    return Object.entries(cats).filter(([, v]) => v > 0).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Hábitos alimentares por faixa etária ────────────────────────────────────
  const foodByAgeGroup = useMemo(() => {
    const groups: Record<string, { ultra: number[]; fruits: number[]; sweets: number[]; drinks: number[]; fastfood: number[] }> = {};
    filtered.forEach((r) => {
      const g = getAgeGroup(r.age).split(" ")[0];
      if (!groups[g]) groups[g] = { ultra: [], fruits: [], sweets: [], drinks: [], fastfood: [] };
      const u = freqScore(r.ultraProcessedFreq); if (u >= 0) groups[g].ultra.push(u);
      const f = freqScore(r.fruitsVegetablesFreq); if (f >= 0) groups[g].fruits.push(f);
      const s = freqScore(r.sweetsFreq); if (s >= 0) groups[g].sweets.push(s);
      const d = freqScore((r as Record<string, unknown>).sugaryDrinksFrequency as string); if (d >= 0) groups[g].drinks.push(d);
      const ff = freqScore((r as Record<string, unknown>).fastFoodFrequency as string); if (ff >= 0) groups[g].fastfood.push(ff);
    });
    const avg = (arr: number[]) => arr.length ? parseFloat((arr.reduce((a, b) => a + b, 0) / arr.length).toFixed(2)) : 0;
    return Object.entries(groups).map(([name, v]) => ({
      name,
      "Ultraprocessados": avg(v.ultra),
      "Frutas/Verduras": avg(v.fruits),
      "Doces": avg(v.sweets),
      "Refrigerantes": avg(v.drinks),
      "Fast Food": avg(v.fastfood),
    }));
  }, [filtered]);

  // ── Frequência de ultraprocessados (pizza chart) ────────────────────────────
  const ultraProcessedDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = freqLabel(r.ultraProcessedFreq); counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Frutas e verduras ───────────────────────────────────────────────────────
  const fruitsDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = freqLabel(r.fruitsVegetablesFreq); counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Café da manhã ───────────────────────────────────────────────────────────
  const breakfastDist = useMemo(() => {
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = freqLabel((r as Record<string, unknown>).breakfastFrequency as string); counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Atividade física ────────────────────────────────────────────────────────
  const activityData = useMemo(() => {
    const map: Record<string, string> = { none: "Sedentário", "1-2": "1-2h/sem", "3-4": "3-4h/sem", "5-7": "5-7h/sem", "8+": "8+h/sem" };
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = map[r.physicalActivityHours ?? ""] ?? r.physicalActivityHours ?? "—"; counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Sintomas mais comuns ────────────────────────────────────────────────────
  const symptomsData = useMemo(() => {
    const fields = [
      { key: "symptomFatigue", label: "Fadiga" },
      { key: "symptomWeightChange", label: "Variação de peso" },
      { key: "symptomExcessiveThirst", label: "Sede excessiva" },
      { key: "symptomDrySkin", label: "Pele seca" },
      { key: "symptomMoodChanges", label: "Alteração de humor" },
      { key: "symptomHairLoss", label: "Queda de cabelo" },
      { key: "symptomBrainFog", label: "Névoa mental" },
      { key: "symptomConstantHunger", label: "Fome constante" },
      { key: "symptomFrequentUrination", label: "Urinar frequente" },
      { key: "symptomPalpitations", label: "Palpitações" },
    ];
    return fields.map(({ key, label }) => ({
      sintoma: label,
      quantidade: filtered.filter((r) => (r as Record<string, unknown>)[key] === 1).length,
      percentual: total > 0 ? Math.round((filtered.filter((r) => (r as Record<string, unknown>)[key] === 1).length / total) * 100) : 0,
    })).sort((a, b) => b.quantidade - a.quantidade);
  }, [filtered, total]);

  // ── Sintomas por faixa etária (radar) ──────────────────────────────────────
  const symptomsByAge = useMemo(() => {
    const symptomKeys = ["symptomFatigue", "symptomWeightChange", "symptomBrainFog", "symptomConstantHunger", "symptomHairLoss"];
    const symptomLabels = ["Fadiga", "Variação Peso", "Névoa Mental", "Fome Const.", "Queda Cabelo"];
    return symptomLabels.map((label, i) => {
      const key = symptomKeys[i];
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

  // ── Qualidade do sono ───────────────────────────────────────────────────────
  const sleepData = useMemo(() => {
    const map: Record<string, string> = { very_good: "Muito boa", good: "Boa", fair: "Regular", poor: "Ruim", very_poor: "Muito ruim" };
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = map[r.sleepQuality ?? ""] ?? "—"; counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Estresse ────────────────────────────────────────────────────────────────
  const stressData = useMemo(() => {
    const map: Record<string, string> = { low: "Baixo", moderate: "Moderado", high: "Alto", very_high: "Muito alto" };
    const counts: Record<string, number> = {};
    filtered.forEach((r) => { const l = map[(r as Record<string, unknown>).stressLevel as string ?? ""] ?? "—"; counts[l] = (counts[l] ?? 0) + 1; });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [filtered]);

  // ── Histórico familiar ──────────────────────────────────────────────────────
  const familyData = useMemo(() => {
    const hasDiabetes = filtered.filter((r) => r.familyDiabetes && r.familyDiabetes !== "no").length;
    const hasThyroid = filtered.filter((r) => r.familyThyroidIssues && r.familyThyroidIssues !== "no").length;
    const hasObesity = filtered.filter((r) => r.familyObesity && r.familyObesity !== "no").length;
    return [
      { name: "Diabetes", com: hasDiabetes, sem: total - hasDiabetes },
      { name: "Tireoide", com: hasThyroid, sem: total - hasThyroid },
      { name: "Obesidade", com: hasObesity, sem: total - hasObesity },
    ];
  }, [filtered, total]);

  // ── Exportar XLSX ───────────────────────────────────────────────────────────
  const handleExportXLSX = () => {
    if (!filtered || filtered.length === 0) { toast.error("Nenhum dado para exportar"); return; }

    const freqMap: Record<string, string> = { never: "Nunca", rarely: "Raramente", sometimes: "Às vezes", often: "Frequentemente", daily: "Diariamente" };
    const yesNo: Record<string, string> = { yes: "Sim", no: "Não", unsure: "Não sei", unknown: "Não sei" };

    const rows = filtered.map((r) => ({
      "ID": r.id,
      "Faixa Etária": getAgeGroup(r.age),
      "Idade": r.age,
      "Sexo": genderLabel(r.gender),
      "Peso (kg)": r.weight,
      "Altura (cm)": r.height,
      "IMC": r.bmi,
      "Categoria IMC": bmiCategory(r.bmi),
      "Diagnóstico Existente": r.existingDiagnosis ?? "",
      "Usa Medicamento": yesNo[(r as Record<string, unknown>).onMedication as string ?? ""] ?? "",
      "Ultraprocessados": freqMap[r.ultraProcessedFreq ?? ""] ?? "",
      "Frutas e Verduras": freqMap[r.fruitsVegetablesFreq ?? ""] ?? "",
      "Doces": freqMap[r.sweetsFreq ?? ""] ?? "",
      "Refrigerantes": freqMap[(r as Record<string, unknown>).sugaryDrinksFrequency as string ?? ""] ?? "",
      "Fast Food": freqMap[(r as Record<string, unknown>).fastFoodFrequency as string ?? ""] ?? "",
      "Café da Manhã": freqMap[(r as Record<string, unknown>).breakfastFrequency as string ?? ""] ?? "",
      "Come após 22h": (r as Record<string, unknown>).lateNightEating === "yes" ? "Sim" : (r as Record<string, unknown>).lateNightEating === "sometimes" ? "Às vezes" : "Não",
      "Tipo de Dieta": (r as Record<string, unknown>).dietType ?? "",
      "Refeições/Dia": r.mealsPerDay ?? "",
      "Água (L/dia)": r.waterLitersPerDay ?? "",
      "Atividade Física": r.physicalActivityHours ?? "",
      "Fumo": r.smokingStatus ?? "",
      "Álcool": r.alcoholFrequency ?? "",
      "Tempo de Tela": (r as Record<string, unknown>).screenTimeHours ?? "",
      "Qualidade do Sono": r.sleepQuality ?? "",
      "Horas de Sono": (r as Record<string, unknown>).sleepHoursPerNight ?? "",
      "Nível de Estresse": (r as Record<string, unknown>).stressLevel ?? "",
      "Ansiedade": (r as Record<string, unknown>).anxietyFrequency ?? "",
      "Sintoma: Fadiga": r.symptomFatigue === 1 ? "Sim" : "Não",
      "Sintoma: Variação de Peso": r.symptomWeightChange === 1 ? "Sim" : "Não",
      "Sintoma: Sede Excessiva": r.symptomExcessiveThirst === 1 ? "Sim" : "Não",
      "Sintoma: Pele Seca": r.symptomDrySkin === 1 ? "Sim" : "Não",
      "Sintoma: Alteração de Humor": r.symptomMoodChanges === 1 ? "Sim" : "Não",
      "Sintoma: Queda de Cabelo": (r as Record<string, unknown>).symptomHairLoss === 1 ? "Sim" : "Não",
      "Sintoma: Névoa Mental": (r as Record<string, unknown>).symptomBrainFog === 1 ? "Sim" : "Não",
      "Sintoma: Fome Constante": (r as Record<string, unknown>).symptomConstantHunger === 1 ? "Sim" : "Não",
      "Sintoma: Urinar Frequente": (r as Record<string, unknown>).symptomFrequentUrination === 1 ? "Sim" : "Não",
      "Sintoma: Palpitações": (r as Record<string, unknown>).symptomPalpitations === 1 ? "Sim" : "Não",
      "Glicemia Alta (histórico)": yesNo[r.highBloodGlucoseHistory ?? ""] ?? "",
      "Ciclo Menstrual Irregular": yesNo[(r as Record<string, unknown>).irregularMenstrualCycle as string ?? ""] ?? "",
      "Diagnóstico SOP": yesNo[(r as Record<string, unknown>).pcosDiagnosis as string ?? ""] ?? "",
      "Diabetes Familiar": r.familyDiabetes ?? "",
      "Tireoide Familiar": r.familyThyroidIssues ?? "",
      "Obesidade Familiar": r.familyObesity ?? "",
      "Pontuação FINDRISC": r.findrisc_score ?? "",
      "Risco FINDRISC": r.findrisc_risk_category ?? "",
      "Data de Submissão": r.submittedAt ? new Date(r.submittedAt).toLocaleString("pt-BR") : "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Respostas");

    // Aba de resumo
    const summaryRows = [
      { "Métrica": "Total de respostas", "Valor": total },
      { "Métrica": "IMC médio", "Valor": filtered.length > 0 ? parseFloat((filtered.reduce((s, r) => s + (r.bmi ?? 0), 0) / filtered.length).toFixed(1)) : 0 },
      { "Métrica": "Idade média", "Valor": filtered.length > 0 ? parseFloat((filtered.reduce((s, r) => s + r.age, 0) / filtered.length).toFixed(1)) : 0 },
      { "Métrica": "% com sintoma de fadiga", "Valor": total > 0 ? Math.round((filtered.filter((r) => r.symptomFatigue === 1).length / total) * 100) + "%" : "0%" },
      { "Métrica": "% sedentários", "Valor": total > 0 ? Math.round((filtered.filter((r) => r.physicalActivityHours === "none").length / total) * 100) + "%" : "0%" },
    ];
    const ws2 = XLSX.utils.json_to_sheet(summaryRows);
    XLSX.utils.book_append_sheet(wb, ws2, "Resumo");

    XLSX.writeFile(wb, `endocricheck-respostas-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success(`Planilha exportada com ${rows.length} respostas!`);
  };

  // ── Estatísticas rápidas ────────────────────────────────────────────────────
  const avgBmi = filtered.length > 0 ? (filtered.reduce((s, r) => s + (r.bmi ?? 0), 0) / filtered.length).toFixed(1) : "—";
  const avgAge = filtered.length > 0 ? (filtered.reduce((s, r) => s + r.age, 0) / filtered.length).toFixed(0) : "—";
  const sedentaryPct = total > 0 ? Math.round((filtered.filter((r) => r.physicalActivityHours === "none").length / total) * 100) : 0;
  const highUltraPct = total > 0 ? Math.round((filtered.filter((r) => freqScore(r.ultraProcessedFreq) >= 3).length / total) * 100) : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-indigo-600" />
          <p className="text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-indigo-900">Dashboard EndocriCheck</h1>
            <p className="text-gray-500 text-sm mt-1">Análise de saúde endocrinológica e hábitos alimentares</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={() => refetch()} className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4" /> Atualizar
            </Button>
            <Button onClick={handleExportXLSX} className="bg-green-600 hover:bg-green-700 flex items-center gap-2">
              <Download className="w-4 h-4" /> Exportar Excel
            </Button>
          </div>
        </div>

        {/* ── Filtros ── */}
        <Card>
          <CardContent className="pt-4 pb-3">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm font-semibold text-gray-600">Filtrar por:</span>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center">Faixa etária:</span>
                {["all", ...AGE_ORDER].map((ag) => (
                  <Badge
                    key={ag}
                    variant={filterAgeGroup === ag ? "default" : "outline"}
                    className="cursor-pointer text-xs"
                    onClick={() => setFilterAgeGroup(ag)}
                  >
                    {ag === "all" ? "Todas" : ag.split(" ")[0]}
                  </Badge>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-500 self-center">Sexo:</span>
                {[{ v: "all", l: "Todos" }, { v: "male", l: "Masc." }, { v: "female", l: "Fem." }, { v: "other", l: "Outro" }].map(({ v, l }) => (
                  <Badge key={v} variant={filterGender === v ? "default" : "outline"} className="cursor-pointer text-xs" onClick={() => setFilterGender(v)}>
                    {l}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── KPIs ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: <Users className="w-5 h-5 text-indigo-600" />, label: "Total de Respostas", value: total, sub: "participantes" },
            { icon: <Activity className="w-5 h-5 text-blue-600" />, label: "IMC Médio", value: avgBmi, sub: bmiCategory(parseFloat(avgBmi as string)) },
            { icon: <TrendingUp className="w-5 h-5 text-green-600" />, label: "Idade Média", value: avgAge + " anos", sub: "dos participantes" },
            { icon: <AlertTriangle className="w-5 h-5 text-red-500" />, label: "Sedentários", value: sedentaryPct + "%", sub: "sem atividade física" },
          ].map(({ icon, label, value, sub }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-1">{icon}<span className="text-xs text-gray-500">{label}</span></div>
                <p className="text-2xl font-bold text-gray-800">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {total === 0 && (
          <Card>
            <CardContent className="pt-8 pb-8 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-lg font-medium">Nenhuma resposta ainda</p>
              <p className="text-gray-400 text-sm">Compartilhe o QR Code para começar a coletar dados.</p>
            </CardContent>
          </Card>
        )}

        {total > 0 && (
          <>
            {/* ── Linha 1: Faixa etária + Sexo ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="w-4 h-4" />Participantes por Faixa Etária</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={ageGroupData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="quantidade" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Distribuição por Sexo</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={genderData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {genderData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 2: IMC ── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="w-4 h-4" />IMC Médio por Faixa Etária</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={bmiByAgeGroup}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis domain={[15, 35]} />
                      <Tooltip />
                      <Bar dataKey="IMC Médio" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Distribuição de IMC</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={bmiDistribution} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {bmiDistribution.map((_, i) => <Cell key={i} fill={["#06b6d4", "#22c55e", "#f59e0b", "#ef4444"][i % 4]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 3: Hábitos alimentares por faixa etária ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Utensils className="w-4 h-4" />
                  Hábitos Alimentares por Faixa Etária
                  <span className="text-xs font-normal text-gray-400">(0=Nunca · 4=Diariamente)</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={foodByAgeGroup}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis domain={[0, 4]} ticks={[0, 1, 2, 3, 4]} tickFormatter={(v) => ["Nunca", "Raro", "Às vezes", "Freq.", "Diário"][v]} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Ultraprocessados" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Frutas/Verduras" fill="#22c55e" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Doces" fill="#f59e0b" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Refrigerantes" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="Fast Food" fill="#f97316" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Linha 4: Ultraprocessados + Frutas ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm text-red-700">🍟 Ultraprocessados</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={ultraProcessedDist} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {ultraProcessedDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v, n) => [v, n]} />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm text-green-700">🥦 Frutas e Verduras</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={fruitsDist} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {fruitsDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm text-yellow-700">☀️ Café da Manhã</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={breakfastDist} cx="50%" cy="50%" outerRadius={65} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {breakfastDist.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 5: Sintomas ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-500" />
                  Sintomas Mais Frequentes
                  <Badge variant="outline" className="text-xs">{total} respostas</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={symptomsData} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" domain={[0, total]} />
                    <YAxis dataKey="sintoma" type="category" width={130} tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v) => [`${v} pessoas (${Math.round((Number(v) / total) * 100)}%)`]} />
                    <Bar dataKey="quantidade" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Linha 6: Atividade física + Sono + Estresse ── */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader><CardTitle className="text-sm">🏃 Atividade Física</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={activityData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {activityData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm">😴 Qualidade do Sono</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={sleepData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {sleepData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-sm flex items-center gap-1"><Brain className="w-4 h-4" />Nível de Estresse</CardTitle></CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie data={stressData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`} labelLine={false}>
                        {stressData.map((_, i) => <Cell key={i} fill={["#22c55e", "#f59e0b", "#f97316", "#ef4444"][i % 4]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend iconSize={10} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* ── Linha 7: Histórico familiar ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" />
                  Histórico Familiar de Doenças
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={familyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis allowDecimals={false} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="com" name="Com histórico" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="sem" name="Sem histórico" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* ── Alerta de alto consumo de ultraprocessados ── */}
            {highUltraPct >= 30 && (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="pt-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-red-800">Alerta: Alto consumo de ultraprocessados</p>
                      <p className="text-sm text-red-700 mt-1">
                        <strong>{highUltraPct}%</strong> dos participantes consomem alimentos ultraprocessados frequentemente ou diariamente.
                        Isso está associado a maior risco de obesidade, diabetes tipo 2 e doenças cardiovasculares.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* ── Tabela de respostas ── */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Respostas Individuais</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-gray-50">
                        <th className="text-left p-2">ID</th>
                        <th className="text-left p-2">Faixa Etária</th>
                        <th className="text-left p-2">Sexo</th>
                        <th className="text-left p-2">IMC</th>
                        <th className="text-left p-2">Ultraproc.</th>
                        <th className="text-left p-2">Frutas</th>
                        <th className="text-left p-2">Atividade</th>
                        <th className="text-left p-2">Sono</th>
                        <th className="text-left p-2">Estresse</th>
                        <th className="text-left p-2">Data</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.slice(0, 50).map((r) => (
                        <tr key={r.id} className="border-b hover:bg-gray-50">
                          <td className="p-2 text-gray-500">#{r.id}</td>
                          <td className="p-2">{getAgeGroup(r.age).split(" ")[0]}</td>
                          <td className="p-2">{genderLabel(r.gender).slice(0, 4)}.</td>
                          <td className="p-2">
                            <span className={`font-medium ${r.bmi && r.bmi >= 30 ? "text-red-600" : r.bmi && r.bmi >= 25 ? "text-yellow-600" : "text-green-600"}`}>
                              {r.bmi?.toFixed(1)}
                            </span>
                          </td>
                          <td className="p-2">{freqLabel(r.ultraProcessedFreq).slice(0, 8)}</td>
                          <td className="p-2">{freqLabel(r.fruitsVegetablesFreq).slice(0, 8)}</td>
                          <td className="p-2">{r.physicalActivityHours ?? "—"}</td>
                          <td className="p-2">{r.sleepQuality ?? "—"}</td>
                          <td className="p-2">{(r as Record<string, unknown>).stressLevel as string ?? "—"}</td>
                          <td className="p-2 text-gray-400">{r.submittedAt ? new Date(r.submittedAt).toLocaleDateString("pt-BR") : "—"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {filtered.length > 50 && (
                    <p className="text-xs text-gray-400 mt-2 text-center">Mostrando 50 de {filtered.length} respostas. Exporte o Excel para ver todas.</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
