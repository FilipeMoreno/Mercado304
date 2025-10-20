"use client"

import { Camera, CheckCircle2, Code2, Info, Smartphone, XCircle, Zap } from "lucide-react"
import Image from "next/image"
import { useState } from "react"
import { SmartCameraCapture } from "@/components/smart-camera-capture"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function TesteCameraPage() {
	const [isOpen, setIsOpen] = useState(false)
	const [mode, setMode] = useState<"auto" | "native" | "web">("auto")
	const [capturedImage, setCapturedImage] = useState<string | null>(null)
	const [imageInfo, setImageInfo] = useState<{
		name: string
		size: number
		type: string
		dimensions?: string
	} | null>(null)

	const handleCapture = async (file: File) => {
		console.log("Foto capturada:", file)

		// Criar URL para preview
		const url = URL.createObjectURL(file)
		setCapturedImage(url)

		// Obter dimensões da imagem
		const img = document.createElement("img")
		img.onload = () => {
			setImageInfo({
				name: file.name,
				size: file.size,
				type: file.type,
				dimensions: `${img.width}x${img.height}px`,
			})
		}
		img.src = url

		setImageInfo({
			name: file.name,
			size: file.size,
			type: file.type,
		})
	}

	const openCamera = (selectedMode: typeof mode) => {
		setMode(selectedMode)
		setIsOpen(true)
	}

	const formatFileSize = (bytes: number) => {
		if (bytes < 1024) return `${bytes} B`
		if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`
		return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
	}

	return (
		<div className="min-h-screen bg-gradient-to-b from-background to-muted/20 p-4 md:p-8">
			<div className="max-w-6xl mx-auto space-y-6">
				{/* Header */}
				<div className="space-y-2">
					<h1 className="text-4xl font-bold flex items-center gap-3">
						<Camera className="size-10" />
						Teste de Câmera PWA
					</h1>
					<p className="text-muted-foreground">
						Sistema inteligente de captura de fotos otimizado para PWA e dispositivos móveis
					</p>
				</div>

				{/* Informações sobre as estratégias */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Info className="size-5" />
							Estratégias de Captura
						</CardTitle>
						<CardDescription>Este sistema implementa três métodos diferentes de captura de imagem</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-3">
							<div className="space-y-2 p-4 border rounded-lg">
								<div className="flex items-center gap-2">
									<Zap className="size-5 text-green-500" />
									<h3 className="font-semibold">Modo Auto</h3>
								</div>
								<p className="text-sm text-muted-foreground">
									Detecta automaticamente o melhor método baseado no dispositivo. Usa câmera nativa em mobile/PWA e
									câmera web em desktop.
								</p>
								<Badge variant="outline" className="text-xs">
									⚡ Recomendado
								</Badge>
							</div>

							<div className="space-y-2 p-4 border rounded-lg">
								<div className="flex items-center gap-2">
									<Smartphone className="size-5 text-blue-500" />
									<h3 className="font-semibold">Câmera Nativa</h3>
								</div>
								<p className="text-sm text-muted-foreground">
									Usa <code className="text-xs bg-muted px-1 rounded-sm">input[capture]</code> para abrir a câmera nativa
									do dispositivo. Mais eficiente em mobile.
								</p>
								<Badge variant="outline" className="text-xs">
									📱 Mobile
								</Badge>
							</div>

							<div className="space-y-2 p-4 border rounded-lg">
								<div className="flex items-center gap-2">
									<Code2 className="size-5 text-purple-500" />
									<h3 className="font-semibold">Câmera Web</h3>
								</div>
								<p className="text-sm text-muted-foreground">
									Usa <code className="text-xs bg-muted px-1 rounded-sm">getUserMedia</code> API para controle total da
									câmera. Ideal para desktop e controles avançados.
								</p>
								<Badge variant="outline" className="text-xs">
									💻 Desktop
								</Badge>
							</div>
						</div>

						<div className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800 border p-4 rounded-lg">
							<div className="flex gap-2">
								<Info className="size-5 text-blue-500 shrink-0 mt-0.5" />
								<div className="space-y-2 text-sm">
									<p className="font-semibold text-blue-900 dark:text-blue-100">Vantagens desta implementação:</p>
									<ul className="space-y-1 text-blue-700 dark:text-blue-300">
										<li>✅ Compressão inteligente de imagens (reduz tamanho em até 70%)</li>
										<li>✅ Redimensionamento automático mantendo proporções</li>
										<li>✅ Preview antes de confirmar a captura</li>
										<li>✅ Suporte a múltiplas câmeras (frontal/traseira)</li>
										<li>✅ Controle de flash (quando disponível)</li>
										<li>✅ Funciona offline (PWA)</li>
										<li>✅ Otimizado para dispositivos móveis</li>
									</ul>
								</div>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Testes */}
				<Tabs defaultValue="quick" className="w-full">
					<TabsList className="grid w-full grid-cols-2">
						<TabsTrigger value="quick">Teste Rápido</TabsTrigger>
						<TabsTrigger value="advanced">Testes Avançados</TabsTrigger>
					</TabsList>

					<TabsContent value="quick" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Teste Rápido - Modo Automático</CardTitle>
								<CardDescription>
									O sistema escolhe automaticamente o melhor método para seu dispositivo
								</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<Button size="lg" onClick={() => openCamera("auto")} className="w-full h-20 text-lg">
									<Camera className="size-6 mr-3" />
									Abrir Câmera (Modo Auto)
								</Button>
							</CardContent>
						</Card>
					</TabsContent>

					<TabsContent value="advanced" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Testes Avançados</CardTitle>
								<CardDescription>Teste cada método individualmente</CardDescription>
							</CardHeader>
							<CardContent className="grid gap-4 md:grid-cols-3">
								<Button variant="outline" size="lg" onClick={() => openCamera("auto")} className="h-32 flex-col gap-3">
									<Zap className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Modo Auto</div>
										<div className="text-xs text-muted-foreground">Detecção inteligente</div>
									</div>
								</Button>

								<Button
									variant="outline"
									size="lg"
									onClick={() => openCamera("native")}
									className="h-32 flex-col gap-3"
								>
									<Smartphone className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Câmera Nativa</div>
										<div className="text-xs text-muted-foreground">Input capture</div>
									</div>
								</Button>

								<Button variant="outline" size="lg" onClick={() => openCamera("web")} className="h-32 flex-col gap-3">
									<Code2 className="size-8" />
									<div className="text-center">
										<div className="font-semibold">Câmera Web</div>
										<div className="text-xs text-muted-foreground">getUserMedia API</div>
									</div>
								</Button>
							</CardContent>
						</Card>
					</TabsContent>
				</Tabs>

				{/* Resultado */}
				{capturedImage && imageInfo && (
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<CheckCircle2 className="size-5 text-green-500" />
								Foto Capturada com Sucesso!
							</CardTitle>
							<CardDescription>Informações sobre a imagem capturada</CardDescription>
						</CardHeader>
						<CardContent className="space-y-4">
							<div className="grid md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<h4 className="font-semibold">Preview:</h4>
									<div className="border rounded-lg overflow-hidden bg-black relative aspect-video">
										<Image src={capturedImage} alt="Captured" fill className="object-contain" unoptimized />
									</div>
								</div>

								<div className="space-y-4">
									<h4 className="font-semibold">Detalhes:</h4>
									<div className="space-y-2 text-sm">
										<div className="flex justify-between p-2 bg-muted rounded-sm">
											<span className="text-muted-foreground">Nome:</span>
											<span className="font-mono">{imageInfo.name}</span>
										</div>
										<div className="flex justify-between p-2 bg-muted rounded-sm">
											<span className="text-muted-foreground">Tamanho:</span>
											<span className="font-mono">{formatFileSize(imageInfo.size)}</span>
										</div>
										<div className="flex justify-between p-2 bg-muted rounded-sm">
											<span className="text-muted-foreground">Tipo:</span>
											<span className="font-mono">{imageInfo.type}</span>
										</div>
										{imageInfo.dimensions && (
											<div className="flex justify-between p-2 bg-muted rounded-sm">
												<span className="text-muted-foreground">Dimensões:</span>
												<span className="font-mono">{imageInfo.dimensions}</span>
											</div>
										)}
									</div>

									<Button
										variant="outline"
										onClick={() => {
											setCapturedImage(null)
											setImageInfo(null)
										}}
										className="w-full"
									>
										<XCircle className="size-4 mr-2" />
										Limpar Resultado
									</Button>
								</div>
							</div>
						</CardContent>
					</Card>
				)}

				{/* Informações técnicas */}
				<Card>
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Code2 className="size-5" />
							Informações Técnicas
						</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid gap-4 md:grid-cols-2">
							<div className="space-y-2">
								<h4 className="font-semibold text-sm">Capacidades do Navegador:</h4>
								<div className="space-y-1 text-sm">
									<div className="flex items-center gap-2">
										{navigator.mediaDevices ? (
											<CheckCircle2 className="size-4 text-green-500" />
										) : (
											<XCircle className="size-4 text-red-500" />
										)}
										<span>getUserMedia API</span>
									</div>
									<div className="flex items-center gap-2">
										{window.matchMedia("(display-mode: standalone)").matches ? (
											<CheckCircle2 className="size-4 text-green-500" />
										) : (
											<XCircle className="size-4 text-gray-400" />
										)}
										<span>PWA Instalado</span>
									</div>
									<div className="flex items-center gap-2">
										{"ontouchstart" in window ? (
											<CheckCircle2 className="size-4 text-green-500" />
										) : (
											<XCircle className="size-4 text-gray-400" />
										)}
										<span>Touch Screen</span>
									</div>
								</div>
							</div>

							<div className="space-y-2">
								<h4 className="font-semibold text-sm">User Agent:</h4>
								<p className="text-xs font-mono bg-muted p-2 rounded-sm break-all">{navigator.userAgent}</p>
							</div>
						</div>

						<div className="bg-muted p-4 rounded-lg">
							<h4 className="font-semibold text-sm mb-2">Código de Exemplo:</h4>
							<pre className="text-xs overflow-x-auto">
								{`import { SmartCameraCapture } from "@/components/smart-camera-capture"

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false)

  const handleCapture = (file: File) => {
    console.log("Foto capturada:", file)
    // Processar arquivo...
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        Abrir Câmera
      </Button>
      
      <SmartCameraCapture
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onCapture={handleCapture}
        mode="auto" // ou "native" ou "web"
        quality={0.85} // 0.1 a 1.0
        maxWidth={1920}
        maxHeight={1080}
      />
    </>
  )
}`}
							</pre>
						</div>
					</CardContent>
				</Card>
			</div>

			{/* Componente de câmera */}
			<SmartCameraCapture
				isOpen={isOpen}
				onClose={() => setIsOpen(false)}
				onCapture={handleCapture}
				mode={mode}
				quality={0.85}
				maxWidth={1920}
				maxHeight={1080}
			/>
		</div>
	)
}
