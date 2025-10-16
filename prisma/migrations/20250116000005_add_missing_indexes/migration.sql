-- Migration: Add missing indexes for performance
-- SAFE FOR PRODUCTION: Uses IF NOT EXISTS and only creates indexes

-- Product indexes
CREATE INDEX IF NOT EXISTS "products_name_idx" ON "products"("name");
CREATE INDEX IF NOT EXISTS "products_categoryId_idx" ON "products"("categoryId");
CREATE INDEX IF NOT EXISTS "products_brandId_idx" ON "products"("brandId");
CREATE INDEX IF NOT EXISTS "products_hasStock_idx" ON "products"("hasStock");
CREATE INDEX IF NOT EXISTS "products_hasExpiration_idx" ON "products"("hasExpiration");

-- Category indexes
CREATE INDEX IF NOT EXISTS "categories_isFood_idx" ON "categories"("isFood");

-- Purchase indexes
CREATE INDEX IF NOT EXISTS "purchases_purchaseDate_idx" ON "purchases"("purchaseDate");
CREATE INDEX IF NOT EXISTS "purchases_marketId_idx" ON "purchases"("marketId");
CREATE INDEX IF NOT EXISTS "purchases_purchaseDate_marketId_idx" ON "purchases"("purchaseDate", "marketId");

-- PurchaseItem indexes
CREATE INDEX IF NOT EXISTS "purchase_items_purchaseId_idx" ON "purchase_items"("purchaseId");
CREATE INDEX IF NOT EXISTS "purchase_items_productId_idx" ON "purchase_items"("productId");

-- ShoppingListItem indexes
CREATE INDEX IF NOT EXISTS "shopping_list_items_listId_idx" ON "shopping_list_items"("listId");
CREATE INDEX IF NOT EXISTS "shopping_list_items_productId_idx" ON "shopping_list_items"("productId");
CREATE INDEX IF NOT EXISTS "shopping_list_items_isChecked_idx" ON "shopping_list_items"("isChecked");

-- StockItem indexes
CREATE INDEX IF NOT EXISTS "stock_items_productId_idx" ON "stock_items"("productId");
CREATE INDEX IF NOT EXISTS "stock_items_expirationDate_idx" ON "stock_items"("expirationDate");
CREATE INDEX IF NOT EXISTS "stock_items_isExpired_idx" ON "stock_items"("isExpired");
CREATE INDEX IF NOT EXISTS "stock_items_isLowStock_idx" ON "stock_items"("isLowStock");

-- StockHistory indexes
CREATE INDEX IF NOT EXISTS "stock_history_productId_idx" ON "stock_history"("productId");
CREATE INDEX IF NOT EXISTS "stock_history_date_idx" ON "stock_history"("date");
CREATE INDEX IF NOT EXISTS "stock_history_type_idx" ON "stock_history"("type");

-- StockMovement indexes
CREATE INDEX IF NOT EXISTS "stock_movements_stockItemId_idx" ON "stock_movements"("stockItemId");
CREATE INDEX IF NOT EXISTS "stock_movements_date_idx" ON "stock_movements"("date");
CREATE INDEX IF NOT EXISTS "stock_movements_type_idx" ON "stock_movements"("type");

-- WasteRecord indexes
CREATE INDEX IF NOT EXISTS "waste_records_productId_idx" ON "waste_records"("productId");
CREATE INDEX IF NOT EXISTS "waste_records_wasteDate_idx" ON "waste_records"("wasteDate");
CREATE INDEX IF NOT EXISTS "waste_records_wasteReason_idx" ON "waste_records"("wasteReason");

-- ExpirationAlert indexes
CREATE INDEX IF NOT EXISTS "expiration_alerts_productId_idx" ON "expiration_alerts"("productId");
CREATE INDEX IF NOT EXISTS "expiration_alerts_stockItemId_idx" ON "expiration_alerts"("stockItemId");
CREATE INDEX IF NOT EXISTS "expiration_alerts_alertDate_idx" ON "expiration_alerts"("alertDate");
CREATE INDEX IF NOT EXISTS "expiration_alerts_isResolved_idx" ON "expiration_alerts"("isResolved");

-- Session indexes
CREATE INDEX IF NOT EXISTS "session_userId_idx" ON "session"("userId");
CREATE INDEX IF NOT EXISTS "session_expiresAt_idx" ON "session"("expiresAt");

