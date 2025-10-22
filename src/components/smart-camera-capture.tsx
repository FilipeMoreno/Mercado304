"use client"

import {
	Camera,
	FlipHorizontal,
	Image as ImageIcon,
	Monitor,
	RotateCw,
	Smartphone,
	Upload,
	Zap,
	ZapOff,
} from "lucide-react"
import Image from "next/image"
import { useCallback, useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"

interface SmartCameraCaptureProps {
	isOpen: boolean
	onClose: () => void
	onCapture: (file: File) => void
	title?: string
	description?: string
	mode?: "auto" | "native" | "web"
	quality?: number // 0.1 to 1
	maxWidth?: number
	maxHeight?: number
}

type CaptureMethod = "native" | "web" | "upload"

export function SmartCameraCapture({
	isOpen,
	onClose,
	onCapture,
	title = "Capturar Foto",
	description = "Escolha como deseja capturar a imagem",
	mode = "auto",
	quality = 0.85,
	maxWidth = 1920,
	maxHeight = 1080,
}: SmartCameraCaptureProps) {
	const [captureMethod, setCaptureMethod] = useState<CaptureMethod | null>(null)
	const [stream, setStream] = useState<MediaStream | null>(null)
	const [devices, setDevices] = useState<MediaDeviceInfo[]>([])
	const [currentDeviceId, setCurrentDeviceId] = useState<string>("")
	const [flashEnabled, setFlashEnabled] = useState(false)
	const [preview, setPreview] = useState<string | null>(null)
	const [isMobile, setIsMobile] = useState(false)
	const [isProcessing, setIsProcessing] = useState(false)

	const videoRef = useRef<HTMLVideoElement>(null)
	const canvasRef = useRef<HTMLCanvasElement>(null)
	const nativeInputRef = useRef<HTMLInputElement>(null)
	const uploadInputRef = useRef<HTMLInputElement>(null)

	// Detectar se é mobile
	useEffect(() => {
		const checkMobile = () => {
			const ua = navigator.userAgent.toLowerCase()
			const isMobileDevice = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua)
			const isTouchDevice = "ontouchstart" in window || navigator.maxTouchPoints > 0
			const isStandalone = window.matchMedia("(display-mode: standalone)").matches

			setIsMobile(isMobileDevice || isTouchDevice || isStandalone)
		}

		checkMobile()
	}, [])

	// Auto-selecionar método baseado no modo e dispositivo
	useEffect(() => {
		if (!isOpen) return

		if (mode === "auto") {
			// Em mobile/PWA, preferir câmera nativa
			if (isMobile) {
				setCaptureMethod("native")
			} else {
				setCaptureMethod("web")
			}
		} else if (mode === "native") {
			setCaptureMethod("native")
		} else if (mode === "web") {
			setCaptureMethod("web")
		}
	}, [isOpen, mode, isMobile])

	const stopWebCamera = useCallback(() => {
		if (stream) {
			stream.getTracks().forEach((track) => {
				track.stop()
			})
			setStream(null)
		}
	}, [stream])

	const startWebCamera = useCallback(
		async (deviceId?: string) => {
			try {
				// Parar stream anterior
				if (stream) {
					stream.getTracks().forEach((track) => {
						track.stop()
					})
				}

				const constraints: MediaStreamConstraints = {
					video: {
						...(deviceId ? { deviceId: { exact: deviceId } } : { facingMode: { ideal: "environment" } }),
						width: { ideal: maxWidth },
						height: { ideal: maxHeight },
					},
				}

				const newStream = await navigator.mediaDevices.getUserMedia(constraints)
				setStream(newStream)

				if (videoRef.current) {
					videoRef.current.srcObject = newStream
				}

				// Listar dispositivos
				const allDevices = await navigator.mediaDevices.enumerateDevices()
				const videoDevices = allDevices.filter((device) => device.kind === "videoinput")
				setDevices(videoDevices)

				if (!currentDeviceId && videoDevices.length > 0 && videoDevices[0]) {
					setCurrentDeviceId(videoDevices[0].deviceId)
				}
			} catch (error) {
				console.error("Erro ao acessar câmera:", error)
				toast.error("Erro ao acessar câmera. Tente outro método.")
				setCaptureMethod(null)
			}
		},
		[stream, currentDeviceId, maxWidth, maxHeight],
	)

	// Iniciar câmera web quando selecionado
	useEffect(() => {
		if (captureMethod === "web" && isOpen) {
			startWebCamera()
		}

		return () => {
			stopWebCamera()
		}
	}, [captureMethod, isOpen, startWebCamera, stopWebCamera])

	const switchCamera = () => {
		if (devices.length > 1) {
			const currentIndex = devices.findIndex((device) => device.deviceId === currentDeviceId)
			const nextIndex = (currentIndex + 1) % devices.length
			const nextDevice = devices[nextIndex]
			if (nextDevice) {
				setCurrentDeviceId(nextDevice.deviceId)
				startWebCamera(nextDevice.deviceId)
			}
		}
	}

	const toggleFlash = async () => {
		if (stream) {
			const track = stream.getVideoTracks()[0]
			if (!track) return

			const capabilities = track.getCapabilities() as MediaTrackCapabilities & { torch?: boolean }

			if (capabilities.torch) {
				try {
					await track.applyConstraints({
						// @ts-expect-error - torch is not in the standard types yet
						advanced: [{ torch: !flashEnabled }],
					})
					setFlashEnabled(!flashEnabled)
				} catch (error) {
					console.error("Erro ao controlar flash:", error)
					toast.error("Flash não disponível neste dispositivo")
				}
			} else {
				toast.error("Flash não suportado nesta câmera")
			}
		}
	}

	const compressImage = async (file: File): Promise<File> => {
		return new Promise((resolve) => {
			const reader = new FileReader()

			reader.onload = (e) => {
				const img = document.createElement("img")
				img.onload = () => {
					const canvas = document.createElement("canvas")
					let width = img.width
					let height = img.height

					// Redimensionar mantendo proporção
					if (width > maxWidth || height > maxHeight) {
						const ratio = Math.min(maxWidth / width, maxHeight / height)
						width = width * ratio
						height = height * ratio
					}

					canvas.width = width
					canvas.height = height

					const ctx = canvas.getContext("2d")
					if (!ctx) {
						resolve(file)
						return
					}

					ctx.drawImage(img, 0, 0, width, height)

					canvas.toBlob(
						(blob) => {
							if (blob) {
								const compressedFile = new File([blob], file.name.replace(/\.[^/.]+$/, ".jpg"), { type: "image/jpeg" })
								resolve(compressedFile)
							} else {
								resolve(file)
							}
						},
						"image/jpeg",
						quality,
					)
				}
				img.src = e.target?.result as string
			}

			reader.readAsDataURL(file)
		})
	}

	const captureFromWebCamera = () => {
		if (!videoRef.current || !canvasRef.current) return

		const video = videoRef.current
		const canvas = canvasRef.current
		const context = canvas.getContext("2d")

		if (!context) return

		canvas.width = video.videoWidth
		canvas.height = video.videoHeight
		context.drawImage(video, 0, 0, canvas.width, canvas.height)

		canvas.toBlob(
			async (blob) => {
				if (blob) {
					const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" })
					const compressed = await compressImage(file)

					// Mostrar preview
					const previewUrl = URL.createObjectURL(compressed)
					setPreview(previewUrl)
				}
			},
			"image/jpeg",
			quality,
		)
	}

	const handleNativeCameraCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsProcessing(true)
		try {
			const compressed = await compressImage(file)
			const previewUrl = URL.createObjectURL(compressed)
			setPreview(previewUrl)
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			toast.error("Erro ao processar imagem")
		} finally {
			setIsProcessing(false)
		}
	}

	const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0]
		if (!file) return

		setIsProcessing(true)
		try {
			const compressed = await compressImage(file)
			const previewUrl = URL.createObjectURL(compressed)
			setPreview(previewUrl)
		} catch (error) {
			console.error("Erro ao processar imagem:", error)
			toast.error("Erro ao processar imagem")
		} finally {
			setIsProcessing(false)
		}
	}

	const confirmCapture = async () => {
		if (!preview) return

		setIsProcessing(true)
		try {
			const response = await fetch(preview)
			const blob = await response.blob()
			const file = new File([blob], `foto-${Date.now()}.jpg`, { type: "image/jpeg" })

			onCapture(file)
			handleClose()
			toast.success("Foto capturada com sucesso!")
		} catch (error) {
			console.error("Erro ao confirmar captura:", error)
			toast.error("Erro ao processar foto")
		} finally {
			setIsProcessing(false)
		}
	}

	const handleClose = () => {
		stopWebCamera()
		setCaptureMethod(null)
		setPreview(null)
		onClose()
	}

	const retakePhoto = () => {
		setPreview(null)
	}

	return (
		<Dialog open={isOpen} onOpenChange={handleClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					{description && <p className="text-sm text-muted-foreground">{description}</p>}
				</DialogHeader>

				{/* Preview da foto capturada */}
				{preview ? (
					<div className="space-y-4">
						<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
							<Image src={preview} alt="Preview" fill className="object-contain" unoptimized />
						</div>

						<div className="flex gap-2 justify-end">
							<Button variant="outline" onClick={retakePhoto} disabled={isProcessing}>
								<RotateCw className="size-4 mr-2" />
								Tirar Outra
							</Button>
							<Button onClick={confirmCapture} disabled={isProcessing}>
								<Camera className="size-4 mr-2" />
								Usar Esta Foto
							</Button>
						</div>
					</div>
				) : (
					<>
						{/* Seleção de método */}
						{!captureMethod && (
							<div className="grid gap-4 py-4">
								<Button
									variant="outline"
									size="lg"
									className="h-24 flex-col gap-2"
									onClick={() => setCaptureMethod("native")}
								>
									<Smartphone className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Câmera Nativa</div>
										<div className="text-xs text-muted-foreground">Abre a câmera do dispositivo</div>
									</div>
								</Button>

								<Button
									variant="outline"
									size="lg"
									className="h-24 flex-col gap-2"
									onClick={() => setCaptureMethod("web")}
								>
									<Monitor className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Câmera Web</div>
										<div className="text-xs text-muted-foreground">Usa a câmera do navegador</div>
									</div>
								</Button>

								<Button
									variant="outline"
									size="lg"
									className="h-24 flex-col gap-2"
									onClick={() => setCaptureMethod("upload")}
								>
									<Upload className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Fazer Upload</div>
										<div className="text-xs text-muted-foreground">Selecionar da galeria</div>
									</div>
								</Button>
							</div>
						)}

						{/* Câmera Nativa */}
						{captureMethod === "native" && (
							<div className="space-y-4">
								<div className="text-center p-8 border-2 border-dashed rounded-lg">
									<Camera className="size-16 mx-auto mb-4 text-muted-foreground" />
									<p className="text-sm text-muted-foreground mb-4">
										Clique no botão para abrir a câmera do seu dispositivo
									</p>
									<input
										ref={nativeInputRef}
										type="file"
										accept="image/*"
										capture="environment"
										onChange={handleNativeCameraCapture}
										className="hidden"
									/>
									<Button size="lg" onClick={() => nativeInputRef.current?.click()} disabled={isProcessing}>
										<Camera className="size-5 mr-2" />
										Abrir Câmera
									</Button>
								</div>

								<Button variant="ghost" size="sm" onClick={() => setCaptureMethod(null)} className="w-full">
									Escolher Outro Método
								</Button>
							</div>
						)}

						{/* Câmera Web */}
						{captureMethod === "web" && (
							<div className="space-y-4">
								<div className="relative aspect-video bg-black rounded-lg overflow-hidden">
									<video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />

									<div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 px-4">
										{devices.length > 1 && (
											<Button variant="secondary" size="icon" onClick={switchCamera}>
												<FlipHorizontal className="size-4" />
											</Button>
										)}

										<Button variant="secondary" size="icon" onClick={toggleFlash}>
											{flashEnabled ? <Zap className="size-4 fill-current" /> : <ZapOff className="size-4" />}
										</Button>
									</div>
								</div>

								<canvas ref={canvasRef} className="hidden" />

								<div className="flex gap-2 justify-between">
									<Button variant="ghost" onClick={() => setCaptureMethod(null)}>
										Voltar
									</Button>

									<Button onClick={captureFromWebCamera}>
										<Camera className="size-4 mr-2" />
										Capturar
									</Button>
								</div>
							</div>
						)}

						{/* Upload */}
						{captureMethod === "upload" && (
							<div className="space-y-4">
								<div className="text-center p-8 border-2 border-dashed rounded-lg">
									<ImageIcon className="size-16 mx-auto mb-4 text-muted-foreground" />
									<p className="text-sm text-muted-foreground mb-4">Selecione uma imagem da sua galeria</p>
									<input ref={uploadInputRef} type="file" accept="image/*" onChange={handleUpload} className="hidden" />
									<Button size="lg" onClick={() => uploadInputRef.current?.click()} disabled={isProcessing}>
										<Upload className="size-5 mr-2" />
										Selecionar Imagem
									</Button>
								</div>

								<Button variant="ghost" size="sm" onClick={() => setCaptureMethod(null)} className="w-full">
									Escolher Outro Método
								</Button>
							</div>
						)}
					</>
				)}
			</DialogContent>
		</Dialog>
	)
}
