"use client"

import { Beer, Calculator, Clock, History, Loader2, Sparkles, Users } from "lucide-react"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { ChurrascoHistorySkeleton } from "@/components/skeletons/churrasco-history-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ChurrascoResult {
	id: string
	summary: {
		totalPeople: number
	}
	shoppingList: {
		[category: string]: { item: string; quantity: string }[]
	}
	chefTip: string
	timestamp: string
	preferences?: string | null
}

export default function ChurrascoClient() {
	const adultsId = useId()
	const childrenId = useId()
	const drinkersId = useId()
	const preferencesId = useId()

	const [adults, setAdults] = useState(10)
	const [children, setChildren] = useState(2)
	const [drinkers, setDrinkers] = useState(8)
	const [preferences, setPreferences] = useState("")
	const [loading, setLoading] = useState(false)
	const [loadingHistory, setLoadingHistory] = useState(true)
	const [history, setHistory] = useState<ChurrascoResult[]>([])
	const router = useRouter()

	const loadHistory = useCallback(async () => {
		try {
			setLoadingHistory(true)
			const response = await fetch("/api/churrasco/history")
			if (response.ok) {
				const calculations = await response.json()
				// Mapear os dados do banco para o formato esperado pelo componente
				const formattedHistory = calculations.map((calc: any) => ({
					id: calc.id,
					summary: calc.result.summary,
					shoppingList: calc.result.shoppingList,
					chefTip: calc.result.chefTip,
					timestamp: calc.createdAt,
					preferences: calc.preferences,
				}))
				setHistory(formattedHistory)
			}
		} catch (error) {
			console.error("Erro ao carregar histórico do churrasco:", error)
		} finally {
			setLoadingHistory(false)
		}
	}, [])

	useEffect(() => {
		loadHistory()
	}, [loadHistory])

	const saveToHistory = async (
		newResult: any,
		calculationData: { adults: number; children: number; drinkers: number; preferences: string },
	) => {
		try {
			const response = await fetch("/api/churrasco/history", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					adults: calculationData.adults,
					children: calculationData.children,
					drinkers: calculationData.drinkers,
					preferences: calculationData.preferences,
					result: {
						summary: newResult.summary,
						shoppingList: newResult.shoppingList,
						chefTip: newResult.chefTip,
					},
				}),
			})
			if (response.ok) {
				const savedCalculation = await response.json()
				// Recarregar o histórico após salvar
				await loadHistory()
				return savedCalculation
			}
			return null
		} catch (error) {
			console.error("Erro ao salvar histórico do churrasco:", error)
			return null
		}
	}

	const handleCalculate = async () => {
		setLoading(true)
		try {
			const response = await fetch("/api/ai/churrascometro", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ adults, children, drinkers, preferences }),
			})
			if (response.ok) {
				const data = await response.json()
				// Salvar no banco de dados
				const savedCalculation = await saveToHistory(data, { adults, children, drinkers, preferences })
				if (savedCalculation) {
					// Redirecionar para a página de detalhes
					router.push(`/churrasco/${savedCalculation.id}`)
				}
			} else {
				toast.error("A IA não conseguiu calcular. Tente novamente.")
			}
		} catch (_error) {
			toast.error("Erro de comunicação com o servidor.")
		} finally {
			setLoading(false)
		}
	}

	return (
		<div className="space-y-6">
			{/* Estatísticas rápidas */}
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">Total de Pessoas</p>
								<p className="text-lg sm:text-2xl font-bold">{adults + children}</p>
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
								<p className="text-lg sm:text-2xl font-bold">{drinkers}</p>
							</div>
							<Beer className="size-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-4 sm:p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-xs sm:text-sm text-muted-foreground">Cálculos Feitos</p>
								<p className="text-lg sm:text-2xl font-bold">{history.length}</p>
							</div>
							<Calculator className="size-6 sm:h-8 sm:w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="calculator" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="calculator" className="flex items-center gap-2">
						<Calculator className="size-4" />
						<span className="hidden sm:inline">Calculadora</span>
						<span className="sm:hidden">Calc</span>
					</TabsTrigger>
					<TabsTrigger value="history" className="flex items-center gap-2">
						<History className="size-4" />
						<span className="hidden sm:inline">Histórico</span>
						<span className="sm:hidden">Hist</span>
					</TabsTrigger>
				</TabsList>

				<TabsContent value="calculator" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="size-5" />
								Configurar Churrasco
							</CardTitle>
							<CardDescription>Informe os detalhes dos convidados para um cálculo preciso</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
								<div>
									<Label htmlFor={adultsId}>Adultos *</Label>
									<Input
										id={adultsId}
										type="number"
										min="1"
										value={adults}
										onChange={(e) => setAdults(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div>
									<Label htmlFor={childrenId}>Crianças</Label>
									<Input
										id={childrenId}
										type="number"
										min="0"
										value={children}
										onChange={(e) => setChildren(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div>
									<Label htmlFor={drinkersId}>Adultos que bebem</Label>
									<Input
										id={drinkersId}
										type="number"
										min="0"
										max={adults}
										value={drinkers}
										onChange={(e) => setDrinkers(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div className="sm:col-span-3">
									<Label htmlFor={preferencesId}>Preferências especiais (opcional)</Label>
									<Input
										id={preferencesId}
										value={preferences}
										onChange={(e) => setPreferences(e.target.value)}
										placeholder="Ex: mais picanha, sem porco, opções vegetarianas..."
										className="mt-2"
									/>
								</div>
							</div>

							<div className="mt-6">
								<Button onClick={handleCalculate} disabled={loading || adults < 1} size="lg" className="w-full">
									{loading ? (
										<>
											<Loader2 className="mr-2 size-4 animate-spin" />
											<span className="hidden sm:inline">Calculando com IA...</span>
											<span className="sm:hidden">Calculando...</span>
										</>
									) : (
										<>
											<Sparkles className="mr-2 size-4" />
											<span className="hidden sm:inline">Calcular Churrasco</span>
											<span className="sm:hidden">Calcular</span>
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-6">
					{loadingHistory ? (
						<ChurrascoHistorySkeleton />
					) : history.length === 0 ? (
						<Empty className="border border-dashed py-12">
							<EmptyHeader>
								<EmptyMedia variant="icon">
									<History className="size-6" />
								</EmptyMedia>
								<EmptyTitle>Nenhum cálculo realizado ainda</EmptyTitle>
								<EmptyDescription>
									Seus últimos cálculos aparecerão aqui após realizar o primeiro churrasco.
								</EmptyDescription>
							</EmptyHeader>
						</Empty>
					) : (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="size-5" />
									Cálculos Recentes
								</CardTitle>
								<CardDescription>Seus últimos {history.length} cálculos</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{history.map((item, index) => (
										<div key={item.timestamp} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
											<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
												<div className="space-y-1 flex-1">
													<div className="flex items-center gap-2">
														<h3 className="font-semibold">Churrasco para {item.summary.totalPeople} pessoas</h3>
														<Badge variant="outline">#{history.length - index}</Badge>
													</div>
													<p className="text-sm text-muted-foreground">
														{new Date(item.timestamp).toLocaleString("pt-BR", {
															day: "2-digit",
															month: "2-digit",
															year: "numeric",
															hour: "2-digit",
															minute: "2-digit",
														})}
													</p>
													{item.preferences && (
														<p className="text-xs text-muted-foreground mt-1">
															<span className="font-medium">Preferências:</span>{" "}
															{item.preferences.length > 50
																? `${item.preferences.substring(0, 50)}...`
																: item.preferences}
														</p>
													)}
												</div>

												<Button
													variant="outline"
													size="sm"
													onClick={() => router.push(`/churrasco/${item.id}`)}
													className="shrink-0"
												>
													Ver Detalhes
												</Button>
											</div>
										</div>
									))}
								</div>
							</CardContent>
						</Card>
					)}
				</TabsContent>
			</Tabs>
		</div>
	)
}
