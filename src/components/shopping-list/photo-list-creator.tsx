"use client"

import { useState } from "react"
import { Camera, FileImage, Loader2, Plus, X } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ResponsiveFormDialog } from "@/components/ui/responsive-form-dialog"
import { AIListReviewDialog, type AIIdentifiedItem, type FinalListItem } from "./ai-list-review-dialog"

interface PhotoListItem {
	id: string
	name: string
	quantity: number
	isMatched: boolean
	matchedProductId?: string
	matchedProductName?: string
	confidence?: number
}

interface PhotoListCreatorProps {
	isOpen: boolean
	onClose: () => void
	onCreateList: (items: FinalListItem[]) => void
}

export function PhotoListCreator({ isOpen, onClose, onCreateList }: PhotoListCreatorProps) {
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [isAnalyzing, setIsAnalyzing] = useState(false)
	const [analyzedItems, setAnalyzedItems] = useState<AIIdentifiedItem[]>([])
	const [showReviewDialog, setShowReviewDialog] = useState(false)
	const [isCreatingList, setIsCreatingList] = useState(false)

	const handleImageCapture = (imageData: string) => {
		setCapturedImage(imageData)
		analyzeImage(imageData)
	}

	const handleCameraCapture = () => {
		// Para captura de foto, vamos usar o input file com camera
		const input = document.createElement('input')
		input.type = 'file'
		input.accept = 'image/*'
		input.capture = 'environment'
		input.onchange = (e) => {
			const file = (e.target as HTMLInputElement).files?.[0]
			if (file) {
				const reader = new FileReader()
				reader.onload = (event) => {
					const result = event.target?.result as string
					handleImageCapture(result)
				}
				reader.readAsDataURL(file)
			}
		}
		input.click()
	}

	const analyzeImage = async (imageData: string) => {
		setIsAnalyzing(true)
		try {
			const response = await fetch("/api/ai/analyze-shopping-list", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					image: imageData,
				}),
			})

			if (!response.ok) {
				throw new Error("Erro na análise da imagem")
			}

			const result = await response.json()
			setAnalyzedItems(result.items || [])
			
			if (result.items?.length > 0) {
				toast.success(`${result.items.length} itens identificados na lista!`)
				// Abrir dialog de conferência
				setShowReviewDialog(true)
			} else {
				toast.warning("Nenhum item foi identificado na imagem. Tente uma foto mais clara.")
			}
		} catch (error) {
			console.error("Erro ao analisar imagem:", error)
			toast.error("Erro ao analisar a imagem. Tente novamente.")
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file) {
			const reader = new FileReader()
			reader.onload = (e) => {
				const result = e.target?.result as string
				handleImageCapture(result)
			}
			reader.readAsDataURL(file)
		}
	}

	const handleReviewConfirm = async (finalItems: FinalListItem[]) => {
		setIsCreatingList(true)
		try {
			onCreateList(finalItems)
			handleClose()
		} catch (error) {
			console.error("Erro ao criar lista:", error)
			toast.error("Erro ao criar lista")
		} finally {
			setIsCreatingList(false)
		}
	}

	const handleReviewClose = () => {
		setShowReviewDialog(false)
	}

	const handleClose = () => {
		setCapturedImage(null)
		setAnalyzedItems([])
		setIsAnalyzing(false)
		setShowReviewDialog(false)
		setIsCreatingList(false)
		onClose()
	}

	return (
		<>
			<ResponsiveFormDialog
				open={isOpen}
				onOpenChange={(open) => !open && handleClose()}
				title="Criar Lista com IA"
				description="Tire uma foto da sua lista de compras e deixe a IA identificar os itens"
				maxWidth="lg"
			>
				<div className="space-y-6">
					{/* Captura de Imagem */}
					{!capturedImage && (
						<div className="space-y-4">
							<div className="text-center">
								<p className="text-gray-600 mb-4">
									Tire uma foto da sua lista de compras ou selecione uma imagem
								</p>
								<div className="flex flex-col sm:flex-row gap-3 justify-center">
									<Button
										onClick={handleCameraCapture}
										className="flex items-center gap-2"
									>
										<Camera className="size-4" />
										Tirar Foto
									</Button>
									<Button
										variant="outline"
										onClick={() => document.getElementById('file-upload')?.click()}
										className="flex items-center gap-2"
									>
										<FileImage className="size-4" />
										Selecionar Imagem
									</Button>
								</div>
								<input
									id="file-upload"
									type="file"
									accept="image/*"
									onChange={handleFileUpload}
									className="hidden"
								/>
							</div>
						</div>
					)}

					{/* Imagem Capturada */}
					{capturedImage && (
						<div className="space-y-4">
							<div className="relative">
								<img
									src={capturedImage}
									alt="Lista capturada"
									className="w-full max-h-64 object-contain rounded-lg border"
								/>
								<Button
									variant="destructive"
									size="sm"
									onClick={() => {
										setCapturedImage(null)
										setAnalyzedItems([])
									}}
									className="absolute top-2 right-2"
								>
									<X className="size-4" />
								</Button>
							</div>

							{/* Estado de Análise */}
							{isAnalyzing && (
								<Card>
									<CardContent className="flex items-center justify-center py-8">
										<div className="text-center">
											<Loader2 className="size-8 animate-spin mx-auto mb-2" />
											<p className="text-gray-600">Analisando imagem com IA...</p>
											<p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
										</div>
									</CardContent>
								</Card>
							)}

							{/* Botões de Ação */}
							{!isAnalyzing && analyzedItems.length > 0 && (
								<div className="flex gap-3 pt-4">
									<Button
										variant="outline"
										onClick={() => {
											setCapturedImage(null)
											setAnalyzedItems([])
										}}
										className="flex-1"
									>
										Nova Foto
									</Button>
									<Button
										onClick={() => setShowReviewDialog(true)}
										className="flex-2"
									>
										Conferir Itens ({analyzedItems.length})
									</Button>
								</div>
							)}

							{!isAnalyzing && analyzedItems.length === 0 && capturedImage && (
								<div className="flex gap-3 pt-4">
									<Button
										variant="outline"
										onClick={() => {
											setCapturedImage(null)
											setAnalyzedItems([])
										}}
										className="flex-1"
									>
										Nova Foto
									</Button>
								</div>
							)}
						</div>
					)}
				</div>
			</ResponsiveFormDialog>

			{/* Dialog de Conferência dos Itens */}
			<AIListReviewDialog
				isOpen={showReviewDialog}
				onClose={handleReviewClose}
				items={analyzedItems}
				onConfirm={handleReviewConfirm}
				isSubmitting={isCreatingList}
			/>
		</>
	)
}
