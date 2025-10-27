import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

interface MigrationResult {
	total: number
	migrated: number
	skipped: number
	errors: string[]
}

async function migrateBarcodes(dryRun = true): Promise<MigrationResult> {
	const result: MigrationResult = {
		total: 0,
		migrated: 0,
		skipped: 0,
		errors: [],
	}

	console.log("🔍 Starting barcode migration...")
	console.log(`Mode: ${dryRun ? "DRY RUN" : "ACTUAL MIGRATION"}`)
	console.log("=" .repeat(50))

	try {
		// Get all products with non-null barcodes
		const productsWithBarcodes = await prisma.product.findMany({
			where: {
				barcode: {
					not: null,
				},
			},
			select: {
				id: true,
				name: true,
				barcode: true,
				barcodes: {
					select: {
						barcode: true,
						isPrimary: true,
					},
				},
			},
		})

		result.total = productsWithBarcodes.length
		console.log(`\n📦 Found ${result.total} products with barcodes`)

		// Process each product
		for (const product of productsWithBarcodes) {
			const barcode = product.barcode as string

			// Check if barcode already exists in ProductBarcode table
			const existingBarcode = product.barcodes.find((b) => b.barcode === barcode)

			if (existingBarcode) {
				console.log(
					`⏭️  Skipping product "${product.name}" (${product.id}) - barcode already migrated`,
				)
				result.skipped++
				continue
			}

			// Check if this barcode is already used by another product
			const duplicateBarcode = await prisma.productBarcode.findUnique({
				where: { barcode },
				select: { productId: true },
			})

			if (duplicateBarcode && duplicateBarcode.productId !== product.id) {
				const error = `⚠️  Duplicate barcode "${barcode}" for product "${product.name}" (${product.id}) - already used by product ${duplicateBarcode.productId}`
				console.log(error)
				result.errors.push(error)
				result.skipped++
				continue
			}

			if (!dryRun) {
				try {
					// Create ProductBarcode record
					await prisma.productBarcode.create({
						data: {
							productId: product.id,
							barcode,
							isPrimary: true, // Original barcode is always primary
						},
					})

					console.log(
						`✅ Migrated barcode for product "${product.name}" (${product.id}): ${barcode}`,
					)
					result.migrated++
				} catch (error) {
					const errorMsg = `❌ Error migrating barcode for product "${product.name}" (${product.id}): ${error instanceof Error ? error.message : String(error)}`
					console.log(errorMsg)
					result.errors.push(errorMsg)
				}
			} else {
				console.log(
					`📋 Would migrate barcode for product "${product.name}" (${product.id}): ${barcode}`,
				)
				result.migrated++
			}
		}

		console.log("\n" + "=".repeat(50))
		console.log("📊 Migration Summary:")
		console.log(`   Total products: ${result.total}`)
		console.log(`   Migrated: ${result.migrated}`)
		console.log(`   Skipped: ${result.skipped}`)
		console.log(`   Errors: ${result.errors.length}`)

		if (result.errors.length > 0) {
			console.log("\n❌ Errors encountered:")
			result.errors.forEach((error) => console.log(`   ${error}`))
		}

		if (dryRun) {
			console.log("\n💡 This was a DRY RUN - no changes were made")
			console.log("   Run with --execute flag to perform actual migration")
		} else {
			console.log("\n✅ Migration completed!")
		}
	} catch (error) {
		console.error("❌ Fatal error during migration:", error)
		throw error
	} finally {
		await prisma.$disconnect()
	}

	return result
}

// Main execution
const isDryRun = !process.argv.includes("--execute")

migrateBarcodes(isDryRun)
	.then((result) => {
		process.exit(result.errors.length > 0 ? 1 : 0)
	})
	.catch((error) => {
		console.error("Fatal error:", error)
		process.exit(1)
	})
