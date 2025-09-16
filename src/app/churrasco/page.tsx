"use client"

import { AnimatePresence, motion } from "framer-motion"
import {
	Beer,
	Calculator,
	Clock,
	Drumstick,
	Flame,
	History,
	Loader2,
	ShoppingCart,
	Sparkles,
	Users,
	Utensils,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { ChurrascometroSkeleton } from "@/components/skeletons/churrascometro-skeleton"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useDataMutation } from "@/hooks"

interface ChurrascoResult {
	summary: {
		totalPeople: number
	}
	shoppingList: {
		[category: string]: { item: string; quantity: string }[]
	}
	chefTip: string
	timestamp: string
}

const categoryIcons: { [key: string]: React.ReactNode } = {
	Carnes: <Drumstick className="h-5 w-5 text-red-500" />,
	Bebidas: <Beer className="h-5 w-5 text-yellow-500" />,
	Acompanhamentos: <Utensils className="h-5 w-5 text-orange-500" />,
	Outros: <Flame className="h-5 w-5 text-gray-500" />,
}

export default function ChurrascoPage() {
	const [adults, setAdults] = useState(10)
	const [children, setChildren] = useState(2)
	const [drinkers, setDrinkers] = useState(8)
	const [preferences, setPreferences] = useState("")
	const [loading, setLoading] = useState(false)
	const [result, setResult] = useState<ChurrascoResult | null>(null)
	const [history, setHistory] = useState<ChurrascoResult[]>([])
	const { create, loading: creatingList } = useDataMutation()
	const router = useRouter()

	const HISTORY_KEY = "churrascometro_history"

	useEffect(() => {
		try {
			const savedHistory = localStorage.getItem(HISTORY_KEY)
			if (savedHistory) {
				setHistory(JSON.parse(savedHistory))
			}
		} catch (error) {
			console.error("Erro ao carregar histórico do churrasco:", error)
		}
	}, [])

	const saveToHistory = (newResult: ChurrascoResult) => {
		try {
			const updatedHistory = [newResult, ...history].slice(0, 5)
			setHistory(updatedHistory)
			localStorage.setItem(HISTORY_KEY, JSON.stringify(updatedHistory))
		} catch (error) {
			console.error("Erro ao salvar histórico do churrasco:", error)
		}
	}

	const handleCalculate = async () => {
		setLoading(true)
		setResult(null)
		try {
			const response = await fetch("/api/ai/churrascometro", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ adults, children, drinkers, preferences }),
			})
			if (response.ok) {
				const data = await response.json()
				const newResult = { ...data, timestamp: new Date().toISOString() }
				setResult(newResult)
				saveToHistory(newResult)
			} else {
				toast.error("A IA não conseguiu calcular. Tente novamente.")
			}
		} catch (_error) {
			toast.error("Erro de comunicação com o servidor.")
		} finally {
			setLoading(false)
		}
	}

	const handleCreateList = async () => {
		if (!result) return

		const itemsToCreate = Object.values(result.shoppingList)
			.flat()
			.map((item) => ({
				productName: item.item,
				quantity: 1,
				isChecked: false,
			}))

		await create(
			"/api/shopping-lists",
			{
				name: `Churrasco para ${result.summary.totalPeople} pessoas`,
				items: itemsToCreate,
			},
			{
				successMessage: "Lista de compras para o churrasco criada!",
				onSuccess: (newList) => router.push(`/lista/${newList.id}`),
			},
		)
	}

	const loadFromHistory = (historicalResult: ChurrascoResult) => {
		setResult(historicalResult)
		window.scrollTo({ top: 0, behavior: "smooth" })
	}

	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
				<div>
					<h1 className="text-3xl font-bold flex items-center gap-2">
						Churrascômetro
					</h1>
					<p className="text-muted-foreground">
						Calcule tudo para o seu churrasco perfeito com inteligência artificial
					</p>
				</div>
			</div>

			{/* Estatísticas rápidas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Total de Pessoas</p>
								<p className="text-2xl font-bold">{adults + children}</p>
							</div>
							<Users className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Bebem Álcool</p>
								<p className="text-2xl font-bold">{drinkers}</p>
							</div>
							<Beer className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardContent className="p-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-sm text-muted-foreground">Cálculos Feitos</p>
								<p className="text-2xl font-bold">{history.length}</p>
							</div>
							<Calculator className="h-8 w-8 text-muted-foreground" />
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="calculator" className="w-full">
				<TabsList className="grid w-full grid-cols-2">
					<TabsTrigger value="calculator" className="flex items-center gap-2">
						<Calculator className="h-4 w-4" />
						Calculadora
					</TabsTrigger>
					<TabsTrigger value="history" className="flex items-center gap-2">
						<History className="h-4 w-4" />
						Histórico
					</TabsTrigger>
				</TabsList>

				<TabsContent value="calculator" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Users className="h-5 w-5" />
								Configurar Churrasco
							</CardTitle>
							<CardDescription>Informe os detalhes dos convidados para um cálculo preciso</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
								<div>
									<Label htmlFor="adults">Adultos *</Label>
									<Input
										id="adults"
										type="number"
										min="1"
										value={adults}
										onChange={(e) => setAdults(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div>
									<Label htmlFor="children">Crianças</Label>
									<Input
										id="children"
										type="number"
										min="0"
										value={children}
										onChange={(e) => setChildren(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div>
									<Label htmlFor="drinkers">Adultos que bebem</Label>
									<Input
										id="drinkers"
										type="number"
										min="0"
										max={adults}
										value={drinkers}
										onChange={(e) => setDrinkers(Number(e.target.value))}
										className="mt-2"
									/>
								</div>
								<div className="md:col-span-3">
									<Label htmlFor="preferences">Preferências especiais (opcional)</Label>
									<Input
										id="preferences"
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
											<Loader2 className="mr-2 h-4 w-4 animate-spin" />
											Calculando com IA...
										</>
									) : (
										<>
											<Sparkles className="mr-2 h-4 w-4" />
											Calcular Churrasco
										</>
									)}
								</Button>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="history" className="space-y-6">
					{history.length === 0 ? (
						<Card>
							<CardContent className="p-12 text-center">
								<History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
								<p className="text-muted-foreground">Nenhum cálculo realizado ainda</p>
								<p className="text-sm text-muted-foreground mt-1">Seus últimos cálculos aparecerão aqui</p>
							</CardContent>
						</Card>
					) : (
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Clock className="h-5 w-5" />
									Cálculos Recentes
								</CardTitle>
								<CardDescription>Seus últimos {history.length} cálculos</CardDescription>
							</CardHeader>
							<CardContent>
								<div className="space-y-4">
									{history.map((item, index) => (
										<div key={item.timestamp} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
											<div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
												<div className="space-y-1">
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
												</div>

												<Button variant="outline" size="sm" onClick={() => loadFromHistory(item)}>
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

			<AnimatePresence>
				{loading && <ChurrascometroSkeleton />}
				{result && (
					<motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
						<Card>
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<Sparkles className="h-5 w-5" />
									Resultado para {result.summary.totalPeople} pessoas
								</CardTitle>
								<CardDescription>Lista de compras calculada com inteligência artificial</CardDescription>
							</CardHeader>
							<CardContent className="space-y-6">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
									{Object.entries(result.shoppingList).map(([category, items]) => (
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
										<Sparkles className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
										<div>
											<h4 className="font-semibold text-yellow-800 dark:text-yellow-200 mb-1">Dica do Chef</h4>
											<p className="text-sm text-yellow-700 dark:text-yellow-300 leading-relaxed">{result.chefTip}</p>
										</div>
									</div>
								</div>

								<div className="flex flex-col md:flex-row gap-3">
									<Button onClick={handleCreateList} disabled={creatingList} className="flex-1" size="lg">
										<ShoppingCart className="mr-2 h-4 w-4" />
										{creatingList ? "Criando lista..." : "Criar Lista de Compras"}
									</Button>
									<Button variant="outline" onClick={() => setResult(null)} size="lg">
										Novo Cálculo
									</Button>
								</div>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	)
}
