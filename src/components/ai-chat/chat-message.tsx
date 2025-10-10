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
}

export function ChatMessage({ role, content, isError, isStreaming, onRetry, canRetry, imagePreview, productData }: ChatMessageProps) {
	// Se é um card de produto reconhecido
	if (content === "product-recognition-card" && productData) {
		const handleAddToList = async () => {
			try {
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

				// Mostrar sucesso
				const toast = (await import("sonner")).toast
				toast.success(`${productData.name} adicionado à lista "${targetList.name}"!`)
			} catch (error) {
				console.error("Erro ao adicionar à lista:", error)
				const toast = (await import("sonner")).toast
				toast.error("Erro ao adicionar produto à lista")
			}
		}

		const handleSearchProduct = () => {
			// Redirecionar para página de busca de preços
			const searchQuery = encodeURIComponent(productData.name)
			window.open(`/precos?search=${searchQuery}`, '_blank')
		}

		const handleViewDetails = () => {
			// Se tem código de barras, buscar produto específico
			if (productData.barcode) {
				window.open(`/produtos?barcode=${productData.barcode}`, '_blank')
			} else {
				// Senão, buscar por nome
				const searchQuery = encodeURIComponent(productData.name)
				window.open(`/produtos?search=${searchQuery}`, '_blank')
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
