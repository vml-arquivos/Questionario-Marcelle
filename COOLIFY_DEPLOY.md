# Guia de Deploy com Coolify e PostgreSQL 17

## Informações do Projeto

**Nome**: EndocriCheck - Pesquisa sobre Saúde Endócrina  
**Pesquisador**: Marcelle Victoria Alves de Lima (1º F)  
**Banco de Dados**: PostgreSQL 17  
**Plataforma de Deploy**: Coolify  

## Configuração para Coolify

### 1. Variáveis de Ambiente Necessárias

Adicione as seguintes variáveis de ambiente no painel do Coolify:

```
DATABASE_URL=postgresql://user:password@postgres:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
```

**Nota**: O Coolify fornecerá automaticamente as variáveis de autenticação OAuth:
- `JWT_SECRET`
- `OAUTH_SERVER_URL`
- `VITE_OAUTH_PORTAL_URL`
- `VITE_APP_ID`
- Outras variáveis de sistema

### 2. Configuração do Banco de Dados

O projeto está configurado para usar **PostgreSQL 17**. No Coolify:

1. Crie um serviço PostgreSQL 17
2. Configure o nome do banco como: `endocrine_survey`
3. Defina um usuário e senha seguros
4. A `DATABASE_URL` será automaticamente fornecida pelo Coolify

### 3. Dockerfile

O projeto inclui um `Dockerfile` otimizado com:
- Multi-stage build para reduzir tamanho da imagem
- Node.js 22 como base
- Build de produção com Vite
- Health checks configurados

### 4. Passos para Deploy

#### Via Coolify Dashboard:

1. **Conectar Repositório Git**
   - Selecione o repositório do projeto
   - Branch: `main`

2. **Configurar Serviços**
   - Crie um serviço PostgreSQL 17
   - Crie um serviço Web (Node.js)

3. **Definir Variáveis de Ambiente**
   - Adicione as variáveis listadas acima
   - Configure a `DATABASE_URL` com credenciais do PostgreSQL

4. **Deploy**
   - Clique em "Deploy"
   - Aguarde a construção da imagem Docker
   - Verifique os logs para erros

5. **Migração do Banco de Dados**
   - Após o primeiro deploy, execute as migrações:
   ```bash
   pnpm drizzle-kit migrate
   ```

### 5. Verificação Pós-Deploy

Após o deploy bem-sucedido:

1. Acesse a URL fornecida pelo Coolify
2. Verifique se a landing page carrega corretamente
3. Teste o formulário de pesquisa
4. Verifique se os dados são salvos no banco
5. Acesse o dashboard administrativo (requer autenticação)

### 6. Monitoramento

O Coolify fornece:
- Logs de aplicação em tempo real
- Monitoramento de CPU e memória
- Alertas de erro
- Histórico de deployments

### 7. Troubleshooting

**Erro de Conexão com Banco de Dados**:
- Verifique se a `DATABASE_URL` está correta
- Confirme que o PostgreSQL está rodando
- Verifique credenciais de acesso

**Erro de Build**:
- Verifique os logs do Coolify
- Confirme que todas as dependências estão instaladas
- Verifique se a versão do Node.js é 22+

**Erro de Autenticação**:
- Verifique as variáveis de OAuth
- Confirme que o `VITE_APP_ID` está correto
- Verifique a configuração de callback URL

## Estrutura do Projeto

```
endocrine-survey-system/
├── client/              # Frontend React
├── server/              # Backend Express + tRPC
├── drizzle/             # Schema e migrações PostgreSQL
├── Dockerfile           # Configuração Docker
├── docker-compose.yml   # Compose para desenvolvimento local
├── drizzle.config.ts    # Configuração Drizzle (PostgreSQL)
└── README.md            # Documentação geral
```

## Comandos Úteis

```bash
# Gerar migrações
pnpm drizzle-kit generate

# Executar migrações
pnpm drizzle-kit migrate

# Build para produção
pnpm build

# Iniciar servidor de produção
pnpm start

# Testes
pnpm test
```

## Suporte

Para dúvidas sobre o deploy, consulte:
- Documentação do Coolify: https://coolify.io/docs
- Documentação do PostgreSQL: https://www.postgresql.org/docs/
- Documentação do projeto: `README.md`

---

**Última atualização**: 2026-05-08  
**Versão**: 1.0.0  
**Status**: Pronto para Deploy
