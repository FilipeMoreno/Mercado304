"use client"

import { Bot, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"
import { ProductRecognitionCard } from "./product-recognition-card"

interface ChatMessageProps {
	role: "user" | "assistant"
	content: string
	isError?: boolean
	isStreaming?: boolean
	onRetry?: () => void
	canRetry?: boolean
	imagePreview?: string
	productData?: any
	onAddMessage?: (message: { role: "user" | "assistant"; content: string }) => void
}

export function ChatMessage({ role, content, isError, isStreaming, onRetry, canRetry, imagePreview, productData, onAddMessage }: ChatMessageProps) {
	// Se é um card de produto reconhecido
	if (content === "product-recognition-card" && productData) {
		const handleAddToList = async () => {
			try {
				// Verificar se temos dados do produto
				if (!productData?.name) {
					if (onAddMessage) {
						onAddMessage({
							role: "assistant",
							content: `❌ Não foi possível identificar o produto para adicionar à lista.`
						})
					}
					return
				}

				// Buscar listas existentes
				const listsResponse = await fetch("/api/shopping-lists")
				if (!listsResponse.ok) throw new Error("Erro ao buscar listas")

				const { lists } = await listsResponse.json()
				let targetList = lists.find((list: any) => list.name === "Lista Principal") || lists[0]

				// Se não existe lista, criar uma
				if (!targetList) {
					const createResponse = await fetch("/api/shopping-lists", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							name: "Lista Principal",
						}),
					})
					if (!createResponse.ok) throw new Error("Erro ao criar lista")
					targetList = await createResponse.json()
				}

				// Adicionar produto à lista
				const addResponse = await fetch(`/api/shopping-lists/${targetList.id}/items`, {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						productName: productData.name,
						quantity: 1,
						productUnit: "un",
					}),
				})

				if (!addResponse.ok) throw new Error("Erro ao adicionar produto")

				// Adicionar mensagem de confirmação no chat
				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: `✅ **${productData.name}** foi adicionado à lista "${targetList.name}" com sucesso!`
					})
				}
			} catch (error) {
				console.error("Erro ao adicionar à lista:", error)
				// Adicionar mensagem de erro no chat
				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: `❌ Erro ao adicionar **${productData?.name || 'produto'}** à lista. Tente novamente.`
					})
				}
			}
		}

		const handleSearchProduct = async () => {
			try {
				// Verificar se temos dados do produto
				if (!productData?.name) {
					if (onAddMessage) {
						onAddMessage({
							role: "assistant",
							content: `❌ Não foi possível identificar o produto para buscar preços.`
						})
					}
					return
				}

				// Buscar preços do produto
				const response = await fetch(`/api/price-comparison/product?productName=${encodeURIComponent(productData.name)}`)
				
				if (!response.ok) {
					throw new Error("Produto não encontrado")
				}

				const data = await response.json()
				
				// Pegar os últimos 5 preços
				const recentPrices = data.markets
					.filter((market: any) => market.currentPrice > 0)
					.sort((a: any, b: any) => new Date(b.lastUpdate).getTime() - new Date(a.lastUpdate).getTime())
					.slice(0, 5)

				if (recentPrices.length === 0) {
					if (onAddMessage) {
						onAddMessage({
							role: "assistant",
							content: `📊 Não encontrei preços registrados para **${productData.name}**. Que tal registrar o primeiro preço?`
						})
					}
					return
				}

				// Formatar mensagem com os preços
				let priceMessage = `📊 **Últimos preços de ${productData.name}:**\n\n`
				
				recentPrices.forEach((market: any, index: number) => {
					const date = new Date(market.lastUpdate).toLocaleDateString('pt-BR')
					const emoji = index === 0 ? "🥇" : index === 1 ? "🥈" : index === 2 ? "🥉" : "📍"
					priceMessage += `${emoji} **${market.marketName}** - R$ ${market.currentPrice.toFixed(2)}\n`
					priceMessage += `   📅 ${date} • ${market.location || 'Localização não informada'}\n\n`
				})

				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: priceMessage
					})
				}

			} catch (error) {
				console.error("Erro ao buscar preços:", error)
				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: `❌ Não consegui encontrar preços para **${productData?.name || 'produto'}**. O produto pode não estar registrado no sistema.`
					})
				}
			}
		}

		const handleViewDetails = async () => {
			try {
				// Verificar se temos dados do produto
				if (!productData?.name) {
					if (onAddMessage) {
						onAddMessage({
							role: "assistant",
							content: `❌ Não foi possível identificar o produto para buscar detalhes.`
						})
					}
					return
				}

				// Primeiro, tentar buscar o produto por código de barras ou nome
				let productResponse
				
				if (productData.barcode) {
					productResponse = await fetch(`/api/products?barcode=${productData.barcode}`)
				} else {
					productResponse = await fetch(`/api/products?search=${encodeURIComponent(productData.name)}`)
				}

				if (!productResponse.ok) {
					throw new Error("Produto não encontrado")
				}

				const products = await productResponse.json()
				const product = products.products?.[0] || products[0]

				if (!product) {
					// Produto não encontrado - oferecer opção de cadastro
					if (onAddMessage) {
						onAddMessage({
							role: "assistant",
							content: `🔍 **${productData.name}** não está registrado no sistema.\n\n📝 Gostaria de cadastrar este produto? Posso ajudar você a criar um registro completo com categoria, marca e outras informações.`
						})
					}
					return
				}

				// Buscar detalhes completos do produto
				const detailsResponse = await fetch(`/api/products/${product.id}?includeStats=true`)
				const productDetails = await detailsResponse.json()

				// Formatar mensagem com detalhes do produto
				let detailsMessage = `📦 **Detalhes de ${productDetails.name}**\n\n`
				
				if (productDetails.brand?.name) {
					detailsMessage += `🏷️ **Marca:** ${productDetails.brand.name}\n`
				}
				
				if (productDetails.category?.name) {
					detailsMessage += `📂 **Categoria:** ${productDetails.category.name}\n`
				}
				
				detailsMessage += `📏 **Unidade:** ${productDetails.unit}\n`
				
				if (productDetails.barcode) {
					detailsMessage += `🔢 **Código de Barras:** ${productDetails.barcode}\n`
				}

				// Adicionar estatísticas se disponíveis
				if (productDetails.stats) {
					detailsMessage += `\n📊 **Estatísticas:**\n`
					detailsMessage += `• Preço médio: R$ ${productDetails.stats.averagePrice?.toFixed(2) || 'N/A'}\n`
					detailsMessage += `• Menor preço: R$ ${productDetails.stats.lowestPrice?.toFixed(2) || 'N/A'}\n`
					detailsMessage += `• Maior preço: R$ ${productDetails.stats.highestPrice?.toFixed(2) || 'N/A'}\n`
					detailsMessage += `• Total de compras: ${productDetails.stats.totalPurchases || 0}\n`
				}

				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: detailsMessage
					})
				}

			} catch (error) {
				console.error("Erro ao buscar detalhes:", error)
				// Produto não encontrado - oferecer opção de cadastro
				if (onAddMessage) {
					onAddMessage({
						role: "assistant",
						content: `🔍 **${productData?.name || 'Produto'}** não foi encontrado no sistema.\n\n📝 Gostaria de cadastrar este produto? Posso ajudar você a criar um registro completo com categoria, marca e outras informações.`
					})
				}
			}
		}

		return (
			<div className="flex gap-2">
				<Bot className="h-6 w-6 flex-shrink-0 text-blue-700" />
				<div className="max-w-[80%]">
					<ProductRecognitionCard
						product={productData}
						imagePreview={productData.imagePreview}
						onAddToList={handleAddToList}
						onSearchProduct={handleSearchProduct}
						onViewDetails={handleViewDetails}
					/>
				</div>
			</div>
		)
	}

	return (
		<div className={`flex gap-2 ${role === "user" ? "justify-end" : ""}`}>
			{role === "assistant" && (
				<Bot className={`h-6 w-6 flex-shrink-0 ${isError ? "text-red-500" : "text-blue-700"}`} />
			)}
			<div className={`max-w-[80%] ${role === "user" ? "flex justify-end" : ""}`}>
				<div className="flex flex-col gap-2">
					{/* Preview da imagem para mensagens do usuário */}
					{role === "user" && imagePreview && (
						<div className="w-32 h-32 rounded-lg overflow-hidden border">
							<img 
								src={imagePreview} 
								alt="Imagem enviada"
								className="w-full h-full object-cover"
							/>
						</div>
					)}
					
					<div
						className={`rounded-lg px-3 py-2 text-sm ${
							role === "user"
								? "bg-primary text-primary-foreground"
								: isError
									? "bg-red-50 text-red-700 border border-red-200"
									: "bg-muted"
						}`}
					>
						{role === "assistant" ? (
							content === "product-recognition-card" && productData ? (
								<ProductRecognitionCard 
									product={productData}
									imagePreview={productData.imagePreview}
								/>
							) : (
								<div className="prose prose-sm max-w-none">
									<ReactMarkdown
										components={{
											p: ({ children }) => <p className="my-1 last:mb-0">{children}</p>,
											ul: ({ children }) => <ul className="my-1 ml-4 list-disc last:mb-0">{children}</ul>,
											ol: ({ children }) => <ol className="my-1 ml-4 list-decimal last:mb-0">{children}</ol>,
											li: ({ children }) => <li className="my-0">{children}</li>,
											strong: ({ children }) => <strong className="font-bold">{children}</strong>,
											em: ({ children }) => <em className="italic">{children}</em>,
										}}
									>
										{content}
									</ReactMarkdown>
								</div>
							)
						) : (
							content
						)}
					</div>
					{isError && canRetry && onRetry && (
						<Button
							variant="outline"
							size="sm"
							onClick={onRetry}
							className="self-start text-xs text-red-600 border-red-200 hover:bg-red-50"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							Tentar novamente
						</Button>
					)}
				</div>
			</div>
			{isStreaming && (
				<div className="mt-2 ml-8">
					<div className="flex items-center gap-1">
						<div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
						<span className="text-xs text-muted-foreground animate-pulse">gerando resposta...</span>
					</div>
				</div>
			)}
		</div>
	)
}
