import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<Skeleton className="h-9 w-32 mb-2" />
					<Skeleton className="h-5 w-64" />
				</div>
				<Skeleton className="h-10 w-36" />
			</div>

			<div className="flex items-center gap-2 mb-6">
				<div className="relative flex-1">
					<Skeleton className="h-9 w-full" />
				</div>
				<Skeleton className="h-9 w-9" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{Array.from({ length: 9 }).map((_, i) => (
					<Card key={i}>
						<CardHeader>
							<div className="flex items-center gap-2">
								<Skeleton className="h-5 w-5" />
								<Skeleton className="h-6 w-28" />
							</div>
							<div className="space-y-1">
								<div className="flex items-center gap-1">
									<Skeleton className="h-3 w-3" />
									<Skeleton className="h-4 w-20" />
								</div>
								<Skeleton className="h-4 w-24" />
							</div>
						</CardHeader>
						<CardContent>
							<div className="flex gap-2">
								<Skeleton className="h-8 w-8" />
								<Skeleton className="h-8 w-8" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	)
}
