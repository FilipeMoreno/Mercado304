-- CreateTable
CREATE TABLE "product_barcodes" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "product_barcodes_pkey" PRIMARY KEY ("id")
);

-- Migrar dados existentes do campo barcode para a nova tabela
INSERT INTO "product_barcodes" ("id", "productId", "barcode", "isPrimary", "createdAt", "updatedAt")
SELECT 
    gen_random_uuid()::text,
    id,
    barcode,
    true,
    "createdAt",
    "updatedAt"
FROM "products"
WHERE barcode IS NOT NULL AND barcode != '';

-- CreateIndex
CREATE UNIQUE INDEX "product_barcodes_barcode_key" ON "product_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "product_barcodes_productId_idx" ON "product_barcodes"("productId");

-- CreateIndex
CREATE INDEX "product_barcodes_barcode_idx" ON "product_barcodes"("barcode");

-- CreateIndex
CREATE INDEX "product_barcodes_isPrimary_idx" ON "product_barcodes"("isPrimary");

-- AddForeignKey
ALTER TABLE "product_barcodes" ADD CONSTRAINT "product_barcodes_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE;


