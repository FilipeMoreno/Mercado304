# 🚀 Guia Rápido - Modo Offline

## ✅ O que já funciona automaticamente

O sistema offline está **totalmente configurado e funcionando**! Não precisa fazer nada para ativá-lo.

### Cache Automático de APIs

✅ **Produtos** - 7 dias de cache  
✅ **Estoque** - 2 dias de cache  
✅ **Listas de Compras** - 2 dias de cache  
✅ **Compras** - 7 dias de cache  
✅ **Marcas** - 7 dias de cache  
✅ **Categorias** - 7 dias de cache  
✅ **Mercados** - 7 dias de cache  

### Sincronização Automática

- ✅ Sincroniza dados a cada 5 minutos quando online
- ✅ Sincroniza automaticamente quando volta online
- ✅ Enfileira ações quando offline para executar depois

## 📱 Como usar nos componentes

### 1. Detectar estado online/offline

```typescript
import { useOffline } from '@/hooks/use-offline'

function MeuComponente() {
  const { isOnline, syncQueueCount } = useOffline()
  
  return (
    <div>
      {!isOnline && <p>Você está offline!</p>}
      {syncQueueCount > 0 && <p>{syncQueueCount} ações pendentes</p>}
    </div>
  )
}
```

### 2. Fazer requisições com suporte offline

```typescript
import { useOfflineFetch } from '@/hooks/use-offline'

function MeuComponente() {
  const { offlineFetch } = useOfflineFetch()
  
  const loadData = async () => {
    try {
      const response = await offlineFetch('/api/products')
      const data = await response.json()
      
      // Verificar se veio do cache
      const fromCache = response.headers.get('X-From-Cache') === 'true'
      if (fromCache) {
        console.log('Dados do cache!')
      }
      
      return data
    } catch (error) {
      console.error('Erro ao carregar dados:', error)
    }
  }
  
  return <button onClick={loadData}>Carregar</button>
}
```

### 3. Usar dados do cache diretamente (IndexedDB)

```typescript
import { offlineCache } from '@/lib/offline-db'

// Ler do cache
const products = await offlineCache.getProducts()
const stock = await offlineCache.getStock()
const lists = await offlineCache.getShoppingLists()

// Salvar no cache
await offlineCache.setProducts(products)
await offlineCache.setStock(stock)
```

### 4. Adicionar ação à fila de sincronização

```typescript
import { useOffline } from '@/hooks/use-offline'

function MeuComponente() {
  const { isOnline, addToSyncQueue } = useOffline()
  
  const saveProduct = async (product) => {
    if (!isOnline) {
      // Adicionar à fila para sincronizar depois
      addToSyncQueue('POST', '/api/products', product)
      return
    }
    
    // Salvar normalmente
    await fetch('/api/products', {
      method: 'POST',
      body: JSON.stringify(product),
    })
  }
  
  return <button onClick={() => saveProduct({...})}>Salvar</button>
}
```

## 🎨 Componentes Visuais

### Indicador de status offline

Já está adicionado automaticamente no `ClientLayout`! Mostra:
- 🔴 Alerta quando está offline
- 🔵 Status de sincronização
- ✅ Confirmação quando volta online

### Página offline

Acesse `/offline` para ver:
- Dados disponíveis em cache
- Links rápidos para seções com dados offline
- Botão para reconectar

## 🧪 Como testar

### Método 1: DevTools

1. Abra o DevTools (F12)
2. Vá para a aba "Network"
3. Selecione "Offline" no dropdown
4. Navegue pela aplicação

### Método 2: Service Worker

1. Abra o DevTools (F12)
2. Vá para "Application" → "Service Workers"
3. Marque "Offline"
4. Navegue pela aplicação

### Método 3: Avião

1. Ative o modo avião no dispositivo
2. Navegue pela aplicação

## 🎯 Cenários de uso

### Cenário 1: Supermercado com má conexão

✅ **Problema**: Cliente está no supermercado com conexão instável  
✅ **Solução**: Dados são carregados do cache instantaneamente  
✅ **Resultado**: Experiência fluida sem espera

### Cenário 2: Adicionar produto offline

✅ **Problema**: Cliente quer adicionar produto mas está sem internet  
✅ **Solução**: Ação é enfileirada para sincronizar depois  
✅ **Resultado**: Produto é salvo quando voltar online

### Cenário 3: Ver lista de compras offline

✅ **Problema**: Cliente quer ver sua lista mas não tem internet  
✅ **Solução**: Lista é carregada do cache offline  
✅ **Resultado**: Lista aparece instantaneamente

## 🔧 Configurações Avançadas

### Limpar cache

```typescript
import { useOfflineCache } from '@/components/offline-sync-manager'

const { clearCache } = useOfflineCache()

await clearCache() // Limpa todo o cache
```

### Pré-carregar dados específicos

```typescript
import { useOfflinePreload } from '@/components/offline-sync-manager'

const { preloadProduct } = useOfflinePreload()

// Pré-carregar um produto específico
await preloadProduct('product-id-123')
```

### Ver tamanho do cache

```typescript
import { useOfflineCache } from '@/components/offline-sync-manager'

const { getCacheSize } = useOfflineCache()

const size = await getCacheSize()
console.log(`Cache: ${size} MB`)
```

## 📊 Monitoramento

### Console Logs

O sistema registra logs úteis:

```
✅ Dados sincronizados offline com sucesso
❌ Erro ao sincronizar dados offline: [erro]
```

### Notificações Toast

O usuário recebe notificações em tempo real:

- 🔴 "Você está offline"
- 🔵 "Sincronizando dados..."
- ✅ "Conexão restaurada!"

## 🐛 Problemas Comuns

### Cache não atualiza

**Solução**: Limpe o cache manualmente
```typescript
await offlineCache.clearAll()
```

### Dados não aparecem offline

**Causa**: Precisa acessar online primeiro para sincronizar

**Solução**: Acesse a página online primeiro, depois funciona offline

### Service Worker não registra

**Causa**: Está em modo development

**Solução**: Execute build de produção:
```bash
npm run build
npm start
```

## 📚 Links Úteis

- [Documentação Completa](./OFFLINE_MODE_PWA.md)
- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)

## 🎉 Pronto!

Agora você já sabe usar o modo offline! O sistema funciona automaticamente, mas você pode usar as APIs para funcionalidades avançadas. 🚀

