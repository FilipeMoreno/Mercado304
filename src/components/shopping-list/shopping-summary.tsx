import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ShoppingListItem {
	id: string;
	quantity: number;
	estimatedPrice?: number;
	isChecked: boolean;
	bestPriceAlert?: any;
	productName?: string;
	productUnit?: string;
	product?: {
		id: string;
		name: string;
		unit: string;
		brand?: {
			name: string;
		};
		category?: {
			id: string;
			name: string;
			icon?: string;
		};
	};
}

interface ShoppingSummaryProps {
	items: ShoppingListItem[];
	totalItems: number;
	completedItems: number;
}

export function ShoppingSummary({ items, totalItems, completedItems }: ShoppingSummaryProps) {
	const totalEstimated = items.reduce(
		(sum, item) => sum + item.quantity * (item.estimatedPrice || 0),
		0
	);

	const completedTotal = items
		.filter((item) => item.isChecked)
		.reduce(
			(sum, item) => sum + item.quantity * (item.estimatedPrice || 0),
			0
		);

	return (
		<Card>
			<CardHeader>
				<CardTitle>Resumo</CardTitle>
			</CardHeader>
			<CardContent>
				<div className="grid grid-cols-2 md:grid-cols-5 gap-4">
					<div>
						<div className="text-2xl font-bold text-blue-600">
							{totalItems}
						</div>
						<div className="text-sm text-gray-600">Total de Itens</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-green-600">
							{completedItems}
						</div>
						<div className="text-sm text-gray-600">Concluídos</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-yellow-600">
							{totalItems - completedItems}
						</div>
						<div className="text-sm text-gray-600">Pendentes</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-purple-600">
							R$ {totalEstimated.toFixed(2)}
						</div>
						<div className="text-sm text-gray-600">Total Estimado</div>
					</div>
					<div>
						<div className="text-2xl font-bold text-green-600">
							R$ {completedTotal.toFixed(2)}
						</div>
						<div className="text-sm text-gray-600">Total Concluído</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}