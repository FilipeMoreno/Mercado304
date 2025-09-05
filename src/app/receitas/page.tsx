// src/app/receitas/page.tsx
import API_BASE_URL from "@/lib/api";
import { ReceitasClient } from "./receitas-client";

async function fetchInitialData() {
  const [recipesRes, productsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/recipes`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/products`, { cache: 'no-store' })
  ]);
  
  const recipes = await recipesRes.json();
  const productsData = await productsRes.json();
  
  return { recipes, products: productsData.products || [] };
}

export default async function ReceitasPage() {
  const { recipes, products } = await fetchInitialData();

  return (
    <ReceitasClient
      initialRecipes={recipes}
      allProducts={products}
    />
  );
}