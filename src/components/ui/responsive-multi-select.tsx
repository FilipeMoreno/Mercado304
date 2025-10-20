"use client"

import { Check, Search, X, XCircle } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"

interface MultiSelectOption {
  value: string
  label: string
  icon?: string
}

interface ResponsiveMultiSelectProps {
  options: MultiSelectOption[]
  selected: string[]
  onSelectedChange: (selected: string[]) => void
  placeholder?: string
  title?: string
  searchPlaceholder?: string
  emptyText?: string
  className?: string
  isLoading?: boolean
}

export function ResponsiveMultiSelect({
  options,
  selected,
  onSelectedChange,
  placeholder = "Selecione...",
  title = "Selecionar Itens",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum item encontrado.",
  className,
  isLoading = false,
}: ResponsiveMultiSelectProps) {
  const [open, setOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const inputRef = useRef<HTMLInputElement>(null)

  // Focus no input quando o dialog abrir
  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 100)
    } else {
      setSearchTerm("")
    }
  }, [open])

  const handleSelect = (value: string) => {
    onSelectedChange(selected.includes(value) ? selected.filter((v) => v !== value) : [...selected, value])
  }

  const handleUnselect = (e: React.MouseEvent, value: string) => {
    e.stopPropagation()
    onSelectedChange(selected.filter((v) => v !== value))
  }

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation()
    onSelectedChange([])
  }

  const selectedLabels = options.filter((option) => selected.includes(option.value))

  // Filter options based on search
  const filteredOptions = options.filter((option) =>
    option.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  return (
    <>
      {/* Trigger Button */}
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen(true)}
        className={cn("w-full justify-between h-auto min-h-[36px]", className)}
      >
        {selected.length > 0 ? (
          <div className="flex flex-wrap items-center gap-1">
            {selectedLabels.map((option) => (
              <Badge key={option.value} variant="secondary" className="whitespace-nowrap">
                {option.icon && <span className="mr-1">{option.icon}</span>}
                {option.label}
                <button
                  type="button"
                  className="ml-1 rounded-full outline-hidden ring-offset-background focus:ring-2 focus:ring-ring-3 focus:ring-offset-2"
                  onClick={(e) => handleUnselect(e, option.value)}
                  aria-label={`Remover ${option.label}`}
                >
                  <X className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </Badge>
            ))}
          </div>
        ) : (
          <span className="text-muted-foreground">{placeholder}</span>
        )}
        <div className="flex items-center gap-1 ml-auto pl-2">
          {selected.length > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-6 text-muted-foreground hover:text-foreground"
              onClick={handleClear}
              aria-label="Limpar seleção"
            >
              <XCircle className="size-4" />
            </Button>
          )}
          <Search className="size-4 shrink-0 opacity-50" />
        </div>
      </Button>

      {/* Dialog */}
      <ResponsiveDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        maxWidth="md"
        maxHeight={true}
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
            />
            {searchTerm && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
              >
                <X className="size-4" />
              </Button>
            )}
          </div>

          {/* Selected Count */}
          {selected.length > 0 && (
            <div className="flex items-center justify-between px-1">
              <span className="text-sm text-muted-foreground">
                {selected.length} selecionado{selected.length !== 1 ? "s" : ""}
              </span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onSelectedChange([])
                }}
                className="h-8 text-xs"
              >
                Limpar tudo
              </Button>
            </div>
          )}

          {/* Options List */}
          <ScrollArea className="h-[400px]">
            <div className="space-y-1">
              {isLoading ? (
                <div className="space-y-2 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="size-5 rounded-full shrink-0" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <Skeleton className="size-4 shrink-0" />
                    </div>
                  ))}
                </div>
              ) : filteredOptions.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground">{emptyText}</p>
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => handleSelect(option.value)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                      "hover:bg-accent focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring-3",
                      selected.includes(option.value) && "bg-accent",
                    )}
                  >
                    {option.icon && <span className="text-xl shrink-0">{option.icon}</span>}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{option.label}</div>
                    </div>
                    <Check
                      className={cn(
                        "h-4 w-4 shrink-0 transition-opacity",
                        selected.includes(option.value) ? "opacity-100" : "opacity-0",
                      )}
                    />
                  </button>
                ))
              )}
            </div>
          </ScrollArea>

          {/* Actions */}
          <div className="flex gap-2 pt-2 border-t">
            <Button type="button" onClick={() => setOpen(false)} className="flex-1">
              Confirmar ({selected.length})
            </Button>
          </div>
        </div>
      </ResponsiveDialog>
    </>
  )
}

