import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { FileText, BarChart3, QrCode, Users } from "lucide-react";
import { getLoginUrl } from "@/const";

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">EndocriCheck</h1>
            <p className="text-gray-600">Pesquisa sobre Saúde Endócrina</p>
          </div>
          <div>
            {isAuthenticated ? (
              <div className="flex items-center gap-4">
                <span className="text-gray-700">Bem-vindo, {user?.name}</span>
                <Button onClick={() => navigate("/dashboard")} className="bg-blue-600 hover:bg-blue-700">
                  Dashboard
                </Button>
              </div>
            ) : (
              <Button onClick={() => (window.location.href = getLoginUrl())} className="bg-blue-600 hover:bg-blue-700">
                Entrar
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold text-gray-900 mb-4">Pesquisa de Saúde Endócrina</h2>
          <p className="text-xl text-gray-600 mb-8">Contribua para a pesquisa acadêmica sobre hábitos e saúde endócrina em escolas e comunidades</p>
          <Button onClick={() => navigate("/survey")} size="lg" className="bg-green-600 hover:bg-green-700">
            <FileText className="w-5 h-5 mr-2" />
            Responder Pesquisa
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <FileText className="w-8 h-8 text-blue-600 mb-2" />
              <CardTitle>Formulário Simples</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Perguntas objetivas sobre hábitos alimentares, estilo de vida e sintomas endócrinos</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <QrCode className="w-8 h-8 text-green-600 mb-2" />
              <CardTitle>QR Code</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Acesse o formulário facilmente através de QR Code em ambientes presenciais</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <Users className="w-8 h-8 text-orange-600 mb-2" />
              <CardTitle>Análise FINDRISC</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Cálculo automático de risco de diabetes tipo 2 baseado em metodologia validada</CardDescription>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-lg border-0">
            <CardHeader>
              <BarChart3 className="w-8 h-8 text-purple-600 mb-2" />
              <CardTitle>Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>Visualize gráficos e análises comparativas de todas as respostas coletadas</CardDescription>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-16 mt-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-3xl font-bold mb-4">Pronto para participar?</h3>
          <p className="text-lg mb-8">Sua participação é importante para entender melhor os hábitos de saúde endócrina em nossa comunidade</p>
          <Button onClick={() => navigate("/survey")} size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
            Começar Pesquisa
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-8 mt-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>EndocriCheck © 2026 - Sistema de Pesquisa sobre Saúde Endócrina</p>
          <p className="text-sm mt-2">Desenvolvido para pesquisa acadêmica</p>
        </div>
      </footer>
    </div>
  );
}
