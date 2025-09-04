import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ShoppingListSkeleton() {
  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Esqueleto para a seção principal de filtros e listas */}
      <div className="flex-1 space-y-4">
        {/* Esqueleto para o input de busca e o filtro popover */}
        <div className="flex items-center gap-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>

        {/* Esqueleto para a contagem de itens e paginação */}
        <div className="flex justify-between items-center text-sm text-gray-600">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>

        {/* Esqueleto para a lista de cards de listas de compras */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Skeleton className="h-5 w-5 rounded-full" />
                      <Skeleton className="h-6 w-32" />
                    </CardTitle>
                    <Skeleton className="h-4 w-48 mt-2" />
                  </div>
                  <div className="text-right">
                    <Skeleton className="h-5 w-12" />
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Skeleton className="h-8 w-24" />
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Esqueleto para a seção de paginação */}
        <div className="flex justify-center items-center gap-2 pt-6">
          <Skeleton className="h-8 w-24" />
          <div className="flex gap-1">
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
            <Skeleton className="h-8 w-8" />
          </div>
          <Skeleton className="h-8 w-24" />
        </div>
      </div>
      
      {/* Esqueleto para o componente AiShoppingList */}
      <div className="w-full md:w-1/3 flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-full" />
              <Skeleton className="h-6 w-32" />
            </CardTitle>
            <Skeleton className="h-4 w-56" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="text-center space-y-3">
                <Skeleton className="h-12 w-12 mx-auto rounded-full" />
                <Skeleton className="h-4 w-40 mx-auto" />
                <div className="grid grid-cols-2 gap-3 mt-4">
                  <Skeleton className="h-20 w-full" />
                  <Skeleton className="h-20 w-full" />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}