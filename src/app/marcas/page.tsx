import API_BASE_URL from "@/lib/api";
import { MarcasClient } from "./marcas-client";

interface MarcasPageProps {
  searchParams: {
    search?: string;
    sort?: string;
    page?: string;
  };
}

async function fetchBrands(searchParams: MarcasPageProps["searchParams"]) {
  const params = new URLSearchParams();
  if (searchParams.search) params.set('search', searchParams.search);
  if (searchParams.sort) params.set('sort', searchParams.sort);
  if (searchParams.page) params.set('page', searchParams.page);
  params.set('itemsPerPage', '12');

  const response = await fetch(`${API_BASE_URL}/brands?${params.toString()}`, { cache: 'no-store' });
  const data = await response.json();
  

  return { brands: data.brands, totalCount: data.totalCount };
}

export default async function MarcasPage({ searchParams }: MarcasPageProps) {
  const { brands, totalCount } = await fetchBrands(searchParams);

  return (
    <div className="space-y-6">
      <MarcasClient 
        initialBrands={brands}
        initialTotalCount={totalCount}
        searchParams={searchParams}
      />
    </div>
  );
}