"use client"

import { AlertCircle, Apple, ArrowLeft, DollarSign, Edit, Package2, TrendingUp } from "lucide-react"
import { useParams, useRouter } from "next/navigation"
import { Suspense, useState } from "react"
import { KitDetailsSkeleton } from "@/components/kits/kit-details-skeleton"
import { KitPriceComparison } from "@/components/kits/kit-price-comparison"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
	useProductKitNutritionQuery,
	useProductKitPriceQuery,
	useProductKitQuery,
	useProductKitStockQuery,
} from "@/hooks/use-react-query"

export default function KitDetailsPage() {
	const router = useRouter()
	const params = useParams()
	const kitId = params.id as string

	const [activeTab, setActiveTab] = useState("details")

	// Query principal do kit
	const { data: kitData, isLoading, error } = useProductKitQuery(kitId)

	// Lazy queries para outras tabs
	const { data: nutritionData, isLoading: isLoadingNutrition } = useProductKitNutritionQuery(
		activeTab === "nutrition" ? kitId : "",
	)

	const { data: stockData, isLoading: isLoadingStock } = useProductKitStockQuery(activeTab === "stock" ? kitId : "")

	const { data: priceData, isLoading: isLoadingPrice } = useProductKitPriceQuery(activeTab === "price" ? kitId : "")

	if (isLoading) {
		return (
			<div className="container mx-auto py-8 px-4">
				<KitDetailsSkeleton />
			</div>
		)
	}

	if (error || !kitData?.data) {
		return (
			<div className="container mx-auto py-8 px-4">
				<Card className="border-destructive">
					<CardContent className="p-6">
						<div className="flex items-center gap-3">
							<AlertCircle className="size-8 text-destructive" />
							<div>
								<h3 className="font-semibold text-destructive">Erro ao carregar kit</h3>
								<p className="text-sm text-muted-foreground mt-1">
									{error instanceof Error ? error.message : "Kit não encontrado"}
								</p>
							</div>
						</div>
						<Button variant="outline" className="mt-4" onClick={() => router.push("/produtos/kits")}>
							<ArrowLeft className="size-4 mr-2" />
							Voltar para Kits
						</Button>
					</CardContent>
				</Card>
			</div>
		)
	}

	const kit = kitData.data

	return (
		<div className="container mx-auto py-8 px-4">
			<div className="space-y-6">
				{/* Header */}
				<div className="flex items-start justify-between">
					<div className="flex items-start gap-3">
						<Button variant="ghost" size="icon" onClick={() => router.push("/produtos/kits")}>
							<ArrowLeft className="size-5" />
						</Button>
						<div>
							<div className="flex items-center gap-2">
								<Package2 className="size-8 text-primary" />
								<h1 className="text-3xl font-bold tracking-tight">{kit.kitProduct.name}</h1>
								<Badge variant={kit.isActive ? "default" : "secondary"}>{kit.isActive ? "Ativo" : "Inativo"}</Badge>
							</div>
							{kit.description && <p className="text-muted-foreground mt-2">{kit.description}</p>}
						</div>
					</div>

					<Button variant="outline" onClick={() => router.push(`/produtos/kits/${kitId}/editar`)}>
						<Edit className="size-4 mr-2" />
						Editar
					</Button>
				</div>

				{/* Tabs */}
				<Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
					<TabsList className="grid w-full grid-cols-4">
						<TabsTrigger value="details">
							<Package2 className="size-4 mr-2" />
							Detalhes
						</TabsTrigger>
						<TabsTrigger value="stock">
							<TrendingUp className="size-4 mr-2" />
							Estoque
						</TabsTrigger>
						<TabsTrigger value="nutrition">
							<Apple className="size-4 mr-2" />
							Nutrição
						</TabsTrigger>
						<TabsTrigger value="price">
							<DollarSign className="size-4 mr-2" />
							Preço
						</TabsTrigger>
					</TabsList>

					{/* Details Tab */}
					<TabsContent value="details" className="space-y-4">
						<Card>
							<CardHeader>
								<CardTitle>Informações do Kit</CardTitle>
								<CardDescription>Detalhes básicos e produtos inclusos</CardDescription>
							</CardHeader>
							<CardContent className="space-y-4">
								<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
									<div>
										<p className="text-sm text-muted-foreground">Nome</p>
										<p className="font-medium">{kit.kitProduct.name}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Status</p>
										<Badge variant={kit.isActive ? "default" : "secondary"}>{kit.isActive ? "Ativo" : "Inativo"}</Badge>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Código de Barras</p>
										<p className="font-medium font-mono">{kit.barcode || "Não informado"}</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Marca</p>
										<p className="font-medium">
											{kit.brand?.name || "Não informada"}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Categoria</p>
										<p className="font-medium">
											{kit.category?.name || "Não informada"}
										</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Total de Produtos</p>
										<p className="font-medium">{kit.items.length} produtos</p>
									</div>
									<div>
										<p className="text-sm text-muted-foreground">Unidades Totais</p>
										<p className="font-medium">
											{kit.items.reduce((sum: number, item: any) => sum + item.quantity, 0)} unidades
										</p>
									</div>
								</div>

								<Separator />

								<div>
									<h3 className="font-semibold mb-3">Produtos Inclusos</h3>
									<div className="space-y-2">
										{kit.items.map((item: any) => (
											<Card key={item.id}>
												<CardContent className="p-4">
													<div className="flex items-center justify-between">
														<div className="flex items-center gap-3">
															<Badge className="text-base">{item.quantity}x</Badge>
															<div>
																<p className="font-medium">{item.product.name}</p>
																<div className="flex items-center gap-2 mt-1">
																	{item.product.brand && (
																		<Badge variant="outline" className="text-xs">
																			{item.product.brand.name}
																		</Badge>
																	)}
																	{item.product.category && (
																		<Badge variant="outline" className="text-xs">
																			{item.product.category.name}
																		</Badge>
																	)}
																</div>
															</div>
														</div>
														<Badge variant="secondary">{item.product.unit}</Badge>
													</div>
												</CardContent>
											</Card>
										))}
									</div>
								</div>
							</CardContent>
						</Card>
					</TabsContent>

					{/* Stock Tab */}
					<TabsContent value="stock" className="space-y-4">
						<Suspense fallback={<Skeleton className="h-64 w-full" />}>
							{isLoadingStock ? (
								<Card>
									<CardContent className="p-6 space-y-4">
										<Skeleton className="h-8 w-48" />
										<Skeleton className="h-24 w-full" />
										<Skeleton className="h-24 w-full" />
									</CardContent>
								</Card>
							) : stockData?.data ? (
								<>
									<Card>
										<CardHeader>
											<CardTitle>Disponibilidade em Estoque</CardTitle>
											<CardDescription>Quantos kits completos podem ser montados</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-4">
												<div className="flex items-center justify-between p-4 bg-secondary/30 rounded-lg">
													<div>
														<p className="text-sm text-muted-foreground">Kits Disponíveis</p>
														<p className="text-3xl font-bold text-primary">{stockData.data.availableQuantity}</p>
													</div>
													<Badge
														variant={
															stockData.data.availableQuantity === 0
																? "destructive"
																: stockData.data.availableQuantity <= 3
																	? "secondary"
																	: "default"
														}
														className="text-lg py-2 px-4"
													>
														{stockData.data.isAvailable ? "Disponível" : "Sem Estoque"}
													</Badge>
												</div>

												{stockData.data.limitingProduct && (
													<div className="p-4 border rounded-lg">
														<p className="text-sm text-muted-foreground mb-2">Produto Limitante</p>
														<p className="font-medium">{stockData.data.limitingProduct.name}</p>
														<p className="text-sm text-muted-foreground mt-1">
															Disponível: {stockData.data.limitingProduct.availableQuantity} | Necessário:{" "}
															{stockData.data.limitingProduct.requiredQuantity}
														</p>
													</div>
												)}
											</div>
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Estoque por Produto</CardTitle>
											<CardDescription>Detalhamento do estoque de cada produto do kit</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-2">
												{stockData.data.itemsStock.map((item: any) => (
													<div key={item.productId} className="flex items-center justify-between p-3 border rounded-lg">
														<div>
															<p className="font-medium">{item.productName}</p>
															<p className="text-sm text-muted-foreground">
																Necessário: {item.requiredQuantity} por kit
															</p>
														</div>
														<div className="text-right">
															<p className="font-semibold">{item.availableQuantity} disponíveis</p>
															<Badge variant={item.isAvailable ? "default" : "destructive"} className="mt-1">
																{item.isAvailable ? "OK" : "Insuficiente"}
															</Badge>
														</div>
													</div>
												))}
											</div>
										</CardContent>
									</Card>
								</>
							) : (
								<Card>
									<CardContent className="p-6">
										<p className="text-muted-foreground">Não foi possível carregar informações de estoque</p>
									</CardContent>
								</Card>
							)}
						</Suspense>
					</TabsContent>

					{/* Nutrition Tab */}
					<TabsContent value="nutrition" className="space-y-4">
						<Suspense fallback={<Skeleton className="h-64 w-full" />}>
							{isLoadingNutrition ? (
								<Card>
									<CardContent className="p-6 space-y-4">
										<Skeleton className="h-8 w-48" />
										<Skeleton className="h-32 w-full" />
									</CardContent>
								</Card>
							) : nutritionData?.data ? (
								<>
									<Card>
										<CardHeader>
											<CardTitle>Informações Nutricionais Totais do Kit</CardTitle>
											<CardDescription>Valores agregados de todos os produtos do kit</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="grid grid-cols-2 md:grid-cols-3 gap-4">
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Calorias</p>
													<p className="text-2xl font-bold">{nutritionData.data.calories} kcal</p>
												</div>
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Proteínas</p>
													<p className="text-2xl font-bold">{nutritionData.data.proteins}g</p>
												</div>
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Carboidratos</p>
													<p className="text-2xl font-bold">{nutritionData.data.carbohydrates}g</p>
												</div>
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Gorduras Totais</p>
													<p className="text-2xl font-bold">{nutritionData.data.totalFat}g</p>
												</div>
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Fibras</p>
													<p className="text-2xl font-bold">{nutritionData.data.fiber}g</p>
												</div>
												<div className="p-3 border rounded-lg">
													<p className="text-sm text-muted-foreground">Sódio</p>
													<p className="text-2xl font-bold">{nutritionData.data.sodium}mg</p>
												</div>
											</div>

											{nutritionData.data.allergensContains.length > 0 && (
												<>
													<Separator className="my-4" />
													<div>
														<p className="text-sm font-semibold mb-2">Contém Alérgenos:</p>
														<div className="flex flex-wrap gap-2">
															{nutritionData.data.allergensContains.map((allergen: string) => (
																<Badge key={allergen} variant="destructive">
																	{allergen}
																</Badge>
															))}
														</div>
													</div>
												</>
											)}
										</CardContent>
									</Card>

									<Card>
										<CardHeader>
											<CardTitle>Valores Nutricionais por Produto</CardTitle>
											<CardDescription>Informação nutricional individual de cada item do kit</CardDescription>
										</CardHeader>
										<CardContent>
											<div className="space-y-3">
												{kit.items.map((item: any) => (
													<Card key={item.id} className="border-muted">
														<CardContent className="p-4">
															<div className="flex items-center justify-between mb-3">
																<div>
																	<h4 className="font-semibold">{item.product.name}</h4>
																	<p className="text-sm text-muted-foreground">
																		{item.quantity}x {item.product.unit}
																	</p>
																</div>
																{item.product.category?.isFood && <Badge variant="secondary">Alimento</Badge>}
															</div>

															{item.product.nutritionalInfo ? (
																<div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
																	{item.product.nutritionalInfo.calories && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Calorias:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.calories * item.quantity).toFixed(0)} kcal
																			</span>
																		</div>
																	)}
																	{item.product.nutritionalInfo.proteins && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Proteínas:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.proteins * item.quantity).toFixed(1)}g
																			</span>
																		</div>
																	)}
																	{item.product.nutritionalInfo.carbohydrates && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Carboidratos:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.carbohydrates * item.quantity).toFixed(1)}g
																			</span>
																		</div>
																	)}
																	{item.product.nutritionalInfo.totalFat && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Gorduras:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.totalFat * item.quantity).toFixed(1)}g
																			</span>
																		</div>
																	)}
																	{item.product.nutritionalInfo.fiber && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Fibras:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.fiber * item.quantity).toFixed(1)}g
																			</span>
																		</div>
																	)}
																	{item.product.nutritionalInfo.sodium && (
																		<div className="flex justify-between p-2 bg-secondary/20 rounded-sm">
																			<span className="text-muted-foreground">Sódio:</span>
																			<span className="font-medium">
																				{(item.product.nutritionalInfo.sodium * item.quantity).toFixed(0)}mg
																			</span>
																		</div>
																	)}
																</div>
															) : (
																<p className="text-sm text-muted-foreground">
																	Informações nutricionais não disponíveis
																</p>
															)}
														</CardContent>
													</Card>
												))}
											</div>
										</CardContent>
									</Card>
								</>
							) : (
								<Card>
									<CardContent className="p-6">
										<p className="text-muted-foreground">Informações nutricionais não disponíveis para este kit</p>
									</CardContent>
								</Card>
							)}
						</Suspense>
					</TabsContent>

					{/* Price Tab */}
					<TabsContent value="price" className="space-y-4">
						<Suspense fallback={<Skeleton className="h-64 w-full" />}>
							{isLoadingPrice ? (
								<Card>
									<CardContent className="p-6 space-y-4">
										<Skeleton className="h-8 w-48" />
										<Skeleton className="h-24 w-full" />
									</CardContent>
								</Card>
							) : (
								<>
									{/* Quick Price Analysis Component */}
									<KitPriceComparison kitId={kitId} kitName={kit.kitProduct.name} items={kit.items} />

									{/* Existing Price Data */}
									{priceData?.data ? (
										<>
											{/* Preço registrado do kit */}
											{priceData.data.kitRegisteredPrice && (
												<Card className="border-green-500/50">
													<CardHeader>
														<CardTitle>Preço Registrado do Kit</CardTitle>
														<CardDescription>
															Último preço registrado para este kit
														</CardDescription>
													</CardHeader>
													<CardContent>
														<div className="flex items-center justify-between p-6 bg-green-50 dark:bg-green-950/30 rounded-lg">
															<div className="flex-1">
																<p className="text-sm text-muted-foreground mb-1">
																	{kit.kitProduct.name}
																</p>
																<p className="text-4xl font-bold text-green-700 dark:text-green-400">
																	R$ {priceData.data.kitRegisteredPrice.toFixed(2)}
																</p>
																<div className="flex items-center gap-2 mt-2">
																	<Badge variant="outline" className="text-xs">
																		{priceData.data.kitPriceSource === "purchase" ? "Compra" : "Registro"}
																	</Badge>
																	{priceData.data.kitPriceMarketName && (
																		<Badge variant="secondary" className="text-xs">
																			{priceData.data.kitPriceMarketName}
																		</Badge>
																	)}
																	{priceData.data.kitPriceDate && (
																		<span className="text-xs text-muted-foreground">
																			{new Date(priceData.data.kitPriceDate).toLocaleDateString("pt-BR")}
																		</span>
																	)}
																</div>
															</div>
															<DollarSign className="size-16 text-green-500/30" />
														</div>
													</CardContent>
												</Card>
											)}

											{/* Soma dos produtos individuais */}
											<Card>
												<CardHeader>
													<CardTitle>Preços dos Produtos Individuais</CardTitle>
													<CardDescription>Soma dos últimos preços registrados para cada produto</CardDescription>
												</CardHeader>
												<CardContent>
													<div className="flex items-center justify-between p-6 bg-primary/10 rounded-lg mb-4">
														<div>
															<p className="text-sm text-muted-foreground">Soma dos Produtos Individuais</p>
															<p className="text-4xl font-bold text-primary">
																R$ {priceData.data.totalPrice.toFixed(2)}
															</p>
														</div>
														<DollarSign className="size-16 text-primary/50" />
													</div>

													{/* Comparação se houver preço do kit registrado */}
													{priceData.data.kitRegisteredPrice && (
														<>
															<Separator className="my-4" />
															<div className="p-4 bg-secondary/20 rounded-lg">
																<div className="flex items-center justify-between mb-2">
																	<span className="font-semibold">Análise Automática:</span>
																	{priceData.data.kitRegisteredPrice < priceData.data.totalPrice ? (
																		<Badge variant="default" className="bg-green-600">
																			Vale a pena o kit!
																		</Badge>
																	) : (
																		<Badge variant="secondary">
																			Melhor comprar separado
																		</Badge>
																	)}
																</div>
																<div className="flex items-center justify-between text-sm">
																	<span className="text-muted-foreground">
																		{priceData.data.kitRegisteredPrice < priceData.data.totalPrice
																			? "Economia comprando o kit:"
																			: "Diferença (mais caro):"}
																	</span>
																	<span className={`font-bold ${
																		priceData.data.kitRegisteredPrice < priceData.data.totalPrice
																			? "text-green-600"
																			: "text-red-600"
																	}`}>
																		R${" "}
																		{Math.abs(
																			priceData.data.totalPrice - priceData.data.kitRegisteredPrice
																		).toFixed(2)}{" "}
																		(
																		{(
																			(Math.abs(
																				priceData.data.totalPrice - priceData.data.kitRegisteredPrice
																			) /
																				priceData.data.totalPrice) *
																			100
																		).toFixed(1)}
																		%)
																	</span>
																</div>
															</div>
														</>
													)}

													<Separator className="my-4" />

													<div className="space-y-2">
														<p className="text-sm font-semibold mb-3 text-muted-foreground">
															Detalhamento por Produto:
														</p>
														{priceData.data.itemPrices.map((item: any) => (
															<div
																key={item.productId}
																className="flex items-center justify-between p-3 border rounded-lg"
															>
																<div className="flex-1">
																	<p className="font-medium">{item.productName}</p>
																	<div className="flex items-center gap-2 mt-1">
																		<p className="text-sm text-muted-foreground">
																			{item.quantity}x R$ {item.unitPrice.toFixed(2)}
																		</p>
																		{item.priceSource && item.priceSource !== "none" && (
																			<Badge variant="outline" className="text-xs">
																				{item.priceSource === "purchase" ? "Compra" : "Registro"}
																			</Badge>
																		)}
																		{item.priceDate && (
																			<span className="text-xs text-muted-foreground">
																				{new Date(item.priceDate).toLocaleDateString("pt-BR")}
																			</span>
																		)}
																	</div>
																</div>
																<p className="font-semibold">R$ {item.totalPrice.toFixed(2)}</p>
															</div>
														))}
													</div>
												</CardContent>
											</Card>
										</>
									) : (
										<Card>
											<CardContent className="p-6">
												<p className="text-muted-foreground text-center">
													Nenhum preço registrado ainda. Use o formulário acima para registrar preços e fazer análises.
												</p>
											</CardContent>
										</Card>
									)}
								</>
							)}
						</Suspense>
					</TabsContent>
				</Tabs>
			</div>
		</div>
	)
}
