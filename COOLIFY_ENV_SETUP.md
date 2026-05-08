# 📋 Formulário de Configuração de Variáveis - Coolify

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)  
**Projeto**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Plataforma**: Coolify  
**Banco de Dados**: PostgreSQL 17  

---

## ✅ Checklist de Informações Necessárias

Complete este formulário com todas as informações necessárias para configurar o deploy no Coolify sem retrabalho.

---

## 🔐 SEÇÃO 1: BANCO DE DADOS (PostgreSQL 17)

### 1.1 Conexão ao PostgreSQL

Você já instalou o PostgreSQL no Coolify. Agora precisamos da string de conexão.

**Pergunta 1.1.1**: Qual é a **string de conexão PostgreSQL** fornecida pelo Coolify?  
*Formato esperado: `postgresql://usuario:senha@host:porta/banco_de_dados`*

```
DATABASE_URL = _______________________________________________
```

**Pergunta 1.1.2**: Se não souber a string exata, forneça os dados abaixo:
- **Usuário do PostgreSQL**: _______________
- **Senha do PostgreSQL**: _______________
- **Host/IP do PostgreSQL**: _______________
- **Porta do PostgreSQL**: _______________ (padrão: 5432)
- **Nome do banco de dados**: _______________ (recomendado: `endocrine_survey`)

---

## 🌍 SEÇÃO 2: AMBIENTE E APLICAÇÃO

### 2.1 Ambiente de Execução

**Pergunta 2.1.1**: Qual é o ambiente?
- [ ] **production** (recomendado para Coolify)
- [ ] **staging**
- [ ] **development**

```
NODE_ENV = production
```

### 2.2 Informações da Aplicação

**Pergunta 2.2.1**: Qual é o **título da aplicação**? (será exibido no navegador e emails)

```
VITE_APP_TITLE = EndocriCheck - Pesquisa Endocrinológica
```

**Pergunta 2.2.2**: Qual é o **domínio/URL** onde a aplicação será acessada?  
*Exemplo: `https://endocricheck.seudominio.com` ou `https://seu-coolify-url.com`*

```
VITE_APP_DOMAIN = _______________________________________________
```

---

## 🔑 SEÇÃO 3: AUTENTICAÇÃO OAUTH (Manus)

### 3.1 Credenciais OAuth

Você precisa obter estas informações da plataforma Manus onde criou a aplicação.

**Pergunta 3.1.1**: Qual é o **VITE_APP_ID**?  
*Obtém em: Manus Dashboard > Aplicações > Seu App > App ID*

```
VITE_APP_ID = _______________________________________________
```

**Pergunta 3.1.2**: Qual é o **OWNER_OPEN_ID**?  
*Seu ID único na plataforma Manus*

```
OWNER_OPEN_ID = _______________________________________________
```

**Pergunta 3.1.3**: Qual é o seu **nome completo**? (será usado como proprietário)

```
OWNER_NAME = _______________________________________________
```

### 3.2 Chaves de Segurança

**Pergunta 3.2.1**: Gere uma **JWT_SECRET** segura (mínimo 32 caracteres)  
*Se não tiver, use: `openssl rand -base64 32`*

```
JWT_SECRET = _______________________________________________
```

**Pergunta 3.2.2**: Gere uma **SESSION_SECRET** segura (mínimo 32 caracteres)  
*Se não tiver, use: `openssl rand -base64 32`*

```
SESSION_SECRET = _______________________________________________
```

### 3.3 URLs OAuth

Estas URLs geralmente são padrão, mas confirme se estão corretas:

**Pergunta 3.3.1**: Qual é a **URL do servidor OAuth Manus**?  
*Padrão: `https://api.manus.im`*

```
OAUTH_SERVER_URL = https://api.manus.im
```

**Pergunta 3.3.2**: Qual é a **URL do portal OAuth Manus**?  
*Padrão: `https://manus.im`*

```
VITE_OAUTH_PORTAL_URL = https://manus.im
```

---

## 🔌 SEÇÃO 4: FORGE API (Manus Built-in APIs)

### 4.1 Credenciais da Forge API

Você precisa obter estas informações do Manus.

**Pergunta 4.1.1**: Qual é a **URL da Forge API**?  
*Padrão: `https://api.manus.im/forge`*

```
BUILT_IN_FORGE_API_URL = https://api.manus.im/forge
```

**Pergunta 4.1.2**: Qual é a **chave de API Forge (servidor)**?  
*Obtém em: Manus Dashboard > API Keys > Forge API Key (Server)*

```
BUILT_IN_FORGE_API_KEY = _______________________________________________
```

**Pergunta 4.1.3**: Qual é a **URL da Forge API para Frontend**?  
*Padrão: `https://api.manus.im/forge`*

```
VITE_FRONTEND_FORGE_API_URL = https://api.manus.im/forge
```

**Pergunta 4.1.4**: Qual é a **chave de API Forge (frontend)**?  
*Obtém em: Manus Dashboard > API Keys > Forge API Key (Frontend)*

```
VITE_FRONTEND_FORGE_API_KEY = _______________________________________________
```

---

## 📊 SEÇÃO 5: ANALYTICS (Opcional)

### 5.1 Configuração de Analytics

Se você usa um serviço de analytics (Plausible, Umami, Google Analytics, etc), preencha:

**Pergunta 5.1.1**: Você quer usar **analytics**?
- [ ] Sim
- [ ] Não (deixar em branco)

**Pergunta 5.1.2**: Qual é o **endpoint de analytics**?  
*Exemplo: `https://analytics.seudominio.com` ou `https://plausible.io`*

```
VITE_ANALYTICS_ENDPOINT = _______________________________________________
```

**Pergunta 5.1.3**: Qual é o **ID do website para analytics**?

```
VITE_ANALYTICS_WEBSITE_ID = _______________________________________________
```

---

## 🖼️ SEÇÃO 6: LOGO E BRANDING (Opcional)

### 6.1 Logo da Aplicação

**Pergunta 6.1.1**: Você tem uma **URL de logo** para a aplicação?  
*Exemplo: `https://seudominio.com/logo.png`*

```
VITE_APP_LOGO = _______________________________________________
```

---

## 🔒 SEÇÃO 7: SEGURANÇA

### 7.1 CORS (Cross-Origin Resource Sharing)

**Pergunta 7.1.1**: Qual é o **domínio de origem** permitido?  
*Geralmente é o mesmo domínio da aplicação*

```
CORS_ORIGIN = _______________________________________________
```

### 7.2 Rate Limiting

**Pergunta 7.2.1**: Qual é a **janela de rate limit** em milissegundos?  
*Padrão: 900000 (15 minutos)*

```
RATE_LIMIT_WINDOW_MS = 900000
```

**Pergunta 7.2.2**: Qual é o **máximo de requisições** por janela?  
*Padrão: 100*

```
RATE_LIMIT_MAX_REQUESTS = 100
```

---

## 📝 SEÇÃO 8: SERVIDOR

### 8.1 Configuração do Servidor

**Pergunta 8.1.1**: Qual é a **porta** do servidor?  
*Padrão para Coolify: 3000 (NÃO altere)*

```
PORT = 3000
```

**Pergunta 8.1.2**: Qual é o **host** do servidor?  
*Padrão para Coolify: 0.0.0.0 (NÃO altere)*

```
HOST = 0.0.0.0
```

### 8.2 Logging

**Pergunta 8.2.1**: Qual é o **nível de log**?
- [ ] **error** (apenas erros)
- [ ] **warn** (erros e avisos)
- [ ] **info** (recomendado para produção)
- [ ] **debug** (muito verboso)
- [ ] **trace** (extremamente verboso)

```
LOG_LEVEL = info
```

---

## 📋 RESUMO DAS VARIÁVEIS OBRIGATÓRIAS

Copie e cole este resumo com os valores preenchidos:

```bash
# Banco de Dados
DATABASE_URL=postgresql://usuario:senha@host:5432/endocrine_survey

# Ambiente
NODE_ENV=production

# Aplicação
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
VITE_APP_DOMAIN=https://seu-dominio.com

# OAuth Manus
VITE_APP_ID=seu_app_id
OWNER_OPEN_ID=seu_owner_open_id
OWNER_NAME=Seu Nome Completo

# Chaves de Segurança
JWT_SECRET=sua_chave_jwt_secreta_32_caracteres
SESSION_SECRET=sua_chave_sessao_secreta_32_caracteres

# URLs OAuth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://manus.im

# Forge API
BUILT_IN_FORGE_API_URL=https://api.manus.im/forge
BUILT_IN_FORGE_API_KEY=sua_chave_forge_api
VITE_FRONTEND_FORGE_API_URL=https://api.manus.im/forge
VITE_FRONTEND_FORGE_API_KEY=sua_chave_frontend_forge

# Servidor
PORT=3000
HOST=0.0.0.0

# Logging
LOG_LEVEL=info

# CORS
CORS_ORIGIN=https://seu-dominio.com

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Analytics (opcional)
VITE_ANALYTICS_ENDPOINT=https://seu-analytics.com
VITE_ANALYTICS_WEBSITE_ID=seu_website_id

# Logo (opcional)
VITE_APP_LOGO=https://seu-dominio.com/logo.png
```

---

## ✅ Checklist Final

- [ ] DATABASE_URL preenchido corretamente
- [ ] VITE_APP_ID obtido do Manus
- [ ] OWNER_OPEN_ID obtido do Manus
- [ ] JWT_SECRET gerado (32+ caracteres)
- [ ] SESSION_SECRET gerado (32+ caracteres)
- [ ] BUILT_IN_FORGE_API_KEY obtido
- [ ] VITE_FRONTEND_FORGE_API_KEY obtido
- [ ] CORS_ORIGIN configurado
- [ ] Domínio da aplicação definido

---

## 🚀 Próximo Passo

Após preencher este formulário:

1. **No Coolify Dashboard**:
   - Vá para: Aplicações > EndocriCheck > Variáveis de Ambiente
   - Cole todas as variáveis
   - Clique em "Salvar"
   - Clique em "Deploy"

2. **Teste a aplicação**:
   - Acesse o formulário
   - Teste o dashboard
   - Verifique os logs

---

**Última atualização**: 2026-05-08  
**Versão**: 1.0.0
