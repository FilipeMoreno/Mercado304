"use client"

import { Sparkles, Utensils } from "lucide-react"
import Link from "next/link"
import { AnvisaNutritionalTable } from "@/components/AnvisaNutritionalTable"
import { AllergenIcons } from "@/components/allergen-icons"
import { AnvisaWarnings } from "@/components/anvisa-warnings"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import type { NutritionalInfo } from "@/types"

interface NutritionInfoCompleteProps {
	nutritionalInfo: NutritionalInfo | null
	productId: string
	unit: string
}

export function NutritionInfoComplete({ nutritionalInfo, productId, unit }: NutritionInfoCompleteProps) {
	if (!nutritionalInfo) return null

	return (
		<Card className="border-2 border-purple-200 dark:border-purple-800 overflow-hidden">
			<Tabs defaultValue="per100">
				<CardHeader className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/20 border-b pb-4">
					<CardTitle className="flex items-center gap-2.5">
						<div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
							<Utensils className="h-5 w-5 text-purple-600 dark:text-purple-400" />
						</div>
						<span className="text-lg">Informações Nutricionais Completas</span>
					</CardTitle>
					<CardDescription className="mt-2">
						Dados nutricionais, avisos da ANVISA e informações sobre alérgenos
					</CardDescription>

					{/* Avisos e Alérgenos Minimalistas */}
					<div className="mt-4 space-y-3">
						<AnvisaWarnings nutritionalInfo={nutritionalInfo} unit={unit} layout="horizontal-inline" />
						<AllergenIcons nutritionalInfo={nutritionalInfo} />
					</div>

					<TabsList className="grid w-full grid-cols-3 mt-4">
						<TabsTrigger value="per100">Por 100g</TabsTrigger>
						<TabsTrigger value="perServing">Por Porção</TabsTrigger>
						<TabsTrigger value="table">
							<Utensils className="h-3.5 w-3.5 mr-1.5" />
							Tabela
						</TabsTrigger>
					</TabsList>
				</CardHeader>

				<TabsContent value="per100">
					<CardContent className="pt-6">
						<AnvisaNutritionalTable nutritionalInfo={nutritionalInfo} />
					</CardContent>
				</TabsContent>

				<TabsContent value="perServing">
					<CardContent className="pt-6">
						<AnvisaNutritionalTable nutritionalInfo={nutritionalInfo} />
					</CardContent>
				</TabsContent>

				<TabsContent value="table">
					<CardContent className="pt-6">
						<AnvisaNutritionalTable nutritionalInfo={nutritionalInfo} />
					</CardContent>
				</TabsContent>
			</Tabs>

			{/* Botão para Análise Completa com IA */}
			<CardContent className="pt-0 pb-4">
				<Link href={`/produtos/${productId}/analise-nutricional`}>
					<Button size="lg" className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700">
						<Sparkles className="h-5 w-5 mr-2" />
						Ver Análise Nutricional Completa com IA
					</Button>
				</Link>
			</CardContent>
		</Card>
	)
}
