-- Refatoração dos itens da lista de compras para suportar texto livre

-- Adicionar colunas novas
ALTER TABLE "public"."shopping_list_items" ADD COLUMN IF NOT EXISTS "barcode" TEXT;
ALTER TABLE "public"."shopping_list_items" ADD COLUMN IF NOT EXISTS "brand" TEXT;
ALTER TABLE "public"."shopping_list_items" ADD COLUMN IF NOT EXISTS "category" TEXT;
ALTER TABLE "public"."shopping_list_items" ADD COLUMN IF NOT EXISTS "notes" TEXT;

-- Garantir que productUnit tenha valor padrão para registros existentes
UPDATE "public"."shopping_list_items" 
SET "productUnit" = 'unidade' 
WHERE "productUnit" IS NULL;

-- Garantir que productName esteja preenchido para itens vinculados a produtos
UPDATE "public"."shopping_list_items" AS sli
SET "productName" = p.name
FROM "public"."products" AS p
WHERE sli."productId" = p.id AND sli."productName" IS NULL;

-- Atualizar itens temporários para usar o novo formato
UPDATE "public"."shopping_list_items"
SET 
  "productName" = COALESCE("productName", "tempDescription", 'Item sem nome'),
  "barcode" = "tempBarcode",
  "brand" = "tempBrand",
  "category" = "tempCategory",
  "notes" = "tempNotes"
WHERE "isTemporary" = true;

-- Tornar productName obrigatório (NOT NULL)
ALTER TABLE "public"."shopping_list_items" ALTER COLUMN "productName" SET NOT NULL;

-- Tornar productUnit obrigatório com valor padrão
ALTER TABLE "public"."shopping_list_items" ALTER COLUMN "productUnit" SET NOT NULL;
ALTER TABLE "public"."shopping_list_items" ALTER COLUMN "productUnit" SET DEFAULT 'unidade';

-- Remover colunas temporárias antigas (não mais necessárias)
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "isTemporary";
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "tempDescription";
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "tempBarcode";
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "tempBrand";
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "tempCategory";
ALTER TABLE "public"."shopping_list_items" DROP COLUMN IF EXISTS "tempNotes";

