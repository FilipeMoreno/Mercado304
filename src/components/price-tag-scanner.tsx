"use client"

import { Check, Tag, X } from "lucide-react"
import Image from "next/image"
import { useState, Activity } from "react"
import { toast } from "sonner"
import { SmartCameraCapture } from "@/components/smart-camera-capture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"

interface PriceTagScannerProps {
	onScan: (result: { barcode: string; price: number; confidence: number }) => void
	onClose: () => void
	isOpen: boolean
	marketId?: string
}

interface PriceOption {
	value: number
	condition: string
}

interface ScanResult {
	barcode: string
	prices?: PriceOption[]
	price?: number // Retrocompatibilidade
	confidence: number
	rawText?: string
	productName?: string
	weight?: string
	productExists?: boolean
}

interface PriceOptionWithDiscount extends PriceOption {
	discount?: {
		amount: number
		percentage: number
		comparedTo: string
	}
}

// Função para verificar se o produto existe no sistema
const checkProductExists = async (barcode: string): Promise<boolean> => {
	try {
		const response = await fetch(`/api/products/search?barcode=${encodeURIComponent(barcode)}`)
		const data = await response.json()
		return data.success && data.products && data.products.length > 0
	} catch (error) {
		console.error("Erro ao verificar produto:", error)
		return false
	}
}

// Função para calcular descontos entre preços
const calculateDiscounts = (prices: PriceOption[]): PriceOptionWithDiscount[] => {
	if (!prices || prices.length < 2) return prices

	// Encontrar preços de atacado e varejo
	const atacadoPrices = prices.filter(p =>
		p.condition.toLowerCase().includes('atacado') ||
		p.condition.toLowerCase().includes('a partir de')
	)
	const varejoPrices = prices.filter(p =>
		p.condition.toLowerCase().includes('varejo') ||
		p.condition.toLowerCase().includes('unidade')
	)

	const pricesWithDiscounts: PriceOptionWithDiscount[] = prices.map(price => {
		const priceWithDiscount: PriceOptionWithDiscount = { ...price }

		// Se é preço de atacado, calcular desconto em relação ao varejo
		if (atacadoPrices.includes(price) && varejoPrices.length > 0) {
			const varejoPrice = varejoPrices[0] // Pegar o primeiro preço de varejo
			const discountAmount = varejoPrice.value - price.value
			const discountPercentage = (discountAmount / varejoPrice.value) * 100

			if (discountAmount > 0) {
				priceWithDiscount.discount = {
					amount: discountAmount,
					percentage: discountPercentage,
					comparedTo: varejoPrice.condition
				}
			}
		}

		return priceWithDiscount
	})

	return pricesWithDiscounts
}

export function PriceTagScanner({ onScan, onClose, isOpen, marketId }: PriceTagScannerProps) {
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedImage, setCapturedImage] = useState<string>("")
	const [priceOptions, setPriceOptions] = useState<PriceOptionWithDiscount[]>([])
	const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null)
	const [showPriceSelectionDialog, setShowPriceSelectionDialog] = useState(false)
	const [showCamera, setShowCamera] = useState(true)

	// Função para processar imagem com IA - Nova estratégia otimizada
	const processImage = async (imageFile: File) => {
		setIsProcessing(true)
		setShowCamera(false)

		try {
			console.log("📸 Processando imagem:", {
				name: imageFile.name,
				size: `${(imageFile.size / 1024 / 1024).toFixed(2)} MB`,
				type: imageFile.type
			})

			// Mostrar toast de processamento
			toast.loading("Processando etiqueta com IA...", {
				id: "processing-image"
			})

			// Converter File para base64
			const reader = new FileReader()
			const imageDataUrl = await new Promise<string>((resolve, reject) => {
				reader.onload = () => resolve(reader.result as string)
				reader.onerror = reject
				reader.readAsDataURL(imageFile)
			})

			setCapturedImage(imageDataUrl)

			// Enviar para API de processamento
			const response = await fetch("/api/ai/price-tag-scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					imageUrl: imageDataUrl,
					marketId: marketId,
				}),
			})

			if (!response.ok) {
				throw new Error("Erro ao processar imagem")
			}

			const result = await response.json()

			if (result.success && result.barcode) {
				// Verificar se o produto existe no sistema
				const productExists = await checkProductExists(result.barcode)

				// Calcular descontos se houver preços de atacado e varejo
				const pricesWithDiscounts = calculateDiscounts(result.prices || [])

				// Os dados estão diretamente no result, não em result.data
				const scanResult: ScanResult = {
					barcode: result.barcode,
					prices: pricesWithDiscounts,
					confidence: result.confidence || 0.8,
					rawText: result.rawText,
					productName: result.productName,
					weight: result.weight,
					productExists,
				}

				// Dismiss loading toast
				toast.dismiss("processing-image")

				// Se houver múltiplos preços, mostrar dialog de seleção
				if (scanResult.prices && scanResult.prices.length > 1) {
					setPriceOptions(scanResult.prices)
					setPendingScanResult(scanResult)
					setShowPriceSelectionDialog(true)
				} else {
					// Se houver apenas um preço ou preço único, retornar direto
					const price = scanResult.prices?.[0]?.value || scanResult.price
					if (price) {
						toast.success("Etiqueta processada com sucesso!")
						onScan({
							barcode: scanResult.barcode,
							price: price,
							confidence: scanResult.confidence || 0.8,
						})
						handleCloseAll()
					} else {
						toast.error("Não foi possível identificar o preço na etiqueta")
						resetAndRetry()
					}
				}
			} else {
				toast.dismiss("processing-image")
				toast.error(result.message || "Não foi possível processar a etiqueta")
				resetAndRetry()
			}
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			toast.dismiss("processing-image")
			toast.error("Erro ao processar etiqueta. Tente novamente.")
			resetAndRetry()
		} finally {
			setIsProcessing(false)
		}
	}

	const handlePriceSelection = (selectedPrice: PriceOptionWithDiscount) => {
		if (pendingScanResult) {
			toast.success("Preço selecionado com sucesso!")
			onScan({
				barcode: pendingScanResult.barcode,
				price: selectedPrice.value,
				confidence: pendingScanResult.confidence || 0.8,
			})
			handleCloseAll()
		}
	}

	const resetAndRetry = () => {
		setCapturedImage("")
		setPriceOptions([])
		setPendingScanResult(null)
		setShowPriceSelectionDialog(false)
		setShowCamera(true)
	}

	const handleCloseAll = () => {
		setCapturedImage("")
		setPriceOptions([])
		setPendingScanResult(null)
		setShowPriceSelectionDialog(false)
		setShowCamera(true)
		onClose()
	}

	return (
		<>
			{/* Câmera para captura - Nova estratégia otimizada */}
			{showCamera && (
				<SmartCameraCapture
					isOpen={isOpen}
					onClose={handleCloseAll}
					onCapture={processImage}
					title="Escanear Etiqueta de Preço"
					description="Sistema inteligente de captura otimizado para PWA e dispositivos móveis"
					mode="auto"
					quality={0.85}
					maxWidth={1920}
					maxHeight={1080}
				/>
			)}

			{/* Dialog de seleção de preço (quando há múltiplos) */}
			<ResponsiveDialog
				open={showPriceSelectionDialog}
				onOpenChange={(open) => {
					if (!open) {
						setShowPriceSelectionDialog(false)
						resetAndRetry()
					}
				}}
			>
				<div className="space-y-4 p-4">
					<div className="space-y-2">
						<div className="flex items-center gap-2">
							<Tag className="h-5 w-5 text-primary" />
							<h2 className="text-xl font-semibold">Múltiplos Preços Detectados</h2>
						</div>
						<p className="text-sm text-muted-foreground">
							A etiqueta contém mais de um preço. Selecione o preço que deseja registrar:
						</p>
					</div>

					{/* Preview da imagem capturada - Nova estratégia otimizada */}
					{capturedImage && (
						<div className="space-y-3">
							<div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-border">
								<Image
									src={capturedImage}
									alt="Etiqueta capturada"
									fill
									className="object-contain"
									unoptimized
								/>
							</div>
							<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
								<div className="w-2 h-2 bg-green-500 rounded-full"></div>
								<span>Imagem processada com compressão inteligente</span>
							</div>
						</div>
					)}

					{/* Informações do produto (se disponível) */}
					{pendingScanResult?.productName && (
						<Card>
							<CardHeader className="pb-3">
								<CardTitle className="text-sm font-medium">Produto Identificado</CardTitle>
							</CardHeader>
							<CardContent className="space-y-2 text-sm">
								<div className="flex items-start gap-2">
									<span className="font-semibold min-w-[80px]">Nome:</span>
									<span className="text-muted-foreground">{pendingScanResult.productName}</span>
								</div>
								{pendingScanResult.weight && (
									<div className="flex items-start gap-2">
										<span className="font-semibold min-w-[80px]">Peso:</span>
										<span className="text-muted-foreground">{pendingScanResult.weight}</span>
									</div>
								)}
								<div className="flex items-start gap-2">
									<span className="font-semibold min-w-[80px]">Código:</span>
									<span className="text-muted-foreground font-mono">{pendingScanResult.barcode}</span>
								</div>
								{/* Status do produto no sistema */}
								<div className="flex items-start gap-2">
									<span className="font-semibold min-w-[80px]">Sistema:</span>
									<div className="flex items-center gap-2">
										{pendingScanResult.productExists ? (
											<>
												<Badge variant="default" className="text-xs bg-green-100 text-green-800">
													✅ Produto cadastrado
												</Badge>
											</>
										) : (
											<Badge variant="outline" className="text-xs">
												❌ Produto não cadastrado
											</Badge>
										)}
									</div>
								</div>
							</CardContent>
						</Card>
					)}

					{/* Opções de preço */}
					<div className="space-y-2">
						<p className="text-sm font-medium">Selecione o preço:</p>
						<div className="grid gap-2">
							{priceOptions.map((option) => (
								<Button
									key={`${option.value}-${option.condition}`}
									variant="outline"
									className="h-auto py-4 px-4 justify-start text-left hover:bg-primary/10 hover:border-primary group"
									onClick={() => handlePriceSelection(option)}
								>
									<div className="flex items-center justify-between w-full gap-4">
										<div className="space-y-1 flex-1">
											<div className="flex items-center gap-2">
												<div className="text-2xl font-bold text-primary">
													R$ {option.value.toFixed(2).replace(".", ",")}
												</div>
												{option.discount && (
													<Badge variant="secondary" className="text-xs bg-green-100 text-green-800">
														💰 R$ {option.discount.amount.toFixed(2).replace(".", ",")} de desconto
													</Badge>
												)}
											</div>
											<div className="text-xs text-muted-foreground">{option.condition}</div>
											{option.discount && (
												<div className="text-xs text-green-600 font-medium">
													{option.discount.percentage.toFixed(1)}% mais barato que {option.discount.comparedTo}
												</div>
											)}
										</div>
										<Check className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
								</Button>
							))}
						</div>
					</div>

					{/* Informações técnicas - Nova estratégia otimizada */}
					<div className="space-y-2">
						{pendingScanResult?.confidence && (
							<div className="flex items-center gap-2 text-xs text-muted-foreground">
								<Badge variant="outline" className="text-xs">
									Confiança: {(pendingScanResult.confidence * 100).toFixed(0)}%
								</Badge>
							</div>
						)}
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Badge variant="outline" className="text-xs">
								📱 Modo Auto Ativo
							</Badge>
							<Badge variant="outline" className="text-xs">
								⚡ Compressão Inteligente
							</Badge>
						</div>
					</div>

					{/* Botões de ação */}
					<div className="flex gap-2 justify-end pt-2">
						<Button variant="outline" onClick={resetAndRetry} disabled={isProcessing}>
							<X className="h-4 w-4 mr-2" />
							Cancelar e tirar outra foto
						</Button>
					</div>
				</div>
			</ResponsiveDialog>

			{/* Overlay de processamento - Nova estratégia otimizada */}
			{isProcessing && !showCamera && (
				<ResponsiveDialog open={true} onOpenChange={() => { }}>
					<div className="flex flex-col items-center justify-center p-8 space-y-6">
						<div className="relative">
							<div className="animate-spin rounded-full h-20 w-20 border-b-2 border-primary"></div>
							<Tag className="h-10 w-10 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
						</div>
						<div className="space-y-3 text-center">
							<h3 className="text-xl font-semibold">Processando Etiqueta</h3>
							<p className="text-sm text-muted-foreground">
								Sistema inteligente analisando código de barras e preços com IA...
							</p>
							<div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
								<div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
								<span>Compressão inteligente ativa</span>
							</div>
						</div>
					</div>
				</ResponsiveDialog>
			)}
		</>
	)
}
