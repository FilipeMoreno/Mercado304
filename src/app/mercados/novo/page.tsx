"use client"

import { ArrowLeft, Save, Store } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useId, useState, useEffect } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useCreateMarketMutation } from "@/hooks"

export default function NovoMercadoPage() {
	const router = useRouter()
	const searchParams = useSearchParams()
	const createMarketMutation = useCreateMarketMutation()
	const nameId = useId()
	const legalNameId = useId()
	const locationId = useId()
	const [formData, setFormData] = useState({
		name: "",
		legalName: "",
		location: "",
	})

	// Auto-preencher com parâmetro da URL
	useEffect(() => {
		const nameParam = searchParams.get("name")
		if (nameParam) {
			setFormData((prev) => ({
				...prev,
				name: nameParam,
			}))
		}
	}, [searchParams])

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()

		if (!formData.name.trim()) {
			toast.error("Nome do mercado é obrigatório")
			return
		}

		try {
			await createMarketMutation.mutateAsync({
				name: formData.name.trim(),
				legalName: formData.legalName.trim() || undefined,
				location: formData.location.trim() || undefined,
			})

			toast.success("Mercado criado com sucesso!")
			// Pequeno delay para garantir que a invalidação seja processada
			setTimeout(() => {
				router.push("/mercados")
			}, 100)
		} catch (error) {
			console.error("Erro ao criar mercado:", error)
			toast.error("Erro ao criar mercado")
		}
	}

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setFormData((prev) => ({
			...prev,
			[e.target.name]: e.target.value,
		}))
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
					<h1 className="text-3xl font-bold">Novo Mercado</h1>
					<p className="text-gray-600 mt-2">Cadastre um novo mercado</p>
				</div>
			</div>

			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Store className="h-5 w-5" />
						Informações do Mercado
					</CardTitle>
				</CardHeader>
				<CardContent>
					<form onSubmit={handleSubmit} className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={nameId}>Nome do Mercado *</Label>
							<Input
								id={nameId}
								name="name"
								value={formData.name}
								onChange={handleChange}
								placeholder="Ex: Supermercado ABC"
								required
							/>
							<p className="text-xs text-muted-foreground">Nome fantasia usado no aplicativo</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor={legalNameId}>Nome de Registro / Razão Social</Label>
							<Input
								id={legalNameId}
								name="legalName"
								value={formData.legalName}
								onChange={handleChange}
								placeholder="Ex: ABC Supermercados Ltda"
							/>
							<p className="text-xs text-muted-foreground">Nome que aparece na nota fiscal</p>
						</div>

						<div className="space-y-2">
							<Label htmlFor={locationId}>Localização</Label>
							<Textarea
								id={locationId}
								name="location"
								value={formData.location}
								onChange={handleChange}
								placeholder="Ex: Rua das Flores, 123 - Centro"
								rows={3}
							/>
						</div>

						<div className="flex gap-3 pt-4">
							<Button type="submit" disabled={createMarketMutation.isPending || !formData.name.trim()}>
								<Save className="h-4 w-4 mr-2" />
								{createMarketMutation.isPending ? "Criando..." : "Criar Mercado"}
							</Button>
							<Link href="/mercados">
								<Button type="button" variant="outline" disabled={createMarketMutation.isPending}>
									Cancelar
								</Button>
							</Link>
						</div>
					</form>
				</CardContent>
			</Card>
		</div>
	)
}
