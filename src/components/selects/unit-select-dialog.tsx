"use client"

import { useMemo, useState } from "react"
import type { SelectOption } from "@/components/ui/responsive-select-dialog"
import { ResponsiveSelectDialog } from "@/components/ui/responsive-select-dialog"

interface UnitSelectDialogProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

const UNITS = [
  { value: "unidade", label: "Unidade", icon: "📦" },
  { value: "kg", label: "Quilograma (kg)", icon: "⚖️" },
  { value: "g", label: "Grama (g)", icon: "⚖️" },
  { value: "litro", label: "Litro", icon: "🥤" },
  { value: "ml", label: "Mililitro (ml)", icon: "🥤" },
  { value: "pacote", label: "Pacote", icon: "📦" },
  { value: "caixa", label: "Caixa", icon: "📦" },
  { value: "garrafa", label: "Garrafa", icon: "🍾" },
  { value: "lata", label: "Lata", icon: "🥫" },
  { value: "saco", label: "Saco", icon: "🛍️" },
]

export function UnitSelectDialog({
  value,
  onValueChange,
  placeholder = "Selecione uma unidade",
  disabled = false,
}: UnitSelectDialogProps) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")

  // Filter units based on search
  const filteredOptions: SelectOption[] = useMemo(() => {
    const searchLower = search.toLowerCase()
    return UNITS.filter(
      (unit) =>
        unit.label.toLowerCase().includes(searchLower) || unit.value.toLowerCase().includes(searchLower),
    ).map((unit) => ({
      id: unit.value,
      label: unit.label,
      icon: unit.icon,
    }))
  }, [search])

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue)
    setSearch("")
  }

  return (
    <ResponsiveSelectDialog
      open={open}
      onOpenChange={setOpen}
      value={value}
      onValueChange={handleValueChange}
      options={filteredOptions}
      title="Selecionar Unidade de Medida"
      placeholder={placeholder}
      searchPlaceholder="Buscar unidade..."
      emptyText="Nenhuma unidade encontrada."
      onSearchChange={setSearch}
      showCreateNew={false}
    />
  )
}

