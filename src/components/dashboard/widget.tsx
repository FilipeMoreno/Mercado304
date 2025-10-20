"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { GripVertical } from "lucide-react"
import type React from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface WidgetProps {
	id: string
	children: React.ReactNode
}

export function Widget({ id, children }: WidgetProps) {
	const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		zIndex: isDragging ? 10 : undefined,
	}

	return (
		<div ref={setNodeRef} style={style} {...attributes}>
			<Card className="relative">
				<Button variant="ghost" size="icon" className="absolute top-2 right-2 cursor-grab" {...listeners}>
					<GripVertical className="size-4" />
				</Button>
				{children}
			</Card>
		</div>
	)
}
