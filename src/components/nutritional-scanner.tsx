// src/components/nutritional-scanner.tsx
"use client"

import { Camera, Flashlight, FlashlightOff, Loader2, RotateCcw, } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NutritionalScannerProps {
	onScanComplete: (response: any) => void
	onClose: () => void
}

export function NutritionalScanner({ onScanComplete, onClose }: NutritionalScannerProps) {
	const videoRef = useRef<HTMLVideoElement>(null)
	const streamRef = useRef<MediaStream | null>(null)
	const [isProcessing, setIsProcessing] = useState(false)
	const [error, setError] = useState<string>("")
	const [isFlashOn, setIsFlashOn] = useState(false)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [selectedDeviceId, setSelectedDeviceId] = useState<string>("")
	const [isLoading, setIsLoading] = useState(true)
	const [capturedImage, setCapturedImage] = useState<string | null>(null)

	const getVideoDevices = useCallback(async () => {
		try {
			if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
				throw new Error("API de mídia não suportada neste navegador")
			}
			await navigator.mediaDevices.getUserMedia({ video: true })
			const deviceList = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = deviceList.filter((device) => device.kind === "videoinput")
			setDevices(videoDevices)

			const backCamera = videoDevices.find(
				(device) =>
					device.label.toLowerCase().includes("back") ||
					device.label.toLowerCase().includes("traseira") ||
					device.label.toLowerCase().includes("environment"),
			)
			const selectedId = backCamera?.deviceId || videoDevices[0]?.deviceId || ""
			setSelectedDeviceId(selectedId)
			return selectedId
		} catch (err: any) {
			let errorMessage = "Erro ao aceder à câmara."
			if (err.name === "NotAllowedError") {
				errorMessage = "Permissão de câmara negada. Por favor, autorize o acesso nas configurações do seu navegador."
			} else if (err.name === "NotFoundError") {
				errorMessage = "Nenhuma câmara encontrada."
			}
			setError(errorMessage)
			return ""
		}
	}, [])

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((track) => track.stop())
			streamRef.current = null
		}
		setIsFlashOn(false)
	}, [])

	const initializeCamera = useCallback(
		async (deviceId: string) => {
			const videoElement = videoRef.current
			// Verificação crucial: só continua se o elemento de vídeo já existir no ecrã
			if (!videoElement) {
				return
			}
			try {
				setError("")
				stopCamera()

				const constraintSets = [
					{
						video: {
							deviceId: { exact: deviceId },
							width: { ideal: 1920 },
							height: { ideal: 1080 },
							focusMode: "continuous",
						},
					},
					{ video: { deviceId: { exact: deviceId } } },
					{ video: { facingMode: "environment" } },
				]

				let stream: MediaStream | null = null
				for (const constraints of constraintSets) {
					try {
						stream = await navigator.mediaDevices.getUserMedia(constraints)
						break
					} catch (err) {
						console.warn("Falha na configuração:", constraints, err)
					}
				}

				if (!stream) throw new Error("Não foi possível aceder à câmara com as configurações disponíveis.")

				streamRef.current = stream
				videoElement.srcObject = stream
				await videoElement.play()
			} catch (err: any) {
				setError(`Erro ao iniciar câmara: ${err.message}`)
			}
		},
		[stopCamera],
	)

	// Efeito para obter os dispositivos na primeira renderização
	useEffect(() => {
		const init = async () => {
			setIsLoading(true)
			await getVideoDevices()
			setIsLoading(false)
		}
		init()

		return () => {
			stopCamera()
		}
	}, [getVideoDevices, stopCamera])

	// Efeito para inicializar ou trocar de câmara quando o ID do dispositivo muda
	useEffect(() => {
		if (selectedDeviceId && !isLoading) {
			initializeCamera(selectedDeviceId)
		}
	}, [selectedDeviceId, isLoading, initializeCamera])

	const toggleFlash = useCallback(async () => {
		if (!streamRef.current) return
		const track = streamRef.current.getVideoTracks()[0]
		const capabilities = track.getCapabilities() as any
		if (track && capabilities.torch) {
			try {
				await track.applyConstraints({
					advanced: [{ torch: !isFlashOn } as any],
				})
				setIsFlashOn(!isFlashOn)
			} catch (err) {
				console.error("Erro ao controlar flash:", err)
				toast.error("Não foi possível controlar o flash.")
			}
		} else {
			toast.info("O flash não é suportado por esta câmara.")
		}
	}, [isFlashOn])

	const switchCamera = useCallback(() => {
		const currentIndex = devices.findIndex((device) => device.deviceId === selectedDeviceId)
		const nextIndex = (currentIndex + 1) % devices.length
		setSelectedDeviceId(devices[nextIndex].deviceId)
	}, [devices, selectedDeviceId])

	const takePictureAndProcess = async () => {
		const video = videoRef.current
		if (!video) return

		const canvas = document.createElement("canvas")
		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		const context = canvas.getContext("2d")
		context?.drawImage(video, 0, 0, video.videoWidth, video.videoHeight)
		const dataUrl = canvas.toDataURL("image/png")

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
			toast.error("Erro ao processar a imagem.")
			console.error("Erro ao chamar a API de OCR:", error)
		} finally {
			setIsProcessing(false)
			onClose()
		}
	}

	return (
		<>
			<DialogHeader>
				<DialogTitle>Escanear Rótulo Nutricional</DialogTitle>
			</DialogHeader>

			<div className="w-full h-96 bg-black rounded-lg overflow-hidden relative">
				{error ? (
					<div className="w-full h-full flex flex-col items-center justify-center text-center p-4">
						<p className="text-red-500">{error}</p>
					</div>
				) : isLoading ? (
					<div className="w-full h-full flex flex-col items-center justify-center">
						<Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
						<p className="text-white">A iniciar câmara...</p>
					</div>
				) : isProcessing && capturedImage ? (
					<div className="relative w-full h-full">
						<img src={capturedImage} alt="Rótulo capturado" className="w-full h-full object-cover" />
						<div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
							<p className="text-white">A processar imagem...</p>
						</div>
					</div>
				) : (
					<>
						<video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover"></video>
						<div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4"></div>
						<div className="absolute top-4 right-4 flex flex-col gap-2">
							<Button variant="secondary" size="icon" onClick={toggleFlash} className="bg-black/50 hover:bg-black/80">
								{isFlashOn ? <FlashlightOff className="h-5 w-5" /> : <Flashlight className="h-5 w-5" />}
							</Button>
							{devices.length > 1 && (
								<Button variant="secondary" size="icon" onClick={switchCamera} className="bg-black/50 hover:bg-black/80">
									<RotateCcw className="h-5 w-5" />
								</Button>
							)}
						</div>
					</>
				)}
			</div>

			<Button onClick={takePictureAndProcess} className="w-full mt-4" disabled={isProcessing || isLoading || !!error}>
				<Camera className="mr-2 h-4 w-4" />
				{isProcessing ? "A aguardar..." : "Capturar Imagem"}
			</Button>
		</>
	)
}