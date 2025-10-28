"use client"

import { AlertCircle, ExternalLink, Info } from "lucide-react"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface ProductWithoutNutrition {
	productId: string
	productName: string
}

interface MissingNutritionalInfoDialogProps {
	isOpen: boolean
	onClose: () => void
	onAddNutritionalInfo: (productIds: string[]) => void
	productsWithoutNutrition: ProductWithoutNutrition[]
}

export function MissingNutritionalInfoDialog({
	isOpen,
	onClose,
	onAddNutritionalInfo,
	productsWithoutNutrition,
}: MissingNutritionalInfoDialogProps) {
	const [selectedProducts, setSelectedProducts] = React.useState<Set<string>>(new Set())
	const [showDetails, setShowDetails] = React.useState(false)

	React.useEffect(() => {
		// Selecionar todos os produtos por padrão
		setSelectedProducts(new Set(productsWithoutNutrition.map((p) => p.productId)))
	}, [productsWithoutNutrition])

	const handleToggleProduct = (productId: string) => {
		setSelectedProducts((prev) => {
			const newSet = new Set(prev)
			if (newSet.has(productId)) {
				newSet.delete(productId)
			} else {
				newSet.add(productId)
			}
			return newSet
		})
	}

	const handleAddNutritionalInfo = () => {
		onAddNutritionalInfo(Array.from(selectedProducts))
		onClose()
	}

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={onClose} title="Informações Nutricionais Faltando" maxWidth="2xl">
			<div className="space-y-6">
				<div className="flex items-center gap-2">
					<AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-amber-500" />
					<p className="text-sm text-muted-foreground">
						{productsWithoutNutrition.length} produto{productsWithoutNutrition.length > 1 ? "s" : ""} da sua compra não
						possuem informações nutricionais cadastradas.
					</p>
				</div>

				<div className="flex items-start gap-3 p-3 sm:p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
					<Info className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
					<div className="text-xs sm:text-sm text-blue-900 dark:text-blue-100">
						<p className="font-medium mb-1">Por que isso é importante?</p>
						<p className="text-blue-700 dark:text-blue-300">
							Cadastrar as informações nutricionais permite que você acompanhe sua alimentação, detecte alérgenos e tome
							decisões mais saudáveis.
						</p>
					</div>
				</div>

				<div className="space-y-3">
					<div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
						<p className="text-xs sm:text-sm font-medium">
							Selecione os produtos para adicionar informações nutricionais:
						</p>
						<Button
							variant="ghost"
							size="sm"
							onClick={() => setShowDetails(!showDetails)}
							className="text-xs w-full sm:w-auto"
							type="button"
						>
							{showDetails ? "Ocultar" : "Mostrar"} detalhes
						</Button>
					</div>

					<ScrollArea className="h-[200px] sm:h-[300px] border rounded-lg">
						<div className="p-2 sm:p-3 space-y-2">
							{productsWithoutNutrition.map((product) => (
								<label
									key={product.productId}
									htmlFor={`product-${product.productId}`}
									className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-lg cursor-pointer border border-transparent hover:border-gray-200 dark:hover:border-gray-700 transition-colors"
								>
									<input
										id={`product-${product.productId}`}
										type="checkbox"
										checked={selectedProducts.has(product.productId)}
										onChange={() => handleToggleProduct(product.productId)}
										className="mt-0.5 sm:mt-1 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
									/>
									<div className="flex-1 min-w-0">
										<p className="font-medium text-xs sm:text-sm">{product.productName}</p>
									</div>
									<Badge variant="outline" className="ml-2 text-[10px] sm:text-xs whitespace-nowrap">
										{selectedProducts.has(product.productId) ? "Selecionado" : "Não selecionado"}
									</Badge>
								</label>
							))}
						</div>
					</ScrollArea>

					<div className="text-xs text-muted-foreground text-center py-2">
						{selectedProducts.size} de {productsWithoutNutrition.length} produto
						{productsWithoutNutrition.length > 1 ? "s" : ""} selecionado{selectedProducts.size > 1 ? "s" : ""}
					</div>
				</div>

				<div className="flex flex-col gap-2 sm:flex-row sm:justify-end mt-6">
					<Button variant="outline" onClick={onClose} className="w-full sm:w-auto">
						Adicionar Depois
					</Button>
					<Button
						onClick={handleAddNutritionalInfo}
						className="w-full sm:w-auto text-sm"
						disabled={selectedProducts.size === 0}
					>
						<ExternalLink className="h-4 w-4 mr-2" />
						<span className="hidden sm:inline">Adicionar Informações Nutricionais</span>
						<span className="sm:hidden">Adicionar ({selectedProducts.size})</span>
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
