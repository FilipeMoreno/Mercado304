"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Eye,
  Edit,
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  MoreVertical,
  Trash2,
} from "lucide-react";
import { useProductKitStockQuery } from "@/hooks/use-react-query";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ProductKitWithItems } from "@/types/product-kit";

interface KitCardEnhancedProps {
  kit: ProductKitWithItems;
  onEdit?: (kit: ProductKitWithItems) => void;
  onDelete?: (kit: ProductKitWithItems) => void;
}

export function KitCardEnhanced({ kit, onEdit, onDelete }: KitCardEnhancedProps) {
  const router = useRouter();
  const [expanded, setExpanded] = useState(false);
  const [loadStock, setLoadStock] = useState(false);

  // Lazy load stock info apenas quando expandido
  const { data: stockInfo, isLoading: isLoadingStock } = useProductKitStockQuery(
    loadStock ? kit.kitProductId : ""
  );

  const handleExpand = () => {
    setExpanded(!expanded);
    if (!expanded && !loadStock) {
      setLoadStock(true);
    }
  };

  const handleViewDetails = () => {
    router.push(`/produtos/kits/${kit.kitProductId}`);
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(kit);
    } else {
      router.push(`/produtos/kits/${kit.kitProductId}/editar`);
    }
  };

  // Status do estoque
  const getStockStatus = () => {
    if (!stockInfo) return null;

    if (stockInfo.data.availableQuantity === 0) {
      return {
        color: "destructive" as const,
        label: "Sem estoque",
        icon: AlertCircle,
      };
    }
    if (stockInfo.data.availableQuantity <= 3) {
      return {
        color: "secondary" as const,
        label: `Estoque baixo (${stockInfo.data.availableQuantity})`,
        icon: AlertCircle,
      };
    }
    return {
      color: "default" as const,
      label: `${stockInfo.data.availableQuantity} disponíveis`,
      icon: CheckCircle2,
    };
  };

  const stockStatus = stockInfo ? getStockStatus() : null;

  return (
    <Card className="w-full hover:shadow-lg transition-all duration-200 border-2 hover:border-primary/50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <Package className="h-5 w-5 text-primary flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <CardTitle className="text-lg line-clamp-1">
                {kit.kitProduct.name}
              </CardTitle>
              {kit.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {kit.description}
                </p>
              )}
            </div>
          </div>

          <Badge variant={kit.isActive ? "default" : "secondary"} className="ml-2 flex-shrink-0">
            {kit.isActive ? "Ativo" : "Inativo"}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Produtos inclusos - sempre visível */}
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-2">
            {kit.items.length} {kit.items.length === 1 ? "produto" : "produtos"} inclusos
          </p>
          <div className="space-y-1">
            {kit.items.slice(0, expanded ? undefined : 2).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm p-2 rounded-md bg-secondary/30"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <span className="font-medium text-primary">{item.quantity}x</span>
                  <div className="flex flex-col min-w-0">
                    <span className="truncate">{item.product.name}</span>
                    {item.product.packageSize && (
                      <span className="text-xs text-muted-foreground">
                        {item.product.packageSize}
                      </span>
                    )}
                  </div>
                </div>
                {item.product.brand && (
                  <Badge variant="outline" className="text-xs ml-2 flex-shrink-0">
                    {item.product.brand.name}
                  </Badge>
                )}
              </div>
            ))}
            
            {kit.items.length > 2 && !expanded && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleExpand}
                className="w-full text-xs"
              >
                <ChevronDown className="h-3 w-3 mr-1" />
                Ver mais {kit.items.length - 2} produtos
              </Button>
            )}
          </div>
        </div>

        {/* Informações de estoque - lazy loaded quando expandido */}
        {expanded && (
          <div className="pt-3 border-t space-y-2">
            {isLoadingStock ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : stockInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Disponibilidade:</span>
                  {stockStatus && (
                    <Badge
                      variant={stockStatus.color}
                      className="flex items-center gap-1"
                    >
                      <stockStatus.icon className="h-3 w-3" />
                      {stockStatus.label}
                    </Badge>
                  )}
                </div>

                {stockInfo.data.limitingProduct && (
                  <p className="text-xs text-muted-foreground">
                    Limitado por: <span className="font-medium">{stockInfo.data.limitingProduct.name}</span>
                  </p>
                )}
              </>
            ) : null}
            
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExpand}
              className="w-full text-xs"
            >
              <ChevronUp className="h-3 w-3 mr-1" />
              Ver menos
            </Button>
          </div>
        )}
      </CardContent>

      <CardFooter className="flex gap-2 pt-3">
        <Button
          variant="default"
          size="lg"
          onClick={handleViewDetails}
          className="flex-1"
        >
          <Eye className="h-4 w-4 mr-2" />
          Ver Detalhes
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="lg">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-2" />
              Editar Kit
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete?.(kit)}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Excluir Kit
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </CardFooter>
    </Card>
  );
}

