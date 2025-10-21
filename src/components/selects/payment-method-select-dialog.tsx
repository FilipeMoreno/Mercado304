"use client"

import { useMemo, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"
import { PaymentMethod } from "@/types"

interface PaymentMethodSelectDialogProps {
	value?: PaymentMethod
	onValueChange?: (value: PaymentMethod) => void
	placeholder?: string
	disabled?: boolean
}

const PAYMENT_METHODS = [
	{ value: PaymentMethod.MONEY, label: "Dinheiro", icon: "💵" },
	{ value: PaymentMethod.DEBIT, label: "Cartão de Débito", icon: "💳" },
	{ value: PaymentMethod.CREDIT, label: "Cartão de Crédito", icon: "💳" },
	{ value: PaymentMethod.PIX, label: "PIX", icon: "📱" },
	{ value: PaymentMethod.VOUCHER, label: "Vale Alimentação/Refeição", icon: "🎫" },
	{ value: PaymentMethod.CHECK, label: "Cheque", icon: "📄" },
	{ value: PaymentMethod.OTHER, label: "Outros", icon: "🔄" },
]

export function PaymentMethodSelectDialog({
	value,
	onValueChange,
	placeholder = "Selecione o método de pagamento",
	disabled = false,
}: PaymentMethodSelectDialogProps) {
	const [open, setOpen] = useState(false)
	const [search, setSearch] = useState("")

	// Filter payment methods based on search
	const filteredOptions: SelectOption[] = useMemo(() => {
		const searchLower = search.toLowerCase()
		return PAYMENT_METHODS.filter((method) => method.label.toLowerCase().includes(searchLower)).map((method) => ({
			id: method.value,
			label: method.label,
			icon: method.icon,
		}))
	}, [search])

	const handleValueChange = (newValue: string) => {
		onValueChange?.(newValue as PaymentMethod)
		setSearch("")
		setOpen(false) // Fechar dialog após selecionar
	}

	return (
		<ResponsiveSelectDialog
			open={open}
			onOpenChange={setOpen}
			value={value}
			onValueChange={handleValueChange}
			options={filteredOptions}
			title="Selecionar Método de Pagamento"
			placeholder={placeholder}
			searchPlaceholder="Buscar método..."
			emptyText="Nenhum método encontrado."
			onSearchChange={setSearch}
			showCreateNew={false}
		/>
	)
}
