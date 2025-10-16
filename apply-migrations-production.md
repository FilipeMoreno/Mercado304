# 🔒 Guia de Aplicação Segura das Migrações em Produção

## ⚠️ IMPORTANTE: Backup Obrigatório

**ANTES DE APLICAR QUALQUER MIGRAÇÃO**, faça backup do banco de dados:

```bash
# PostgreSQL
pg_dump $PRISMA_DATABASE_URL > backup_$(date +%Y%m%d_%H%M%S).sql

# Ou usando pgAdmin/outro cliente visual de sua preferência
```

## 📋 Migrações Criadas (Em Ordem)

As seguintes migrações foram criadas para sincronizar com o schema atual:

1. **20250116000001_add_discount_fields** - Adiciona campos de desconto
2. **20250116000002_add_temporary_shopping_list_fields** - Adiciona campos para itens temporários
3. **20250116000003_add_nutritional_extended_fields** - Adiciona campos nutricionais estendidos
4. **20250116000004_add_security_features** - Adiciona recursos de segurança
5. **20250116000005_add_missing_indexes** - Adiciona índices para performance
6. **20250116000006_add_churrasco_calculations** - Adiciona tabela para histórico do churrascômetro

## ✅ Garantias de Segurança

Todas as migrações foram escritas com:

- ✅ `IF NOT EXISTS` para criação de tabelas
- ✅ `ADD COLUMN IF NOT EXISTS` para novas colunas
- ✅ `CREATE INDEX IF NOT EXISTS` para índices
- ✅ Valores padrão para campos NOT NULL
- ✅ Updates apenas em valores NULL
- ✅ **NENHUMA exclusão de dados**
- ✅ **NENHUMA alteração destrutiva**

## 🚀 Aplicando em Produção

### Opção 1: Usando Prisma Migrate Deploy (RECOMENDADO)

```bash
# 1. Configure a variável de ambiente de produção
export PRISMA_DATABASE_URL="postgresql://..."

# 2. Aplique as migrações
npx prisma migrate deploy

# 3. Gere o cliente Prisma atualizado
npx prisma generate
```

### Opção 2: Aplicação Manual (Maior Controle)

Se preferir aplicar manualmente para ter controle total:

```bash
# 1. Conecte ao banco de produção
psql $PRISMA_DATABASE_URL

# 2. Aplique cada migração na ordem:
\i prisma/migrations/20250116000001_add_discount_fields/migration.sql
\i prisma/migrations/20250116000002_add_temporary_shopping_list_fields/migration.sql
\i prisma/migrations/20250116000003_add_nutritional_extended_fields/migration.sql
\i prisma/migrations/20250116000004_add_security_features/migration.sql
\i prisma/migrations/20250116000005_add_missing_indexes/migration.sql
\i prisma/migrations/20250116000006_add_churrasco_calculations/migration.sql

# 3. Registre as migrações na tabela _prisma_migrations
INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES 
  (gen_random_uuid(), '', NOW(), '20250116000001_add_discount_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20250116000002_add_temporary_shopping_list_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20250116000003_add_nutritional_extended_fields', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20250116000004_add_security_features', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20250116000005_add_missing_indexes', NULL, NULL, NOW(), 1),
  (gen_random_uuid(), '', NOW(), '20250116000006_add_churrasco_calculations', NULL, NULL, NOW(), 1);
```

## ✨ Pós-Aplicação

Depois de aplicar as migrações:

1. ✅ Verifique se a aplicação está funcionando
2. ✅ Execute testes de sanidade
3. ✅ Monitore logs por alguns minutos
4. ✅ Mantenha o backup por pelo menos 7 dias

## 🔄 Reversão (Se Necessário)

Se algo der errado (improvável com essas migrações seguras):

```bash
# Restaurar do backup
psql $PRISMA_DATABASE_URL < backup_YYYYMMDD_HHMMSS.sql
```

## 📞 Notas Finais

- Todas as migrações são **idempotentes** (podem ser executadas múltiplas vezes)
- **Nenhum dado será perdido**
- As operações são rápidas (principalmente índices podem demorar um pouco)
- Recomendado aplicar em horário de menor tráfego para os índices

## 🎯 Checklist de Aplicação

- [ ] Backup do banco feito
- [ ] Variável PRISMA_DATABASE_URL configurada
- [ ] `npx prisma migrate deploy` executado
- [ ] Aplicação funcionando corretamente
- [ ] Logs verificados
- [ ] Backup arquivado com segurança

