"use client";

import { useState, useEffect, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandSelect } from "@/components/selects/brand-select";
import { CategorySelect } from "@/components/selects/category-select";
import {
	ArrowLeft,
	Package,
	Save,
	Camera,
	ScanLine,
	Loader2,
} from "lucide-react";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { NutritionalScanner } from "@/components/nutritional-scanner";
import { TempStorage } from "@/lib/temp-storage";
import Link from "next/link";
import { AppToasts } from "@/lib/toasts";
import { NutritionalInfoForm } from "@/components/nutritional-info-form";
import { NutritionalInfo } from "@/types";
import { parseOcrResult } from "@/lib/ocr-parser"; // Importa o parser de OCR
import { toast } from "sonner";
import { useDataStore } from "@/store/useDataStore";

const units = [
	"unidade",
	"kg",
	"g",
	"litro",
	"ml",
	"pacote",
	"caixa",
	"garrafa",
	"lata",
	"saco",
];

export default function NovoProdutoPage() {
	const router = useRouter();
	const searchParams = useSearchParams();

	const [loading, setLoading] = useState(false);
	const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

	const { categories, fetchCategories } = useDataStore(); // Obter categorias do store

	// Novos estados para o scanner de rótulo
	const [showNutritionalScanner, setShowNutritionalScanner] = useState(false);
	const [isScanning, setIsScanning] = useState(false);

	const [formData, setFormData] = useState({
		name: "",
		barcode: "",
		categoryId: "",
		brandId: "",
		unit: "unidade",
		hasStock: false,
		minStock: "",
		maxStock: "",
		hasExpiration: false,
		defaultShelfLifeDays: "",
	});

	const [nutritionalData, setNutritionalData] = useState<Partial<NutritionalInfo>>(
		{},
	);

	useEffect(() => {
		fetchCategories();
		const nameParam = searchParams.get("name");
		if (nameParam) {
			setFormData((prev) => ({ ...prev, name: nameParam }));
		}
	}, [searchParams, fetchCategories]);

	const showNutritionalFields = useMemo(() => {
		if (!formData.categoryId || categories.length === 0) {
			return false;
		}
		const selectedCategory = categories.find(cat => cat.id === formData.categoryId);
		return selectedCategory?.isFood === true;
	}, [formData.categoryId, categories]);

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.name.trim()) {
			AppToasts.error("O nome do produto é obrigatório.");
			return;
		}

		setLoading(true);

		try {
			const hasNutritionalData = Object.values(nutritionalData).some(
				(v) =>
					v !== undefined && v !== "" && (Array.isArray(v) ? v.length > 0 : true),
			);

			const dataToSubmit = {
				...formData,
				minStock: formData.minStock ? parseFloat(formData.minStock) : null,
				maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
				defaultShelfLifeDays: formData.defaultShelfLifeDays
					? parseInt(formData.defaultShelfLifeDays)
					: null,
				nutritionalInfo: hasNutritionalData ? nutritionalData : null,
			};

			const response = await fetch("/api/products", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(dataToSubmit),
			});

			if (response.ok) {
				const newProduct = await response.json();
				const returnTo = searchParams.get("returnTo");
				const storageKey = searchParams.get("storageKey");

				if (returnTo && storageKey) {
					const preservedData = TempStorage.get(storageKey);
					if (preservedData) {
						const updatedData = {
							...preservedData,
							newProductId: newProduct.id,
						};
						const newStorageKey = TempStorage.save(updatedData);
						TempStorage.remove(storageKey);
						router.push(`${returnTo}?storageKey=${newStorageKey}`);
					} else {
						router.push(returnTo);
					}
				} else {
					router.push("/produtos");
				}
			} else {
				const error = await response.json();
				AppToasts.error(error, "Erro ao criar produto");
			}
		} catch (error) {
			AppToasts.error(error, "Erro ao criar produto");
		} finally {
			setLoading(false);
		}
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}));
	};

	const handleSelectChange = (name: string, value: string) => {
		setFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	const handleBarcodeScanned = (barcode: string) => {
		setFormData((prev) => ({ ...prev, barcode }));
		setShowBarcodeScanner(false);
	};

	// Nova função para lidar com o resultado do scanner de rótulo
	const handleNutritionalScanComplete = (extractedText: string) => {
		setIsScanning(true);
		try {
			// Usa o parser para converter texto em dados estruturados
			const parsedData = parseOcrResult(extractedText);
			setNutritionalData(parsedData); // Atualiza o estado do formulário nutricional
			toast.success("Dados nutricionais preenchidos!");
		} catch (error) {
			toast.error("Não foi possível processar o texto do rótulo.");
			console.error("Erro ao parsear OCR:", error);
		} finally {
			setIsScanning(false);
			setShowNutritionalScanner(false);
		}
	};

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/produtos">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Novo Produto</h1>
					<p className="text-gray-600 mt-2">Cadastre um novo produto</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Package className="h-5 w-5" />
							Informações do Produto
						</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							<div className="space-y-2">
								<Label htmlFor="name">Nome do Produto *</Label>
								<Input
									id="name"
									name="name"
									value={formData.name}
									onChange={handleChange}
									placeholder="Ex: Arroz Branco"
									required
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="barcode">Código de Barras</Label>
								<div className="flex gap-2">
									<Input
										id="barcode"
										name="barcode"
										value={formData.barcode}
										onChange={handleChange}
										placeholder="Digite ou escaneie o código"
									/>
									<Button
										type="button"
										variant="outline"
										onClick={() => setShowBarcodeScanner(true)}
									>
										<Camera className="h-4 w-4" />
									</Button>
								</div>
							</div>

							<div className="space-y-2">
								<Label htmlFor="brandId">Marca</Label>
								<BrandSelect
									value={formData.brandId}
									onValueChange={(value) => handleSelectChange("brandId", value)}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="categoryId">Categoria</Label>
								<CategorySelect
									value={formData.categoryId}
									onValueChange={(value) =>
										handleSelectChange("categoryId", value)
									}
								/>
							</div>

							<div className="space-y-2">
								<Label htmlFor="unit">Unidade de Medida</Label>
								<Select
									value={formData.unit}
									onValueChange={(value) => handleSelectChange("unit", value)}
								>
									<SelectTrigger>
										<SelectValue />
									</SelectTrigger>
									<SelectContent>
										{units.map((unit) => (
											<SelectItem key={unit} value={unit}>
												{unit}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-4 pt-4 border-t">
								<h3 className="text-lg font-medium">Controle de Estoque</h3>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="hasStock"
										checked={formData.hasStock}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												hasStock: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="hasStock">Produto com controle de estoque</Label>
								</div>
								{formData.hasStock && (
									<div className="grid grid-cols-2 gap-4">
										<div className="space-y-2">
											<Label htmlFor="minStock">Estoque Mínimo</Label>
											<Input
												id="minStock"
												name="minStock"
												type="number"
												step="0.01"
												value={formData.minStock}
												onChange={handleChange}
												placeholder="Ex: 5"
											/>
										</div>
										<div className="space-y-2">
											<Label htmlFor="maxStock">Estoque Máximo</Label>
											<Input
												id="maxStock"
												name="maxStock"
												type="number"
												step="0.01"
												value={formData.maxStock}
												onChange={handleChange}
												placeholder="Ex: 20"
											/>
										</div>
									</div>
								)}
							</div>

							<div className="space-y-4 pt-4 border-t">
								<h3 className="text-lg font-medium">Controle de Validade</h3>
								<div className="flex items-center space-x-2">
									<Checkbox
										id="hasExpiration"
										checked={formData.hasExpiration}
										onCheckedChange={(checked) =>
											setFormData((prev) => ({
												...prev,
												hasExpiration: checked as boolean,
											}))
										}
									/>
									<Label htmlFor="hasExpiration">Produto com validade</Label>
								</div>
								{formData.hasExpiration && (
									<div className="space-y-2">
										<Label htmlFor="defaultShelfLifeDays">
											Prazo de Validade Padrão (dias)
										</Label>
										<Input
											id="defaultShelfLifeDays"
											name="defaultShelfLifeDays"
											type="number"
											value={formData.defaultShelfLifeDays}
											onChange={handleChange}
											placeholder="Ex: 30"
										/>
										<p className="text-xs text-gray-500">
											Usado para calcular a validade ao adicionar ao estoque.
										</p>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card>
{showNutritionalFields && (
					<>
				<Card>
					<CardHeader>
						<CardTitle>Scanner de Rótulo</CardTitle>
						<p className="text-sm text-gray-600">
							Escaneie o rótulo para preencher automaticamente os campos
							nutricionais.
						</p>
					</CardHeader>
					<CardContent>
						<Button
							type="button"
							onClick={() => setShowNutritionalScanner(true)}
							disabled={isScanning}
							variant="outline"
							className="w-full md:w-auto"
						>
							{isScanning ? (
								<>
									<Loader2 className="mr-2 h-4 w-4 animate-spin" />
									Aguarde...
								</>
							) : (
								<>
									<ScanLine className="mr-2 h-4 w-4" />
									Escanear Rótulo
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{/* O formulário agora é preenchido via estado */}
				<NutritionalInfoForm
					initialData={nutritionalData}
					onDataChange={setNutritionalData}
				/>
									</>
				)}

				<div className="flex gap-3 pt-4">
					<Button type="submit" disabled={loading}>
						<Save className="h-4 w-4 mr-2" />
						{loading ? "Salvando..." : "Salvar Produto"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => {
							const returnTo = searchParams.get("returnTo");
							const storageKey = searchParams.get("storageKey");
							if (returnTo && storageKey) {
								TempStorage.remove(storageKey);
								router.push(returnTo);
							} else {
								router.push("/produtos");
							}
						}}
					>
						Cancelar
					</Button>
				</div>
			</form>

			<BarcodeScanner
				isOpen={showBarcodeScanner}
				onScan={handleBarcodeScanned}
				onClose={() => setShowBarcodeScanner(false)}
			/>
			<NutritionalScanner
				isOpen={showNutritionalScanner}
				onClose={() => setShowNutritionalScanner(false)}
				onScanComplete={handleNutritionalScanComplete}
			/>
		</div>
	);
}