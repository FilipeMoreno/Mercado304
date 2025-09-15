import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function RecipesSkeleton() {
	return (
		<div className="space-y-6">
			{/* Header */}
			<div className="flex justify-between items-center">
				<div>
					<Skeleton className="h-9 w-48 mb-2" />
					<Skeleton className="h-5 w-80" />
				</div>
				<Skeleton className="h-10 w-40" />
			</div>

			{/* Recipes Card */}
			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<Card key={i} className="hover:shadow-md transition-shadow">
								<CardHeader>
									<Skeleton className="h-6 w-36 mb-1" />
									<Skeleton className="h-4 w-24" />
								</CardHeader>
								<CardContent>
									<Skeleton className="h-10 w-full mb-4" />
									<div className="flex gap-2">
										<Skeleton className="h-8 w-16" />
										<Skeleton className="h-8 w-8" />
									</div>
								</CardContent>
							</Card>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
