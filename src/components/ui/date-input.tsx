"use client"

import { Calendar } from "lucide-react"
import * as React from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { useIsMobile } from "@/hooks/use-mobile"

interface DateInputProps {
	id?: string
	label?: string
	value: string
	onChange: (value: string) => void
	placeholder?: string
	disabled?: boolean
	min?: string
	max?: string
	className?: string
}

export function DateInput({
	id,
	label,
	value,
	onChange,
	placeholder,
	disabled = false,
	min,
	max,
	className,
}: DateInputProps) {
	const [open, setOpen] = React.useState(false)
	const [tempValue, setTempValue] = React.useState(value)
	const isMobile = useIsMobile()

	// Atualizar tempValue quando value mudar
	React.useEffect(() => {
		setTempValue(value)
	}, [value])

	const handleApply = () => {
		onChange(tempValue)
		setOpen(false)
	}

	const handleCancel = () => {
		setTempValue(value)
		setOpen(false)
	}

	const formatDateForDisplay = (dateStr: string) => {
		if (!dateStr) return placeholder || "Selecionar data"
		try {
			const date = new Date(`${dateStr}T00:00:00`)
			return date.toLocaleDateString("pt-BR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
			})
		} catch {
			return dateStr
		}
	}

	// Mobile: usa ResponsiveDialog com seletor de data
	if (isMobile) {
		return (
			<div className={className}>
				{label && <Label htmlFor={id}>{label}</Label>}
				<Button
					type="button"
					variant="outline"
					onClick={() => setOpen(true)}
					disabled={disabled}
					className="w-full justify-between font-normal"
				>
					<span className={value ? "" : "text-muted-foreground"}>{formatDateForDisplay(value)}</span>
					<Calendar className="ml-2 size-4 shrink-0 opacity-50" />
				</Button>

				<ResponsiveDialog
					open={open}
					onOpenChange={(isOpen) => {
						if (!isOpen) handleCancel()
					}}
					title={label || "Selecionar Data"}
					maxWidth="sm"
					maxHeight={false}
				>
					<div className="space-y-4">
						<div className="space-y-2">
							<Label htmlFor={`${id}-dialog`}>Data</Label>
							<Input
								type="date"
								id={`${id}-dialog`}
								value={tempValue}
								onChange={(e) => setTempValue(e.target.value)}
								min={min}
								max={max}
								className="text-base"
							/>
						</div>
						<div className="flex gap-2 justify-end">
							<Button type="button" variant="outline" onClick={handleCancel}>
								Cancelar
							</Button>
							<Button type="button" onClick={handleApply}>
								Aplicar
							</Button>
						</div>
					</div>
				</ResponsiveDialog>
			</div>
		)
	}

	// Desktop: mantém input normal
	return (
		<div className={className}>
			{label && <Label htmlFor={id}>{label}</Label>}
			<Input
				type="date"
				id={id}
				value={value}
				onChange={(e) => onChange(e.target.value)}
				disabled={disabled}
				min={min}
				max={max}
			/>
		</div>
	)
}
