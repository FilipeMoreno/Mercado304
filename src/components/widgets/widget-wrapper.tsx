"use client"

import { GripVertical, Settings, X } from "lucide-react"
import { type ReactNode, forwardRef } from "react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import type { WidgetType } from "@/types/dashboard-widgets"
import { cn } from "@/lib/utils"

interface WidgetWrapperProps {
	widgetId: WidgetType
	children: ReactNode
	isEditing?: boolean
	onRemove?: (id: WidgetType) => void
	onConfigure?: (id: WidgetType) => void
	className?: string
	style?: React.CSSProperties
}

export const WidgetWrapper = forwardRef<HTMLDivElement, WidgetWrapperProps>(
	({ widgetId, children, isEditing = false, onRemove, onConfigure, className, style, ...props }, ref) => {
		return (
			<div
				ref={ref}
				className={cn(
					"relative overflow-hidden transition-all h-full",
					isEditing && "ring-2 ring-primary/50 shadow-lg rounded-lg",
					className,
				)}
				style={style}
				{...props}
			>
				{/* Barra de controle em modo de edição */}
				{isEditing && (
					<div className="absolute top-0 left-0 right-0 z-10 bg-primary/10 backdrop-blur-sm border-b flex items-center justify-between px-2 py-1 rounded-t-lg">
						<div className="flex items-center gap-1">
							<div className="cursor-move p-1 hover:bg-primary/20 rounded">
								<GripVertical className="h-4 w-4 text-muted-foreground" />
							</div>
							<span className="text-xs font-medium text-muted-foreground">{widgetId}</span>
						</div>

						<div className="flex items-center gap-1">
							{onConfigure && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6"
												onClick={() => onConfigure(widgetId)}
											>
												<Settings className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Configurar Widget</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}

							{onRemove && (
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger asChild>
											<Button
												variant="ghost"
												size="icon"
												className="h-6 w-6 hover:bg-destructive/20 hover:text-destructive"
												onClick={() => onRemove(widgetId)}
											>
												<X className="h-3 w-3" />
											</Button>
										</TooltipTrigger>
										<TooltipContent>
											<p>Remover Widget</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							)}
						</div>
					</div>
				)}

				{/* Conteúdo do widget */}
				<div className={cn("h-full", isEditing && "pt-8")}>{children}</div>

				{/* Indicador de redimensionamento */}
				{isEditing && (
					<div className="absolute bottom-1 right-1 opacity-50">
						<div className="w-3 h-3 border-r-2 border-b-2 border-muted-foreground" />
					</div>
				)}
			</div>
		)
	},
)

WidgetWrapper.displayName = "WidgetWrapper"
