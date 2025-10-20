# 🔐 Variáveis de Ambiente - Mercado304

## 📋 Lista Completa de Variáveis

### Database
```env
PRISMA_DATABASE_URL=postgresql://user:password@host:port/database
```

### NextAuth
```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here
```

### Google OAuth
```env
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### Email (Resend)
```env
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=noreply@yourdomain.com
```

### Google Gemini AI
```env
GEMINI_API_KEY=your-gemini-api-key
```

### Cloudflare R2 (Backups) - NOVO!
```env
R2_ACCOUNT_ID=your-cloudflare-account-id
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_BUCKET_NAME=mercado304-backups
```

### Cron Secret (Backups) - NOVO!
```env
CRON_SECRET=your-random-secret-key-here
```

## 🔧 Como Configurar na Vercel

1. Acesse seu projeto na Vercel
2. Vá em **Settings** → **Environment Variables**
3. Adicione cada variável:
   - **Name**: Nome da variável (ex: R2_ACCOUNT_ID)
   - **Value**: Valor da variável
   - **Environment**: Production, Preview, Development (selecione todos)
4. Clique em **Save**
5. Faça um novo deploy para aplicar as mudanças

## 📖 Onde Obter as Credenciais

### R2 (Cloudflare)

1. **Account ID**:
   - Dashboard da Cloudflare → R2
   - Account ID aparece no topo da página

2. **Access Keys**:
   - R2 Dashboard → **Manage R2 API Tokens**
   - **Create API Token**
   - Copie Access Key ID e Secret Access Key

3. **Bucket Name**:
   - Nome que você escolheu ao criar o bucket
   - Exemplo: `mercado304-backups`

### CRON_SECRET

Gere uma chave aleatória forte:

**Linux/Mac:**
```bash
openssl rand -hex 32
```

**Windows PowerShell:**
```powershell
-join ((48..57) + (65..90) + (97..122) | Get-Random -Count 32 | % {[char]$_})
```

## ⚠️ Segurança

- ❌ **NUNCA** commite o arquivo `.env` no Git
- ✅ O `.env` já está no `.gitignore`
- ✅ Use o `.env.local` para desenvolvimento local
- ✅ Configure variáveis de ambiente na Vercel para produção

## 🧪 Testar Localmente

1. Crie arquivo `.env.local` na raiz do projeto
2. Copie todas as variáveis de ambiente
3. Preencha com seus valores
4. Execute `npm run dev`
5. Teste em `http://localhost:3000/admin/backup`

