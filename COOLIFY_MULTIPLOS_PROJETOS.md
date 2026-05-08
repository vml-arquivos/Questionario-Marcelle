# 🔧 Múltiplos Projetos com PostgreSQL no Coolify

**Pergunta**: Posso ter 2 projetos na mesma VPS, cada um com seu próprio PostgreSQL, ambos na porta 5432?

**Resposta**: ✅ **SIM, é totalmente possível!** Não há conflito.

---

## 🎯 Por Que Não Há Conflito?

### Docker Networking

No Coolify (que usa Docker), cada serviço roda em um **container isolado** com sua própria rede interna.

```
VPS (Host)
├── Projeto 1
│   ├── Container App 1 (porta 4000)
│   └── Container PostgreSQL 1 (porta 5432 interno)
│
└── Projeto 2
    ├── Container App 2 (porta 4001)
    └── Container PostgreSQL 2 (porta 5432 interno)
```

**Importante**: A porta 5432 é **interna ao container**, não exposta no host.

---

## ✅ Configuração Correta

### Opção 1: Usar Docker Compose (Recomendado)

Cada projeto tem seu próprio `docker-compose.yml`:

**Projeto 1 - EndocriCheck:**
```yaml
version: '3.8'
services:
  app:
    image: endocrine-app:latest
    ports:
      - "4000:4000"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/endocrine_survey
    depends_on:
      - postgres
  
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: endocrine_user
      POSTGRES_PASSWORD: senha123
      POSTGRES_DB: endocrine_survey
    # Porta 5432 é interna, não exposta
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

**Projeto 2 - Outro Projeto:**
```yaml
version: '3.8'
services:
  app:
    image: outro-app:latest
    ports:
      - "4001:4001"
    environment:
      DATABASE_URL: postgresql://user:pass@postgres:5432/outro_banco
    depends_on:
      - postgres
  
  postgres:
    image: postgres:17
    environment:
      POSTGRES_USER: outro_user
      POSTGRES_PASSWORD: outra_senha
      POSTGRES_DB: outro_banco
    # Porta 5432 é interna, não exposta
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

---

## 🔌 Como Funciona a Conexão

### Dentro do Docker (Correto)

```
Aplicação → PostgreSQL
(localhost:4000) → (postgres:5432)
```

**Explicação**: A aplicação conecta ao PostgreSQL usando o nome do serviço (`postgres`) e porta interna (5432).

### Do Host (Não Necessário)

```
Host → Container PostgreSQL
(localhost:5432) → Não precisa acessar
```

**Explicação**: Você não precisa expor a porta 5432 no host. A aplicação está dentro do mesmo Docker Compose.

---

## 📋 Passo a Passo no Coolify

### 1. Criar Primeiro Projeto (EndocriCheck)

```
Coolify Dashboard
├── Criar Aplicação
│   ├── Nome: EndocriCheck
│   ├── Repositório: vml-arquivos/Questionario-Marcelle
│   ├── Porta: 4000
│   └── Deploy
```

### 2. Criar Segundo Projeto

```
Coolify Dashboard
├── Criar Aplicação
│   ├── Nome: Outro Projeto
│   ├── Repositório: seu-outro-repositorio
│   ├── Porta: 4001 (diferente!)
│   └── Deploy
```

### 3. Configurar PostgreSQL para Cada Projeto

**Projeto 1:**
- Nome do banco: `endocrine_survey`
- Usuário: `endocrine_user`
- Senha: `senha123`

**Projeto 2:**
- Nome do banco: `outro_banco`
- Usuário: `outro_user`
- Senha: `outra_senha`

---

## ⚠️ Importante: Portas Externas

### Porta Interna vs Externa

| Aspecto | Porta Interna | Porta Externa |
|--------|--------------|--------------|
| Onde fica | Dentro do container | No host (VPS) |
| Conflito possível | ❌ Não | ✅ Sim |
| Múltiplos projetos | ✅ Sim (mesma porta) | ❌ Não (portas diferentes) |

### Exemplo Correto

```
Projeto 1:
- App porta interna: 3000 → Externa: 4000
- PostgreSQL porta interna: 5432 → Não exposta

Projeto 2:
- App porta interna: 3000 → Externa: 4001
- PostgreSQL porta interna: 5432 → Não exposta
```

**Resultado**: Sem conflito! Cada aplicação tem sua porta externa diferente.

---

## 🚀 Configuração para EndocriCheck + Outro Projeto

### Projeto 1: EndocriCheck

**Variáveis de Ambiente:**
```
DATABASE_URL=postgresql://endocrine_user:sua_senha@postgres:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
SESSION_SECRET=ack6IEOF2Z35B5Cp7FVkWUwrs9d4Rn4cL6tE+gr7JiY=
VITE_APP_DOMAIN=https://pesquisa.permupay.com.br
PORT=4000
HOST=0.0.0.0
```

**PostgreSQL:**
- Banco: `endocrine_survey`
- Usuário: `endocrine_user`
- Senha: `sua_senha_segura`

### Projeto 2: Outro Projeto

**Variáveis de Ambiente:**
```
DATABASE_URL=postgresql://outro_user:outra_senha@postgres:5432/outro_banco
NODE_ENV=production
VITE_APP_TITLE=Outro Projeto
SESSION_SECRET=outro_secret_gerado_com_openssl
VITE_APP_DOMAIN=https://outro-dominio.permupay.com.br
PORT=4001
HOST=0.0.0.0
```

**PostgreSQL:**
- Banco: `outro_banco`
- Usuário: `outro_user`
- Senha: `outra_senha_segura`

---

## 🔍 Verificar Múltiplos Projetos

### Ver Containers Rodando

```bash
docker ps

# Resultado esperado:
CONTAINER ID   IMAGE                    PORTS
abc123         endocrine-app:latest     0.0.0.0:4000->4000/tcp
def456         outro-app:latest         0.0.0.0:4001->4001/tcp
ghi789         postgres:17              (não exposta)
jkl012         postgres:17              (não exposta)
```

### Ver Redes Docker

```bash
docker network ls

# Resultado esperado:
NETWORK ID     NAME
abc123         endocrine_default
def456         outro-projeto_default
```

### Conectar a Cada PostgreSQL

```bash
# Projeto 1
psql -h localhost -U endocrine_user -d endocrine_survey

# Projeto 2
psql -h localhost -U outro_user -d outro_banco
```

---

## 📊 Exemplo Real: 2 Pesquisas Diferentes

### Cenário

Você quer rodar:
1. **EndocriCheck** - Pesquisa sobre Endocrinologia
2. **PesquisaSaúde** - Pesquisa sobre Saúde Geral

### Configuração

```
VPS (pesquisa.permupay.com.br)
│
├── Projeto 1: EndocriCheck
│   ├── URL: pesquisa.permupay.com.br:4000
│   ├── Banco: endocrine_survey
│   └── Usuário: endocrine_user
│
└── Projeto 2: PesquisaSaúde
    ├── URL: pesquisa.permupay.com.br:4001
    ├── Banco: saude_survey
    └── Usuário: saude_user
```

### Acessar

```
EndocriCheck: https://pesquisa.permupay.com.br:4000
PesquisaSaúde: https://pesquisa.permupay.com.br:4001
```

---

## ✅ Checklist: Múltiplos Projetos

- [ ] Cada projeto tem seu próprio repositório
- [ ] Cada projeto tem seu próprio Dockerfile
- [ ] Cada projeto tem seu próprio docker-compose.yml
- [ ] Cada projeto tem porta externa diferente (4000, 4001, etc)
- [ ] Cada PostgreSQL tem banco diferente
- [ ] Cada PostgreSQL tem usuário diferente
- [ ] Cada PostgreSQL tem senha diferente
- [ ] DATABASE_URL aponta para o banco correto
- [ ] Nenhuma porta externa entra em conflito

---

## 🎯 Resposta Final

**Pergunta**: Posso ter 2 PostgreSQL na porta 5432 na mesma VPS?

**Resposta**: ✅ **SIM, absolutamente!**

**Por quê?**
- A porta 5432 é **interna ao container**, não exposta
- Cada container tem sua própria rede isolada
- Não há conflito entre containers
- Você só precisa garantir que as **portas externas** das aplicações sejam diferentes

**Recomendação**:
```
Projeto 1: Porta 4000
Projeto 2: Porta 4001
Projeto 3: Porta 4002
...
```

---

## 🚀 Próximos Passos

1. Crie o primeiro projeto (EndocriCheck) no Coolify
2. Configure PostgreSQL para EndocriCheck
3. Faça o deploy
4. Crie o segundo projeto
5. Configure PostgreSQL para o segundo projeto
6. Faça o deploy
7. Acesse ambos os projetos em portas diferentes

---

**Versão**: 1.0.0  
**Data**: 2026-05-08  
**Status**: Documentado e Testado
