"use client"

import { motion } from "framer-motion"
import { Barcode, Calendar, List, MapPin, Package, ShoppingCart, Star, Store, Tag, TrendingUp } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

interface SelectionCardProps {
	type: string
	options: any[]
	searchTerm: string
	context?: any
	onSelect: (option: any, index: number) => void
}

export function SelectionCard({ type, options, searchTerm, context, onSelect }: SelectionCardProps) {
	const getCardContent = (option: any, _index: number) => {
		switch (type) {
			case "products":
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-green-100 rounded-lg text-green-600 flex-shrink-0">
							<Package className="h-4 w-4" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2 mb-1">
								<span className="font-semibold text-gray-900 truncate">{option.name}</span>
								{option.isFood && (
									<Badge variant="secondary" className="text-xs">
										🍽️
									</Badge>
								)}
							</div>
							<div className="flex flex-wrap gap-2 text-xs text-gray-600">
								{option.brand && (
									<span className="flex items-center gap-1">
										<Star className="h-3 w-3" />
										{option.brand}
									</span>
								)}
								{option.category && (
									<span className="flex items-center gap-1">
										<Tag className="h-3 w-3" />
										{option.category}
									</span>
								)}
								{option.packageSize && (
									<span className="flex items-center gap-1 font-semibold text-blue-600">📦 {option.packageSize}</span>
								)}
								{option.barcode && (
									<span className="flex items-center gap-1">
										<Barcode className="h-3 w-3" />
										{option.barcode}
									</span>
								)}
							</div>
						</div>
						{option.currentPrice && (
							<div className="text-right flex-shrink-0">
								<div className="text-lg font-bold text-green-600">R$ {option.currentPrice.toFixed(2)}</div>
								{option.marketName && <div className="text-xs text-gray-500">{option.marketName}</div>}
							</div>
						)}
					</div>
				)
			case "markets":
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-blue-100 rounded-lg text-blue-600 flex-shrink-0">
							<Store className="h-4 w-4" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-gray-900 truncate">{option.name}</div>
							{option.location && (
								<div className="flex items-center gap-1 text-xs text-gray-600 mt-1">
									<MapPin className="h-3 w-3" />
									{option.location}
								</div>
							)}
						</div>
						{option.productCount && (
							<Badge variant="outline" className="text-xs">
								{option.productCount} produtos
							</Badge>
						)}
					</div>
				)
			case "categories":
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-purple-100 rounded-lg text-purple-600 flex-shrink-0">
							{option.icon ? <span className="text-lg">{option.icon}</span> : <Tag className="h-4 w-4" />}
						</div>
						<div className="flex-1 min-w-0">
							<div className="flex items-center gap-2">
								<span className="font-semibold text-gray-900 truncate">{option.name}</span>
								{option.isFood && <Badge className="bg-green-100 text-green-700 text-xs">🍽️ Alimento</Badge>}
							</div>
							{option.productCount && <div className="text-xs text-gray-600 mt-1">{option.productCount} produtos</div>}
						</div>
					</div>
				)
			case "brands":
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-orange-100 rounded-lg text-orange-600 flex-shrink-0">
							<Star className="h-4 w-4" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-gray-900 truncate">{option.name}</div>
							<div className="text-xs text-gray-600 mt-1">{option.productCount} produtos cadastrados</div>
						</div>
						<Badge variant="outline" className="text-xs">
							<TrendingUp className="h-3 w-3 mr-1" />
							Marca
						</Badge>
					</div>
				)
			case "shopping-lists":
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-indigo-100 rounded-lg text-indigo-600 flex-shrink-0">
							<List className="h-4 w-4" />
						</div>
						<div className="flex-1 min-w-0">
							<div className="font-semibold text-gray-900 truncate">{option.name}</div>
							<div className="flex items-center gap-2 text-xs text-gray-600 mt-1">
								<span className="flex items-center gap-1">
									<ShoppingCart className="h-3 w-3" />
									{option.itemCount} itens
								</span>
								<span className="flex items-center gap-1">
									<Calendar className="h-3 w-3" />
									{new Date(option.updatedAt).toLocaleDateString("pt-BR")}
								</span>
							</div>
						</div>
						{option.status && (
							<Badge variant={option.status === "completed" ? "default" : "secondary"} className="text-xs">
								{option.status === "completed" ? "✅ Concluída" : "📝 Ativa"}
							</Badge>
						)}
					</div>
				)
			default:
				return (
					<div className="flex items-center gap-3 w-full">
						<div className="p-2 bg-gray-100 rounded-lg text-gray-600 flex-shrink-0">
							<Package className="h-4 w-4" />
						</div>
						<span className="font-semibold text-gray-900 truncate">{option.name}</span>
					</div>
				)
		}
	}

	const getTypeIcon = () => {
		switch (type) {
			case "products":
				return <Package className="h-4 w-4" />
			case "markets":
				return <Store className="h-4 w-4" />
			case "categories":
				return <Tag className="h-4 w-4" />
			case "brands":
				return <Star className="h-4 w-4" />
			case "shopping-lists":
				return <List className="h-4 w-4" />
			default:
				return <Package className="h-4 w-4" />
		}
	}

	const getTypeLabel = () => {
		switch (type) {
			case "products":
				return "Produtos"
			case "markets":
				return "Mercados"
			case "categories":
				return "Categorias"
			case "brands":
				return "Marcas"
			case "shopping-lists":
				return "Listas"
			default:
				return "Opções"
		}
	}

	return (
		<motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
			<Card className="p-4 bg-gradient-to-br from-white to-blue-50 border-blue-200 shadow-lg">
				{/* Header */}
				<div className="flex items-center gap-3 mb-4">
					<div className="p-2 bg-blue-100 rounded-lg text-blue-600">{getTypeIcon()}</div>
					<div>
						<h3 className="font-semibold text-gray-900">{getTypeLabel()}</h3>
						<p className="text-sm text-gray-600">
							{options.length} opções para "{searchTerm}"
						</p>
					</div>
				</div>

				{/* Options Grid */}
				<div className="grid gap-2 max-h-64 overflow-y-auto">
					{options.map((option, index) => (
						<motion.div
							key={option.id || index}
							initial={{ opacity: 0, x: -10 }}
							animate={{ opacity: 1, x: 0 }}
							transition={{ duration: 0.2, delay: index * 0.05 }}
						>
							<Button
								variant="ghost"
								className="w-full justify-start h-auto p-3 hover:bg-blue-100 hover:shadow-md transition-all duration-200 border border-transparent hover:border-blue-200 rounded-lg"
								onClick={() => onSelect(option, index)}
							>
								{getCardContent(option, index)}
							</Button>
						</motion.div>
					))}
				</div>

				{/* Footer */}
				<div className="mt-4 pt-3 border-t border-blue-100">
					<p className="text-xs text-blue-600 text-center">💡 Clique em uma opção para continuar</p>
				</div>
			</Card>
		</motion.div>
	)
}
