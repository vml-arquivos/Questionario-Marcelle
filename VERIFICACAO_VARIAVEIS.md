# ⚠️ Verificação de Variáveis de Ambiente

## 🔍 Análise das Suas Variáveis

### ❌ PROBLEMA ENCONTRADO

Sua `DATABASE_URL` está **incompleta e incorreta**:

```
DATABASE_URL=postgres://postgres:HCCNFw3mcYmkKkganiQ1jJM1GBbwF9QG2IpHxHsN5Q9RbjWLFh8l2xbeJXwmF7vw@xypq31rfxfdwv9dahlf4fh5f:5432/postgres
```

**Problemas:**
1. ❌ Usa `postgres` como banco de dados (deve ser `endocrine_survey`)
2. ❌ Usa `postgres` como usuário (deve ser `endocrine_user`)
3. ❌ Não especifica o banco correto

---

## ✅ VERSÃO CORRIGIDA

Substitua por isto:

```
DATABASE_URL=postgresql://endocrine_user:HCCNFw3mcYmkKkganiQ1jJM1GBbwF9QG2IpHxHsN5Q9RbjWLFh8l2xbeJXwmF7vw@xypq31rfxfdwv9dahlf4fh5f:5432/endocrine_survey
```

**Mudanças:**
- ✅ Mudou `postgres://` para `postgresql://` (mais moderno)
- ✅ Mudou usuário de `postgres` para `endocrine_user`
- ✅ Mudou banco de `postgres` para `endocrine_survey`
- ✅ Manteve a senha correta
- ✅ Manteve o host correto

---

## 📋 Todas as Variáveis Corrigidas

Cole exatamente isto no Coolify:

```
DATABASE_URL=postgresql://endocrine_user:HCCNFw3mcYmkKkganiQ1jJM1GBbwF9QG2IpHxHsN5Q9RbjWLFh8l2xbeJXwmF7vw@xypq31rfxfdwv9dahlf4fh5f:5432/endocrine_survey
NODE_ENV=production
VITE_APP_TITLE=EndocriCheck - Pesquisa Endocrinológica
SESSION_SECRET=ack6IEOF2Z35B5Cp7FVkWUwrs9d4Rn4cL6tE+gr7JiY=
VITE_APP_DOMAIN=https://pesquisa.permupay.com.br
PORT=4000
HOST=0.0.0.0
LOG_LEVEL=info
```

---

## 🔧 Passo a Passo para Corrigir no Coolify

1. Vá para: **Aplicação > Variáveis de Ambiente**
2. Encontre a variável `DATABASE_URL`
3. **Delete a atual** (a que está errada)
4. **Crie uma nova** com o valor correto acima
5. Clique em **"Salvar"**
6. Clique em **"Redeploy"**

---

## ✅ Checklist

- [ ] DATABASE_URL corrigida
- [ ] Outras variáveis estão corretas
- [ ] Salvo no Coolify
- [ ] Deploy iniciado
- [ ] Aplicação acessível

---

## 🧪 Como Testar a Conexão

Após o deploy, verifique nos logs:

```
✅ Connected to database
✅ Migrations executed successfully
✅ Server running on http://localhost:4000
```

Se ver estes mensagens, está funcionando!

---

## 📝 Estrutura da DATABASE_URL

```
postgresql://usuario:senha@host:porta/banco_de_dados
            ↑        ↑      ↑    ↑     ↑
            |        |      |    |     └─ endocrine_survey
            |        |      |    └─────── 5432
            |        |      └─────────── xypq31rfxfdwv9dahlf4fh5f
            |        └────────────────── HCCNFw3mcYmkKkganiQ1jJM1GBbwF9QG2IpHxHsN5Q9RbjWLFh8l2xbeJXwmF7vw
            └─────────────────────────── endocrine_user
```

---

## 🚀 Pronto!

Após corrigir, o deploy deve funcionar perfeitamente!

**Sucesso! 🎉**
