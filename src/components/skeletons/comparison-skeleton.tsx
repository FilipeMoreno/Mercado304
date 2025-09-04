import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"

export default function ComparisonSkeleton() {
  return (
    <div className="space-y-6">
      {/* Título e descrição do cabeçalho */}
      <div>
        <Skeleton className="h-9 w-64 mb-2" />
        <Skeleton className="h-5 w-80" />
      </div>

      {/* Navegação de abas (Tabs) */}
      <Tabs defaultValue="produto">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="produto">Por Produto</TabsTrigger>
          <TabsTrigger value="lista">Resumo da Lista</TabsTrigger>
          <TabsTrigger value="detalhada">Comparação Detalhada</TabsTrigger>
        </TabsList>

        {/* Conteúdo da aba "Por Produto" - Card de entrada */}
        <TabsContent value="produto">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Conteúdo da aba "Por Produto" - Lista de resultados */}
          <div className="space-y-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Conteúdo da aba "Resumo da Lista" - Card de entrada */}
        <TabsContent value="lista">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-56" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="flex items-end">
                  <Skeleton className="h-10 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
          {/* Conteúdo da aba "Resumo da Lista" - Lista de resultados */}
          <div className="space-y-4 mt-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-40" />
                    <Skeleton className="h-4 w-56" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Conteúdo da nova aba "Comparação Detalhada" */}
        <TabsContent value="detalhada">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-60" />
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-40 mb-2" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </div>
              <div className="flex justify-end">
                <Skeleton className="h-10 w-48" />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle>
                <Skeleton className="h-6 w-64" />
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left table-fixed">
                  <thead>
                    <tr className="border-b">
                      <th className="w-64 p-2 text-sm font-medium"><Skeleton className="h-4 w-24" /></th>
                      <th className="p-2 text-sm font-medium"><Skeleton className="h-4 w-20" /></th>
                      <th className="p-2 text-sm font-medium"><Skeleton className="h-4 w-20" /></th>
                      <th className="p-2 text-sm font-medium"><Skeleton className="h-4 w-20" /></th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} className="border-b last:border-b-0">
                        <td className="p-2 text-sm font-medium"><Skeleton className="h-4 w-48" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                        <td className="p-2"><Skeleton className="h-4 w-16" /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  )
}