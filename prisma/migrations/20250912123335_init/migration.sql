-- CreateEnum
CREATE TYPE "public"."PaymentMethod" AS ENUM ('MONEY', 'DEBIT', 'CREDIT', 'PIX', 'VOUCHER', 'CHECK', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."StockMovementType" AS ENUM ('ENTRADA', 'SAIDA', 'AJUSTE', 'VENCIMENTO', 'PERDA', 'DESPERDICIO');

-- CreateEnum
CREATE TYPE "public"."WasteReason" AS ENUM ('EXPIRED', 'SPOILED', 'DAMAGED', 'CONTAMINATED', 'EXCESS', 'FREEZER_BURN', 'MOLDY', 'PEST_DAMAGE', 'POWER_OUTAGE', 'FORGOTTEN', 'OTHER');

-- CreateEnum
CREATE TYPE "public"."ExpirationAlertType" AS ENUM ('EXPIRING_SOON', 'EXPIRING_TODAY', 'EXPIRED');

-- CreateTable
CREATE TABLE "public"."markets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "location" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "markets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."brands" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "brands_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."categories" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "icon" TEXT,
    "color" TEXT,
    "isFood" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."products" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "barcode" TEXT,
    "categoryId" TEXT,
    "brandId" TEXT,
    "unit" TEXT NOT NULL DEFAULT 'unidade',
    "hasStock" BOOLEAN NOT NULL DEFAULT false,
    "minStock" DOUBLE PRECISION,
    "maxStock" DOUBLE PRECISION,
    "hasExpiration" BOOLEAN NOT NULL DEFAULT false,
    "defaultShelfLifeDays" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "products_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchases" (
    "id" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "totalAmount" DOUBLE PRECISION NOT NULL,
    "purchaseDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paymentMethod" "public"."PaymentMethod" NOT NULL DEFAULT 'MONEY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchases_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."purchase_items" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unitPrice" DOUBLE PRECISION NOT NULL,
    "totalPrice" DOUBLE PRECISION NOT NULL,
    "productName" TEXT,
    "productUnit" TEXT,
    "productCategory" TEXT,
    "brandName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "purchase_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shopping_lists" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_lists_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."shopping_list_items" (
    "id" TEXT NOT NULL,
    "listId" TEXT NOT NULL,
    "productId" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "estimatedPrice" DOUBLE PRECISION,
    "isChecked" BOOLEAN NOT NULL DEFAULT false,
    "productName" TEXT,
    "productUnit" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "shopping_list_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_items" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "expirationDate" TIMESTAMP(3),
    "location" TEXT,
    "unitCost" DOUBLE PRECISION,
    "addedDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUpdated" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "isExpired" BOOLEAN NOT NULL DEFAULT false,
    "isLowStock" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "stock_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_history" (
    "id" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "productId" TEXT,
    "productName" TEXT,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "location" TEXT,
    "unitCost" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "purchaseItemId" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."stock_movements" (
    "id" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "type" "public"."StockMovementType" NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "reason" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "purchaseItemId" TEXT,

    CONSTRAINT "stock_movements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."waste_records" (
    "id" TEXT NOT NULL,
    "productId" TEXT,
    "productName" TEXT NOT NULL,
    "quantity" DOUBLE PRECISION NOT NULL,
    "unit" TEXT NOT NULL,
    "wasteReason" "public"."WasteReason" NOT NULL,
    "wasteDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expirationDate" TIMESTAMP(3),
    "location" TEXT,
    "unitCost" DOUBLE PRECISION,
    "totalValue" DOUBLE PRECISION,
    "notes" TEXT,
    "stockItemId" TEXT,
    "userId" TEXT,
    "category" TEXT,
    "brand" TEXT,
    "batchNumber" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "waste_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."expiration_alerts" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "stockItemId" TEXT NOT NULL,
    "alertType" "public"."ExpirationAlertType" NOT NULL,
    "alertDate" TIMESTAMP(3) NOT NULL,
    "isResolved" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expiration_alerts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."nutritional_info" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "servingSize" TEXT,
    "calories" DOUBLE PRECISION,
    "proteins" DOUBLE PRECISION,
    "totalFat" DOUBLE PRECISION,
    "saturatedFat" DOUBLE PRECISION,
    "transFat" DOUBLE PRECISION,
    "carbohydrates" DOUBLE PRECISION,
    "totalSugars" DOUBLE PRECISION,
    "addedSugars" DOUBLE PRECISION,
    "fiber" DOUBLE PRECISION,
    "sodium" DOUBLE PRECISION,
    "vitaminA" DOUBLE PRECISION,
    "vitaminC" DOUBLE PRECISION,
    "vitaminD" DOUBLE PRECISION,
    "vitaminE" DOUBLE PRECISION,
    "vitaminK" DOUBLE PRECISION,
    "thiamine" DOUBLE PRECISION,
    "riboflavin" DOUBLE PRECISION,
    "niacin" DOUBLE PRECISION,
    "vitaminB6" DOUBLE PRECISION,
    "folate" DOUBLE PRECISION,
    "vitaminB12" DOUBLE PRECISION,
    "biotin" DOUBLE PRECISION,
    "pantothenicAcid" DOUBLE PRECISION,
    "taurine" DOUBLE PRECISION,
    "caffeine" DOUBLE PRECISION,
    "calcium" DOUBLE PRECISION,
    "iron" DOUBLE PRECISION,
    "magnesium" DOUBLE PRECISION,
    "phosphorus" DOUBLE PRECISION,
    "potassium" DOUBLE PRECISION,
    "zinc" DOUBLE PRECISION,
    "copper" DOUBLE PRECISION,
    "manganese" DOUBLE PRECISION,
    "selenium" DOUBLE PRECISION,
    "iodine" DOUBLE PRECISION,
    "chromium" DOUBLE PRECISION,
    "molybdenum" DOUBLE PRECISION,
    "allergensContains" TEXT[],
    "allergensMayContain" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "nutritional_info_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."recipes" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "prepTime" TEXT,
    "mealType" TEXT NOT NULL,
    "ingredients" TEXT[],
    "instructions" TEXT NOT NULL,
    "chefTip" TEXT,
    "rating" DOUBLE PRECISION,
    "timesCooked" INTEGER NOT NULL DEFAULT 0,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "recipes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."price_records" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "marketId" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "recordDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "price_records_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."user" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "normalizedEmail" TEXT,
    "twoFactorEnabled" BOOLEAN DEFAULT false,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."session" (
    "id" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "token" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,

    CONSTRAINT "session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."passkey" (
    "id" TEXT NOT NULL,
    "name" TEXT,
    "publicKey" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "credentialID" TEXT NOT NULL,
    "counter" INTEGER NOT NULL,
    "deviceType" TEXT NOT NULL,
    "backedUp" BOOLEAN NOT NULL,
    "transports" TEXT,
    "createdAt" TIMESTAMP(3),
    "aaguid" TEXT,

    CONSTRAINT "passkey_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."twoFactor" (
    "id" TEXT NOT NULL,
    "secret" TEXT NOT NULL,
    "backupCodes" TEXT NOT NULL,
    "userId" TEXT NOT NULL,

    CONSTRAINT "twoFactor_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "brands_name_key" ON "public"."brands"("name");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "public"."categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "products_barcode_key" ON "public"."products"("barcode");

-- CreateIndex
CREATE UNIQUE INDEX "nutritional_info_productId_key" ON "public"."nutritional_info"("productId");

-- CreateIndex
CREATE INDEX "price_records_productId_marketId_idx" ON "public"."price_records"("productId", "marketId");

-- CreateIndex
CREATE INDEX "price_records_recordDate_idx" ON "public"."price_records"("recordDate");

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "public"."user"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_normalizedEmail_key" ON "public"."user"("normalizedEmail");

-- CreateIndex
CREATE UNIQUE INDEX "session_token_key" ON "public"."session"("token");

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "public"."categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."products" ADD CONSTRAINT "products_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "public"."brands"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchases" ADD CONSTRAINT "purchases_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "public"."markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_items" ADD CONSTRAINT "purchase_items_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "public"."purchases"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."purchase_items" ADD CONSTRAINT "purchase_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopping_list_items" ADD CONSTRAINT "shopping_list_items_listId_fkey" FOREIGN KEY ("listId") REFERENCES "public"."shopping_lists"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."shopping_list_items" ADD CONSTRAINT "shopping_list_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_items" ADD CONSTRAINT "stock_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."stock_movements" ADD CONSTRAINT "stock_movements_stockItemId_fkey" FOREIGN KEY ("stockItemId") REFERENCES "public"."stock_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."nutritional_info" ADD CONSTRAINT "nutritional_info_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_records" ADD CONSTRAINT "price_records_productId_fkey" FOREIGN KEY ("productId") REFERENCES "public"."products"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."price_records" ADD CONSTRAINT "price_records_marketId_fkey" FOREIGN KEY ("marketId") REFERENCES "public"."markets"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."session" ADD CONSTRAINT "session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."account" ADD CONSTRAINT "account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."passkey" ADD CONSTRAINT "passkey_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."twoFactor" ADD CONSTRAINT "twoFactor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
