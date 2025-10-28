"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
	Apple,
	Beef,
	Calculator,
	Camera,
	CircleDollarSign,
	ChefHat,
	ChevronLeft,
	ChevronRight,
	CloudOff,
	Database,
	DollarSign,
	FileText,
	FlaskConical,
	Grid3X3,
	History,
	LayoutDashboard,
	List,
	Menu,
	Package,
	PackageCheck,
	Receipt,
	RefreshCw,
	Settings,
	ShoppingBag,
	ShoppingCart,
	Sparkles,
	Store,
	Tag,
	TestTube,
	Trash2,
	Warehouse,
	WifiOff,
	Wrench,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { useOffline } from "@/hooks/use-offline"
import { cn } from "@/lib/utils"
import { APP_VERSION } from "@/lib/version"
import { UserNav } from "./user-nav"

const navigation = [
	{ name: "Dashboard", href: "/", icon: LayoutDashboard },
	{ name: "Mercados", href: "/mercados", icon: Store },
	{
		name: "Produtos",
		href: "/produtos",
		icon: Package,
		subItems: [
			{ name: "Produtos", href: "/produtos", icon: Package },
			{ name: "Kits e Combos", href: "/produtos/kits", icon: PackageCheck },
			{ name: "Categorias", href: "/categorias", icon: Grid3X3 },
			{ name: "Marcas", href: "/marcas", icon: Tag },
		],
	},
	{
		name: "Compras",
		href: "/compras",
		icon: ShoppingBag,
		subItems: [
			{ name: "Minhas Compras", href: "/compras", icon: ShoppingCart },
			{ name: "Orçamentos", href: "/orcamentos", icon: CircleDollarSign },
			{ name: "Cotações", href: "/cotacoes", icon: Calculator },
			{ name: "Importar NFC-e", href: "/compras/importar", icon: Receipt },
			{ name: "Lista de Compras", href: "/lista", icon: List },
		],
	},
	{
		name: "Preços",
		href: "/precos",
		icon: DollarSign,
		subItems: [
			{ name: "Registro de Preços", href: "/precos", icon: Receipt },
			{ name: "Comparação de Preços", href: "/comparacao", icon: DollarSign },
		],
	},
	{
		name: "Estoque",
		href: "/estoque",
		icon: Warehouse,
		subItems: [
			{ name: "Estoque", href: "/estoque", icon: Warehouse },
			{ name: "Desperdícios", href: "/desperdicios", icon: Trash2 },
		],
	},
	{
		name: "Análise Nutricional",
		href: "/nutricao",
		icon: Apple,
		subItems: [
			{ name: "Análise Geral", href: "/nutricao", icon: Apple },
			{ name: "Produtos sem Info", href: "/produtos/nutricao", icon: Package },
		],
	},
	{
		name: "Ferramentas",
		href: "/receitas",
		icon: Wrench,
		subItems: [
			{
				name: "Receitas",
				href: "/receitas",
				icon: ChefHat,
				subItems: [
					{ name: "Minhas Receitas", href: "/receitas", icon: ChefHat },
					{ name: "Gerar Receitas", href: "/receitas/gerar", icon: Sparkles },
				],
			},
			{ name: "Churrascômetro", href: "/churrasco", icon: Beef },
		],
	},
	{
		name: "Admin",
		href: "/admin",
		icon: Settings,
		subItems: [
			{
				name: "Sync Preços",
				href: "/admin/sync-precos",
				icon: RefreshCw,
				subItems: [
					{ name: "Sincronizar", href: "/admin/sync-precos", icon: RefreshCw },
					{ name: "Histórico", href: "/admin/sync-precos/historico", icon: History },
				],
			},
			{ name: "Nota Paraná", href: "/admin/nota-parana", icon: FileText },
			{ name: "Backup", href: "/admin/backup", icon: Database },
			{ name: "Métricas Offline", href: "/admin/offline-metrics", icon: CloudOff },
			{
				name: "Playground",
				href: "/admin/playground",
				icon: FlaskConical,
				subItems: [
					{ name: "Teste Câmera", href: "/admin/playground/teste-camera", icon: Camera },
					{ name: "Test Matching", href: "/admin/test-matching", icon: TestTube },
				],
			},
		],
	},
]

interface SidebarProps {
	collapsed?: boolean
	onToggleCollapse?: () => void
}

function SyncStatusIndicator({ collapsed }: { collapsed: boolean }) {
	const { isOnline, syncQueueCount, processSyncQueue } = useOffline()
	const [syncProgress, setSyncProgress] = useState(0)

	// Simular progresso de sincronização
	useEffect(() => {
		if (syncQueueCount > 0) {
			const interval = setInterval(() => {
				setSyncProgress((prev) => {
					if (prev >= 100) return 0
					return prev + 10
				})
			}, 500)
			return () => clearInterval(interval)
		}
		setSyncProgress(0)
	}, [syncQueueCount])

	// Não mostrar se estiver online e sem fila
	if (isOnline && syncQueueCount === 0) {
		return null
	}

	if (collapsed) {
		return (
			<Button
				variant="ghost"
				size="icon"
				className={cn(
					"w-full h-10 mb-2",
					!isOnline
						? "text-red-500 hover:text-red-600 hover:bg-red-50"
						: "text-blue-500 hover:text-blue-600 hover:bg-blue-50",
				)}
				onClick={() => syncQueueCount > 0 && processSyncQueue()}
				title={
					!isOnline
						? `Modo Offline${syncQueueCount > 0 ? ` - ${syncQueueCount} pendente(s)` : ""}`
						: `Sincronizando ${syncQueueCount} item(s)`
				}
			>
				{!isOnline ? (
					<div className="relative">
						<WifiOff className="h-5 w-5" />
						{syncQueueCount > 0 && (
							<div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
								{syncQueueCount}
							</div>
						)}
					</div>
				) : (
					<div className="relative">
						<RefreshCw className="h-5 w-5 animate-spin" />
						<div className="absolute -top-1 -right-1 bg-blue-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
							{syncQueueCount}
						</div>
					</div>
				)}
			</Button>
		)
	}

	return (
		<div className="mb-2 border-t border-border/50 pt-3">
			<div
				className={cn(
					"rounded-lg p-3 transition-colors",
					!isOnline ? "bg-red-50 border border-red-200" : "bg-blue-50 border border-blue-200",
				)}
			>
				<div className="flex items-center justify-between mb-2">
					<div className="flex items-center gap-2">
						{!isOnline ? (
							<>
								<CloudOff className="h-4 w-4 text-red-600" />
								<span className="text-xs font-medium text-red-900">Modo Offline</span>
							</>
						) : (
							<>
								<RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />
								<span className="text-xs font-medium text-blue-900">Sincronizando</span>
							</>
						)}
					</div>
					{syncQueueCount > 0 && (
						<Badge
							variant="secondary"
							className={cn(!isOnline ? "bg-red-200 text-red-800" : "bg-blue-200 text-blue-800")}
						>
							{syncQueueCount}
						</Badge>
					)}
				</div>

				{syncQueueCount > 0 && (
					<>
						<Progress value={isOnline ? syncProgress : 0} className="h-1 mb-2" />
						<div className="flex items-center justify-between text-[10px]">
							<span className={cn("text-muted-foreground", !isOnline ? "text-red-700" : "text-blue-700")}>
								{syncQueueCount} ação(ões) {isOnline ? "sincronizando" : "na fila"}
							</span>
							{isOnline && (
								<Button
									variant="ghost"
									size="sm"
									className="h-5 px-2 text-[10px] text-blue-600 hover:text-blue-700"
									onClick={() => processSyncQueue()}
								>
									Sincronizar
								</Button>
							)}
						</div>
					</>
				)}

				{!isOnline && syncQueueCount === 0 && (
					<p className="text-[10px] text-red-700">Você está offline. Reconecte para sincronizar.</p>
				)}
			</div>
		</div>
	)
}

function SidebarContent({ collapsed = false, onToggleCollapse }: SidebarProps) {
	const pathname = usePathname()
	const [expandedItems, setExpandedItems] = useState<string[]>(() => {
		const expanded = []

		// Auto-expand baseado na URL atual
		if (pathname.startsWith("/produtos") || pathname.startsWith("/categorias") || pathname.startsWith("/marcas")) {
			expanded.push("Produtos")
		}
		if (pathname.startsWith("/compras") || pathname.startsWith("/lista")) {
			expanded.push("Compras")
		}
		if (pathname.startsWith("/precos") || pathname.startsWith("/comparacao")) {
			expanded.push("Preços")
		}
		if (pathname.startsWith("/estoque") || pathname.startsWith("/desperdicios")) {
			expanded.push("Estoque")
		}
		if (pathname.startsWith("/nutricao")) {
			expanded.push("Análise Nutricional")
		}
		if (pathname.startsWith("/receitas") || pathname.startsWith("/churrasco")) {
			expanded.push("Ferramentas")
			if (pathname.startsWith("/receitas")) {
				expanded.push("Receitas")
			}
		}
		if (pathname.startsWith("/admin")) {
			expanded.push("Admin")
			if (pathname.startsWith("/admin/sync-precos")) {
				expanded.push("Sync Preços")
			}
			if (pathname.startsWith("/admin/playground")) {
				expanded.push("Playground")
			}
		}

		return expanded
	})

	const toggleExpanded = (itemName: string) => {
		setExpandedItems((prev) =>
			prev.includes(itemName) ? prev.filter((name) => name !== itemName) : [...prev, itemName],
		)
	}

	// Auto-expand ao navegar para páginas específicas
	useEffect(() => {
		const newExpanded = []

		if (pathname.startsWith("/produtos") || pathname.startsWith("/categorias") || pathname.startsWith("/marcas")) {
			newExpanded.push("Produtos")
		}
		if (pathname.startsWith("/compras") || pathname.startsWith("/lista")) {
			newExpanded.push("Compras")
		}
		if (pathname.startsWith("/precos") || pathname.startsWith("/comparacao")) {
			newExpanded.push("Preços")
		}
		if (pathname.startsWith("/estoque") || pathname.startsWith("/desperdicios")) {
			newExpanded.push("Estoque")
		}
		if (pathname.startsWith("/nutricao")) {
			newExpanded.push("Análise Nutricional")
		}
		if (pathname.startsWith("/receitas") || pathname.startsWith("/churrasco")) {
			newExpanded.push("Ferramentas")
			if (pathname.startsWith("/receitas")) {
				newExpanded.push("Receitas")
			}
		}
		if (pathname.startsWith("/admin")) {
			newExpanded.push("Admin")
			if (pathname.startsWith("/admin/sync-precos")) {
				newExpanded.push("Sync Preços")
			}
			if (pathname.startsWith("/admin/playground")) {
				newExpanded.push("Playground")
			}
		}

		// Adicionar apenas se não estiver já expandido
		newExpanded.forEach((item) => {
			if (!expandedItems.includes(item)) {
				setExpandedItems((prev) => [...prev, item])
			}
		})
	}, [pathname, expandedItems])

	return (
		<div className={cn("flex h-full flex-col bg-accent transition-all duration-300", collapsed ? "w-16" : "w-64")}>
			<div className={cn("p-6", collapsed && "p-4")}>
				<div className="flex items-center justify-between">
					{!collapsed && (
						<div className="flex items-center justify-center">
							<ShoppingCart className="mr-2 h-8 w-8 text-blue-600" />
							<h1 className="text-2xl font-semibold text-blue-600">Mercado304</h1>
						</div>
					)}
					{onToggleCollapse && (
						<Button variant="ghost" size="icon" onClick={onToggleCollapse} className="ml-auto">
							{collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
						</Button>
					)}
				</div>
			</div>

			<nav className={cn("flex-1 overflow-y-auto px-4 space-y-2 scrollbar-hide", collapsed && "px-2")}>
				{navigation.map((item) => {
					const Icon = item.icon
					const isActive = pathname === item.href
					const hasSubItems = item.subItems && item.subItems.length > 0
					const isExpanded = expandedItems.includes(item.name)

					// Verifica se algum subitem ou subitem aninhado está ativo
					const isSubItemActive =
						hasSubItems &&
						item.subItems.some((subItem) => {
							if (pathname === subItem.href) return true
							if (subItem.subItems) {
								return subItem.subItems.some((nestedItem) => pathname === nestedItem.href)
							}
							return false
						})

					if (hasSubItems && !collapsed) {
						return (
							<div key={item.name} className="space-y-1">
								<Button
									variant="ghost"
									onClick={() => toggleExpanded(item.name)}
									className={cn(
										"w-full justify-start h-auto py-3 px-4 rounded-xl",
										"text-muted-foreground",
										isActive || isSubItemActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted",
									)}
								>
									<Icon className="h-5 w-5 mr-3" />
									{item.name}
									<ChevronRight className={cn("h-4 w-4 ml-auto transition-transform", isExpanded && "rotate-90")} />
								</Button>

								{isExpanded && (
									<div className="pl-4 space-y-1">
										{item.subItems.map((subItem) => {
											const SubIcon = subItem.icon
											const isSubActive = pathname === subItem.href
											const hasNestedItems = subItem.subItems && subItem.subItems.length > 0
											const isSubExpanded = expandedItems.includes(subItem.name)
											const isNestedActive =
												hasNestedItems && subItem.subItems.some((nested) => pathname === nested.href)

											// Se tem subitens aninhados
											if (hasNestedItems) {
												return (
													<div key={subItem.name} className="space-y-1">
														<Button
															variant="ghost"
															onClick={() => toggleExpanded(subItem.name)}
															className={cn(
																"w-full justify-start h-auto py-2 px-4 rounded-lg",
																"text-muted-foreground text-sm",
																isSubActive || isNestedActive
																	? "bg-primary/10 text-primary font-medium"
																	: "hover:bg-muted",
															)}
														>
															<SubIcon className="h-4 w-4 mr-3" />
															{subItem.name}
															<ChevronRight
																className={cn("h-3 w-3 ml-auto transition-transform", isSubExpanded && "rotate-90")}
															/>
														</Button>

														{isSubExpanded && (
															<div className="pl-4 space-y-1">
																{subItem.subItems.map((nestedItem) => {
																	const NestedIcon = nestedItem.icon
																	const isNestedItemActive = pathname === nestedItem.href
																	return (
																		<Link key={nestedItem.name} href={nestedItem.href}>
																			<Button
																				variant="ghost"
																				className={cn(
																					"w-full justify-start h-auto py-2 px-4 rounded-lg",
																					"text-muted-foreground text-xs",
																					isNestedItemActive
																						? "bg-primary/10 text-primary font-medium"
																						: "hover:bg-muted",
																				)}
																			>
																				<NestedIcon className="h-3 w-3 mr-3" />
																				{nestedItem.name}
																			</Button>
																		</Link>
																	)
																})}
															</div>
														)}
													</div>
												)
											}

											// Subitem simples
											return (
												<Link key={subItem.name} href={subItem.href}>
													<Button
														variant="ghost"
														className={cn(
															"w-full justify-start h-auto py-2 px-4 rounded-lg",
															"text-muted-foreground text-sm",
															isSubActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted",
														)}
													>
														<SubIcon className="h-4 w-4 mr-3" />
														{subItem.name}
													</Button>
												</Link>
											)
										})}
									</div>
								)}
							</div>
						)
					}

					return (
						<Link key={item.name} href={item.href}>
							<Button
								variant="ghost"
								className={cn(
									"w-full justify-start h-auto py-3 px-4 rounded-xl",
									"text-muted-foreground",
									isActive ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted",
									collapsed && "px-2 justify-center",
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
				<SyncStatusIndicator collapsed={collapsed} />
				<UserNav collapsed={collapsed} />
				{!collapsed && (
					<div className="text-center text-xs text-muted-foreground/50 pt-2 border-t border-border/50">
						v{APP_VERSION}
					</div>
				)}
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
		window.addEventListener("resize", checkScreenSize)
		return () => window.removeEventListener("resize", checkScreenSize)
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
					<VisuallyHidden>
						<SheetHeader>
							<SheetTitle>Menu de Navegação</SheetTitle>
						</SheetHeader>
					</VisuallyHidden>
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
