"use client"

import { Check, Clock, Package, ShoppingCart, Sparkles, Wand2 } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface AutoListItem {
	productId: string
	productName: string
	brandName?: string
	unit: string
	suggestedQuantity: number
	urgency: number
	confidence: number
	daysUntilNext: number
}

interface AutoListData {
	success: boolean
	listType: string
	totalItems: number
	itemsByCategory?: { [category: string]: AutoListItem[] }
	suggestions?: any[] // Tornando opcional
	metadata?: {
		generatedAt: string
		basedOnPurchases: number
		confidence?: number
	}
}

interface AiShoppingListProps {
	onGenerateList: (type: "weekly" | "monthly") => Promise<AutoListData | null>
	onCreateShoppingList: (items: any[]) => Promise<void>
}

export function AiShoppingList({ onGenerateList, onCreateShoppingList }: AiShoppingListProps) {
	const [generatedList, setGeneratedList] = useState<AutoListData | null>(null)
	const [generating, setGenerating] = useState(false)
	const [creating, setCreating] = useState(false)
	const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())

	const handleGenerate = async (type: "weekly" | "monthly") => {
		setGenerating(true)
		try {
			const data = await onGenerateList(type)
			setGeneratedList(data)

			if (data?.itemsByCategory) {
				const highUrgencyItems = new Set<string>()
				Object.values(data.itemsByCategory).forEach((items: AutoListItem[]) => {
					items.forEach((item) => {
						if (item.urgency >= 70) {
							highUrgencyItems.add(item.productId)
						}
					})
				})
				setSelectedItems(highUrgencyItems)
			}
		} catch (error) {
			console.error("Erro ao gerar lista:", error)
		} finally {
			setGenerating(false)
		}
	}

	const toggleItem = (productId: string) => {
		const newSelected = new Set(selectedItems)
		if (newSelected.has(productId)) {
			newSelected.delete(productId)
		} else {
			newSelected.add(productId)
		}
		setSelectedItems(newSelected)
	}

	const handleCreateList = async () => {
		if (!generatedList || selectedItems.size === 0 || !generatedList.itemsByCategory) return

		setCreating(true)
		try {
			const selectedProducts: any[] = []

			Object.entries(generatedList.itemsByCategory).forEach(([category, items]) => {
				;(items as AutoListItem[]).forEach((item) => {
					if (selectedItems.has(item.productId)) {
						selectedProducts.push({
							productId: item.productId,
							quantity: item.suggestedQuantity,
						})
					}
				})
			})

			await onCreateShoppingList(selectedProducts)
			setGeneratedList(null)
			setSelectedItems(new Set())
		} catch (error) {
			console.error("Erro ao criar lista:", error)
		} finally {
			setCreating(false)
		}
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Sparkles className="h-5 w-5 text-blue-500" />
					Lista Inteligente
				</CardTitle>
				<CardDescription>Gere uma lista de compras automaticamente baseada no seu histórico</CardDescription>
			</CardHeader>
			<CardContent className="space-y-4">
				{!generatedList ? (
					<div className="space-y-4">
						<div className="text-center space-y-3">
							<Sparkles className="h-12 w-12 text-blue-500 mx-auto" />
							<p className="text-sm text-gray-600">
								A IA pode gerar uma lista personalizada baseada nos seus padrões de compra
							</p>
						</div>

						<div className="grid grid-cols-2 gap-3">
							<Button
								onClick={() => handleGenerate("weekly")}
								disabled={generating}
								variant="outline"
								className="h-auto py-4 flex flex-col gap-2"
							>
								<Clock className="h-5 w-5" />
								<div className="text-center">
									<div className="font-medium">Lista Semanal</div>
									<div className="text-xs text-gray-500">Essenciais da semana</div>
								</div>
							</Button>

							<Button
								onClick={() => handleGenerate("monthly")}
								disabled={generating}
								variant="outline"
								className="h-auto py-4 flex flex-col gap-2"
							>
								<Package className="h-5 w-5" />
								<div className="text-center">
									<div className="font-medium">Lista Mensal</div>
									<div className="text-xs text-gray-500">Estoque completo</div>
								</div>
							</Button>
						</div>

						{generating && (
							<div className="text-center py-4">
								<div className="inline-flex items-center gap-2 text-blue-600">
									<div className="h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
									<span className="text-sm">Analisando seus padrões...</span>
								</div>
							</div>
						)}
					</div>
				) : (
					<div className="space-y-4">
						<div className="flex items-center justify-between">
							<div>
								<h4 className="font-medium">
									Lista {generatedList.listType === "weekly" ? "Semanal" : "Mensal"} Gerada
								</h4>
								<p className="text-xs text-gray-500">
									{generatedList.totalItems} itens
									{generatedList.metadata?.confidence && ` • ${generatedList.metadata.confidence}% confiança`}
								</p>
							</div>
							<Badge variant="secondary">{selectedItems.size} selecionados</Badge>
						</div>

						<div className="max-h-96 overflow-y-auto space-y-4">
							{generatedList.itemsByCategory &&
								Object.entries(generatedList.itemsByCategory).map(([category, items]) => (
									<div key={category} className="space-y-2">
										<h5 className="font-medium text-sm text-gray-700 bg-gray-100 px-3 py-1 rounded">{category}</h5>

										{(items as AutoListItem[]).map((item) => (
											<div key={item.productId} className="flex items-center gap-3 p-2 border rounded">
												<input
													type="checkbox"
													checked={selectedItems.has(item.productId)}
													onChange={() => toggleItem(item.productId)}
													className="rounded"
												/>

												<div className="flex-1">
													<div className="font-medium text-sm">{item.productName}</div>
													{item.brandName && <div className="text-xs text-gray-500">{item.brandName}</div>}
													<div className="text-xs text-gray-600">
														{item.suggestedQuantity} {item.unit}
														{item.urgency >= 70 && (
															<Badge variant="destructive" className="ml-2 text-xs">
																Urgente
															</Badge>
														)}
													</div>
												</div>

												<div className="text-right text-xs text-gray-500">
													{item.daysUntilNext > 0 ? `${item.daysUntilNext}d` : "Atrasado"}
												</div>
											</div>
										))}
									</div>
								))}
						</div>

						{generatedList && generatedList.suggestions && generatedList.suggestions.length > 0 && (
							<div className="space-y-2">
								<h5 className="font-medium text-sm">Sugestões Extras</h5>
								{generatedList.suggestions.map((suggestion, index) => (
									<div key={index} className="bg-blue-50 border border-blue-200 rounded p-3">
										<div className="font-medium text-sm text-blue-800">{suggestion.title}</div>
										<div className="text-xs text-blue-600">{suggestion.description}</div>
									</div>
								))}
							</div>
						)}

						<div className="flex gap-3 pt-4 border-t">
							<Button onClick={handleCreateList} disabled={selectedItems.size === 0 || creating} className="flex-1">
								{creating ? (
									<div className="flex items-center gap-2">
										<div className="h-4 w-4 border border-white border-t-transparent rounded-full animate-spin"></div>
										Criando Lista...
									</div>
								) : (
									<div className="flex items-center gap-2">
										<Check className="h-4 w-4" />
										Criar Lista ({selectedItems.size} itens)
									</div>
								)}
							</Button>

							<Button
								onClick={() => {
									setGeneratedList(null)
									setSelectedItems(new Set())
								}}
								variant="outline"
							>
								Nova Análise
							</Button>
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
