"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import React from "react"
import { 
  Smartphone, 
  Tablet, 
  Monitor, 
  Trash2, 
  Edit, 
  Archive, 
  Plus, 
  Heart, 
  Share, 
  Settings,
  ShoppingCart,
  Star
} from "lucide-react"
import { AnimatedList, ListItem } from "@/components/ui/animated-list"
import { FloatingActionButton } from "@/components/ui/floating-action-button"
import { MobileNavigation } from "@/components/ui/mobile-navigation"
import { MobileModal } from "@/components/ui/mobile-modal"
import { SwipeableCard } from "@/components/ui/swipeable-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useMobile, useBreakpoint } from "@/hooks/use-mobile"
import { toast } from "sonner"

export default function MobileDemoPage() {
  const [showModal, setShowModal] = useState(false)
  const [selectedDemo, setSelectedDemo] = useState<string | null>(null)
  const mobile = useMobile()
  const breakpoint = useBreakpoint()

  // Dados de demonstração
  const [listItems, setListItems] = useState<ListItem[]>([
    {
      id: 1,
      content: (
        <div className="p-4">
          <h3 className="font-semibold">🍎 Maçã</h3>
          <p className="text-sm text-gray-600">Swipe ← para editar ou deletar</p>
          <p className="text-sm text-gray-600">Swipe → para arquivar</p>
        </div>
      )
    },
    {
      id: 2,
      content: (
        <div className="p-4">
          <h3 className="font-semibold">🥛 Leite</h3>
          <p className="text-sm text-gray-600">Long press para seleção múltipla</p>
        </div>
      )
    },
    {
      id: 3,
      content: (
        <div className="p-4">
          <h3 className="font-semibold">🍞 Pão</h3>
          <p className="text-sm text-gray-600">Toque para selecionar</p>
        </div>
      )
    }
  ])

  const handleItemDelete = (id: string | number) => {
    setListItems(prev => prev.filter(item => item.id !== id))
    toast.success("Item deletado com sucesso!")
  }

  const handleItemEdit = (id: string | number) => {
    toast.info(`Editando item ${id}`)
  }

  const handleItemArchive = (id: string | number) => {
    toast.info(`Item ${id} arquivado`)
  }

  const fabActions = [
    {
      icon: <Plus className="h-5 w-5" />,
      label: "Adicionar Item",
      onClick: () => {
        const newItem: ListItem = {
          id: Date.now(),
          content: (
            <div className="p-4">
              <h3 className="font-semibold">🆕 Novo Item</h3>
              <p className="text-sm text-gray-600">Item adicionado via FAB</p>
            </div>
          )
        }
        setListItems(prev => [...prev, newItem])
        toast.success("Novo item adicionado!")
      },
      bgColor: "bg-green-500"
    },
    {
      icon: <Heart className="h-5 w-5" />,
      label: "Favoritos",
      onClick: () => toast.info("Visualizando favoritos"),
      bgColor: "bg-red-500"
    },
    {
      icon: <Share className="h-5 w-5" />,
      label: "Compartilhar",
      onClick: () => toast.info("Compartilhando lista"),
      bgColor: "bg-blue-500"
    }
  ]

  const deviceIcon = mobile.isMobile ? Smartphone : mobile.isTablet ? Tablet : Monitor

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Smartphone className="h-6 w-6" />
              Demo Funcionalidades Mobile
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2">
                {React.createElement(deviceIcon, { className: "h-5 w-5" })}
                <span className="text-sm">
                  {mobile.deviceType.charAt(0).toUpperCase() + mobile.deviceType.slice(1)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm">Breakpoint: </span>
                <Badge variant="outline">{breakpoint}</Badge>
              </div>
            </div>
            
            <div className="text-xs text-gray-600 space-y-1">
              <p>Resolução: {mobile.screenSize.width}x{mobile.screenSize.height}</p>
              <p>Orientação: {mobile.orientation}</p>
              <p>Touch: {mobile.isTouchDevice ? "Sim" : "Não"}</p>
              <p>Plataforma: {mobile.platform}</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Seções de Demo */}
      <div className="space-y-6">
        {/* Lista Animada com Gestos */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Lista com Gestos Touch</CardTitle>
              <p className="text-sm text-gray-600">
                Swipe para ações, long press para seleção
              </p>
            </CardHeader>
            <CardContent>
              <AnimatedList
                items={listItems}
                onItemDelete={handleItemDelete}
                onItemEdit={handleItemEdit}
                onItemArchive={handleItemArchive}
                onItemLongPress={(id) => toast.info(`Long press no item ${id}`)}
                enableSwipeActions={true}
                enableAnimations={true}
              />
            </CardContent>
          </Card>
        </motion.div>

        {/* Card Individual Swipeable */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Card Swipeable Individual</CardTitle>
              <p className="text-sm text-gray-600">
                Swipe este card para ver as ações
              </p>
            </CardHeader>
            <CardContent>
              <SwipeableCard
                leftActions={[
                  {
                    icon: <Star className="h-5 w-5" />,
                    color: "text-yellow-600",
                    background: "bg-yellow-100",
                    action: () => toast.success("Favoritado!")
                  }
                ]}
                rightActions={[
                  {
                    icon: <Edit className="h-5 w-5" />,
                    color: "text-blue-600",
                    background: "bg-blue-100",
                    action: () => toast.info("Editando...")
                  },
                  {
                    icon: <Trash2 className="h-5 w-5" />,
                    color: "text-red-600",
                    background: "bg-red-100",
                    action: () => toast.error("Deletado!")
                  }
                ]}
                onLongPress={() => toast.info("Long press detectado!")}
              >
                <div className="p-6">
                  <h3 className="font-semibold mb-2">📦 Produto Exemplo</h3>
                  <p className="text-gray-600">
                    Swipe para a esquerda ou direita para ver as ações disponíveis.
                    Segure pressionado para long press.
                  </p>
                </div>
              </SwipeableCard>
            </CardContent>
          </Card>
        </motion.div>

        {/* Botões de Demo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>Componentes Mobile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Button 
                  onClick={() => setShowModal(true)}
                  className="w-full"
                >
                  Abrir Modal Mobile
                </Button>
                
                <MobileNavigation
                  trigger={
                    <Button variant="outline" className="w-full">
                      Navegação Mobile
                    </Button>
                  }
                >
                  <div className="space-y-4">
                    <h3 className="font-semibold">Menu Principal</h3>
                    <div className="space-y-2">
                      <Button variant="ghost" className="w-full justify-start">
                        🏠 Dashboard
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        🛍️ Produtos
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        📊 Relatórios
                      </Button>
                      <Button variant="ghost" className="w-full justify-start">
                        ⚙️ Configurações
                      </Button>
                    </div>
                  </div>
                </MobileNavigation>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* FAB */}
      <FloatingActionButton
        actions={fabActions}
        position="bottom-right"
        size="md"
        expandDirection="up"
        showLabels={true}
      />

      {/* Modal Demo */}
      <MobileModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Modal Mobile"
        subtitle="Exemplo de modal responsivo com gestos"
        dragToClose={true}
        swipeToClose={true}
      >
        <div className="space-y-4">
          <p>
            Este modal suporta gestos touch avançados:
          </p>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Arrastar a barra superior para fechar</li>
            <li>Swipe para baixo para fechar</li>
            <li>Toque fora do modal para fechar</li>
            <li>Scroll interno quando necessário</li>
          </ul>
          
          <div className="bg-gray-100 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">Informações do Dispositivo:</h4>
            <div className="text-sm space-y-1">
              <p>Tipo: {mobile.deviceType}</p>
              <p>Touch: {mobile.isTouchDevice ? "Suportado" : "Não suportado"}</p>
              <p>Orientação: {mobile.orientation}</p>
            </div>
          </div>

          <Button 
            onClick={() => setShowModal(false)}
            className="w-full"
          >
            Fechar Modal
          </Button>
        </div>
      </MobileModal>
    </div>
  )
}