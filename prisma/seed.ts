import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  // Principais categorias de supermercado
  const categories = [
    { name: 'Frutas e Verduras', icon: '🥕', color: '#10b981' },
    { name: 'Carnes e Aves', icon: '🥩', color: '#dc2626' },
    { name: 'Peixes e Frutos do Mar', icon: '🐟', color: '#0ea5e9' },
    { name: 'Laticínios e Ovos', icon: '🥛', color: '#f59e0b' },
    { name: 'Padaria e Confeitaria', icon: '🍞', color: '#d97706' },
    { name: 'Cereais e Grãos', icon: '🌾', color: '#84cc16' },
    { name: 'Massas e Molhos', icon: '🍝', color: '#eab308' },
    { name: 'Enlatados e Conservas', icon: '🥫', color: '#6b7280' },
    { name: 'Bebidas', icon: '🥤', color: '#3b82f6' },
    { name: 'Bebidas Alcoólicas', icon: '🍺', color: '#7c3aed' },
    { name: 'Doces e Sobremesas', icon: '🍫', color: '#ec4899' },
    { name: 'Snacks e Petiscos', icon: '🍿', color: '#f97316' },
    { name: 'Temperos e Condimentos', icon: '🧄', color: '#059669' },
    { name: 'Óleos e Vinagres', icon: '🫒', color: '#65a30d' },
    { name: 'Produtos de Limpeza', icon: '🧽', color: '#0891b2' },
    { name: 'Higiene Pessoal', icon: '🧴', color: '#7c2d12' },
    { name: 'Produtos para Casa', icon: '🏠', color: '#4338ca' },
    { name: 'Pet Shop', icon: '🐕', color: '#be185d' },
    { name: 'Farmácia', icon: '💊', color: '#dc2626' },
    { name: 'Congelados', icon: '🧊', color: '#0284c7' },
    { name: 'Produtos Importados', icon: '🌍', color: '#7c3aed' },
    { name: 'Produtos Orgânicos', icon: '🌱', color: '#16a34a' },
    { name: 'Produtos Diet/Light', icon: '⚖️', color: '#059669' },
    { name: 'Produtos Infantis', icon: '👶', color: '#f472b6' },
    { name: 'Outros', icon: '📦', color: '#6b7280' }
  ]

  console.log('🌱 Criando categorias...')
  
  for (const categoryData of categories) {
    await prisma.category.upsert({
      where: { name: categoryData.name },
      update: {},
      create: categoryData
    })
  }

  console.log('✅ Seed concluído!')
  console.log(`📊 ${categories.length} categorias criadas/atualizadas`)
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })