# 🔄 Sistema de Backup Automático - Cloudflare R2

## 📋 Visão Geral

Sistema completo de backup automático do banco de dados PostgreSQL para o Cloudflare R2 com interface web e cron job na Vercel.

## ✨ Funcionalidades

- ✅ **Backup Automático Diário** - Executado às 3h da manhã
- ✅ **Backup Manual** - Crie backups sob demanda
- ✅ **Lista de Backups** - Visualize todos os backups disponíveis
- ✅ **Download de Backups** - Baixe backups para restauração local
- ✅ **Deletar Backups** - Gerencie e remova backups antigos
- ✅ **Armazenamento no R2** - Storage econômico e rápido da Cloudflare

## 🔧 Configuração

### 1. Criar Bucket no Cloudflare R2

1. Acesse o [Dashboard da Cloudflare](https://dash.cloudflare.com/)
2. Vá para **R2** no menu lateral
3. Clique em **Create bucket**
4. Nome do bucket: `mercado304-backups` (ou outro de sua preferência)
5. Clique em **Create bucket**

### 2. Criar API Token do R2

1. No dashboard do R2, clique em **Manage R2 API Tokens**
2. Clique em **Create API Token**
3. Configurações:
   - **Token name**: `mercado304-backup-token`
   - **Permissions**: `Admin Read & Write`
   - **Specify bucket(s)**: Selecione o bucket criado
4. Clique em **Create API Token**
5. **IMPORTANTE**: Copie e guarde:
   - Access Key ID
   - Secret Access Key
   - Account ID (no topo da página)

### 3. Configurar Variáveis de Ambiente

Adicione no seu arquivo `.env` ou nas variáveis de ambiente da Vercel:

```env
# Cloudflare R2 Credentials
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=mercado304-backups

# Cron Secret (gere uma chave aleatória forte)
CRON_SECRET=your-random-secret-key-here
```

**Gerar CRON_SECRET:**
```bash
# Linux/Mac
openssl rand -hex 32

# Windows PowerShell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

### 4. Instalar Dependências

```bash
npm install @aws-sdk/client-s3
```

### 5. Configurar Cron na Vercel

O arquivo `vercel.json` já está configurado:

```json
{
  "crons": [
    {
      "path": "/api/cron/backup",
      "schedule": "0 3 * * *"
    }
  ]
}
```

**Formato do Schedule (Cron Expression):**
- `0 3 * * *` = Todo dia às 3h da manhã
- `0 */6 * * *` = A cada 6 horas
- `0 0 * * 0` = Todo domingo à meia-noite

### 6. Deploy na Vercel

Após fazer deploy, a Vercel vai:
1. Detectar o `vercel.json`
2. Criar o cron job automaticamente
3. Executar backups diariamente

## 🖥️ Como Usar

### Página de Administração

Acesse: `https://seu-dominio.com/admin/backup`

**Funcionalidades:**
- 📊 **Estatísticas**: Total de backups, último backup, espaço usado
- ➕ **Criar Backup**: Botão para backup manual
- 📋 **Lista de Backups**: Todos os backups com data, tamanho
- ⬇️ **Download**: Baixe qualquer backup
- 🗑️ **Deletar**: Remova backups antigos

### Criar Backup Manual

1. Acesse `/admin/backup`
2. Clique em **"Criar Backup Manual"**
3. Aguarde (pode demorar alguns minutos dependendo do tamanho do banco)
4. Backup criado e enviado para R2! ✅

### Download de Backup

1. Na lista de backups, clique em **"Baixar"**
2. Arquivo `.sql` será baixado
3. Use para restauração local ou em outro servidor

### Deletar Backup

1. Clique em **"Deletar"** no backup desejado
2. Confirme a ação
3. Backup removido do R2 ✅

## 🔄 Restaurar Backup

### Local (Desenvolvimento)

```bash
# Baixe o backup pela interface web
# Depois execute:
psql -h localhost -U seu_usuario -d seu_database < backup-2025-01-20.sql
```

### Produção (Neon/Supabase/etc)

```bash
# Com o arquivo backup baixado:
psql "postgresql://user:pass@host/database" < backup-2025-01-20.sql
```

## 📡 APIs Disponíveis

### POST `/api/admin/backup/create`
Cria um novo backup e envia para o R2.

**Query Params:**
- `manual=true` - Marca como backup manual

**Response:**
```json
{
  "success": true,
  "backup": {
    "fileName": "backup-2025-01-20T03-00-00.sql",
    "size": 5242880,
    "sizeFormatted": "5.00 MB",
    "timestamp": "2025-01-20T03:00:00.000Z",
    "location": "r2://mercado304-backups/backups/backup-2025-01-20.sql",
    "type": "manual"
  }
}
```

### GET `/api/admin/backup/list`
Lista todos os backups no R2.

**Response:**
```json
{
  "success": true,
  "backups": [...],
  "total": 10
}
```

### GET `/api/admin/backup/download?key=backups/backup-xxx.sql`
Baixa um backup específico.

### DELETE `/api/admin/backup/delete?key=backups/backup-xxx.sql`
Deleta um backup específico.

### GET `/api/cron/backup`
Endpoint para cron job automático da Vercel.

**Autenticação:**
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

## 🔐 Segurança

### Proteção do Cron Endpoint

O endpoint `/api/cron/backup` é protegido por um secret:

```typescript
const authHeader = request.headers.get("authorization")
const cronSecret = process.env.CRON_SECRET

if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}
```

A Vercel automaticamente envia o header correto ao executar o cron.

## ⚠️ Limitações e Considerações

### Vercel Functions

- **Timeout máximo**: 300 segundos (5 minutos) no plano Pro
- **Tamanho máximo do backup**: ~50MB (limite de buffer)
- Para bancos muito grandes, considere usar um serviço dedicado

### Alternativa para Bancos Grandes

Se o banco for muito grande para o ambiente da Vercel, você pode:
1. Usar GitHub Actions para fazer backup
2. Usar um servidor dedicado com cronjob
3. Usar o sistema de backup nativo do seu provedor (Neon, Supabase, etc.)

## 📊 Monitoramento

### Logs na Vercel

Você pode monitorar os backups automáticos em:
1. Dashboard da Vercel
2. **Monitoring** → **Cron Jobs**
3. Ver execuções e logs

### Notificações

Para adicionar notificações por email quando um backup falha, você pode:
1. Modificar `/api/cron/backup/route.ts`
2. Adicionar chamada para API de email em caso de erro

## 🚀 Deploy

### Primeira Vez

1. Configure as variáveis de ambiente na Vercel:
   ```
   R2_ACCOUNT_ID=xxx
   R2_ACCESS_KEY_ID=xxx
   R2_SECRET_ACCESS_KEY=xxx
   R2_BUCKET_NAME=mercado304-backups
   CRON_SECRET=xxx
   ```

2. Faça deploy:
   ```bash
   git add .
   git commit -m "feat: adicionar sistema de backup automático"
   git push
   ```

3. A Vercel detectará o `vercel.json` e configurará o cron automaticamente

### Verificar se está funcionando

1. Acesse a Vercel Dashboard
2. Vá em **Settings** → **Cron Jobs**
3. Você verá o job configurado: `0 3 * * *`
4. Aguarde a primeira execução ou teste manualmente pela interface

## 💰 Custos

### Cloudflare R2

- **Armazenamento**: $0.015/GB/mês (muito barato!)
- **10GB grátis** por mês
- Sem taxa de egress (saída de dados)

### Exemplo de Custo

- Backup de 50MB por dia × 30 dias = 1.5GB/mês
- Custo: **~$0.02/mês** (2 centavos!)

## 🛠️ Comandos Úteis

### Testar Backup Manual

```bash
curl -X POST https://seu-dominio.com/api/admin/backup/create?manual=true
```

### Testar Cron (Localmente)

```bash
# Configure CRON_SECRET no .env
curl -H "Authorization: Bearer seu-cron-secret" \
     http://localhost:3000/api/cron/backup
```

### Listar Backups

```bash
curl https://seu-dominio.com/api/admin/backup/list
```

## 📝 Checklist de Implementação

- [x] Criar rotas de API para backup
- [x] Criar página de gerenciamento
- [x] Configurar cron job
- [x] Adicionar variáveis de ambiente
- [ ] Criar bucket no R2
- [ ] Configurar variáveis de ambiente na Vercel
- [ ] Fazer deploy
- [ ] Testar backup manual
- [ ] Aguardar backup automático (3h da manhã)

## 🎯 Próximos Passos

1. **Configure o R2**: Crie o bucket e obtenha as credenciais
2. **Configure a Vercel**: Adicione as variáveis de ambiente
3. **Faça Deploy**: Push para o repositório
4. **Teste**: Crie um backup manual em `/admin/backup`
5. **Monitore**: Verifique os cron jobs na Vercel

---

**Última atualização**: Janeiro 2025  
**Versão**: 1.0 - Sistema de Backup Automático

