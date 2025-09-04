"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { BrandSelect, CategorySelect } from "@/components/selects"
import { ArrowLeft, Package, Save, Camera } from "lucide-react"
import { BarcodeScanner } from "@/components/barcode-scanner"
import { TempStorage } from "@/lib/temp-storage"
import { useAppData } from "@/contexts/app-data-context"
import { Brand } from "@/types"
import Link from "next/link"
import { toast } from "sonner"

const categories = [
  "Açougue",
  "Padaria",
  "Bebidas",
  "Cereais",
  "Congelados",
  "Frutas",
  "Higiene",
  "Laticinios",
  "Limpeza",
  "Mercearia",
  "Verduras"
]

const units = [
  "unidade",
  "kg",
  "g",
  "litro",
  "ml",
  "pacote",
  "caixa",
  "garrafa",
  "lata",
  "saco"
]

export default function NovoProdutoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addProduct } = useAppData()
  const [loading, setLoading] = useState(false)
  const [showScanner, setShowScanner] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    categoryId: "",
    brandId: "",
    unit: "unidade",
    hasStock: false,
    minStock: "",
    maxStock: "",
    hasExpiration: false,
    defaultShelfLifeDays: ""
  })

  useEffect(() => {
    // Preencher nome do produto se veio da URL
    const nameParam = searchParams.get('name')
    if (nameParam) {
      setFormData(prev => ({ ...prev, name: nameParam }))
    }
  }, [searchParams])


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      toast.error("Nome do produto é obrigatório")
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          barcode: formData.barcode.trim() || null,
          categoryId: formData.categoryId || null,
          brandId: formData.brandId || null,
          unit: formData.unit,
          hasStock: formData.hasStock,
          minStock: formData.minStock ? parseFloat(formData.minStock) : null,
          maxStock: formData.maxStock ? parseFloat(formData.maxStock) : null,
          hasExpiration: formData.hasExpiration,
          defaultShelfLifeDays: formData.defaultShelfLifeDays ? parseInt(formData.defaultShelfLifeDays) : null
        })
      })

      if (response.ok) {
        const newProduct = await response.json()
        
        // Adicionar produto ao contexto global
        addProduct(newProduct)
        
        // Verificar se tem página de retorno
        const returnTo = searchParams.get('returnTo')
        const storageKey = searchParams.get('storageKey')
        
        if (returnTo && storageKey) {
          // Recuperar dados do localStorage
          const preservedData = TempStorage.get(storageKey)
          
          if (preservedData) {
            // Salvar novamente com o novo produto criado
            const updatedData = {
              ...preservedData,
              newProductId: newProduct.id
            }
            const newStorageKey = TempStorage.save(updatedData)
            
            // Remover dados antigos
            TempStorage.remove(storageKey)
            
            router.push(`${returnTo}?storageKey=${newStorageKey}`)
          } else {
            router.push(returnTo)
          }
        } else {
          router.push('/produtos')
        }
      } else {
        const error = await response.json()
        toast.error(error.error || 'Erro ao criar produto')
      }
    } catch (error) {
      console.error('Erro ao criar produto:', error)
      toast.error('Erro ao criar produto')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleBarcodeScanned = (barcode: string) => {
    setFormData(prev => ({ ...prev, barcode }))
    setShowScanner(false)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/produtos">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Novo Produto</h1>
          <p className="text-gray-600 mt-2">
            Cadastre um novo produto
          </p>
        </div>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Informações do Produto
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome do Produto *</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Ex: Arroz Branco"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="barcode">Código de Barras</Label>
              <div className="flex gap-2">
                <Input
                  id="barcode"
                  name="barcode"
                  value={formData.barcode}
                  onChange={handleChange}
                  placeholder="Digite ou escaneie o código"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  onClick={() => setShowScanner(true)}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="brandId">Marca</Label>
              <BrandSelect
                value={formData.brandId}
                onValueChange={(value) => handleSelectChange("brandId", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="categoryId">Categoria</Label>
              <CategorySelect
                value={formData.categoryId}
                onValueChange={(value) => handleSelectChange("categoryId", value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unidade de Medida</Label>
              <Select 
                value={formData.unit} 
                onValueChange={(value) => handleSelectChange("unit", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit} value={unit}>
                      {unit}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Controle de Estoque */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Controle de Estoque</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasStock" 
                  checked={formData.hasStock}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, hasStock: checked as boolean }))
                  }
                />
                <Label htmlFor="hasStock">Produto com controle de estoque</Label>
              </div>

              {formData.hasStock && (
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="minStock">Estoque Mínimo</Label>
                    <Input
                      id="minStock"
                      name="minStock"
                      type="number"
                      step="0.01"
                      value={formData.minStock}
                      onChange={handleChange}
                      placeholder="Ex: 5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="maxStock">Estoque Máximo</Label>
                    <Input
                      id="maxStock"
                      name="maxStock"
                      type="number"
                      step="0.01"
                      value={formData.maxStock}
                      onChange={handleChange}
                      placeholder="Ex: 20"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Controle de Validade */}
            <div className="space-y-4 pt-4 border-t">
              <h3 className="text-lg font-medium">Controle de Validade</h3>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="hasExpiration" 
                  checked={formData.hasExpiration}
                  onCheckedChange={(checked) => 
                    setFormData(prev => ({ ...prev, hasExpiration: checked as boolean }))
                  }
                />
                <Label htmlFor="hasExpiration">Produto com validade</Label>
              </div>

              {formData.hasExpiration && (
                <div className="space-y-2">
                  <Label htmlFor="defaultShelfLifeDays">Prazo de Validade Padrão (dias)</Label>
                  <Input
                    id="defaultShelfLifeDays"
                    name="defaultShelfLifeDays"
                    type="number"
                    value={formData.defaultShelfLifeDays}
                    onChange={handleChange}
                    placeholder="Ex: 30"
                  />
                  <p className="text-xs text-gray-500">
                    Usado para calcular automaticamente a validade quando o produto for adicionado ao estoque
                  </p>
                </div>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <Button type="submit" disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                {loading ? "Salvando..." : "Salvar Produto"}
              </Button>
              <Button 
                type="button" 
                variant="outline"
                onClick={() => {
                  const returnTo = searchParams.get('returnTo')
                  const storageKey = searchParams.get('storageKey')
                  
                  if (returnTo && storageKey) {
                    // Limpar dados do localStorage ao cancelar
                    TempStorage.remove(storageKey)
                    router.push(returnTo)
                  } else {
                    router.push('/produtos')
                  }
                }}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <BarcodeScanner 
        isOpen={showScanner}
        onScan={handleBarcodeScanned}
        onClose={() => setShowScanner(false)}
      />
    </div>
  )
}