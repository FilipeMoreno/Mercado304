import { ChevronLeft, Flame, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

export default function ChurrascoDetailsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" disabled>
          <ChevronLeft className="size-5" />
        </Button>
        <div className="flex items-center gap-4 flex-1">
          <Flame className="size-8 text-orange-600" />
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold">Detalhes do Churrasco</h1>
            <p className="text-gray-600 mt-2 text-sm sm:text-base">Carregando...</p>
          </div>
        </div>
      </div>

      <Card>
        <CardContent className="p-12 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Carregando detalhes do churrasco...</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

