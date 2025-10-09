"use client"

import { motion } from "framer-motion"
import { Apple, Plus, AlertTriangle, Utensils } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Product } from "@/types"
import { NutritionalInfoDialog } from "@/components/products/nutritional-info-dialog"

interface MissingNutritionalInfoProps {
	products?: Product[]
	onNutritionalInfoAdded?: (productId: string) => void
	isLoading?: boolean
}

// Componente para card de produto sem info nutricional
function ProductNutritionalCard({ product, onAddNutritionalInfo }: { 
	product: Product
	onAddNutritionalInfo?: (productId: string) => void 
}) {
	const [isDialogOpen, setIsDialogOpen] = useState(false)

	const handleAddNutritionalInfo = () => {
		onAddNutritionalInfo?.(product.id)
		setIsDialogOpen(false)
	}

	return (
		<Card className="h-full flex flex-col hover:shadow-lg transition-shadow duration-200">
			<CardContent className="flex-1 flex flex-col p-4">
				<div className="flex-1">
					<div className="flex items-start justify-between mb-3">
						<div className="flex-1 mr-3">
							<h3 className="font-medium text-sm line-clamp-2 mb-1">
								{product.name}
							</h3>
							{product.brand && (
								<Badge variant="secondary" className="text-xs mb-2">
									{product.brand.name}
								</Badge>
							)}
							{product.category && (
								<div className="flex items-center gap-1 text-xs text-muted-foreground">
									{product.category.icon && (
										<span>{product.category.icon}</span>
									)}
									<span>{product.category.name}</span>
								</div>
							)}
						</div>
						<AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0" />
					</div>
				</div>

				<div className="mt-auto">
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button
								variant="outline"
								size="sm"
								className="w-full"
							>
								<Plus className="h-4 w-4 mr-2" />
								Adicionar Info Nutricional
							</Button>
						</DialogTrigger>
						<DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
							<DialogHeader className="flex-shrink-0">
								<DialogTitle className="flex items-center gap-2">
									<Utensils className="h-5 w-5" />
									Informações Nutricionais - {product.name}
								</DialogTitle>
								<DialogDescription>
									Adicione as informações nutricionais para este produto alimentício.
								</DialogDescription>
							</DialogHeader>
							<div className="flex-1 overflow-y-auto min-h-0">
								<NutritionalInfoDialog
									productId={product.id}
									onSuccess={handleAddNutritionalInfo}
									onCancel={() => setIsDialogOpen(false)}
								/>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</CardContent>
		</Card>
	)
}

// Componente para estado vazio
function EmptyNutritionalState() {
	return (
		<motion.div
			className="col-span-full flex flex-col items-center justify-center py-12 text-center"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.3 }}
		>
			<Apple className="h-16 w-16 text-green-500 mb-4" />
			<h3 className="text-lg font-semibold text-muted-foreground mb-2">
				Todos os alimentos têm informações nutricionais!
			</h3>
			<p className="text-sm text-muted-foreground max-w-md">
				Parabéns! Todos os seus produtos alimentícios já possuem informações nutricionais cadastradas.
			</p>
		</motion.div>
	)
}

// Variantes de animação
const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			duration: 0.3,
			staggerChildren: 0.05,
			delayChildren: 0.1,
		},
	},
}

const itemVariants = {
	hidden: { opacity: 0, y: 20 },
	visible: { opacity: 1, y: 0 },
}

export function MissingNutritionalInfo({ products, onNutritionalInfoAdded, isLoading = false }: MissingNutritionalInfoProps) {
	// Loading state
	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center justify-between">
					<div>
						<div className="h-6 bg-muted rounded animate-pulse w-64 mb-2" />
						<div className="h-4 bg-muted rounded animate-pulse w-48" />
					</div>
					<div className="h-6 bg-muted rounded animate-pulse w-20" />
				</div>
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
					{Array.from({ length: 8 }).map((_, index) => (
						<div key={index} className="animate-pulse">
							<div className="bg-muted rounded-lg h-32 w-full" />
						</div>
					))}
				</div>
			</div>
		)
	}

	// Filtrar apenas produtos alimentícios sem informações nutricionais
	const productsList = Array.isArray(products) ? products : []
	const foodProductsWithoutNutrition = productsList.filter(product => 
		product.category?.isFood === true && 
		!product.nutritionalInfo
	)

	// Estado vazio
	if (foodProductsWithoutNutrition.length === 0) {
		return <EmptyNutritionalState />
	}

	return (
		<div className="space-y-6">
			{/* Header com estatísticas */}
			<div className="flex items-center justify-between">
				<div>
					<h2 className="text-xl font-semibold flex items-center gap-2">
						<AlertTriangle className="h-5 w-5 text-amber-500" />
						Produtos sem Informação Nutricional
					</h2>
					<p className="text-sm text-muted-foreground mt-1">
						{foodProductsWithoutNutrition.length} produto{foodProductsWithoutNutrition.length !== 1 ? 's' : ''} alimentício{foodProductsWithoutNutrition.length !== 1 ? 's' : ''} sem informações nutricionais
					</p>
				</div>
				<Badge variant="secondary" className="text-sm">
					{foodProductsWithoutNutrition.length} pendente{foodProductsWithoutNutrition.length !== 1 ? 's' : ''}
				</Badge>
			</div>

			{/* Grid de produtos */}
			<motion.div
				className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
				variants={containerVariants}
				initial="hidden"
				animate="visible"
				role="grid"
				aria-label={`Lista de ${foodProductsWithoutNutrition.length} produtos sem informação nutricional`}
			>
				{foodProductsWithoutNutrition.map((product) => (
					<motion.div
						key={product.id}
						variants={itemVariants}
						role="gridcell"
					>
						<ProductNutritionalCard 
							product={product}
							onAddNutritionalInfo={onNutritionalInfoAdded}
						/>
					</motion.div>
				))}
			</motion.div>
		</div>
	)
}
