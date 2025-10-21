"use client"

import { Save } from "lucide-react"
import { BrandSelect } from "@/components/selects/brand-select"
import { BrandSelectDialog } from "@/components/selects/brand-select-dialog"
import { CategorySelect } from "@/components/selects/category-select"
import { CategorySelectDialog } from "@/components/selects/category-select-dialog"
import { UnitSelectDialog } from "@/components/selects/unit-select-dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useUIPreferences } from "@/hooks"

interface QuickProduct {
	name: string
	categoryId: string
	unit: string
	brandId: string
}

interface QuickProductDialogProps {
	isOpen: boolean
	onClose: () => void
	quickProduct: QuickProduct
	onQuickProductChange: (product: QuickProduct) => void
	onCreateProduct: () => Promise<void>
	saving: boolean
}

export function QuickProductDialog({
	isOpen,
	onClose,
	quickProduct,
	onQuickProductChange,
	onCreateProduct,
	saving,
}: QuickProductDialogProps) {
	const { selectStyle } = useUIPreferences()

	return (
		<ResponsiveDialog open={isOpen} onOpenChange={onClose} title="Adicionar Produto Rápido" maxWidth="md">
			<div className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="quickProductName">Nome do Produto *</Label>
					<Input
						id="quickProductName"
						value={quickProduct.name}
						onChange={(e) => onQuickProductChange({ ...quickProduct, name: e.target.value })}
						placeholder="Ex: Leite Integral"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="quickProductCategory">Categoria</Label>
					{selectStyle === "dialog" ? (
						<CategorySelectDialog
							value={quickProduct.categoryId}
							onValueChange={(value) => onQuickProductChange({ ...quickProduct, categoryId: value })}
						/>
					) : (
						<CategorySelect
							value={quickProduct.categoryId}
							onValueChange={(value) => onQuickProductChange({ ...quickProduct, categoryId: value })}
						/>
					)}
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="quickProductUnit">Unidade</Label>
						{selectStyle === "dialog" ? (
							<UnitSelectDialog
								value={quickProduct.unit}
								onValueChange={(value) => onQuickProductChange({ ...quickProduct, unit: value })}
							/>
						) : (
							<Select
								value={quickProduct.unit}
								onValueChange={(value) => onQuickProductChange({ ...quickProduct, unit: value })}
							>
								<SelectTrigger>
									<SelectValue />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="unidade">Unidade</SelectItem>
									<SelectItem value="kg">Kg</SelectItem>
									<SelectItem value="g">Gramas</SelectItem>
									<SelectItem value="l">Litros</SelectItem>
									<SelectItem value="ml">ML</SelectItem>
									<SelectItem value="pacote">Pacote</SelectItem>
								</SelectContent>
							</Select>
						)}
					</div>

					<div className="space-y-2">
						<Label htmlFor="quickProductBrand">Marca</Label>
						{selectStyle === "dialog" ? (
							<BrandSelectDialog
								value={quickProduct.brandId || ""}
								onValueChange={(value) => onQuickProductChange({ ...quickProduct, brandId: value })}
							/>
						) : (
							<BrandSelect
								value={quickProduct.brandId || ""}
								onValueChange={(value) => onQuickProductChange({ ...quickProduct, brandId: value })}
							/>
						)}
					</div>
				</div>

				<div className="flex gap-2 pt-4">
					<Button onClick={onCreateProduct} disabled={saving} className="flex-1">
						<Save className="size-4 mr-2" />
						{saving ? "Criando..." : "Criar e Usar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</div>
		</ResponsiveDialog>
	)
}
