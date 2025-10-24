"use client"

import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { BarChart3, ChevronLeft, ChevronRight, Plus, ShoppingCart, Store } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface RecentPurchase {
	id: string
	quantity: number
	unitPrice: number
	totalPrice: number
	purchaseDate: string
	market?: {
		id?: string
		name: string
	}
}

interface ShoppingList {
	id: string
	name: string
	isActive: boolean
}

interface ProductRecentPurchasesCardProps {
	productId: string
	productName: string
	productUnit: string
	recentPurchases: RecentPurchase[]
}

export function ProductRecentPurchasesCard({
	productId,
	productName,
	productUnit,
	recentPurchases,
}: ProductRecentPurchasesCardProps) {
	const [purchasesPage, setPurchasesPage] = useState(1)
	const [shoppingLists, setShoppingLists] = useState<ShoppingList[]>([])
	const [selectedListId, setSelectedListId] = useState<string>("")
	const [quantity, setQuantity] = useState<number>(1)
	const [isDialogOpen, setIsDialogOpen] = useState(false)
	const [isAddingToList, setIsAddingToList] = useState(false)
	const [isLoadingLists, setIsLoadingLists] = useState(false)

	const purchasesPerPage = 5
	const listSelectId = useId()
	const quantityId = useId()


	// Buscar listas de compras quando o dialog abre
	useEffect(() => {
		async function fetchShoppingLists() {
			setIsLoadingLists(true)
			try {
				const response = await fetch("/api/shopping-lists")
				if (response.ok) {
					const data = await response.json()
					setShoppingLists(data.lists || [])
				}
			} catch (error) {
				console.error("Erro ao buscar listas:", error)
				toast.error("Erro ao buscar listas de compras")
			} finally {
				setIsLoadingLists(false)
			}
		}

		if (isDialogOpen && shoppingLists.length === 0) {
			fetchShoppingLists()
		}
	}, [isDialogOpen, shoppingLists.length])

	const handleAddToList = async () => {
		if (!selectedListId) {
			toast.error("Selecione uma lista de compras")
			return
		}

		if (quantity <= 0) {
			toast.error("Quantidade deve ser maior que zero")
			return
		}

		setIsAddingToList(true)
		try {
			const response = await fetch(`/api/shopping-lists/${selectedListId}/items`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					productId,
					productName,
					quantity,
					productUnit,
				}),
			})

			if (response.ok) {
				const selectedList = shoppingLists.find((list) => list.id === selectedListId)
				toast.success(`${productName} adicionado à lista "${selectedList?.name}" com sucesso!`)
				setIsDialogOpen(false)
				setSelectedListId("")
				setQuantity(1)
			} else {
				const error = await response.json()
				toast.error(error.error || "Erro ao adicionar à lista")
			}
		} catch (error) {
			console.error("Erro ao adicionar à lista:", error)
			toast.error("Erro ao adicionar produto à lista")
		} finally {
			setIsAddingToList(false)
		}
	}

	const handleCreateNewList = async () => {
		const listName = prompt("Nome da nova lista:")
		if (!listName?.trim()) return

		try {
			const response = await fetch("/api/shopping-lists", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					name: listName.trim(),
				}),
			})

			if (response.ok) {
				const newList = await response.json()
				setShoppingLists((prev) => [...prev, newList])
				setSelectedListId(newList.id)
				toast.success(`Lista "${listName}" criada com sucesso!`)
			} else {
				toast.error("Erro ao criar nova lista")
			}
		} catch (error) {
			console.error("Erro ao criar lista:", error)
			toast.error("Erro ao criar nova lista")
		}
	}

	// Verificar se há compras válidas
	const validPurchases = recentPurchases?.filter(purchase => 
		purchase?.id && 
		purchase?.purchaseDate && 
		purchase?.quantity && 
		purchase?.unitPrice &&
		purchase?.totalPrice
	) || []


	if (validPurchases.length === 0) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<BarChart3 className="h-5 w-5" />
						Compras Recentes
					</CardTitle>
					<CardDescription>Histórico das últimas compras deste produto</CardDescription>
				</CardHeader>
				<CardContent>
					<div className="flex flex-col items-center justify-center py-8 text-center">
						<div className="p-3 bg-gray-100 dark:bg-gray-800 rounded-full mb-3">
							<ShoppingCart className="h-6 w-6 text-gray-400" />
						</div>
						<h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1">Nenhuma compra encontrada</h3>
						<p className="text-xs text-gray-500 dark:text-gray-400 max-w-sm">
							Este produto ainda não foi comprado. Adicione-o à sua lista de compras para começar a acompanhar.
						</p>
						<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
							<DialogTrigger asChild>
								<Button className="mt-4" size="sm">
									<Plus className="h-4 w-4 mr-2" />
									Adicionar à Lista
								</Button>
							</DialogTrigger>
							<DialogContent className="sm:max-w-md">
								<DialogHeader>
									<DialogTitle>Adicionar à Lista de Compras</DialogTitle>
									<DialogDescription>Selecione uma lista para adicionar {productName}</DialogDescription>
								</DialogHeader>
								<div className="space-y-4">
									<div className="space-y-2">
										<Label htmlFor={listSelectId}>Lista de Compras</Label>
										<Select value={selectedListId} onValueChange={setSelectedListId} disabled={isLoadingLists}>
											<SelectTrigger>
												<SelectValue placeholder={isLoadingLists ? "Carregando..." : "Selecione uma lista"} />
											</SelectTrigger>
											<SelectContent>
												{shoppingLists.map((list) => (
													<SelectItem key={list.id} value={list.id}>
														{list.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<Button variant="outline" size="sm" onClick={handleCreateNewList} className="w-full">
											<Plus className="h-4 w-4 mr-2" />
											Criar Nova Lista
										</Button>
									</div>
									<div className="space-y-2">
										<Label htmlFor={quantityId}>Quantidade</Label>
										<Input
											id={quantityId}
											type="number"
											min="1"
											value={quantity}
											onChange={(e) => setQuantity(Number(e.target.value))}
											placeholder="1"
										/>
									</div>
									<div className="flex justify-end gap-2">
										<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
											Cancelar
										</Button>
										<Button onClick={handleAddToList} disabled={!selectedListId || isAddingToList}>
											{isAddingToList ? "Adicionando..." : "Adicionar"}
										</Button>
									</div>
								</div>
							</DialogContent>
						</Dialog>
					</div>
				</CardContent>
			</Card>
		)
	}

	const paginatedPurchases = validPurchases.slice(
		(purchasesPage - 1) * purchasesPerPage,
		purchasesPage * purchasesPerPage,
	)

	return (
		<Card>
			<CardHeader>
				<div className="flex justify-between items-center">
					<div>
						<CardTitle className="flex items-center gap-2">
							<BarChart3 className="h-5 w-5" />
							Compras Recentes
						</CardTitle>
						<CardDescription>Histórico das últimas compras deste produto</CardDescription>
					</div>
					<div className="flex items-center gap-2">
						<span className="text-sm text-gray-600 dark:text-gray-400">
							{(purchasesPage - 1) * purchasesPerPage + 1}-
							{Math.min(purchasesPage * purchasesPerPage, validPurchases.length)} de {validPurchases.length}
						</span>
						<div className="flex gap-1">
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => setPurchasesPage((p) => Math.max(1, p - 1))}
								disabled={purchasesPage === 1}
							>
								<ChevronLeft className="h-4 w-4" />
							</Button>
							<Button
								variant="outline"
								size="icon"
								className="h-8 w-8"
								onClick={() => setPurchasesPage((p) => p + 1)}
								disabled={purchasesPage * purchasesPerPage >= validPurchases.length}
							>
								<ChevronRight className="h-4 w-4" />
							</Button>
						</div>
					</div>
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{paginatedPurchases.map((purchase) => (
						<div key={purchase.id} className="flex items-center justify-between p-3 border rounded-lg">
							<div className="flex items-center gap-3">
								<Store className="h-4 w-4 text-gray-400" />
								<div>
									<p className="font-medium">{purchase.market?.name || "Mercado não informado"}</p>
									<p className="text-sm text-gray-600 dark:text-gray-400">
										{format(new Date(purchase.purchaseDate), "dd/MM/yyyy", { locale: ptBR })} • {purchase.quantity}{" "}
										{productUnit}
									</p>
								</div>
							</div>
							<div className="text-right">
								<p className="font-medium">R$ {purchase.totalPrice.toFixed(2)}</p>
								<p className="text-sm text-gray-600 dark:text-gray-400">
									R$ {purchase.unitPrice.toFixed(2)}/{productUnit}
								</p>
							</div>
						</div>
					))}
				</div>

				{/* Botão para adicionar à lista */}
				<div className="mt-4 pt-4 border-t">
					<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
						<DialogTrigger asChild>
							<Button className="w-full" variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Adicionar à Lista de Compras
							</Button>
						</DialogTrigger>
						<DialogContent className="sm:max-w-md">
							<DialogHeader>
								<DialogTitle>Adicionar à Lista de Compras</DialogTitle>
								<DialogDescription>Selecione uma lista para adicionar {productName}</DialogDescription>
							</DialogHeader>
							<div className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor={listSelectId}>Lista de Compras</Label>
									<Select value={selectedListId} onValueChange={setSelectedListId} disabled={isLoadingLists}>
										<SelectTrigger>
											<SelectValue placeholder={isLoadingLists ? "Carregando..." : "Selecione uma lista"} />
										</SelectTrigger>
										<SelectContent>
											{shoppingLists.map((list) => (
												<SelectItem key={list.id} value={list.id}>
													{list.name}
												</SelectItem>
											))}
										</SelectContent>
									</Select>
									<Button variant="outline" size="sm" onClick={handleCreateNewList} className="w-full">
										<Plus className="h-4 w-4 mr-2" />
										Criar Nova Lista
									</Button>
								</div>
								<div className="space-y-2">
									<Label htmlFor={quantityId}>Quantidade</Label>
									<Input
										id={quantityId}
										type="number"
										min="1"
										value={quantity}
										onChange={(e) => setQuantity(Number(e.target.value))}
										placeholder="1"
									/>
								</div>
								<div className="flex justify-end gap-2">
									<Button variant="outline" onClick={() => setIsDialogOpen(false)}>
										Cancelar
									</Button>
									<Button onClick={handleAddToList} disabled={!selectedListId || isAddingToList}>
										{isAddingToList ? "Adicionando..." : "Adicionar"}
									</Button>
								</div>
							</div>
						</DialogContent>
					</Dialog>
				</div>
			</CardContent>
		</Card>
	)
}
