# Sincronização Assíncrona em Background - Nota Paraná

## 🎯 Sistema Implementado

A sincronização de preços agora roda **completamente em background**, permitindo que o usuário continue usando o aplicativo normalmente!

## ✨ Funcionalidades

### 1️⃣ Execução Assíncrona
- ✅ Roda em background (não trava a página)
- ✅ Usuário pode navegar livremente
- ✅ Continua executando mesmo se fechar a aba
- ✅ Progresso salvo no banco de dados

### 2️⃣ Polling em Tempo Real
- ✅ Atualiza a cada 2 segundos
- ✅ Mostra progresso em tempo real
- ✅ Logs aparecem conforme vão sendo gerados
- ✅ Pode pausar/retomar atualização

### 3️⃣ Estado Persistente
- ✅ Status salvo no banco de dados
- ✅ Pode sair e voltar à página
- ✅ Progresso preservado
- ✅ Histórico de execuções

## 🗄️ Estrutura do Banco

### Model `SyncJob`:

```prisma
model SyncJob {
  id                   String   @id
  status               String   // pending, running, completed, failed
  tipo                 String   // precos, produtos, etc
  progresso            Int      // 0-100
  mercadosProcessados  Int
  produtosProcessados  Int
  precosRegistrados    Int
  erros                Json     // Array de erros
  logs                 Json     // Array de logs
  detalhes             Json?    // Detalhes por mercado
  startedAt            DateTime?
  completedAt          DateTime?
  createdAt            DateTime
  updatedAt            DateTime
}
```

## 🔌 Endpoints da API

### 1. Iniciar Sincronização
```
POST /api/admin/sync-precos/start
```

**Resposta**:
```json
{
  "jobId": "clx123abc...",
  "status": "pending",
  "message": "Sincronização iniciada em background"
}
```

**Comportamento**:
- Cria job no banco
- Inicia processamento em background (não await!)
- Retorna imediatamente
- Usuário pode fazer outras coisas

### 2. Consultar Status
```
GET /api/admin/sync-precos/status/{jobId}
```

**Resposta**:
```json
{
  "id": "clx123abc...",
  "status": "running",
  "progresso": 45,
  "mercadosProcessados": 3,
  "produtosProcessados": 150,
  "precosRegistrados": 28,
  "logs": [
    "[2025-01-17T10:00:00] Job criado",
    "[2025-01-17T10:00:01] Sincronização iniciada",
    "[2025-01-17T10:00:05] 3 mercados encontrados",
    "[2025-01-17T10:00:06] 150 produtos encontrados",
    "[2025-01-17T10:00:10] ✓ Coca Cola processado",
    "[2025-01-17T10:00:12] Preço registrado: Coca Cola em Muffato - R$ 13.79"
  ],
  "detalhes": [
    { "mercado": "Muffato", "produtos": 15, "precos": 15 }
  ]
}
```

### 3. Último Job
```
GET /api/admin/sync-precos/latest
```

**Resposta**:
```json
{
  "job": { /* mesmo formato do status */ }
}
```

## 🎨 Interface da Página

### Layout em 2 Colunas:

```
┌─────────────┬──────────────────────────────────┐
│  CONTROLE   │        STATUS E RESULTADOS       │
│             │                                   │
│ [Iniciar]   │ Progresso: 45%                   │
│             │ ████████████░░░░░░░░              │
│ [Pausar]    │                                   │
│ [Refresh]   │ Estatísticas:                    │
│             │ 📊 3 Mercados                    │
│ Background  │ 📦 150 Produtos                  │
│ ativado ✓   │ 💰 28 Preços                     │
│             │                                   │
│ Como        │ Detalhes:                        │
│ Funciona    │ • Muffato: 15 preços             │
│             │                                   │
│             │ Logs:                            │
│             │ [10:00:10] ✓ Coca Cola OK        │
│             │ [10:00:12] Preço registrado      │
│             │ [10:00:15] ✓ Arroz OK            │
└─────────────┴──────────────────────────────────┘
```

### Estados Visuais:

#### Aguardando (pending)
```
Badge: 🟡 Aguardando
Progresso: 0%
```

#### Em Execução (running)
```
Badge: 🔵 Em execução (spinner)
Progresso: 0-99%
Logs: Atualizando em tempo real
```

#### Concluído (completed)
```
Badge: 🟢 Concluído (checkmark)
Progresso: 100%
Logs: Completos
Detalhes: Visíveis
```

#### Falhou (failed)
```
Badge: 🔴 Falhou (X)
Progresso: 100%
Erros: Lista de erros
```

## ⚡ Fluxo de Execução

### 1. Usuário Clica em "Iniciar"

```
1. POST /api/admin/sync-precos/start
   ↓
2. Job criado no banco (status: pending)
   ↓
3. Função processarSyncJob() inicia (não await!)
   ↓
4. API retorna imediatamente {jobId}
   ↓
5. Frontend começa polling a cada 2s
```

### 2. Processamento em Background

```
1. Status → running
   ↓
2. Busca mercados
   Log: "3 mercados encontrados"
   ↓
3. Busca produtos
   Log: "150 produtos encontrados"
   Progresso: 5%
   ↓
4. Para cada produto:
   - Busca na API Nota Paraná
   - Identifica mercados
   - Registra preços
   - Adiciona log
   - Atualiza progresso
   Progresso: 5% → 95%
   ↓
5. Finaliza
   Status → completed
   Progresso: 100%
   Log: "Sincronização concluída"
```

### 3. Frontend Atualiza Automaticamente

```
Polling a cada 2 segundos:
GET /api/admin/sync-precos/status/{jobId}
↓
Atualiza UI:
- Progresso
- Logs
- Estatísticas
- Detalhes
```

## 🔄 Cenários de Uso

### Cenário 1: Sincronização Normal
```
1. Usuário: Clica em "Iniciar"
2. Sistema: Job inicia em background
3. Usuário: Vê progresso 0% → 10% → 20%...
4. Usuário: Continua usando o app normalmente
5. Sistema: Continua sincronizando
6. Usuário: Volta à página depois
7. Sistema: Mostra progresso atual (ex: 75%)
8. Sistema: Completa (100%)
```

### Cenário 2: Fechar e Voltar
```
1. Sincronização em 30%
2. Usuário fecha aba
3. Background continua rodando no servidor
4. Usuário volta 5 minutos depois
5. Página carrega último job
6. Mostra: Concluído 100% ✓
```

### Cenário 3: Múltiplas Tentativas
```
1. Usuário clica "Iniciar"
2. Job já rodando
3. Sistema: "Já existe sincronização em andamento"
4. Mostra o job atual
5. Usuário pode acompanhar
```

### Cenário 4: Pausar Atualização
```
1. Sincronização rodando
2. Logs atualizando muito rápido
3. Usuário: Clica "Pausar Atualização"
4. Polling para
5. Sincronização CONTINUA no backend
6. Usuário: Analisa logs tranquilamente
7. Usuário: Clica "Retomar Atualização"
8. Volta a atualizar em tempo real
```

## 📊 Logs em Tempo Real

### Formato dos Logs:
```
[2025-01-17T10:00:00.123Z] Job criado, aguardando início
[2025-01-17T10:00:01.456Z] Sincronização iniciada
[2025-01-17T10:00:05.789Z] 3 mercados com razão social encontrados
[2025-01-17T10:00:06.012Z] 150 produtos com código de barras encontrados
[2025-01-17T10:00:10.345Z] ✓ Coca Cola 2L processado
[2025-01-17T10:00:12.678Z] Preço registrado: Coca Cola 2L em Muffato - R$ 13.79
[2025-01-17T10:00:15.901Z] ✓ Arroz Tio João processado
...
[2025-01-17T10:15:30.234Z] Sincronização concluída: 42 preços registrados
```

### Cores dos Logs:
- 🟢 Verde: Logs com "✓" (sucesso)
- 🔴 Vermelho: Logs com "Erro" ou "erro"
- ⚪ Cinza: Logs normais

## 🎯 Controles da Interface

### Botão "Iniciar Sincronização"
- Desabilitado se já tem job rodando
- Inicia novo job em background
- Muda para "Sincronizando..." quando ativo

### Botão "Pausar/Retomar Atualização"
- Pausa polling (sincronização continua!)
- Útil para analisar logs
- Retoma atualização em tempo real

### Botão "Refresh" (ícone)
- Atualiza status manualmente
- Spinner durante atualização
- Útil quando auto-refresh pausado

### Auto-Refresh
- Ativo por padrão quando job rodando
- Atualiza a cada 2 segundos
- Pode ser pausado/retomado

## 📈 Progresso

### Cálculo:
```
 0-5%:   Setup (buscar mercados e produtos)
 5-95%:  Processamento (cada produto = incremento)
95-100%: Finalização
```

### Fórmula:
```typescript
progresso = 5 + ((produtosProcessados / totalProdutos) * 90)
```

### Exemplo com 100 Produtos:
```
Produto 0:   5%
Produto 10:  14%
Produto 25:  27.5%
Produto 50:  50%
Produto 75:  72.5%
Produto 100: 95%
Finalizado:  100%
```

## 🔐 Proteção Contra Concorrência

```
Job 1: running → Usuário tenta iniciar Job 2
Sistema: "Já existe sincronização em andamento"
Mostra: Job 1 atual
```

## 💾 Persistência

### Dados Salvos no Banco:
- Status atual
- Progresso percentual
- Logs completos
- Erros (se houver)
- Estatísticas (mercados, produtos, preços)
- Detalhes por mercado
- Timestamps (início, fim)

### Vantagens:
- ✅ Sobrevive a crashes
- ✅ Histórico completo
- ✅ Auditoria
- ✅ Debug facilitado

## 🎓 Boas Práticas

### 1. Monitore a Primeira Execução
```
1. Inicie sincronização
2. Fique na página
3. Acompanhe logs
4. Verifique erros
5. Ajuste configurações se necessário
```

### 2. Execuções Posteriores
```
1. Inicie sincronização
2. Pode sair da página
3. Volte depois para ver resultado
```

### 3. Se Algo Der Errado
```
1. Pause auto-refresh
2. Analise logs
3. Veja erros
4. Corrija configuração
5. Tente novamente
```

## 🔧 Tecnologias Usadas

- **Banco de Dados**: Prisma (SyncJob model)
- **Background**: Função assíncrona sem await
- **Polling**: setInterval a cada 2s
- **Estado**: React useState + useEffect
- **Logs**: Array de strings com timestamp

## 📊 Comparação

### Antes (Síncrona):
```
❌ Usuário travado na página
❌ Se fechar, perde progresso
❌ Nenhum log em tempo real
❌ Sem histórico
✅ Simples
```

### Agora (Assíncrona):
```
✅ Usuário livre para navegar
✅ Progresso salvo no banco
✅ Logs em tempo real
✅ Histórico completo
✅ Pode pausar atualização
✅ Proteção contra concorrência
```

## 🚀 Uso

### Iniciar Sincronização:
```typescript
POST /api/admin/sync-precos/start

// Retorna imediatamente:
{
  "jobId": "clx123...",
  "status": "pending"
}

// Background processa...
```

### Acompanhar:
```typescript
// Página faz polling automático
GET /api/admin/sync-precos/status/{jobId}

// A cada 2 segundos atualiza:
{
  "progresso": 45,
  "logs": [...],
  ...
}
```

### Voltar Depois:
```typescript
// Ao abrir página
GET /api/admin/sync-precos/latest

// Carrega último job (completo ou em andamento)
{
  "job": { "status": "completed", "progresso": 100, ... }
}
```

## 🎯 Arquivos Criados

```
prisma/
└── migrations/
    └── 20250117000004_add_sync_jobs/
        └── migration.sql

src/app/api/admin/sync-precos/
├── start/
│   └── route.ts          ← Inicia job em background
├── status/[jobId]/
│   └── route.ts          ← Consulta status do job
└── latest/
    └── route.ts          ← Busca último job

src/app/admin/sync-precos/
└── page.tsx              ← Interface com polling
```

## ⏱️ Performance

### Tempo Estimado:
```
100 produtos × 200ms = 20 segundos
200 produtos × 200ms = 40 segundos
500 produtos × 200ms = 100 segundos (~1.5 min)
1000 produtos × 200ms = 200 segundos (~3.5 min)
```

### Delay entre Produtos:
```typescript
await new Promise(resolve => setTimeout(resolve, 200))
// 200ms para não sobrecarregar API
```

## 🎉 Benefícios

1. **UX Melhor**: Usuário não fica preso
2. **Confiável**: Estado salvo no banco
3. **Transparente**: Logs em tempo real
4. **Debugável**: Histórico completo
5. **Escalável**: Suporta muitos produtos
6. **Seguro**: Proteção contra jobs duplicados

## 📝 Próximas Melhorias

- [ ] Sistema de filas (Bull, BullMQ)
- [ ] Webhooks para notificar conclusão
- [ ] Agendamento (cron jobs)
- [ ] Cancelamento de jobs
- [ ] Retry automático em falhas
- [ ] Notificações push quando concluir
- [ ] Dashboard de histórico de jobs
- [ ] Exportação de logs

---

**Versão**: 2.0 - Assíncrona  
**Data**: Janeiro 2025  
**Status**: ✅ Produção

