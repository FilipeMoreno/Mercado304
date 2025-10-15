const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function updateDiscountFields() {
  try {
    console.log('🔄 Atualizando campos de desconto...')

    // Atualizar PurchaseItems
    console.log('📦 Atualizando PurchaseItems...')
    const purchaseItems = await prisma.purchaseItem.findMany({
      include: {
        purchase: true
      }
    })

    let updatedItems = 0
    for (const item of purchaseItems) {
      const totalPrice = item.quantity * item.unitPrice
      const totalDiscount = item.unitDiscount ? item.quantity * item.unitDiscount : 0
      const finalPrice = totalPrice - totalDiscount

      await prisma.purchaseItem.update({
        where: { id: item.id },
        data: {
          totalPrice,
          totalDiscount,
          finalPrice
        }
      })
      updatedItems++
    }

    console.log(`✅ ${updatedItems} PurchaseItems atualizados`)

    // Atualizar Purchases
    console.log('🛒 Atualizando Purchases...')
    const purchases = await prisma.purchase.findMany({
      include: {
        items: true
      }
    })

    let updatedPurchases = 0
    for (const purchase of purchases) {
      // Calcular totalAmount baseado nos itens (caso não esteja correto)
      const calculatedTotalAmount = purchase.items.reduce((sum, item) => {
        return sum + (item.quantity * item.unitPrice)
      }, 0)

      // Calcular totalDiscount baseado nos itens
      const calculatedTotalDiscount = purchase.items.reduce((sum, item) => {
        return sum + (item.totalDiscount || 0)
      }, 0)

      const finalAmount = calculatedTotalAmount - calculatedTotalDiscount

      await prisma.purchase.update({
        where: { id: purchase.id },
        data: {
          totalAmount: calculatedTotalAmount,
          totalDiscount: calculatedTotalDiscount,
          finalAmount
        }
      })
      updatedPurchases++
    }

    console.log(`✅ ${updatedPurchases} Purchases atualizados`)

    console.log('🎉 Atualização concluída com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao atualizar campos de desconto:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updateDiscountFields()
