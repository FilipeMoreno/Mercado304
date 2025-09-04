// src/app/estoque/estoque-client.tsx
"use client"

import * as React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  TrendingDown,
  Calendar,
  MapPin,
  DollarSign,
  Filter
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProductSelect } from "@/components/selects/product-select"
import { TempStorage } from "@/lib/temp-storage"
import { toast } from "sonner"
import { FilterPopover } from "@/components/ui/filter-popover"

interface StockItem {
  id: string
  productId: string
  quantity: number
  expirationDate?: string
  batchNumber?: string
  location?: string
  unitCost?: number
  notes?: string
  addedDate: string
  isExpired: boolean
  isLowStock: boolean
  expirationStatus: 'ok' | 'expiring_soon' | 'expired'
  expirationWarning?: string
  stockStatus: 'ok' | 'low'
  stockWarning?: string
  totalValue?: number
  product: {
    id: string
    name: string
    unit: string
    hasStock: boolean
    minStock?: number
    maxStock?: number
    hasExpiration: boolean
    brand?: { name: string }
    category?: { name: string }
  }
}

interface EstoqueClientProps {
  initialStockItems: StockItem[]
  initialStats: any
  initialProducts: any[]
  searchParams: {
    location?: string
    search?: string
  }
}

export function EstoqueClient({ initialStockItems, initialStats, initialProducts, searchParams }: EstoqueClientProps) {
  const router = useRouter()
  const currentSearchParams = useSearchParams()
  const [stockItems, setStockItems] = useState(initialStockItems)
  const [stats, setStats] = useState(initialStats)
  const [products, setProducts] = useState(initialProducts)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    expirationDate: '',
    batchNumber: '',
    location: 'Despensa',
    unitCost: 0,
    notes: ''
  })
  
  const [searchTerm, setSearchTerm] = useState(searchParams.search || "")
  const [locationFilter, setLocationFilter] = useState(searchParams.location || "all")

  useEffect(() => {
    setStockItems(initialStockItems)
    setStats(initialStats)
    setProducts(initialProducts)
  }, [initialStockItems, initialStats, initialProducts])

  useEffect(() => {
    const params = new URLSearchParams(currentSearchParams)
    if (searchTerm) params.set('search', searchTerm)
    else params.delete('search')
    if (locationFilter !== 'all') params.set('location', locationFilter)
    else params.delete('location')
    router.replace(`?${params.toString()}`, { scroll: false })
  }, [searchTerm, locationFilter, router, currentSearchParams])
  
  useEffect(() => {
    const storageKey = currentSearchParams.get('storageKey')
    if (storageKey) {
      const preservedData = TempStorage.get(storageKey)
      if (preservedData) {
        try {
          if (preservedData.formData) {
            setFormData(preservedData.formData)
          }
          if (preservedData.newProductId) {
            setTimeout(() => {
              setFormData(prev => ({ ...prev, productId: preservedData.newProductId }))
              setShowAddDialog(true)
            }, 1000)
          }
          TempStorage.remove(storageKey)
          window.history.replaceState({}, '', '/estoque')
        } catch (error) {
          console.error('Erro ao restaurar dados:', error)
          TempStorage.remove(storageKey)
        }
      }
    }
  }, [currentSearchParams])

  const handleAddStock = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const response = await fetch('/api/stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (response.ok) {
        setShowAddDialog(false)
        setFormData({
          productId: '',
          quantity: 1,
          expirationDate: '',
          batchNumber: '',
          location: 'Despensa',
          unitCost: 0,
          notes: ''
        })
        router.refresh()
        toast.success('Item adicionado ao estoque!')
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao adicionar ao estoque')
      }
    } catch (error) {
      console.error('Erro ao adicionar ao estoque:', error)
      toast.error('Erro ao adicionar ao estoque')
    } finally {
      setSaving(false)
    }
  }

  const handleConsumeItem = async (itemId: string, consumedQuantity: number) => {
    try {
      const response = await fetch(`/api/stock/${itemId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ consumed: consumedQuantity })
      })
      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao registrar consumo')
      }
    } catch (error) {
      console.error('Erro ao registrar consumo:', error)
      toast.error('Erro ao registrar consumo')
    }
  }

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Tem certeza que deseja remover este item do estoque?')) return
    try {
      const response = await fetch(`/api/stock/${itemId}`, { method: 'DELETE' })
      if (response.ok) {
        router.refresh()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao remover do estoque')
      }
    } catch (error) {
      console.error('Erro ao remover do estoque:', error)
      toast.error('Erro ao remover do estoque')
    }
  }

  const getExpirationColor = (status: string) => {
    switch (status) {
      case 'expired': return 'bg-red-100 text-red-800 border-red-200'
      case 'expiring_soon': return 'bg-orange-100 text-orange-800 border-orange-200'
      default: return 'bg-green-100 text-green-800 border-green-200'
    }
  }
  
  const hasActiveFilters = searchTerm !== "" || locationFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("")
    setLocationFilter("all")
  }

  const additionalFilters = (
    <>
      <div className="space-y-2">
        <Label>Localização</Label>
        <Select value={locationFilter} onValueChange={setLocationFilter}>
          <SelectTrigger>
            <SelectValue placeholder="Todas as localizações" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas as localizações</SelectItem>
            {stats?.locations?.map((loc: string) => (
              <SelectItem key={loc} value={loc}>{loc}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Filtros Rápidos</Label>
        <div className="flex gap-2">
          <Button 
            variant={locationFilter === 'Geladeira' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setLocationFilter('Geladeira')}
          >
            Geladeira
          </Button>
          <Button 
            variant={locationFilter === 'Despensa' ? 'default' : 'outline'} 
            size="sm"
            onClick={() => setLocationFilter('Despensa')}
          >
            Despensa
          </Button>
        </div>
      </div>
    </>
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Controle de Estoque</h1>
          <p className="text-gray-600 mt-2">
            Gerencie seu estoque doméstico e validades
          </p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adicionar ao Estoque
        </Button>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Total de Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalItems || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Valor do Estoque</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">R$ {(stats?.totalValue || 0).toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Vencendo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {(stats?.expiringSoon || 0) + (stats?.expiringToday || 0)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm text-gray-600">Estoque Baixo</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.lowStockItems || 0}</div>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Buscar produtos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <FilterPopover
          additionalFilters={additionalFilters}
          hasActiveFilters={hasActiveFilters}
          onClearFilters={clearFilters}
        />
      </div>

      {stockItems.length === 0 ? (
        <Card className="w-full">
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">
              {hasActiveFilters ? 'Nenhum item encontrado' : 'Estoque vazio'}
            </h3>
            <p className="text-gray-600 mb-4">
              {hasActiveFilters ? 'Tente ajustar os filtros' : 'Adicione produtos ao seu estoque para começar o controle'}
            </p>
            {hasActiveFilters && (
              <Button variant="outline" onClick={clearFilters}>
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {stockItems.map((item) => (
            <Card key={item.id} className="relative">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <CardTitle className="text-base">{item.product.name}</CardTitle>
                    {item.product.brand && (
                      <CardDescription>{item.product.brand.name}</CardDescription>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button variant="outline" size="sm" onClick={() => { setEditingItem(item); setShowEditDialog(true); }}>
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Quantidade:</span>
                  <div className="flex items-center gap-2">
                    <Badge variant={item.stockStatus === 'low' ? 'destructive' : 'secondary'}>
                      {item.quantity} {item.product.unit}
                    </Badge>
                  </div>
                </div>
                {item.location && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Local:</span>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-gray-400" />
                      <span className="text-sm">{item.location}</span>
                    </div>
                  </div>
                )}
                {item.expirationDate && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Validade:</span>
                    <Badge className={getExpirationColor(item.expirationStatus)}>
                      {format(new Date(item.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
                    </Badge>
                  </div>
                )}
                {(item.expirationWarning || item.stockWarning) && (
                  <div className="space-y-1">
                    {item.expirationWarning && (
                      <div className="flex items-center gap-2 text-xs text-orange-600 bg-orange-50 p-2 rounded">
                        <AlertTriangle className="h-3 w-3" />
                        {item.expirationWarning}
                      </div>
                    )}
                    {item.stockWarning && (
                      <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2 rounded">
                        <TrendingDown className="h-3 w-3" />
                        {item.stockWarning}
                      </div>
                    )}
                  </div>
                )}
                {item.totalValue && (
                  <div className="flex items-center justify-between pt-2 border-t">
                    <span className="text-sm text-gray-600">Valor:</span>
                    <div className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3 text-gray-400" />
                      <span className="text-sm font-medium">R$ {item.totalValue.toFixed(2)}</span>
                    </div>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    const consumed = prompt(`Quanto foi consumido? (máx: ${item.quantity} ${item.product.unit})`)
                    if (consumed && parseFloat(consumed) > 0) {
                      handleConsumeItem(item.id, parseFloat(consumed))
                    }
                  }} className="flex-1">
                    Usar
                  </Button>
                  {item.expirationStatus === 'expired' && (
                    <Button variant="destructive" size="sm" onClick={() => handleDeleteItem(item.id)} className="flex-1">
                      Descartar
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5" />
              Adicionar ao Estoque
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddStock} className="space-y-4">
            <div className="space-y-2">
              <Label>Produto *</Label>
              <ProductSelect
                value={formData.productId}
                products={products}
                onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                preserveFormData={{ formData, stockItems, returnContext: 'estoque' }}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Quantidade *</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={formData.quantity}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Preço Unitário</Label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.unitCost}
                  onChange={(e) => setFormData(prev => ({ ...prev, unitCost: parseFloat(e.target.value) || 0 }))}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Data de Validade</Label>
              <Input
                type="date"
                value={formData.expirationDate}
                onChange={(e) => setFormData(prev => ({ ...prev, expirationDate: e.target.value }))}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Localização</Label>
                <Select value={formData.location} onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Despensa">Despensa</SelectItem>
                    <SelectItem value="Geladeira">Geladeira</SelectItem>
                    <SelectItem value="Freezer">Freezer</SelectItem>
                    <SelectItem value="Área de Serviço">Área de Serviço</SelectItem>
                    <SelectItem value="Outro">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lote/Batch</Label>
                <Input
                  value={formData.batchNumber}
                  onChange={(e) => setFormData(prev => ({ ...prev, batchNumber: e.target.value }))}
                  placeholder="Ex: L2024001"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Observações</Label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Observações sobre o produto..."
              />
            </div>
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? "Adicionando..." : "Adicionar"}
              </Button>
              <Button type="button" variant="outline" onClick={() => setShowAddDialog(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}