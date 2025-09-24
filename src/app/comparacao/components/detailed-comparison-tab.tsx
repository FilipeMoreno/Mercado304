"use client"

import { Loader2, Search, ShoppingCart } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"
import { ShoppingListSelect } from "@/components/selects/shopping-list-select"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { MultiSelect } from "@/components/ui/multi-select"
import { DetailedComparisonTable } from "./detailed-comparison-table"

interface DetailedComparison {
	listId: string
	listName: string
	markets: {
		id: string
		name: string
		location?: string
	}[]
	products: {
		product: {
			id: string
			name: string
			brand?: { name: string }
			unit: string
		}
		comparison: {
			marketId: string
			price: number | null
			lastPurchase: string | null
			isCheapest: boolean
			saving: number
		}[]
	}[]
}

interface DetailedComparisonTabProps {
	markets: Array<{
		id: string
		name: string
		location?: string
	}>
	detailedListId: string
	onDetailedListChange: (listId: string) => void
	selectedMarketIds: string[]
	onSelectedMarketIdsChange: (marketIds: string[]) => void
}

export function DetailedComparisonTab({
	markets,
	detailedListId,
	onDetailedListChange,
	selectedMarketIds,
	onSelectedMarketIdsChange,
}: DetailedComparisonTabProps) {
	const [detailedComparison, setDetailedComparison] = useState<DetailedComparison | null>(null)
	const [loadingDetailed, setLoadingDetailed] = useState(false)

	const compareDetailedList = async () => {
		if (!detailedListId) {
			toast.error("Selecione uma lista para comparar")
			return
		}
		if (selectedMarketIds.length < 2) {
			toast.error("Selecione pelo menos 2 mercados para a comparação detalhada")
			return
		}

		setLoadingDetailed(true)
		setDetailedComparison(null)

		try {
			const response = await fetch("/api/price-comparison/detailed-list", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					listId: detailedListId,
					marketIds: selectedMarketIds,
				}),
			})
			if (response.ok) {
				const data = await response.json()
				setDetailedComparison(data)
			} else {
				toast.error("Erro ao buscar comparação detalhada")
			}
		} catch (error) {
			console.error("Erro:", error)
			toast.error("Erro ao comparar lista detalhada")
		} finally {
			setLoadingDetailed(false)
		}
	}

	return (
		<div className="space-y-6">
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Search className="h-5 w-5" />
						Comparar Listas e Mercados
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="detailedListSelect">Selecione uma Lista</Label>
							<ShoppingListSelect
								value={detailedListId}
								onValueChange={onDetailedListChange}
								placeholder="Selecionar lista..."
								className="w-full"
							/>
						</div>
						<div className="space-y-2">
							<Label>Selecione os Mercados</Label>
							<MultiSelect
								options={markets.map((m) => ({
									value: m.id,
									label: `${m.name} - ${m.location}`,
								}))}
								selected={selectedMarketIds}
								onSelectedChange={onSelectedMarketIdsChange}
								placeholder="Selecione mercados..."
							/>
						</div>
					</div>
					<div className="flex justify-end">
						<Button
							onClick={compareDetailedList}
							disabled={loadingDetailed || selectedMarketIds.length < 2 || !detailedListId}
							className="w-full sm:w-auto"
						>
							{loadingDetailed ? <Loader2 className="h-4 w-4 animate-spin" /> : "Comparar Detalhadamente"}
						</Button>
					</div>
				</CardContent>
			</Card>

			{detailedComparison && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<ShoppingCart className="h-5 w-5" />
							{detailedComparison.listName}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<DetailedComparisonTable detailedComparison={detailedComparison} />
					</CardContent>
				</Card>
			)}
		</div>
	)
}
