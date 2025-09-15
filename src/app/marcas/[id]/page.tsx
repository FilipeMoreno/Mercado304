"use client"

import { ArrowLeft, BarChart3, Edit, Factory, Package, Tag, Trash2 } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useDataMutation } from "@/hooks/use-data-mutation"
import type { Brand } from "@/types"

interface BrandDetails extends Brand {
	products: {
		id: string
		name: string
		unit: string
		category?: { name: string }
	}[]
	_count: {
		products: number
	}
}

export default function MarcaDetalhesPage() {
	const params = useParams()
	const router = useRouter()
	const brandId = params.id as string

	const [brand, setBrand] = useState<BrandDetails | null>(null)
	const [loading, setLoading] = useState(true)

	const { remove, loading: deleting } = useDataMutation()

	const fetchBrandDetails = useCallback(async () => {
		try {
			const response = await fetch(`/api/brands/${brandId}`)

			if (!response.ok) {
				toast.error("Marca não encontrada")
				router.push("/marcas")
				return
			}

			const data = await response.json()
			setBrand(data)
		} catch (error) {
			console.error("Erro ao buscar detalhes da marca:", error)
			toast.error("Erro ao carregar detalhes da marca")
			router.push("/marcas")
		} finally {
			setLoading(false)
		}
	}, [brandId, router])

	useEffect(() => {
		if (brandId) {
			fetchBrandDetails()
		}
	}, [brandId, fetchBrandDetails])

	const deleteBrand = async () => {
		if (!brand) return
		await remove(`/api/brands/${brand.id}`, {
			successMessage: "Marca excluída com sucesso!",
			onSuccess: () => router.push("/marcas"),
		})
	}

	if (loading) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<div className="h-9 w-20 bg-gray-200 rounded animate-pulse" />
					<div className="flex-1">
						<div className="flex items-center gap-3">
							<div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
							<div>
								<div className="h-8 w-64 mb-2 bg-gray-200 rounded animate-pulse" />
								<div className="flex items-center gap-2">
									<div className="h-6 w-16 bg-gray-200 rounded animate-pulse" />
									<div className="h-6 w-20 bg-gray-200 rounded animate-pulse" />
								</div>
							</div>
						</div>
					</div>
				</div>
				<Card>
					<CardHeader>
						<div className="h-6 w-40 bg-gray-200 rounded animate-pulse" />
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{Array.from({ length: 6 }).map((_, i) => (
								<Card key={i}>
									<CardHeader>
										<div className="flex items-center gap-2">
											<div className="h-5 w-5 bg-gray-200 rounded animate-pulse" />
											<div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
										</div>
										<div className="space-y-1 mt-2">
											<div className="h-4 w-40 bg-gray-200 rounded animate-pulse" />
											<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
										</div>
									</CardHeader>
									<CardContent>
										<div className="flex gap-2">
											<div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
											<div className="h-8 w-8 bg-gray-200 rounded animate-pulse" />
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!brand) {
		return null
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
				<div className="flex-1">
					<div className="flex items-center gap-3">
						<div className="text-4xl">
							<Factory className="h-10 w-10 text-primary" />
						</div>
						<div>
							<h1 className="text-3xl font-bold">{brand.name}</h1>
							<p className="text-gray-600 mt-1">
								{brand._count?.products || 0}{" "}
								{(brand._count?.products || 0) === 1 ? "produto cadastrado" : "produtos cadastrados"}
							</p>
						</div>
					</div>
				</div>
				<div className="flex gap-2">
					<Link href={`/marcas/${brandId}/editar`}>
						<Button variant="outline" size="sm">
							<Edit className="h-4 w-4 mr-2" />
							Editar
						</Button>
					</Link>
					<Button
						variant="destructive"
						size="sm"
						onClick={deleteBrand}
						disabled={(brand._count?.products || 0) > 0 || deleting}
					>
						<Trash2 className="h-4 w-4 mr-2" />
						Excluir
					</Button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium">Produtos Cadastrados</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-2xl font-bold">{brand._count?.products || 0}</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Package className="h-5 w-5" />
						Produtos da Marca
					</CardTitle>
					<CardDescription>Todos os produtos associados a esta marca</CardDescription>
				</CardHeader>
				<CardContent>
					{brand.products.length === 0 ? (
						<div className="text-center py-12 text-gray-500">
							<Package className="h-12 w-12 mx-auto mb-4" />
							<p className="text-lg font-medium mb-2">Nenhum produto desta marca</p>
							<p className="text-gray-600">
								Comece adicionando produtos a esta marca na{" "}
								<Link href="/produtos" className="text-blue-600 hover:underline">
									página de produtos
								</Link>
							</p>
						</div>
					) : (
						<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
							{brand.products.map((product) => (
								<Card key={product.id} className="hover:shadow-md transition-shadow">
									<CardHeader className="pb-3">
										<CardTitle className="text-lg flex items-center gap-2">
											<Package className="h-5 w-5" />
											{product.name}
										</CardTitle>
										<CardDescription className="space-y-1">
											{product.category && (
												<div className="flex items-center gap-1 text-sm text-gray-600">
													<Tag className="h-3 w-3" />
													<span>{product.category.name}</span>
												</div>
											)}
											<div className="text-sm text-gray-600">Unidade: {product.unit}</div>
										</CardDescription>
									</CardHeader>
									<CardContent className="pt-0">
										<div className="flex gap-2">
											<Link href={`/produtos/${product.id}`}>
												<Button variant="outline" size="sm">
													<BarChart3 className="h-4 w-4 mr-1" />
													Detalhes
												</Button>
											</Link>
										</div>
									</CardContent>
								</Card>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	)
}
