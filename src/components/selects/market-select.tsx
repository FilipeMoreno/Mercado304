"use client"

import { Combobox } from "@/components/ui/combobox"
import { toast } from "sonner"
import { Market } from "@/types"

interface MarketSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  className?: string
  disabled?: boolean
  markets?: Market[]
  loading?: boolean
  onMarketCreated?: (market: Market) => void
}

export function MarketSelect({
  value,
  onValueChange,
  placeholder = "Selecione o mercado",
  className = "w-full",
  disabled = false,
  markets = [],
  loading = false,
  onMarketCreated
}: MarketSelectProps) {

  const handleCreateMarket = async (name: string) => {
    try {
      const response = await fetch('/api/markets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() })
      })

      if (response.ok) {
        const newMarket = await response.json()
        onValueChange?.(newMarket.id)
        onMarketCreated?.(newMarket)
        toast.success('Mercado criado com sucesso!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar mercado')
      }
    } catch (error) {
      console.error('Erro ao criar mercado:', error)
      toast.error('Erro ao criar mercado')
    }
  }

  if (loading) {
    return (
      <div className={`h-10 bg-gray-200 dark:bg-gray-700 rounded animate-pulse ${className}`} />
    )
  }

  return (
    <Combobox
      options={markets.map(market => ({
        value: market.id,
        label: `${market.name}${market.location ? ` - ${market.location}` : ''}`
      }))}
      value={value}
      onValueChange={onValueChange}
      placeholder={placeholder}
      searchPlaceholder="Buscar mercado..."
      emptyText="Nenhum mercado encontrado."
      onCreateNew={handleCreateMarket}
      createNewText="Criar mercado"
      className={className}
      disabled={disabled}
    />
  )
}