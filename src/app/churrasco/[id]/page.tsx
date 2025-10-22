"use client"

import { AnimatePresence, motion } from "framer-motion"
import { Beer, ChevronLeft, Drumstick, Flame, Loader2, ShoppingCart, Sparkles, Users, Utensils } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { useDataMutation } from "@/hooks"

interface ChurrascoCalculation {
	id: string
	adults: number
	children: number
	drinkers: number
	preferences: string | null
	result: {
		summary: {
			totalPeople: number
		}
		shoppingList: {
			[category: string]: { item: string; quantity: string }[]
		}
		chefTip: string
	}
	createdAt: string
}

const categoryIcons: { [key: string]: React.ReactNode } = {
	Carnes: <Drumstick className="size-5 text-red-500" />,
	Bebidas: <Beer className="size-5 text-yellow-500" />,
	Acompanhamentos: <Utensils className="size-5 text-orange-500" />,
	Outros: <Flame className="size-5 text-gray-500" />,
}

export default function ChurrascoDetailsPage() {
	const params = useParams()
	const router = useRouter()
	const [calculation, setCalculation] = useState<ChurrascoCalculation | null>(null)
	const [loading, setLoading] = useState(true)
	const { create, loading: creatingList } = useDataMutation()

	const loadCalculation = useCallback(async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/churrasco/history/${params.id}`)
			if (response.ok) {
				const data = await response.json()
				setCalculation(data)
			} else {
				toast.error("Cálculo não encontrado")
				router.push("/churrasco")
			}
		} catch (error) {
			console.error("Erro ao carregar cálculo:", error)
			toast.error("Erro ao carregar detalhes do cálculo")
			router.push("/churrasco")
		} finally {
			setLoading(false)
		}
	}, [params.id, router])

	useEffect(() => {
		loadCalculation()
	}, [loadCalculation])

	const handleCreateList = async () => {
		if (!calculation) return

		const itemsToCreate = Object.values(calculation.result.shoppingList)
			.flat()
			.map((item) => ({
				productName: item.item,
				productUnit: "kg", // Padrão para churrasco (carnes geralmente em kg)
				quantity: parseFloat(item.quantity.replace(/[^\d.,]/g, "").replace(",", ".")) || 1,
				isChecked: false,
			}))

		await create(
			"/api/shopping-lists",
			{
				name: `Churrasco para ${calculation.result.summary.totalPeople} pessoas`,
				items: itemsToCreate,
			},
			{
				successMessage: "Lista de compras para o churrasco criada!",
				onSuccess: (newList) => router.push(`/lista/${newList.id}`),
			},
		)
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Button variant="ghost" size="icon" onClick={() => router.back()}>
						<ChevronLeft className="size-5" />
					</Button>
					<div className="flex items-center gap-4 flex-1">
						<Flame className="size-8 text-orange-600" />
						<div className="flex-1">
							<h1 className="text-2xl sm:text-3xl font-bold">Detalhes do Churrasco</h1>
							<p className="text-gray-600 mt-2 text-sm sm:text-base">Carregando...</p>
						</div>
					</div>
				</div>

				<Card>
					<CardContent className="p-12 flex items-center justify-center">
						<div className="flex flex-col items-center gap-3">
							<Loader2 className="size-8 animate-spin text-muted-foreground" />
							<p className="text-sm text-muted-foreground">Carregando detalhes do churrasco...</p>
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!calculation) {
		return null
	}

	return (
		<div className="space-y-6">
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col sm:flex-row sm:items-start gap-4"
			>
				<Button variant="ghost" size="icon" onClick={() => router.back()} className="shrink-0">
					<ChevronLeft className="size-5" />
				</Button>
				<div className="flex items-center gap-4 flex-1">
					<Flame className="size-8 text-orange-600" />
					<div className="flex-1">
						<motion.h1
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.1 }}
							className="text-2xl sm:text-3xl font-bold"
						>
							Churrasco para {calculation.result.summary.totalPeople} pessoas
						</motion.h1>
						<motion.p
							initial={{ opacity: 0, x: -20 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ delay: 0.2 }}
							className="text-gray-600 mt-2 text-sm sm:text-base"
						>
							Calculado em{" "}
							{new Date(calculation.createdAt).toLocaleString("pt-BR", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</motion.p>
					</div>
				</div>
			</motion.div>

			{/* Estatísticas do Churrasco */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">Adultos</p>
								<p className="text-lg sm:text-2xl font-bold">{calculation.adults}</p>
							</div>
							<Users className="size-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">Crianças</p>
								<p className="text-lg sm:text-2xl font-bold">{calculation.children}</p>
							</div>
							<Users className="size-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">Bebem Álcool</p>
								<p className="text-lg sm:text-2xl font-bold">{calculation.drinkers}</p>
							</div>
							<Beer className="size-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{calculation.preferences && (
				<Card>
					<CardHeader>
						<CardTitle className="text-lg">Preferências Especiais</CardTitle>
					</CardHeader>
					<CardContent>
						<p className="text-muted-foreground">{calculation.preferences}</p>
					</CardContent>
				</Card>
			)}

			{/* Lista de Compras */}
			<AnimatePresence>
				<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Sparkles className="size-5" />
								Lista de Compras
							</CardTitle>
							<CardDescription>Itens calculados com inteligência artificial</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
								{Object.entries(calculation.result.shoppingList).map(([category, items]) => (
									<div key={category} className="space-y-3">
										<h3 className="font-semibold text-lg flex items-center gap-2 border-b pb-2">
											{categoryIcons[category]}
											{category}
											<Badge variant="secondary">{items.length}</Badge>
										</h3>
										<div className="space-y-2">
											{items.map((item, index) => (
												<div
													key={`${item.item}-${index}`}
													className="flex items-center justify-between p-2 bg-muted/30 rounded-lg"
												>
													<span className="font-medium">{item.item}</span>
													<Badge variant="outline" className="font-bold text-primary">
														{item.quantity}
													</Badge>
												</div>
											))}
										</div>
									</div>
								))}
							</div>

							<Separator />

							<div className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-950 dark:to-orange-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
								<div className="flex items-start gap-3">
									<Sparkles className="size-5 text-yellow-600 dark:text-yellow-400 mt-0.5 shrink-0" />
									<div>
										<h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Dica do Chef</h4>
										<p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">
											{calculation.result.chefTip}
										</p>
									</div>
								</div>
							</div>

							<div className="flex flex-col sm:flex-row gap-3">
								<Button onClick={handleCreateList} disabled={creatingList} className="flex-1" size="lg">
									<ShoppingCart className="mr-2 size-4" />
									<span className="hidden sm:inline">
										{creatingList ? "Criando lista..." : "Criar Lista de Compras"}
									</span>
									<span className="sm:hidden">{creatingList ? "Criando..." : "Criar Lista"}</span>
								</Button>
								<Button variant="outline" onClick={() => router.push("/churrasco")} size="lg">
									Novo Cálculo
								</Button>
							</div>
						</CardContent>
					</Card>
				</motion.div>
			</AnimatePresence>
		</div>
	)
}
