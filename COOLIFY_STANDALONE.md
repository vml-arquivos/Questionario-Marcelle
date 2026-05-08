# 🚀 Deploy Standalone no Coolify - EndocriCheck

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)  
**Projeto**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Plataforma**: Coolify (VPS)  
**Banco de Dados**: PostgreSQL 17 (Local na VPS)  
**Autenticação**: Local (Sem Manus)  
**Status**: 100% Independente  

---

## ✅ O que você precisa saber

Este projeto é **completamente independente**. Não usa:
- ❌ Manus OAuth
- ❌ Manus APIs
- ❌ Manus Secrets
- ❌ Manus Storage

Usa apenas:
- ✅ Docker
- ✅ PostgreSQL 17
- ✅ Node.js
- ✅ React 19
- ✅ Express

---

## 📋 Variáveis de Ambiente Necessárias (APENAS 6)

### 1. Banco de Dados

```
DATABASE_URL=postgresql://endocrine_user:sua_senha_segura@localhost:5432/endocrine_survey
```

**Explicação**: URL de conexão com o PostgreSQL rodando na mesma VPS.

### 2. Ambiente

```
NODE_ENV=production
```

**Explicação**: Define que está em produção.

### 3. Aplicação

```
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
```

**Explicação**: Título da aplicação que aparece no navegador.

### 4. Chave de Sessão

```
SESSION_SECRET=sua_chave_secreta_minimo_32_caracteres
```

**Explicação**: Chave para criptografar as sessões dos usuários.

**Como gerar**: 
```bash
openssl rand -base64 32
```

### 5. Domínio da Aplicação

```
VITE_APP_DOMAIN=https://seu-dominio.com
```

**Explicação**: URL onde a aplicação será acessada.

### 6. Porta (Padrão)

```
PORT=3000
HOST=0.0.0.0
```

**Explicação**: Porta e host (NÃO altere estes valores).

---

## 🐳 Como Fazer o Deploy no Coolify

### Passo 1: Conectar o Repositório

1. Acesse o Coolify Dashboard
2. Clique em "Criar Nova Aplicação"
3. Selecione "GitHub"
4. Escolha o repositório: `vml-arquivos/Questionario-Marcelle`
5. Selecione a branch: `main`

### Passo 2: Configurar o Banco de Dados

1. No Coolify, vá para "Serviços"
2. Clique em "Adicionar Serviço"
3. Selecione "PostgreSQL"
4. Configure:
   - **Versão**: 17
   - **Usuário**: `endocrine_user`
   - **Senha**: `sua_senha_segura`
   - **Banco de Dados**: `endocrine_survey`
5. Clique em "Deploy"

### Passo 3: Configurar as Variáveis de Ambiente

1. Na aplicação, vá para "Variáveis de Ambiente"
2. Adicione as 6 variáveis abaixo:

```
DATABASE_URL=postgresql://endocrine_user:sua_senha_segura@postgres:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
SESSION_SECRET=sua_chave_secreta_minimo_32_caracteres
VITE_APP_DOMAIN=https://seu-dominio.com
PORT=3000
HOST=0.0.0.0
```

**Importante**: Se o PostgreSQL está no mesmo Coolify, use `postgres` como hostname em vez de `localhost`.

### Passo 4: Configurar o Dockerfile

O projeto já tem um Dockerfile pronto. Coolify detectará automaticamente.

Se precisar customizar, edite o `Dockerfile` no repositório.

### Passo 5: Deploy

1. Clique em "Deploy"
2. Aguarde o build (2-5 minutos)
3. Verifique os logs
4. Acesse a URL da aplicação

---

## 🗄️ Banco de Dados - Migrations

As migrations são executadas automaticamente no primeiro deploy via Docker.

Se precisar executar manualmente:

```bash
# Dentro do container
pnpm drizzle-kit migrate
```

---

## 🔐 Autenticação Local

O sistema usa autenticação local simples:

- **Usuário padrão**: `admin`
- **Senha padrão**: `admin123` (ALTERE APÓS PRIMEIRO LOGIN!)

Você pode criar novos usuários no dashboard administrativo.

---

## 📊 Acessar a Aplicação

Após o deploy:

1. **Formulário Público**: `https://seu-dominio.com/survey`
2. **Dashboard Admin**: `https://seu-dominio.com/dashboard`
3. **Home**: `https://seu-dominio.com/`

---

## 🆘 Troubleshooting

### Erro: "Connection refused" no banco de dados

**Solução**: Verifique se o PostgreSQL está rodando e se a `DATABASE_URL` está correta.

```bash
# Teste a conexão
psql "postgresql://endocrine_user:senha@localhost:5432/endocrine_survey"
```

### Erro: "Port already in use"

**Solução**: Mude a porta no Coolify ou verifique se há outro serviço usando a porta 3000.

### Erro: "Migrations failed"

**Solução**: Verifique os logs do Docker e execute manualmente:

```bash
docker exec seu-container pnpm drizzle-kit migrate
```

---

## 📈 Monitoramento

### Logs

```bash
# Ver logs em tempo real
docker logs -f seu-container

# Ver últimas 100 linhas
docker logs --tail 100 seu-container
```

### Banco de Dados

```bash
# Conectar ao PostgreSQL
psql "postgresql://endocrine_user:senha@localhost:5432/endocrine_survey"

# Ver tabelas
\dt

# Ver dados de respostas
SELECT COUNT(*) FROM survey_responses;
```

---

## 🔄 Atualizar a Aplicação

Após fazer mudanças no repositório:

1. Faça commit e push para `main`
2. No Coolify, clique em "Redeploy"
3. Aguarde o novo build

---

## 📝 Estrutura de Arquivos

```
endocrine-survey-system/
├── client/                    # Frontend React 19
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx
│   │   │   ├── SurveyForm.tsx
│   │   │   └── Dashboard.tsx
│   │   ├── App.tsx
│   │   └── index.css
│   └── public/
├── server/                    # Backend Express
│   ├── routers.ts
│   ├── db.ts
│   ├── auth.ts
│   └── tests/
├── drizzle/                   # Schema PostgreSQL
│   ├── schema.ts
│   └── migrations/
├── Dockerfile                 # Build Docker
├── docker-compose.yml         # Local development
├── README.md
└── package.json
```

---

## ✅ Checklist Final

- [ ] Repositório conectado no Coolify
- [ ] PostgreSQL 17 criado no Coolify
- [ ] 6 variáveis de ambiente configuradas
- [ ] Dockerfile detectado
- [ ] Deploy iniciado
- [ ] Aplicação acessível
- [ ] Formulário funcionando
- [ ] Dashboard funcionando
- [ ] Dados sendo salvos no banco

---

## 🚀 Pronto para Produção

O sistema está pronto para produção. Recomendações:

1. **Altere a senha padrão** do admin após primeiro login
2. **Configure backups** do PostgreSQL
3. **Configure SSL/TLS** (Coolify faz automaticamente)
4. **Monitore os logs** regularmente
5. **Faça backups** do banco de dados

---

**Versão**: 1.0.0  
**Última atualização**: 2026-05-08  
**Status**: Pronto para Deploy
