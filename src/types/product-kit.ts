/**
 * TypeScript types for Product Kits
 */

import type {
  ProductKitWithItems,
  CreateProductKitInput,
  AggregatedNutritionalInfo,
  KitStockInfo,
} from "@/services/productKitService";

// Re-export from service for convenience
export type {
  ProductKitWithItems,
  CreateProductKitInput,
  AggregatedNutritionalInfo,
  KitStockInfo,
};

// Additional UI-specific types

export interface ProductKitFormData {
  kitProductId: string;
  description?: string;
  items: KitItemFormData[];
}

export interface KitItemFormData {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
}

export interface KitWithCalculations extends ProductKitWithItems {
  nutrition?: AggregatedNutritionalInfo;
  stockInfo?: KitStockInfo;
  suggestedPrice?: {
    totalPrice: number;
    itemPrices: Array<{
      productId: string;
      productName: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  };
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export type ProductKitResponse = ApiResponse<ProductKitWithItems>;
export type ProductKitListResponse = ApiResponse<ProductKitWithItems[]>;
export type NutritionalInfoResponse = ApiResponse<AggregatedNutritionalInfo>;
export type StockInfoResponse = ApiResponse<KitStockInfo>;

// Component Props types
export interface ProductKitCardProps {
  kit: ProductKitWithItems;
  onEdit?: (kit: ProductKitWithItems) => void;
  onDelete?: (kit: ProductKitWithItems) => void;
  showActions?: boolean;
  showNutrition?: boolean;
  showStock?: boolean;
}

export interface ProductKitFormProps {
  initialData?: ProductKitWithItems;
  onSubmit: (data: ProductKitFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface KitItemSelectorProps {
  value: KitItemFormData[];
  onChange: (items: KitItemFormData[]) => void;
  excludeProductIds?: string[];
}

// Utility types
export type KitStatus = "available" | "limited" | "unavailable";

export interface KitAvailabilityBadge {
  status: KitStatus;
  label: string;
  color: string;
}

