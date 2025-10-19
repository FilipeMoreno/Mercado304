"use client"

import { VisuallyHidden } from "@radix-ui/react-visually-hidden"
import {
	Apple,
	Beef,
	Camera,
	ChefHat,
	ChevronLeft,
	ChevronRight,
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
	Trash2,
	Warehouse,
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
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
		name: "Receitas",
		href: "/receitas",
		icon: ChefHat,
		subItems: [
			{ name: "Minhas Receitas", href: "/receitas", icon: ChefHat },
			{ name: "Gerar Receitas", href: "/receitas/gerar", icon: Sparkles },
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
	{ name: "Churrascômetro", href: "/churrasco", icon: Beef },
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
			{
				name: "Playground",
				href: "/admin/playground",
				icon: FlaskConical,
				subItems: [{ name: "Teste Câmera", href: "/admin/playground/teste-camera", icon: Camera }],
			},
		],
	},
]

interface SidebarProps {
	collapsed?: boolean
	onToggleCollapse?: () => void
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
		if (pathname.startsWith("/receitas")) {
			expanded.push("Receitas")
		}
		if (pathname.startsWith("/nutricao")) {
			expanded.push("Análise Nutricional")
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
		if (pathname.startsWith("/receitas")) {
			newExpanded.push("Receitas")
		}
		if (pathname.startsWith("/nutricao")) {
			newExpanded.push("Análise Nutricional")
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
