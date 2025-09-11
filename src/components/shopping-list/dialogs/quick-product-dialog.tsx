"use client";

import { Plus, Save } from "lucide-react";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { CategorySelect } from "@/components/selects/category-select";
import { BrandSelect } from "@/components/selects/brand-select";

interface QuickProduct {
	name: string;
	categoryId: string;
	unit: string;
	brandId: string;
}

interface QuickProductDialogProps {
	isOpen: boolean;
	onClose: () => void;
	quickProduct: QuickProduct;
	onQuickProductChange: (product: QuickProduct) => void;
	onCreateProduct: () => Promise<void>;
	saving: boolean;
}

export function QuickProductDialog({
	isOpen,
	onClose,
	quickProduct,
	onQuickProductChange,
	onCreateProduct,
	saving,
}: QuickProductDialogProps) {
	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Plus className="h-5 w-5" />
						Adicionar Produto Rápido
					</DialogTitle>
				</DialogHeader>
				<div className="space-y-4">
					<div className="space-y-2">
						<Label htmlFor="quickProductName">Nome do Produto *</Label>
						<Input
							id="quickProductName"
							value={quickProduct.name}
							onChange={(e) =>
								onQuickProductChange({ ...quickProduct, name: e.target.value })
							}
							placeholder="Ex: Leite Integral"
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="quickProductCategory">Categoria</Label>
						<CategorySelect
							value={quickProduct.categoryId}
							onValueChange={(value) =>
								onQuickProductChange({ ...quickProduct, categoryId: value })
							}
						/>
					</div>

					<div className="grid grid-cols-2 gap-4">
						<div className="space-y-2">
							<Label htmlFor="quickProductUnit">Unidade</Label>
							<Select
								value={quickProduct.unit}
								onValueChange={(value) =>
									onQuickProductChange({ ...quickProduct, unit: value })
								}
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
						</div>

						<div className="space-y-2">
							<Label htmlFor="quickProductBrand">Marca</Label>
							<BrandSelect
								value={quickProduct.brandId || ""}
								onValueChange={(value) =>
									onQuickProductChange({ ...quickProduct, brandId: value })
								}
							/>
						</div>
					</div>

					<div className="flex gap-2 pt-4">
						<Button
							onClick={onCreateProduct}
							disabled={saving}
							className="flex-1"
						>
							<Save className="h-4 w-4 mr-2" />
							{saving ? "Criando..." : "Criar e Usar"}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={onClose}
						>
							Cancelar
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
}