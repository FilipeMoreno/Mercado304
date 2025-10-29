"use client"

import { CheckCircle2, Image as ImageIcon, Loader2, Search, Upload, Wand2, XCircle } from "lucide-react"
import { useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

interface Product {
	id: string
	name: string
	barcode: string | null
	imageUrl: string | null
}

export default function BackgroundRemovalPlaygroundPage() {
	const [products, setProducts] = useState<Product[]>([])
	const [selectedProducts, setSelectedProducts] = useState<string[]>([])
	const [searchTerm, setSearchTerm] = useState("")
	const [isLoadingProducts, setIsLoadingProducts] = useState(false)
	const [productId, setProductId] = useState("")
	const [imageUrl, setImageUrl] = useState("")
	const [batchProducts, setBatchProducts] = useState("")
	const [isProcessing, setIsProcessing] = useState(false)
	const [result, setResult] = useState<{
		success: boolean
		imageUrl?: string
		error?: string
		processingTime?: number
		processed?: number
		total?: number
		results?: Array<{ success: boolean; imageUrl?: string; error?: string; processingTime?: number }>
	} | null>(null)

	// Carregar produtos
	useEffect(() => {
		const fetchProducts = async () => {
			setIsLoadingProducts(true)
			try {
				const response = await fetch("/api/products")
				if (response.ok) {
					const data = await response.json()
					setProducts(data.products || data || [])
				}
			} catch (error) {
				console.error("Erro ao carregar produtos:", error)
				toast.error("Erro ao carregar produtos")
			} finally {
				setIsLoadingProducts(false)
			}
		}
		fetchProducts()
	}, [])

	const filteredProducts = products.filter(
		(product) =>
			product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			product.barcode?.toLowerCase().includes(searchTerm.toLowerCase()),
	)

	const handleSelectAll = () => {
		if (selectedProducts.length === filteredProducts.length) {
			setSelectedProducts([])
		} else {
			setSelectedProducts(filteredProducts.map((p) => p.id))
		}
	}

	const handleToggleProduct = (productId: string) => {
		setSelectedProducts((prev) =>
			prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
		)
	}

	const handleProcessSelected = async () => {
		if (selectedProducts.length === 0) {
			toast.error("Selecione pelo menos um produto")
			return
		}

		// Filtrar produtos selecionados
		const selectedProductsData = products.filter((p) => selectedProducts.includes(p.id))

		// Verificar quais têm código de barras (necessário para buscar no Cosmos)
		const productsWithBarcode = selectedProductsData.filter((p) => p.barcode)

		if (productsWithBarcode.length === 0) {
			toast.error("Nenhum produto selecionado tem código de barras.")
			return
		}

		if (productsWithBarcode.length < selectedProductsData.length) {
			const withoutBarcode = selectedProductsData.length - productsWithBarcode.length
			toast.warning(
				`${withoutBarcode} produto${withoutBarcode > 1 ? "s" : ""} sem código de barras será${withoutBarcode > 1 ? "ão" : ""} ignorado${withoutBarcode > 1 ? "s" : ""}`,
			)
		}

		// Construir URLs do Cosmos baseado no código de barras
		const productsToProcess = productsWithBarcode.map((p) => ({
			id: p.id,
			imageUrl: `https://cdn-cosmos.bluesoft.com.br/products/${p.barcode}`, // URL do Cosmos com o código de barras
		}))

		setIsProcessing(true)
		setResult(null)

		try {
			const response = await fetch("/api/jobs/background-removal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ products: productsToProcess }),
			})

			const data = await response.json()
			setResult(data)

			if (data.success) {
				toast.success(`${data.processed}/${data.total} processados com sucesso`)
				setSelectedProducts([]) // Limpar seleção
				// Recarregar produtos
				const response = await fetch("/api/products")
				if (response.ok) {
					const data = await response.json()
					setProducts(data.products || data || [])
				}
			} else {
				toast.error("Erro ao processar lote")
			}
		} catch (error) {
			console.error("Erro ao processar:", error)
			toast.error("Erro ao processar lote")
		} finally {
			setIsProcessing(false)
		}
	}

	const handleSingleProcess = async () => {
		if (!productId || !imageUrl) {
			toast.error("Preencha o ID do produto e a URL da imagem")
			return
		}

		setIsProcessing(true)
		setResult(null)

		try {
			const response = await fetch("/api/jobs/background-removal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					imageUrl,
				}),
			})

			const data = await response.json()
			setResult(data)

			if (data.success) {
				toast.success(`Imagem processada em ${Math.ceil((data.processingTime || 0) / 1000)}s`)
			} else {
				toast.error(data.error || "Erro ao processar imagem")
			}
		} catch (error) {
			console.error("Erro ao processar:", error)
			toast.error("Erro ao processar imagem")
		} finally {
			setIsProcessing(false)
		}
	}

	const handleBatchProcess = async () => {
		if (!batchProducts.trim()) {
			toast.error("Cole a lista de produtos")
			return
		}

		setIsProcessing(true)
		setResult(null)

		try {
			let products: Array<{ id: string; imageUrl: string }>
			try {
				products = JSON.parse(batchProducts)
			} catch {
				toast.error("JSON inválido")
				setIsProcessing(false)
				return
			}

			if (!Array.isArray(products)) {
				toast.error("Deve ser um array de produtos")
				setIsProcessing(false)
				return
			}

			const response = await fetch("/api/jobs/background-removal", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ products }),
			})

			const data = await response.json()
			setResult(data)

			if (data.success) {
				toast.success(`${data.processed}/${data.total} processados com sucesso`)
			} else {
				toast.error("Erro ao processar lote")
			}
		} catch (error) {
			console.error("Erro ao processar:", error)
			toast.error("Erro ao processar lote")
		} finally {
			setIsProcessing(false)
		}
	}

	return (
		<div className="container mx-auto py-8 space-y-8">
			<div className="space-y-2">
				<h1 className="text-3xl font-bold">Background Removal - Playground</h1>
				<p className="text-muted-foreground">
					Processe imagens de produtos: baixar do Cosmos, remover fundo e fazer upload para R2
				</p>
			</div>

			<div className="grid gap-6 md:grid-cols-2">
				{/* Processamento Individual */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Wand2 className="w-5 h-5" />
							Processamento Individual
						</CardTitle>
						<CardDescription>Processe uma única imagem de produto</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="productId">ID do Produto</Label>
							<Input
								id="productId"
								value={productId}
								onChange={(e) => setProductId(e.target.value)}
								placeholder="ex: produto-123"
								disabled={isProcessing}
							/>
						</div>

						<div className="space-y-2">
							<Label htmlFor="imageUrl">URL da Imagem</Label>
							<Input
								id="imageUrl"
								value={imageUrl}
								onChange={(e) => setImageUrl(e.target.value)}
								placeholder="https://cosmos.com/image.jpg"
								disabled={isProcessing}
							/>
						</div>

						<Button onClick={handleSingleProcess} disabled={isProcessing} className="w-full">
							{isProcessing ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Processando...
								</>
							) : (
								<>
									<Wand2 className="w-4 h-4 mr-2" />
									Processar Imagem
								</>
							)}
						</Button>
					</CardContent>
				</Card>

				{/* Processamento em Lote */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Upload className="w-5 h-5" />
							Processamento em Lote
						</CardTitle>
						<CardDescription>Processe múltiplas imagens de uma vez</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor="batchProducts">Lista de Produtos (JSON)</Label>
							<Textarea
								id="batchProducts"
								value={batchProducts}
								onChange={(e) => setBatchProducts(e.target.value)}
								placeholder={`[\n  {\n    "id": "produto-1",\n    "imageUrl": "https://..."\n  },\n  {\n    "id": "produto-2",\n    "imageUrl": "https://..."\n  }\n]`}
								rows={10}
								disabled={isProcessing}
								className="font-mono text-xs"
							/>
						</div>

						<Button onClick={handleBatchProcess} disabled={isProcessing} className="w-full">
							{isProcessing ? (
								<>
									<Loader2 className="w-4 h-4 mr-2 animate-spin" />
									Processando...
								</>
							) : (
								<>
									<Upload className="w-4 h-4 mr-2" />
									Processar Lote
								</>
							)}
						</Button>
					</CardContent>
				</Card>
			</div>

			{/* Seleção de Produtos */}
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center justify-between">
						<span className="flex items-center gap-2">
							<Search className="w-5 h-5" />
							Selecionar Produtos do Sistema
						</span>
						<div className="text-sm text-muted-foreground">
							{selectedProducts.length} selecionado{selectedProducts.length !== 1 ? "s" : ""}
						</div>
					</CardTitle>
					<CardDescription>Busque e selecione produtos do sistema para processar suas imagens</CardDescription>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<div className="flex gap-2">
							<Input
								placeholder="Buscar produtos..."
								value={searchTerm}
								onChange={(e) => setSearchTerm(e.target.value)}
								className="flex-1"
							/>
							<Button
								variant="outline"
								onClick={handleSelectAll}
								disabled={filteredProducts.length === 0 || isLoadingProducts}
							>
								{selectedProducts.length === filteredProducts.length && filteredProducts.length > 0
									? "Desmarcar Todos"
									: "Selecionar Todos"}
							</Button>
							<Button
								onClick={() => window.location.reload()}
								variant="outline"
								size="icon"
								disabled={isLoadingProducts}
								title="Recarregar produtos"
							>
								<Search className={`w-4 h-4 ${isLoadingProducts ? "animate-spin" : ""}`} />
							</Button>
						</div>
					</div>

					<div className="max-h-96 overflow-y-auto border rounded-lg">
						{isLoadingProducts ? (
							<div className="p-8 text-center text-muted-foreground">
								<Loader2 className="w-8 h-8 mx-auto animate-spin mb-2" />
								Carregando produtos...
							</div>
						) : filteredProducts.length === 0 ? (
							<div className="p-8 text-center text-muted-foreground">Nenhum produto encontrado</div>
						) : (
							<div className="divide-y">
								{filteredProducts.map((product) => (
									<div key={product.id} className="flex items-center gap-3 p-3 hover:bg-muted/50 transition-colors">
										<Checkbox
											checked={selectedProducts.includes(product.id)}
											onCheckedChange={() => handleToggleProduct(product.id)}
										/>
										<div className="flex-1 min-w-0">
											<div className="font-medium truncate">{product.name}</div>
											<div className="text-sm text-muted-foreground flex items-center gap-2">
												{product.barcode ? (
													<span>Código: {product.barcode}</span>
												) : (
													<span className="text-orange-600">⚠️ Sem código de barras</span>
												)}
											</div>
										</div>
									</div>
								))}
							</div>
						)}
					</div>

					<Button
						onClick={handleProcessSelected}
						disabled={isProcessing || selectedProducts.length === 0}
						className="w-full"
					>
						{isProcessing ? (
							<>
								<Loader2 className="w-4 h-4 mr-2 animate-spin" />
								Processando...
							</>
						) : (
							<>
								<Wand2 className="w-4 h-4 mr-2" />
								Processar {selectedProducts.length} Produto{selectedProducts.length !== 1 ? "s" : ""}
							</>
						)}
					</Button>
				</CardContent>
			</Card>

			{/* Resultado */}
			{result && (
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							{result.success ? (
								<>
									<CheckCircle2 className="w-5 h-5 text-green-500" />
									Sucesso
								</>
							) : (
								<>
									<XCircle className="w-5 h-5 text-red-500" />
									Erro
								</>
							)}
						</CardTitle>
					</CardHeader>
					<CardContent>
						<pre className="bg-muted p-4 rounded-lg overflow-auto text-sm">{JSON.stringify(result, null, 2)}</pre>

						{result.success && result.imageUrl && (
							<div className="mt-4 space-y-2">
								<Label>Imagem Processada</Label>
								<div className="relative aspect-video bg-gray-100 rounded-lg overflow-hidden">
									{/* eslint-disable-next-line @next/next/no-img-element */}
									<img src={result.imageUrl} alt="Resultado" className="w-full h-full object-contain" />
								</div>
							</div>
						)}
					</CardContent>
				</Card>
			)}

			{/* Informações */}
			<Card className="bg-blue-50 dark:bg-blue-950">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<ImageIcon className="w-5 h-5" />
						Como usar
					</CardTitle>
				</CardHeader>
				<CardContent className="space-y-3">
					<div className="space-y-1">
						<h4 className="font-semibold">Processamento Individual:</h4>
						<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
							<li>Digite o ID do produto (do banco de dados)</li>
							<li>Cole a URL da imagem (do Cosmos ou outra fonte)</li>
							<li>Clique em "Processar Imagem"</li>
							<li>A imagem será processada, enviada para R2 e vinculada ao produto</li>
						</ul>
					</div>

					<div className="space-y-1">
						<h4 className="font-semibold">Processamento em Lote:</h4>
						<ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
							<li>Cole um array JSON com os produtos</li>
							<li>Formato: [&#123;"id": "...", "imageUrl": "..."&#125;, ...]</li>
							<li>O sistema processará cada produto sequencialmente</li>
							<li>Resultado mostra quantos foram processados com sucesso</li>
						</ul>
					</div>

					<div className="space-y-1">
						<h4 className="font-semibold">O que acontece:</h4>
						<ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
							<li>📥 Baixa a imagem da URL fornecida</li>
							<li>🎨 Remove o fundo usando IA (@imgly/background-removal)</li>
							<li>☁️ Faz upload para R2 (Cloudflare)</li>
							<li>💾 Atualiza o campo imageUrl do produto no banco</li>
						</ol>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
