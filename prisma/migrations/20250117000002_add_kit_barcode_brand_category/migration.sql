-- AlterTable
ALTER TABLE "product_kits" ADD COLUMN "barcode" TEXT,
ADD COLUMN "brandId" TEXT,
ADD COLUMN "categoryId" TEXT;

-- CreateIndex
CREATE INDEX "product_kits_barcode_idx" ON "product_kits"("barcode");

-- CreateIndex
CREATE INDEX "product_kits_brandId_idx" ON "product_kits"("brandId");

-- CreateIndex
CREATE INDEX "product_kits_categoryId_idx" ON "product_kits"("categoryId");

-- AddForeignKey
ALTER TABLE "product_kits" ADD CONSTRAINT "product_kits_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "product_kits" ADD CONSTRAINT "product_kits_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

