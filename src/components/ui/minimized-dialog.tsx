"use client"

import { Maximize2, X } from "lucide-react"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface MinimizedDialogProps {
	isMinimized: boolean
	onMinimize: () => void
	onMaximize: () => void
	onClose: () => void
	title: string
	children: React.ReactNode
	isLoading?: boolean
	className?: string
}

export function MinimizedDialog({
	isMinimized,
	onMaximize,
	onClose,
	title,
	children,
	isLoading = false,
	className = "",
}: MinimizedDialogProps) {
	// Forçar re-renderização quando isLoading muda
	const [forceUpdate, setForceUpdate] = useState(0)
	
	useEffect(() => {
		setForceUpdate(prev => prev + 1)
	}, [])

	if (!isMinimized) {
		return <>{children}</>
	}

	return (
		<div 
			key={forceUpdate} 
			className={`fixed bottom-4 right-4 z-50 max-w-[calc(100vw-2rem)] ${className}`}
			style={{
				position: 'fixed',
				bottom: '1rem',
				right: '1rem',
				zIndex: 50,
			}}
		>
			<Card className="w-80 max-w-[calc(100vw-2rem)] shadow-lg border-2 bg-background/95 backdrop-blur-sm">
				<div className="flex items-center justify-between p-3 border-b">
					<div className="flex items-center gap-2">
						{isLoading && <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />}
						<h3 className="font-semibold text-sm truncate">{title}</h3>
					</div>
					<div className="flex items-center gap-1">
						<Button variant="ghost" size="icon" className="h-6 w-6" onClick={onMaximize} title="Expandir">
							<Maximize2 className="h-3 w-3" />
						</Button>
						<Button variant="ghost" size="icon" className="h-6 w-6" onClick={onClose} title="Fechar">
							<X className="h-3 w-3" />
						</Button>
					</div>
				</div>
				<div className="p-3">
					<div className="flex items-center gap-2 text-sm text-muted-foreground">
						{isLoading ? (
							<>
								<div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
								<span>Processando...</span>
							</>
						) : (
							<>
								<div className="w-2 h-2 bg-green-500 rounded-full" />
								<span>Concluído</span>
							</>
						)}
					</div>
				</div>
			</Card>
		</div>
	)
}
