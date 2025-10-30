"use client"

import { ArrowLeft, Database, List, Package, ShoppingCart, Sparkles, WifiOff } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { offlineCache } from "@/lib/offline-db"

interface CachedDataSummary {
	products: number
	stock: number
	shoppingLists: number
	purchases: number
	brands: number
	categories: number
	markets: number
}

export default function Offline() {
	const [loading, setLoading] = useState(true)
	const [cachedData, setCachedData] = useState<CachedDataSummary>({
		products: 0,
		stock: 0,
		shoppingLists: 0,
		purchases: 0,
		brands: 0,
		categories: 0,
		markets: 0,
	})

	useEffect(() => {
		async function loadCachedData() {
			try {
				const [products, stock, shoppingLists, purchases, brands, categories, markets] = await Promise.all([
					offlineCache.getProducts(),
					offlineCache.getStock(),
					offlineCache.getShoppingLists(),
					offlineCache.getPurchases(),
					offlineCache.getBrands(),
					offlineCache.getCategories(),
					offlineCache.getMarkets(),
				])

				setCachedData({
					products: products?.length || 0,
					stock: stock?.length || 0,
					shoppingLists: shoppingLists?.length || 0,
					purchases: purchases?.length || 0,
					brands: brands?.length || 0,
					categories: categories?.length || 0,
					markets: markets?.length || 0,
				})
			} catch (error) {
				console.error("Erro ao carregar dados em cache:", error)
			} finally {
				setLoading(false)
			}
		}

		loadCachedData()
	}, [])

	const totalCachedItems =
		cachedData.products +
		cachedData.stock +
		cachedData.shoppingLists +
		cachedData.purchases +
		cachedData.brands +
		cachedData.categories +
		cachedData.markets

	return (
		<div className="flex flex-col w-full min-h-screen items-center justify-center p-4 gap-6 bg-gradient-to-b from-gray-50 to-gray-100">
			<div className="max-w-2xl w-full space-y-6">
				{/* Cabeçalho */}
				<div className="flex flex-col items-center text-center space-y-4">
					{/* Logo Mercado304 */}
					<div className="relative mb-4">
						<motion.div
							initial={{ scale: 0, opacity: 0 }}
							animate={{ scale: 1, opacity: 1 }}
							transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
							className="relative"
						>
							{/* Logo Background Card */}
							<div className="relative flex items-center gap-3 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 p-6 shadow-2xl shadow-blue-600/20">
								<ShoppingCart className="h-12 w-12 text-white" strokeWidth={2.5} />
								<div className="h-10 w-0.5 bg-white/20" />
								<Package className="h-10 w-10 text-white" strokeWidth={2.5} />
								
								{/* Floating Sparkles */}
								<motion.div
									animate={{ y: [-3, 3, -3], rotate: [0, 10, 0] }}
									transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
									className="absolute -right-2 -top-2"
								>
									<Sparkles className="h-5 w-5 text-yellow-400 drop-shadow-lg" fill="currentColor" />
								</motion.div>
								
								<motion.div
									animate={{ y: [3, -3, 3], rotate: [0, -10, 0] }}
									transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
									className="absolute -left-2 -bottom-2"
								>
									<Sparkles className="h-5 w-5 text-yellow-400 drop-shadow-lg" fill="currentColor" />
								</motion.div>
							</div>
							
							{/* Animated rings */}
							<motion.div
								animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.15, 0.3] }}
								transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
								className="absolute inset-0 rounded-3xl bg-blue-600 blur-2xl -z-10"
							/>
						</motion.div>
					</div>
					
					<div className="relative">
						<WifiOff className="h-16 w-16 text-red-500 animate-pulse" />
						<div className="absolute -bottom-2 -right-2 bg-red-500 text-white rounded-full p-2">
							<Database className="h-5 w-5" />
						</div>
					</div>
					<div className="space-y-2">
						<h1 className="text-4xl font-bold text-gray-900">Você está offline</h1>
						<p className="text-lg text-gray-600">Sem conexão com a internet no momento</p>
					</div>
				</div>

				{/* Status dos dados em cache */}
				<Card className="border-2 shadow-lg">
					<CardHeader>
						<CardTitle className="flex items-center gap-2">
							<Database className="h-5 w-5 text-blue-600" />
							Dados Disponíveis Offline
						</CardTitle>
						<CardDescription>Você ainda pode acessar os dados que foram sincronizados anteriormente</CardDescription>
					</CardHeader>
					<CardContent className="space-y-4">
						{loading ? (
							<div className="space-y-3">
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
								<Skeleton className="h-10 w-full" />
							</div>
						) : totalCachedItems > 0 ? (
							<div className="grid grid-cols-1 md:grid-cols-2 gap-3">
								{cachedData.shoppingLists > 0 && (
									<Link href="/lista">
										<Button
											variant="outline"
											className="w-full justify-between h-auto py-3 hover:bg-blue-50 hover:border-blue-500"
										>
											<div className="flex items-center gap-2">
												<List className="h-5 w-5 text-blue-600" />
												<span>Listas de Compras</span>
											</div>
											<Badge variant="secondary">{cachedData.shoppingLists}</Badge>
										</Button>
									</Link>
								)}

								{cachedData.stock > 0 && (
									<Link href="/estoque">
										<Button
											variant="outline"
											className="w-full justify-between h-auto py-3 hover:bg-green-50 hover:border-green-500"
										>
											<div className="flex items-center gap-2">
												<Package className="h-5 w-5 text-green-600" />
												<span>Estoque</span>
											</div>
											<Badge variant="secondary">{cachedData.stock}</Badge>
										</Button>
									</Link>
								)}

								{cachedData.products > 0 && (
									<Link href="/produtos">
										<Button
											variant="outline"
											className="w-full justify-between h-auto py-3 hover:bg-purple-50 hover:border-purple-500"
										>
											<div className="flex items-center gap-2">
												<Package className="h-5 w-5 text-purple-600" />
												<span>Produtos</span>
											</div>
											<Badge variant="secondary">{cachedData.products}</Badge>
										</Button>
									</Link>
								)}

								{cachedData.purchases > 0 && (
									<Link href="/compras">
										<Button
											variant="outline"
											className="w-full justify-between h-auto py-3 hover:bg-orange-50 hover:border-orange-500"
										>
											<div className="flex items-center gap-2">
												<ShoppingCart className="h-5 w-5 text-orange-600" />
												<span>Compras</span>
											</div>
											<Badge variant="secondary">{cachedData.purchases}</Badge>
										</Button>
									</Link>
								)}
							</div>
						) : (
							<div className="text-center py-6 text-gray-500">
								<p className="text-sm">
									Nenhum dado disponível offline ainda.
									<br />
									Conecte-se à internet para sincronizar seus dados.
								</p>
							</div>
						)}
					</CardContent>
				</Card>

				{/* Informações adicionais */}
				<Card className="border-blue-200 bg-blue-50">
					<CardContent className="pt-6">
						<div className="space-y-3 text-sm text-gray-700">
							<div className="flex items-start gap-2">
								<div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
									<span className="text-xs font-bold px-1">ℹ️</span>
								</div>
								<p>
									<strong>Modo Offline Ativo:</strong> Você pode visualizar dados sincronizados anteriormente, mas não
									pode fazer alterações até voltar online.
								</p>
							</div>
							<div className="flex items-start gap-2">
								<div className="bg-blue-500 text-white rounded-full p-1 mt-0.5">
									<span className="text-xs font-bold px-1">💾</span>
								</div>
								<p>
									<strong>Sincronização Automática:</strong> Quando a conexão for restaurada, todos os seus dados serão
									sincronizados automaticamente.
								</p>
							</div>
						</div>
					</CardContent>
				</Card>

				{/* Botões de ação */}
				<div className="flex flex-col sm:flex-row gap-3">
					<Link href="/" className="flex-1">
						<Button className="w-full" variant="outline">
							<ArrowLeft className="mr-2 h-4 w-4" />
							Voltar ao Início
						</Button>
					</Link>
					<Button className="flex-1" onClick={() => window.location.reload()}>
						Tentar Reconectar
					</Button>
				</div>
			</div>
		</div>
	)
}
