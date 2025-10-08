"use client"

import { motion } from "framer-motion"
import { Camera, Loader2, ScanLine, Upload } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NutritionalScannerProps {
	onScanComplete: (response: any) => void
	onClose: () => void
}

export function NutritionalScanner({ onScanComplete, onClose }: NutritionalScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const fileInputRef = useRef<HTMLInputElement>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string | null>(null)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)

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
		startCamera()
		return () => {
			stopCamera()
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [])

	const processImage = async (dataUrl: string) => {
		setCapturedImage(dataUrl)
		setIsProcessing(true)
		stopCamera()

		try {
			const response = await fetch("/api/ocr/scan", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ imageUrl: dataUrl }),
			})

			if (!response.ok) {
				const error = await response.json()
				throw new Error(error.error || "Falha na API de OCR")
			}

			const result = await response.json()
			onScanComplete(result)
		} catch (error) {
			console.error("Erro ao chamar a API de OCR:", error)
		} finally {
			// A transição é mais suave se não fecharmos o modal imediatamente
			// O componente pai tratará de fechar o modal em onScanComplete
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
		<>
			<DialogHeader>
				<DialogTitle className="flex items-center gap-2">
					<ScanLine className="h-5 w-5" />
					Escanear Rótulo Nutricional
				</DialogTitle>
			</DialogHeader>

			<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative flex items-center justify-center">
				{isProcessing && capturedImage ? (
					// Ecrã de processamento com a imagem e animação
					<div className="relative w-full h-full">
						<img src={capturedImage} alt="Rótulo capturado" className="w-full h-full object-cover" />
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
							<p className="text-white font-semibold">Analisando com IA...</p>
						</div>
					</div>
				) : (
					// Vista da câmara
					<>
						<video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
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
			<input
				ref={fileInputRef}
				type="file"
				accept="image/*"
				onChange={handleFileUpload}
				className="hidden"
			/>
		</>
	)
}
