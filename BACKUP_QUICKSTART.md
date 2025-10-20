# ⚡ Backup Automático - Guia Rápido

## 🚀 Setup Rápido (5 minutos)

### 1️⃣ Criar Bucket no Cloudflare R2

```
1. Acesse: https://dash.cloudflare.com/
2. Menu lateral → R2
3. Create bucket → Nome: mercado304-backups
4. Create bucket ✅
```

### 2️⃣ Criar API Token

```
1. Manage R2 API Tokens
2. Create API Token
3. Nome: mercado304-backup
4. Permissions: Admin Read & Write
5. Bucket: mercado304-backups
6. Create API Token
7. COPIE e GUARDE:
   - Access Key ID
   - Secret Access Key
   - Account ID (topo da página)
```

### 3️⃣ Configurar na Vercel

```
Vercel Dashboard → Seu Projeto → Settings → Environment Variables

Adicione:
┌──────────────────────────┬─────────────────────────────┐
│ R2_ACCOUNT_ID            │ seu-account-id-aqui         │
│ R2_ACCESS_KEY_ID         │ sua-access-key-aqui         │
│ R2_SECRET_ACCESS_KEY     │ sua-secret-key-aqui         │
│ R2_BUCKET_NAME           │ mercado304-backups          │
│ CRON_SECRET              │ [gere uma chave aleatória]  │
└──────────────────────────┴─────────────────────────────┘

Environments: ✅ Production ✅ Preview ✅ Development
```

**Gerar CRON_SECRET:**
```bash
# Use este comando no terminal:
openssl rand -hex 32

# Ou online:
https://generate-secret.vercel.app/32
```

### 4️⃣ Deploy

```bash
git add .
git commit -m "feat: adicionar sistema de backup automático"
git push
```

### 5️⃣ Verificar

```
1. Aguarde o deploy terminar
2. Acesse: https://seu-dominio.com/admin/backup
3. Clique em "Criar Backup Manual"
4. Aguarde (~30-60 segundos)
5. Backup criado! ✅
```

## 📅 Backup Automático

Após o deploy, a Vercel vai:
- ✅ Detectar o `vercel.json`
- ✅ Criar o cron job automaticamente
- ✅ Executar **todo dia às 3h da manhã**

**Verificar Cron na Vercel:**
```
Dashboard → Settings → Cron Jobs
Você verá: "0 3 * * *" → /api/cron/backup
```

## 🎯 URLs

- **Gerenciar Backups**: `/admin/backup`
- **API Criar**: `/api/admin/backup/create`
- **API Listar**: `/api/admin/backup/list`
- **Cron Job**: `/api/cron/backup` (automático)

## 💡 Dicas

### Alterar Horário do Backup

Edite `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/backup",
    "schedule": "0 2 * * *"  ← Altere aqui (2h da manhã)
  }]
}
```

**Exemplos de Schedule:**
- `0 3 * * *` - Todo dia às 3h
- `0 */6 * * *` - A cada 6 horas
- `0 0 * * 0` - Todo domingo à meia-noite
- `0 0 1 * *` - Todo dia 1 do mês à meia-noite

### Testar Backup Manual

```bash
# Na página /admin/backup, clique em "Criar Backup Manual"
# Ou via API:
curl -X POST https://seu-dominio.com/api/admin/backup/create?manual=true
```

### Ver Logs do Cron

```
Vercel Dashboard → Deployments → [última deployment]
Functions → Cron Logs
```

## ⚠️ Troubleshooting

### "Credenciais do R2 não configuradas"
➜ Verifique se as variáveis de ambiente estão corretas na Vercel

### "pg_dump não disponível"
➜ Normal na Vercel em alguns planos. O sistema tentará usar método alternativo

### "Timeout após 5 minutos"
➜ Banco muito grande. Considere usar backup nativo do provedor

### Backup não aparece na lista
➜ Verifique:
  1. Bucket name está correto?
  2. Credenciais têm permissão de leitura?
  3. Aguarde alguns segundos e atualize

## ✅ Checklist de Setup

- [ ] Criar bucket no R2
- [ ] Criar API token no R2
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Fazer deploy
- [ ] Testar backup manual em `/admin/backup`
- [ ] Verificar cron job em Vercel → Settings → Cron Jobs
- [ ] Aguardar primeiro backup automático (3h da manhã)

## 🎉 Pronto!

Seu sistema de backup automático está configurado! 🚀

**Backups diários** às 3h da manhã  
**Armazenamento seguro** no Cloudflare R2  
**Gerenciamento fácil** pela interface web  

