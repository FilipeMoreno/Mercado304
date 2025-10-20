import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function TrustedDevicesSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Dispositivos Confiáveis</CardTitle>
        <CardDescription>
          Dispositivos onde você marcou "Confiar neste dispositivo" durante o login com 2FA
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="flex items-start justify-between p-4 border rounded-lg"
            >
              <div className="flex items-start gap-3 flex-1">
                <Skeleton className="size-5 mt-1" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <Skeleton className="size-8" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

