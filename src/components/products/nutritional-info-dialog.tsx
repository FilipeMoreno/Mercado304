"use client"

import { useState } from "react"
import { QrCode, Sparkles } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { NutritionalInfoForm } from "@/components/nutritional-info-form"
import type { NutritionalInfo } from "@/types"

interface NutritionalInfoDialogProps {
	productId: string
	onSuccess?: () => void
	onCancel?: () => void
}

export function NutritionalInfoDialog({ productId, onSuccess, onCancel }: NutritionalInfoDialogProps) {
	const [formData, setFormData] = useState<Partial<NutritionalInfo>>({})
	const [isSubmitting, setIsSubmitting] = useState(false)
	const [showScanner, setShowScanner] = useState(false)
	const [isAnalyzing, setIsAnalyzing] = useState(false)

	const handleScanResult = async (imageData: string) => {
		try {
			setIsAnalyzing(true)
			setShowScanner(false)
			
			// Chamar API para analisar a imagem com IA
			const response = await fetch('/api/ai/analyze-nutritional-label', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					image: imageData,
					productId,
				}),
			})

			if (!response.ok) {
				throw new Error('Erro ao analisar a imagem')
			}

			const result = await response.json()
			
			// Preencher formulário com dados extraídos
			if (result.nutritionalInfo) {
				setFormData(prev => ({
					...prev,
					...result.nutritionalInfo,
				}))
				toast.success('Informações nutricionais extraídas com sucesso!')
			} else {
				toast.warning('Não foi possível extrair informações da imagem')
			}
		} catch (error) {
			console.error('Error analyzing image:', error)
			toast.error('Erro ao analisar a imagem')
		} finally {
			setIsAnalyzing(false)
		}
	}

	const handleSubmit = async () => {
		try {
			setIsSubmitting(true)
			
			// Validar campos obrigatórios
			const requiredFields = ['calories', 'carbohydrates', 'proteins', 'totalFat', 'saturatedFat', 'transFat', 'fiber', 'sodium']
			const missingFields = requiredFields.filter(field => !formData[field as keyof NutritionalInfo])
			
			if (missingFields.length > 0) {
				toast.error(`Campos obrigatórios não preenchidos: ${missingFields.join(', ')}`)
				return
			}

			// Enviar dados para a API
			const response = await fetch(`/api/products/${productId}/nutritional-info`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					productId,
				}),
			})

			if (!response.ok) {
				throw new Error('Erro ao salvar informações nutricionais')
			}

			toast.success('Informações nutricionais salvas com sucesso!')
			onSuccess?.()
		} catch (error) {
			console.error('Error saving nutritional info:', error)
			toast.error('Erro ao salvar informações nutricionais')
		} finally {
			setIsSubmitting(false)
		}
	}

	if (showScanner) {
		return (
			<div className="space-y-4">
				<div className="text-center">
					<h3 className="text-lg font-semibold mb-2">Scanner de Rótulo Nutricional</h3>
					<p className="text-sm text-muted-foreground mb-4">
						Posicione a câmera sobre o rótulo nutricional do produto
					</p>
				</div>
				
				<BarcodeScanner
					onScan={handleScanResult}
					onClose={() => setShowScanner(false)}
					isOpen={showScanner}
				/>
				
				<div className="flex justify-center">
					<Button
						variant="outline"
						onClick={() => setShowScanner(false)}
					>
						Cancelar Scanner
					</Button>
				</div>
			</div>
		)
	}

	return (
		<div className="space-y-6">
			{/* Botões de ação no topo */}
			<div className="flex flex-col sm:flex-row gap-3">
				<Button
					variant="outline"
					onClick={() => setShowScanner(true)}
					disabled={isSubmitting || isAnalyzing}
					className="flex-1"
				>
					<QrCode className="h-4 w-4 mr-2" />
					Scanner de Rótulo
				</Button>
				<Button
					variant="outline"
					disabled={true}
					className="flex-1 opacity-50"
					title="Em breve: Análise com IA"
				>
					<Sparkles className="h-4 w-4 mr-2" />
					Análise com IA
				</Button>
			</div>

			{isAnalyzing && (
				<div className="text-center py-4">
					<div className="inline-flex items-center gap-2 text-blue-600">
						<Sparkles className="h-4 w-4 animate-spin" />
						<span>Analisando rótulo nutricional...</span>
					</div>
				</div>
			)}

			<Separator />
			
			<NutritionalInfoForm
				initialData={formData}
				onDataChange={setFormData}
			/>
			
			<div className="flex justify-end gap-3 pt-6 mt-6 border-t sticky bottom-0 bg-background">
				<Button
					variant="outline"
					onClick={onCancel}
					disabled={isSubmitting || isAnalyzing}
				>
					Cancelar
				</Button>
				<Button
					onClick={handleSubmit}
					disabled={isSubmitting || isAnalyzing}
				>
					{isSubmitting ? 'Salvando...' : 'Salvar Informações'}
				</Button>
			</div>
		</div>
	)
}
