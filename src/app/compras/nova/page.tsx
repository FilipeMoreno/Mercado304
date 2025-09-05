"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
	ArrowLeft, Save,
	Plus,
	Trash2,
	Package,
	Camera,
	Box, Settings2
} from "lucide-react";
import { MarketSelect } from "@/components/selects/market-select";
import { ProductSelect } from "@/components/selects/product-select";
import Link from "next/link";
import { BarcodeScanner } from "@/components/barcode-scanner";
import { NovaCompraSkeleton } from "@/components/skeletons/nova-compra-skeleton";
import { PriceAlert } from "@/components/price-alert";
import { BestPriceAlert } from "@/components/best-price-alert";
import { toast } from "sonner";
import { addDays, format } from "date-fns";
import { Product } from "@/types";
import { StockEntry, StockEntryDialog } from "@/components/stock-entry-dialog";

interface PurchaseItem {
	id?: string;
	productId: string;
	quantity: number;
	unitPrice: number;
	priceAlert?: any;
	bestPriceAlert?: any;
	addToStock: boolean;
	stockEntries: StockEntry[];
}

export default function NovaCompraPage() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const [products, setProducts] = useState<Product[]>([]);
	const [loading, setLoading] = useState(false);
	const [dataLoading, setDataLoading] = useState(true);
	const restoredRef = React.useRef(false);
	const [showScanner, setShowScanner] = useState(false);
	const [scanningForIndex, setScanningForIndex] = useState<number | null>(null);

    const [stockDialogState, setStockDialogState] = useState<{ isOpen: boolean, itemIndex: number | null }>({ isOpen: false, itemIndex: null });

	const [formData, setFormData] = useState({
		marketId: "",
		purchaseDate: new Date().toISOString().split("T")[0],
	});

	const [items, setItems] = useState<PurchaseItem[]>([
		{
			id: Math.random().toString(),
			productId: "",
			quantity: 1,
			unitPrice: 0,
			addToStock: false,
			stockEntries: [],
		},
	]);
	const [checkingPrices, setCheckingPrices] = useState<boolean[]>([false]);

	useEffect(() => {
		fetchData();
	}, []);

	const fetchData = async () => {
		try {
			const productsRes = await fetch("/api/products");
			if (productsRes.ok) {
				const productsData = await productsRes.json();
				setProducts(productsData.products);
			}
		} catch (error) {
			console.error("Erro ao carregar dados:", error);
		} finally {
			setDataLoading(false);
		}
	};

	const addItem = () => {
		setItems([
			...items,
			{
				id: Math.random().toString(),
				productId: "",
				quantity: 1,
				unitPrice: 0,
				addToStock: false,
				stockEntries: [],
			},
		]);
		setCheckingPrices([...checkingPrices, false]);
	};

	const removeItem = (index: number) => {
		if (items.length > 1) {
			setItems(items.filter((_, i) => i !== index));
			setCheckingPrices(checkingPrices.filter((_, i) => i !== index));
		}
	};

    const checkPrice = async (index: number, productId: string, unitPrice: number) => {
        if (!productId || !unitPrice || !formData.marketId) return;

        setCheckingPrices(current => current.map((c, i) => i === index ? true : c));

        try {
            const response = await fetch('/api/price-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ productId, currentPrice: unitPrice, currentMarketId: formData.marketId })
            });
            const alertData = await response.json();
            
            setItems(currentItems => currentItems.map((item, i) => 
                i === index ? { ...item, priceAlert: alertData } : item
            ));
        } catch (error) {
            console.error('Erro ao verificar preço:', error);
        } finally {
            setCheckingPrices(current => current.map((c, i) => i === index ? false : c));
        }
    };

	const checkBestPrice = async (index: number, productId: string, unitPrice: number) => {
		if (!productId || !unitPrice) return;

		try {
			const response = await fetch("/api/best-price-check", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ productId, currentPrice: unitPrice }),
			});
			const bestPriceData = await response.json();
			setItems((currentItems) =>
				currentItems.map((item, i) =>
					i === index ? { ...item, bestPriceAlert: bestPriceData } : item,
				),
			);
		} catch (error) {
			console.error("Erro ao verificar melhor preço:", error);
		}
	};

	const updateItem = (index: number, field: keyof PurchaseItem, value: string | number | boolean | null | StockEntry[]) => {
		setItems(currentItems => {
            const newItems = [...currentItems];
            const currentItem = { ...newItems[index] };

            // @ts-ignore
            currentItem[field] = value;

            if (field === "productId" || (field === "addToStock" && value === true)) {
                const product = products.find((p) => p.id === currentItem.productId);
                if (product && currentItem.addToStock) {
                    const defaultExpiration =
                        product.hasExpiration && product.defaultShelfLifeDays
                            ? format(
                                    addDays(new Date(), product.defaultShelfLifeDays),
                                    "yyyy-MM-dd",
                              )
                            : "";

                    currentItem.stockEntries = Array.from({ length: Math.floor(currentItem.quantity) }).map(() => ({
                        id: Math.random().toString(),
                        location: "Despensa",
                        expirationDate: defaultExpiration,
                        batchNumber: "",
                        notes: "",
                    }));
                }
            } else if (field === "addToStock" && value === false) {
                currentItem.stockEntries = [];
            }
            
            if (field === 'quantity') {
                const product = products.find((p) => p.id === currentItem.productId);
                if (product && currentItem.addToStock) {
                    const newQuantity = Math.floor(Number(value) || 0);
                    const oldEntries = currentItem.stockEntries;
                    const newEntries = Array.from({ length: newQuantity }).map((_, i) => 
                        oldEntries[i] || {
                            id: Math.random().toString(),
                            location: oldEntries[0]?.location || 'Despensa',
                            expirationDate: oldEntries[0]?.expirationDate || "",
                            batchNumber: oldEntries[0]?.batchNumber || "",
                            notes: oldEntries[0]?.notes || ""
                        }
                    );
                    currentItem.stockEntries = newEntries;
                }
            }

            newItems[index] = currentItem;

            if ((field === "unitPrice" || field === "productId") && currentItem.productId && currentItem.unitPrice > 0) {
                setTimeout(() => {
                    checkBestPrice(index, currentItem.productId, currentItem.unitPrice);
                    checkPrice(index, currentItem.productId, currentItem.unitPrice);
                }, 1000);
            }

            return newItems;
        });
	};

	const calculateTotal = () => {
		return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
	};

	const handleBarcodeScanned = async (barcode: string) => {
		try {
			const response = await fetch(`/api/products/barcode/${barcode}`);
			if (response.ok) {
				const product = await response.json();
				if (scanningForIndex !== null) {
					updateItem(scanningForIndex, "productId", product.id);
				}
			} else {
				toast.error("Produto não encontrado para este código de barras");
			}
		} catch (error) {
			console.error("Erro ao buscar produto:", error);
			toast.error("Erro ao buscar produto");
		} finally {
			setShowScanner(false);
			setScanningForIndex(null);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!formData.marketId) {
			toast.error("Selecione um mercado");
			return;
		}

		const validItems = items.filter(
			(item) => item.productId && item.quantity > 0 && item.unitPrice > 0,
		);

		if (validItems.length === 0) {
			toast.error("Adicione pelo menos um item válido");
			return;
		}

		setLoading(true);

		try {
			const response = await fetch("/api/purchases", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					marketId: formData.marketId,
					purchaseDate: formData.purchaseDate,
					items: validItems,
				}),
			});

			if (response.ok) {
				toast.success("Compra registrada com sucesso!");
				router.push("/compras");
			} else {
				const error = await response.json();
				toast.error(error.error || "Erro ao criar compra");
			}
		} catch (error) {
			console.error("Erro ao criar compra:", error);
			toast.error("Erro ao criar compra");
		} finally {
			setLoading(false);
		}
	};

    const handleSaveStockDetails = (entries: StockEntry[]) => {
        if(stockDialogState.itemIndex !== null) {
            updateItem(stockDialogState.itemIndex, 'stockEntries', entries);
        }
    };

	if (dataLoading) {
		return <NovaCompraSkeleton />;
	}

	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Link href="/compras">
					<Button variant="outline" size="sm">
						<ArrowLeft className="h-4 w-4 mr-2" />
						Voltar
					</Button>
				</Link>
				<div>
					<h1 className="text-3xl font-bold">Nova Compra</h1>
					<p className="text-gray-600 mt-2">Registre uma nova compra</p>
				</div>
			</div>

			<form onSubmit={handleSubmit} className="space-y-6">
				<Card>
					<CardHeader>
						<CardTitle>Informações da Compra</CardTitle>
					</CardHeader>
					<CardContent className="space-y-4">
						<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
							<div className="space-y-2">
								<Label htmlFor="marketId">Mercado *</Label>
								<MarketSelect
									value={formData.marketId}
									onValueChange={(value) => {
										setFormData((prev) => ({ ...prev, marketId: value }));
									}}
								/>
							</div>
							<div className="space-y-2">
								<Label htmlFor="purchaseDate">Data da Compra</Label>
								<Input
									id="purchaseDate"
									name="purchaseDate"
									type="date"
									value={formData.purchaseDate}
									onChange={(e) =>
										setFormData((prev) => ({ ...prev, purchaseDate: e.target.value }))
									}
								/>
							</div>
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<div className="flex justify-between items-center">
							<CardTitle className="flex items-center gap-2">
								<Package className="h-5 w-5" />
								Itens da Compra
							</CardTitle>
							<Button type="button" onClick={addItem} variant="outline">
								<Plus className="h-4 w-4 mr-2" />
								Adicionar Item
							</Button>
						</div>
					</CardHeader>
					<CardContent>
						<div className="space-y-4">
							{items.map((item, index) => {
								const selectedProduct = products.find((p) => p.id === item.productId);
								return (
									<div key={item.id || index} className="space-y-4 p-4 border rounded-lg">
										<div className="grid grid-cols-1 md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-end">
											<div className="space-y-2">
												<Label>Produto *</Label>
                                                <div className="flex gap-2">
                                                    <ProductSelect
                                                        value={item.productId || ""}
                                                        onValueChange={(value) => updateItem(index, "productId", value)}
                                                        products={products}
                                                        preserveFormData={{ formData, items, targetItemIndex: index }}
                                                    />
                                                    <Button type="button" variant="outline" size="icon" onClick={() => setScanningForIndex(index)}>
                                                        <Camera className="h-4 w-4" />
                                                    </Button>
                                                </div>
											</div>
											<div className="space-y-2">
												<Label>Quantidade *</Label>
												<Input type="number" step="0.01" min="0.01" value={item.quantity}
													onChange={(e) => updateItem(index, "quantity", parseFloat(e.target.value) || 1)}
													placeholder="1.00"
												/>
											</div>
											<div className="space-y-2">
												<Label>Preço Unitário *</Label>
												<Input type="number" step="0.01" min="0.01" value={item.unitPrice}
													onChange={(e) => updateItem(index, "unitPrice", parseFloat(e.target.value) || 0)}
													placeholder="0.00"
												/>
											</div>
											<div className="space-y-2">
												<Label>Total</Label>
												<Input value={`R$ ${(item.quantity * item.unitPrice).toFixed(2)}`} disabled
													className="bg-secondary text-secondary-foreground dark:opacity-70"
												/>
											</div>
										</div>

                                        <PriceAlert
                                            alertData={item.priceAlert}
                                            loading={checkingPrices[index]}
                                            onClose={() => updateItem(index, 'priceAlert', null)}
                                        />
										
										{item.bestPriceAlert && item.bestPriceAlert.isBestPrice && !item.bestPriceAlert.isFirstRecord && (
											<BestPriceAlert
												productName={selectedProduct?.name || 'Produto'}
												currentPrice={item.unitPrice}
												previousBestPrice={item.bestPriceAlert.previousBestPrice}
												totalRecords={item.bestPriceAlert.totalRecords}
												onClose={() => updateItem(index, 'bestPriceAlert', null)}
											/>
										)}

										{selectedProduct && (selectedProduct.hasStock || selectedProduct.hasExpiration) && (
											<div className="pt-4 border-t space-y-4">
												<div className="flex justify-between items-center">
													<Label className="flex items-center gap-2 font-medium">
														<Box className="h-4 w-4" />
														Gestão de Estoque
													</Label>
													{item.addToStock && (
														<Button type="button" variant="outline" size="sm" onClick={() => setStockDialogState({ isOpen: true, itemIndex: index })}>
															<Settings2 className="h-4 w-4 mr-2" />
															Detalhar Estoque
														</Button>
													)}
												</div>
												<div className="flex items-center space-x-2">
													<Checkbox id={`addToStock-${index}`} checked={item.addToStock}
														onCheckedChange={(checked) => updateItem(index, "addToStock", !!checked)}
													/>
													<Label htmlFor={`addToStock-${index}`} className="cursor-pointer">
														Adicionar ao estoque
													</Label>
												</div>
											</div>
										)}

										<div className="flex justify-end">
											{items.length > 1 && (
												<Button type="button" variant="destructive" size="sm" onClick={() => removeItem(index)}>
													<Trash2 className="h-4 w-4 mr-1" />
													Remover
												</Button>
											)}
										</div>
									</div>
								);
							})}
						</div>

						<div className="flex justify-between items-center pt-4 border-t">
							<div className="text-lg font-bold">
								Total da Compra: R$ {calculateTotal().toFixed(2)}
							</div>
							<div className="flex gap-3">
								<Button type="submit" disabled={loading}>
									<Save className="h-4 w-4 mr-2" />
									{loading ? "Salvando..." : "Salvar Compra"}
								</Button>
								<Link href="/compras">
									<Button type="button" variant="outline">
										Cancelar
									</Button>
								</Link>
							</div>
						</div>
					</CardContent>
				</Card>
			</form>
            
            {stockDialogState.isOpen && stockDialogState.itemIndex !== null && (
                <StockEntryDialog
                    isOpen={stockDialogState.isOpen}
                    onClose={() => setStockDialogState({ isOpen: false, itemIndex: null })}
                    onSave={handleSaveStockDetails}
                    product={products.find(p => p.id === items[stockDialogState.itemIndex!].productId)}
                    quantity={items[stockDialogState.itemIndex!].quantity}
                    initialEntries={items[stockDialogState.itemIndex!].stockEntries}
                />
            )}

			<BarcodeScanner
				isOpen={showScanner}
				onScan={handleBarcodeScanned}
				onClose={() => {
					setShowScanner(false);
					setScanningForIndex(null);
				}}
			/>
		</div>
	);
}