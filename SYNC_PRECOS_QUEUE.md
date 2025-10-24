# Sistema de Background Jobs com BullMQ + Upstash Redis + Railway

## Visão Geral

Este documento descreve a implementação de um sistema genérico de background jobs usando BullMQ, Upstash Redis e Railway para resolver problemas de timeout em funções serverless do Vercel e processar tarefas pesadas de forma assíncrona.

## Arquitetura

### Componentes

1. **Vercel (Frontend + API)**: Aplicação principal que enfileira jobs
2. **Upstash Redis**: Fila de mensagens para jobs
3. **Railway**: Worker de background que processa jobs
4. **PostgreSQL**: Banco de dados principal

### Fluxo

```
[Vercel API] → [Upstash Redis Queue] → [Railway Worker] → [PostgreSQL]
```

## Tipos de Jobs Suportados

### 🔄 Sincronização de Preços (`price-sync`)
- Sincroniza preços com a API do Nota Paraná
- Processa produtos em batches paralelos
- Atualiza preços no banco de dados

### 💾 Backup (`backup`)
- Backup completo ou incremental do banco
- Compressão opcional
- Upload para armazenamento seguro

### 📧 Envio de Email (`email-send`)
- Envio de emails em massa
- Templates personalizados
- Prioridades configuráveis

### 📊 Exportação de Dados (`data-export`)
- Exportação em CSV, XLSX ou JSON
- Filtros personalizados
- Intervalos de data

### 🧹 Limpeza (`cleanup`)
- Limpeza de logs antigos
- Remoção de arquivos temporários
- Limpeza de cache

### 📈 Geração de Relatórios (`report-generation`)
- Relatórios mensais, anuais ou customizados
- Exportação em PDF, XLSX ou CSV
- Gráficos opcionais

## Implementação

### 1. Configuração da Fila (Vercel)

**Arquivo**: `src/lib/queue.ts`

```typescript
import { Queue } from 'bullmq'

const connection = {
  host: process.env.UPSTASH_REDIS_HOST,
  port: parseInt(process.env.UPSTASH_REDIS_PORT),
  password: process.env.UPSTASH_REDIS_PASSWORD,
}

export const queues = {
  'price-sync': new Queue('price-sync', { connection }),
  'backup': new Queue('backup', { connection }),
  'email-send': new Queue('email-send', { connection }),
  // ... outras filas
}

export async function addJob(queueName, jobName, data, options) {
  const queue = queues[queueName]
  return await queue.add(jobName, data, options)
}
```

### 2. APIs de Gatilho (Vercel)

**Sincronização de Preços**: `src/app/api/admin/sync-precos/start/route.ts`
```typescript
import { addPriceSyncJob } from "@/lib/queue"

export async function POST(request: Request) {
  const job = await addPriceSyncJob({})
  return NextResponse.json({
    message: 'Sincronização iniciada.',
    jobId: job.id,
    status: 'enqueued',
  })
}
```

**Backup**: `src/app/api/admin/backup/start/route.ts`
```typescript
import { addBackupJob } from "@/lib/queue"

export async function POST(request: Request) {
  const body = await request.json()
  const job = await addBackupJob(body)
  return NextResponse.json({
    message: 'Backup iniciado.',
    jobId: job.id,
    status: 'enqueued',
  })
}
```

### 3. Worker Genérico (Render)

**Arquivo**: `render/worker.ts`

```typescript
import { Worker } from 'bullmq'
import { HandlerFactory } from './src/handlers/HandlerFactory'

const SUPPORTED_QUEUES = [
  'price-sync', 'backup', 'email-send', 
  'data-export', 'cleanup', 'report-generation'
]

for (const queueName of SUPPORTED_QUEUES) {
  new Worker(queueName, async (job) => {
    const handler = HandlerFactory.createHandler(queueName, prisma)
    return await handler.handle(job)
  }, { connection })
}
```

### 4. Handlers Especializados

**Base Handler**: `render/src/handlers/BaseHandler.ts`
```typescript
export abstract class BaseHandler<T> {
  abstract handle(job: Job<T>): Promise<JobResult>
  
  protected async updateProgress(job, progress) {
    await job.updateProgress(progress.percentage)
  }
}
```

**Price Sync Handler**: `render/src/handlers/PriceSyncHandler.ts`
```typescript
export class PriceSyncHandler extends BaseHandler<PriceSyncJobData> {
  async handle(job: Job<PriceSyncJobData>): Promise<JobResult> {
    // Lógica específica de sincronização de preços
  }
}
```

## Deploy

### 1. Configurar Upstash Redis

1. Acesse [Upstash Console](https://console.upstash.com/)
2. Crie uma nova instância Redis
3. Copie as credenciais (host, port, password)

### 2. Configurar Variáveis de Ambiente

**Vercel:**
```bash
UPSTASH_REDIS_HOST=your-redis-host
UPSTASH_REDIS_PORT=your-redis-port
UPSTASH_REDIS_PASSWORD=your-redis-password
```

**Render:**
```bash
UPSTASH_REDIS_HOST=your-redis-host
UPSTASH_REDIS_PORT=your-redis-port
UPSTASH_REDIS_PASSWORD=your-redis-password
DATABASE_URL=your-database-url
DIRECT_URL=your-direct-database-url
```

### 3. Deploy no Railway

1. Acesse [Railway Dashboard](https://railway.app/)
2. Clique em "New Project" → "Deploy from GitHub repo"
3. Conecte seu repositório Git
4. Configure:
   - **Root Directory**: `render/`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Adicione as variáveis de ambiente
6. Clique em "Deploy"

## Monitoramento

### Status de Jobs

**API**: `GET /api/admin/sync-precos/status/[jobId]`

```json
{
  "jobId": "123",
  "status": "completed",
  "progress": 100,
  "returnValue": {
    "status": "completed",
    "mercadosProcessados": 5,
    "produtosProcessados": 1000,
    "precosRegistrados": 500
  }
}
```

### Logs

- **Vercel**: Logs das APIs no dashboard
- **Railway**: Logs do worker no dashboard
- **Upstash**: Métricas da fila no console
- **Health Check**: `GET /health` - Status do worker

## Exemplos de Uso

### Adicionar Job de Backup
```typescript
import { addBackupJob } from '@/lib/queue'

const job = await addBackupJob({
  backupType: 'full',
  compress: true,
  tables: ['products', 'markets']
})
```

### Adicionar Job de Email
```typescript
import { addEmailSendJob } from '@/lib/queue'

const job = await addEmailSendJob({
  to: ['user@example.com'],
  subject: 'Relatório Mensal',
  template: 'monthly-report',
  data: { month: 'Janeiro' },
  priority: 'high'
})
```

### Adicionar Job de Limpeza
```typescript
import { addCleanupJob } from '@/lib/queue'

const job = await addCleanupJob({
  cleanupType: 'logs',
  maxAge: 30 // dias
})
```

## Vantagens

1. **Sem Timeouts**: Jobs longos rodam no Render sem limitação de tempo
2. **Escalabilidade**: Múltiplos workers podem processar jobs em paralelo
3. **Confiabilidade**: Retry automático e persistência de jobs
4. **Monitoramento**: Acompanhamento de progresso em tempo real
5. **Custo-Efetivo**: Paga apenas pelo tempo de processamento
6. **Extensibilidade**: Fácil adição de novos tipos de jobs
7. **Organização**: Cada tipo de job tem seu próprio handler

## Troubleshooting

### Worker não processa jobs
- Verifique se o worker está rodando no Railway
- Verifique as variáveis de ambiente
- Verifique a conexão com Redis
- Verifique se o tipo de job é suportado
- Teste o health check: `GET /health`

### Jobs falham
- Verifique os logs do worker
- Verifique a conexão com o banco de dados
- Verifique se o handler está implementado corretamente
- Verifique se as dependências estão instaladas

### Timeout na API
- Verifique se o job foi enfileirado corretamente
- Verifique se o worker está processando
- Verifique o status do job via API

### Handler não encontrado
- Verifique se o tipo de job está registrado no `HandlerFactory`
- Verifique se o handler está implementado corretamente
- Verifique se o arquivo do handler está sendo importado