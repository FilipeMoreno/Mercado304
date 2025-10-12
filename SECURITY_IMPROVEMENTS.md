# 🔐 Melhorias de Segurança - Autenticação e Sessões

## 📋 Resumo das Implementações

Foram implementadas **7 melhorias críticas** de segurança conforme solicitado:

### ✅ 1. SecurityAudit - Auditoria de Segurança
- **Modelo**: `SecurityAudit` no schema
- **Funcionalidade**: Registra todos os eventos de segurança (login sucesso/falha, alterações, etc)
- **Benefícios**: Rastreamento completo, detecção de ataques, compliance

### ✅ 2. Session Melhorada - Rastreamento Completo
- **Novos campos**: `loginMethod`, `location`, `deviceName`, `isRevoked`, `revokedAt`, `revokedReason`
- **Funcionalidade**: Histórico detalhado de cada sessão
- **Benefícios**: Melhor UX, rastreamento de dispositivos, sessões revogadas

### ✅ 3. Rate Limiting Granular
- **Configuração**: Atualizada em `src/lib/auth.ts`
- **Limite**: 10 requisições por minuto (mais restritivo)
- **Benefícios**: Proteção contra força bruta

### ✅ 4. SecurityNotification - Notificações de Segurança
- **Modelo**: `SecurityNotification` no schema
- **API**: `/api/auth/security-notifications`
- **Funcionalidade**: Notifica usuário sobre eventos importantes
- **Tipos**: Novo dispositivo, senha alterada, 2FA desabilitado, login suspeito, conta bloqueada

### ✅ 5. IpLocation - Cache de Geolocalização
- **Modelo**: `IpLocation` no schema
- **Utilitário**: `src/lib/geolocation.ts`
- **Funcionalidade**: Cache de 30 dias, fallback de 4 APIs diferentes
- **Benefícios**: Performance, economia de requisições, confiabilidade

### ✅ 6. Bloqueio Automático por Tentativas Falhadas
- **Campos no User**: `failedLoginAttempts`, `lockedUntil`, `lastFailedLogin`
- **Configuração**: 5 tentativas = bloqueio de 30 minutos
- **Utilitário**: `src/lib/security-utils.ts`
- **Funcionalidades**:
  - Incrementa tentativas a cada falha
  - Bloqueia conta após 5 tentativas
  - Desbloqueia automaticamente após 30 minutos
  - Notifica usuário sobre bloqueio
  - Reseta contador após login bem-sucedido

### ✅ 7. Detecção de Dispositivos Melhorada
- **Utilitário**: `src/lib/auth-middleware.ts`
- **Funcionalidade**: Parsing detalhado de User-Agent
- **Informações**: Navegador, OS, tipo de dispositivo, versões

---

## 🚀 Como Aplicar as Melhorias

### **Passo 1: Aplicar Migration no Banco de Dados**

Execute o script SQL manualmente no seu banco PostgreSQL:

```bash
# Conectar ao banco
psql -U seu_usuario -d seu_banco

# Ou se estiver usando o arquivo SQL
psql -U seu_usuario -d seu_banco -f prisma/migrations/add_security_features.sql
```

**Ou execute diretamente as queries:**

```sql
-- Adicionar campos de bloqueio automático ao User
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lockedUntil" TIMESTAMP(3);
ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "lastFailedLogin" TIMESTAMP(3);
CREATE INDEX IF NOT EXISTS "user_lockedUntil_idx" ON "user"("lockedUntil");

-- Adicionar campos de rastreamento à Session
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "loginMethod" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "location" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "deviceName" TEXT;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "isRevoked" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedAt" TIMESTAMP(3);
ALTER TABLE "session" ADD COLUMN IF NOT EXISTS "revokedReason" TEXT;
CREATE INDEX IF NOT EXISTS "session_isRevoked_idx" ON "session"("isRevoked");

-- Criar tabela SecurityAudit
CREATE TABLE IF NOT EXISTS "security_audit" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "eventType" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "location" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_audit_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "security_audit_userId_eventType_idx" ON "security_audit"("userId", "eventType");
CREATE INDEX IF NOT EXISTS "security_audit_createdAt_idx" ON "security_audit"("createdAt");
CREATE INDEX IF NOT EXISTS "security_audit_ipAddress_idx" ON "security_audit"("ipAddress");

-- Criar tabela SecurityNotification
CREATE TABLE IF NOT EXISTS "security_notifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "security_notifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE INDEX IF NOT EXISTS "security_notifications_userId_isRead_idx" ON "security_notifications"("userId", "isRead");
CREATE INDEX IF NOT EXISTS "security_notifications_createdAt_idx" ON "security_notifications"("createdAt");

-- Criar tabela IpLocation
CREATE TABLE IF NOT EXISTS "ip_locations" (
    "ip" TEXT NOT NULL PRIMARY KEY,
    "city" TEXT,
    "region" TEXT,
    "country" TEXT,
    "location" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL
);
CREATE INDEX IF NOT EXISTS "ip_locations_expiresAt_idx" ON "ip_locations"("expiresAt");
```

### **Passo 2: Regenerar Prisma Client**

Após aplicar a migration, regenere o Prisma Client:

```bash
npx prisma generate
```

### **Passo 3: Reiniciar Aplicação**

```bash
npm run dev
```

---

## 📊 Novos Endpoints Disponíveis

### **1. Notificações de Segurança**

#### GET `/api/auth/security-notifications`
Retorna notificações de segurança do usuário.

**Resposta:**
```json
{
  "notifications": [
    {
      "id": "...",
      "type": "account_locked",
      "title": "Conta Bloqueada Temporariamente",
      "message": "Sua conta foi bloqueada por 30 minutos...",
      "isRead": false,
      "createdAt": "2025-10-12T19:00:00.000Z"
    }
  ],
  "unreadCount": 3
}
```

#### PATCH `/api/auth/security-notifications`
Marca notificação como lida.

**Body:**
```json
{
  "notificationId": "abc123",
  // OU
  "markAllAsRead": true
}
```

#### DELETE `/api/auth/security-notifications`
Remove notificação.

**Body:**
```json
{
  "notificationId": "abc123",
  // OU
  "deleteAll": true  // Remove todas as lidas
}
```

---

## 🔧 Configurações Ajustáveis

### **Constantes de Segurança** (`src/lib/security-utils.ts`)

```typescript
export const SECURITY_CONSTANTS = {
	MAX_LOGIN_ATTEMPTS: 5,           // Tentativas antes de bloquear
	LOCKOUT_DURATION_MINUTES: 30,    // Duração do bloqueio
	IP_CACHE_DURATION_DAYS: 30,      // Cache de geolocalização
	MAX_SESSIONS_PER_USER: 10,       // Sessões simultâneas permitidas
}
```

### **Rate Limiting** (`src/lib/auth.ts`)

```typescript
rateLimit: {
	window: 60,  // Janela em segundos
	max: 10,     // Máximo de requisições
	enabled: true,
}
```

---

## 🎯 Funcionalidades Implementadas

### **Bloqueio Automático**
- ✅ Conta bloqueada após 5 tentativas falhadas
- ✅ Bloqueio de 30 minutos
- ✅ Desbloqueio automático
- ✅ Notificação ao usuário
- ✅ Log de auditoria

### **Geolocalização com Cache**
- ✅ 4 APIs de fallback (ip-api.com, ipapi.co, ipwhois.app, ip-api.io)
- ✅ Cache de 30 dias no banco
- ✅ Limpeza automática de cache expirado
- ✅ Formato consistente: "Cidade, Estado, País"

### **Auditoria de Segurança**
- ✅ Todos os eventos registrados
- ✅ Tipos: login_success, login_failed, password_reset, 2fa_enabled, account_locked, etc
- ✅ Metadados flexíveis (JSON)
- ✅ Índices otimizados para consultas

### **Notificações Inteligentes**
- ✅ Novo dispositivo detectado
- ✅ Senha alterada
- ✅ 2FA desabilitado
- ✅ Login suspeito (localização incomum)
- ✅ Conta bloqueada/desbloqueada

### **Sessões Melhoradas**
- ✅ Método de login registrado
- ✅ Localização em cache
- ✅ Nome do dispositivo
- ✅ Sessões revogadas (não deletadas)
- ✅ Limite de sessões simultâneas

---

## 📈 Próximos Passos (Opcional)

### **Frontend - Componente de Notificações**
Criar componente React para exibir notificações de segurança:

```tsx
// src/components/security-notifications.tsx
import { useQuery } from "@tanstack/react-query"

export function SecurityNotifications() {
  const { data } = useQuery({
    queryKey: ["security-notifications"],
    queryFn: async () => {
      const res = await fetch("/api/auth/security-notifications")
      return res.json()
    }
  })
  
  return (
    <div>
      {data?.notifications.map(notif => (
        <div key={notif.id}>
          <h4>{notif.title}</h4>
          <p>{notif.message}</p>
        </div>
      ))}
    </div>
  )
}
```

### **Cron Job - Limpeza de Cache**
Adicionar job para limpar cache de IPs expirados:

```typescript
// src/app/api/cron/cleanup-ip-cache/route.ts
import { cleanExpiredIpCache } from "@/lib/geolocation"

export async function GET() {
  await cleanExpiredIpCache()
  return Response.json({ success: true })
}
```

Configure no `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/cleanup-ip-cache",
    "schedule": "0 0 * * *"  // Diariamente à meia-noite
  }]
}
```

---

## 🐛 Troubleshooting

### **Erro: "Property 'securityAudit' does not exist"**
- **Causa**: Prisma Client não foi regenerado
- **Solução**: `npx prisma generate`

### **Erro: "Column does not exist"**
- **Causa**: Migration não foi aplicada
- **Solução**: Execute o SQL do Passo 1

### **Geolocalização retorna "não disponível"**
- **Causa**: IP local (localhost) ou APIs fora do ar
- **Solução**: Testar em produção com IPs reais

### **Rate limit muito restritivo**
- **Causa**: Configuração padrão de 10 req/min
- **Solução**: Ajustar em `src/lib/auth.ts`

---

## 📝 Logs e Monitoramento

Todos os eventos de segurança são registrados no console e no banco:

```typescript
// Ver logs de auditoria
const audits = await prisma.securityAudit.findMany({
  where: { userId: "..." },
  orderBy: { createdAt: "desc" }
})

// Ver tentativas de login falhadas
const failedLogins = await prisma.securityAudit.findMany({
  where: { eventType: "login_failed" },
  orderBy: { createdAt: "desc" }
})

// Ver contas bloqueadas
const lockedAccounts = await prisma.user.findMany({
  where: { lockedUntil: { gt: new Date() } }
})
```

---

## ✅ Checklist de Implementação

- [x] Schema Prisma atualizado
- [x] Utilitários de segurança criados
- [x] Sistema de geolocalização com cache
- [x] Middleware de autenticação
- [x] APIs de sessão atualizadas
- [x] API de notificações criada
- [x] Migration SQL criada
- [ ] **Migration aplicada no banco** ⚠️ **PENDENTE**
- [ ] **Prisma Client regenerado** ⚠️ **PENDENTE**
- [ ] Testes de bloqueio automático
- [ ] Testes de geolocalização
- [ ] Frontend de notificações (opcional)

---

## 🎉 Resultado Final

Após aplicar todas as melhorias, você terá:

✅ **Segurança Reforçada**: Bloqueio automático, auditoria completa, rate limiting  
✅ **Melhor UX**: Notificações, histórico detalhado, geolocalização precisa  
✅ **Compliance**: Logs de auditoria, rastreamento completo  
✅ **Performance**: Cache de geolocalização, índices otimizados  
✅ **Escalabilidade**: Limite de sessões, limpeza automática  

---

**Desenvolvido com ❤️ para Mercado304**
