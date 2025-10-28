"use client"

import { Loader2, Maximize2, X } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { useMinimizedDialog, useMinimizedDialogManager } from "@/lib/minimized-dialog-manager"
import { cn } from "@/lib/utils"

interface MinimizedDialogProps {
	isMinimized: boolean
	onMinimize: () => void
	onMaximize: () => void
	onClose: () => void
	title: string
	children: React.ReactNode
	isLoading?: boolean
	className?: string
	processingMessage?: string
}

export function MinimizedDialog({
	isMinimized,
	onMaximize,
	onClose,
	title,
	children,
	isLoading = false,
	className = "",
	processingMessage = "Processando...",
}: MinimizedDialogProps) {
	// Gerar ID único para este dialog
	const dialogId = useId()
	const [forceUpdate, setForceUpdate] = useState(0)

	// Registrar no gerenciador
	const { dialogs } = useMinimizedDialogManager()
	useMinimizedDialog(dialogId, title, isLoading, onMaximize, onClose, processingMessage)

	// Encontrar posição deste dialog na pilha
	const dialogIndex = dialogs.findIndex((d) => d.id === dialogId)
	const isInStack = dialogIndex !== -1

	useEffect(() => {
		setForceUpdate(prev => prev + 1)
	}, [isLoading])

	if (!isMinimized) {
		return <>{children}</>
	}

	// Calcular offset para empilhamento
	// Cada dialog é empilhado verticalmente
	const stackOffset = isInStack ? dialogIndex * 80 : 0 // 80px de altura + espaçamento

	return (
		<>
			{/* Overlay transparente para garantir que está no topo */}
			<div className="fixed inset-0 z-40 pointer-events-none" aria-hidden="true" />

			{/* Dialog minimizado com posicionamento responsivo */}
			<div
				key={forceUpdate}
				className={cn(
					// Posicionamento responsivo
					"fixed z-50 transition-all duration-300 ease-in-out",
					// Mobile: canto inferior esquerdo para não cobrir botão do Zé
					"left-4",
					// Tablet/Desktop: canto inferior direito, mas com espaço para o botão do Zé
					"sm:left-auto sm:right-4",
					// Largura responsiva
					"w-[calc(100vw-2rem)] max-w-sm",
					"sm:w-80",
					className
				)}
				style={{
					// Garantir que está acima de tudo, incluindo o botão do Zé (z-index: 40)
					zIndex: 50 + dialogIndex,
					// Empilhar verticalmente de baixo para cima
					bottom: `calc(1rem + ${stackOffset}px)`,
					// No desktop, ajustar para não cobrir o botão do Zé
					...(window.innerWidth >= 640 && {
						bottom: `calc(5rem + ${stackOffset}px)`,
					}),
				}}
			>
				<Card className="shadow-xl border-2 bg-background/98 backdrop-blur-md animate-in slide-in-from-bottom-2 duration-300">
					{/* Header com controles */}
					<div className="flex items-center justify-between gap-2 p-3 border-b bg-muted/30">
						<div className="flex items-center gap-2 min-w-0 flex-1">
							{isLoading && (
								<Loader2 className="h-4 w-4 text-primary animate-spin shrink-0" />
							)}
							<h3 className="font-semibold text-sm truncate">{title}</h3>
						</div>
						<div className="flex items-center gap-1 shrink-0">
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 hover:bg-muted"
								onClick={onMaximize}
								title="Expandir"
							>
								<Maximize2 className="h-3.5 w-3.5" />
							</Button>
							<Button
								variant="ghost"
								size="icon"
								className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
								onClick={onClose}
								title="Fechar"
							>
								<X className="h-3.5 w-3.5" />
							</Button>
						</div>
					</div>

					{/* Conteúdo com status */}
					<div className="p-4">
						<div className="flex items-center gap-3">
							{isLoading ? (
								<>
									{/* Indicador de processamento animado */}
									<div className="relative flex items-center justify-center">
										<div className="w-8 h-8 rounded-full border-2 border-primary/20 animate-pulse" />
										<div className="absolute w-2 h-2 bg-primary rounded-full animate-ping" />
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-foreground">{processingMessage}</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											Aguarde enquanto processamos...
										</p>
									</div>
								</>
							) : (
								<>
									{/* Indicador de conclusão */}
									<div className="relative flex items-center justify-center">
										<div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center">
											<div className="w-2 h-2 bg-green-500 rounded-full" />
										</div>
									</div>
									<div className="flex-1 min-w-0">
										<p className="text-sm font-medium text-foreground">Concluído</p>
										<p className="text-xs text-muted-foreground mt-0.5">
											Processamento finalizado
										</p>
									</div>
								</>
							)}
						</div>
					</div>
				</Card>
			</div>
		</>
	)
}
