# 🔨 Instruções de Build - Sistema Offline

## 📋 Pré-requisitos

- Node.js 18+ instalado
- npm ou yarn
- Acesso ao repositório
- Variáveis de ambiente configuradas

## 🚀 Build Local (Desenvolvimento)

### Nota Importante

⚠️ **O PWA está desabilitado em desenvolvimento** para facilitar o desenvolvimento. Para testar o modo offline, você precisa fazer um build de produção.

### Comandos de Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Aplicação roda em http://localhost:3000
```

## 🏗️ Build de Produção (Local)

### Passo 1: Limpar ambiente

```bash
# Limpar node_modules e cache
rm -rf node_modules
rm -rf .next
rm package-lock.json

# Reinstalar dependências
npm install
```

### Passo 2: Build

```bash
# Gerar build de produção
npm run build
```

**O que acontece no build:**
- ✅ Next.js compila a aplicação
- ✅ next-pwa gera o Service Worker (`public/sw.js`)
- ✅ Workbox é configurado com estratégias de cache
- ✅ Assets são otimizados
- ✅ Manifest é validado

### Passo 3: Iniciar em modo produção

```bash
# Iniciar servidor de produção local
npm start
```

Acesse: http://localhost:3000

### Passo 4: Testar offline

1. Abra o navegador em http://localhost:3000
2. Navegue por produtos, estoque, listas
3. Abra DevTools (F12) → Network → Offline
4. Navegue novamente - deve funcionar!

## 🧪 Verificações Após Build

### 1. Verificar Service Worker

```bash
# Verificar se foi gerado
ls -la public/sw.js
ls -la public/workbox-*.js
```

**Esperado**: Arquivos existem

### 2. Verificar no Navegador

Abra DevTools → Application:

- **Service Workers**: Deve aparecer `sw.js` registrado
- **Cache Storage**: Deve ter caches criados:
  - `start-url`
  - `pages-cache`
  - `api-data-cache`
  - `dynamic-data-cache`
  - `images-cache`
  - `next-cache`
- **IndexedDB**: Deve ter `mercado304-offline`

### 3. Verificar Console

No console do navegador, procure:

```
✅ Dados sincronizados offline com sucesso
```

Não deve ter erros relacionados a Service Worker ou IndexedDB.

## 📦 Deploy para Produção

### Opção 1: Vercel (Recomendado)

```bash
# Instalar Vercel CLI (se não tiver)
npm i -g vercel

# Login
vercel login

# Deploy para produção
vercel --prod
```

### Opção 2: Outro provedor

```bash
# Build
npm run build

# O diretório .next/standalone contém a aplicação
# Fazer deploy conforme seu provedor
```

### Opção 3: Docker

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["npm", "start"]
```

```bash
# Build da imagem
docker build -t mercado304 .

# Executar
docker run -p 3000:3000 mercado304
```

## 🔍 Verificações Pós-Deploy

### Checklist Rápido

- [ ] Site carrega corretamente
- [ ] Service Worker registra (DevTools)
- [ ] Cache funciona (teste offline)
- [ ] IndexedDB cria
- [ ] Notificações aparecem
- [ ] Página `/offline` acessível

### Teste Completo

Execute todos os testes do [checklist de deploy](./OFFLINE_DEPLOY_CHECKLIST.md).

## 🐛 Troubleshooting

### Build falha

**Erro**: `Module not found` ou `Cannot find module`

**Solução**:
```bash
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Service Worker não gera

**Erro**: `public/sw.js` não existe após build

**Possíveis causas**:
1. next-pwa não está instalado
2. Configuração incorreta no `next.config.js`

**Solução**:
```bash
# Verificar se next-pwa está instalado
npm ls next-pwa

# Se não estiver, instalar
npm install next-pwa

# Build novamente
npm run build
```

### Build funciona mas produção não

**Erro**: Aplicação não carrega em produção

**Verificar**:
1. Variáveis de ambiente configuradas
2. HTTPS habilitado (necessário para PWA)
3. Portas corretas abertas

### Cache não funciona

**Erro**: Dados não ficam disponíveis offline

**Verificar**:
1. Service Worker registrou (DevTools → Application)
2. Está em HTTPS ou localhost
3. Navegador suporta Service Workers
4. Não está em modo privado/incognito

## 🔒 Variáveis de Ambiente

Certifique-se de que todas as variáveis de ambiente necessárias estão configuradas:

```env
# .env.local (desenvolvimento)
DATABASE_URL="..."
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."
# ... outras variáveis

# .env.production (produção)
DATABASE_URL="..."
NEXTAUTH_URL="https://seu-dominio.com"
NEXTAUTH_SECRET="..."
# ... outras variáveis
```

## 📊 Métricas de Build

### Tamanhos Esperados

- **Service Worker**: ~50-100 KB
- **Workbox**: ~20-30 KB
- **Build total**: Depende da aplicação

### Performance

- **Build time**: 2-5 minutos (normal)
- **First load**: < 3s
- **Subsequent loads**: < 1s (com cache)

## 🔄 Atualização de Versão

Quando atualizar o código:

```bash
# 1. Pull das mudanças
git pull origin main

# 2. Atualizar dependências
npm install

# 3. Build
npm run build

# 4. Deploy
vercel --prod
# ou seu comando de deploy
```

### Cache do Service Worker

O Service Worker é atualizado automaticamente:

1. Usuário acessa o site
2. Novo Service Worker é baixado
3. Aguarda até que todas as abas sejam fechadas
4. Na próxima visita, usa a nova versão

Para forçar atualização imediata:

```javascript
// Em src/components/offline-sync-manager.tsx
// (já configurado com skipWaiting)
```

## 📝 Checklist de Build

Antes de fazer deploy:

- [ ] `npm install` executado
- [ ] `npm run build` sem erros
- [ ] Service Worker gerado (`public/sw.js`)
- [ ] Workbox gerado (`public/workbox-*.js`)
- [ ] Teste local funcionando
- [ ] Teste offline funcionando
- [ ] Variáveis de ambiente configuradas
- [ ] Documentação atualizada
- [ ] Changelog atualizado (se aplicável)

## 🎯 Comandos Úteis

```bash
# Verificar versão do Node
node --version

# Verificar versão do npm
npm --version

# Limpar cache do npm
npm cache clean --force

# Verificar dependências desatualizadas
npm outdated

# Atualizar dependências
npm update

# Analisar bundle size
npm run build -- --analyze

# Verificar tipos TypeScript
npx tsc --noEmit

# Executar linter
npm run lint

# Formatar código (se tiver)
npm run format
```

## 📚 Documentação Adicional

- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Vercel Deployment](https://vercel.com/docs)
- [PWA Best Practices](https://web.dev/pwa-checklist/)
- [Service Worker Lifecycle](https://developers.google.com/web/fundamentals/primers/service-workers/lifecycle)

## ✅ Pronto!

Agora você sabe como fazer o build e deploy do sistema offline! 🚀

Para dúvidas, consulte:
- [Documentação Completa](./OFFLINE_MODE_PWA.md)
- [Guia Rápido](./OFFLINE_QUICKSTART.md)
- [Checklist de Deploy](./OFFLINE_DEPLOY_CHECKLIST.md)

