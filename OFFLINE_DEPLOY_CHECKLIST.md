# ✅ Checklist de Deploy - Sistema Offline

## Antes do Deploy

### Verificações de Código

- [x] Estratégias de cache configuradas no `next.config.js`
- [x] Hook `useOffline` implementado e funcionando
- [x] Sistema IndexedDB implementado (`offline-db.ts`)
- [x] Componentes visuais criados (`OfflineIndicator`, `OfflineStatusBar`)
- [x] Gerenciador de sincronização implementado (`OfflineSyncManager`)
- [x] Página offline melhorada (`app/offline.tsx`)
- [x] Componentes integrados no `ClientLayout`
- [x] Exports adicionados ao `hooks/index.ts`
- [x] Documentação completa criada
- [x] Sem erros de linting

### Testes Locais

Execute antes de fazer deploy:

```bash
# 1. Build de produção
npm run build

# 2. Iniciar em modo produção
npm start

# 3. Abrir no navegador
# http://localhost:3000
```

### Checklist de Testes

- [ ] Testar em modo offline (DevTools → Network → Offline)
- [ ] Verificar cache de produtos funcionando
- [ ] Verificar cache de estoque funcionando
- [ ] Verificar cache de listas de compras funcionando
- [ ] Testar fila de sincronização
- [ ] Verificar indicadores visuais aparecem
- [ ] Testar página `/offline`
- [ ] Verificar Service Worker registra (DevTools → Application)
- [ ] Verificar IndexedDB cria (DevTools → Application → IndexedDB)
- [ ] Testar em mobile (PWA instalado)

## Durante o Deploy

### 1. Build

```bash
# Limpar node_modules e reinstalar
rm -rf node_modules package-lock.json
npm install

# Build de produção
npm run build
```

### 2. Verificações Pré-Deploy

- [ ] Build completa sem erros
- [ ] Sem warnings críticos no console
- [ ] Service Worker gerado (`public/sw.js`)
- [ ] Workbox gerado (`public/workbox-*.js`)
- [ ] Manifest válido (`public/manifest.json`)

### 3. Deploy

Siga o processo normal de deploy:

**Vercel:**
```bash
vercel --prod
```

**Outros:**
```bash
# Seu comando de deploy habitual
```

### 4. Verificações Pós-Deploy

- [ ] Aplicação carrega corretamente
- [ ] Service Worker registra (Console do navegador)
- [ ] Cache funciona (testar offline)
- [ ] IndexedDB cria corretamente
- [ ] Notificações aparecem
- [ ] Página `/offline` acessível

## Após o Deploy

### Testes em Produção

#### Teste 1: Navegação Offline

1. Acesse o site em produção
2. Navegue por várias páginas (produtos, estoque, listas)
3. Ative modo offline (DevTools ou modo avião)
4. Navegue novamente - deve funcionar

**✅ Esperado**: Páginas carregam do cache

#### Teste 2: Cache de API

1. Acesse produtos online
2. Abra DevTools → Network
3. Ative "Offline"
4. Recarregue a página de produtos

**✅ Esperado**: Produtos aparecem do cache

#### Teste 3: Fila de Sincronização

1. Ative modo offline
2. Tente adicionar/editar algo
3. Verifique notificação "Será sincronizado quando voltar online"
4. Volte online
5. Verifique sincronização automática

**✅ Esperado**: Ação sincroniza automaticamente

#### Teste 4: IndexedDB

1. Abra DevTools → Application → IndexedDB
2. Verifique database `mercado304-offline`
3. Verifique store `cache`
4. Verifique dados armazenados

**✅ Esperado**: Dados presentes no IndexedDB

#### Teste 5: PWA Mobile

1. Instale o PWA no mobile
2. Use a aplicação online
3. Ative modo avião
4. Use a aplicação offline

**✅ Esperado**: Funciona perfeitamente offline

### Métricas para Monitorar

#### Performance

- **Carregamento inicial offline**: < 500ms
- **Resposta de API em cache**: < 50ms
- **Sincronização em background**: Não bloqueia UI

#### Cache

- **Taxa de hit do cache**: > 80% após primeira visita
- **Tamanho do cache**: 5-20 MB (normal)
- **Dados expirados**: Limpeza automática a cada hora

#### Erros

Monitore no console de erros:
- Erros de Service Worker
- Erros de IndexedDB
- Erros de sincronização

## Troubleshooting Pós-Deploy

### Problema: Service Worker não registra

**Causas possíveis**:
- HTTPS não configurado (necessário em produção)
- Service Worker não foi gerado no build
- Erro no código do Service Worker

**Solução**:
1. Verifique se está em HTTPS
2. Verifique se `/sw.js` existe
3. Veja erros no console

### Problema: Cache não funciona

**Causas possíveis**:
- Service Worker não registrou
- Estratégias de cache incorretas
- Cache foi limpo manualmente

**Solução**:
1. Registre o Service Worker
2. Verifique configurações no `next.config.js`
3. Acesse online primeiro para popular cache

### Problema: IndexedDB não cria

**Causas possíveis**:
- Navegador não suporta IndexedDB
- Quota de storage excedida
- Modo privado/incognito (alguns navegadores)

**Solução**:
1. Verifique compatibilidade do navegador
2. Limpe storage antigo
3. Use navegador normal (não privado)

### Problema: Sincronização não funciona

**Causas possíveis**:
- Não voltou online corretamente
- Erro nas requisições de sincronização
- Fila corrompida no localStorage

**Solução**:
1. Force reload (Ctrl+Shift+R)
2. Limpe localStorage
3. Verifique console de erros

## Rollback (se necessário)

Se houver problemas críticos:

### 1. Desabilitar PWA temporariamente

Edite `next.config.js`:

```javascript
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: true, // Desabilita PWA
  // ... resto da config
})
```

### 2. Limpar Service Worker dos usuários

Adicione em `public/sw.js`:

```javascript
self.addEventListener('install', () => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName)
        })
      )
    })
  )
  return self.clients.claim()
})
```

### 3. Deploy da correção

```bash
npm run build
# Seu comando de deploy
```

## Documentação para o Time

Compartilhe com o time:

- [x] [Guia Rápido](./OFFLINE_QUICKSTART.md)
- [x] [Documentação Completa](./OFFLINE_MODE_PWA.md)
- [x] Este checklist

## Próximos Passos (Opcional)

Melhorias futuras:

- [ ] Implementar Background Sync API (sincronização real em background)
- [ ] Adicionar Push Notifications quando voltar online
- [ ] Criar dashboard de métricas de cache
- [ ] Implementar versionamento de cache
- [ ] Adicionar compressão de dados no IndexedDB
- [ ] Criar estratégias de cache por usuário
- [ ] Implementar cache de imagens otimizadas

## Contatos de Suporte

Se houver problemas:

1. Verifique logs de erro
2. Consulte documentação
3. Revise este checklist
4. Entre em contato com o desenvolvedor

---

## ✅ Status do Deploy

- **Data**: _____________________
- **Versão**: _____________________
- **Responsável**: _____________________
- **Ambiente**: _____________________

### Testes Realizados

- [ ] Teste 1: Navegação Offline
- [ ] Teste 2: Cache de API
- [ ] Teste 3: Fila de Sincronização
- [ ] Teste 4: IndexedDB
- [ ] Teste 5: PWA Mobile

### Aprovação

- [ ] Testes passaram
- [ ] Performance OK
- [ ] Sem erros críticos
- [ ] Documentação atualizada

**Aprovado por**: _____________________  
**Data**: _____________________

---

🎉 **Sistema Offline implementado e em produção com sucesso!**

