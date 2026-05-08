# Variáveis de Ambiente - EndocriCheck

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)

---

## 📋 Tabela Completa de Variáveis

| Variável | Tipo | Obrigatória | Descrição | Exemplo |
|----------|------|-------------|-----------|---------|
| `DATABASE_URL` | String | ✅ Sim | URL de conexão PostgreSQL | `postgresql://user:pass@host:5432/db` |
| `NODE_ENV` | String | ✅ Sim | Ambiente (development/production) | `production` |
| `VITE_APP_TITLE` | String | ✅ Sim | Título da aplicação | `EndocriCheck - Pesquisa Endocrinológica` |
| `VITE_APP_ID` | String | ✅ Sim | ID da aplicação Manus | `seu_app_id_manus` |
| `JWT_SECRET` | String | ✅ Sim | Chave JWT (mín. 32 caracteres) | `sua_chave_jwt_secreta_muito_segura...` |
| `OAUTH_SERVER_URL` | URL | ✅ Sim | URL do servidor OAuth | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | URL | ✅ Sim | URL do portal OAuth | `https://manus.im` |
| `OWNER_OPEN_ID` | String | ✅ Sim | OpenID do proprietário | `seu_owner_open_id` |
| `OWNER_NAME` | String | ✅ Sim | Nome do proprietário | `Seu Nome Completo` |
| `BUILT_IN_FORGE_API_URL` | URL | ✅ Sim | URL da Forge API | `https://api.manus.im/forge` |
| `BUILT_IN_FORGE_API_KEY` | String | ✅ Sim | Chave da Forge API | `sua_chave_api_forge_secreta` |
| `VITE_FRONTEND_FORGE_API_URL` | URL | ✅ Sim | URL Frontend Forge API | `https://api.manus.im/forge` |
| `VITE_FRONTEND_FORGE_API_KEY` | String | ✅ Sim | Chave Frontend Forge API | `sua_chave_frontend_forge_secreta` |
| `VITE_ANALYTICS_ENDPOINT` | URL | ❌ Não | Endpoint de analytics | `https://analytics.exemplo.com` |
| `VITE_ANALYTICS_WEBSITE_ID` | String | ❌ Não | ID do website para analytics | `seu_website_id` |
| `PORT` | Number | ❌ Não | Porta do servidor | `3000` |
| `HOST` | String | ❌ Não | Host do servidor | `0.0.0.0` |
| `SESSION_SECRET` | String | ❌ Não | Chave de sessão (mín. 32 caracteres) | `sua_chave_sessao_secreta...` |
| `SESSION_TIMEOUT_MS` | Number | ❌ Não | Timeout da sessão em ms | `86400000` |
| `CORS_ORIGIN` | String | ❌ Não | Origens CORS permitidas | `https://seu-dominio.com` |
| `RATE_LIMIT_WINDOW_MS` | Number | ❌ Não | Janela de rate limit em ms | `900000` |
| `RATE_LIMIT_MAX_REQUESTS` | Number | ❌ Não | Máximo de requisições | `100` |
| `LOG_LEVEL` | String | ❌ Não | Nível de log | `info` |
| `VITE_APP_LOGO` | URL | ❌ Não | URL do logo da aplicação | `https://seu-dominio.com/logo.png` |

---

## 🔑 Variáveis Obrigatórias (Produção)

### 1. Banco de Dados

```
DATABASE_URL=postgresql://endocrine_user:SENHA_SEGURA@/endocrine_survey?host=/cloudsql/seu-projeto-gcp:us-central1:endocrine-survey-db
```

**Formato para diferentes ambientes:**

- **Local (Docker)**: `postgresql://endocrine_user:senha@postgres:5432/endocrine_survey`
- **Local (Nativo)**: `postgresql://endocrine_user:senha@localhost:5432/endocrine_survey`
- **Google Cloud SQL**: `postgresql://endocrine_user:senha@/endocrine_survey?host=/cloudsql/PROJETO:REGION:INSTANCE`
- **Cloud SQL Proxy**: `postgresql://endocrine_user:senha@localhost:5432/endocrine_survey`

### 2. Ambiente

```
NODE_ENV=production
```

### 3. Aplicação

```
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
```

### 4. OAuth Manus

```
VITE_APP_ID=seu_app_id_manus
JWT_SECRET=sua_chave_jwt_secreta_muito_segura_minimo_32_caracteres
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Seu Nome Completo
```

### 5. Forge API

```
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=sua_chave_api_forge_secreta
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_forge_secreta
```

---

## 🔒 Variáveis Sensíveis (Segurança)

As seguintes variáveis contêm informações sensíveis e devem ser:
- Armazenadas em um gerenciador de secrets (Google Secret Manager, HashiCorp Vault, etc.)
- Nunca commitadas no Git
- Rotacionadas regularmente

1. `DATABASE_URL` - Credenciais do banco de dados
2. `JWT_SECRET` - Chave de assinatura JWT
3. `BUILT_IN_FORGE_API_KEY` - Chave da API
4. `VITE_FRONTEND_FORGE_API_KEY` - Chave da API Frontend
5. `SESSION_SECRET` - Chave de sessão
6. `OWNER_OPEN_ID` - ID do proprietário

---

## 🚀 Exemplo Completo para GCP Cloud Run

```bash
# Copie e adapte para seu ambiente
gcloud run deploy endocrine-survey \
  --image gcr.io/seu-projeto-gcp/endocrine-survey:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars=\
NODE_ENV=production,\
VITE_APP_TITLE="EndocriCheck - Pesquisa Endocrinológica",\
DATABASE_URL="postgresql://endocrine_user:SENHA_SEGURA@/endocrine_survey?host=/cloudsql/seu-projeto-gcp:us-central1:endocrine-survey-db",\
VITE_APP_ID="seu_app_id_manus",\
JWT_SECRET="sua_chave_jwt_secreta_muito_segura_minimo_32_caracteres",\
OAUTH_SERVER_URL="https://api.manus.im",\
VITE_OAUTH_PORTAL_URL="https://manus.im",\
OWNER_OPEN_ID="seu_owner_open_id",\
OWNER_NAME="Seu Nome Completo",\
BUILT_IN_FORGE_API_URL="https://api.manus.im/forge",\
BUILT_IN_FORGE_API_KEY="sua_chave_api_forge_secreta",\
VITE_FRONTEND_FORGE_API_URL="https://api.manus.im/forge",\
VITE_FRONTEND_FORGE_API_KEY="sua_chave_frontend_forge_secreta",\
VITE_ANALYTICS_ENDPOINT="https://seu-analytics-endpoint.com",\
VITE_ANALYTICS_WEBSITE_ID="seu_website_id",\
PORT="3000",\
HOST="0.0.0.0"
```

---

## 📝 Checklist de Configuração

### Antes do Deploy

- [ ] Todas as variáveis obrigatórias foram definidas
- [ ] Senhas foram alteradas de valores padrão
- [ ] Chaves JWT e SESSION_SECRET têm pelo menos 32 caracteres
- [ ] URLs de OAuth estão corretas
- [ ] Banco de dados PostgreSQL foi criado
- [ ] Migrações foram executadas
- [ ] Dockerfile foi testado localmente
- [ ] Variáveis sensíveis estão em um gerenciador de secrets

### Após o Deploy

- [ ] Aplicação está acessível via URL
- [ ] Formulário carrega sem erros
- [ ] Dashboard administrativo funciona
- [ ] Dados são salvos no banco de dados
- [ ] Logs não mostram erros críticos
- [ ] HTTPS está ativo
- [ ] Backups do banco de dados estão configurados

---

## 🔄 Rotação de Secrets

Recomenda-se rotacionar as seguintes variáveis a cada 90 dias:

1. `JWT_SECRET`
2. `SESSION_SECRET`
3. `BUILT_IN_FORGE_API_KEY`
4. `VITE_FRONTEND_FORGE_API_KEY`
5. Senha do banco de dados (em `DATABASE_URL`)

---

## 🆘 Troubleshooting

### Erro: "Invalid DATABASE_URL"

**Solução**: Verifique o formato da URL e as credenciais do banco de dados.

```bash
# Teste a conexão
psql "postgresql://user:password@host:5432/database"
```

### Erro: "JWT_SECRET must be at least 32 characters"

**Solução**: Gere uma chave mais longa:

```bash
openssl rand -base64 32
```

### Erro: "OAuth callback failed"

**Solução**: Verifique se `VITE_APP_ID` e `OAUTH_SERVER_URL` estão corretos.

---

## 📚 Referências

- [Google Cloud Run Docs](https://cloud.google.com/run/docs)
- [Google Cloud SQL Docs](https://cloud.google.com/sql/docs)
- [PostgreSQL Connection Strings](https://www.postgresql.org/docs/current/libpq-connect.html)
- [Node.js Environment Variables](https://nodejs.org/en/learn/how-to-read-environment-variables-from-nodejs)

---

**Última atualização**: 2026-05-08  
**Versão**: 1.0.0
