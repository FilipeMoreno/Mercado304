"use client"

import { motion } from "framer-motion"
import { ArrowLeft, ChefHat, Clock, Save, ThumbsUp, Utensils } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { RecipeTimer } from "@/components/recipe-timer"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { VoiceAssistant } from "@/components/voice-assistant"
import { useDataMutation } from "@/hooks/use-data-mutation"
import { TempStorage } from "@/lib/temp-storage"

interface Recipe {
	// AI generated recipe fields
	refeicao?: string
	prato?: string
	descricao?: string
	tempo_preparo?: string
	ingredientes?: string[]
	modo_preparo?: string
	dica_chef?: string

	// Saved recipe fields
	name?: string
	description?: string
	mealType?: string
	ingredients?: string[]
	instructions?: string
	cookingTime?: string
	chefTip?: string
}

export default function VisualizarReceitaPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const [recipe, setRecipe] = useState<Recipe | null>(null)
	const { create, loading } = useDataMutation()

	useEffect(() => {
		const storageKey = searchParams.get("storageKey")
		if (storageKey) {
			const data = TempStorage.get(storageKey)
			console.log("📋 Dados recuperados do storage:", data)
			if (data?.recipe) {
				console.log("🍽️ Receita para visualizar:", data.recipe)
				setRecipe(data.recipe)
			} else {
				router.push("/receitas")
			}
		}
	}, [searchParams, router])

	const handleSaveRecipe = async () => {
		if (!recipe) return

		await create(
			"/api/recipes",
			{
				name: recipe.prato || recipe.name || "Receita sem nome",
				description: recipe.descricao || recipe.description || "",
				prepTime: recipe.tempo_preparo || recipe.cookingTime || "",
				mealType: recipe.refeicao || recipe.mealType || "",
				ingredients: recipe.ingredientes || recipe.ingredients || [],
				instructions: recipe.modo_preparo || recipe.instructions || "",
				chefTip: recipe.dica_chef || recipe.chefTip || "",
			},
			{
				successMessage: "Receita salva com sucesso!",
				onSuccess: () => {
					router.push("/receitas")
				},
			},
		)
	}

	// Funções para controle do cronômetro via voz
	const handleTimerCommand = (command: "start" | "pause" | "reset" | "set", value?: number) => {
		// Estas funções serão chamadas pelo assistente de voz
		// O RecipeTimer precisa ser refatorado para aceitar refs ou callbacks
		console.log("🔊 Comando do timer:", command, value)
	}

	const handleReadRecipe = () => {
		if (!recipe) return

		const recipeText = `
			${recipe.prato || recipe.name}. 
			${recipe.descricao || recipe.description}
			
			Ingredientes: ${(recipe.ingredientes || recipe.ingredients || []).join(", ")}
			
			Modo de preparo: ${recipe.modo_preparo || recipe.instructions || ""}
			
			Tempo de preparo: ${recipe.tempo_preparo || recipe.cookingTime || "não especificado"}
			
			${recipe.dica_chef || recipe.chefTip ? `Dica do chef: ${recipe.dica_chef || recipe.chefTip}` : ""}
		`

		// O VoiceAssistant já fará a leitura
		return recipeText
	}

	if (!recipe) {
		return <div className="text-center p-8">A carregar receita...</div>
	}

	return (
		<div className="space-y-6">
			{/* Header Responsivo */}
			<motion.div
				initial={{ opacity: 0, y: -20 }}
				animate={{ opacity: 1, y: 0 }}
				className="space-y-4"
			>
				<div className="flex items-center justify-between">
					<Button variant="outline" size="sm" onClick={() => router.back()} className="shrink-0">
						<ArrowLeft className="size-4 mr-2" />
						<span className="hidden sm:inline">Voltar</span>
						<span className="sm:hidden">Voltar</span>
					</Button>
					<Badge className="hidden sm:block">{recipe.refeicao || recipe.mealType}</Badge>
				</div>

				<div className="space-y-3">
					<div className="flex items-center gap-2 sm:hidden">
						<Badge>{recipe.refeicao || recipe.mealType}</Badge>
					</div>
					<motion.h1
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.1 }}
						className="text-2xl sm:text-3xl lg:text-4xl font-bold leading-tight"
					>
						{recipe.prato || recipe.name}
					</motion.h1>
					<motion.p
						initial={{ opacity: 0, x: -20 }}
						animate={{ opacity: 1, x: 0 }}
						transition={{ delay: 0.2 }}
						className="text-gray-600 text-sm sm:text-base leading-relaxed"
					>
						{recipe.descricao || recipe.description}
					</motion.p>
				</div>
			</motion.div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				{/* Coluna Principal */}
				<div className="lg:col-span-2 space-y-6 order-2 lg:order-1">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Utensils />
								Ingredientes
							</CardTitle>
						</CardHeader>
						<CardContent>
							<ul className="list-disc list-inside space-y-2">
								{(recipe.ingredientes || recipe.ingredients || []).map((ing) => (
									<li key={`ingredient-${ing}`}>{ing}</li>
								))}
							</ul>
						</CardContent>
					</Card>
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<ChefHat />
								Modo de Preparo
							</CardTitle>
						</CardHeader>
						<CardContent>
							<div className="space-y-4">
								{(() => {
									const instructions = recipe.modo_preparo || recipe.instructions || ""

									if (!instructions.trim()) {
										return <p className="text-gray-500 italic">Modo de preparo não disponível</p>
									}

									console.log("🔍 Texto original do modo de preparo:", instructions)

									let steps: string[] = []

									// Método mais direto: dividir por padrões de numeração
									// Exemplo: "1. texto 2. texto 3. texto" ou "Passo 1: texto Passo 2: texto"

									if (instructions.includes("Passo")) {
										// Dividir por "Passo X:"
										steps = instructions.split(/(?=Passo \d+:)/).filter((step) => step.trim())
									} else if (/\d+\.\s/.test(instructions)) {
										// Dividir por "1. " "2. " etc.
										steps = instructions.split(/(?=\d+\.\s)/).filter((step) => step.trim())
									} else if (/\d+\)\s/.test(instructions)) {
										// Dividir por "1) " "2) " etc.
										steps = instructions.split(/(?=\d+\)\s)/).filter((step) => step.trim())
									} else {
										// Tentar dividir por quebras de linha
										steps = instructions.split(/\n/).filter((step) => step.trim())
									}

									// Se ainda tem apenas 1 item muito longo, forçar divisão por números
									if (steps.length === 1 && steps[0].length > 50) {
										// Usar regex para capturar cada passo numerado
										const matches = instructions.match(/\d+\.\s[^0-9]+(?=\d+\.|$)/g)
										if (matches && matches.length > 1) {
											steps = matches
										} else {
											// Última tentativa: dividir manualmente por pontos + espaços + maiúsculas
											steps = instructions
												.split(/\.\s+(?=[A-Z])/)
												.map((step) => step.trim())
												.filter((step) => step)
										}
									}

									console.log("📝 Passos divididos:", steps)

									return (
										<div className="space-y-3">
											{steps.map((step, index) => {
												const cleanStep = step.trim()
												const isNumberedStep = /^(\d+\.|Passo \d+:|\d+\))/.test(cleanStep)

												return (
													<div
														key={`step-${cleanStep}`}
														className={`flex gap-3 p-3 rounded-lg ${
															isNumberedStep
																? "bg-orange-50 border-l-4 border-orange-200"
																: "bg-gray-50 border-l-4 border-gray-200"
														}`}
													>
														{isNumberedStep ? (
															<>
																<div className="shrink-0 size-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">
																	{index + 1}
																</div>
																<div className="flex-1">
																	<p className="text-gray-800 leading-relaxed">
																		{cleanStep.replace(/^(\d+\.\s*|Passo \d+:\s*|\d+\)\s*)/, "").trim()}
																	</p>
																</div>
															</>
														) : (
															<>
																<div className="shrink-0 size-8 bg-gray-400 text-white rounded-full flex items-center justify-center text-sm font-bold">
																	{index + 1}
																</div>
																<div className="flex-1">
																	<p className="text-gray-800 leading-relaxed">{cleanStep}</p>
																</div>
															</>
														)}
													</div>
												)
											})}
										</div>
									)
								})()}
							</div>
						</CardContent>
					</Card>
				</div>

				{/* Coluna Lateral */}
				<div className="space-y-6 order-1 lg:order-2">
					<Card>
						<CardHeader>
							<CardTitle>Detalhes</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="flex items-center gap-2">
								<Clock className="size-5 text-primary" />
								<div>
									<p className="font-semibold">{recipe.tempo_preparo || recipe.cookingTime || "Não especificado"}</p>
									<p className="text-sm text-gray-500">Tempo de Preparo</p>
								</div>
							</div>
							{(recipe.dica_chef || recipe.chefTip) && (
								<div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
									<h4 className="font-semibold text-yellow-800 flex items-center gap-2">
										<ThumbsUp size={16} /> Dica do Chef
									</h4>
									<p className="text-sm text-yellow-700 mt-1">{recipe.dica_chef || recipe.chefTip}</p>
								</div>
							)}
						</CardContent>
					</Card>

					{/* Cronômetro */}
					<RecipeTimer suggestedTime={recipe.tempo_preparo || recipe.cookingTime} />

					{/* Assistente de Voz */}
					<VoiceAssistant onTimerCommand={handleTimerCommand} onReadRecipe={handleReadRecipe} recipe={recipe} />

					<Card>
						<CardHeader>
							<CardTitle>Gostou da Receita?</CardTitle>
						</CardHeader>
						<CardContent className="space-y-4">
							<Button className="w-full" onClick={handleSaveRecipe} disabled={loading}>
								<Save className="size-4 mr-2" />
								{loading ? "A salvar..." : "Salvar Receita"}
							</Button>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
