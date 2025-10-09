"use client"

import React, { useState } from "react"
import { Check, Lightbulb, Loader2, Plus, Sparkles, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export interface ProductSuggestion {
	id: string
	name: string
	category: string
	reason: string
	confidence: number
	isMatched: boolean
	matchedProductId?: string
	matchedProductName?: string
}

interface ProductSuggestionsDialogProps {
	isOpen: boolean
	onClose: () => void
	currentItems: any[]
	onAddSuggestions: (suggestions: ProductSuggestion[]) => void
}

export function ProductSuggestionsDialog({
	isOpen,
	onClose,
	currentItems,
	onAddSuggestions,
}: ProductSuggestionsDialogProps) {
	const [isLoading, setIsLoading] = useState(false)
	const [suggestions, setSuggestions] = useState<ProductSuggestion[]>([])
	const [selectedSuggestions, setSelectedSuggestions] = useState<Set<string>>(new Set())
	const [hasAnalyzed, setHasAnalyzed] = useState(false)

	const handleAnalyze = async () => {
		setIsLoading(true)
		try {
			const response = await fetch("/api/ai/suggest-products", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					items: currentItems,
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao buscar sugestões")
			}

			const result = await response.json()
			setSuggestions(result.suggestions || [])
			setHasAnalyzed(true)

			if (result.suggestions?.length > 0) {
				toast.success(`${result.suggestions.length} produtos sugeridos!`)
			} else {
				toast.info("Nenhuma sugestão adicional no momento.")
			}
		} catch (error) {
			console.error("Erro ao buscar sugestões:", error)
			toast.error("Erro ao buscar sugestões de produtos")
		} finally {
			setIsLoading(false)
		}
	}

	const toggleSuggestion = (suggestionId: string) => {
		const newSelected = new Set(selectedSuggestions)
		if (newSelected.has(suggestionId)) {
			newSelected.delete(suggestionId)
		} else {
			newSelected.add(suggestionId)
		}
		setSelectedSuggestions(newSelected)
	}

	const handleSelectAll = () => {
		if (selectedSuggestions.size === suggestions.length) {
			setSelectedSuggestions(new Set())
		} else {
			setSelectedSuggestions(new Set(suggestions.map(s => s.id)))
		}
	}

	const handleAddSelected = () => {
		const selectedItems = suggestions.filter(s => selectedSuggestions.has(s.id))
		if (selectedItems.length === 0) {
			toast.error("Selecione pelo menos um produto")
			return
		}

		onAddSuggestions(selectedItems)
		handleClose()
		toast.success(`${selectedItems.length} produtos adicionados à lista!`)
	}

	const handleClose = () => {
		setSuggestions([])
		setSelectedSuggestions(new Set())
		setHasAnalyzed(false)
		onClose()
	}

	const getConfidenceColor = (confidence: number) => {
		if (confidence >= 0.8) return "text-green-600"
		if (confidence >= 0.6) return "text-yellow-600"
		return "text-orange-600"
	}

	const getConfidenceLabel = (confidence: number) => {
		if (confidence >= 0.8) return "Alta"
		if (confidence >= 0.6) return "Média"
		return "Baixa"
	}

	return (
		<ResponsiveFormDialog
			open={isOpen}
			onOpenChange={(open) => !open && handleClose()}
			title="Sugestões Inteligentes"
			description="A IA pode analisar sua lista e sugerir produtos complementares que você pode ter esquecido."
			maxWidth="2xl"
		>
			{/* Estado inicial - Botão de análise */}
			{!hasAnalyzed && !isLoading && (
				<div className="text-center py-8">
					<div className="mx-auto w-16 h-16 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center mb-4">
						<Sparkles className="h-8 w-8 text-white" />
					</div>
					<h3 className="text-lg font-semibold mb-2">Descubra produtos complementares</h3>
					<p className="text-sm text-muted-foreground mb-6">
						Nossa IA analisará sua lista atual e sugerirá produtos que combinam com suas compras.
					</p>
					<Button onClick={handleAnalyze} size="lg" className="gap-2">
						<Lightbulb className="h-5 w-5" />
						Analisar Lista e Sugerir Produtos
					</Button>
				</div>
			)}

			{/* Estado de loading */}
			{isLoading && (
				<div className="text-center py-8">
					<Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-primary" />
					<p className="text-gray-600">Analisando sua lista...</p>
					<p className="text-sm text-gray-500">A IA está identificando produtos complementares</p>
				</div>
			)}

			{/* Resultados das sugestões */}
			{hasAnalyzed && !isLoading && suggestions.length > 0 && (
				<>
					{/* Cabeçalho com ações */}
					<div className="flex items-center justify-between mb-4 pb-3 border-b">
						<div>
							<p className="text-sm font-medium">
								{suggestions.length} produtos sugeridos
							</p>
							<p className="text-xs text-muted-foreground">
								{selectedSuggestions.size} selecionados
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={handleSelectAll}
						>
							{selectedSuggestions.size === suggestions.length ? (
								<>
									<X className="h-4 w-4 mr-1" />
									Desmarcar Todos
								</>
							) : (
								<>
									<Check className="h-4 w-4 mr-1" />
									Selecionar Todos
								</>
							)}
						</Button>
					</div>

					{/* Lista de sugestões */}
					<div className="space-y-3 max-h-[50vh] overflow-y-auto">
						{suggestions.map((suggestion) => {
							const isSelected = selectedSuggestions.has(suggestion.id)
							return (
								<div
									key={suggestion.id}
									onClick={() => toggleSuggestion(suggestion.id)}
									className={cn(
										"p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
										isSelected ? "border-primary bg-primary/5 shadow-sm" : "border-gray-200"
									)}
								>
									<div className="flex items-start gap-3">
										{/* Checkbox visual */}
										<div className={cn(
											"mt-1 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0",
											isSelected ? "bg-primary border-primary" : "border-gray-300"
										)}>
											{isSelected && <Check className="h-3 w-3 text-white" />}
										</div>

										{/* Conteúdo */}
										<div className="flex-1 min-w-0">
											<div className="flex items-start justify-between gap-2 mb-1">
												<div className="flex-1">
													<h4 className="font-semibold text-sm">
														{suggestion.matchedProductName || suggestion.name}
													</h4>
													<p className="text-xs text-muted-foreground">
														{suggestion.category}
													</p>
												</div>
												<Badge
													variant="outline"
													className={cn("text-xs", getConfidenceColor(suggestion.confidence))}
												>
													{getConfidenceLabel(suggestion.confidence)}
												</Badge>
											</div>

											{/* Razão da sugestão */}
											<div className="flex items-start gap-1 mt-2">
												<Lightbulb className="h-3 w-3 text-amber-500 mt-0.5 flex-shrink-0" />
												<p className="text-xs text-gray-600">{suggestion.reason}</p>
											</div>

											{/* Status de matching */}
											{suggestion.isMatched && (
												<div className="flex items-center gap-1 mt-2 text-green-600">
													<Check className="h-3 w-3" />
													<span className="text-xs">Produto encontrado no sistema</span>
												</div>
											)}
											{!suggestion.isMatched && (
												<div className="flex items-center gap-1 mt-2 text-blue-600">
													<Plus className="h-3 w-3" />
													<span className="text-xs">Será criado como temporário</span>
												</div>
											)}
										</div>
									</div>
								</div>
							)
						})}
					</div>

					{/* Footer com botões */}
					<div className="flex gap-3 justify-end mt-6 pt-4 border-t">
						<Button variant="outline" onClick={handleClose}>
							Cancelar
						</Button>
						<Button
							onClick={handleAddSelected}
							disabled={selectedSuggestions.size === 0}
						>
							<Plus className="h-4 w-4 mr-1" />
							Adicionar {selectedSuggestions.size > 0 ? `(${selectedSuggestions.size})` : "Selecionados"}
						</Button>
					</div>
				</>
			)}

			{/* Estado vazio */}
			{hasAnalyzed && !isLoading && suggestions.length === 0 && (
				<div className="text-center py-8">
					<div className="mx-auto w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
						<Check className="h-8 w-8 text-gray-400" />
					</div>
					<h3 className="text-lg font-semibold mb-2">Lista completa!</h3>
					<p className="text-sm text-muted-foreground mb-6">
						Não encontramos sugestões adicionais para sua lista no momento.
					</p>
					<Button variant="outline" onClick={handleClose}>
						Fechar
					</Button>
				</div>
			)}
		</ResponsiveFormDialog>
	)
}
