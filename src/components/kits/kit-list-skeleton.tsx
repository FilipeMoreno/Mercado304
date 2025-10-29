"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function KitListSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="h-full flex flex-col overflow-hidden border-0">
          {/* Área superior com gradiente roxo/rosa (h-48) */}
          <div className="relative h-48 w-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-fuchsia-500/10">
            <div className="relative h-full flex flex-col items-center justify-center p-6">
              <Skeleton className="h-20 w-20 rounded-2xl mb-3" />
              {/* Badge de produtos */}
              <Skeleton className="h-7 w-28 rounded-full" />
            </div>
            {/* Badge de status */}
            <div className="absolute bottom-3 left-3">
              <Skeleton className="h-7 w-20 rounded-full" />
            </div>
          </div>
          {/* Conteúdo */}
          <CardContent className="flex-1 flex flex-col p-4">
            <Skeleton className="h-6 w-3/4 mb-3" />
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-2/3 mb-3" />
            {/* Preview dos produtos */}
            <div className="space-y-1 mb-3">
              <Skeleton className="h-8 w-full rounded-md" />
              <Skeleton className="h-8 w-full rounded-md" />
            </div>
            <div className="mt-auto pt-3 border-t">
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function KitCardSkeleton() {
  return (
    <Card className="h-full flex flex-col overflow-hidden border-0">
      {/* Área superior com gradiente roxo/rosa (h-48) */}
      <div className="relative h-48 w-full bg-gradient-to-br from-purple-500/10 via-pink-500/5 to-fuchsia-500/10">
        <div className="relative h-full flex flex-col items-center justify-center p-6">
          <Skeleton className="h-20 w-20 rounded-2xl mb-3" />
          {/* Badge de produtos */}
          <Skeleton className="h-7 w-28 rounded-full" />
        </div>
        {/* Badge de status */}
        <div className="absolute bottom-3 left-3">
          <Skeleton className="h-7 w-20 rounded-full" />
        </div>
      </div>
      {/* Conteúdo */}
      <CardContent className="flex-1 flex flex-col p-4">
        <Skeleton className="h-6 w-3/4 mb-3" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-2/3 mb-3" />
        {/* Preview dos produtos */}
        <div className="space-y-1 mb-3">
          <Skeleton className="h-8 w-full rounded-md" />
          <Skeleton className="h-8 w-full rounded-md" />
        </div>
        <div className="mt-auto pt-3 border-t">
          <Skeleton className="h-4 w-full" />
        </div>
      </CardContent>
    </Card>
  );
}

