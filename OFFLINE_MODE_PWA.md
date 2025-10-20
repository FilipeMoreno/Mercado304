# Sistema de Modo Offline - PWA Mercado304

## 📱 Visão Geral

O Mercado304 agora possui um sistema completo de modo offline que permite aos usuários acessar seus dados mesmo sem conexão com a internet. O sistema utiliza Service Workers, IndexedDB e estratégias de cache inteligentes para proporcionar uma experiência fluida.

## 🎯 Funcionalidades

### ✅ Cache Automático de Dados

O sistema armazena automaticamente os seguintes dados em cache:

- **Produtos**: Lista completa de produtos (cache de 7 dias)
- **Estoque**: Itens em estoque (cache de 2 dias)
- **Listas de Compras**: Todas as listas de compras (cache de 2 dias)
- **Compras**: Histórico de compras (cache de 7 dias)
- **Marcas**: Lista de marcas (cache de 7 dias)
- **Categorias**: Lista de categorias (cache de 7 dias)
- **Mercados**: Lista de mercados (cache de 7 dias)
- **Dashboard Stats**: Estatísticas do dashboard (cache de 1 dia)

### 🔄 Estratégias de Cache

O sistema utiliza diferentes estratégias de cache do Workbox:

#### 1. **StaleWhileRevalidate** (Dados de Produtos)
- Endpoints: `/api/products`, `/api/brands`, `/api/categories`, `/api/markets`
- Cache: 7 dias
- Comportamento:
  - Retorna dados do cache imediatamente
  - Atualiza o cache em segundo plano
  - Garante resposta instantânea

#### 2. **NetworkFirst** (Dados Dinâmicos)
- Endpoints: `/api/stock`, `/api/shopping-lists`, `/api/purchases`
- Cache: 2 dias
- Comportamento:
  - Tenta buscar da rede primeiro (timeout de 5s)
  - Se falhar, usa o cache
  - Ideal para dados que mudam frequentemente

#### 3. **CacheFirst** (Recursos Estáticos)
- Padrão: Imagens (`.png`, `.jpg`, `.jpeg`, `.svg`, `.gif`, `.webp`, `.ico`)
- Cache: 30 dias
- Comportamento:
  - Busca do cache primeiro
  - Só vai para a rede se não estiver em cache
  - Perfeito para imagens e assets

#### 4. **NetworkOnly** (Autenticação)
- Endpoints: `/api/auth`, `/api/user`, `/api/admin`
- Sem cache
- Comportamento:
  - Sempre busca da rede
  - Garante segurança de dados sensíveis

## 🛠️ Componentes Implementados

### 1. Hook `useOffline`
**Localização**: `src/hooks/use-offline.ts`

Gerencia o estado online/offline da aplicação:

```typescript
const {
  isOnline,           // Boolean: está online?
  wasOffline,         // Boolean: ficou offline em algum momento?
  lastOnline,         // Date: última vez online
  connectionSpeed,    // String: velocidade da conexão
  syncQueue,          // Array: fila de sincronização
  syncQueueCount,     // Number: quantidade de itens na fila
  addToSyncQueue,     // Function: adicionar item à fila
  processSyncQueue,   // Function: processar fila
  clearSyncQueue,     // Function: limpar fila
} = useOffline()
```

### 2. Hook `useOfflineFetch`
**Localização**: `src/hooks/use-offline.ts`

Wrapper para fetch com suporte offline:

```typescript
const { offlineFetch } = useOfflineFetch()

// Uso
const response = await offlineFetch('/api/products')
```

Comportamento:
- **GET**: Busca do cache se offline
- **POST/PUT/DELETE**: Adiciona à fila de sincronização se offline

### 3. Sistema de Cache IndexedDB
**Localização**: `src/lib/offline-db.ts`

API completa para gerenciar cache estruturado:

```typescript
import { offlineCache } from '@/lib/offline-db'

// Produtos
await offlineCache.setProducts(products)
const products = await offlineCache.getProducts()

// Estoque
await offlineCache.setStock(stock)
const stock = await offlineCache.getStock()

// Listas de Compras
await offlineCache.setShoppingLists(lists)
const lists = await offlineCache.getShoppingLists()

// Limpar tudo
await offlineCache.clearAll()
```

### 4. Componente `OfflineIndicator`
**Localização**: `src/components/offline-indicator.tsx`

Indicador visual do status offline/online:

```tsx
import { OfflineIndicator } from '@/components/offline-indicator'

// Em ClientLayout
<OfflineIndicator />
```

Estados:
- **Offline**: Mostra alerta vermelho com número de itens pendentes
- **Sincronizando**: Mostra alerta azul com botões de ação
- **Online**: Mostra confirmação verde (por alguns segundos)

### 5. Componente `OfflineStatusBar`
**Localização**: `src/components/offline-indicator.tsx`

Barra de status compacta na parte inferior:

```tsx
import { OfflineStatusBar } from '@/components/offline-indicator'

// Em ClientLayout
<OfflineStatusBar />
```

### 6. Componente `OfflineSyncManager`
**Localização**: `src/components/offline-sync-manager.tsx`

Gerencia sincronização automática em background:

- Sincroniza dados a cada 5 minutos quando online
- Atualiza todos os caches automaticamente
- Não renderiza nada visualmente (background)

### 7. Página Offline Melhorada
**Localização**: `src/app/offline.tsx`

Página dedicada quando totalmente offline:

- Mostra dados disponíveis em cache
- Links rápidos para seções com dados offline
- Informações sobre o status do cache
- Botão para tentar reconectar

## 🚀 Como Usar

### Configuração Automática

O sistema está **totalmente configurado** e funciona automaticamente. Não é necessário nenhuma configuração adicional!

### Desenvolvimento

Durante o desenvolvimento, o PWA está desabilitado. Para testar:

1. **Build de produção**:
```bash
npm run build
npm start
```

2. **Testar offline**:
- Abra o DevTools (F12)
- Vá para a aba "Network"
- Selecione "Offline" no dropdown
- Navegue pela aplicação

### Verificar Cache

No DevTools:
1. Vá para "Application"
2. Em "Storage", veja:
   - **Cache Storage**: Arquivos estáticos e API cache
   - **IndexedDB**: Dados estruturados (mercado304-offline)

## 📊 Monitoramento

### Console Logs

O sistema registra logs úteis:

```
✅ Dados sincronizados offline com sucesso
❌ Erro ao sincronizar dados offline: [erro]
```

### Notificações (Toast)

O usuário recebe notificações em tempo real:

- 🔴 **"Você está offline"**: Quando perde conexão
- 🔵 **"Sincronizando dados..."**: Quando volta online
- ✅ **"Conexão restaurada!"**: Quando sincronização completa

## 🔧 Customização

### Adicionar Novo Endpoint ao Cache

Edite `next.config.js`:

```javascript
{
  urlPattern: /^https?:\/\/[^/]+\/api\/seu-endpoint($|\/).*/i,
  handler: 'StaleWhileRevalidate',
  options: {
    cacheName: 'seu-cache',
    expiration: {
      maxEntries: 50,
      maxAgeSeconds: 60 * 60 * 24, // 1 dia
    },
  },
}
```

### Adicionar Novo Tipo de Dado ao IndexedDB

Edite `src/lib/offline-db.ts`:

```typescript
export const offlineCache = {
  // ... outros métodos
  
  async setSeusDados(dados: any[]): Promise<void> {
    await offlineDB.set('seus-dados', dados, 60 * 60 * 24) // 1 dia
  },

  async getSeusDados(): Promise<any[] | null> {
    return offlineDB.get('seus-dados')
  },
}
```

### Pré-carregar Dados Específicos

Use o hook `useOfflinePreload`:

```typescript
import { useOfflinePreload } from '@/components/offline-sync-manager'

const { preloadProduct } = useOfflinePreload()

// Pré-carregar um produto específico
await preloadProduct(productId)
```

## 📱 Boas Práticas

### 1. Indicar Dados do Cache

```typescript
const { offlineFetch } = useOfflineFetch()

const response = await offlineFetch('/api/products')
const fromCache = response.headers.get('X-From-Cache') === 'true'

if (fromCache) {
  // Mostrar badge ou aviso de que são dados em cache
  console.log('Dados do cache (podem estar desatualizados)')
}
```

### 2. Tratar Ações Offline

```typescript
const { isOnline, addToSyncQueue } = useOffline()

const handleSave = async (data) => {
  if (!isOnline) {
    // Salvar localmente e adicionar à fila
    addToSyncQueue('POST', '/api/products', data)
    toast.info('Será sincronizado quando voltar online')
    return
  }
  
  // Fazer request normal
  await fetch('/api/products', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}
```

### 3. Limpar Cache Periodicamente

```typescript
import { useOfflineCache } from '@/components/offline-sync-manager'

const { clearCache, getCacheSize } = useOfflineCache()

// Mostrar tamanho do cache
const size = await getCacheSize()
console.log(`Cache: ${size} MB`)

// Limpar cache
await clearCache()
```

## 🐛 Troubleshooting

### Cache não está atualizando

1. Limpe o cache manualmente:
   - DevTools → Application → Clear storage
2. Force atualização do Service Worker:
   - DevTools → Application → Service Workers → Update

### Dados não aparecem offline

1. Verifique se sincronizou enquanto online
2. Abra o console e veja logs de sincronização
3. Verifique IndexedDB no DevTools

### Service Worker não registra

1. Certifique-se de estar em produção (não development)
2. Verifique se está em HTTPS ou localhost
3. Veja erros no console

## 📈 Performance

### Métricas Esperadas

- **Carregamento inicial offline**: < 500ms
- **Resposta de API em cache**: < 50ms
- **Sincronização em background**: Não bloqueia UI
- **Tamanho do cache**: ~5-20 MB (dependendo dos dados)

### Otimizações

1. **Lazy loading**: Só carrega dados quando necessário
2. **Compressão**: Dados são comprimidos automaticamente
3. **Expiração**: Cache expira automaticamente
4. **Limpeza**: Dados expirados são removidos automaticamente

## 🔐 Segurança

- ❌ Dados sensíveis **NÃO** são armazenados em cache
- ❌ Rotas de autenticação **NÃO** usam cache
- ✅ Cache só armazena dados do usuário logado
- ✅ Cache é limpo ao fazer logout

## 📚 Referências

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [PWA Best Practices](https://web.dev/pwa-checklist/)

## 🎉 Resultado

Com este sistema, o Mercado304 oferece:

✅ Acesso offline a dados essenciais
✅ Sincronização automática quando voltar online
✅ Resposta instantânea com cache inteligente
✅ Fila de ações para executar ao reconectar
✅ Indicadores visuais claros do status
✅ Experiência fluida mesmo com conexão instável

**O usuário pode usar a aplicação normalmente no supermercado, mesmo com cobertura ruim de rede!** 📱🛒

