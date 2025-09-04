import { useMemo } from "react"

interface PaginationOptions<T> {
  data: T[]
  itemsPerPage: number
  currentPage: number
  searchTerm?: string
  filters?: Record<string, any>
  sortBy?: string
}

interface PaginationResult<T> {
  paginatedData: T[]
  totalPages: number
  filteredData: T[]
  startIndex: number
  endIndex: number
}

export function usePagination<T = any>({
  data,
  itemsPerPage,
  currentPage,
  searchTerm = "",
  filters = {},
  sortBy = ""
}: PaginationOptions<T>): PaginationResult<T> {
  return useMemo(() => {
    let filtered = [...data] as T[]
    
    // Aplicar busca se fornecida
    if (searchTerm) {
      filtered = filtered.filter((item: any) => 
        item.name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }
    
    // Aplicar filtros adicionais
    Object.entries(filters).forEach(([key, value]) => {
      if (value && value !== "all" && value !== "") {
        filtered = filtered.filter((item: any) => {
          if (key.endsWith('Id')) {
            return item[key] === value
          }
          return item[key] === value
        })
      }
    })
    
    // Aplicar ordenação se fornecida
    if (sortBy) {
      filtered.sort((a: any, b: any) => {
        switch (sortBy) {
          case "name-asc":
            return a.name?.localeCompare(b.name) || 0
          case "name-desc":
            return b.name?.localeCompare(a.name) || 0
          case "date-desc":
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          case "date-asc":
            return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          case "category":
            return (a.category?.name || "").localeCompare(b.category?.name || "")
          case "location-asc":
            return a.location?.localeCompare(b.location) || 0
          case "products":
            return (b._count?.products || 0) - (a._count?.products || 0)
          case "value-desc":
            return (b.total || 0) - (a.total || 0)
          case "value-asc":
            return (a.total || 0) - (b.total || 0)
          default:
            return 0
        }
      })
    }
    
    const startIndex = (currentPage - 1) * itemsPerPage
    const endIndex = startIndex + itemsPerPage
    const paginatedData = filtered.slice(startIndex, endIndex)
    const totalPages = Math.ceil(filtered.length / itemsPerPage)
    
    return {
      paginatedData,
      totalPages,
      filteredData: filtered,
      startIndex,
      endIndex
    }
  }, [data, itemsPerPage, currentPage, searchTerm, filters, sortBy])
}