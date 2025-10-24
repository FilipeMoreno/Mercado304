# Deploy no Railway - Guia Completo

## 🚀 Deploy do Worker no Railway

### 1. Preparação

#### 1.1 Criar conta no Railway
1. Acesse [railway.app](https://railway.app)
2. Faça login com GitHub
3. Conecte seu repositório

#### 1.2 Configurar Redis (Upstash)
1. Acesse [Upstash Console](https://console.upstash.com/)
2. Crie uma nova instância Redis
3. Anote as credenciais:
   - `UPSTASH_REDIS_HOST`
   - `UPSTASH_REDIS_PORT`
   - `UPSTASH_REDIS_PASSWORD`

### 2. Deploy no Railway

#### 2.1 Criar novo projeto
1. No Railway Dashboard, clique em "New Project"
2. Selecione "Deploy from GitHub repo"
3. Escolha seu repositório
4. Configure:
   - **Root Directory**: `render/`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

#### 2.2 Configurar variáveis de ambiente
No Railway Dashboard, vá em "Variables" e adicione:

```bash
# Redis (Upstash)
UPSTASH_REDIS_HOST=your-redis-host
UPSTASH_REDIS_PORT=your-redis-port
UPSTASH_REDIS_PASSWORD=your-redis-password

# Database (PostgreSQL)
DATABASE_URL=postgresql://user:password@host:port/database
DIRECT_URL=postgresql://user:password@host:port/database

# Nota Paraná (opcional)
NOTA_PARANA_BASE_URL=https://menorpreco.notaparana.pr.gov.br/api/v1
LOCAL_PADRAO=Curitiba
PERIODO_PADRAO=30
RAIO_PADRAO=5000
```

#### 2.3 Deploy
1. Clique em "Deploy"
2. Aguarde o build completar
3. Verifique os logs para confirmar que o worker iniciou

### 3. Verificação

#### 3.1 Health Check
Acesse: `https://seu-projeto.railway.app/health`

Resposta esperada:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:00:00.000Z",
  "services": {
    "database": "connected",
    "redis": "connected",
    "environment": {
      "nodeVersion": "v18.17.0",
      "platform": "linux",
      "uptime": 120
    }
  }
}
```

#### 3.2 Teste Local (Opcional)
Antes do deploy, teste localmente:
```bash
cd render
npm install
cp env.example .env
# Edite o .env com suas credenciais
npm run test-connection
```

#### 3.3 Logs
No Railway Dashboard, vá em "Deployments" → "View Logs"

Logs esperados:
```
🚀 Servidor HTTP rodando na porta 3000
📊 Health check disponível em: http://localhost:3000/health
🚀 Worker genérico iniciando...
📡 Conectando ao Redis: your-redis-host
👂 Workers iniciados para 6 filas:
   - price-sync
   - backup
   - email-send
   - data-export
   - cleanup
   - report-generation
🎯 Workers prontos para processar jobs!
```

### 4. Configuração do Projeto Principal (Vercel)

#### 4.1 Variáveis de ambiente
No Vercel Dashboard, adicione as mesmas variáveis do Redis:

```bash
UPSTASH_REDIS_HOST=your-redis-host
UPSTASH_REDIS_PORT=your-redis-port
UPSTASH_REDIS_PASSWORD=your-redis-password
```

#### 4.2 Teste
1. Faça deploy do projeto principal
2. Teste a API de sync: `POST /api/admin/sync-precos/start`
3. Verifique o status: `GET /api/admin/sync-precos/status/[jobId]`

### 5. Monitoramento

#### 5.1 Railway Dashboard
- **Metrics**: CPU, RAM, Network
- **Logs**: Logs em tempo real
- **Deployments**: Histórico de deploys

#### 5.2 Health Check
- Endpoint: `/health`
- Verifica conexão com banco e Redis
- Retorna status detalhado

#### 5.3 Logs do Worker
- Jobs processados
- Erros e retries
- Progresso em tempo real

### 6. Troubleshooting

#### 6.1 ❌ Erro: "ECONNREFUSED 127.0.0.1:6379"
**Problema**: Worker tentando conectar no Redis local.

**Solução**:
1. Verifique se as variáveis estão configuradas no Railway
2. Teste localmente: `npm run test-connection`
3. Verifique se o formato das variáveis está correto:
   ```
   UPSTASH_REDIS_HOST=your-host.upstash.io
   UPSTASH_REDIS_PORT=6379
   UPSTASH_REDIS_PASSWORD=your-password
   ```

#### 6.2 Worker não inicia
```bash
# Verificar logs
railway logs

# Verificar variáveis
railway variables
```

#### 6.3 Jobs não processam
1. Verificar conexão com Redis
2. Verificar logs do worker
3. Testar health check: `GET /health`
4. Verificar se o tipo de job é suportado

#### 6.4 Erro de build
```bash
# Build local para testar
cd render
npm install
npm run build
```

#### 6.5 Health Check falha
- Acesse `https://seu-projeto.railway.app/health`
- Verifique o status detalhado
- Compare com os logs do Railway

### 7. Comandos Railway CLI (Opcional)

#### 7.1 Instalar CLI
```bash
npm install -g @railway/cli
```

#### 7.2 Login
```bash
railway login
```

#### 7.3 Deploy via CLI
```bash
cd render
railway up
```

#### 7.4 Logs via CLI
```bash
railway logs
```

### 8. Custos

#### 8.1 Railway
- **Hobby Plan**: $5/mês
- **Pro Plan**: $20/mês
- **Enterprise**: Customizado

#### 8.2 Upstash Redis
- **Free Tier**: 10.000 requests/dia
- **Pay-as-you-go**: $0.2/100k requests

### 9. Vantagens do Railway

✅ **Simplicidade**: Deploy com um clique
✅ **Integração GitHub**: Deploy automático
✅ **CLI**: Gerenciamento via terminal
✅ **Logs**: Logs em tempo real
✅ **Métricas**: Monitoramento integrado
✅ **Escalabilidade**: Auto-scaling
✅ **SSL**: HTTPS automático
✅ **Domínio**: Domínio personalizado

### 10. Próximos Passos

1. **Deploy**: Siga os passos acima
2. **Teste**: Verifique health check
3. **Monitor**: Acompanhe logs e métricas
4. **Escale**: Ajuste recursos conforme necessário

## 🎉 Conclusão

O Railway oferece uma experiência de deploy muito mais simples que o Render, com:
- Deploy automático via GitHub
- Interface intuitiva
- Logs em tempo real
- Métricas detalhadas
- CLI poderosa

Seu worker estará rodando em poucos minutos! 🚀
