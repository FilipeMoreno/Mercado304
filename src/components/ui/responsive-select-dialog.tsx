"use client"

import { Check, Loader2, Plus, Search, X } from "lucide-react"
import { useCallback, useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export interface SelectOption {
  id: string
  label: string
  sublabel?: string
  icon?: string
}

interface ResponsiveSelectDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  value?: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  title: string
  placeholder?: string
  searchPlaceholder?: string
  emptyText?: string
  isLoading?: boolean
  hasNextPage?: boolean
  isFetchingNextPage?: boolean
  onFetchNextPage?: () => void
  onSearchChange?: (search: string) => void
  // Criação de novo item
  onCreateNew?: (name: string) => void
  createNewText?: string
  showCreateNew?: boolean
  // Controle do trigger
  renderTrigger?: boolean
}

export function ResponsiveSelectDialog({
  open,
  onOpenChange,
  value,
  onValueChange,
  options,
  title,
  placeholder = "Selecione uma opção",
  searchPlaceholder = "Buscar...",
  emptyText = "Nenhum resultado encontrado.",
  isLoading = false,
  hasNextPage = false,
  isFetchingNextPage = false,
  onFetchNextPage,
  onSearchChange,
  onCreateNew,
  createNewText = "Criar novo",
  showCreateNew = true,
  renderTrigger = true,
}: ResponsiveSelectDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const scrollRef = useRef<HTMLDivElement>(null)
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

  // Notificar mudanças na busca
  useEffect(() => {
    onSearchChange?.(searchTerm)
  }, [searchTerm, onSearchChange])

  // Verificar se existe correspondência exata
  const hasExactMatch = useCallback(() => {
    if (!searchTerm) return false
    const normalizedSearchTerm = searchTerm.toLowerCase().trim()
    return options.some((option) => option.label.toLowerCase().trim() === normalizedSearchTerm)
  }, [options, searchTerm])

  // Verificar se deve mostrar a opção de criar novo
  const shouldShowCreateNew = onCreateNew && showCreateNew && searchTerm && !hasExactMatch()

  // Handle scroll infinito
  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const target = e.currentTarget
      const { scrollTop, scrollHeight, clientHeight } = target

      const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
      if (scrollPercentage > 0.85 && hasNextPage && !isFetchingNextPage) {
        onFetchNextPage?.()
      }
    },
    [hasNextPage, isFetchingNextPage, onFetchNextPage],
  )

  const handleSelect = (optionId: string) => {
    onValueChange(optionId)
    onOpenChange(false)
  }

  const handleCreateNew = () => {
    if (searchTerm && onCreateNew) {
      onCreateNew(searchTerm.trim())
      onOpenChange(false)
    }
  }

  const selectedOption = options.find((opt) => opt.id === value)

  return (
    <>
      {/* Trigger Button */}
      {renderTrigger && (
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(true)}
          className="w-full justify-between font-normal"
        >
          <span className="truncate flex-1 text-left">
            {selectedOption ? (
              <span className="flex items-center gap-2">
                {selectedOption.icon && <span>{selectedOption.icon}</span>}
                <span className="truncate">{selectedOption.label}</span>
              </span>
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </span>
          <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      )}

      {/* Dialog */}
      <ResponsiveDialog
        open={open}
        onOpenChange={onOpenChange}
        title={title}
        maxWidth="md"
        maxHeight={true}
      >
        <div className="space-y-4">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
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
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Options List */}
          <ScrollArea className="h-[400px]" onScrollCapture={handleScroll}>
            <div className="space-y-1">
              {isLoading && options.length === 0 ? (
                <div className="py-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-3 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Carregando...</p>
                </div>
              ) : options.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="text-sm text-muted-foreground mb-4">{emptyText}</p>
                  {shouldShowCreateNew && (
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={handleCreateNew}
                      className="gap-2"
                    >
                      <Plus className="h-4 w-4" />
                      {createNewText} "{searchTerm}"
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  {options.map((option) => (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => handleSelect(option.id)}
                      className={cn(
                        "w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-left transition-colors",
                        "hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        value === option.id && "bg-accent",
                      )}
                    >
                      {option.icon && <span className="text-xl shrink-0">{option.icon}</span>}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{option.label}</div>
                        {option.sublabel && (
                          <div className="text-xs text-muted-foreground truncate">{option.sublabel}</div>
                        )}
                      </div>
                      <Check
                        className={cn(
                          "h-4 w-4 shrink-0 transition-opacity",
                          value === option.id ? "opacity-100" : "opacity-0",
                        )}
                      />
                    </button>
                  ))}

                  {isFetchingNextPage && (
                    <div className="py-4 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </div>
                  )}

                  {shouldShowCreateNew && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNew}
                        className="w-full gap-2 text-blue-600 hover:text-blue-700 border-blue-200 hover:bg-blue-50"
                      >
                        <Plus className="h-4 w-4" />
                        {createNewText} "{searchTerm}"
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </div>
      </ResponsiveDialog>
    </>
  )
}

