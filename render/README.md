# Mercado304 - Background Worker Genérico

Este é o worker de background genérico para processar múltiplos tipos de jobs do Mercado304.

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

## Configuração

### Variáveis de Ambiente Necessárias

```bash
# Redis (Upstash)
UPSTASH_REDIS_HOST=your-redis-host
UPSTASH_REDIS_PORT=your-redis-port
UPSTASH_REDIS_PASSWORD=your-redis-password

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database
```

### Deploy no Railway

1. **Criar um novo projeto no Railway:**
   - Acesse [railway.app](https://railway.app)
   - Conecte seu repositório GitHub
   - Configure diretório raiz: `render/`

2. **Configurar Build:**
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`

3. **Configurar Variáveis de Ambiente:**
   - Adicione todas as variáveis listadas acima
   - Use as mesmas variáveis do seu projeto principal (Vercel)

4. **Configurar Redis (Upstash):**
   - Crie uma instância Redis no Upstash
   - Use as credenciais nas variáveis de ambiente

5. **Deploy:**
   - Clique em "Deploy"
   - Aguarde o build completar
   - Verifique os logs para confirmar que o worker iniciou

## Desenvolvimento Local

```bash
# Instalar dependências
npm install

# Executar em modo desenvolvimento
npm run dev

# Build para produção
npm run build

# Executar build
npm start
```

## Como Funciona

1. O worker fica "ouvindo" múltiplas filas no Redis
2. Quando um job é adicionado à fila (via API do projeto principal), o worker o processa
3. Cada tipo de job tem seu próprio handler especializado
4. O progresso é atualizado em tempo real no job
5. O resultado é retornado quando o job é concluído

## Estrutura do Projeto

```
render/
├── src/
│   ├── types/
│   │   └── jobs.ts              # Tipos e interfaces dos jobs
│   └── handlers/
│       ├── BaseHandler.ts       # Classe base para handlers
│       ├── HandlerFactory.ts    # Factory para criar handlers
│       ├── PriceSyncHandler.ts  # Handler para sync de preços
│       ├── BackupHandler.ts     # Handler para backup
│       ├── EmailSendHandler.ts  # Handler para envio de email
│       ├── DataExportHandler.ts # Handler para exportação
│       ├── CleanupHandler.ts    # Handler para limpeza
│       └── ReportGenerationHandler.ts # Handler para relatórios
├── prisma/
│   └── schema.prisma           # Schema do banco
├── worker.ts                   # Worker principal
├── package.json
└── tsconfig.json
```

## Monitoramento

- **Health Check**: `GET /health` - Verifica status do worker
- **Logs**: Disponíveis no Railway Dashboard
- **Métricas**: CPU, RAM, Network no Railway
- **APIs**: Use as APIs de status do projeto principal para monitorar jobs
- **Retry**: O BullMQ oferece retry automático em caso de falha
- **Filas**: Cada fila tem seus próprios logs e métricas

## APIs Disponíveis

### Sincronização de Preços
- `POST /api/admin/sync-precos/start` - Iniciar sync
- `GET /api/admin/sync-precos/status/[jobId]` - Status do job

### Backup
- `POST /api/admin/backup/start` - Iniciar backup

### Email
- `POST /api/admin/email/send` - Enfileirar email

### Outros jobs
- Use as funções em `src/lib/queue.ts` para adicionar jobs

## Troubleshooting

### Worker não inicia
- Verifique se todas as variáveis de ambiente estão configuradas
- Verifique se o Redis está acessível
- Verifique se o banco de dados está acessível
- Verifique os logs no Railway Dashboard

### Jobs não são processados
- Verifique se o worker está rodando
- Verifique se a conexão com Redis está funcionando
- Verifique os logs do worker no Railway
- Verifique se o tipo de job é suportado
- Teste o health check: `GET /health`

### Erro de conexão com banco
- Verifique se `DATABASE_URL` está correto
- Verifique se o banco está acessível do Railway
- Execute `npx prisma generate` se necessário

### Handler não encontrado
- Verifique se o tipo de job está registrado no `HandlerFactory`
- Verifique se o handler está implementado corretamente

### Deploy falha
- Verifique se o build local funciona: `npm run build`
- Verifique se todas as dependências estão no `package.json`
- Verifique os logs de build no Railway Dashboard
