"use client";

import { Button } from "@/components/ui/button";

interface SelectionCardProps {
  type: string;
  options: any[];
  searchTerm: string;
  context?: any;
  onSelect: (option: any, index: number) => void;
}

export function SelectionCard({ type, options, searchTerm, context, onSelect }: SelectionCardProps) {
  const getCardContent = (option: any, index: number) => {
    switch (type) {
      case 'products':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <div className="text-xs text-muted-foreground">
              {option.brand && <span>Marca: {option.brand}</span>}
              {option.category && <span> • Categoria: {option.category}</span>}
              {option.barcode && <span> • Código: {option.barcode}</span>}
            </div>
          </div>
        );
      case 'markets':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            {option.location && <span className="text-xs text-muted-foreground">{option.location}</span>}
          </div>
        );
      case 'categories':
        return (
          <div className="flex items-center gap-2">
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <div className="flex flex-col gap-1">
              <span className="font-medium">{option.name}</span>
              {option.isFood && <span className="text-xs text-green-600">🍽️ Alimento</span>}
            </div>
          </div>
        );
      case 'brands':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <span className="text-xs text-muted-foreground">{option.productCount} produtos</span>
          </div>
        );
      case 'shopping-lists':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <span className="text-xs text-muted-foreground">
              {option.itemCount} itens • {new Date(option.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        );
      default:
        return <span className="font-medium">{option.name}</span>;
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
      <div className="text-sm text-muted-foreground">
        Encontradas {options.length} opções para "{searchTerm}". Escolha uma:
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <Button
            key={option.id || index}
            variant="outline"
            className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-200"
            onClick={() => onSelect(option, index)}
          >
            {getCardContent(option, index)}
          </Button>
        ))}
      </div>
    </div>
  );
}