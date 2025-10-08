"use client"

import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useMarketQuery, useUpdateMarketMutation } from "@/hooks"

export default function EditarMercadoPage() {
	const params = useParams()
	const router = useRouter()
	const marketId = params.id as string

	const { data: market, isLoading } = useMarketQuery(marketId)
	const updateMarketMutation = useUpdateMarketMutation()

	const [formData, setFormData] = useState({
		name: "",
		address: "",
	})

	useEffect(() => {
		if (market) {
			setFormData({
				name: market.name || "",
				address: market.address || "",
			})
		}
	}, [market])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error("Nome do mercado é obrigatório")
			return
		}

		try {
			await updateMarketMutation.mutateAsync({
				id: marketId,
				data: {
					name: formData.name.trim(),
					address: formData.address.trim() || null,
				},
			})

			toast.success("Mercado atualizado com sucesso!")
			setTimeout(() => {
				router.push("/mercados")
			}, 100)
		} catch (error) {
			console.error("Error updating market:", error)
			toast.error("Erro ao atualizar mercado")
		}
	}

	const handleCancel = () => {
		router.push("/mercados")
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
						<div className="space-y-2">
							<div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
							<div className="h-20 w-full bg-gray-200 rounded animate-pulse" />
						</div>
					</CardContent>
				</Card>
			</div>
		)
	}

	if (!market) {
		return (
			<div className="space-y-6">
				<div className="flex items-center gap-4">
					<Link href="/mercados">
						<Button variant="outline" size="sm">
							<ArrowLeft className="h-4 w-4 mr-2" />
							Voltar
						</Button>
					</Link>
					<div>
						<h1 className="text-3xl font-bold text-red-600">Mercado não encontrado</h1>
						<p className="text-gray-600 mt-2">O mercado que você está tentando editar não existe</p>
					</div>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/mercados">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Editar Mercado</h1>
					<p className="text-gray-600 mt-2">Atualize as informações do mercado {market.name}</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Informações do Mercado</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-6">
						<div className="space-y-2">
							<Label htmlFor="name">Nome do Mercado *</Label>
							<Input
								id="name"
								value={formData.name}
								onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
								placeholder="Ex: Supermercado ABC, Mercado Central..."
								required
							/>
							<p className="text-xs text-gray-500">Digite o nome do estabelecimento comercial</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor="address">Endereço</Label>
							<Textarea
								id="address"
								value={formData.address}
								onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
								placeholder="Ex: Rua das Flores, 123 - Centro - São Paulo/SP"
								rows={3}
							/>
							<p className="text-xs text-gray-500">Endereço completo do mercado (opcional)</p>
						</div>

						<div className="flex gap-3 pt-6 border-t">
							<Button
								type="submit"
								disabled={updateMarketMutation.isPending || !formData.name.trim()}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{updateMarketMutation.isPending ? "Atualizando..." : "Atualizar Mercado"}
							</Button>
							<Button type="button" variant="outline" onClick={handleCancel} disabled={updateMarketMutation.isPending}>
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