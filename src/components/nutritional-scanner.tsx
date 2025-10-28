"use client"

import { motion } from "framer-motion"
import { Camera, Loader2, Minimize2, ScanLine, Upload } from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
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
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [currentStep, setCurrentStep] = useState<ProcessingStep>("capturing")
	const [isMinimized, setIsMinimized] = useState(false)

	// Debug: Monitorar mudanças no estado de processamento
	useEffect(() => {
		console.log("🔄 NutritionalScanner: Estado isProcessing mudou para:", isProcessing)
	}, [isProcessing])

	const stopCamera = useCallback(() => {
		if (stream) {
			stream.getTracks().forEach((track) => {
				track.stop()
			})
			setStream(null)
		}
	}, [stream])

	const startCamera = useCallback(async () => {
		// Garante que a câmara anterior é parada antes de iniciar uma nova
		if (stream) {
			stopCamera()
		}

		try {
			const mediaStream = await navigator.mediaDevices.getUserMedia({
				video: { facingMode: "environment" },
			})
			if (videoRef.current) {
				videoRef.current.srcObject = mediaStream
			}
			setStream(mediaStream)
			setError(null)
		} catch (err) {
			console.error("Erro ao acessar a câmera:", err)
			setError("Não foi possível aceder à câmara. Por favor, verifica as permissões no teu navegador.")
		}
	}, [stream, stopCamera])

	useEffect(() => {
		startCamera()
		return () => {
			stopCamera()
		}
	}, [startCamera, stopCamera])

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

	const processImage = async (dataUrl: string) => {
		console.log("🔄 NutritionalScanner: Iniciando processamento da imagem")
		setCapturedImage(dataUrl)
		setIsProcessing(true)
		stopCamera()

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
			console.log("🔄 NutritionalScanner: isMinimized:", isMinimized)
			setIsProcessing(false)
			setCurrentStep("capturing")
			console.log("🔄 NutritionalScanner: Estados resetados")
		}
	}

	const takePictureAndProcess = async () => {
		const video = videoRef.current
		const canvas = canvasRef.current
		if (video && canvas) {
			const context = canvas.getContext("2d")
			canvas.width = video.videoWidth
			canvas.height = video.videoHeight
			context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)

			const dataUrl = canvas.toDataURL("image/png")
			setCurrentStep("capturing")
			await processImage(dataUrl)
		}
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file?.type.startsWith("image/")) {
			const reader = new FileReader()
			reader.onload = async (e) => {
				const dataUrl = e.target?.result as string
				await processImage(dataUrl)
			}
			reader.readAsDataURL(file)
		}
	}

	const triggerFileUpload = () => {
		fileInputRef.current?.click()
	}

	return (
		<MinimizedDialog
			isMinimized={isMinimized}
			onMinimize={handleMinimize}
			onMaximize={handleMaximize}
			onClose={handleClose}
			title="Scanner Nutricional"
			isLoading={isProcessing}
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

			<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
				{isProcessing && capturedImage ? (
					// Ecrã de processamento com a imagem e animação
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
				) : (
					// Vista da câmara
					<>
						<video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover">
							<track kind="captions" />
						</video>
						<canvas ref={canvasRef} className="hidden"></canvas>
						<div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4"></div>
						{error && (
							<p className="absolute bottom-4 left-4 right-4 text-center text-white bg-red-800/80 p-2 rounded">
								{error}
							</p>
						)}
					</>
				)}
			</div>

			<div className="flex gap-2 mt-4">
				<Button onClick={takePictureAndProcess} className="flex-1" disabled={isProcessing || !!error}>
					<Camera className="mr-2 h-4 w-4" />
					{isProcessing ? "Aguarde..." : "Capturar"}
				</Button>
				<Button onClick={triggerFileUpload} variant="outline" className="flex-1" disabled={isProcessing}>
					<Upload className="mr-2 h-4 w-4" />
					Carregar
				</Button>
			</div>
			<input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
		</MinimizedDialog>
	)
}
