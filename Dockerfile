# Dockerfile para o app principal (Next.js)
FROM node:20-alpine AS base

# Instalar dependências apenas quando necessário
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copiar arquivos de dependências
COPY package.json package-lock.json* ./
RUN npm ci

# Criar build da aplicação
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Gerar Prisma Client e build Next.js
ENV NEXT_TELEMETRY_DISABLED 1
# Variáveis dummy para o build (substituídas em runtime)
ENV DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV PRISMA_DATABASE_URL="postgresql://dummy:dummy@dummy:5432/dummy"
ENV REDIS_URL="redis://dummy:6379"
ENV RESEND_API_KEY="re_dummy"
ENV GEMINI_API_KEY="dummy"
ENV BETTER_AUTH_SECRET="dummy_secret_key_dummy"
ENV BETTER_AUTH_URL="http://localhost:3000"
RUN npx prisma generate
RUN npm run build

# Imagem de produção, copiar todos os arquivos e rodar next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copiar arquivos do build standalone
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma

USER nextjs

EXPOSE 3000

ENV PORT 3000
ENV HOSTNAME "0.0.0.0"

CMD ["node", "server.js"]

