"use client"

import { useState, ReactNode } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Filter, Search, X } from "lucide-react"

interface FilterOption {
  value: string
  label: string
}

interface FilterPopoverProps {
  sortValue?: string
  onSortChange?: (value: string) => void
  sortOptions?: FilterOption[]
  additionalFilters?: ReactNode
  onClearFilters?: () => void
  hasActiveFilters?: boolean
}

export function FilterPopover({
  sortValue,
  onSortChange,
  sortOptions,
  additionalFilters,
  onClearFilters,
  hasActiveFilters = false
}: FilterPopoverProps) {
  const [open, setOpen] = useState(false)

  const handleClearFilters = () => {
    onSortChange?.("")
    onClearFilters?.()
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className={`${hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}`}
        >
          <Filter className="h-4 w-4" />
          {hasActiveFilters && <div className="w-2 h-2 bg-blue-500 rounded-full ml-2" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Filtros</h4>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleClearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-3 w-3 mr-1" />
                Limpar
              </Button>
            )}
          </div>
          
          {sortOptions && sortOptions.length > 0 && (
            <div className="space-y-2">
              <Label>Ordenar por</Label>
              <Select value={sortValue} onValueChange={onSortChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecionar ordenação" />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {additionalFilters}
        </div>
      </PopoverContent>
    </Popover>
  )
}