"use client"

import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ImageUpload } from "@/components/ui/image-upload"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBrandQuery, useUpdateBrandMutation } from "@/hooks"

export default function EditarMarcaPage() {
	const params = useParams()
	const router = useRouter()
	const brandId = params.id as string

	const { data: brand, isLoading } = useBrandQuery(brandId)
	const updateBrandMutation = useUpdateBrandMutation()

	const [formData, setFormData] = useState({
		name: "",
		imageUrl: "",
	})
	const [isUploadingImage, setIsUploadingImage] = useState(false)

	useEffect(() => {
		if (brand) {
			setFormData({
				name: brand.name || "",
				imageUrl: brand.imageUrl || "",
			})
		}
	}, [brand])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error("Nome da marca é obrigatório")
			return
		}

		try {
			await updateBrandMutation.mutateAsync({
				id: brandId,
				data: {
					name: formData.name.trim(),
					imageUrl: formData.imageUrl || undefined,
				},
			})

			toast.success("Marca atualizada com sucesso!")
			setTimeout(() => {
				router.push("/marcas")
			}, 100)
		} catch (error) {
			console.error("Error updating brand:", error)
			toast.error("Erro ao atualizar marca")
		}
	}

	const handleCancel = () => {
		router.push("/marcas")
	}

	if (isLoading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
					<div>
						<div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2" />
						<div className="h-5 w-64 bg-gray-200 rounded animate-pulse" />
					</div>
				</div>
				<Card>
					<CardHeader>
						<div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
					</CardHeader>
					<CardContent className="space-y-6">
						<div className="space-y-2">
							<div className="h-4 w-32 bg-gray-200 rounded animate-pulse" />
							<div className="h-10 w-full bg-gray-200 rounded animate-pulse" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!brand) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link href="/marcas">
						<Button variant="outline" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-red-600">Marca não encontrada</h1>
						<p className="text-gray-600 mt-2">A marca que você está tentando editar não existe</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/marcas">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Editar Marca</h1>
					<p className="text-gray-600 mt-2">Atualize as informações da marca {brand.name}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Informações da Marca</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="name">Nome da Marca *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Ex: Coca-Cola, Nestlé, Unilever..."
								required
							/>
							<p className="text-xs text-gray-500">Digite o nome da marca ou fabricante do produto</p>
						</div>

						<div className="space-y-2">
							<Label>Logo da Marca (opcional)</Label>
							<ImageUpload
								currentImageUrl={formData.imageUrl}
								onImageChange={(url) => setFormData((prev) => ({ ...prev, imageUrl: url || "" }))}
								onUploadStateChange={setIsUploadingImage}
								disabled={updateBrandMutation.isPending}
								folder="brands"
							/>
							<p className="text-xs text-gray-500">Tamanho recomendado: 400x400px (formato quadrado)</p>
						</div>

						<div className="flex gap-3 pt-6 border-t">
							<Button
								type="submit"
								disabled={updateBrandMutation.isPending || isUploadingImage || !formData.name.trim()}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{isUploadingImage ? "Enviando imagem..." : updateBrandMutation.isPending ? "Atualizando..." : "Atualizar Marca"}
							</Button>
							<Button type="button" variant="outline" onClick={handleCancel} disabled={updateBrandMutation.isPending || isUploadingImage}>
								<X className="h-4 w-4 mr-2" />
								Cancelar
							</Button>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}