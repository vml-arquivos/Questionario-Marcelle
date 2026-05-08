# 🚀 Guia de Deploy Manual - Coolify

**Pesquisador**: Marcelle Vitória Alves de Lima (1º F)  
**Projeto**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Domínio**: pesquisa.permupay.com.br  
**Porta**: 4000  
**Status**: Pronto para Deploy Manual  

---

## 📋 Pré-requisitos

- [ ] Coolify instalado e configurado na VPS
- [ ] PostgreSQL 17 criado no Coolify
- [ ] Repositório GitHub conectado: `vml-arquivos/Questionario-Marcelle`
- [ ] Arquivo `ENV_COOLIFY_FINAL.txt` com as variáveis

---

## 🔧 Passo 1: Preparar o Banco de Dados

### 1.1 Criar Usuário e Banco de Dados

```bash
# Conecte ao PostgreSQL
psql -U postgres

# Execute os comandos SQL:
CREATE USER endocrine_user WITH PASSWORD 'sua_senha_segura';
CREATE DATABASE endocrine_survey OWNER endocrine_user;

# Saia do psql
\q
```

### 1.2 Verificar Conexão

```bash
# Teste a conexão
psql -h localhost -U endocrine_user -d endocrine_survey

# Se conectar com sucesso, saia
\q
```

---

## 🐳 Passo 2: Configurar Coolify

### 2.1 Adicionar Repositório

1. Acesse Coolify Dashboard
2. Clique em "Criar Nova Aplicação"
3. Selecione "GitHub"
4. Escolha: `vml-arquivos/Questionario-Marcelle`
5. Branch: `main`
6. Clique em "Continuar"

### 2.2 Configurar Variáveis de Ambiente

1. Na aplicação, vá para "Variáveis de Ambiente"
2. Clique em "Adicionar Variável"
3. Cole as variáveis do arquivo `ENV_COOLIFY_FINAL.txt`:

```
DATABASE_URL=postgresql://endocrine_user:SUA_SENHA_AQUI@localhost:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
SESSION_SECRET=ack6IEOF2Z35B5Cp7FVkWUwrs9d4Rn4cL6tE+gr7JiY=
VITE_APP_DOMAIN=https://pesquisa.permupay.com.br
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info
```

**Importante**: Substitua `SUA_SENHA_AQUI` pela senha real do PostgreSQL

### 2.3 Configurar Dockerfile

1. Coolify detectará automaticamente o `Dockerfile`
2. Se não detectar, configure manualmente:
   - **Dockerfile Path**: `./Dockerfile`
   - **Build Command**: `pnpm build`
   - **Start Command**: `pnpm start`

### 2.4 Configurar Porta

1. Na aplicação, vá para "Portas"
2. Configure:
   - **Porta Interna**: 4000
   - **Porta Externa**: 4000 (ou a que você preferir)
   - **Protocolo**: HTTP/HTTPS

---

## 🗄️ Passo 3: Executar Migrations

### Opção A: Automático (Recomendado)

As migrations são executadas automaticamente no primeiro deploy.

### Opção B: Manual

Se as migrations não forem executadas automaticamente:

```bash
# 1. Acesse o container
docker exec -it seu-container-name bash

# 2. Execute as migrations
pnpm drizzle-kit migrate

# 3. Saia do container
exit
```

### Verificar Migrations

```bash
# Conecte ao banco de dados
psql -h localhost -U endocrine_user -d endocrine_survey

# Liste as tabelas
\dt

# Você deve ver:
# - survey_responses
# - users (se houver autenticação)

# Saia
\q
```

---

## 🚀 Passo 4: Fazer Deploy

### 4.1 No Coolify Dashboard

1. Selecione a aplicação
2. Clique em "Deploy" ou "Redeploy"
3. Aguarde o build (2-5 minutos)
4. Verifique os logs

### 4.2 Monitorar o Deploy

```bash
# Ver logs em tempo real
docker logs -f seu-container-name

# Procure por mensagens como:
# "Server running on http://localhost:4000"
# "Connected to database"
```

---

## ✅ Passo 5: Verificar o Deploy

### 5.1 Testar a Aplicação

1. Acesse: `https://pesquisa.permupay.com.br`
2. Você deve ver a página inicial
3. Clique em "Responder Pesquisa"
4. Teste o formulário

### 5.2 Testar o Dashboard

1. Acesse: `https://pesquisa.permupay.com.br/dashboard`
2. Login:
   - Usuário: `admin`
   - Senha: `admin123`
3. Você deve ver os gráficos e dados

### 5.3 Testar o Banco de Dados

```bash
# Conecte ao banco
psql -h localhost -U endocrine_user -d endocrine_survey

# Verifique as tabelas
SELECT COUNT(*) FROM survey_responses;

# Você deve ver: count
#               -----
#                  0 (ou mais se houver respostas)
```

---

## 🔒 Passo 6: Segurança

### 6.1 Alterar Senha do Admin

1. Acesse o dashboard: `https://pesquisa.permupay.com.br/dashboard`
2. Login com `admin` / `admin123`
3. Vá para "Configurações" ou "Perfil"
4. Altere a senha
5. Logout e faça login com a nova senha

### 6.2 Configurar SSL/TLS

Coolify geralmente configura SSL automaticamente. Se não:

1. Use Let's Encrypt (recomendado)
2. Ou configure um certificado manual

### 6.3 Configurar Firewall

```bash
# Permitir apenas portas necessárias
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 4000/tcp  # Aplicação (se necessário)
sudo ufw enable
```

---

## 📊 Passo 7: Monitoramento

### 7.1 Logs

```bash
# Ver logs em tempo real
docker logs -f seu-container-name

# Ver últimas 100 linhas
docker logs --tail 100 seu-container-name

# Salvar logs em arquivo
docker logs seu-container-name > logs.txt
```

### 7.2 Banco de Dados

```bash
# Conectar ao PostgreSQL
psql -h localhost -U endocrine_user -d endocrine_survey

# Ver tamanho do banco
SELECT pg_size_pretty(pg_database_size('endocrine_survey'));

# Ver número de respostas
SELECT COUNT(*) FROM survey_responses;

# Ver respostas recentes
SELECT id, profile_type, gender, age_range, created_at 
FROM survey_responses 
ORDER BY created_at DESC 
LIMIT 10;
```

### 7.3 Saúde da Aplicação

```bash
# Verificar se a aplicação está respondendo
curl -I https://pesquisa.permupay.com.br

# Você deve receber: HTTP/2 200 OK

# Testar a API
curl https://pesquisa.permupay.com.br/api/health
```

---

## 🔄 Passo 8: Backups

### 8.1 Backup do PostgreSQL

```bash
# Fazer backup completo
pg_dump -h localhost -U endocrine_user -d endocrine_survey > backup.sql

# Fazer backup comprimido
pg_dump -h localhost -U endocrine_user -d endocrine_survey | gzip > backup.sql.gz

# Restaurar de um backup
psql -h localhost -U endocrine_user -d endocrine_survey < backup.sql
```

### 8.2 Backup Automático

Configure no Coolify:
1. Vá para "Backups"
2. Configure frequência (diária recomendada)
3. Defina retenção (30 dias recomendado)

---

## 🆘 Troubleshooting

### Erro: "Connection refused" ao banco de dados

```bash
# Verifique se PostgreSQL está rodando
sudo systemctl status postgresql

# Se não estiver, inicie
sudo systemctl start postgresql

# Verifique a conexão
psql -h localhost -U endocrine_user -d endocrine_survey
```

### Erro: "Port 4000 already in use"

```bash
# Encontre o processo usando a porta
lsof -i :4000

# Mate o processo (se necessário)
kill -9 PID

# Ou use outra porta no Coolify
```

### Erro: "Migrations failed"

```bash
# Verifique os logs
docker logs seu-container-name

# Execute manualmente
docker exec seu-container-name pnpm drizzle-kit migrate

# Se ainda falhar, verifique o schema
cat drizzle/schema.ts
```

### Erro: "Cannot find module"

```bash
# Reinstale as dependências
docker exec seu-container-name pnpm install

# Ou reconstrua o container
docker-compose down
docker-compose up --build
```

---

## 📝 Checklist de Deployment

- [ ] PostgreSQL 17 criado
- [ ] Usuário `endocrine_user` criado
- [ ] Banco `endocrine_survey` criado
- [ ] Repositório conectado no Coolify
- [ ] Variáveis de ambiente configuradas
- [ ] Dockerfile detectado
- [ ] Deploy iniciado
- [ ] Build concluído com sucesso
- [ ] Container rodando
- [ ] Aplicação acessível em https://pesquisa.permupay.com.br
- [ ] Formulário funcionando
- [ ] Dashboard funcionando
- [ ] Dados sendo salvos no banco
- [ ] Senha do admin alterada
- [ ] SSL/TLS configurado
- [ ] Backups configurados
- [ ] Monitoramento ativo

---

## 🎉 Sucesso!

Se todos os passos foram concluídos com sucesso:

✅ Sistema pronto para produção  
✅ Banco de dados funcionando  
✅ Aplicação acessível  
✅ Formulário coletando dados  
✅ Dashboard analisando dados  
✅ 100% independente  

---

## 📞 Suporte

Se encontrar problemas:

1. Verifique os logs: `docker logs seu-container-name`
2. Teste a conexão ao banco: `psql ...`
3. Verifique as variáveis de ambiente
4. Consulte a documentação: `README.md`, `COOLIFY_STANDALONE.md`

---

**Versão**: 1.0.0  
**Data**: 2026-05-08  
**Status**: Pronto para Deploy Manual
