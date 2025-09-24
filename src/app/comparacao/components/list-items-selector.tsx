"use client"

import { Check, ChevronDown, ChevronUp } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

interface ListItem {
	id: string
	productId: string
	productName: string
	quantity: number
	unit: string
	notes?: string
}

interface ListItemsSelectorProps {
	listItems: ListItem[]
	selectedItemIds: string[]
	onSelectedItemsChange: (itemIds: string[]) => void
	isLoading?: boolean
}

export function ListItemsSelector({
	listItems,
	selectedItemIds,
	onSelectedItemsChange,
	isLoading = false,
}: ListItemsSelectorProps) {
	const [isExpanded, setIsExpanded] = useState(false)

	const handleItemToggle = (itemId: string) => {
		if (selectedItemIds.includes(itemId)) {
			onSelectedItemsChange(selectedItemIds.filter(id => id !== itemId))
		} else {
			onSelectedItemsChange([...selectedItemIds, itemId])
		}
	}

	const handleSelectAll = () => {
		if (selectedItemIds.length === listItems.length) {
			onSelectedItemsChange([])
		} else {
			onSelectedItemsChange(listItems.map(item => item.id))
		}
	}

	const selectedItems = listItems.filter(item => selectedItemIds.includes(item.id))
	const allSelected = selectedItemIds.length === listItems.length
	const _someSelected = selectedItemIds.length > 0 && selectedItemIds.length < listItems.length

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center justify-between">
					<span>Selecionar Itens Específicos</span>
					<Button
						variant="ghost"
						size="sm"
						onClick={() => setIsExpanded(!isExpanded)}
						className="h-auto p-1"
					>
						{isExpanded ? (
							<ChevronUp className="h-4 w-4" />
						) : (
							<ChevronDown className="h-4 w-4" />
						)}
					</Button>
				</CardTitle>
			</CardHeader>
			{isExpanded && (
				<CardContent className="space-y-4">
					<div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
						<div className="flex items-center space-x-2">
							<Checkbox
								id="select-all"
								checked={allSelected}
								onCheckedChange={handleSelectAll}
								disabled={isLoading}
							/>
							<Label htmlFor="select-all" className="font-medium">
								{allSelected ? "Desmarcar Todos" : "Selecionar Todos"}
							</Label>
						</div>
						<div className="text-sm text-gray-600">
							{selectedItemIds.length} de {listItems.length} itens selecionados
						</div>
					</div>

					<div className="space-y-2 max-h-60 overflow-y-auto">
						{listItems.map((item) => {
							const isSelected = selectedItemIds.includes(item.id)
							return (
								<div
									key={item.id}
									className={cn(
										"flex items-center space-x-3 p-3 rounded-lg border transition-colors",
										isSelected ? "bg-blue-50 border-blue-200" : "bg-white border-gray-200 hover:bg-gray-50"
									)}
								>
									<Checkbox
										id={`item-${item.id}`}
										checked={isSelected}
										onCheckedChange={() => handleItemToggle(item.id)}
										disabled={isLoading}
									/>
									<div className="flex-1 min-w-0">
										<Label htmlFor={`item-${item.id}`} className="font-medium cursor-pointer">
											{item.productName}
										</Label>
										<div className="text-sm text-gray-600 mt-1">
											Quantidade: {item.quantity} {item.unit}
											{item.notes && (
												<span className="ml-2 text-gray-500">• {item.notes}</span>
											)}
										</div>
									</div>
									{isSelected && (
										<Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
									)}
								</div>
							)
						})}
					</div>

					{selectedItems.length > 0 && (
						<div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
							<h4 className="font-medium text-blue-800 mb-2">Itens Selecionados:</h4>
							<div className="flex flex-wrap gap-2">
								{selectedItems.map((item) => (
									<div
										key={item.id}
										className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full border border-blue-200"
									>
										<span className="font-medium">{item.productName}</span>
										<span className="text-blue-600">({item.quantity} {item.unit})</span>
									</div>
								))}
							</div>
						</div>
					)}
				</CardContent>
			)}
		</Card>
	)
}
