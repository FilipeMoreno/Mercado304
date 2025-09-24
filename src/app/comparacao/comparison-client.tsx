"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TempStorage } from "@/lib/temp-storage"
import type { ShoppingList } from "@/types"
import { DetailedComparisonTab } from "./components/detailed-comparison-tab"
import { ListComparisonTab } from "./components/list-comparison-tab"
import { ProductComparisonTab } from "./components/product-comparison-tab"

interface ComparisonClientProps {
	initialLists: ShoppingList[]
	initialMarkets: any[]
	initialProducts: any[]
	searchParams: {
		lista?: string
	}
}

export function ComparisonClient({
	initialLists,
	initialMarkets,
	initialProducts,
	searchParams,
}: ComparisonClientProps) {
	const nextSearchParams = useSearchParams()
	const listaParam = searchParams.lista
	const [activeTab, setActiveTab] = useState(listaParam ? "lista" : "produto")
	const [lists, _setLists] = useState<ShoppingList[]>(initialLists)
	const [markets, _setMarkets] = useState<any[]>(initialMarkets)
	const [products, _setProducts] = useState<any[]>(initialProducts)

	// Estados para ProductComparisonTab
	const [selectedProductId, setSelectedProductId] = useState("")

	// Estados para ListComparisonTab
	const [selectedListId, setSelectedListId] = useState("")

	// Estados para DetailedComparisonTab
	const [detailedListId, setDetailedListId] = useState("")
	const [selectedMarketIds, setSelectedMarketIds] = useState<string[]>([])

	useEffect(() => {
		if (listaParam && lists.length > 0) {
			setSelectedListId(listaParam)
			setDetailedListId(listaParam)
		}
	}, [listaParam, lists])

	useEffect(() => {
		const storageKey = nextSearchParams.get("storageKey")
		if (storageKey) {
			const preservedData = TempStorage.get(storageKey)
			if (preservedData) {
				try {
					if (preservedData.selectedProductId) {
						setSelectedProductId(preservedData.selectedProductId)
					}
					if (preservedData.selectedListId) {
						setSelectedListId(preservedData.selectedListId)
					}
					if (preservedData.activeTab) {
						setActiveTab(preservedData.activeTab)
					}
					if (preservedData.newProductId) {
						setTimeout(() => {
							setSelectedProductId(preservedData.newProductId)
						}, 1000)
					}
					TempStorage.remove(storageKey)
					window.history.replaceState({}, "", "/comparacao")
				} catch (error) {
					console.error("Erro ao restaurar dados:", error)
					TempStorage.remove(storageKey)
				}
			}
		}
	}, [nextSearchParams])

	return (
		<div className="space-y-6">
			<Tabs value={activeTab} onValueChange={setActiveTab}>
				<TabsList className="grid w-full grid-cols-1 sm:grid-cols-3 gap-1 h-auto">
					<TabsTrigger value="produto" className="text-xs sm:text-sm py-2 px-3">
						<span className="hidden sm:inline">Por Produto</span>
						<span className="sm:hidden">Produto</span>
					</TabsTrigger>
					<TabsTrigger value="lista" className="text-xs sm:text-sm py-2 px-3">
						<span className="hidden sm:inline">Resumo da Lista</span>
						<span className="sm:hidden">Lista</span>
					</TabsTrigger>
					<TabsTrigger value="detalhada" className="text-xs sm:text-sm py-2 px-3">
						<span className="hidden sm:inline">Comparação Detalhada</span>
						<span className="sm:hidden">Detalhada</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="produto" className="space-y-6">
					<ProductComparisonTab
						products={products}
						selectedProductId={selectedProductId}
						onProductChange={setSelectedProductId}
						preserveFormData={{
							selectedProductId,
							selectedListId,
							activeTab,
							returnContext: "comparacao",
						}}
					/>
				</TabsContent>

				<TabsContent value="lista" className="space-y-6">
					<ListComparisonTab selectedListId={selectedListId} onListChange={setSelectedListId} />
				</TabsContent>

				<TabsContent value="detalhada" className="space-y-6">
					<DetailedComparisonTab
						markets={markets}
						detailedListId={detailedListId}
						onDetailedListChange={setDetailedListId}
						selectedMarketIds={selectedMarketIds}
						onSelectedMarketIdsChange={setSelectedMarketIds}
					/>
				</TabsContent>
			</Tabs>
		</div>
	)
}
