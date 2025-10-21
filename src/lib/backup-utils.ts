import { prisma } from "./prisma"

/**
 * Gera backup do banco de dados usando Prisma
 * Alternativa ao pg_dump para ambientes sem acesso a binários
 */
export async function generatePrismaBackup(): Promise<string> {
	const sqlStatements: string[] = []

	// Header do backup
	sqlStatements.push("-- Mercado304 Database Backup")
	sqlStatements.push(`-- Generated at: ${new Date().toISOString()}`)
	sqlStatements.push("-- Generated using Prisma\n")
	sqlStatements.push("BEGIN;\n")

	try {
		// Desabilitar checks temporariamente
		sqlStatements.push("SET CONSTRAINTS ALL DEFERRED;\n")

		// 1. Backup de Markets
		const markets = await prisma.market.findMany()
		if (markets.length > 0) {
			sqlStatements.push("-- Markets")
			for (const market of markets) {
				sqlStatements.push(
					`INSERT INTO markets (id, name, "legalName", location, "createdAt", "updatedAt") VALUES (${escapeValue(market.id)}, ${escapeValue(market.name)}, ${escapeValue(market.legalName)}, ${escapeValue(market.location)}, ${escapeValue(market.createdAt)}, ${escapeValue(market.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 2. Backup de Brands
		const brands = await prisma.brand.findMany()
		if (brands.length > 0) {
			sqlStatements.push("-- Brands")
			for (const brand of brands) {
				sqlStatements.push(
					`INSERT INTO brands (id, name, "createdAt", "updatedAt") VALUES (${escapeValue(brand.id)}, ${escapeValue(brand.name)}, ${escapeValue(brand.createdAt)}, ${escapeValue(brand.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 3. Backup de Categories
		const categories = await prisma.category.findMany()
		if (categories.length > 0) {
			sqlStatements.push("-- Categories")
			for (const category of categories) {
				sqlStatements.push(
					`INSERT INTO categories (id, name, icon, color, "isFood", "createdAt", "updatedAt") VALUES (${escapeValue(category.id)}, ${escapeValue(category.name)}, ${escapeValue(category.icon)}, ${escapeValue(category.color)}, ${category.isFood}, ${escapeValue(category.createdAt)}, ${escapeValue(category.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 4. Backup de Products
		const products = await prisma.product.findMany()
		if (products.length > 0) {
			sqlStatements.push("-- Products")
			for (const product of products) {
				sqlStatements.push(
					`INSERT INTO products (id, name, barcode, "categoryId", "brandId", unit, "packageSize", "hasStock", "minStock", "maxStock", "hasExpiration", "defaultShelfLifeDays", "isKit", "createdAt", "updatedAt") VALUES (${escapeValue(product.id)}, ${escapeValue(product.name)}, ${escapeValue(product.barcode)}, ${escapeValue(product.categoryId)}, ${escapeValue(product.brandId)}, ${escapeValue(product.unit)}, ${escapeValue(product.packageSize)}, ${product.hasStock}, ${escapeNumber(product.minStock)}, ${escapeNumber(product.maxStock)}, ${product.hasExpiration}, ${escapeNumber(product.defaultShelfLifeDays)}, ${product.isKit}, ${escapeValue(product.createdAt)}, ${escapeValue(product.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 5. Backup de Purchases
		const purchases = await prisma.purchase.findMany()
		if (purchases.length > 0) {
			sqlStatements.push("-- Purchases")
			for (const purchase of purchases) {
				sqlStatements.push(
					`INSERT INTO purchases (id, "marketId", "totalAmount", "totalDiscount", "finalAmount", "purchaseDate", "paymentMethod", "createdAt", "updatedAt") VALUES (${escapeValue(purchase.id)}, ${escapeValue(purchase.marketId)}, ${purchase.totalAmount}, ${escapeNumber(purchase.totalDiscount)}, ${escapeNumber(purchase.finalAmount)}, ${escapeValue(purchase.purchaseDate)}, ${escapeValue(purchase.paymentMethod)}, ${escapeValue(purchase.createdAt)}, ${escapeValue(purchase.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 6. Backup de PurchaseItems
		const purchaseItems = await prisma.purchaseItem.findMany()
		if (purchaseItems.length > 0) {
			sqlStatements.push("-- Purchase Items")
			for (const item of purchaseItems) {
				sqlStatements.push(
					`INSERT INTO purchase_items (id, "purchaseId", "productId", quantity, "unitPrice", "unitDiscount", "totalPrice", "totalDiscount", "finalPrice", "productName", "productUnit", "productCategory", "brandName", "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.purchaseId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.unitPrice}, ${escapeNumber(item.unitDiscount)}, ${item.totalPrice}, ${escapeNumber(item.totalDiscount)}, ${item.finalPrice}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.productCategory)}, ${escapeValue(item.brandName)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 7. Backup de ShoppingLists
		const shoppingLists = await prisma.shoppingList.findMany()
		if (shoppingLists.length > 0) {
			sqlStatements.push("-- Shopping Lists")
			for (const list of shoppingLists) {
				sqlStatements.push(
					`INSERT INTO shopping_lists (id, name, "isActive", "createdAt", "updatedAt") VALUES (${escapeValue(list.id)}, ${escapeValue(list.name)}, ${list.isActive}, ${escapeValue(list.createdAt)}, ${escapeValue(list.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 8. Backup de ShoppingListItems
		const shoppingListItems = await prisma.shoppingListItem.findMany()
		if (shoppingListItems.length > 0) {
			sqlStatements.push("-- Shopping List Items")
			for (const item of shoppingListItems) {
				sqlStatements.push(
					`INSERT INTO shopping_list_items (id, "listId", "productId", quantity, "isChecked", "estimatedPrice", "productName", "productUnit", barcode, brand, category, notes, "createdAt", "updatedAt") VALUES (${escapeValue(item.id)}, ${escapeValue(item.listId)}, ${escapeValue(item.productId)}, ${item.quantity}, ${item.isChecked}, ${escapeNumber(item.estimatedPrice)}, ${escapeValue(item.productName)}, ${escapeValue(item.productUnit)}, ${escapeValue(item.barcode)}, ${escapeValue(item.brand)}, ${escapeValue(item.category)}, ${escapeValue(item.notes)}, ${escapeValue(item.createdAt)}, ${escapeValue(item.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// 9. Backup de PriceRecords
		const priceRecords = await prisma.priceRecord.findMany()
		if (priceRecords.length > 0) {
			sqlStatements.push("-- Price Records")
			for (const record of priceRecords) {
				sqlStatements.push(
					`INSERT INTO price_records (id, "productId", "marketId", price, "recordDate", notes, "createdAt", "updatedAt") VALUES (${escapeValue(record.id)}, ${escapeValue(record.productId)}, ${escapeValue(record.marketId)}, ${record.price}, ${escapeValue(record.recordDate)}, ${escapeValue(record.notes)}, ${escapeValue(record.createdAt)}, ${escapeValue(record.updatedAt)}) ON CONFLICT (id) DO NOTHING;`,
				)
			}
			sqlStatements.push("")
		}

		// Footer do backup
		sqlStatements.push("COMMIT;")
		sqlStatements.push(`\n-- Backup completed at: ${new Date().toISOString()}`)

		return sqlStatements.join("\n")
	} catch (error) {
		sqlStatements.push("ROLLBACK;")
		throw error
	}
}

/**
 * Escapa valores para SQL
 */
function escapeValue(value: string | number | Date | null | undefined): string {
	if (value === null || value === undefined) {
		return "NULL"
	}

	if (value instanceof Date) {
		return `'${value.toISOString()}'`
	}

	if (typeof value === "string") {
		return `'${value.replace(/'/g, "''")}'`
	}

	return `'${String(value)}'`
}

/**
 * Escapa números para SQL
 */
function escapeNumber(value: number | null | undefined): string {
	if (value === null || value === undefined) {
		return "NULL"
	}
	return String(value)
}
