import { ArrowLeft, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export default function EditStockLoading() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Button variant="outline" size="sm" disabled>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Voltar
				</Button>
				<div>
					<h1 className="text-3xl font-bold">Editar Item do Estoque</h1>
					<p className="text-gray-600 mt-2">Atualize as informações do item no estoque</p>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Informações do Item
							</CardTitle>
							<CardDescription>Edite os detalhes do item no estoque</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="space-y-2">
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-10 w-full" />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-28" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>

							<div className="space-y-2">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-10 w-full" />
							</div>

							<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-20" />
									<Skeleton className="h-10 w-full" />
								</div>
							</div>

							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-10 w-full" />
							</div>

							<div className="flex gap-2 pt-4">
								<Skeleton className="h-10 flex-1" />
								<Skeleton className="h-10 w-24" />
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="space-y-4">
					<Card>
						<CardHeader>
							<CardTitle className="text-base">Produto Atual</CardTitle>
						</CardHeader>
						<CardContent className="space-y-3">
							<div>
								<Skeleton className="h-5 w-32 mb-1" />
								<Skeleton className="h-4 w-24" />
							</div>

							<div className="space-y-2">
								<Skeleton className="h-4 w-28" />
								<Skeleton className="h-4 w-20" />
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardHeader>
							<CardTitle className="text-base">Informações</CardTitle>
						</CardHeader>
						<CardContent>
							<Skeleton className="h-4 w-40" />
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	)
}
