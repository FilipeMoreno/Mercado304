// src/components/quick-product-form.tsx
"use client";

import { Plus, Save, Zap } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { BrandSelect } from "@/components/selects/brand-select";
import { CategorySelect } from "@/components/selects/category-select";
import { Button } from "@/components/ui/button";
import {
	DialogContent,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";

interface QuickProduct {
	name: string;
	categoryId: string;
	unit: string;
	brandId?: string;
}

interface QuickProductFormProps {
	onClose: () => void;
	onProductCreated: (newProduct: any) => void;
	onOpenBrandForm: () => void; // Novo: Propriedade para abrir o formulário de marca
}

export function QuickProductForm({
	onClose,
	onProductCreated,
	onOpenBrandForm,
}: QuickProductFormProps) {
	const [quickProduct, setQuickProduct] = useState<QuickProduct>({
		name: "",
		categoryId: "",
		unit: "unidade",
		brandId: "",
	});
	const [savingQuickProduct, setSavingQuickProduct] = useState(false);

	const createQuickProduct = async () => {
		if (!quickProduct.name.trim()) {
			toast.error("Nome do produto é obrigatório");
			return;
		}

		setSavingQuickProduct(true);

		try {
			const response = await fetch("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: quickProduct.name,
					categoryId: quickProduct.categoryId || null,
					unit: quickProduct.unit,
					brandId: quickProduct.brandId || null,
				}),
			});

			if (response.ok) {
				const newProduct = await response.json();
				onProductCreated(newProduct);
				onClose();
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao criar produto");
			}
		} catch (error) {
			console.error("Erro ao criar produto:", error);
			toast.error("Erro ao criar produto");
		} finally {
			setSavingQuickProduct(false);
		}
	};

	return (
		<DialogContent className="max-w-md">
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<Zap className="h-5 w-5" />
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
							setQuickProduct((prev) => ({ ...prev, name: e.target.value }))
						}
						placeholder="Ex: Leite Integral"
					/>
				</div>

				<div className="space-y-2">
					<Label htmlFor="quickProductCategory">Categoria</Label>
					<CategorySelect
						value={quickProduct.categoryId}
						onValueChange={(value) =>
							setQuickProduct((prev) => ({ ...prev, categoryId: value }))
						}
					/>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="space-y-2">
						<Label htmlFor="quickProductUnit">Unidade</Label>
						<Select
							value={quickProduct.unit}
							onValueChange={(value) =>
								setQuickProduct((prev) => ({ ...prev, unit: value }))
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
						<div className="flex justify-between items-center">
							<Label htmlFor="quickProductBrand">Marca</Label>
							<Button
								type="button"
								variant="link"
								size="sm"
								onClick={onOpenBrandForm}
							>
								<Plus className="h-3 w-3" />
								Nova Marca
							</Button>
						</div>
						<BrandSelect
							value={quickProduct.brandId || ""}
							onValueChange={(value) =>
								setQuickProduct((prev) => ({ ...prev, brandId: value }))
							}
							// O onCreateNew padrão do Combobox foi substituído pelo botão acima
						/>
					</div>
				</div>

				<div className="flex gap-2 pt-4">
					<Button
						onClick={createQuickProduct}
						disabled={savingQuickProduct}
						className="flex-1"
					>
						<Save className="h-4 w-4 mr-2" />
						{savingQuickProduct ? "Criando..." : "Criar e Usar"}
					</Button>
					<Button type="button" variant="outline" onClick={onClose}>
						Cancelar
					</Button>
				</div>
			</div>
		</DialogContent>
	);
}
