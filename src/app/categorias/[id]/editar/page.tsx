"use client"

import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { useCategoryQuery, useUpdateCategoryMutation } from "@/hooks"

export default function EditarCategoriaPage() {
	const params = useParams()
	const router = useRouter()
	const categoryId = params.id as string
	const nameId = useId()
	const iconId = useId()
	const colorId = useId()
	const isFoodId = useId()

	const { data: category, isLoading } = useCategoryQuery(categoryId)
	const updateCategoryMutation = useUpdateCategoryMutation()

	const [formData, setFormData] = useState({
		name: "",
		icon: "",
		color: "#3b82f6",
		isFood: false,
	})

	useEffect(() => {
		if (category) {
			setFormData({
				name: category.name || "",
				icon: category.icon || "",
				color: category.color || "#3b82f6",
				isFood: category.isFood || false,
			})
		}
	}, [category])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error("Nome da categoria é obrigatório")
			return
		}

		try {
			const icon = formData.icon.trim()
			const updateData: any = {
				name: formData.name.trim(),
				color: formData.color,
				isFood: formData.isFood,
			}
			
			// Incluir icon explicitamente (pode ser string vazia para limpar)
			updateData.icon = icon || null
			
			await updateCategoryMutation.mutateAsync({
				id: categoryId,
				data: updateData,
			})

			// Toast já é enviado pelo hook - não duplicar aqui
			setTimeout(() => {
				router.push("/categorias")
			}, 500)
		} catch (error) {
			console.error("Error updating category:", error)
			// Toast de erro já é enviado pelo hook
		}
	}

	const handleCancel = () => {
		router.push("/categorias")
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-9 w-20 bg-gray-200 rounded-sm animate-pulse" />
					<div>
						<div className="h-8 w-48 bg-gray-200 rounded-sm animate-pulse mb-2" />
						<div className="h-5 w-64 bg-gray-200 rounded-sm animate-pulse" />
					</div>
				</div>
				<Card>
					<CardHeader>
						<div className="h-6 w-48 bg-gray-200 rounded-sm animate-pulse" />
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<div className="h-4 w-32 bg-gray-200 rounded-sm animate-pulse" />
							<div className="h-10 w-full bg-gray-200 rounded-sm animate-pulse" />
						</div>
						<div className="space-y-2">
							<div className="h-4 w-24 bg-gray-200 rounded-sm animate-pulse" />
							<div className="h-20 w-full bg-gray-200 rounded-sm animate-pulse" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!category) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link href="/categorias">
						<Button variant="outline" size="sm">
							<ArrowLeft className="size-4 mr-2" />
							Voltar
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-red-600">Categoria não encontrada</h1>
						<p className="text-gray-600 mt-2">A categoria que você está tentando editar não existe</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/categorias">
					<Button variant="outline" size="sm">
						<ArrowLeft className="size-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Editar Categoria</h1>
					<p className="text-gray-600 mt-2">Atualize as informações da categoria {category.name}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Informações da Categoria</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor={nameId}>Nome da Categoria *</Label>
							<Input
								id={nameId}
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Ex: Bebidas, Laticínios, Carnes..."
								required
							/>
							<p className="text-xs text-gray-500">Digite o nome da categoria de produtos</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor={iconId}>Ícone (Emoji)</Label>
							<Input
								id={iconId}
								value={formData.icon}
								onChange={(e) => setFormData((prev) => ({ ...prev, icon: e.target.value }))}
								placeholder="📦 🥛 🍖 🍞 (opcional)"
								maxLength={10}
							/>
							<p className="text-xs text-gray-500">Use emojis para representar visualmente a categoria</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor={colorId}>Cor da Categoria</Label>
							<div className="flex items-center gap-3">
								<Input
									id={colorId}
									type="color"
									value={formData.color}
									onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
									className="w-20 h-10"
								/>
								<Input
									value={formData.color}
									onChange={(e) => setFormData((prev) => ({ ...prev, color: e.target.value }))}
									placeholder="#3b82f6"
									className="flex-1"
								/>
							</div>
						</div>

						<div className="flex items-center space-x-3">
							<Switch
								id={isFoodId}
								checked={formData.isFood}
								onCheckedChange={(checked) => setFormData((prev) => ({ ...prev, isFood: checked }))}
							/>
							<div>
								<Label htmlFor={isFoodId}>Esta categoria é um alimento?</Label>
								<p className="text-xs text-gray-500">Marque se esta categoria representa produtos alimentícios</p>
							</div>
						</div>

						<div className="flex gap-3 pt-6 border-t">
							<Button
								type="submit"
								disabled={updateCategoryMutation.isPending || !formData.name.trim()}
								className="flex-1"
							>
								<Save className="size-4 mr-2" />
								{updateCategoryMutation.isPending ? "Atualizando..." : "Atualizar Categoria"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={updateCategoryMutation.isPending}
							>
								<X className="size-4 mr-2" />
								Cancelar
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
