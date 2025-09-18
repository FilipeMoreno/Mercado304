"use client"

import { ArrowLeft, Save, X } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useCreateBrandMutation } from "@/hooks"

export default function NovaMarcaPage() {
	const router = useRouter()
	const createBrandMutation = useCreateBrandMutation()
	
	const [formData, setFormData] = useState({
		name: "",
	})

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		
		if (!formData.name.trim()) {
			toast.error("Nome da marca é obrigatório")
			return
		}

		try {
			await createBrandMutation.mutateAsync({
				name: formData.name.trim(),
			})
			
			toast.success("Marca criada com sucesso!")
			router.push("/marcas")
		} catch (error) {
			console.error("Error creating brand:", error)
			toast.error("Erro ao criar marca")
		}
	}

	const handleCancel = () => {
		router.push("/marcas")
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
					<h1 className="text-3xl font-bold">Nova Marca</h1>
					<p className="text-gray-600 mt-2">Crie uma nova marca para seus produtos</p>
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
								onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
								placeholder="Ex: Coca-Cola, Nestlé, Unilever..."
								required
							/>
							<p className="text-xs text-gray-500">
								Digite o nome da marca ou fabricante do produto
							</p>
						</div>

						<div className="flex gap-3 pt-6 border-t">
							<Button
								type="submit"
								disabled={createBrandMutation.isPending || !formData.name.trim()}
								className="flex-1"
							>
								<Save className="h-4 w-4 mr-2" />
								{createBrandMutation.isPending ? "Criando..." : "Criar Marca"}
							</Button>
							<Button
								type="button"
								variant="outline"
								onClick={handleCancel}
								disabled={createBrandMutation.isPending}
							>
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