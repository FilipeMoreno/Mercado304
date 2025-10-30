"use client"

import { AlertCircle, CheckCircle, Loader2, Package, RefreshCw, Save } from "lucide-react"
import { useEffect, useState } from "react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"

interface ProductAnalysis {
	id: string
	currentName: string
	proposedName: string
	packageSize: string | null
	confidence: "high" | "medium" | "low"
	pattern: string
}

export default function MigratePackageSizePage() {
	const [products, setProducts] = useState<ProductAnalysis[]>([])
	const [loading, setLoading] = useState(true)
	const [analyzing, setAnalyzing] = useState(false)
	const [applying, setApplying] = useState(false)
	const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
	const [stats, setStats] = useState({ total: 0, detected: 0, applied: 0 })

  const analyzeProducts = async () => {
		setAnalyzing(true)
		try {
			const response = await fetch("/api/admin/migrate-package-size/analyze")
			const data = await response.json()
			setProducts(data.products || [])
			setStats(data.stats || { total: 0, detected: 0, applied: 0 })
		} catch (error) {
			console.error("Erro ao analisar produtos:", error)
		} finally {
			setAnalyzing(false)
			setLoading(false)
		}
  }

  useEffect(() => {
    analyzeProducts()
  }, [])

	const applyChanges = async (productIds: string[]) => {
		setApplying(true)
		try {
			const response = await fetch("/api/admin/migrate-package-size/apply", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productIds }),
			})
			
			if (response.ok) {
				// Recarregar análise
				await analyzeProducts()
				setSelectedIds(new Set())
			}
		} catch (error) {
			console.error("Erro ao aplicar mudanças:", error)
		} finally {
			setApplying(false)
		}
	}

	const toggleSelect = (id: string) => {
		const newSelected = new Set(selectedIds)
		if (newSelected.has(id)) {
			newSelected.delete(id)
		} else {
			newSelected.add(id)
		}
		setSelectedIds(newSelected)
	}

	const selectAll = () => {
		if (selectedIds.size === products.length) {
			setSelectedIds(new Set())
		} else {
			setSelectedIds(new Set(products.map(p => p.id)))
		}
	}

	const getConfidenceColor = (confidence: string) => {
		switch (confidence) {
			case "high": return "bg-green-100 text-green-800 border-green-300"
			case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-300"
			case "low": return "bg-red-100 text-red-800 border-red-300"
			default: return "bg-gray-100 text-gray-800 border-gray-300"
		}
	}

	if (loading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<div className="flex items-center justify-center h-64">
					<Loader2 className="h-8 w-8 animate-spin text-primary" />
				</div>
			</div>
		)
	}

	return (
		<div className="container mx-auto py-8 px-4 max-w-7xl">
			<div className="mb-8">
				<h1 className="text-3xl font-bold flex items-center gap-2">
					<Package className="h-8 w-8" />
					Migração de Peso/Volume dos Produtos
				</h1>
				<p className="text-muted-foreground mt-2">
					Analise e migre informações de peso/volume dos nomes dos produtos para o campo específico
				</p>
			</div>

			{/* Estatísticas */}
			<div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
				<Card>
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-muted-foreground">Total de Produtos</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold">{stats.total}</div>
					</CardContent>
				</Card>
				<Card className="border-blue-200 bg-blue-50/50">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-blue-900">Detectados</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-blue-900">{stats.detected}</div>
						<p className="text-xs text-muted-foreground mt-1">Com peso/volume no nome</p>
					</CardContent>
				</Card>
				<Card className="border-green-200 bg-green-50/50">
					<CardHeader className="pb-3">
						<CardTitle className="text-sm font-medium text-green-900">Já Migrados</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="text-3xl font-bold text-green-900">{stats.applied}</div>
						<p className="text-xs text-muted-foreground mt-1">Com packageSize preenchido</p>
					</CardContent>
				</Card>
			</div>

			{/* Ações em lote */}
			{products.length > 0 && (
				<Card className="mb-6">
					<CardHeader>
						<CardTitle>Ações em Lote</CardTitle>
						<CardDescription>Selecione produtos e aplique mudanças em lote</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="flex items-center gap-4">
							<Button
								variant="outline"
								onClick={selectAll}
								disabled={applying}
							>
								{selectedIds.size === products.length ? "Desselecionar Todos" : "Selecionar Todos"}
							</Button>
							<Button
								onClick={() => applyChanges(Array.from(selectedIds))}
								disabled={selectedIds.size === 0 || applying}
							>
								{applying ? (
									<>
										<Loader2 className="mr-2 h-4 w-4 animate-spin" />
										Aplicando...
									</>
								) : (
									<>
										<Save className="mr-2 h-4 w-4" />
										Aplicar Mudanças ({selectedIds.size})
									</>
								)}
							</Button>
							<Button
								variant="ghost"
								onClick={analyzeProducts}
								disabled={analyzing || applying}
							>
								<RefreshCw className={`mr-2 h-4 w-4 ${analyzing ? "animate-spin" : ""}`} />
								Reanalisar
							</Button>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Lista de Produtos */}
			{products.length === 0 ? (
				<Alert>
					<CheckCircle className="h-4 w-4" />
					<AlertTitle>Tudo certo!</AlertTitle>
					<AlertDescription>
						Todos os produtos já foram analisados. Não há produtos com peso/volume no nome para migrar.
					</AlertDescription>
				</Alert>
			) : (
				<div className="space-y-4">
					<Alert>
						<AlertCircle className="h-4 w-4" />
						<AlertTitle>Revise as alterações antes de aplicar</AlertTitle>
						<AlertDescription>
							Verifique se as propostas estão corretas. Você pode selecionar individualmente quais mudanças aplicar.
						</AlertDescription>
					</Alert>

					{products.map((product) => (
						<Card key={product.id} className={`${selectedIds.has(product.id) ? "border-blue-500 border-2" : ""}`}>
							<CardHeader>
								<div className="flex items-start gap-4">
									<Checkbox
										checked={selectedIds.has(product.id)}
										onCheckedChange={() => toggleSelect(product.id)}
										className="mt-1"
									/>
									<div className="flex-1">
										<div className="flex items-center gap-2 mb-2">
											<CardTitle className="text-lg">Proposta de Mudança</CardTitle>
											<Badge className={getConfidenceColor(product.confidence)}>
												{product.confidence === "high" && "Alta Confiança"}
												{product.confidence === "medium" && "Média Confiança"}
												{product.confidence === "low" && "Baixa Confiança"}
											</Badge>
											<Badge variant="outline" className="text-xs">
												{product.pattern}
											</Badge>
										</div>
										<CardDescription>
											Padrão detectado: <code className="text-xs bg-muted px-1 py-0.5 rounded">{product.pattern}</code>
										</CardDescription>
									</div>
								</div>
							</CardHeader>
							<CardContent>
								<div className="grid grid-cols-1 md:grid-cols-3 gap-4">
									{/* Nome Atual */}
									<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
										<div className="text-sm font-medium text-red-900 mb-2">Nome Atual</div>
										<div className="text-base font-mono">{product.currentName}</div>
									</div>

									{/* Nome Proposto */}
									<div className="p-4 bg-green-50 border border-green-200 rounded-lg">
										<div className="text-sm font-medium text-green-900 mb-2">Nome Limpo</div>
										<div className="text-base font-mono">{product.proposedName}</div>
									</div>

									{/* Package Size */}
									<div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
										<div className="text-sm font-medium text-blue-900 mb-2">Peso/Volume</div>
										<div className="text-base font-mono font-bold text-blue-900">
											{product.packageSize || "-"}
										</div>
									</div>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			)}
		</div>
	)
}

