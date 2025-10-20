# 🚀 Deploy do Sistema de Backup - Passo a Passo

## 📦 O que foi criado?

### APIs
- ✅ `POST /api/admin/backup/create` - Criar backup
- ✅ `GET /api/admin/backup/list` - Listar backups
- ✅ `GET /api/admin/backup/download` - Baixar backup
- ✅ `DELETE /api/admin/backup/delete` - Deletar backup
- ✅ `GET /api/cron/backup` - Cron job automático

### Páginas
- ✅ `/admin/backup` - Interface de gerenciamento

### Utilitários
- ✅ `src/lib/backup-utils.ts` - Gerador de backup via Prisma
- ✅ Fallback automático se pg_dump não estiver disponível

### Configuração
- ✅ `vercel.json` - Cron job às 3h da manhã
- ✅ Dependência instalada: `@aws-sdk/client-s3`

## ⚡ Deploy em 3 Passos

### Passo 1: Configure o R2

1. **Crie o Bucket:**
   ```
   https://dash.cloudflare.com/ → R2 → Create bucket
   Nome: mercado304-backups
   ```

2. **Crie o API Token:**
   ```
   R2 → Manage R2 API Tokens → Create API Token
   Nome: mercado304-backup
   Permissions: Admin Read & Write
   Bucket: mercado304-backups
   
   ⚠️ COPIE E GUARDE:
   - Access Key ID
   - Secret Access Key
   - Account ID
   ```

### Passo 2: Configure a Vercel

1. **Adicione as Variáveis de Ambiente:**
   ```
   Vercel → Seu Projeto → Settings → Environment Variables
   
   R2_ACCOUNT_ID          = [seu-account-id]
   R2_ACCESS_KEY_ID       = [sua-access-key]
   R2_SECRET_ACCESS_KEY   = [sua-secret-key]
   R2_BUCKET_NAME         = mercado304-backups
   CRON_SECRET            = [gere: openssl rand -hex 32]
   
   Environment: ✅ Production ✅ Preview ✅ Development
   ```

### Passo 3: Deploy

```bash
# 1. Commit e push
git add .
git commit -m "feat: sistema de backup automático para R2"
git push

# 2. Aguarde deploy na Vercel (2-3 min)

# 3. Verifique o cron job foi criado:
#    Vercel → Settings → Cron Jobs
#    Deve aparecer: "0 3 * * *"

# 4. Teste o backup manual:
#    https://seu-dominio.com/admin/backup
```

## ✅ Checklist Final

- [ ] Bucket criado no R2
- [ ] API Token gerado
- [ ] Variáveis de ambiente configuradas na Vercel
- [ ] Deploy realizado
- [ ] Cron job aparece em Vercel → Settings → Cron Jobs
- [ ] Backup manual testado em `/admin/backup`
- [ ] Primeiro backup baixado e verificado

## 🎯 Testar Agora

1. **Acesse:** `https://seu-dominio.com/admin/backup`

2. **Clique:** "Criar Backup Manual"

3. **Aguarde:** 30-60 segundos

4. **Resultado:**
   ```
   ✅ Backup criado com sucesso!
   📦 backup-2025-01-20T12-30-45.sql
   💾 2.5 MB
   ```

5. **Baixe e verifique:**
   - Clique em "Baixar"
   - Abra o arquivo .sql
   - Deve ter instruções SQL válidas

## 📊 Monitoramento

### Ver Execuções do Cron

```
Vercel Dashboard → Deployments
Filtre por: "Cron Jobs"
Veja logs de cada execução
```

### Notificações de Falha

O sistema loga erros automaticamente. Para receber emails:

1. Edite `/api/cron/backup/route.ts`
2. Adicione após a linha de erro:
```typescript
// Enviar email de notificação
await fetch(`${baseUrl}/api/debug/test-email`, {
  method: "POST",
  body: JSON.stringify({
    subject: "❌ Backup Automático Falhou",
    message: `Erro: ${error.message}`,
  }),
})
```

## 💰 Custos

**Cloudflare R2:**
- Armazenamento: $0.015/GB/mês
- 10GB grátis por mês
- Sem taxa de egress

**Exemplo Real:**
- 30 backups × 50MB = 1.5GB
- Custo: **$0.02/mês** (2 centavos!)

**Vercel Cron:**
- Incluído no plano (sem custo adicional)
- Limite: 100 execuções/dia (mais que suficiente)

## 🔄 Restaurar Backup

### Download via Interface
```
1. /admin/backup
2. Clique em "Baixar" no backup desejado
3. Arquivo backup-xxx.sql baixado
```

### Restaurar no PostgreSQL
```bash
# Local
psql -h localhost -U postgres -d mercado304 < backup-2025-01-20.sql

# Produção (Neon, Supabase, etc)
psql "postgresql://user:pass@host/database" < backup-2025-01-20.sql
```

## 📝 Manutenção

### Deletar Backups Antigos

Recomendação: **Manter últimos 7-30 backups**

1. Acesse `/admin/backup`
2. Veja a lista ordenada por data
3. Delete os mais antigos manualmente
4. Ou implemente limpeza automática (opcional)

### Alterar Frequência

Edite `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 */12 * * *"  ← A cada 12 horas
  }]
}
```

Commit e push → Vercel atualizará o cron automaticamente.

## 🆘 Suporte

### Logs
- Vercel: Dashboard → Functions → View Logs
- Busque por: `[Backup]` ou `[Cron Backup]`

### Problemas Comuns

**"Timeout after 5 minutes"**
→ Banco muito grande. Use backup nativo do provedor.

**"Access Denied"**
→ Verifique permissões do API Token no R2.

**"Bucket not found"**
→ Verifique se `R2_BUCKET_NAME` está correto.

---

**Pronto para produção!** 🎉

