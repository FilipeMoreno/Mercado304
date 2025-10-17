"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  ShoppingCart,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import type { ProductKitWithItems, KitStockInfo } from "@/types/product-kit";

interface ProductKitCardProps {
  kit: ProductKitWithItems;
  showStock?: boolean;
  showNutrition?: boolean;
  onViewDetails?: (kit: ProductKitWithItems) => void;
  onEdit?: (kit: ProductKitWithItems) => void;
}

export function ProductKitCard({
  kit,
  showStock = true,
  showNutrition = false,
  onViewDetails,
  onEdit,
}: ProductKitCardProps) {
  const [stockInfo, setStockInfo] = useState<KitStockInfo | null>(null);
  const [isLoadingStock, setIsLoadingStock] = useState(false);

  // Carregar informações de estoque
  const loadStockInfo = async () => {
    if (isLoadingStock || stockInfo) return;

    setIsLoadingStock(true);
    try {
      const response = await fetch(
        `/api/product-kits/${kit.kitProductId}/stock`
      );
      const data = await response.json();
      if (data.success) {
        setStockInfo(data.data);
      }
    } catch (error) {
      console.error("Error loading stock info:", error);
    } finally {
      setIsLoadingStock(false);
    }
  };

  // Status do estoque
  const getStockStatus = () => {
    if (!stockInfo) return { color: "secondary", label: "Carregando..." };

    if (stockInfo.availableQuantity === 0) {
      return { color: "destructive", label: "Sem estoque", icon: AlertCircle };
    }
    if (stockInfo.availableQuantity <= 3) {
      return {
        color: "warning",
        label: `Estoque baixo (${stockInfo.availableQuantity})`,
        icon: AlertCircle,
      };
    }
    return {
      color: "success",
      label: `${stockInfo.availableQuantity} disponíveis`,
      icon: CheckCircle2,
    };
  };

  const stockStatus = stockInfo ? getStockStatus() : null;

  return (
    <Card className="w-full hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <Package className="h-5 w-5 text-primary" />
            <div>
              <CardTitle className="text-lg">
                {kit.kitProduct.name}
              </CardTitle>
              {kit.description && (
                <CardDescription className="mt-1">
                  {kit.description}
                </CardDescription>
              )}
            </div>
          </div>

          <Badge variant={kit.isActive ? "default" : "secondary"}>
            {kit.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent>
        {/* Produtos do kit */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Produtos inclusos:
          </p>
          <div className="space-y-1">
            {kit.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/30"
              >
                <div className="flex items-center gap-2">
                  <span className="font-medium">{item.quantity}x</span>
                  <span>{item.product.name}</span>
                </div>
                {item.product.brand && (
                  <Badge variant="outline" className="text-xs">
                    {item.product.brand.name}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Informações de estoque */}
        {showStock && (
          <div className="mt-4 pt-4 border-t">
            {!stockInfo ? (
              <Button
                variant="outline"
                size="sm"
                onClick={loadStockInfo}
                disabled={isLoadingStock}
                className="w-full"
              >
                <ShoppingCart className="h-4 w-4 mr-2" />
                {isLoadingStock ? "Carregando..." : "Ver Disponibilidade"}
              </Button>
            ) : (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Disponibilidade:</span>
                  {stockStatus && (
                    <Badge
                      variant={
                        stockStatus.color as
                        | "default"
                        | "secondary"
                        | "destructive"
                      }
                      className="flex items-center gap-1"
                    >
                      {stockStatus.icon && (
                        <stockStatus.icon className="h-3 w-3" />
                      )}
                      {stockStatus.label}
                    </Badge>
                  )}
                </div>

                {stockInfo.limitingProduct && (
                  <p className="text-xs text-muted-foreground">
                    Limitado por: {stockInfo.limitingProduct.name}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2">
        {onViewDetails && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewDetails(kit)}
            className="flex-1"
          >
            Ver Detalhes
          </Button>
        )}
        {onEdit && (
          <Button
            variant="default"
            size="sm"
            onClick={() => onEdit(kit)}
            className="flex-1"
          >
            Editar
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}

