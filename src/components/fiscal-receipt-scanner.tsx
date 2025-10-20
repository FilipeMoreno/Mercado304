"use client"

import { motion } from "framer-motion"
import { Camera, Loader2, Receipt, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface FiscalReceiptScannerProps {
	isOpen: boolean
	onScanComplete: (response: any) => void
	onClose: () => void
}

// Estados de progresso da análise
type ProcessingStep = 
	| 'capturing' 
	| 'reading_image' 
	| 'extracting_text' 
	| 'identifying_products' 
	| 'analyzing_prices' 
	| 'organizing_data' 
	| 'finalizing'

const processingSteps: Record<ProcessingStep, string> = {
	capturing: "Capturando imagem...",
	reading_image: "Lendo cupom fiscal com IA...",
	extracting_text: "Extraindo informações do texto...",
	identifying_products: "Identificando produtos...",
	analyzing_prices: "Analisando preços e quantidades...",
	organizing_data: "Organizando dados da compra...",
	finalizing: "Finalizando análise..."
}

export function FiscalReceiptScanner({ isOpen, onScanComplete, onClose }: FiscalReceiptScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [error, setError] = useState<string | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [currentStep, setCurrentStep] = useState<ProcessingStep>('capturing')

	const stopCamera = useCallback(() => {
		if (stream) {
			stream.getTracks().forEach((track) => track.stop())
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
		if (isOpen) {
			startCamera()
		} else {
			stopCamera()
		}
		return () => {
			stopCamera()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [isOpen])

	const processImage = async (dataUrl: string) => {
		setCapturedImage(dataUrl)
		setIsProcessing(true)
		stopCamera()

		try {
			// Etapa 1: Lendo imagem
			setCurrentStep('reading_image')
			await new Promise(resolve => setTimeout(resolve, 800))

			// Etapa 2: Extraindo texto
			setCurrentStep('extracting_text')
			await new Promise(resolve => setTimeout(resolve, 1000))

			// Etapa 3: Identificando produtos
			setCurrentStep('identifying_products')
			await new Promise(resolve => setTimeout(resolve, 1200))

			// Etapa 4: Analisando preços
			setCurrentStep('analyzing_prices')
			await new Promise(resolve => setTimeout(resolve, 800))

			// Etapa 5: Organizando dados
			setCurrentStep('organizing_data')
			await new Promise(resolve => setTimeout(resolve, 600))

			const response = await fetch("/api/ocr/fiscal-receipt", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: dataUrl }),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Falha na API de OCR")
			}

			// Etapa 6: Finalizando
			setCurrentStep('finalizing')
			await new Promise(resolve => setTimeout(resolve, 500))

			const result = await response.json()
			onScanComplete(result)
		} catch (error) {
			console.error("Erro ao chamar a API de OCR para cupom fiscal:", error)
		} finally {
			// Reset do estado quando terminar
			setIsProcessing(false)
			setCurrentStep('capturing')
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
			setCurrentStep('capturing')
			await processImage(dataUrl)
		}
	}

	const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
		const file = event.target.files?.[0]
		if (file && file.type.startsWith('image/')) {
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
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle className="flex items-center gap-2">
						<Receipt className="size-5" />
						Escanear Cupom Fiscal
					</DialogTitle>
				</DialogHeader>

				<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
					{isProcessing && capturedImage ? (
						// Ecrã de processamento com a imagem e animação
						<div className="relative w-full h-full">
							<img src={capturedImage} alt="Cupom fiscal capturado" className="w-full h-full object-cover" />
							<div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
								{/* Animação da linha de scanner */}
								<motion.div
									className="absolute top-0 left-0 w-full h-1 bg-blue-500/80 shadow-[0_0_15px_3px_rgba(59,130,246,0.6)]"
									animate={{ y: [0, 384] }} // 384px é a altura do contentor (h-96)
									transition={{
										duration: 2,
										repeat: Infinity,
										repeatType: "reverse",
										ease: "easeInOut",
									}}
								/>
								<Loader2 className="size-8 animate-spin text-white mb-4" />
								<p className="text-white font-semibold">{processingSteps[currentStep]}</p>
								<div className="mt-2 text-white/80 text-sm">
									{currentStep === 'reading_image' && "Processando imagem..."}
									{currentStep === 'extracting_text' && "Extraindo texto do cupom..."}
									{currentStep === 'identifying_products' && "Identificando produtos..."}
									{currentStep === 'analyzing_prices' && "Analisando preços..."}
									{currentStep === 'organizing_data' && "Organizando informações..."}
									{currentStep === 'finalizing' && "Quase pronto..."}
								</div>
							</div>
						</div>
					) : (
						// Vista da câmara
						<>
							<video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
							<canvas ref={canvasRef} className="hidden"></canvas>
							<div className="absolute inset-0 border-4 border-dashed border-blue-500/50 rounded-lg m-4"></div>
							<div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
								<div className="bg-black/70 text-white px-4 py-2 rounded-lg text-center">
									<Receipt className="size-8 mx-auto mb-2" />
									<p className="text-sm">Posicione o cupom fiscal dentro da área</p>
								</div>
							</div>
							{error && (
								<p className="absolute bottom-4 left-4 right-4 text-center text-white bg-red-800/80 p-2 rounded-sm">
									{error}
								</p>
							)}
						</>
					)}
				</div>

				<div className="flex gap-2 mt-4">
					<Button onClick={takePictureAndProcess} className="flex-1" disabled={isProcessing || !!error}>
						<Camera className="mr-2 size-4" />
						{isProcessing ? "Aguarde..." : "Capturar"}
					</Button>
					<Button onClick={triggerFileUpload} variant="outline" className="flex-1" disabled={isProcessing}>
						<Upload className="mr-2 size-4" />
						Carregar
					</Button>
				</div>
				<input
					ref={fileInputRef}
					type="file"
					accept="image/*"
					onChange={handleFileUpload}
					className="hidden"
				/>
			</DialogContent>
		</Dialog>
	)
}