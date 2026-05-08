# Guia Completo de Deploy no Google Cloud Platform (GCP)

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)  
**Projeto**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Banco de Dados**: PostgreSQL 17 (Cloud SQL)  
**Plataforma de Deploy**: Google Cloud Run  

---

## 📋 Variáveis de Ambiente Necessárias

### 1. Banco de Dados PostgreSQL 17 (Cloud SQL)

```bash
# Conexão ao Cloud SQL
DATABASE_URL=postgresql://endocrine_user:SENHA_SEGURA@/endocrine_survey?host=/cloudsql/PROJETO_GCP:us-central1:endocrine-survey-db

# Credenciais do Cloud SQL
CLOUD_SQL_USER=endocrine_user
CLOUD_SQL_PASSWORD=SENHA_SEGURA_CLOUD_SQL
GCP_PROJECT_ID=seu-projeto-gcp
GCP_REGION=us-central1
GCP_CLOUD_SQL_INSTANCE=endocrine-survey-db
```

### 2. Autenticação OAuth (Manus)

```bash
# OAuth Manus
VITE_APP_ID=seu_app_id_manus
JWT_SECRET=sua_chave_jwt_secreta_minimo_32_caracteres
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Seu Nome Completo
```

### 3. APIs Internas (Manus)

```bash
# Forge API (Manus Built-in)
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=sua_chave_api_forge_secreta
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_forge_secreta
```

### 4. Aplicação

```bash
# Ambiente
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica

# Servidor
PORT=3000
HOST=0.0.0.0

# Analytics
VITE_ANALYTICS_ENDPOINT=https://seu-analytics-endpoint.com
VITE_ANALYTICS_WEBSITE_ID=seu_website_id
```

### 5. Segurança

```bash
# Sessão
SESSION_SECRET=sua_chave_sessao_secreta_minimo_32_caracteres
SESSION_TIMEOUT_MS=86400000

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

---

## 🚀 Passo a Passo: Deploy no GCP

### Pré-requisitos

- Conta Google Cloud Platform ativa
- Projeto GCP criado
- `gcloud` CLI instalado e configurado
- Docker instalado localmente
- Git configurado

### Etapa 1: Preparar o Projeto Localmente

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/endocrine-survey-system.git
cd endocrine-survey-system

# 2. Instale dependências
pnpm install

# 3. Build do projeto
pnpm build

# 4. Teste localmente
pnpm start
```

### Etapa 2: Configurar Google Cloud SQL (PostgreSQL 17)

#### 2.1 Criar Instância Cloud SQL

```bash
# Configure o projeto GCP
gcloud config set project seu-projeto-gcp

# Crie a instância PostgreSQL 17
gcloud sql instances create endocrine-survey-db \
  --database-version=POSTGRES_17 \
  --tier=db-f1-micro \
  --region=us-central1 \
  --availability-type=REGIONAL \
  --backup-start-time=03:00 \
  --enable-bin-log

# Aguarde a criação (pode levar alguns minutos)
```

#### 2.2 Criar Banco de Dados e Usuário

```bash
# Crie o banco de dados
gcloud sql databases create endocrine_survey \
  --instance=endocrine-survey-db

# Crie o usuário
gcloud sql users create endocrine_user \
  --instance=endocrine-survey-db \
  --password=SENHA_SEGURA_CLOUD_SQL
```

#### 2.3 Obter Informações de Conexão

```bash
# Obtenha o IP público da instância (se necessário)
gcloud sql instances describe endocrine-survey-db \
  --format='value(ipAddresses[0].ipAddress)'

# Obtenha a string de conexão
gcloud sql instances describe endocrine-survey-db \
  --format='value(connectionName)'
# Resultado: seu-projeto-gcp:us-central1:endocrine-survey-db
```

### Etapa 3: Executar Migrações do Banco de Dados

#### 3.1 Via Cloud Shell

```bash
# Acesse Cloud Shell no console GCP
# Ou use sua máquina local com acesso ao Cloud SQL

# Defina a variável de ambiente
export DATABASE_URL="postgresql://endocrine_user:SENHA_SEGURA_CLOUD_SQL@/endocrine_survey?host=/cloudsql/seu-projeto-gcp:us-central1:endocrine-survey-db"

# Execute as migrações
pnpm drizzle-kit migrate
```

#### 3.2 Via Cloud SQL Proxy (Recomendado)

```bash
# 1. Instale o Cloud SQL Proxy
curl -o cloud-sql-proxy https://dl.google.com/cloudsql/cloud_sql_proxy.linux.amd64
chmod +x cloud-sql-proxy

# 2. Inicie o proxy em um terminal
./cloud-sql-proxy seu-projeto-gcp:us-central1:endocrine-survey-db

# 3. Em outro terminal, execute as migrações
export DATABASE_URL="postgresql://endocrine_user:SENHA_SEGURA_CLOUD_SQL@localhost:5432/endocrine_survey"
pnpm drizzle-kit migrate
```

### Etapa 4: Configurar Cloud Run

#### 4.1 Preparar Dockerfile

O projeto já possui um `Dockerfile` otimizado. Verifique se está correto:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

#### 4.2 Configurar Cloud Build

```bash
# Crie um arquivo cloudbuild.yaml na raiz do projeto
cat > cloudbuild.yaml << 'EOF'
steps:
  # Build da imagem Docker
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/endocrine-survey:$SHORT_SHA', '.']
  
  # Push para Container Registry
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/endocrine-survey:$SHORT_SHA']
  
  # Deploy para Cloud Run
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --image=gcr.io/$PROJECT_ID/endocrine-survey:$SHORT_SHA
      - --location=us-central1
      - --config=clouddeploy.yaml

images:
  - 'gcr.io/$PROJECT_ID/endocrine-survey:$SHORT_SHA'
EOF
```

#### 4.3 Fazer Deploy Manual no Cloud Run

```bash
# 1. Autentique no GCP
gcloud auth login

# 2. Configure o projeto
gcloud config set project seu-projeto-gcp

# 3. Faça o build da imagem Docker
gcloud builds submit --tag gcr.io/seu-projeto-gcp/endocrine-survey:latest

# 4. Deploy no Cloud Run
gcloud run deploy endocrine-survey \
  --image gcr.io/seu-projeto-gcp/endocrine-survey:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --memory 512Mi \
  --cpu 1 \
  --timeout 3600 \
  --set-env-vars=NODE_ENV=production,VITE_APP_TITLE="EndocriCheck - Pesquisa Endocrinológica",DATABASE_URL="postgresql://endocrine_user:SENHA_SEGURA_CLOUD_SQL@/endocrine_survey?host=/cloudsql/seu-projeto-gcp:us-central1:endocrine-survey-db",JWT_SECRET="sua_chave_jwt_secreta",OAUTH_SERVER_URL="https://api.manus.im",VITE_OAUTH_PORTAL_URL="https://manus.im",VITE_APP_ID="seu_app_id_manus",OWNER_OPEN_ID="seu_owner_open_id",OWNER_NAME="Seu Nome",BUILT_IN_FORGE_API_URL="https://api.manus.im/forge",BUILT_IN_FORGE_API_KEY="sua_chave_api_forge",VITE_FRONTEND_FORGE_API_URL="https://api.manus.im/forge",VITE_FRONTEND_FORGE_API_KEY="sua_chave_frontend_forge"
```

#### 4.4 Conectar Cloud Run ao Cloud SQL

```bash
# Adicione a conexão ao Cloud SQL
gcloud run services update endocrine-survey \
  --add-cloudsql-instances seu-projeto-gcp:us-central1:endocrine-survey-db \
  --region us-central1
```

### Etapa 5: Configurar Domínio Personalizado (Opcional)

```bash
# 1. Obtenha a URL do Cloud Run
gcloud run services describe endocrine-survey --region us-central1 --format='value(status.url)'

# 2. Configure o DNS do seu domínio para apontar para o Cloud Run
# Adicione um registro CNAME no seu provedor DNS:
# seu-dominio.com -> endocrine-survey-XXXXX.a.run.app

# 3. Configure o mapeamento de domínio no Cloud Run
gcloud run domain-mappings create \
  --service=endocrine-survey \
  --domain=seu-dominio.com \
  --region=us-central1
```

### Etapa 6: Configurar SSL/TLS

```bash
# Google Cloud Run fornece SSL/TLS automaticamente
# Seu domínio será acessível via HTTPS automaticamente
```

---

## 📊 Monitoramento e Logs

### Visualizar Logs

```bash
# Logs em tempo real
gcloud run services logs read endocrine-survey --region us-central1 --limit 50 --follow

# Logs de um período específico
gcloud run services logs read endocrine-survey --region us-central1 --limit 100 --format json
```

### Métricas

```bash
# Acesse o console do GCP
# Cloud Run > endocrine-survey > Metrics

# Monitore:
# - Request count
# - Latency (p50, p95, p99)
# - Error rate
# - Memory usage
# - CPU usage
```

---

## 🔒 Segurança

### 1. Variáveis de Ambiente Seguras

Use Google Secret Manager para armazenar senhas:

```bash
# Crie um secret
echo -n "sua_senha_segura" | gcloud secrets create cloud-sql-password --data-file=-

# Acesse o secret no Cloud Run
gcloud run services update endocrine-survey \
  --set-env-vars=CLOUD_SQL_PASSWORD=projects/seu-projeto-gcp/secrets/cloud-sql-password/versions/latest
```

### 2. Firewall

```bash
# Restrinja o acesso ao Cloud SQL
gcloud sql instances patch endocrine-survey-db \
  --require-ssl \
  --no-backup
```

### 3. Backup Automático

```bash
# Já configurado na criação da instância
# Verifique o status
gcloud sql backups list --instance=endocrine-survey-db
```

---

## 🆘 Troubleshooting

### Erro: "Connection refused"

```bash
# Verifique se o Cloud SQL Proxy está rodando
# Ou use a conexão via Cloud SQL Socket
```

### Erro: "Permission denied"

```bash
# Verifique as permissões do usuário
gcloud sql users list --instance=endocrine-survey-db

# Recrie o usuário se necessário
gcloud sql users delete endocrine_user --instance=endocrine-survey-db
gcloud sql users create endocrine_user --instance=endocrine-survey-db --password=NOVA_SENHA
```

### Erro: "Database does not exist"

```bash
# Verifique os bancos de dados
gcloud sql databases list --instance=endocrine-survey-db

# Crie o banco se necessário
gcloud sql databases create endocrine_survey --instance=endocrine-survey-db
```

---

## 📝 Checklist Final

- [ ] Projeto GCP criado
- [ ] Cloud SQL PostgreSQL 17 criado
- [ ] Banco de dados `endocrine_survey` criado
- [ ] Usuário `endocrine_user` criado
- [ ] Migrações executadas com sucesso
- [ ] Dockerfile testado localmente
- [ ] Imagem Docker enviada para Container Registry
- [ ] Cloud Run service criado
- [ ] Variáveis de ambiente configuradas
- [ ] Cloud SQL conectado ao Cloud Run
- [ ] Domínio personalizado configurado (opcional)
- [ ] SSL/TLS ativo
- [ ] Testes de acesso ao formulário
- [ ] Testes de acesso ao dashboard
- [ ] Monitoramento configurado
- [ ] Backups automáticos ativados

---

## 📞 Suporte

Para dúvidas sobre:
- **Google Cloud**: https://cloud.google.com/docs
- **Cloud SQL**: https://cloud.google.com/sql/docs
- **Cloud Run**: https://cloud.google.com/run/docs
- **Projeto**: Consulte o README.md

---

**Última atualização**: 2026-05-08  
**Versão**: 1.0.0  
**Status**: Pronto para Deploy
