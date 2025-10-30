"use client"

import { Check, Plus, Search, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ResponsiveDialog } from "@/components/ui/responsive-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
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
  const normalizedSearchTerm = searchTerm.toLowerCase().trim()
  const hasExactMatch = !!searchTerm && options.some((option) => option.label.toLowerCase().trim() === normalizedSearchTerm)

  // Verificar se deve mostrar a opção de criar novo
  const shouldShowCreateNew = Boolean(onCreateNew && showCreateNew && searchTerm && !hasExactMatch)

  // Handle scroll infinito
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget
    const { scrollTop, scrollHeight, clientHeight } = target

    const scrollPercentage = (scrollTop + clientHeight) / scrollHeight
    if (scrollPercentage > 0.85 && hasNextPage && !isFetchingNextPage) {
      onFetchNextPage?.()
    }
  }

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
          <div className="relative" onTouchStart={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              ref={inputRef}
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-9"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck="false"
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
                <div className="space-y-2 p-2">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={`skeleton-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                      <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-3 w-3/4" />
                      </div>
                      <Skeleton className="h-4 w-4 shrink-0" />
                    </div>
                  ))}
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
                    <div className="space-y-2 p-2 border-t pt-2">
                      {Array.from({ length: 3 }).map((_, i) => (
                        <div key={`loading-${i}`} className="flex items-center gap-3 px-3 py-2.5">
                          <Skeleton className="h-5 w-5 rounded-full shrink-0" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-3 w-2/3" />
                          </div>
                          <Skeleton className="h-4 w-4 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}

                  {shouldShowCreateNew && (
                    <div className="pt-2 border-t">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={handleCreateNew}
                        className="w-full gap-2 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 border-blue-200 dark:border-blue-800 hover:bg-blue-50 dark:hover:bg-blue-950"
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

