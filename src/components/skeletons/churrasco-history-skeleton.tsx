// src/components/skeletons/churrasco-history-skeleton.tsx

import { Clock } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ChurrascoHistorySkeleton() {
	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<Clock className="size-5" />
					Cálculos Recentes
				</CardTitle>
				<CardDescription>Carregando histórico...</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{[1, 2, 3].map((index) => (
						<div key={index} className="border rounded-lg p-4">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="space-y-2 flex-1">
									<div className="flex items-center gap-2">
										<Skeleton className="h-5 w-48" />
										<Skeleton className="h-5 w-8" />
									</div>
									<Skeleton className="h-4 w-32" />
								</div>
								<Skeleton className="h-9 w-24" />
							</div>
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}
