// src/components/skeletons/churrascometro-skeleton.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChurrascometroSkeleton() {
	return (
		<Card className="border-2 border-dashed">
			<CardHeader>
				<Skeleton className="h-7 w-3/4" />
				<Skeleton className="h-4 w-1/2" />
			</CardHeader>
			<CardContent className="space-y-6">
				<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
					{/* Coluna da Esquerda */}
					<div className="space-y-4">
						<Skeleton className="h-6 w-24" />
						<div className="space-y-2">
							<Skeleton className="h-5 w-full" />
							<Skeleton className="size-5/6" />
							<Skeleton className="h-5 w-full" />
						</div>
					</div>
					{/* Coluna da Direita */}
					<div className="space-y-4">
						<Skeleton className="h-6 w-28" />
						<div className="space-y-2">
							<Skeleton className="h-5 w-full" />
							<Skeleton className="size-5/6" />
						</div>
					</div>
				</div>
				<Skeleton className="h-10 w-full" />
			</CardContent>
		</Card>
	)
}
