"use client"

import { Barcode, ChevronDown, Star } from "lucide-react"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { cn } from "@/lib/utils"

interface BarcodeData {
	id: string
	barcode: string
	isPrimary: boolean
}

interface BarcodeListDisplayProps {
	barcodes: BarcodeData[]
	variant?: "compact" | "full" | "inline"
	showCount?: boolean
}

export function BarcodeListDisplay({ barcodes, variant = "compact", showCount = true }: BarcodeListDisplayProps) {
	const [isOpen, setIsOpen] = useState(false)

	if (!barcodes || barcodes.length === 0) {
		return <span className="text-muted-foreground">N/A</span>
	}

	const primaryBarcode = barcodes.find((b) => b.isPrimary) || barcodes[0]
	const hasMultiple = barcodes.length > 1

	// Variant: Inline (para cards e tabelas - com hover)
	if (variant === "inline") {
		if (!hasMultiple) {
			return <span className="font-mono text-sm">{primaryBarcode.barcode}</span>
		}

		return (
			<HoverCard openDelay={200}>
				<HoverCardTrigger asChild>
					<button
						type="button"
						className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
					>
						<span className="font-mono text-sm">{primaryBarcode.barcode}</span>
						<Badge variant="secondary" className="h-5 text-xs">
							+{barcodes.length - 1}
						</Badge>
					</button>
				</HoverCardTrigger>
				<HoverCardContent className="w-80" align="start">
					<div className="space-y-2">
						<div className="flex items-center gap-2 mb-3">
							<Barcode className="h-4 w-4 text-muted-foreground" />
							<h4 className="text-sm font-semibold">Códigos de Barras ({barcodes.length})</h4>
						</div>
						<div className="space-y-2">
							{barcodes.map((barcode) => (
								<div
									key={barcode.id}
									className={cn(
										"flex items-center gap-2 p-2 rounded-md text-sm",
										barcode.isPrimary ? "bg-primary/10" : "bg-muted/50"
									)}
								>
									{barcode.isPrimary && (
										<Star className="h-3 w-3 fill-yellow-500 text-yellow-500 shrink-0" />
									)}
									<span className="font-mono flex-1">{barcode.barcode}</span>
									{barcode.isPrimary && (
										<Badge variant="outline" className="text-xs h-5">
											Principal
										</Badge>
									)}
								</div>
							))}
						</div>
					</div>
				</HoverCardContent>
			</HoverCard>
		)
	}

	// Variant: Compact (para mobile - com collapsible)
	if (variant === "compact") {
		if (!hasMultiple) {
			return (
				<div className="flex items-center gap-2">
					<span className="font-mono text-sm">{primaryBarcode.barcode}</span>
				</div>
			)
		}

		return (
			<Collapsible open={isOpen} onOpenChange={setIsOpen}>
				<div className="space-y-2">
					<div className="flex items-center gap-2">
						<span className="font-mono text-sm">{primaryBarcode.barcode}</span>
						<CollapsibleTrigger asChild>
							<Button variant="ghost" size="sm" className="h-6 px-2">
								<span className="text-xs">+{barcodes.length - 1}</span>
								<ChevronDown className={cn("h-3 w-3 ml-1 transition-transform", isOpen && "rotate-180")} />
							</Button>
						</CollapsibleTrigger>
					</div>
					<CollapsibleContent className="space-y-1.5">
						{barcodes.slice(1).map((barcode) => (
							<div
								key={barcode.id}
								className="flex items-center gap-2 p-2 rounded-md bg-muted/50 text-sm ml-4"
							>
								<span className="font-mono flex-1">{barcode.barcode}</span>
								{barcode.isPrimary && (
									<Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
								)}
							</div>
						))}
					</CollapsibleContent>
				</div>
			</Collapsible>
		)
	}

	// Variant: Full (para página de detalhes)
	return (
		<div className="space-y-2">
			{showCount && barcodes.length > 1 && (
				<div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
					<Barcode className="h-3.5 w-3.5" />
					<span>{barcodes.length} códigos cadastrados</span>
				</div>
			)}
			<div className="space-y-2">
				{barcodes.map((barcode) => (
					<div
						key={barcode.id}
						className={cn(
							"flex items-center gap-2 p-2.5 rounded-lg border text-sm",
							barcode.isPrimary ? "bg-primary/5 border-primary/20" : "bg-muted/30"
						)}
					>
						{barcode.isPrimary && (
							<Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500 shrink-0" />
						)}
						<span className="font-mono flex-1">{barcode.barcode}</span>
						{barcode.isPrimary && (
							<Badge variant="outline" className="text-xs">
								Principal
							</Badge>
						)}
					</div>
				))}
			</div>
		</div>
	)
}
