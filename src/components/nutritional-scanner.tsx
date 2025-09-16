"use client"

import {
	Camera,
	Flashlight,
	FlashlightOff,
	Loader2,
	RotateCcw,
} from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface NutritionalScannerProps {
	onScanComplete: (response: any) => void
	onClose: () => void
}

export function NutritionalScanner({
	onScanComplete,
	onClose,
}: NutritionalScannerProps) {
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
			if (!navigator.mediaDevices?.getUserMedia) {
				throw new Error("API de mídia não suportada neste navegador")
			}
			await navigator.mediaDevices.getUserMedia({ video: true })
			const deviceList = await navigator.mediaDevices.enumerateDevices()
			const videoDevices = deviceList.filter((d) => d.kind === "videoinput")
			setDevices(videoDevices)

			const backCamera = videoDevices.find((d) =>
				["back", "traseira", "environment"].some((kw) =>
					d.label.toLowerCase().includes(kw),
				),
			)
			const selectedId = backCamera?.deviceId || videoDevices[0]?.deviceId || ""
			setSelectedDeviceId(selectedId)
			return selectedId
		} catch (err: any) {
			let msg = "Erro ao acessar a câmera."
			if (err.name === "NotAllowedError") {
				msg =
					"Permissão de câmera negada. Autorize o acesso nas configurações do navegador."
			} else if (err.name === "NotFoundError") {
				msg = "Nenhuma câmera encontrada."
			}
			console.error("Erro getVideoDevices:", err)
			setError(msg)
			return ""
		}
	}, [])

	const stopCamera = useCallback(() => {
		if (streamRef.current) {
			streamRef.current.getTracks().forEach((t) => t.stop())
			streamRef.current = null
		}
		setIsFlashOn(false)
	}, [])

	const initializeCamera = useCallback(
		async (deviceId: string) => {
			const videoElement = videoRef.current
			if (!videoElement) {
				console.error("Elemento de vídeo não encontrado no DOM.")
				return
			}

			try {
				setIsLoading(true)
				setError("")
				stopCamera()

				// constraints simples e compatíveis
				const constraints = deviceId
					? { video: { deviceId: { exact: deviceId } } }
					: { video: { facingMode: "environment" } }

				const stream = await navigator.mediaDevices.getUserMedia(constraints)
				console.log("Stream inicializada:", stream)

				streamRef.current = stream
				videoElement.srcObject = stream

				await new Promise<void>((resolve, reject) => {
					videoElement.onloadedmetadata = () => resolve()
					videoElement.onerror = () =>
						reject(new Error("Erro ao carregar metadados do vídeo."))
					setTimeout(() => reject(new Error("Timeout ao carregar vídeo")), 10000)
				})

				await videoElement.play()
			} catch (err: any) {
				console.error("Erro initializeCamera:", err)
				let msg = "Erro ao iniciar a câmera."
				if (err.name === "NotAllowedError") msg = "Permissão de câmera negada."
				else if (err.name === "NotFoundError") msg = "Câmera não encontrada."
				else if (err.name === "NotReadableError")
					msg = "Câmera em uso por outro aplicativo."
				setError(msg)
			} finally {
				setIsLoading(false)
			}
		},
		[stopCamera],
	)

	useEffect(() => {
		const init = async () => {
			const deviceId = await getVideoDevices()
			if (deviceId) {
				await initializeCamera(deviceId)
			}
		}
		init()
		return () => stopCamera()
	}, [getVideoDevices, initializeCamera, stopCamera])

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
			toast.info("O flash não é suportado por esta câmera.")
		}
	}, [isFlashOn])

	const switchCamera = useCallback(() => {
		if (devices.length < 2) return
		const currentIndex = devices.findIndex(
			(d) => d.deviceId === selectedDeviceId,
		)
		const nextIndex = (currentIndex + 1) % devices.length
		setSelectedDeviceId(devices[nextIndex].deviceId)
		initializeCamera(devices[nextIndex].deviceId)
	}, [devices, selectedDeviceId, initializeCamera])

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
		} catch (err) {
			toast.error("Erro ao processar a imagem.")
			console.error("Erro ao chamar a API de OCR:", err)
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
						<p className="text-white">Iniciando câmera...</p>
					</div>
				) : isProcessing && capturedImage ? (
					<div className="relative w-full h-full">
						<img
							src={capturedImage}
							alt="Rótulo capturado"
							className="w-full h-full object-cover"
						/>
						<div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
							<Loader2 className="h-8 w-8 animate-spin text-white mb-4" />
							<p className="text-white">Processando imagem...</p>
						</div>
					</div>
				) : (
					<>
						<video
							ref={videoRef}
							autoPlay
							playsInline
							muted
							className="w-full h-full object-cover"
						></video>
						<div className="absolute inset-0 border-4 border-dashed border-white/50 rounded-lg m-4"></div>
						<div className="absolute top-4 right-4 flex flex-col gap-2">
							<Button
								variant="secondary"
								size="icon"
								onClick={toggleFlash}
								className="bg-black/50 hover:bg-black/80"
							>
								{isFlashOn ? (
									<FlashlightOff className="h-5 w-5" />
								) : (
									<Flashlight className="h-5 w-5" />
								)}
							</Button>
							{devices.length > 1 && (
								<Button
									variant="secondary"
									size="icon"
									onClick={switchCamera}
									className="bg-black/50 hover:bg-black/80"
								>
									<RotateCcw className="h-5 w-5" />
								</Button>
							)}
						</div>
					</>
				)}
			</div>

			<Button
				onClick={takePictureAndProcess}
				className="w-full mt-4"
				disabled={isProcessing || isLoading || !!error}
			>
				<Camera className="mr-2 h-4 w-4" />
				{isProcessing ? "Aguarde..." : "Capturar Imagem"}
			</Button>
		</>
	)
}
