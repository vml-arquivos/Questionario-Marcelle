import { useState, useMemo } from "react";
import * as XLSX from "xlsx";
import { useQuery } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import {
  BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";

// ═══════════════════════════════════════════════════════════════════════════
// DICIONÁRIOS DE TRADUÇÃO — cobre todos os valores reais do banco
// ═══════════════════════════════════════════════════════════════════════════

const SEXO: Record<string, string> = {
  male: "Masculino",
  female: "Feminino",
  other: "Outro",
};

const FREQUENCIA: Record<string, string> = {
  never:       "Nunca",
  rarely:      "Raramente",
  sometimes:   "Às vezes",
  often:       "Com frequência",
  frequently:  "Frequentemente",
  always:      "Sempre / Todo dia",
  "1-2x_week": "1 a 2 vezes por semana",
  "3-5x_week": "3 a 5 vezes por semana",
  daily:       "Diariamente",
  every_day:   "Todo dia",
};

const ATIVIDADE: Record<string, string> = {
  none:    "Sedentário (nenhuma)",
  light:   "Leve (caminhada, etc.)",
  "1-2":   "1 a 2 horas por semana",
  "1-3":   "1 a 3 horas por semana",
  "3-4":   "3 a 4 horas por semana",
  "5-7":   "5 a 7 horas por semana",
  ">=4":   "4 ou mais horas por semana",
  active:  "Muito ativo",
  moderate:"Moderado",
  intense: "Intenso",
};

const SONO_QUALIDADE: Record<string, string> = {
  excellent: "Excelente",
  good:      "Boa",
  fair:      "Regular",
  poor:      "Ruim",
};

const SONO_HORAS: Record<string, string> = {
  "<5":   "Menos de 5 horas",
  "5-6":  "5 a 6 horas",
  "6-7":  "6 a 7 horas",
  "7-8":  "7 a 8 horas",
  ">8":   "Mais de 8 horas",
};

const LATENCIA: Record<string, string> = {
  "<15min":   "Menos de 15 minutos",
  "15-30min": "15 a 30 minutos",
  "30-60min": "30 a 60 minutos",
  ">60min":   "Mais de 1 hora",
};

const ESTRESSE: Record<string, string> = {
  low:       "Baixo",
  moderate:  "Moderado",
  high:      "Alto",
  very_high: "Muito alto",
};

const ANSIEDADE: Record<string, string> = {
  never:     "Nunca",
  rarely:    "Raramente",
  sometimes: "Às vezes",
  often:     "Com frequência",
  always:    "Sempre",
};

const TABAGISMO: Record<string, string> = {
  never:  "Nunca fumou",
  former: "Ex-fumante",
  ex:     "Ex-fumante",
  current:"Fumante ativo",
};

const ALCOOL: Record<string, string> = {
  never:   "Nunca",
  rarely:  "Raramente",
  social:  "Socialmente",
  weekly:  "Toda semana",
  daily:   "Todo dia",
};

const DIETA: Record<string, string> = {
  omnivore:   "Onívoro (come de tudo)",
  vegetarian: "Vegetariano",
  vegan:      "Vegano",
  low_carb:   "Low Carb",
  other:      "Outro",
};

const TELA: Record<string, string> = {
  "<2":  "Menos de 2 horas",
  "2-4": "2 a 4 horas",
  "4-6": "4 a 6 horas",
  "6-8": "6 a 8 horas",
  ">8":  "Mais de 8 horas",
};

const HISTORICO_FAMILIAR: Record<string, string> = {
  no:         "Não tem",
  yes:        "Tem histórico",
  "1st_degree": "Parente próximo (pai, mãe, irmão)",
  "2nd_degree": "Parente distante (avó, tio)",
  unknown:    "Não sabe informar",
  None:       "Não informado",
};

const RISCO_FINDRISC: Record<string, string> = {
  low:               "Baixo (< 7 pontos)",
  slightly_elevated: "Levemente elevado (7-11)",
  moderate:          "Moderado (12-14)",
  high:              "Alto (15-20)",
  very_high:         "Muito alto (> 20)",
};

const SIM_NAO: Record<string, string> = {
  yes:  "Sim",
  no:   "Não",
  None: "Não informado",
};

const DIAGNOSTICO: Record<string, string> = {
  none:       "Nenhum diagnóstico",
  None:       "Nenhum diagnóstico",
  diabetes:   "Diabetes",
  thyroid:    "Tireoide",
  obesity:    "Obesidade",
  other:      "Outro",
};

// ═══════════════════════════════════════════════════════════════════════════
// FAIXAS ETÁRIAS — fixas, sem duplicatas
// ═══════════════════════════════════════════════════════════════════════════

const FAIXAS = [
  { chave: "Criança",       min: 0,  max: 12,  label: "Criança (até 12 anos)"      },
  { chave: "Adolescente",   min: 13, max: 17,  label: "Adolescente (13 a 17 anos)" },
  { chave: "Jovem",         min: 18, max: 24,  label: "Jovem (18 a 24 anos)"       },
  { chave: "Adulto",        min: 25, max: 39,  label: "Adulto (25 a 39 anos)"      },
  { chave: "Adulto Maduro", min: 40, max: 59,  label: "Adulto Maduro (40 a 59)"    },
  { chave: "Idoso",         min: 60, max: 999, label: "Idoso (60 anos ou mais)"    },
];

const getFaixa = (idade: number): string => {
  for (const f of FAIXAS) if (idade >= f.min && idade <= f.max) return f.chave;
  return "Outro";
};

// ═══════════════════════════════════════════════════════════════════════════
// CLASSIFICAÇÃO DE IMC (OMS)
// ═══════════════════════════════════════════════════════════════════════════

const classificarIMC = (imc: number): string => {
  if (imc < 18.5) return "Abaixo do peso";
  if (imc < 25.0) return "Peso normal";
  if (imc < 30.0) return "Sobrepeso";
  if (imc < 35.0) return "Obesidade Grau I";
  if (imc < 40.0) return "Obesidade Grau II";
  return "Obesidade Grau III";
};

// ═══════════════════════════════════════════════════════════════════════════
// UTILITÁRIOS
// ═══════════════════════════════════════════════════════════════════════════

const toNum = (v: unknown): number => {
  const n = parseFloat(String(v ?? "0"));
  return isNaN(n) ? 0 : n;
};

// Traduz qualquer valor usando um dicionário, com fallback legível
const traduz = (dicio: Record<string, string>, valor: string | null | undefined): string => {
  if (!valor || valor === "None" || valor === "null") return "Não informado";
  return dicio[valor] ?? valor;
};

// Conta ocorrências e retorna array [{name, valor, pct}]
const contarGrupos = (arr: string[]): { name: string; valor: number; pct: number }[] => {
  const map: Record<string, number> = {};
  arr.forEach(v => { map[v] = (map[v] || 0) + 1; });
  const total = arr.length;
  return Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .map(([name, valor]) => ({ name, valor, pct: total ? Math.round((valor / total) * 100) : 0 }));
};

// Percentual formatado
const pct = (n: number, total: number): number =>
  total ? Math.round((n / total) * 100) : 0;

// ═══════════════════════════════════════════════════════════════════════════
// CORES
// ═══════════════════════════════════════════════════════════════════════════

const COR = {
  indigo: "#6366f1",
  verde:  "#10b981",
  amarelo:"#f59e0b",
  laranja:"#f97316",
  vermelho:"#ef4444",
  roxo:   "#8b5cf6",
  ciano:  "#06b6d4",
  lima:   "#84cc16",
};

const PALETA = [COR.indigo, COR.verde, COR.amarelo, COR.vermelho, COR.roxo, COR.ciano, COR.laranja, COR.lima];

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTAR EXCEL — planilha limpa, legível, em português
// ═══════════════════════════════════════════════════════════════════════════

const exportarExcel = async (respostas: any[]) => {

  // Aba 1: Respostas individuais
  const cabecalho = [
    "Nº","Data de Envio","Idade","Faixa Etária","Sexo","Peso (kg)","Altura (cm)","IMC","Classificação IMC",
    "Diagnóstico Existente","Usa Medicamento",
    "Ultraprocessados","Frutas e Verduras","Doces","Refrigerantes","Fast Food",
    "Café da Manhã","Come à Noite","Tipo de Dieta","Refeições por Dia","Água por Dia (litros)",
    "Atividade Física","Fuma","Consome Álcool",
    "Qualidade do Sono","Horas de Sono","Acorda Cansado","Tempo para Dormir",
    "Nível de Estresse","Frequência de Ansiedade","Diagnóstico de Saúde Mental",
    "Tempo de Tela","Tempo em Redes Sociais",
    "Sintoma: Cansaço","Sintoma: Mudança de Peso","Sintoma: Sede Excessiva",
    "Sintoma: Sensibilidade à Temperatura","Sintoma: Pele Seca","Sintoma: Mudanças de Humor",
    "Sintoma: Queda de Cabelo","Sintoma: Névoa Mental","Sintoma: Fome Constante",
    "Sintoma: Urinar com Frequência","Sintoma: Palpitações","Total de Sintomas",
    "Histórico: Glicemia Alta","Histórico Familiar: Diabetes",
    "Histórico Familiar: Tireoide","Histórico Familiar: Obesidade",
    "Ciclo Menstrual Irregular","Diagnóstico de SOP",
    "Pontuação FINDRISC","Risco de Diabetes (FINDRISC)"
  ];

  const linhas = respostas.map(r => {
    const imc = toNum(r.bmi);
    const sintomas = [
      r.symptomFatigue, r.symptomWeightChange, r.symptomExcessiveThirst,
      r.symptomTemperatureSensitivity, r.symptomDrySkin, r.symptomMoodChanges,
      r.symptomHairLoss, r.symptomBrainFog, r.symptomConstantHunger,
      r.symptomFrequentUrination, r.symptomPalpitations
    ].filter(Boolean).length;

    return [
      r.id,
      new Date(r.submittedAt).toLocaleString("pt-BR"),
      r.age,
      getFaixa(r.age) + " (" + FAIXAS.find(f => f.chave === getFaixa(r.age))?.label.match(/\(.*\)/)?.[0] + ")",
      traduz(SEXO, r.gender),
      r.weight,
      r.height,
      imc.toFixed(1),
      classificarIMC(imc),
      traduz(DIAGNOSTICO, r.existingDiagnosis),
      traduz(SIM_NAO, r.onMedication),
      traduz(FREQUENCIA, r.ultraProcessedFreq),
      traduz(FREQUENCIA, r.fruitsVegetablesFreq),
      traduz(FREQUENCIA, r.sweetsFreq),
      traduz(FREQUENCIA, r.sugaryDrinksFrequency),
      traduz(FREQUENCIA, r.fastFoodFrequency),
      traduz(FREQUENCIA, r.breakfastFrequency),
      r.lateNightEating === "yes" ? "Sim" : r.lateNightEating === "sometimes" ? "Às vezes" : "Não",
      traduz(DIETA, r.dietType),
      r.mealsPerDay ? `${r.mealsPerDay} refeições` : "Não informado",
      r.waterLitersPerDay ? `${r.waterLitersPerDay} litros` : "Não informado",
      traduz(ATIVIDADE, r.physicalActivityHours),
      traduz(TABAGISMO, r.smokingStatus),
      traduz(ALCOOL, r.alcoholFrequency),
      traduz(SONO_QUALIDADE, r.sleepQuality),
      traduz(SONO_HORAS, r.sleepHoursPerNight),
      r.wakeUpTired === "yes" ? "Sim" : r.wakeUpTired === "sometimes" ? "Às vezes" : r.wakeUpTired === "no" ? "Não" : "Não informado",
      traduz(LATENCIA, r.sleepLatency),
      traduz(ESTRESSE, r.stressLevel),
      traduz(ANSIEDADE, r.anxietyFrequency),
      r.mentalHealthDiagnosis === "yes" ? "Sim" : r.mentalHealthDiagnosis === "no" ? "Não" : r.mentalHealthDiagnosis === "unsure" ? "Não tem certeza" : "Não informado",
      traduz(TELA, r.screenTimeHours),
      traduz(TELA, r.socialMediaHours),
      r.symptomFatigue ? "Sim" : "Não",
      r.symptomWeightChange ? "Sim" : "Não",
      r.symptomExcessiveThirst ? "Sim" : "Não",
      r.symptomTemperatureSensitivity ? "Sim" : "Não",
      r.symptomDrySkin ? "Sim" : "Não",
      r.symptomMoodChanges ? "Sim" : "Não",
      r.symptomHairLoss ? "Sim" : "Não",
      r.symptomBrainFog ? "Sim" : "Não",
      r.symptomConstantHunger ? "Sim" : "Não",
      r.symptomFrequentUrination ? "Sim" : "Não",
      r.symptomPalpitations ? "Sim" : "Não",
      sintomas,
      r.highBloodGlucoseHistory === "yes" ? "Sim" : r.highBloodGlucoseHistory === "no" ? "Não" : "Não sabe",
      traduz(HISTORICO_FAMILIAR, r.familyDiabetes),
      traduz(HISTORICO_FAMILIAR, r.familyThyroidIssues),
      traduz(HISTORICO_FAMILIAR, r.familyObesity),
      r.irregularMenstrualCycle === "yes" ? "Sim" : r.irregularMenstrualCycle === "no" ? "Não" : "Não se aplica",
      r.pcosDiagnosis === "yes" ? "Sim" : r.pcosDiagnosis === "no" ? "Não" : "Não se aplica",
      r.findrisc_score ?? "—",
      traduz(RISCO_FINDRISC, r.findrisc_risk_category),
    ];
  });

  const ws1 = XLSX.utils.aoa_to_sheet([cabecalho, ...linhas]);
  ws1["!cols"] = cabecalho.map(() => ({ wch: 28 }));

  // Aba 2: Resumo estatístico
  const total = respostas.length;
  const resumoLinhas: any[][] = [
    ["RESUMO DA PESQUISA ENDOCRICHECK", "", ""],
    ["Data de geração:", new Date().toLocaleString("pt-BR"), ""],
    ["Total de participantes:", total, ""],
    ["", "", ""],
    ["=== PERFIL DOS PARTICIPANTES ===", "", ""],
    ["Indicador", "Quantidade", "Percentual"],
  ];

  // Sexo
  const porSexo = contarGrupos(respostas.map(r => traduz(SEXO, r.gender)));
  porSexo.forEach(g => resumoLinhas.push([`Sexo: ${g.name}`, g.valor, `${g.pct}%`]));

  // Faixa etária
  resumoLinhas.push(["", "", ""], ["=== FAIXA ETÁRIA ===", "", ""], ["Faixa", "Quantidade", "Percentual"]);
  const porFaixa = contarGrupos(respostas.map(r => getFaixa(r.age)));
  porFaixa.forEach(g => resumoLinhas.push([g.name, g.valor, `${g.pct}%`]));

  // IMC
  const imcs = respostas.map(r => toNum(r.bmi)).filter(v => v > 0);
  const imcMedio = imcs.length ? (imcs.reduce((a, b) => a + b, 0) / imcs.length) : 0;
  resumoLinhas.push(
    ["", "", ""],
    ["=== IMC ===", "", ""],
    ["IMC médio do grupo:", imcMedio.toFixed(2), classificarIMC(imcMedio)],
    ["IMC mínimo:", Math.min(...imcs).toFixed(1), ""],
    ["IMC máximo:", Math.max(...imcs).toFixed(1), ""],
  );
  const porIMC = contarGrupos(respostas.map(r => classificarIMC(toNum(r.bmi))));
  porIMC.forEach(g => resumoLinhas.push([`IMC: ${g.name}`, g.valor, `${g.pct}%`]));

  // Alimentação
  resumoLinhas.push(["", "", ""], ["=== HÁBITOS ALIMENTARES ===", "", ""], ["Indicador", "Quantidade", "Percentual"]);
  const ultraFreq = respostas.filter(r => ["always","frequently","often","3-5x_week","daily"].includes(r.ultraProcessedFreq)).length;
  const frutasRaro = respostas.filter(r => ["never","rarely"].includes(r.fruitsVegetablesFreq)).length;
  const semCafe = respostas.filter(r => ["never","rarely"].includes(r.breakfastFrequency)).length;
  const fastFoodFreq = respostas.filter(r => ["3-5x_week","daily","always","frequently"].includes(r.fastFoodFrequency)).length;
  const comNoite = respostas.filter(r => r.lateNightEating === "yes").length;
  resumoLinhas.push(
    ["Consomem ultraprocessados com frequência", ultraFreq, `${pct(ultraFreq, total)}%`],
    ["Raramente comem frutas e verduras", frutasRaro, `${pct(frutasRaro, total)}%`],
    ["Não tomam café da manhã regularmente", semCafe, `${pct(semCafe, total)}%`],
    ["Comem fast food 3+ vezes por semana", fastFoodFreq, `${pct(fastFoodFreq, total)}%`],
    ["Comem à noite com frequência", comNoite, `${pct(comNoite, total)}%`],
  );

  // Atividade física
  resumoLinhas.push(["", "", ""], ["=== ATIVIDADE FÍSICA ===", "", ""], ["Nível", "Quantidade", "Percentual"]);
  const porAtividade = contarGrupos(respostas.map(r => traduz(ATIVIDADE, r.physicalActivityHours)));
  porAtividade.forEach(g => resumoLinhas.push([g.name, g.valor, `${g.pct}%`]));

  // Sintomas
  resumoLinhas.push(["", "", ""], ["=== SINTOMAS ENDÓCRINOS ===", "", ""], ["Sintoma", "Quantidade", "Percentual"]);
  const sintomas = [
    ["Cansaço", "symptomFatigue"],
    ["Mudança de peso", "symptomWeightChange"],
    ["Sede excessiva", "symptomExcessiveThirst"],
    ["Sensibilidade à temperatura", "symptomTemperatureSensitivity"],
    ["Pele seca", "symptomDrySkin"],
    ["Mudanças de humor", "symptomMoodChanges"],
    ["Queda de cabelo", "symptomHairLoss"],
    ["Névoa mental (brain fog)", "symptomBrainFog"],
    ["Fome constante", "symptomConstantHunger"],
    ["Urinar com frequência", "symptomFrequentUrination"],
    ["Palpitações", "symptomPalpitations"],
  ];
  sintomas.forEach(([nome, campo]) => {
    const n = respostas.filter(r => r[campo]).length;
    resumoLinhas.push([nome, n, `${pct(n, total)}%`]);
  });

  const ws2 = XLSX.utils.aoa_to_sheet(resumoLinhas);
  ws2["!cols"] = [{ wch: 45 }, { wch: 15 }, { wch: 15 }];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws1, "Respostas Individuais");
  XLSX.utils.book_append_sheet(wb, ws2, "Resumo Estatístico");
  XLSX.writeFile(wb, `EndocriCheck_Pesquisa_${new Date().toISOString().slice(0, 10)}.xlsx`);
};

// ═══════════════════════════════════════════════════════════════════════════
// COMPONENTES DE UI
// ═══════════════════════════════════════════════════════════════════════════

const Cartao = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 ${className}`}>
    {children}
  </div>
);

const TituloSecao = ({ icone, titulo, subtitulo }: { icone: string; titulo: string; subtitulo?: string }) => (
  <div className="flex items-center gap-3 mb-5 mt-2">
    <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-xl">{icone}</div>
    <div>
      <h2 className="text-lg font-bold text-gray-800">{titulo}</h2>
      {subtitulo && <p className="text-sm text-gray-500">{subtitulo}</p>}
    </div>
  </div>
);

const KPI = ({ rotulo, valor, detalhe, cor = "indigo" }: {
  rotulo: string; valor: string | number; detalhe?: string; cor?: "indigo" | "verde" | "amarelo" | "vermelho";
}) => {
  const cores = {
    indigo:   "text-indigo-600 bg-indigo-50",
    verde:    "text-emerald-600 bg-emerald-50",
    amarelo:  "text-amber-600 bg-amber-50",
    vermelho: "text-red-600 bg-red-50",
  };
  return (
    <Cartao className={cores[cor]}>
      <p className="text-sm font-semibold text-gray-600 mb-1">{rotulo}</p>
      <p className={`text-3xl font-bold ${cores[cor].split(" ")[0]}`}>{valor}</p>
      {detalhe && <p className="text-xs text-gray-500 mt-1">{detalhe}</p>}
    </Cartao>
  );
};

const DicaTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-3 text-sm max-w-xs">
      {label && <p className="font-semibold text-gray-700 mb-2 border-b pb-1">{label}</p>}
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color ?? p.fill }} className="flex justify-between gap-4">
          <span>{p.name}:</span>
          <strong>{p.value}{String(p.name).includes("%") ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
};

const LabelPizza = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, name }: any) => {
  if (percent < 0.06) return null;
  const RAD = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  const x = cx + r * Math.cos(-midAngle * RAD);
  const y = cy + r * Math.sin(-midAngle * RAD);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight="bold">
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

// ═══════════════════════════════════════════════════════════════════════════
// DASHBOARD PRINCIPAL
// ═══════════════════════════════════════════════════════════════════════════

export default function Dashboard() {
  const [filtroFaixa, setFiltroFaixa] = useState("Todas");
  const [filtroSexo, setFiltroSexo] = useState("Todos");

  const { data: todasRespostas = [], isLoading, refetch } = useQuery(
    trpc.survey.getResponses.queryOptions()
  );

  // Aplicar filtros
  const respostas = useMemo(() => {
    let r = todasRespostas as any[];
    if (filtroFaixa !== "Todas") {
      r = r.filter(x => getFaixa(x.age) === filtroFaixa);
    }
    if (filtroSexo !== "Todos") {
      const mapa: Record<string, string> = { "Masculino": "male", "Feminino": "female", "Outro": "other" };
      r = r.filter(x => x.gender === mapa[filtroSexo]);
    }
    return r;
  }, [todasRespostas, filtroFaixa, filtroSexo]);

  const total = respostas.length;

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const imcMedio = useMemo(() => {
    const validos = respostas.map(r => toNum(r.bmi)).filter(v => v > 0);
    return validos.length ? validos.reduce((a, b) => a + b, 0) / validos.length : 0;
  }, [respostas]);

  const idadeMedia = useMemo(() => {
    if (!total) return 0;
    return respostas.reduce((s, r) => s + toNum(r.age), 0) / total;
  }, [respostas, total]);

  const sedentariosPct = useMemo(() => {
    if (!total) return 0;
    return pct(respostas.filter(r => r.physicalActivityHours === "none").length, total);
  }, [respostas, total]);

  const alertaUltra = useMemo(() => {
    if (!total) return false;
    const freq = respostas.filter(r => ["always","frequently","often","daily"].includes(r.ultraProcessedFreq)).length;
    return pct(freq, total) > 30;
  }, [respostas, total]);

  // ── Gráficos ──────────────────────────────────────────────────────────────

  // Faixa etária
  const dadosFaixa = useMemo(() => {
    const map: Record<string, number> = {};
    respostas.forEach(r => { const f = getFaixa(r.age); map[f] = (map[f] || 0) + 1; });
    return FAIXAS.map(f => ({ name: f.chave, Participantes: map[f.chave] || 0 })).filter(d => d.Participantes > 0);
  }, [respostas]);

  // Sexo
  const dadosSexo = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(SEXO, r.gender))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // IMC por faixa
  const imcPorFaixa = useMemo(() => {
    const grupos: Record<string, number[]> = {};
    respostas.forEach(r => {
      const f = getFaixa(r.age);
      if (!grupos[f]) grupos[f] = [];
      const v = toNum(r.bmi);
      if (v > 0) grupos[f].push(v);
    });
    return FAIXAS
      .filter(f => grupos[f.chave]?.length)
      .map(f => ({
        name: f.chave,
        "IMC Médio": parseFloat((grupos[f.chave].reduce((a, b) => a + b, 0) / grupos[f.chave].length).toFixed(1)),
      }));
  }, [respostas]);

  // Classificação IMC
  const dadosIMC = useMemo(() =>
    contarGrupos(respostas.map(r => classificarIMC(toNum(r.bmi)))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Ultraprocessados por faixa
  const ultraPorFaixa = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    respostas.forEach(r => { const f = getFaixa(r.age); (grupos[f] = grupos[f] || []).push(r); });
    return FAIXAS.filter(f => grupos[f.chave]?.length).map(f => {
      const arr = grupos[f.chave];
      return {
        name: f.chave,
        "Frequente (%)": pct(arr.filter(r => ["always","frequently","often","3-5x_week","daily"].includes(r.ultraProcessedFreq)).length, arr.length),
        "Às vezes (%)": pct(arr.filter(r => r.ultraProcessedFreq === "sometimes").length, arr.length),
        "Raramente (%)": pct(arr.filter(r => ["rarely","never"].includes(r.ultraProcessedFreq)).length, arr.length),
      };
    });
  }, [respostas]);

  // Hábitos ruins por faixa (comparativo)
  const habitosPorFaixa = useMemo(() => {
    const grupos: Record<string, any[]> = {};
    respostas.forEach(r => { const f = getFaixa(r.age); (grupos[f] = grupos[f] || []).push(r); });
    return FAIXAS.filter(f => grupos[f.chave]?.length).map(f => {
      const arr = grupos[f.chave];
      return {
        name: f.chave,
        "Ultraproc. Frequente": pct(arr.filter(r => ["always","frequently","often","3-5x_week","daily"].includes(r.ultraProcessedFreq)).length, arr.length),
        "Frutas Raramente": pct(arr.filter(r => ["rarely","never"].includes(r.fruitsVegetablesFreq)).length, arr.length),
        "Sem Café da Manhã": pct(arr.filter(r => ["rarely","never"].includes(r.breakfastFrequency)).length, arr.length),
        "Fast Food Frequente": pct(arr.filter(r => ["3-5x_week","daily","always","frequently"].includes(r.fastFoodFrequency)).length, arr.length),
      };
    });
  }, [respostas]);

  // Frutas
  const dadosFrutas = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(FREQUENCIA, r.fruitsVegetablesFreq))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Café da manhã
  const dadosCafe = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(FREQUENCIA, r.breakfastFrequency))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Fast food
  const dadosFastFood = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(FREQUENCIA, r.fastFoodFrequency))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Dieta
  const dadosDieta = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(DIETA, r.dietType))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Atividade física
  const dadosAtividade = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(ATIVIDADE, r.physicalActivityHours))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Sono qualidade
  const dadosSono = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(SONO_QUALIDADE, r.sleepQuality))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Estresse
  const dadosEstresse = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(ESTRESSE, r.stressLevel))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Tabagismo
  const dadosFumo = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(TABAGISMO, r.smokingStatus))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Álcool
  const dadosAlcool = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(ALCOOL, r.alcoholFrequency))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // Sintomas (ranking)
  const dadosSintomas = useMemo(() => {
    if (!total) return [];
    return [
      { name: "Cansaço",                    pct: pct(respostas.filter(r => r.symptomFatigue).length, total) },
      { name: "Mudança de peso",             pct: pct(respostas.filter(r => r.symptomWeightChange).length, total) },
      { name: "Sede excessiva",              pct: pct(respostas.filter(r => r.symptomExcessiveThirst).length, total) },
      { name: "Sensib. temperatura",         pct: pct(respostas.filter(r => r.symptomTemperatureSensitivity).length, total) },
      { name: "Pele seca",                   pct: pct(respostas.filter(r => r.symptomDrySkin).length, total) },
      { name: "Mudanças de humor",           pct: pct(respostas.filter(r => r.symptomMoodChanges).length, total) },
      { name: "Queda de cabelo",             pct: pct(respostas.filter(r => r.symptomHairLoss).length, total) },
      { name: "Névoa mental",                pct: pct(respostas.filter(r => r.symptomBrainFog).length, total) },
      { name: "Fome constante",              pct: pct(respostas.filter(r => r.symptomConstantHunger).length, total) },
      { name: "Urinar com frequência",       pct: pct(respostas.filter(r => r.symptomFrequentUrination).length, total) },
      { name: "Palpitações",                 pct: pct(respostas.filter(r => r.symptomPalpitations).length, total) },
    ].sort((a, b) => b.pct - a.pct);
  }, [respostas, total]);

  // Histórico familiar
  const dadosHistorico = useMemo(() => [
    {
      name: "Diabetes",
      "Tem histórico": pct(respostas.filter(r => r.familyDiabetes && !["no","None","null"].includes(r.familyDiabetes)).length, total),
      "Não tem": pct(respostas.filter(r => r.familyDiabetes === "no").length, total),
      "Não sabe": pct(respostas.filter(r => r.familyDiabetes === "unknown").length, total),
    },
    {
      name: "Tireoide",
      "Tem histórico": pct(respostas.filter(r => r.familyThyroidIssues && !["no","None","null"].includes(r.familyThyroidIssues)).length, total),
      "Não tem": pct(respostas.filter(r => r.familyThyroidIssues === "no").length, total),
      "Não sabe": pct(respostas.filter(r => r.familyThyroidIssues === "unknown").length, total),
    },
    {
      name: "Obesidade",
      "Tem histórico": pct(respostas.filter(r => r.familyObesity && !["no","None","null"].includes(r.familyObesity)).length, total),
      "Não tem": pct(respostas.filter(r => r.familyObesity === "no").length, total),
      "Não sabe": pct(respostas.filter(r => r.familyObesity === "unknown").length, total),
    },
  ], [respostas, total]);

  // FINDRISC
  const dadosFindrisc = useMemo(() =>
    contarGrupos(respostas.map(r => traduz(RISCO_FINDRISC, r.findrisc_risk_category))).map(d => ({ name: d.name, value: d.valor })),
    [respostas]);

  // ── Filtros de botão ──────────────────────────────────────────────────────
  const BOTOES_FAIXA = ["Todas", ...FAIXAS.map(f => f.chave)];
  const BOTOES_SEXO  = ["Todos", "Masculino", "Feminino", "Outro"];

  // ── Loading ───────────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Carregando dados da pesquisa...</p>
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">

      {/* Cabeçalho fixo */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-indigo-700">Dashboard EndocriCheck</h1>
            <p className="text-sm text-gray-500">Pesquisa de saúde endocrinológica e hábitos alimentares</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => refetch()}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium transition"
            >
              🔄 Atualizar dados
            </button>
            <button
              onClick={() => exportarExcel(respostas)}
              disabled={!total}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-40 transition shadow-sm"
            >
              📥 Exportar Planilha Excel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">

        {/* Filtros */}
        <Cartao>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-700">Faixa etária:</span>
              {BOTOES_FAIXA.map(f => (
                <button key={f} onClick={() => setFiltroFaixa(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filtroFaixa === f ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"
                  }`}>{f}</button>
              ))}
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-700">Sexo:</span>
              {BOTOES_SEXO.map(f => (
                <button key={f} onClick={() => setFiltroSexo(f)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                    filtroSexo === f ? "bg-indigo-600 text-white shadow-sm" : "bg-gray-100 text-gray-600 hover:bg-indigo-50"
                  }`}>{f}</button>
              ))}
            </div>
          </div>
        </Cartao>

        {/* Alerta */}
        {alertaUltra && (
          <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-4 flex items-start gap-3">
            <span className="text-2xl">⚠️</span>
            <div>
              <p className="font-bold text-red-700">Alerta: Consumo elevado de ultraprocessados</p>
              <p className="text-sm text-red-600 mt-1">
                Mais de 30% dos participantes selecionados consomem alimentos ultraprocessados com alta frequência.
                Isso está associado a maior risco de obesidade, diabetes tipo 2 e doenças cardiovasculares.
              </p>
            </div>
          </div>
        )}

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <KPI rotulo="Total de Participantes" valor={total} detalhe="respostas coletadas" cor="indigo" />
          <KPI
            rotulo="IMC Médio do Grupo"
            valor={total ? imcMedio.toFixed(1) : "—"}
            detalhe={total ? classificarIMC(imcMedio) : "sem dados"}
            cor={imcMedio >= 30 ? "vermelho" : imcMedio >= 25 ? "amarelo" : "verde"}
          />
          <KPI
            rotulo="Idade Média"
            valor={total ? `${idadeMedia.toFixed(0)} anos` : "—"}
            detalhe={total ? getFaixa(idadeMedia) : "sem dados"}
            cor="indigo"
          />
          <KPI
            rotulo="Sedentários"
            valor={total ? `${sedentariosPct}%` : "—"}
            detalhe="sem nenhuma atividade física"
            cor={sedentariosPct > 40 ? "vermelho" : sedentariosPct > 20 ? "amarelo" : "verde"}
          />
        </div>

        {total === 0 ? (
          <Cartao className="py-20 text-center">
            <p className="text-6xl mb-4">📊</p>
            <p className="text-xl font-bold text-gray-600">Nenhuma resposta encontrada</p>
            <p className="text-gray-400 mt-2">
              {filtroFaixa !== "Todas" || filtroSexo !== "Todos"
                ? "Tente remover os filtros para ver todas as respostas."
                : "Compartilhe o QR Code para começar a coletar dados."}
            </p>
          </Cartao>
        ) : (<>

          {/* ══ SEÇÃO 1: PERFIL ══════════════════════════════════════════════ */}
          <div>
            <TituloSecao icone="👥" titulo="Perfil dos Participantes" subtitulo="Quem respondeu a pesquisa" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-3">Participantes por Faixa Etária</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={dadosFaixa} margin={{ top: 5, right: 10, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip content={<DicaTooltip />} />
                    <Bar dataKey="Participantes" fill={COR.indigo} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-3">Distribuição por Sexo</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dadosSexo} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={LabelPizza}>
                      {dadosSexo.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                    </Pie>
                    <Tooltip content={<DicaTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-3">IMC Médio por Faixa Etária</p>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={imcPorFaixa} margin={{ top: 5, right: 10, left: -20, bottom: 45 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-35} textAnchor="end" />
                    <YAxis tick={{ fontSize: 10 }} domain={[0, 45]} />
                    <Tooltip content={<DicaTooltip />} />
                    <Bar dataKey="IMC Médio" fill={COR.amarelo} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
                <p className="text-xs text-gray-400 mt-2 text-center">Referência: Normal = 18,5 a 24,9 | Sobrepeso = 25 a 29,9</p>
              </Cartao>

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-3">Classificação de IMC (OMS)</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dadosIMC} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={LabelPizza}>
                      {dadosIMC.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                    </Pie>
                    <Tooltip content={<DicaTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Cartao>
            </div>
          </div>

          {/* ══ SEÇÃO 2: ALIMENTAÇÃO ═════════════════════════════════════════ */}
          <div>
            <TituloSecao icone="🥗" titulo="Hábitos Alimentares" subtitulo="Como os participantes se alimentam no dia a dia" />

            <Cartao className="mb-4">
              <p className="text-sm font-bold text-gray-600 mb-1">Comportamento Alimentar por Faixa Etária (%)</p>
              <p className="text-xs text-gray-400 mb-3">Percentual de participantes em cada faixa com hábito alimentar inadequado</p>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={habitosPorFaixa} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip content={<DicaTooltip />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Ultraproc. Frequente" fill={COR.vermelho} radius={[3,3,0,0]} />
                  <Bar dataKey="Frutas Raramente" fill={COR.amarelo} radius={[3,3,0,0]} />
                  <Bar dataKey="Sem Café da Manhã" fill={COR.roxo} radius={[3,3,0,0]} />
                  <Bar dataKey="Fast Food Frequente" fill={COR.laranja} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Cartao>

            <Cartao className="mb-4">
              <p className="text-sm font-bold text-gray-600 mb-1">Consumo de Ultraprocessados por Faixa Etária (%)</p>
              <p className="text-xs text-gray-400 mb-3">Alimentos como salgadinhos, refrigerantes, biscoitos recheados, embutidos</p>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={ultraPorFaixa} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <Tooltip content={<DicaTooltip />} />
                  <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                  <Bar dataKey="Frequente (%)" fill={COR.vermelho} radius={[3,3,0,0]} />
                  <Bar dataKey="Às vezes (%)" fill={COR.amarelo} radius={[3,3,0,0]} />
                  <Bar dataKey="Raramente (%)" fill={COR.verde} radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Cartao>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { titulo: "Frutas e Verduras", dados: dadosFrutas, nota: "Com que frequência come frutas e verduras" },
                { titulo: "Café da Manhã", dados: dadosCafe, nota: "Frequência com que toma café da manhã" },
                { titulo: "Fast Food", dados: dadosFastFood, nota: "Frequência de consumo de fast food" },
                { titulo: "Tipo de Dieta", dados: dadosDieta, nota: "Padrão alimentar predominante" },
              ].map(({ titulo, dados, nota }) => (
                <Cartao key={titulo}>
                  <p className="text-sm font-bold text-gray-600 mb-1">{titulo}</p>
                  <p className="text-xs text-gray-400 mb-2">{nota}</p>
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie data={dados} cx="50%" cy="50%" outerRadius={65} dataKey="value" labelLine={false} label={LabelPizza}>
                        {dados.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                      </Pie>
                      <Tooltip content={<DicaTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 10 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Cartao>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-1">Nível de Atividade Física</p>
                <p className="text-xs text-gray-400 mb-2">Frequência e intensidade dos exercícios praticados</p>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={dadosAtividade} cx="50%" cy="50%" outerRadius={75} dataKey="value" labelLine={false} label={LabelPizza}>
                      {dadosAtividade.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                    </Pie>
                    <Tooltip content={<DicaTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-1">Resumo Alimentar do Grupo</p>
                <p className="text-xs text-gray-400 mb-3">Percentual com hábitos inadequados</p>
                <div className="space-y-3">
                  {[
                    { label: "Consomem ultraprocessados com frequência", val: pct(respostas.filter(r => ["always","frequently","often","3-5x_week","daily"].includes(r.ultraProcessedFreq)).length, total), cor: COR.vermelho },
                    { label: "Raramente comem frutas e verduras", val: pct(respostas.filter(r => ["rarely","never"].includes(r.fruitsVegetablesFreq)).length, total), cor: COR.amarelo },
                    { label: "Não tomam café da manhã regularmente", val: pct(respostas.filter(r => ["rarely","never"].includes(r.breakfastFrequency)).length, total), cor: COR.roxo },
                    { label: "Comem fast food 3+ vezes por semana", val: pct(respostas.filter(r => ["3-5x_week","daily","always","frequently"].includes(r.fastFoodFrequency)).length, total), cor: COR.laranja },
                    { label: "Comem à noite com frequência", val: pct(respostas.filter(r => r.lateNightEating === "yes").length, total), cor: COR.ciano },
                  ].map(({ label, val, cor }) => (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-600">{label}</span>
                        <span className="font-bold" style={{ color: cor }}>{val}%</span>
                      </div>
                      <div className="w-full bg-gray-100 rounded-full h-2">
                        <div className="h-2 rounded-full transition-all" style={{ width: `${val}%`, backgroundColor: cor }} />
                      </div>
                    </div>
                  ))}
                </div>
              </Cartao>
            </div>
          </div>

          {/* ══ SEÇÃO 3: SONO, ESTRESSE E BEM-ESTAR ═════════════════════════ */}
          <div>
            <TituloSecao icone="😴" titulo="Sono, Estresse e Bem-estar" subtitulo="Qualidade de vida e saúde mental dos participantes" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { titulo: "Qualidade do Sono", dados: dadosSono, nota: "Como os participantes avaliam o próprio sono" },
                { titulo: "Nível de Estresse", dados: dadosEstresse, nota: "Nível de estresse percebido no dia a dia" },
                { titulo: "Tabagismo", dados: dadosFumo, nota: "Hábito de fumar cigarro" },
                { titulo: "Consumo de Álcool", dados: dadosAlcool, nota: "Frequência de consumo de bebidas alcoólicas" },
              ].map(({ titulo, dados, nota }) => (
                <Cartao key={titulo}>
                  <p className="text-sm font-bold text-gray-600 mb-1">{titulo}</p>
                  <p className="text-xs text-gray-400 mb-2">{nota}</p>
                  <ResponsiveContainer width="100%" height={190}>
                    <PieChart>
                      <Pie data={dados} cx="50%" cy="50%" outerRadius={68} dataKey="value" labelLine={false} label={LabelPizza}>
                        {dados.map((_, i) => <Cell key={i} fill={PALETA[i % PALETA.length]} />)}
                      </Pie>
                      <Tooltip content={<DicaTooltip />} />
                      <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                </Cartao>
              ))}
            </div>
          </div>

          {/* ══ SEÇÃO 4: SINTOMAS ════════════════════════════════════════════ */}
          <div>
            <TituloSecao icone="🩺" titulo="Sintomas Endócrinos Relatados" subtitulo="Percentual de participantes que marcaram cada sintoma" />
            <Cartao>
              <p className="text-xs text-gray-400 mb-3">
                Vermelho = mais de 50% dos participantes | Amarelo = 30 a 50% | Azul = menos de 30%
              </p>
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={dadosSintomas} layout="vertical" margin={{ top: 5, right: 60, left: 150, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" horizontal={false} />
                  <XAxis type="number" tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={145} />
                  <Tooltip content={<DicaTooltip />} formatter={(v: any) => [`${v}%`, "Participantes com sintoma"]} />
                  <Bar dataKey="pct" name="% com sintoma" radius={[0,4,4,0]}>
                    {dadosSintomas.map((entry, i) => (
                      <Cell key={i} fill={entry.pct > 50 ? COR.vermelho : entry.pct > 30 ? COR.amarelo : COR.indigo} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </Cartao>
          </div>

          {/* ══ SEÇÃO 5: HISTÓRICO FAMILIAR E FINDRISC ══════════════════════ */}
          <div>
            <TituloSecao icone="🧬" titulo="Histórico Familiar e Risco Metabólico" subtitulo="Predisposição genética e risco de desenvolver diabetes (FINDRISC)" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-1">Histórico Familiar de Doenças (%)</p>
                <p className="text-xs text-gray-400 mb-3">Percentual com parentes que têm ou tiveram cada doença</p>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={dadosHistorico} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                    <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
                    <Tooltip content={<DicaTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 12 }} />
                    <Bar dataKey="Tem histórico" fill={COR.vermelho} radius={[4,4,0,0]} />
                    <Bar dataKey="Não tem" fill={COR.verde} radius={[4,4,0,0]} />
                    <Bar dataKey="Não sabe" fill={COR.amarelo} radius={[4,4,0,0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Cartao>

              <Cartao>
                <p className="text-sm font-bold text-gray-600 mb-1">Risco de Desenvolver Diabetes (FINDRISC)</p>
                <p className="text-xs text-gray-400 mb-3">Escala validada internacionalmente para rastreamento de diabetes tipo 2</p>
                <ResponsiveContainer width="100%" height={230}>
                  <PieChart>
                    <Pie data={dadosFindrisc} cx="50%" cy="50%" outerRadius={85} dataKey="value" labelLine={false} label={LabelPizza}>
                      {dadosFindrisc.map((_, i) => <Cell key={i} fill={[COR.verde, "#84cc16", COR.amarelo, COR.laranja, COR.vermelho][i % 5]} />)}
                    </Pie>
                    <Tooltip content={<DicaTooltip />} />
                    <Legend iconType="circle" iconSize={10} wrapperStyle={{ fontSize: 11 }} />
                  </PieChart>
                </ResponsiveContainer>
              </Cartao>
            </div>
          </div>

          {/* ══ TABELA DE RESPOSTAS ══════════════════════════════════════════ */}
          <div>
            <TituloSecao
              icone="📋"
              titulo="Respostas Individuais"
              subtitulo={`Exibindo as últimas ${Math.min(total, 50)} de ${total} respostas coletadas`}
            />
            <Cartao className="overflow-x-auto p-0">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-100">
                  <tr>
                    {["Nº","Data","Idade","Faixa Etária","Sexo","IMC","Classificação IMC","Ultraprocessados","Frutas/Verduras","Atividade Física","Estresse","Sintomas","Risco FINDRISC"].map(h => (
                      <th key={h} className="text-left py-3 px-3 text-xs font-bold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...respostas].reverse().slice(0, 50).map((r: any) => {
                    const imc = toNum(r.bmi);
                    const classIMC = classificarIMC(imc);
                    const corIMC = imc < 18.5 ? "text-blue-600" : imc < 25 ? "text-emerald-600" : imc < 30 ? "text-amber-600" : "text-red-600";
                    const totalSintomas = [r.symptomFatigue,r.symptomWeightChange,r.symptomExcessiveThirst,r.symptomTemperatureSensitivity,r.symptomDrySkin,r.symptomMoodChanges,r.symptomHairLoss,r.symptomBrainFog,r.symptomConstantHunger,r.symptomFrequentUrination,r.symptomPalpitations].filter(Boolean).length;
                    const corSintoma = totalSintomas > 5 ? "bg-red-100 text-red-700" : totalSintomas > 2 ? "bg-amber-100 text-amber-700" : "bg-green-100 text-green-700";
                    return (
                      <tr key={r.id} className="border-b border-gray-50 hover:bg-indigo-50/30 transition">
                        <td className="py-2.5 px-3 text-gray-400 font-mono">{r.id}</td>
                        <td className="py-2.5 px-3 text-gray-500 whitespace-nowrap">{new Date(r.submittedAt).toLocaleDateString("pt-BR")}</td>
                        <td className="py-2.5 px-3 font-semibold text-gray-800">{r.age} anos</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{getFaixa(r.age)}</td>
                        <td className="py-2.5 px-3">{traduz(SEXO, r.gender)}</td>
                        <td className={`py-2.5 px-3 font-bold ${corIMC}`}>{imc.toFixed(1)}</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{classIMC}</td>
                        <td className="py-2.5 px-3 text-gray-600">{traduz(FREQUENCIA, r.ultraProcessedFreq)}</td>
                        <td className="py-2.5 px-3 text-gray-600">{traduz(FREQUENCIA, r.fruitsVegetablesFreq)}</td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{traduz(ATIVIDADE, r.physicalActivityHours)}</td>
                        <td className="py-2.5 px-3 text-gray-600">{traduz(ESTRESSE, r.stressLevel)}</td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${corSintoma}`}>
                            {totalSintomas} de 11
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-gray-600 whitespace-nowrap">{traduz(RISCO_FINDRISC, r.findrisc_risk_category)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </Cartao>
          </div>

        </>)}
      </div>
    </div>
  );
}
