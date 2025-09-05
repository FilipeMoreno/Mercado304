import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
    { name: 'Hortifrúti', icon: '🥕', color: '#10b981', isFood: true },
    { name: 'Carnes, Aves e Peixes', icon: '🥩', color: '#dc2626', isFood: true },
    { name: 'Frios e Laticínios', icon: '🧀', color: '#f59e0b', isFood: true },
    { name: 'Padaria e Confeitaria', icon: '🍞', color: '#d97706', isFood: true },
    { name: 'Congelados e Sorvetes', icon: '🧊', color: '#0284c7', isFood: true },
    { name: 'Bebidas', icon: '🥤', color: '#3b82f6', isFood: true },
    { name: 'Bebidas Alcoólicas', icon: '🍺', color: '#7c3aed', isFood: true },
    { name: 'Mercearia', icon: '🥫', color: '#6b7280', isFood: true },
    { name: 'Matinais e Café da Manhã', icon: '☕', color: '#78350f', isFood: true },
    { name: 'Doces e Sobremesas', icon: '🍫', color: '#ec4899', isFood: true },
    { name: 'Snacks e Petiscos', icon: '🍿', color: '#f97316', isFood: true },
    { name: 'Saudáveis e Dietas Especiais', icon: '🌱', color: '#16a34a', isFood: true },
    { name: 'Comidas Prontas e Rotisseria', icon: '🍲', color: '#facc15', isFood: true },
    { name: 'Produtos Infantis', icon: '👶', color: '#f472b6', isFood: true },
    { name: 'Produtos Importados', icon: '🌍', color: '#7c3aed', isFood: true },

    { name: 'Limpeza', icon: '🧽', color: '#0891b2', isFood: false },
    { name: 'Higiene e Perfumaria', icon: '🧴', color: '#0d9488', isFood: false },
    { name: 'Casa e Bazar', icon: '🏠', color: '#4338ca', isFood: false },
    { name: 'Pet Shop', icon: '🐾', color: '#be185d', isFood: false },
    { name: 'Farmácia e Saúde', icon: '💊', color: '#c2410c', isFood: false },
    { name: 'Papelaria e Escritório', icon: '📎', color: '#64748b', isFood: false },
    { name: 'Jardinagem e Floricultura', icon: '🌸', color: '#fb7185', isFood: false },
    { name: 'Automotivo', icon: '🚗', color: '#475569', isFood: false },

    { name: 'Outros', icon: '📦', color: '#6b7280', isFood: false }
];

async function main() {
  console.log(`Iniciando o seed...`);
  for (const category of categories) {
    const newCategory = await prisma.category.upsert({
      where: { name: category.name },
      update: { icon: category.icon, color: category.color, isFood: category.isFood },
      create: category,
    });
    console.log(`Categoria criada ou atualizada: ${newCategory.name}`);
  }
  console.log(`Seed finalizado com sucesso.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });