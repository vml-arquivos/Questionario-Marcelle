# EndocriCheck - Sistema de Pesquisa sobre Saúde Endócrina

Um sistema completo e elegante para coleta e análise de dados sobre saúde endócrina, desenvolvido com React, Node.js, tRPC e MySQL. Inclui formulário público com QR Code, cálculo automático de IMC, análise FINDRISC e dashboard administrativo com gráficos comparativos.

## 🎯 Funcionalidades

### Formulário Público
- ✅ Formulário com 5 seções (Perfil, Hábitos, Estilo de Vida, Sintomas, Histórico)
- ✅ Perguntas objetivas sobre endocrinologia
- ✅ Cálculo automático de IMC em tempo real
- ✅ Geração de QR Code para compartilhamento
- ✅ Design elegante e responsivo
- ✅ Validação de campos obrigatórios

### Backend e API
- ✅ API tRPC com procedures tipadas
- ✅ Cálculo automático de FINDRISC (risco de diabetes tipo 2)
- ✅ Armazenamento seguro de respostas em MySQL
- ✅ Endpoints protegidos com autenticação

### Dashboard Administrativo
- ✅ Autenticação e controle de acesso por role (admin/user)
- ✅ Total de participantes e estatísticas agregadas
- ✅ Gráficos de distribuição demográfica (tipo, gênero, idade)
- ✅ Gráficos de distribuição de IMC
- ✅ Gráficos de risco FINDRISC
- ✅ Tabela com últimas respostas
- ✅ Exportação de dados em CSV

### Deploy
- ✅ Docker e docker-compose configurados
- ✅ Pronto para deploy em VPS via Coolify
- ✅ Variáveis de ambiente documentadas
- ✅ Health checks configurados

## 🚀 Início Rápido

### Pré-requisitos
- Node.js 22+
- pnpm 10+
- MySQL 8.0+
- Docker e Docker Compose (para deploy)

### Desenvolvimento Local

1. **Clone o repositório**
```bash
git clone <seu-repositorio>
cd endocrine-survey-system
```

2. **Instale as dependências**
```bash
pnpm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
# Edite .env.local com suas configurações
```

4. **Configure o banco de dados**
```bash
# Crie o banco de dados MySQL
mysql -u root -p -e "CREATE DATABASE endocrine_survey;"

# Execute as migrações
pnpm drizzle-kit generate
pnpm drizzle-kit migrate
```

5. **Inicie o servidor de desenvolvimento**
```bash
pnpm dev
```

A aplicação estará disponível em `http://localhost:3000`

### Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes específicos
pnpm test server/findrisc.test.ts
```

## 🐳 Deploy com Docker

### Usando docker-compose

1. **Configure as variáveis de ambiente**
```bash
cp .env.example .env
# Edite .env com suas configurações
```

2. **Inicie os containers**
```bash
docker-compose up -d
```

3. **Execute as migrações do banco de dados**
```bash
docker-compose exec app pnpm drizzle-kit migrate
```

4. **Acesse a aplicação**
- URL: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard` (requer autenticação)

### Usando Coolify

1. **Prepare o repositório Git**
```bash
git init
git add .
git commit -m "Initial commit: EndocriCheck system"
git remote add origin <seu-repositorio>
git push -u origin main
```

2. **No Coolify**
   - Crie um novo projeto
   - Conecte seu repositório Git
   - Configure as variáveis de ambiente
   - Configure o banco de dados MySQL
   - Deploy automático

## 📋 Variáveis de Ambiente

### Banco de Dados
- `DATABASE_URL`: String de conexão MySQL
- `DB_NAME`: Nome do banco de dados
- `DB_USER`: Usuário do banco
- `DB_PASSWORD`: Senha do banco
- `DB_PORT`: Porta do MySQL (padrão: 3306)

### Aplicação
- `NODE_ENV`: Ambiente (development/production)
- `APP_PORT`: Porta da aplicação (padrão: 3000)

### Autenticação
- `JWT_SECRET`: Chave secreta para JWT
- `VITE_APP_ID`: ID da aplicação OAuth
- `OAUTH_SERVER_URL`: URL do servidor OAuth
- `VITE_OAUTH_PORTAL_URL`: URL do portal OAuth
- `OWNER_OPEN_ID`: OpenID do proprietário
- `OWNER_NAME`: Nome do proprietário

### APIs Externas
- `BUILT_IN_FORGE_API_URL`: URL da API Forge
- `BUILT_IN_FORGE_API_KEY`: Chave da API Forge
- `VITE_FRONTEND_FORGE_API_URL`: URL da API Forge (frontend)
- `VITE_FRONTEND_FORGE_API_KEY`: Chave da API Forge (frontend)

### Analytics
- `VITE_ANALYTICS_ENDPOINT`: Endpoint de analytics
- `VITE_ANALYTICS_WEBSITE_ID`: ID do website para analytics

## 📊 Estrutura do Projeto

```
endocrine-survey-system/
├── client/                 # Frontend React
│   ├── src/
│   │   ├── pages/         # Páginas (Home, SurveyForm, Dashboard)
│   │   ├── components/    # Componentes reutilizáveis
│   │   └── lib/           # Utilitários e configurações
│   └── index.html
├── server/                # Backend Node.js
│   ├── routers.ts         # Procedures tRPC
│   ├── db.ts              # Helpers de banco de dados
│   └── findrisc.test.ts   # Testes FINDRISC
├── drizzle/               # Migrações e schema
│   └── schema.ts          # Definição das tabelas
├── Dockerfile             # Configuração Docker
├── docker-compose.yml     # Orquestração de containers
└── README.md              # Este arquivo
```

## 🔐 Segurança

- Autenticação via OAuth Manus
- Controle de acesso baseado em role (admin/user)
- Endpoints protegidos com `protectedProcedure`
- Validação de entrada com Zod
- HTTPS em produção (recomendado)
- Variáveis sensíveis em `.env` (não commitadas)

## 📈 Análise FINDRISC

O sistema implementa o questionário FINDRISC (Finnish Diabetes Risk Score) com 8 perguntas:

1. **Idade**: Pontuação progressiva (0-4 pontos)
2. **IMC**: Categorias de peso (0-3 pontos)
3. **Medicação para pressão**: Sim/Não (0-2 pontos)
4. **Histórico de glicemia elevada**: Sim/Não (0-5 pontos)
5. **Atividade física**: >=4h ou <4h por semana (0-2 pontos)
6. **Consumo de frutas/verduras**: Frequência (0-1 ponto)
7. **Histórico familiar de diabetes**: Grau de parentesco (0-5 pontos)

**Categorias de Risco:**
- Baixo: < 7 pontos
- Levemente Moderado: 7-11 pontos
- Moderado: 12-14 pontos
- Alto: 15-20 pontos
- Muito Alto: 21+ pontos

## 🧪 Testes

O projeto inclui testes unitários para a função `calculateFINDRISC`:

```bash
pnpm test server/findrisc.test.ts
```

Testes cobrem:
- Cálculo correto de pontuação por categoria
- Classificação de risco apropriada
- Casos extremos e máximas pontuações

## 📱 Responsividade

- Design mobile-first
- Suporte para tablets e desktops
- QR Code adaptável
- Gráficos responsivos com Recharts

## 🎨 Design

- Paleta de cores profissional (azul, verde, laranja)
- Gradientes elegantes
- Componentes shadcn/ui
- Tailwind CSS 4
- Ícones Lucide React

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT.

## 📞 Suporte

Para questões e suporte, abra uma issue no repositório.

## 🙏 Agradecimentos

- Metodologia FINDRISC (Finnish Diabetes Association)
- React, Node.js, MySQL comunidades
- Manus platform para OAuth e APIs

---

**Desenvolvido com ❤️ para pesquisa acadêmica em saúde endócrina**
