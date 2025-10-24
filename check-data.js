const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkData() {
  try {
    console.log('Verificando dados no banco...')

    const userCount = await prisma.user.count()
    console.log(`Usuários: ${userCount}`)

    const purchaseCount = await prisma.purchase.count()
    console.log(`Compras: ${purchaseCount}`)

    const productCount = await prisma.product.count()
    console.log(`Produtos: ${productCount}`)

    const marketCount = await prisma.market.count()
    console.log(`Mercados: ${marketCount}`)

    if (userCount > 0) {
      console.log('✅ Dados ainda estão no banco!')
    } else {
      console.log('❌ Banco foi resetado - dados perdidos')
    }

  } catch (error) {
    console.error('Erro ao verificar dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkData()
