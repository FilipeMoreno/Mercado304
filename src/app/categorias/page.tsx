import API_BASE_URL from "@/lib/api";
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
  
  const response = await fetch(`${API_BASE_URL}/categories?${params.toString()}`, { cache: 'no-store' });
  const categoriesData = await response.json();
  return categoriesData;
}

export default async function CategoriasPage({ searchParams }: CategoriasPageProps) {
  const categoriesData = await fetchCategories(searchParams);

  return <CategoriasClient categoriesData={categoriesData} searchParams={searchParams} />;
}