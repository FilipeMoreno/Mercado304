"use client"

import { BarChart3, Edit, MoreHorizontal, Package, Trash2 } from "lucide-react"
import Link from "next/link"
import * as React from "react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ProductCardProps {
	product: any
	onDelete?: (product: any) => void
}

export const ProductCard = React.memo(function ProductCard({ product, onDelete }: ProductCardProps) {
	return (
		<Card className="group hover:shadow-lg transition-all duration-200 h-full flex flex-col">
			<CardHeader className="pb-3">
				<div className="flex items-center gap-3 mb-2">
					<div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center shadow-sm">
						<Package className="h-5 w-5 text-orange-600" />
					</div>
					<div className="flex-1 min-w-0">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<CardTitle className="text-lg font-semibold text-gray-900 truncate cursor-help">
										{product.name}
									</CardTitle>
								</TooltipTrigger>
								<TooltipContent side="top" className="max-w-xs">
									<p>{product.name}</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
						<CardDescription className="mt-1">
							{product.category?.name && (
								<span className="inline-flex items-center text-xs text-gray-600">
									{product.category.icon} {product.category.name}
								</span>
							)}
						</CardDescription>
					</div>
				</div>
			</CardHeader>
			<CardContent className="flex-1 flex flex-col">
				<div className="space-y-2 mb-4">
					{product.brand && (
						<div className="flex items-center gap-1 text-sm text-gray-600">
							<span className="font-medium">Marca:</span>
							<span>{product.brand.name}</span>
						</div>
					)}
					{product.unit && (
						<Badge variant="secondary" className="w-fit">
							{product.unit}
						</Badge>
					)}
				</div>
				<div className="flex gap-2 mt-auto">
					<Link href={`/produtos/${product.id}`} className="flex-1">
						<Button variant="outline" className="w-full justify-center">
							<BarChart3 className="h-4 w-4 mr-2" />
							Ver Detalhes
						</Button>
					</Link>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="outline" size="icon">
								<MoreHorizontal className="h-4 w-4" />
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem asChild>
								<Link href={`/produtos/${product.id}/editar`} className="flex items-center">
									<Edit className="h-4 w-4 mr-2" />
									Editar
								</Link>
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => onDelete?.(product)} className="text-red-600 focus:text-red-600">
								<Trash2 className="h-4 w-4 mr-2" />
								Excluir
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardContent>
		</Card>
	)
})
