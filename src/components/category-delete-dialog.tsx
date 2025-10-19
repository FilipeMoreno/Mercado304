"use client"

import { AlertTriangle, ArrowRight, CheckCircle2, Layers, Package, Plus } from "lucide-react"
import { useId, useState } from "react"
import { toast } from "sonner"
import { CategorySelectDialog } from "@/components/selects/category-select-dialog"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface Product {
	id: string
	name: string
	brand?: { name: string }
}

interface Category {
	id: string
	name: string
	icon?: string
	color?: string
}

interface CategoryDeleteDialogProps {
	open: boolean
	onOpenChange: (open: boolean) => void
	category: Category | null
	products: Product[]
	onConfirm: (transferData: CategoryTransferData) => Promise<void>
	isLoading?: boolean
}

export interface CategoryTransferData {
	mode: "transfer-all" | "create-new" | "individual"
	targetCategoryId?: string
	newCategoryName?: string
	newCategoryIcon?: string
	newCategoryColor?: string
	individualTransfers?: Record<string, string> // productId -> categoryId
}

export function CategoryDeleteDialog({
	open,
	onOpenChange,
	category,
	products,
	onConfirm,
	isLoading = false,
}: CategoryDeleteDialogProps) {
	const [mode, setMode] = useState<"transfer-all" | "create-new" | "individual">("transfer-all")
	const [targetCategoryId, setTargetCategoryId] = useState("")
	const [newCategoryName, setNewCategoryName] = useState("")
	const [newCategoryIcon, setNewCategoryIcon] = useState("📦")
	const [newCategoryColor, setNewCategoryColor] = useState("#3b82f6")
	const [individualTransfers, setIndividualTransfers] = useState<Record<string, string>>({})
	
	const inputId = useId()
	const hasProducts = products.length > 0

	// Resetar estado ao abrir/fechar
	const handleOpenChange = (newOpen: boolean) => {
		if (!newOpen) {
			setMode("transfer-all")
			setTargetCategoryId("")
			setNewCategoryName("")
			setNewCategoryIcon("📦")
			setNewCategoryColor("#3b82f6")
			setIndividualTransfers({})
		}
		onOpenChange(newOpen)
	}

	const handleConfirm = async () => {
		try {
			let transferData: CategoryTransferData

			if (!hasProducts) {
				// Sem produtos, apenas excluir
				transferData = { mode: "transfer-all" }
			} else if (mode === "transfer-all") {
				if (!targetCategoryId) {
					toast.error("Selecione uma categoria de destino")
					return
				}
				transferData = {
					mode: "transfer-all",
					targetCategoryId,
				}
			} else if (mode === "create-new") {
				if (!newCategoryName.trim()) {
					toast.error("Digite o nome da nova categoria")
					return
				}
				transferData = {
					mode: "create-new",
					newCategoryName: newCategoryName.trim(),
					newCategoryIcon,
					newCategoryColor,
				}
			} else {
				// individual
				const allAssigned = products.every((p) => individualTransfers[p.id])
				if (!allAssigned) {
					toast.error("Atribua uma categoria para todos os produtos")
					return
				}
				transferData = {
					mode: "individual",
					individualTransfers,
				}
			}

			await onConfirm(transferData)
			handleOpenChange(false)
		} catch (error) {
			console.error("Erro ao excluir categoria:", error)
		}
	}

	const handleIndividualChange = (productId: string, categoryId: string) => {
		setIndividualTransfers((prev) => ({
			...prev,
			[productId]: categoryId,
		}))
	}

	const canConfirm = () => {
		if (!hasProducts) return true
		
		if (mode === "transfer-all") return !!targetCategoryId
		if (mode === "create-new") return !!newCategoryName.trim()
		if (mode === "individual") return products.every((p) => individualTransfers[p.id])
		
		return false
	}

	return (
		<ResponsiveDialog
			open={open}
			onOpenChange={handleOpenChange}
			title={`Excluir Categoria: ${category?.name || ""}`}
			maxWidth="2xl"
			maxHeight={true}
		>
			<div className="space-y-4">
				{/* Warning se não tem produtos */}
				{!hasProducts && (
					<div className="flex items-start gap-3 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
						<AlertTriangle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
								Esta categoria não possui produtos associados e será excluída permanentemente.
							</p>
						</div>
					</div>
				)}

				{/* Info de produtos */}
				{hasProducts && (
					<div className="flex items-start gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
						<Package className="h-5 w-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
						<div className="flex-1">
							<p className="text-sm font-medium text-blue-800 dark:text-blue-300 mb-1">
								Esta categoria possui <strong>{products.length}</strong> {products.length === 1 ? "produto" : "produtos"} associado{products.length === 1 ? "" : "s"}.
							</p>
							<p className="text-xs text-blue-700 dark:text-blue-400">
								Escolha como deseja transferir os produtos antes de excluir a categoria:
							</p>
						</div>
					</div>
				)}

				{/* Opções de transferência - apenas se tiver produtos */}
				{hasProducts && (
					<Tabs value={mode} onValueChange={(value) => setMode(value as any)} className="w-full">
						<TabsList className="grid w-full grid-cols-3">
							<TabsTrigger value="transfer-all" className="text-xs sm:text-sm">
								<Layers className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Transferir Todos</span>
								<span className="sm:hidden">Todos</span>
							</TabsTrigger>
							<TabsTrigger value="create-new" className="text-xs sm:text-sm">
								<Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Criar Nova</span>
								<span className="sm:hidden">Nova</span>
							</TabsTrigger>
							<TabsTrigger value="individual" className="text-xs sm:text-sm">
								<CheckCircle2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
								<span className="hidden sm:inline">Individual</span>
								<span className="sm:hidden">Escolher</span>
							</TabsTrigger>
						</TabsList>

						{/* Transferir Todos */}
						<TabsContent value="transfer-all" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${inputId}-transfer`}>Categoria de Destino</Label>
								<CategorySelectDialog
									value={targetCategoryId}
									onValueChange={setTargetCategoryId}
									placeholder="Selecione uma categoria"
								/>
								<p className="text-xs text-muted-foreground">
									Todos os {products.length} produtos serão transferidos para a categoria selecionada.
								</p>
							</div>
						</TabsContent>

						{/* Criar Nova Categoria */}
						<TabsContent value="create-new" className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor={`${inputId}-new-name`}>Nome da Nova Categoria</Label>
								<Input
									id={`${inputId}-new-name`}
									value={newCategoryName}
									onChange={(e) => setNewCategoryName(e.target.value)}
									placeholder="Ex: Alimentos, Bebidas..."
								/>
							</div>
							<div className="grid grid-cols-2 gap-4">
								<div className="space-y-2">
									<Label htmlFor={`${inputId}-new-icon`}>Ícone (Emoji)</Label>
									<Input
										id={`${inputId}-new-icon`}
										value={newCategoryIcon}
										onChange={(e) => setNewCategoryIcon(e.target.value)}
										placeholder="📦"
										maxLength={2}
									/>
								</div>
								<div className="space-y-2">
									<Label htmlFor={`${inputId}-new-color`}>Cor</Label>
									<Input
										id={`${inputId}-new-color`}
										type="color"
										value={newCategoryColor}
										onChange={(e) => setNewCategoryColor(e.target.value)}
									/>
								</div>
							</div>
							<p className="text-xs text-muted-foreground">
								Uma nova categoria será criada e todos os {products.length} produtos serão transferidos para ela.
							</p>
						</TabsContent>

						{/* Escolha Individual */}
						<TabsContent value="individual" className="space-y-4">
							<p className="text-sm text-muted-foreground">
								Escolha a categoria de destino para cada produto individualmente:
							</p>
							<ScrollArea className="h-[300px] border rounded-lg">
								<div className="p-4 space-y-3">
									{products.map((product) => (
										<div
											key={product.id}
											className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-muted/50 dark:bg-muted/10 rounded-lg"
										>
											<div className="flex-1 min-w-0">
												<p className="font-medium truncate">{product.name}</p>
												{product.brand && (
													<p className="text-xs text-muted-foreground truncate">{product.brand.name}</p>
												)}
											</div>
											<div className="flex items-center gap-2 w-full sm:w-auto">
												<ArrowRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
												<div className="flex-1 sm:w-[200px]">
													<CategorySelectDialog
														value={individualTransfers[product.id] || ""}
														onValueChange={(value) => handleIndividualChange(product.id, value)}
														placeholder="Escolher categoria"
													/>
												</div>
												{individualTransfers[product.id] && (
													<CheckCircle2 className="h-4 w-4 text-green-600 flex-shrink-0" />
												)}
											</div>
										</div>
									))}
								</div>
							</ScrollArea>
							<div className="flex items-center justify-between text-xs text-muted-foreground">
								<span>
									{Object.keys(individualTransfers).length} de {products.length} produtos atribuídos
								</span>
								{Object.keys(individualTransfers).length === products.length && (
									<Badge variant="outline" className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300">
										✓ Todos atribuídos
									</Badge>
								)}
							</div>
						</TabsContent>
					</Tabs>
				)}

				{/* Warning final */}
				<div className="flex items-start gap-3 p-4 bg-destructive/10 dark:bg-destructive/20 border border-destructive/20 dark:border-destructive/30 rounded-lg">
					<AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
					<div className="flex-1">
						<p className="text-sm font-medium text-destructive dark:text-red-400">
							A categoria "{category?.name}" será excluída permanentemente.
						</p>
						<p className="text-xs text-destructive/80 dark:text-red-400/80 mt-1">
							Esta ação não pode ser desfeita.
						</p>
					</div>
				</div>

				{/* Action Buttons */}
				<div className="flex flex-col-reverse sm:flex-row gap-2 sm:justify-end">
					<Button
						type="button"
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={isLoading}
						className="w-full sm:w-auto"
					>
						Cancelar
					</Button>
					<Button
						type="button"
						variant="destructive"
						onClick={handleConfirm}
						disabled={!canConfirm() || isLoading}
						className="w-full sm:w-auto"
					>
						{isLoading ? "Excluindo..." : `Excluir Categoria${hasProducts ? ` e Transferir ${products.length} Produtos` : ""}`}
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}

