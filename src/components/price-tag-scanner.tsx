"use client"

import { Check, Tag, X } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
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
}

export function PriceTagScanner({ onScan, onClose, isOpen, marketId }: PriceTagScannerProps) {
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedImage, setCapturedImage] = useState<string>("")
	const [priceOptions, setPriceOptions] = useState<PriceOption[]>([])
	const [pendingScanResult, setPendingScanResult] = useState<ScanResult | null>(null)
	const [showPriceSelectionDialog, setShowPriceSelectionDialog] = useState(false)
	const [showCamera, setShowCamera] = useState(true)

	// Função para processar imagem com IA
	const processImage = async (imageFile: File) => {
		setIsProcessing(true)
		setShowCamera(false)

		try {
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
				const scanResult = result.data

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
				toast.error(result.message || "Não foi possível processar a etiqueta")
				resetAndRetry()
			}
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			toast.error("Erro ao processar etiqueta. Tente novamente.")
			resetAndRetry()
		} finally {
			setIsProcessing(false)
		}
	}

	const handlePriceSelection = (selectedPrice: PriceOption) => {
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
			{/* Câmera para captura */}
			{showCamera && (
				<SmartCameraCapture
					isOpen={isOpen}
					onClose={handleCloseAll}
					onCapture={processImage}
					title="Escanear Etiqueta de Preço"
					description="Tire uma foto da etiqueta de preço do produto"
					mode="auto"
					quality={0.9}
					maxWidth={2560}
					maxHeight={1440}
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

					{/* Preview da imagem capturada */}
					{capturedImage && (
						<div className="relative aspect-video bg-black rounded-lg overflow-hidden border-2 border-border">
							<Image
								src={capturedImage}
								alt="Etiqueta capturada"
								fill
								className="object-contain"
								unoptimized
							/>
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
									className="h-auto py-4 px-4 justify-start text-left hover:bg-primary/10 hover:border-primary"
									onClick={() => handlePriceSelection(option)}
								>
									<div className="flex items-center justify-between w-full gap-4">
										<div className="space-y-1 flex-1">
											<div className="text-2xl font-bold text-primary">
												R$ {option.value.toFixed(2).replace(".", ",")}
											</div>
											<div className="text-xs text-muted-foreground">{option.condition}</div>
										</div>
										<Check className="h-5 w-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
									</div>
								</Button>
							))}
						</div>
					</div>

					{/* Informações de confiança */}
					{pendingScanResult?.confidence && (
						<div className="flex items-center gap-2 text-xs text-muted-foreground">
							<Badge variant="outline" className="text-xs">
								Confiança: {(pendingScanResult.confidence * 100).toFixed(0)}%
							</Badge>
						</div>
					)}

					{/* Botões de ação */}
					<div className="flex gap-2 justify-end pt-2">
						<Button variant="outline" onClick={resetAndRetry} disabled={isProcessing}>
							<X className="h-4 w-4 mr-2" />
							Cancelar e tirar outra foto
						</Button>
					</div>
				</div>
			</ResponsiveDialog>

			{/* Overlay de processamento */}
			{isProcessing && !showCamera && (
				<ResponsiveDialog open={true} onOpenChange={() => {}}>
					<div className="flex flex-col items-center justify-center p-8 space-y-4">
						<div className="relative">
							<div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary"></div>
							<Tag className="h-8 w-8 text-primary absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
						</div>
						<div className="space-y-2 text-center">
							<h3 className="text-lg font-semibold">Processando Etiqueta</h3>
							<p className="text-sm text-muted-foreground">
								Analisando código de barras e preços com IA...
							</p>
						</div>
					</div>
				</ResponsiveDialog>
			)}
		</>
	)
}
