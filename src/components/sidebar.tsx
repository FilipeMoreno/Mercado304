// src/components/sidebar.tsx

"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { 
  Store, 
  Package, 
  ShoppingCart, 
  List,
  BarChart3,
  Tag,
  Grid3X3,
  DollarSign,
  Box,
  Menu,
  ChevronLeft,
  ChevronRight,
  Apple,
  ChefHat // Certifique-se que este import existe
} from "lucide-react"
import { UserNav } from "./user-nav"

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Mercados", href: "/mercados", icon: Store },
  { name: "Produtos", href: "/produtos", icon: Package },
  { name: "Categorias", href: "/categorias", icon: Grid3X3 },
  { name: "Marcas", href: "/marcas", icon: Tag },
  { name: "Compras", href: "/compras", icon: ShoppingCart },
  { name: "Lista de Compras", href: "/lista", icon: List },
  { name: "Receitas", href: "/receitas", icon: ChefHat },
  { name: "Comparação de Preços", href: "/comparacao", icon: DollarSign },
  { name: "Análise Nutricional", href: "/nutricao", icon: Apple },
  { name: "Estoque", href: "/estoque", icon: Box },
]

interface SidebarProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
}

function SidebarContent({ collapsed = false, onToggleCollapse }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "flex h-full flex-col bg-accent transition-all duration-300",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className={cn("p-6", collapsed && "p-4")}>
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-2xl font-bold">Mercado304</h1>}
          {onToggleCollapse && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onToggleCollapse}
              className="ml-auto"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      
      <nav className={cn(
        "flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide",
        collapsed && "px-2"
      )}>
        {navigation.map((item) => {
          const Icon = item.icon
          const isActive = pathname === item.href
          return (
            <Link key={item.name} href={item.href}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start h-auto py-3 px-4 rounded-xl",
                  "text-muted-foreground",
                  isActive
                    ? "bg-primary/10 text-primary font-semibold"
                    : "hover:bg-muted",
                  collapsed && "px-2 justify-center"
                )}
                title={collapsed ? item.name : undefined}
              >
                <Icon className={cn("h-5 w-5", !collapsed && "mr-3")} />
                {!collapsed && item.name}
              </Button>
            </Link>
          )
        })}
      </nav>
      
      <div className={cn("mt-auto flex flex-col gap-2 p-4", collapsed && "p-2 items-center")}>
        <UserNav collapsed={collapsed} />
      </div>
    </div>
  )
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    
    checkScreenSize()
    window.addEventListener('resize', checkScreenSize)
    return () => window.removeEventListener('resize', checkScreenSize)
  }, [])

  if (!mounted) {
    return null
  }

  const toggleCollapse = () => {
    setCollapsed(!collapsed)
  }

  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="fixed top-4 left-4 z-50 md:hidden bg-white dark:bg-gray-900 shadow-md border border-gray-200 dark:border-gray-800"
          >
            <Menu className="h-4 w-4" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-64">
          <SidebarContent />
        </SheetContent>
      </Sheet>
    )
  }

  return (
    <div className="hidden md:block">
      <SidebarContent collapsed={collapsed} onToggleCollapse={toggleCollapse} />
    </div>
  )
}