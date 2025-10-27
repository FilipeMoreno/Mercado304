"use client"

import { AlertTriangle, Barcode, Edit, Package, Plus, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"

interface ProductDuplicateDialogProps {
	isOpen: boolean
	existingProduct: {
		id: string
		name: string
		brand?: { name: string }
		category?: { name: string }
		packageSize?: string
		barcodes?: { barcode: string }[]
	}
	onClose: () => void
	onAddBarcode: () => void
	onEditProduct: () => void
	onContinue: () => void
}

export function ProductDuplicateDialog({
	isOpen,
	existingProduct,
	onClose,
	onAddBarcode,
	onEditProduct,
	onContinue,
}: ProductDuplicateDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[500px]">
				<DialogHeader>
					<div className="flex items-center gap-3">
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/20">
							<AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-500" />
						</div>
						<div className="flex-1">
							<DialogTitle className="text-xl">Produto Já Cadastrado</DialogTitle>
							<DialogDescription className="mt-1">
								Encontramos um produto com características semelhantes
							</DialogDescription>
						</div>
					</div>
				</DialogHeader>

				<div className="space-y-4 py-4">
					{/* Produto Existente */}
					<div className="rounded-lg border bg-muted/50 p-4 space-y-3">
						<div className="flex items-start gap-2">
							<Package className="h-5 w-5 text-muted-foreground shrink-0 mt-0.5" />
							<div className="flex-1 min-w-0">
								<p className="text-sm font-medium text-muted-foreground mb-1">Produto existente</p>
								<p className="font-semibold text-base">{existingProduct.name}</p>

								<div className="mt-3 space-y-2">
									{existingProduct.brand?.name && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Tag className="h-3.5 w-3.5" />
											<span>{existingProduct.brand.name}</span>
										</div>
									)}

									{existingProduct.category?.name && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Package className="h-3.5 w-3.5" />
											<span>{existingProduct.category.name}</span>
										</div>
									)}

									{existingProduct.packageSize && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<span className="font-medium">Tamanho:</span>
											<span>{existingProduct.packageSize}</span>
										</div>
									)}

									{existingProduct.barcodes && existingProduct.barcodes.length > 0 && (
										<div className="flex items-center gap-2 text-sm text-muted-foreground">
											<Barcode className="h-3.5 w-3.5" />
											<span>
												{existingProduct.barcodes.length} código{existingProduct.barcodes.length !== 1 ? "s" : ""} de barras
											</span>
										</div>
									)}
								</div>
							</div>
						</div>
					</div>

					<Separator />

					{/* Ações Sugeridas */}
					<div className="space-y-3">
						<p className="text-sm font-medium">O que você deseja fazer?</p>

						<div className="grid gap-2">
							<Button
								variant="outline"
								className="h-auto py-3 px-4 justify-start text-left"
								onClick={onAddBarcode}
							>
								<div className="flex items-start gap-3 w-full">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
										<Barcode className="h-4 w-4 text-primary" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">Adicionar Código de Barras</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											É o mesmo produto, apenas vincule um novo código
										</p>
									</div>
								</div>
							</Button>

							<Button
								variant="outline"
								className="h-auto py-3 px-4 justify-start text-left"
								onClick={onEditProduct}
							>
								<div className="flex items-start gap-3 w-full">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-500/10">
										<Edit className="h-4 w-4 text-blue-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">Editar Produto Existente</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											Corrigir ou atualizar informações do produto
										</p>
									</div>
								</div>
							</Button>

							<Button
								variant="outline"
								className="h-auto py-3 px-4 justify-start text-left"
								onClick={onContinue}
							>
								<div className="flex items-start gap-3 w-full">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-500/10">
										<Plus className="h-4 w-4 text-green-600" />
									</div>
									<div className="flex-1">
										<p className="font-medium text-sm">Continuar Cadastro</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											São produtos diferentes, criar novo cadastro
										</p>
									</div>
								</div>
							</Button>
						</div>
					</div>
				</div>

				<Separator />

				<div className="flex justify-end">
					<Button variant="ghost" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	)
}

