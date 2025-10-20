# 🔄 Sistema de Backup Automático - Cloudflare R2

## 🎯 Resumo

Sistema completo de backup automático do banco de dados PostgreSQL com:
- ✅ **Backups diários automáticos** (3h da manhã)
- ✅ **Backups manuais sob demanda**
- ✅ **Armazenamento seguro no Cloudflare R2**
- ✅ **Interface web para gerenciamento**
- ✅ **Download e restauração fácil**
- ✅ **Dual mode**: pg_dump ou Prisma (fallback automático)

## 📁 Arquivos Criados

### Backend (APIs)
```
src/app/api/admin/backup/
├── create/route.ts     ← Criar backup (pg_dump + fallback Prisma)
├── list/route.ts       ← Listar backups do R2
├── download/route.ts   ← Download de backup
└── delete/route.ts     ← Deletar backup

src/app/api/cron/
└── backup/route.ts     ← Endpoint para cron job da Vercel

src/lib/
└── backup-utils.ts     ← Gerador de backup via Prisma
```

### Frontend
```
src/app/admin/
└── backup/page.tsx     ← Interface de gerenciamento
```

### Configuração
```
vercel.json             ← Configuração do cron job
```

### Documentação
```
BACKUP_SETUP.md         ← Guia completo de setup
BACKUP_QUICKSTART.md    ← Guia rápido (5 min)
ENV_VARIABLES.md        ← Lista de variáveis de ambiente
DEPLOY_BACKUP.md        ← Guia de deploy
```

## 🔧 Variáveis de Ambiente Necessárias

```env
# Cloudflare R2
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key
R2_SECRET_ACCESS_KEY=your-r2-secret-key
R2_BUCKET_NAME=mercado304-backups

# Cron Security
CRON_SECRET=your-random-secret-32-chars
```

## 🚀 Como Usar

### Interface Web
```
https://seu-dominio.com/admin/backup
```

**Funcionalidades:**
- Criar backup manual
- Ver lista de backups
- Download de backups
- Deletar backups antigos
- Estatísticas (total, último backup, espaço usado)

### Backup Manual
1. Acesse `/admin/backup`
2. Clique em "Criar Backup Manual"
3. Aguarde 30-60 segundos
4. Backup criado e salvo no R2! ✅

### Backup Automático
- Executa **automaticamente às 3h da manhã** (horário do servidor)
- Configurado no `vercel.json`
- Monitorável em: Vercel → Settings → Cron Jobs

## 🎨 Características Técnicas

### Dual Mode Backup

O sistema tenta 2 métodos automaticamente:

1. **pg_dump** (Preferencial)
   - Backup completo e nativo do PostgreSQL
   - Inclui schema, dados, índices, constraints
   - Mais rápido e eficiente

2. **Prisma** (Fallback)
   - Backup via queries do Prisma
   - Funciona em qualquer ambiente
   - Ativado automaticamente se pg_dump falhar

### Segurança

- ✅ Endpoint do cron protegido por `CRON_SECRET`
- ✅ Upload direto para R2 (nunca salva localmente)
- ✅ Arquivos SQL com encoding seguro
- ✅ ON CONFLICT DO NOTHING para segurança na restauração

### Performance

- ⚡ Timeout: 5 minutos (suficiente para ~100MB)
- ⚡ Buffer: 50MB
- ⚡ Compressão opcional (adicione .gz ao nome se desejar)

## 📊 Monitoramento

### Logs da Vercel
```
Dashboard → Deployments → Functions → Cron Logs
Busque por: [Backup] ou [Cron Backup]
```

### Estatísticas na Interface
```
/admin/backup mostra:
- Total de backups
- Último backup (data/hora)
- Espaço total usado
```

## 🔄 Restauração

### Via psql
```bash
# Download do backup via interface web
# Depois execute:

# Local
psql -U postgres -d mercado304 < backup-2025-01-20.sql

# Produção
psql "postgresql://user:pass@host/db" < backup-2025-01-20.sql
```

### Via Prisma Studio
```bash
# Não recomendado para backups completos
# Use psql para melhor resultado
```

## 💡 Customizações Opcionais

### 1. Notificações por Email

Adicione em `/api/cron/backup/route.ts`:
```typescript
if (!backupResponse.ok) {
  // Enviar email de alerta
  await fetch(`${baseUrl}/api/debug/test-email`, {
    method: "POST",
    body: JSON.stringify({
      to: "admin@yourdomain.com",
      subject: "❌ Backup Automático Falhou",
      message: `Erro ao criar backup em ${new Date().toISOString()}`,
    }),
  })
}
```

### 2. Limpeza Automática de Backups Antigos

Adicione em `/api/cron/backup/route.ts`:
```typescript
// Após criar backup, deletar backups com mais de 30 dias
const listResponse = await fetch(`${baseUrl}/api/admin/backup/list`)
const { backups } = await listResponse.json()

const thirtyDaysAgo = new Date()
thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

for (const backup of backups) {
  if (new Date(backup.lastModified) < thirtyDaysAgo) {
    await fetch(`${baseUrl}/api/admin/backup/delete?key=${backup.key}`, {
      method: "DELETE",
    })
  }
}
```

### 3. Backup para Múltiplos Destinos

Envie para R2 + Google Drive + Dropbox:
```typescript
// Após upload para R2, também envie para outros destinos
await uploadToGoogleDrive(backupData)
await uploadToDropbox(backupData)
```

## 📚 Documentação Completa

- **Setup Completo**: `BACKUP_SETUP.md`
- **Guia Rápido**: `BACKUP_QUICKSTART.md`
- **Variáveis de Ambiente**: `ENV_VARIABLES.md`
- **Deploy**: `DEPLOY_BACKUP.md`

---

**Status**: ✅ Pronto para produção  
**Versão**: 1.0  
**Última atualização**: Janeiro 2025

