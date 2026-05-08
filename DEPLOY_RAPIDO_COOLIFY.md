# 🚀 Deploy Rápido - Coolify com Buildpack Dockerfile

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)  
**Projeto**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Domínio**: pesquisa.permupay.com.br  
**Porta**: 4000  
**Build**: Dockerfile (Buildpack)  
**Migrations**: Automáticas ✅  

---

## ⚡ Resumo Executivo

```
✅ Dockerfile pronto
✅ Variáveis pré-configuradas
✅ Migrations automáticas
✅ Apenas 3 passos para deploy
```

---

## 📋 PASSO 1: Variáveis de Ambiente (Copie e Cole)

No Coolify, vá para: **Aplicação > Variáveis de Ambiente**

Cole exatamente isto:

```
DATABASE_URL=postgresql://endocrine_user:SUA_SENHA_AQUI@postgres:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
SESSION_SECRET=ack6IEOF2Z35B5Cp7FVkWUwrs9d4Rn4cL6tE+gr7JiY=
VITE_APP_DOMAIN=https://pesquisa.permupay.com.br
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info
```

### ⚠️ Importante: Preencha Isto

Substitua `SUA_SENHA_AQUI` pela **senha do PostgreSQL** que você criou.

Exemplo:
```
DATABASE_URL=postgresql://endocrine_user:MinhaSenh@123@postgres:5432/endocrine_survey
```

---

## 🐳 PASSO 2: Configurar Dockerfile

No Coolify, vá para: **Aplicação > Build**

Configure assim:

| Campo | Valor |
|-------|-------|
| **Build Type** | Dockerfile |
| **Dockerfile Path** | `./Dockerfile` |
| **Build Command** | `pnpm build` |
| **Start Command** | `pnpm start` |

---

## 🚀 PASSO 3: Deploy

1. Clique em **"Deploy"** ou **"Redeploy"**
2. Aguarde 2-5 minutos
3. Verifique os logs
4. Pronto! ✅

---

## ✅ Migrations Automáticas

**SIM, as migrations são automáticas!**

O Dockerfile executa automaticamente:
```bash
pnpm drizzle-kit migrate
```

Você verá nos logs:
```
[info] Migrations executed successfully
[info] Tables created: survey_responses, users
```

---

## 🌐 Acessar a Aplicação

Após o deploy:

| URL | Descrição |
|-----|-----------|
| `https://pesquisa.permupay.com.br` | Home |
| `https://pesquisa.permupay.com.br/survey` | Formulário |
| `https://pesquisa.permupay.com.br/dashboard` | Dashboard Admin |

---

## 🔐 Login Padrão

```
Usuário: admin
Senha: admin123
```

⚠️ **Altere a senha após primeiro login!**

---

## 📊 Verificar Deploy

### Logs em Tempo Real

No Coolify: **Aplicação > Logs**

Procure por:
```
✅ Server running on http://localhost:4000
✅ Connected to database
✅ Migrations executed successfully
```

### Testar Aplicação

```bash
# Teste a conexão
curl -I https://pesquisa.permupay.com.br

# Deve retornar: HTTP/2 200 OK
```

---

## 🆘 Troubleshooting Rápido

| Erro | Solução |
|------|---------|
| `Connection refused` | Verifique DATABASE_URL e senha |
| `Port already in use` | Mude porta no Coolify |
| `Migrations failed` | Verifique logs, execute manualmente |
| `Cannot find module` | Execute `pnpm install` no container |

---

## 📁 Arquivos Importantes

```
endocrine-survey-system/
├── Dockerfile              ← Build
├── docker-compose.yml      ← Local dev
├── drizzle/
│   ├── schema.ts          ← Tabelas
│   └── migrations/        ← SQL
├── server/
│   ├── routers.ts         ← API
│   └── db.ts              ← Queries
├── client/
│   └── src/pages/         ← Frontend
└── package.json           ← Dependências
```

---

## ✨ Checklist Final

- [ ] PostgreSQL 17 criado no Coolify
- [ ] Banco `endocrine_survey` criado
- [ ] Usuário `endocrine_user` criado
- [ ] Variáveis de ambiente configuradas
- [ ] Senha do PostgreSQL preenchida em DATABASE_URL
- [ ] Dockerfile selecionado como Build Type
- [ ] Deploy iniciado
- [ ] Aplicação acessível
- [ ] Formulário funcionando
- [ ] Dashboard funcionando
- [ ] Senha do admin alterada

---

## 🎉 Pronto!

Sistema pronto para produção com:
- ✅ Dockerfile otimizado
- ✅ Migrations automáticas
- ✅ PostgreSQL 17
- ✅ 100% independente
- ✅ Sem dependências externas

---

**Versão**: 1.0.0  
**Data**: 2026-05-08  
**Status**: Pronto para Deploy Rápido
