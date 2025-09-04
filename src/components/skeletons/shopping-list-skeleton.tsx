import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ShoppingListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-9 w-44 mb-2" />
          <Skeleton className="h-5 w-64" />
        </div>
        <Skeleton className="h-10 w-28" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-5 w-5" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                  <Skeleton className="h-4 w-28 mt-2" />
                </div>
                <div className="flex gap-1">
                  <Skeleton className="h-8 w-8" />
                  <Skeleton className="h-8 w-8" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {Array.from({ length: 4 }).map((_, j) => (
                  <div key={j} className="flex items-center gap-3 p-2 rounded-lg border">
                    <Skeleton className="w-5 h-5 rounded border-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-28 mb-1" />
                      <Skeleton className="h-3 w-16" />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}