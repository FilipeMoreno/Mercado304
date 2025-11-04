"use client"

import { motion } from "framer-motion"
import { Camera, Loader2, Minimize2, ScanLine } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { SmartCameraCapture } from "@/components/smart-camera-capture"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MinimizedDialog } from "@/components/ui/minimized-dialog"

interface NutritionalScannerProps {
	onScanComplete: (response: unknown) => void
	onClose: () => void
}

type ProcessingStep =
	| "capturing"
	| "reading_image"
	| "extracting_text"
	| "identifying_nutrition"
	| "analyzing_ingredients"
	| "calculating_values"
	| "finalizing"

const processingSteps: Record<ProcessingStep, string> = {
	capturing: "🔍 Capturando imagem...",
	reading_image: "📱 Processando imagem nutricional...",
	extracting_text: "📄 Extraindo informações nutricionais...",
	identifying_nutrition: "🥗 Identificando nutrientes...",
	analyzing_ingredients: "🧪 Analisando ingredientes...",
	calculating_values: "📊 Calculando valores nutricionais...",
	finalizing: "✅ Finalizando análise nutricional...",
}

export function NutritionalScanner({ onScanComplete, onClose }: NutritionalScannerProps) {
	const [isCameraOpen, setIsCameraOpen] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [currentStep, setCurrentStep] = useState<ProcessingStep>("capturing")
	const [isMinimized, setIsMinimized] = useState(false)

	// Funções para minimização
	const handleMinimize = () => {
		setIsMinimized(true)
	}

	const handleMaximize = () => {
		setIsMinimized(false)
	}

	const handleClose = () => {
		setIsMinimized(false)
		onClose()
	}

	const handleCameraCapture = async (file: File) => {
		console.log("🔄 NutritionalScanner: Foto capturada da câmera")

		// Converter File para dataUrl
		const reader = new FileReader()
		reader.onload = async (e) => {
			const dataUrl = e.target?.result as string
			await processImage(dataUrl)
		}
		reader.readAsDataURL(file)
	}

	const processImage = async (dataUrl: string) => {
		console.log("🔄 NutritionalScanner: Iniciando processamento da imagem")
		setCapturedImage(dataUrl)
		setIsProcessing(true)

		try {
			// Etapa 1: Processando imagem
			console.log("📖 Etapa 1: Lendo imagem")
			setCurrentStep("reading_image")
			await new Promise((resolve) => setTimeout(resolve, 800))

			// Etapa 2: Extraindo texto
			console.log("📝 Etapa 2: Extraindo texto")
			setCurrentStep("extracting_text")
			await new Promise((resolve) => setTimeout(resolve, 1000))

			// Etapa 3: Identificando nutrição
			console.log("🥗 Etapa 3: Identificando nutrição")
			setCurrentStep("identifying_nutrition")
			await new Promise((resolve) => setTimeout(resolve, 1200))

			// Etapa 4: Analisando ingredientes
			console.log("🧪 Etapa 4: Analisando ingredientes")
			setCurrentStep("analyzing_ingredients")
			await new Promise((resolve) => setTimeout(resolve, 900))

			// Etapa 5: Calculando valores
			console.log("📊 Etapa 5: Calculando valores")
			setCurrentStep("calculating_values")
			await new Promise((resolve) => setTimeout(resolve, 700))

			console.log("🌐 Chamando API de OCR")
			const response = await fetch("/api/ocr/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: dataUrl }),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Falha na API de OCR")
			}

			// Etapa 6: Finalizando
			console.log("✅ Etapa 6: Finalizando")
			setCurrentStep("finalizing")
			await new Promise((resolve) => setTimeout(resolve, 500))

			const result = await response.json()
			console.log("🎉 NutritionalScanner: Processamento concluído com sucesso")
			onScanComplete(result)
		} catch (error) {
			console.error("❌ Erro ao chamar a API de OCR:", error)
			setError(error instanceof Error ? error.message : "Erro desconhecido")
		} finally {
			// Reset do estado quando terminar - SEMPRE executa
			console.log("🔄 NutritionalScanner: Finalizando processamento, resetando estados")
			setIsProcessing(false)
			setCurrentStep("capturing")
			setCapturedImage(null)
			console.log("🔄 NutritionalScanner: Estados resetados")
		}
	}

	return (
		<>
			<MinimizedDialog
				isMinimized={isMinimized}
				onMinimize={handleMinimize}
				onMaximize={handleMaximize}
				onClose={handleClose}
				title="Scanner Nutricional"
				isLoading={isProcessing}
				processingMessage={processingSteps[currentStep]}
			>
				<DialogHeader>
					<div className="flex items-center justify-between">
						<DialogTitle className="flex items-center gap-2">
							<ScanLine className="h-5 w-5" />
							Escanear Rótulo Nutricional
						</DialogTitle>
						<Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleMinimize} title="Minimizar">
							<Minimize2 className="h-3 w-3" />
						</Button>
					</div>
				</DialogHeader>

				{isProcessing && capturedImage ? (
					// Ecrã de processamento com a imagem e animação
					<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
						<div className="relative w-full h-full">
							<Image
								src={capturedImage}
								alt="Rótulo capturado"
								width={400}
								height={384}
								className="w-full h-full object-cover"
							/>
							<div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
								{/* Animação da linha de scanner */}
								<motion.div
									className="absolute top-0 left-0 w-full h-1 bg-red-500/80 shadow-[0_0_15px_3px_rgba(239,68,68,0.6)]"
									animate={{ y: [0, 384] }} // 384px é a altura do contentor (h-96)
									transition={{
										duration: 2,
										repeat: Infinity,
										repeatType: "reverse",
										ease: "easeInOut",
									}}
								/>
								<Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
								<p className="text-white font-semibold">{processingSteps[currentStep]}</p>
							</div>
						</div>
					</div>
				) : (
					// Botão para abrir câmera
					<div className="space-y-4">
						<div className="w-full h-96 bg-muted rounded-lg flex flex-col items-center justify-center gap-4">
							<ScanLine className="w-16 h-16 text-muted-foreground" />
							<p className="text-muted-foreground text-center">
								Capture o rótulo nutricional do produto
							</p>
						</div>
						<Button onClick={() => setIsCameraOpen(true)} className="w-full" size="lg" disabled={isProcessing}>
							<Camera className="mr-2 h-5 w-5" />
							Abrir Câmera
						</Button>
						{error && (
							<p className="text-center text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded text-sm">
								{error}
							</p>
						)}
					</div>
				)}
			</MinimizedDialog>

			{/* SmartCameraCapture */}
			<SmartCameraCapture
				isOpen={isCameraOpen}
				onClose={() => setIsCameraOpen(false)}
				onCapture={handleCameraCapture}
				title="Capturar Rótulo Nutricional"
				description="Posicione o rótulo nutricional dentro da área destacada"
				mode="auto"
				quality={0.85}
				maxWidth={1920}
				maxHeight={1080}
			/>
		</>
	)
}
