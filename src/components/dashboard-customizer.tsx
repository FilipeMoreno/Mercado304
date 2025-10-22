"use client"

import { DragDropContext, Draggable, Droppable, type DropResult } from "@hello-pangea/dnd"
import { Eye, EyeOff, Grid3X3, List, Maximize2, RotateCcw, Settings, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
	type DashboardPreferences,
	useDashboardPreferencesQuery,
	useResetDashboardPreferencesMutation,
	useUpdateDashboardPreferencesMutation,
} from "@/hooks/use-react-query"

// Definição dos cards disponíveis
const availableCards = [
	{
		id: "total-purchases",
		label: "Total de Compras",
		description: "Número total de compras realizadas",
	},
	{
		id: "total-spent",
		label: "Total Gasto",
		description: "Valor total gasto em compras",
	},
	{
		id: "total-products",
		label: "Produtos Cadastrados",
		description: "Número de produtos no sistema",
	},
	{
		id: "total-markets",
		label: "Mercados Cadastrados",
		description: "Número de mercados cadastrados",
	},
	{
		id: "price-records",
		label: "Preços Registrados",
		description: "Total de registros de preços",
	},
]

const cardSections = [
	{
		key: "showSummaryCard",
		label: "Resumo IA",
		description: "Resumo inteligente gerado por IA",
	},
	{
		key: "showMonthlyChart",
		label: "Gráfico Mensal",
		description: "Gráfico de gastos mensais",
	},
	{
		key: "showCategoryStats",
		label: "Estatísticas por Categoria",
		description: "Gastos agrupados por categoria",
	},
	{
		key: "showTopProducts",
		label: "Produtos Mais Comprados",
		description: "Ranking de produtos frequentes",
	},
	{
		key: "showMarketCompare",
		label: "Comparação de Mercados",
		description: "Comparativo de preços entre mercados",
	},
	{
		key: "showRecentBuys",
		label: "Compras Recentes",
		description: "Últimas compras registradas",
	},
	{
		key: "showExpirationAlerts",
		label: "Alertas de Validade",
		description: "Produtos próximos ao vencimento",
	},
	{
		key: "showReplenishment",
		label: "Alertas de Reposição",
		description: "Produtos que precisam ser repostos",
	},
	{
		key: "showSavingsCard",
		label: "Card de Economias",
		description: "Análise de economias e oportunidades",
	},
	{
		key: "showDiscountStats",
		label: "Estatísticas de Descontos",
		description: "Análise dos descontos obtidos nas compras",
	},
	{
		key: "showTemporalComp",
		label: "Comparação Temporal",
		description: "Comparação entre períodos",
	},
	{
		key: "showNutritionCard",
		label: "Resumo Nutricional",
		description: "Informações nutricionais",
	},
	{
		key: "showPaymentStats",
		label: "Estatísticas de Pagamento",
		description: "Análise dos métodos de pagamento",
	},
]

interface DashboardCustomizerProps {
	onPreferencesChange?: (preferences: DashboardPreferences) => void
}

export function DashboardCustomizer({ onPreferencesChange }: DashboardCustomizerProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
	const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)
	const [localPreferences, setLocalPreferences] = useState<DashboardPreferences>({
		cardOrder: ["total-purchases", "total-spent", "total-products", "total-markets", "price-records"],
		hiddenCards: [],
		layoutStyle: "grid",
		cardsPerRow: 5,
		showSummaryCard: true,
		showMonthlyChart: true,
		showCategoryStats: true,
		showTopProducts: true,
		showMarketCompare: true,
		showRecentBuys: true,
		showExpirationAlerts: true,
		showReplenishment: true,
		showSavingsCard: true,
		showDiscountStats: true,
		showTemporalComp: true,
		showNutritionCard: true,
		showPaymentStats: true,
	})

	const { data: preferences, isLoading } = useDashboardPreferencesQuery()
	const updatePreferences = useUpdateDashboardPreferencesMutation()
	const resetPreferences = useResetDashboardPreferencesMutation()

	// Atualizar state local quando as preferências chegarem do servidor
	useEffect(() => {
		if (preferences) {
			setLocalPreferences(preferences)
		}
	}, [preferences])

	const handleDragEnd = (result: DropResult) => {
		if (!result.destination) return

		const items = Array.from(localPreferences.cardOrder)
		const [reorderedItem] = items.splice(result.source.index, 1)
		if (!reorderedItem) return
		items.splice(result.destination.index, 0, reorderedItem)

		const newPreferences = {
			...localPreferences,
			cardOrder: items,
		}
		setLocalPreferences(newPreferences)
		setHasUnsavedChanges(true)
		debouncedSave(newPreferences)
	}

	const toggleCardVisibility = (cardId: string) => {
		const hiddenCards = localPreferences.hiddenCards.includes(cardId)
			? localPreferences.hiddenCards.filter((id) => id !== cardId)
			: [...localPreferences.hiddenCards, cardId]

		const newPreferences = {
			...localPreferences,
			hiddenCards,
		}
		setLocalPreferences(newPreferences)
		setHasUnsavedChanges(true)
		debouncedSave(newPreferences)
	}

	const updateSectionVisibility = (sectionKey: string, visible: boolean) => {
		const newPreferences = {
			...localPreferences,
			[sectionKey]: visible,
		}
		setLocalPreferences(newPreferences)
		setHasUnsavedChanges(true)
		debouncedSave(newPreferences)
	}

	// Auto-save com debounce
	const debouncedSave = useCallback(
		(preferences: DashboardPreferences) => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}

			saveTimeoutRef.current = setTimeout(async () => {
				try {
					await updatePreferences.mutateAsync(preferences)
					setHasUnsavedChanges(false)
					onPreferencesChange?.(preferences)
				} catch (error) {
					console.error("Erro ao salvar preferências:", error)
				}
			}, 1000) // 1 segundo de debounce
		},
		[updatePreferences, onPreferencesChange],
	)

	// Cleanup do timeout ao desmontar
	useEffect(() => {
		return () => {
			if (saveTimeoutRef.current) {
				clearTimeout(saveTimeoutRef.current)
			}
		}
	}, [])

	const _handleSavePreferences = async () => {
		try {
			await updatePreferences.mutateAsync(localPreferences)
			onPreferencesChange?.(localPreferences)
			setIsOpen(false)
		} catch (error) {
			console.error("Erro ao salvar preferências:", error)
		}
	}

	const handleResetPreferences = async () => {
		try {
			await resetPreferences.mutateAsync()
			const defaultPreferences: DashboardPreferences = {
				cardOrder: ["total-purchases", "total-spent", "total-products", "total-markets", "price-records"],
				hiddenCards: [],
				layoutStyle: "grid",
				cardsPerRow: 5,
				showSummaryCard: true,
				showMonthlyChart: true,
				showCategoryStats: true,
				showTopProducts: true,
				showMarketCompare: true,
				showRecentBuys: true,
				showExpirationAlerts: true,
				showReplenishment: true,
				showSavingsCard: true,
				showDiscountStats: true,
				showTemporalComp: true,
				showNutritionCard: true,
				showPaymentStats: true,
			}
			setLocalPreferences(defaultPreferences)
			setHasUnsavedChanges(false)
			onPreferencesChange?.(defaultPreferences)
		} catch (error) {
			console.error("Erro ao resetar preferências:", error)
		}
	}

	if (isLoading) {
		return (
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" size="icon" disabled>
							<Settings className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Carregando...</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>
		)
	}

	return (
		<>
			<TooltipProvider>
				<Tooltip>
					<TooltipTrigger asChild>
						<Button variant="outline" size="icon" onClick={() => setIsOpen(true)}>
							<Settings className="size-4" />
						</Button>
					</TooltipTrigger>
					<TooltipContent>
						<p>Personalizar Dashboard</p>
					</TooltipContent>
				</Tooltip>
			</TooltipProvider>

			<ResponsiveDialog open={isOpen} onOpenChange={setIsOpen} title="Personalizar Dashboard" maxWidth="2xl">
				<div className="max-h-[70vh] overflow-y-auto space-y-6">
					{/* Configurações Gerais */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Configurações Gerais</h3>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="customTitle">Título Personalizado</Label>
								<Input
									id="customTitle"
									placeholder="Bem-vindo ao Mercado304"
									value={localPreferences.customTitle || ""}
									onChange={(e) => {
										const title = e.target.value.trim();
										const { customTitle, ...rest } = localPreferences;
										const newPreferences: DashboardPreferences = {
											...rest,
											...(title ? { customTitle: title } : {}),
										}
										setLocalPreferences(newPreferences)
										setHasUnsavedChanges(true)
										debouncedSave(newPreferences)
									}}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="customSubtitle">Subtítulo Personalizado</Label>
								<Input
									id="customSubtitle"
									placeholder="Sistema completo de gerenciamento de compras de mercado"
									value={localPreferences.customSubtitle || ""}
									onChange={(e) => {
										const subtitle = e.target.value.trim();
										const { customSubtitle, ...rest } = localPreferences;
										const newPreferences: DashboardPreferences = {
											...rest,
											...(subtitle ? { customSubtitle: subtitle } : {}),
										}
										setLocalPreferences(newPreferences)
										setHasUnsavedChanges(true)
										debouncedSave(newPreferences)
									}}
								/>
							</div>
						</div>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label>Estilo do Layout</Label>
								<Select
									value={localPreferences.layoutStyle}
									onValueChange={(value: "grid" | "list" | "compact") => {
										const newPreferences = {
											...localPreferences,
											layoutStyle: value,
										}
										setLocalPreferences(newPreferences)
										setHasUnsavedChanges(true)
										debouncedSave(newPreferences)
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="grid">
											<div className="flex items-center gap-2">
												<Grid3X3 className="size-4" />
												Grade
											</div>
										</SelectItem>
										<SelectItem value="list">
											<div className="flex items-center gap-2">
												<List className="size-4" />
												Lista
											</div>
										</SelectItem>
										<SelectItem value="compact">
											<div className="flex items-center gap-2">
												<Maximize2 className="size-4" />
												Compacto
											</div>
										</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<Label>Cards por Linha</Label>
								<Select
									value={localPreferences.cardsPerRow.toString()}
									onValueChange={(value) => {
										const newPreferences = {
											...localPreferences,
											cardsPerRow: parseInt(value, 10),
										}
										setLocalPreferences(newPreferences)
										setHasUnsavedChanges(true)
										debouncedSave(newPreferences)
									}}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{[1, 2, 3, 4, 5, 6].map((num) => (
											<SelectItem key={num} value={num.toString()}>
												{num} cards
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>
						</div>
					</div>

					<Separator />

					{/* Ordenação dos Cards Principais */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Ordem dos Cards Principais</h3>
						<p className="text-sm text-muted-foreground">Arraste para reordenar os cards principais do dashboard</p>

						<DragDropContext onDragEnd={handleDragEnd}>
							<Droppable droppableId="cards">
								{(provided) => (
									<div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
										{localPreferences.cardOrder.map((cardId, index) => {
											const card = availableCards.find((c) => c.id === cardId)
											if (!card) return null

											const isHidden = localPreferences.hiddenCards.includes(cardId)

											return (
												<Draggable key={cardId} draggableId={cardId} index={index}>
													{(provided, snapshot) => (
														<div
															ref={provided.innerRef}
															{...provided.draggableProps}
															{...provided.dragHandleProps}
															className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${snapshot.isDragging
																	? "bg-accent"
																	: isHidden
																		? "bg-muted opacity-60"
																		: "bg-background hover:bg-accent/50"
																}`}
														>
															<div className="flex items-center gap-3">
																<div className="flex-1">
																	<div className="font-medium">{card.label}</div>
																	<div className="text-sm text-muted-foreground">{card.description}</div>
																</div>
															</div>
															<Button
																variant="ghost"
																size="sm"
																onClick={() => toggleCardVisibility(cardId)}
																className="ml-2"
															>
																{isHidden ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
															</Button>
														</div>
													)}
												</Draggable>
											)
										})}
										{provided.placeholder}
									</div>
								)}
							</Droppable>
						</DragDropContext>
					</div>

					<Separator />

					{/* Visibilidade das Seções */}
					<div className="space-y-4">
						<h3 className="text-lg font-medium">Visibilidade das Seções</h3>
						<p className="text-sm text-muted-foreground">Controle quais seções aparecerão no dashboard</p>

						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							{cardSections.map((section) => (
								<div key={section.key} className="flex items-center justify-between space-x-2">
									<div className="flex-1">
										<Label htmlFor={section.key} className="font-medium">
											{section.label}
										</Label>
										<p className="text-sm text-muted-foreground">{section.description}</p>
									</div>
									<Switch
										id={section.key}
										checked={localPreferences[section.key as keyof DashboardPreferences] as boolean}
										onCheckedChange={(checked) => updateSectionVisibility(section.key, checked)}
									/>
								</div>
							))}
						</div>
					</div>

					<Separator />

					{/* Botões de Ação */}
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								onClick={handleResetPreferences}
								disabled={resetPreferences.isPending}
								className="flex items-center gap-2"
							>
								<RotateCcw className="size-4" />
								Restaurar Padrões
							</Button>

							{hasUnsavedChanges && (
								<div className="flex items-center gap-2 text-sm text-muted-foreground">
									<div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
									Salvando...
								</div>
							)}

							{!hasUnsavedChanges && updatePreferences.isSuccess && (
								<div className="flex items-center gap-2 text-sm text-green-600">
									<div className="w-2 h-2 bg-green-500 rounded-full"></div>
									Salvo automaticamente
								</div>
							)}
						</div>

						<Button variant="outline" onClick={() => setIsOpen(false)}>
							<X className="size-4 mr-2" />
							Fechar
						</Button>
					</div>
				</div>
			</ResponsiveDialog>
		</>
	)
}
