"use client"

import { X, ZoomIn, ZoomOut, RotateCw, Download } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent } from "@/components/ui/dialog"

interface ImageViewerModalProps {
	isOpen: boolean
	onClose: () => void
	imageUrl: string
	alt?: string
}

export function ImageViewerModal({ isOpen, onClose, imageUrl, alt = "Imagem" }: ImageViewerModalProps) {
	const [zoom, setZoom] = useState(1)
	const [rotation, setRotation] = useState(0)

	const handleZoomIn = () => {
		setZoom(prev => Math.min(prev + 0.25, 3))
	}

	const handleZoomOut = () => {
		setZoom(prev => Math.max(prev - 0.25, 0.25))
	}

	const handleRotate = () => {
		setRotation(prev => (prev + 90) % 360)
	}

	const handleDownload = () => {
		const link = document.createElement('a')
		link.href = imageUrl
		link.download = `imagem-${Date.now()}.jpg`
		document.body.appendChild(link)
		link.click()
		document.body.removeChild(link)
	}

	const resetTransforms = () => {
		setZoom(1)
		setRotation(0)
	}

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden">
				{/* Header com controles */}
				<div className="flex items-center justify-between p-4 border-b bg-background">
					<div className="flex items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							onClick={handleZoomOut}
							disabled={zoom <= 0.25}
						>
							<ZoomOut className="size-4" />
						</Button>
						<span className="text-sm font-medium min-w-[60px] text-center">
							{Math.round(zoom * 100)}%
						</span>
						<Button
							variant="outline"
							size="sm"
							onClick={handleZoomIn}
							disabled={zoom >= 3}
						>
							<ZoomIn className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleRotate}
						>
							<RotateCw className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={handleDownload}
						>
							<Download className="size-4" />
						</Button>
						<Button
							variant="outline"
							size="sm"
							onClick={resetTransforms}
						>
							Reset
						</Button>
					</div>
					<Button
						variant="ghost"
						size="sm"
						onClick={onClose}
					>
						<X className="size-4" />
					</Button>
				</div>

				{/* Container da imagem */}
				<div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-4">
					<div className="flex items-center justify-center min-h-[400px]">
						<img
							src={imageUrl}
							alt={alt}
							className="max-w-full max-h-full object-contain transition-transform duration-200"
							style={{
								transform: `scale(${zoom}) rotate(${rotation}deg)`,
								transformOrigin: 'center'
							}}
							onClick={(e) => {
								// Zoom in/out ao clicar na imagem
								if (e.detail === 2) { // Double click
									setZoom(zoom === 1 ? 2 : 1)
								}
							}}
						/>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	)
}