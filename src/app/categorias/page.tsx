import { CategoriasClient } from "./categorias-client";

interface CategoriasPageProps {
  searchParams: {
    search?: string;
    sort?: string;
    page?: string;
  };
}

async function fetchCategories(searchParams: CategoriasPageProps["searchParams"]) {
  const params = new URLSearchParams({
    search: searchParams.search || '',
    sort: searchParams.sort || 'name',
    page: searchParams.page || '1',
    limit: '12'
  });
  
  const response = await fetch(`http://localhost:3000/api/categories?${params.toString()}`, { cache: 'no-store' });
  const categoriesData = await response.json();
  return categoriesData;
}

export default async function CategoriasPage({ searchParams }: CategoriasPageProps) {
  const categoriesData = await fetchCategories(searchParams);

  return <CategoriasClient categoriesData={categoriesData} searchParams={searchParams} />;
}