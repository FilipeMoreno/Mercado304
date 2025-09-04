// src/app/estoque/page.tsx

"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams, useRouter } from "next/navigation"
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
  Filter,
  TrendingDown,
  Calendar,
  MapPin,
  DollarSign
} from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ProductSelect } from "@/components/selects"
import { TempStorage } from "@/lib/temp-storage"
import { useAppData } from "@/contexts/app-data-context"

import { toast } from "sonner"

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

export default function EstoquePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { products, isLoading: appDataLoading } = useAppData()
  const [stockItems, setStockItems] = useState<StockItem[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [showAddDialog, setShowAddDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [editingItem, setEditingItem] = useState<StockItem | null>(null)
  const [saving, setSaving] = useState(false)

  // Filtros da URL
  const [locationFilter, setLocationFilter] = useState(searchParams.get('location') || 'all')
  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '')
  
  const [formData, setFormData] = useState({
    productId: '',
    quantity: 1,
    expirationDate: '',
    batchNumber: '',
    location: 'Despensa',
    unitCost: 0,
    notes: ''
  })

  const fetchStock = useCallback(async () => {
    setLoading(true)
    const url = `/api/stock?location=${locationFilter}&search=${searchTerm}`
    try {
      const response = await fetch(url, { cache: 'no-store' })
      const data = await response.json()
      setStockItems(data.items || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error('Erro ao buscar estoque:', error)
    } finally {
      setLoading(false)
    }
  }, [locationFilter, searchTerm])
  
  
  // Lógica para atualizar a URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams)
    params.set('search', searchTerm)
    params.set('location', locationFilter)
    router.push(`?${params.toString()}`, { scroll: false })
  }, [searchTerm, locationFilter, router, searchParams])
  
  // Busca inicial dos dados
  useEffect(() => {
    fetchStock()
  }, [fetchStock])

  useEffect(() => {
    const storageKey = searchParams.get('storageKey')
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
  }, [searchParams])

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
        fetchStock()
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
        fetchStock()
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
      const response = await fetch(`/api/stock/${itemId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        fetchStock()
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
  
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

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

      {/* Estatísticas */}
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

      {/* Filtros */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Buscar Produto</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Nome do produto..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Localização</Label>
              <Select value={locationFilter} onValueChange={setLocationFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as localizações</SelectItem>
                  {stats?.locations.map((location: string) => (
                    <SelectItem key={location} value={location}>{location}</SelectItem>
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
          </div>
        </CardContent>
      </Card>

      {/* Lista de Estoque */}
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
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingItem(item)
                      setShowEditDialog(true)
                    }}
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-3">
              {/* Quantidade */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Quantidade:</span>
                <div className="flex items-center gap-2">
                  <Badge variant={item.stockStatus === 'low' ? 'destructive' : 'secondary'}>
                    {item.quantity} {item.product.unit}
                  </Badge>
                </div>
              </div>

              {/* Localização */}
              {item.location && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Local:</span>
                  <div className="flex items-center gap-1">
                    <MapPin className="h-3 w-3 text-gray-400" />
                    <span className="text-sm">{item.location}</span>
                  </div>
                </div>
              )}

              {/* Validade */}
              {item.expirationDate && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Validade:</span>
                  <Badge className={getExpirationColor(item.expirationStatus)}>
                    {format(new Date(item.expirationDate), "dd/MM/yyyy", { locale: ptBR })}
                  </Badge>
                </div>
              )}

              {/* Alertas */}
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

              {/* Valor */}
              {item.totalValue && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <span className="text-sm text-gray-600">Valor:</span>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3 w-3 text-gray-400" />
                    <span className="text-sm font-medium">R$ {item.totalValue.toFixed(2)}</span>
                  </div>
                </div>
              )}

              {/* Ações Rápidas */}
              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const consumed = prompt(`Quanto foi consumido? (máx: ${item.quantity} ${item.product.unit})`)
                    if (consumed && parseFloat(consumed) > 0) {
                      handleConsumeItem(item.id, parseFloat(consumed))
                    }
                  }}
                  className="flex-1"
                >
                  Usar
                </Button>
                
                {item.expirationStatus === 'expired' && (
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDeleteItem(item.id)}
                    className="flex-1"
                  >
                    Descartar
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {stockItems.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Estoque vazio</h3>
            <p className="text-gray-600 mb-4">
              Adicione produtos ao seu estoque para começar o controle
            </p>
            <Button onClick={() => setShowAddDialog(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeiro Item
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Dialog Adicionar Item */}
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
                onValueChange={(value) => setFormData(prev => ({ ...prev, productId: value }))}
                preserveFormData={{
                  formData,
                  stockItems: stockItems.slice(0, 5),
                  returnContext: 'estoque'
                }}
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
                <Select 
                  value={formData.location} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, location: value }))}
                >
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
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setShowAddDialog(false)}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}