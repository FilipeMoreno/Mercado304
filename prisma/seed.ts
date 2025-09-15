import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const categories = [
  // === ALIMENTOS ===
  
  // --- AÇOUGUE E CARNES ---
  { name: 'Carnes Bovinas', icon: '🐄', color: '#dc2626', isFood: true },
  { name: 'Carnes Suínas', icon: '🐷', color: '#ef4444', isFood: true },
  { name: 'Frango e Aves', icon: '🐔', color: '#f59e0b', isFood: true },
  { name: 'Linguiças e Embutidos', icon: '🌭', color: '#f87171', isFood: true },
  { name: 'Peixes e Frutos do Mar', icon: '🐟', color: '#3b82f6', isFood: true },
  
  // --- HORTIFRÚTI ---
  { name: 'Frutas', icon: '🍎', color: '#ef4444', isFood: true },
  { name: 'Verduras e Legumes', icon: '🥬', color: '#16a34a', isFood: true },
  { name: 'Tubérculos', icon: '🥔', color: '#ca8a04', isFood: true },
  { name: 'Temperos Frescos', icon: '🌿', color: '#059669', isFood: true },
  
  // --- LATICÍNIOS ---
  { name: 'Leite e Derivados', icon: '🥛', color: '#60a5fa', isFood: true },
  { name: 'Queijos', icon: '🧀', color: '#f97316', isFood: true },
  { name: 'Iogurtes', icon: '🍦', color: '#8b5cf6', isFood: true },
  { name: 'Manteiga e Margarina', icon: '🧈', color: '#facc15', isFood: true },
  { name: 'Ovos', icon: '🥚', color: '#fef3c7', isFood: true },
  
  // --- PADARIA ---
  { name: 'Pães', icon: '🍞', color: '#d97706', isFood: true },
  { name: 'Bolos e Tortas', icon: '🎂', color: '#ec4899', isFood: true },
  { name: 'Biscoitos e Bolachas', icon: '🍪', color: '#f472b6', isFood: true },
  
  // --- MERCEARIA BÁSICA ---
  { name: 'Arroz', icon: '🍚', color: '#9ca3af', isFood: true },
  { name: 'Feijão e Leguminosas', icon: '🫘', color: '#78350f', isFood: true },
  { name: 'Massas', icon: '🍝', color: '#f59e0b', isFood: true },
  { name: 'Farinhas', icon: '🌾', color: '#ca8a04', isFood: true },
  { name: 'Açúcar e Adoçantes', icon: '🍯', color: '#fbbf24', isFood: true },
  { name: 'Sal e Temperos', icon: '🧂', color: '#6b7280', isFood: true },
  
  // --- ÓLEOS E CONDIMENTOS ---
  { name: 'Óleos e Azeites', icon: '🫒', color: '#84cc16', isFood: true },
  { name: 'Molhos e Condimentos', icon: '🌶️', color: '#dc2626', isFood: true },
  { name: 'Vinagres', icon: '🍾', color: '#365314', isFood: true },
  
  // --- ENLATADOS ---
  { name: 'Conservas e Enlatados', icon: '🥫', color: '#ef4444', isFood: true },
  { name: 'Molhos de Tomate', icon: '🍅', color: '#dc2626', isFood: true },
  
  // --- BEBIDAS NÃO ALCOÓLICAS ---
  { name: 'Refrigerantes', icon: '🥤', color: '#2563eb', isFood: true },
  { name: 'Sucos', icon: '🧃', color: '#f59e0b', isFood: true },
  { name: 'Água', icon: '💧', color: '#06b6d4', isFood: true },
  { name: 'Energéticos e Isotônicos', icon: '⚡', color: '#facc15', isFood: true },
  
  // --- BEBIDAS QUENTES ---
  { name: 'Café', icon: '☕', color: '#a16207', isFood: true },
  { name: 'Chás', icon: '🍵', color: '#65a30d', isFood: true },
  { name: 'Achocolatados', icon: '🍫', color: '#78350f', isFood: true },
  
  // --- BEBIDAS ALCOÓLICAS ---
  { name: 'Cervejas', icon: '🍺', color: '#6d28d9', isFood: true },
  { name: 'Vinhos', icon: '🍷', color: '#a21caf', isFood: true },
  { name: 'Destilados', icon: '🥃', color: '#831843', isFood: true },
  
  // --- MATINAIS ---
  { name: 'Cereais', icon: '🥣', color: '#ca8a04', isFood: true },
  { name: 'Geleias e Cremes', icon: '🍯', color: '#d97706', isFood: true },
  
  // --- DOCES ---
  { name: 'Chocolates', icon: '🍫', color: '#db2777', isFood: true },
  { name: 'Balas e Doces', icon: '🍭', color: '#86198f', isFood: true },
  
  // --- SNACKS ---
  { name: 'Salgadinhos', icon: '🥔', color: '#ea580c', isFood: true },
  { name: 'Castanhas e Nuts', icon: '🥜', color: '#d97706', isFood: true },
  
  // --- CONGELADOS ---
  { name: 'Sorvetes', icon: '🍨', color: '#8b5cf6', isFood: true },
  { name: 'Congelados', icon: '🧊', color: '#0284c7', isFood: true },
  
  // --- ESPECIAIS ---
  { name: 'Produtos Diet/Light', icon: '🏃‍♀️', color: '#059669', isFood: true },
  { name: 'Orgânicos', icon: '🌱', color: '#15803d', isFood: true },
  { name: 'Produtos Infantis', icon: '👶', color: '#f472b6', isFood: true },
  { name: 'Comidas Prontas', icon: '🍲', color: '#facc15', isFood: true },
  
  // === NÃO ALIMENTOS ===
  
  // --- LIMPEZA ---
  { name: 'Produtos de Limpeza', icon: '🧽', color: '#0891b2', isFood: false },
  { name: 'Papel Higiênico', icon: '🧻', color: '#6b7280', isFood: false },
  { name: 'Detergentes', icon: '🧴', color: '#06b6d4', isFood: false },
  
  // --- HIGIENE PESSOAL ---
  { name: 'Shampoo e Condicionador', icon: '🧴', color: '#115e59', isFood: false },
  { name: 'Sabonetes', icon: '🧼', color: '#0f766e', isFood: false },
  { name: 'Pasta de Dente', icon: '🦷', color: '#134e4a', isFood: false },
  { name: 'Desodorantes', icon: '💨', color: '#06b6d4', isFood: false },
  
  // --- CUIDADOS FEMININOS ---
  { name: 'Absorventes', icon: '🌸', color: '#ec4899', isFood: false },
  { name: 'Fraldas', icon: '👶', color: '#ec4899', isFood: false },
  
  // --- UTILIDADES ---
  { name: 'Pilhas e Baterias', icon: '🔋', color: '#64748b', isFood: false },
  { name: 'Utensílios Domésticos', icon: '🍴', color: '#4f46e5', isFood: false },
  
  // --- PET SHOP ---
  { name: 'Ração para Pets', icon: '🐾', color: '#be185d', isFood: false },
  { name: 'Brinquedos Pet', icon: '🧸', color: '#e879f9', isFood: false },
  
  // --- FARMÁCIA ---
  { name: 'Medicamentos', icon: '💊', color: '#ea580c', isFood: false },
  { name: 'Primeiros Socorros', icon: '🩹', color: '#fb923c', isFood: false },
  
  // --- OUTROS ---
  { name: 'Eletrônicos', icon: '🔌', color: '#334155', isFood: false },
  { name: 'Brinquedos', icon: '🎲', color: '#f43f5e', isFood: false },
  { name: 'Artigos de Festa', icon: '🎉', color: '#ec4899', isFood: false },
  { name: 'Jardinagem', icon: '🌸', color: '#fb7185', isFood: false },
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