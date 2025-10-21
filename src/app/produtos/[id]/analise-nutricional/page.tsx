"use client"

import {
	AlertTriangle,
	Apple,
	ArrowLeft,
	BookOpen,
	ChefHat,
	Clock,
	Flame,
	Heart,
	Info,
	Leaf,
	Lightbulb,
	Package,
	ShieldAlert,
	ShoppingBag,
	Sparkles,
	Store,
	ThermometerSnowflake,
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { AiAnalysisCard } from "@/components/shared/ai-analysis-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface NutritionalInfo {
	calories?: number
	proteins?: number
	carbohydrates?: number
	totalFat?: number
	saturatedFat?: number
	transFat?: number
	fiber?: number
	sodium?: number
	totalSugars?: number
	addedSugars?: number
	servingSize?: string
}

interface AIAnalysis {
	summary: string
	nutritionalAdvice: string[]
	healthBenefits: string[]
	healthRisks: string[]
	similarProducts: string[]
	buyingTips: string[]
	storageTips: string[]
	shelfLife: string
	leftoversIdeas: string[]
}

interface ProductData {
	product: {
		id: string
		name: string
		brand?: string
		category?: string
		unit: string
	}
	nutritionalInfo: NutritionalInfo | null
	aiAnalysis: AIAnalysis
}

export default function AnaliseNutricionalPage() {
	const params = useParams()
	const router = useRouter()
	const productId = params.id as string

	const [data, setData] = useState<ProductData | null>(null)
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		fetchNutritionalAnalysis()
	}, [fetchNutritionalAnalysis])

	const fetchNutritionalAnalysis = async () => {
		try {
			setLoading(true)
			const response = await fetch(`/api/products/${productId}/nutrition-analysis`)

			if (!response.ok) {
				toast.error("Erro ao carregar análise nutricional")
				router.push(`/produtos/${productId}`)
				return
			}

			const result = await response.json()
			setData(result)
		} catch (error) {
			console.error("Erro ao buscar análise:", error)
			toast.error("Erro ao carregar análise nutricional")
		} finally {
			setLoading(false)
		}
	}

	if (loading) {
		return <LoadingSkeleton />
	}

	if (!data) {
		return null
	}

	const { product, nutritionalInfo, aiAnalysis } = data

	return (
		<div className="space-y-6 pb-8">
			{/* Header */}
			<div className="space-y-4">
				<Link href={`/produtos/${productId}`}>
					<Button variant="outline" size="lg">
						<ArrowLeft className="size-4 mr-2" />
						Voltar para Produto
					</Button>
				</Link>

				<div>
					<h1 className="text-2xl md:text-3xl font-bold">{product.name}</h1>
					<div className="flex flex-wrap items-center gap-2 mt-2">
						{product.brand && <Badge variant="secondary">{product.brand}</Badge>}
						{product.category && <Badge variant="outline">{product.category}</Badge>}
					</div>
				</div>
			</div>

			{/* Resumo do Produto com IA Badge - Padronizado */}
			<AiAnalysisCard
				title="Resumo do Produto"
				description="Visão geral inteligente sobre o produto"
				icon={Lightbulb}
				loading={false}
			>
				{aiAnalysis.summary}
			</AiAnalysisCard>

			{/* Cards de Informações Nutricionais */}
			{nutritionalInfo && (
				<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
					{nutritionalInfo.calories && (
						<Card className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 border-orange-200 dark:border-orange-800">
							<CardContent className="p-4">
								<div className="flex items-center gap-2 mb-1">
									<Flame className="size-4 text-orange-600" />
									<p className="text-sm font-medium text-orange-700 dark:text-orange-300">Calorias Totais</p>
								</div>
								<p className="text-2xl font-bold text-orange-900 dark:text-orange-100">
									{nutritionalInfo.calories} kcal
								</p>
							</CardContent>
						</Card>
					)}

					{nutritionalInfo.proteins && (
						<Card className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950 dark:to-emerald-950 border-green-200 dark:border-green-800">
							<CardContent className="p-4">
								<div className="flex items-center gap-2 mb-1">
									<Apple className="size-4 text-green-600" />
									<p className="text-sm font-medium text-green-700 dark:text-green-300">Proteína Média</p>
								</div>
								<p className="text-2xl font-bold text-green-900 dark:text-green-100">{nutritionalInfo.proteins}g</p>
							</CardContent>
						</Card>
					)}

					{nutritionalInfo.carbohydrates && (
						<Card className="bg-gradient-to-br from-yellow-50 to-amber-50 dark:from-yellow-950 dark:to-amber-950 border-yellow-200 dark:border-yellow-800">
							<CardContent className="p-4">
								<div className="flex items-center gap-2 mb-1">
									<Package className="size-4 text-yellow-600" />
									<p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Carboidratos Médios</p>
								</div>
								<p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
									{nutritionalInfo.carbohydrates}g
								</p>
							</CardContent>
						</Card>
					)}

					{nutritionalInfo.totalFat && (
						<Card className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800">
							<CardContent className="p-4">
								<div className="flex items-center gap-2 mb-1">
									<Leaf className="size-4 text-purple-600" />
									<p className="text-sm font-medium text-purple-700 dark:text-purple-300">Gordura Média</p>
								</div>
								<p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{nutritionalInfo.totalFat}g</p>
							</CardContent>
						</Card>
					)}
				</div>
			)}

			{/* Tabs com Índice */}
			<Tabs defaultValue="nutritional" className="space-y-6">
				<TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
					<TabsTrigger value="nutritional">
						<BookOpen className="size-4 mr-2" />
						Nutrientes
					</TabsTrigger>
					<TabsTrigger value="health">
						<Heart className="size-4 mr-2" />
						Benefícios e Riscos
					</TabsTrigger>
					<TabsTrigger value="shopping">
						<ShoppingBag className="size-4 mr-2" />
						Dicas de Compras
					</TabsTrigger>
					<TabsTrigger value="storage">
						<ThermometerSnowflake className="size-4 mr-2" />
						Armazenamento
					</TabsTrigger>
				</TabsList>

				{/* Dados Nutricionais e Conselhos */}
				<TabsContent value="nutritional" className="space-y-6">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Lightbulb className="size-5 text-yellow-600" />
								Dados Nutricionais e Conselhos
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Informações e recomendações nutricionais</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							{aiAnalysis.nutritionalAdvice.map((advice, index) => (
								<div key={index} className="flex gap-3 p-4 rounded-lg bg-muted/50">
									<div className="shrink-0 mt-1">
										<div className="size-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
											<Lightbulb className="size-4 text-yellow-600" />
										</div>
									</div>
									<p className="text-sm leading-relaxed">{advice}</p>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Benefícios e Riscos */}
				<TabsContent value="health" className="space-y-6">
					{/* Benefícios */}
					<Card className="border-green-200 dark:border-green-800">
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Heart className="size-5 text-green-600" />
								Benefícios para a Saúde
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Descubra os benefícios deste produto para sua saúde</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{aiAnalysis.healthBenefits.map((benefit, index) => (
								<div
									key={index}
									className="flex gap-3 p-4 rounded-lg bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800"
								>
									<div className="shrink-0 mt-1">
										<div className="size-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
											<Heart className="size-4 text-green-600" />
										</div>
									</div>
									<p className="text-sm leading-relaxed">{benefit}</p>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Riscos */}
					{aiAnalysis.healthRisks && aiAnalysis.healthRisks.length > 0 && (
						<Card className="border-red-200 dark:border-red-800">
							<CardHeader>
								<CardTitle className="flex items-center gap-2">
									<ShieldAlert className="size-5 text-red-600" />
									Riscos para a Saúde
									<Badge variant="secondary" className="ml-auto">
										<Sparkles className="h-3 w-3 mr-1" />
										IA
									</Badge>
								</CardTitle>
								<CardDescription>Pontos de atenção sobre o consumo deste produto</CardDescription>
							</CardHeader>
							<CardContent className="space-y-3">
								{aiAnalysis.healthRisks.map((risk, index) => (
									<div
										key={index}
										className="flex gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800"
									>
										<div className="shrink-0 mt-1">
											<div className="size-8 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center">
												<AlertTriangle className="size-4 text-red-600" />
											</div>
										</div>
										<p className="text-sm leading-relaxed">{risk}</p>
									</div>
								))}
							</CardContent>
						</Card>
					)}
				</TabsContent>

				{/* Dicas de Compras */}
				<TabsContent value="shopping" className="space-y-6">
					{/* Produtos Similares */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Store className="size-5 text-blue-600" />
								Melhores Produtos Similares
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Alternativas recomendadas para este produto</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{aiAnalysis.similarProducts.map((product, index) => (
									<div key={index} className="flex items-center gap-3 p-3 rounded-lg border bg-muted/30">
										<div className="size-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center shrink-0">
											<Package className="size-5 text-blue-600" />
										</div>
										<p className="text-sm font-medium">{product}</p>
									</div>
								))}
							</div>
						</CardContent>
					</Card>

					{/* Como Escolher */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ShoppingBag className="size-5 text-purple-600" />
								Como Escolher
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Dicas para escolher o melhor produto</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{aiAnalysis.buyingTips.map((tip, index) => (
								<div
									key={index}
									className="flex gap-3 p-4 rounded-lg bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800"
								>
									<div className="shrink-0 mt-1">
										<div className="size-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
											<ShoppingBag className="size-4 text-purple-600" />
										</div>
									</div>
									<p className="text-sm leading-relaxed">{tip}</p>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>

				{/* Armazenamento */}
				<TabsContent value="storage" className="space-y-6">
					{/* Como Armazenar */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ThermometerSnowflake className="size-5 text-cyan-600" />
								Como Armazenar
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Melhores práticas de armazenamento</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{aiAnalysis.storageTips.map((tip, index) => (
								<div
									key={index}
									className="flex gap-3 p-4 rounded-lg bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800"
								>
									<div className="shrink-0 mt-1">
										<div className="size-8 rounded-full bg-cyan-100 dark:bg-cyan-900 flex items-center justify-center">
											<Package className="size-4 text-cyan-600" />
										</div>
									</div>
									<p className="text-sm leading-relaxed">{tip}</p>
								</div>
							))}
						</CardContent>
					</Card>

					{/* Quanto Tempo Dura */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Clock className="size-5 text-orange-600" />
								Quanto Tempo Dura
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Tempo de validade após aberto</CardDescription>
						</CardHeader>
						<CardContent>
							<div className="flex gap-3 p-4 rounded-lg bg-orange-50 dark:bg-orange-950 border border-orange-200 dark:border-orange-800">
								<div className="shrink-0 mt-1">
									<div className="size-10 rounded-full bg-orange-100 dark:bg-orange-900 flex items-center justify-center">
										<Clock className="size-5 text-orange-600" />
									</div>
								</div>
								<p className="text-lg font-medium leading-relaxed">{aiAnalysis.shelfLife}</p>
							</div>
						</CardContent>
					</Card>

					{/* O que fazer com sobras */}
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ChefHat className="size-5 text-pink-600" />O que fazer com os restos de comida
								<Badge variant="secondary" className="ml-auto">
									<Sparkles className="h-3 w-3 mr-1" />
									IA
								</Badge>
							</CardTitle>
							<CardDescription>Ideias criativas para aproveitar sobras</CardDescription>
						</CardHeader>
						<CardContent className="space-y-3">
							{aiAnalysis.leftoversIdeas.map((idea, index) => (
								<div
									key={index}
									className="flex gap-3 p-4 rounded-lg bg-pink-50 dark:bg-pink-950 border border-pink-200 dark:border-pink-800"
								>
									<div className="shrink-0 mt-1">
										<div className="size-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
											<ChefHat className="size-4 text-pink-600" />
										</div>
									</div>
									<p className="text-sm leading-relaxed">{idea}</p>
								</div>
							))}
						</CardContent>
					</Card>
				</TabsContent>
			</Tabs>

			{/* Aviso Médico */}
			<Card className="border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950">
				<CardContent className="p-6">
					<div className="flex gap-4">
						<div className="shrink-0">
							<div className="size-10 rounded-full bg-amber-100 dark:bg-amber-900 flex items-center justify-center">
								<Info className="size-5 text-amber-600" />
							</div>
						</div>
						<div className="space-y-2">
							<h4 className="font-semibold text-amber-900 dark:text-amber-100">Aviso Médico</h4>
							<p className="text-sm text-amber-800 dark:text-amber-200 leading-relaxed">
								O conteúdo deste site é apenas para fins informativos. Nenhum material aqui pretende substituir o
								aconselhamento, diagnóstico ou tratamento médico profissional. Sempre consulte seu médico ou outro
								profissional de saúde qualificado para qualquer dúvida sobre uma condição médica.
							</p>
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}

function LoadingSkeleton() {
	return (
		<div className="space-y-6 pb-8">
			<Skeleton className="h-10 w-32" />
			<Skeleton className="h-12 w-full max-w-md" />
			<Skeleton className="h-32 w-full" />
			<div className="grid grid-cols-2 md:grid-cols-4 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<Skeleton key={i} className="h-24" />
				))}
			</div>
			<Skeleton className="h-96 w-full" />
		</div>
	)
}
