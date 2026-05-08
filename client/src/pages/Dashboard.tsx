import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Download, Users, TrendingUp, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6"];

export default function Dashboard() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  const statsQuery = trpc.survey.getStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const responsesQuery = trpc.survey.getResponses.useQuery(undefined, {
    enabled: isAuthenticated && user?.role === "admin",
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) {
    return null;
  }

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md border-red-200 bg-white shadow-lg">
          <CardContent className="pt-12 pb-12 text-center">
            <AlertCircle className="w-16 h-16 text-red-600 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Acesso Negado</h2>
            <p className="text-gray-600 mb-6">Você não tem permissão para acessar o dashboard administrativo.</p>
            <Button onClick={() => navigate("/")} className="w-full">
              Voltar para Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = statsQuery.data;
  const responses = responsesQuery.data || [];

  const handleExportCSV = () => {
    if (!responses || responses.length === 0) {
      toast.error("Nenhum dado para exportar");
      return;
    }

    const headers = [
      "ID",
      "Tipo de Usuário",
      "Idade",
      "Gênero",
      "Peso (kg)",
      "Altura (cm)",
      "IMC",
      "Alimentos Ultraprocessados",
      "Frutas e Verduras",
      "Doces e Açúcares",
      "Refeições/Dia",
      "Água (L/dia)",
      "Atividade Física",
      "Fumo",
      "Álcool",
      "Qualidade do Sono",
      "Medicação Pressão",
      "Fadiga",
      "Alteração de Peso",
      "Sede Excessiva",
      "Sensibilidade Temperatura",
      "Pele Seca",
      "Alterações de Humor",
      "Histórico Glicemia",
      "Diabetes Familiar",
      "Tireoide Familiar",
      "Obesidade Familiar",
      "Pontuação FINDRISC",
      "Categoria de Risco",
      "Data de Submissão",
    ];

    const rows = responses.map((r) => [
      r.id,
      r.userType,
      r.age,
      r.gender,
      r.weight,
      r.height,
      r.bmi,
      r.ultraProcessedFreq || "",
      r.fruitsVegetablesFreq || "",
      r.sweetsFreq || "",
      r.mealsPerDay || "",
      r.waterLitersPerDay || "",
      r.physicalActivityHours || "",
      r.smokingStatus || "",
      r.alcoholFrequency || "",
      r.sleepQuality || "",
      r.bloodPressureMedication || "",
      r.symptomFatigue,
      r.symptomWeightChange,
      r.symptomExcessiveThirst,
      r.symptomTemperatureSensitivity,
      r.symptomDrySkin,
      r.symptomMoodChanges,
      r.highBloodGlucoseHistory || "",
      r.familyDiabetes || "",
      r.familyThyroidIssues || "",
      r.familyObesity || "",
      r.findrisc_score,
      r.findrisc_risk_category,
      r.submittedAt,
    ]);

    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${cell}"`).join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `pesquisa-endocrina-${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast.success("Dados exportados com sucesso!");
  };

  const userTypeData = stats
    ? [
        { name: "Alunos", value: stats.byUserType.student },
        { name: "Funcionários", value: stats.byUserType.employee },
        { name: "Adultos", value: stats.byUserType.adult },
      ]
    : [];

  const genderData = stats
    ? [
        { name: "Masculino", value: stats.byGender.male },
        { name: "Feminino", value: stats.byGender.female },
        { name: "Outro", value: stats.byGender.other },
        { name: "Prefiro não dizer", value: stats.byGender.prefer_not_to_say },
      ]
    : [];

  const ageGroupData = stats
    ? [
        { name: "18-25", value: stats.byAgeGroup["18-25"] },
        { name: "26-35", value: stats.byAgeGroup["26-35"] },
        { name: "36-45", value: stats.byAgeGroup["36-45"] },
        { name: "46-55", value: stats.byAgeGroup["46-55"] },
        { name: "56+", value: stats.byAgeGroup["56+"] },
      ]
    : [];

  const bmiData = stats
    ? [
        { name: "Baixo Peso", value: stats.byBMICategory.underweight },
        { name: "Normal", value: stats.byBMICategory.normal },
        { name: "Sobrepeso", value: stats.byBMICategory.overweight },
        { name: "Obeso", value: stats.byBMICategory.obese },
      ]
    : [];

  const findriScRiskData = stats
    ? [
        { name: "Baixo", value: stats.byFINDRISCRisk.low },
        { name: "Lev. Moderado", value: stats.byFINDRISCRisk.slightly_moderate },
        { name: "Moderado", value: stats.byFINDRISCRisk.moderate },
        { name: "Alto", value: stats.byFINDRISCRisk.high },
        { name: "Muito Alto", value: stats.byFINDRISCRisk.very_high },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Dashboard de Análise</h1>
          <p className="text-gray-600">Pesquisa sobre Saúde Endócrina - EndocriCheck</p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Total de Participantes</p>
                  <p className="text-3xl font-bold text-blue-600">{stats?.total || 0}</p>
                </div>
                <Users className="w-10 h-10 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">IMC Médio</p>
                  <p className="text-3xl font-bold text-green-600">{stats?.averageBMI || "0"}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">FINDRISC Médio</p>
                  <p className="text-3xl font-bold text-orange-600">{stats?.averageFINDRISC || "0"}</p>
                </div>
                <AlertCircle className="w-10 h-10 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardContent className="pt-6">
              <Button onClick={handleExportCSV} className="w-full bg-green-600 hover:bg-green-700">
                <Download className="w-4 h-4 mr-2" />
                Exportar CSV
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* User Type Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Distribuição por Tipo de Usuário</CardTitle>
              <CardDescription>Alunos, Funcionários e Adultos</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={userTypeData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {userTypeData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Gender Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Distribuição por Gênero</CardTitle>
              <CardDescription>Participantes por gênero</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={genderData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Age Group Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Distribuição por Faixa Etária</CardTitle>
              <CardDescription>Participantes por idade</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={ageGroupData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* BMI Distribution */}
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <CardTitle>Distribuição de IMC</CardTitle>
              <CardDescription>Categorias de Índice de Massa Corporal</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={bmiData} cx="50%" cy="50%" labelLine={false} label={({ name, value }) => `${name}: ${value}`} outerRadius={100} fill="#8884d8" dataKey="value">
                    {bmiData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* FINDRISC Risk Distribution */}
          <Card className="bg-white shadow-lg border-0 lg:col-span-2">
            <CardHeader>
              <CardTitle>Distribuição de Risco FINDRISC</CardTitle>
              <CardDescription>Classificação de risco de diabetes tipo 2</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={findriScRiskData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" fill="#f59e0b" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Data Table */}
        <Card className="bg-white shadow-lg border-0">
          <CardHeader>
            <CardTitle>Últimas Respostas</CardTitle>
            <CardDescription>Últimas 10 pesquisas submetidas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold">ID</th>
                    <th className="text-left py-3 px-4 font-semibold">Tipo</th>
                    <th className="text-left py-3 px-4 font-semibold">Idade</th>
                    <th className="text-left py-3 px-4 font-semibold">IMC</th>
                    <th className="text-left py-3 px-4 font-semibold">FINDRISC</th>
                    <th className="text-left py-3 px-4 font-semibold">Risco</th>
                    <th className="text-left py-3 px-4 font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody>
                  {responses
                    .slice(-10)
                    .reverse()
                    .map((response) => (
                      <tr key={response.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">{response.id}</td>
                        <td className="py-3 px-4 capitalize">{response.userType}</td>
                        <td className="py-3 px-4">{response.age}</td>
                        <td className="py-3 px-4">{response.bmi}</td>
                        <td className="py-3 px-4 font-semibold">{response.findrisc_score}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              response.findrisc_risk_category === "low"
                                ? "bg-green-100 text-green-800"
                                : response.findrisc_risk_category === "slightly_moderate"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : response.findrisc_risk_category === "moderate"
                                    ? "bg-orange-100 text-orange-800"
                                    : response.findrisc_risk_category === "high"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-red-200 text-red-900"
                            }`}
                          >
                            {response.findrisc_risk_category === "low"
                              ? "Baixo"
                              : response.findrisc_risk_category === "slightly_moderate"
                                ? "Lev. Mod."
                                : response.findrisc_risk_category === "moderate"
                                  ? "Moderado"
                                  : response.findrisc_risk_category === "high"
                                    ? "Alto"
                                    : "Muito Alto"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500">{new Date(response.submittedAt).toLocaleDateString("pt-BR")}</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
