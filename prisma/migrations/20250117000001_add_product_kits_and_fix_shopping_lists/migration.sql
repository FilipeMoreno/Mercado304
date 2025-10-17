-- Fix existing shopping_list_items with NULL values
UPDATE "shopping_list_items"
SET "productName" = 'Item sem nome'
WHERE "productName" IS NULL;

UPDATE "shopping_list_items"
SET "productUnit" = 'unidade'
WHERE "productUnit" IS NULL;

-- Now make the columns NOT NULL if they aren't already
ALTER TABLE "shopping_list_items" 
ALTER COLUMN "productName" SET NOT NULL,
ALTER COLUMN "productUnit" SET NOT NULL;

-- Add isKit field to Product table
ALTER TABLE "products" ADD COLUMN IF NOT EXISTS "isKit" BOOLEAN NOT NULL DEFAULT false;

-- Create ProductKit table
CREATE TABLE IF NOT EXISTS "product_kits" (
    "id" TEXT NOT NULL,
    "kitProductId" TEXT NOT NULL,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_kits_pkey" PRIMARY KEY ("id")
);

-- Create ProductKitItem table (items that compose the kit)
CREATE TABLE IF NOT EXISTS "product_kit_items" (
    "id" TEXT NOT NULL,
    "kitId" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_kit_items_pkey" PRIMARY KEY ("id")
);

-- Create unique constraint for kitProductId
CREATE UNIQUE INDEX IF NOT EXISTS "product_kits_kitProductId_key" ON "product_kits"("kitProductId");

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "product_kits_kitProductId_idx" ON "product_kits"("kitProductId");
CREATE INDEX IF NOT EXISTS "product_kits_isActive_idx" ON "product_kits"("isActive");
CREATE INDEX IF NOT EXISTS "product_kit_items_kitId_idx" ON "product_kit_items"("kitId");
CREATE INDEX IF NOT EXISTS "product_kit_items_productId_idx" ON "product_kit_items"("productId");
CREATE INDEX IF NOT EXISTS "products_isKit_idx" ON "products"("isKit");

-- Add foreign key constraints
ALTER TABLE "product_kits" ADD CONSTRAINT "product_kits_kitProductId_fkey" 
FOREIGN KEY ("kitProductId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_kitId_fkey" 
FOREIGN KEY ("kitId") REFERENCES "product_kits"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "product_kit_items" ADD CONSTRAINT "product_kit_items_productId_fkey" 
FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

