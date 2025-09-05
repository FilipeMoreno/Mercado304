import API_BASE_URL from "@/lib/api";
import { ComparisonClient } from "./comparison-client";

async function fetchInitialData() {
  const [listsRes, marketsRes, productsRes] = await Promise.all([
    fetch(`${API_BASE_URL}/shopping-lists`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/markets`, { cache: 'no-store' }),
    fetch(`${API_BASE_URL}/products`, { cache: 'no-store' })
  ]);
  
  const [lists, marketsData, products] = await Promise.all([
    listsRes.json(),
    marketsRes.json(),
    productsRes.json()
  ]);
  
  // Extrair o array 'markets' do objeto de resposta
  const markets = marketsData.markets || [];
  
  return { lists, markets, products };
}

export default async function ComparacaoPage({ searchParams }: { searchParams: { lista?: string } }) {
  const { lists, markets, products } = await fetchInitialData();

  return (
    <ComparisonClient
      initialLists={lists}
      initialMarkets={markets}
      initialProducts={products}
      searchParams={searchParams}
    />
  );
}