import { CategoriasClient } from "./categorias-client";

interface CategoriasPageProps {
  searchParams: {
    search?: string;
    sort?: string;
    page?: string;
  };
}

async function fetchCategories(searchParams: CategoriasPageProps["searchParams"]) {
  const params = new URLSearchParams();
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.page) params.set('page', searchParams.page);
  
  const response = await fetch(`http://localhost:3000/api/categories?${params.toString()}`, { cache: 'no-store' });
  const categories = await response.json();
  return categories;
}

export default async function CategoriasPage({ searchParams }: CategoriasPageProps) {
  const categories = await fetchCategories(searchParams);

  return <CategoriasClient initialCategories={categories} searchParams={searchParams} />;
}