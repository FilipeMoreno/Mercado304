import { Category } from "@/types";

interface CategoriesResponse {
  categories: Category[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    hasMore: boolean;
  };
}

export const getCategories = async (searchParams?: URLSearchParams): Promise<CategoriesResponse> => {
  const response = await fetch(`/api/categories?${searchParams?.toString() || ''}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error('Erro ao buscar categorias');
  }
  return response.json();
};