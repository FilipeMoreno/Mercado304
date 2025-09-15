import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function PasskeysSkeleton() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<Skeleton className="h-6 w-20 mb-2" />
						<Skeleton className="h-4 w-64" />
					</div>
					<Skeleton className="h-9 w-32" />
				</div>
			</CardHeader>
			<CardContent>
				<div className="space-y-4">
					{/* Alert skeleton */}
					<div className="flex items-start space-x-3 p-4 rounded-lg border bg-muted/10">
						<Skeleton className="h-4 w-4 mt-0.5" />
						<Skeleton className="h-4 w-80" />
					</div>

					{/* Passkey items skeleton */}
					<div className="space-y-3">
						{Array.from({ length: 2 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
								<div className="flex items-center space-x-3">
									<div className="p-2 rounded-full bg-muted">
										<Skeleton className="h-4 w-4" />
									</div>
									<div className="flex-1">
										<div className="flex items-center space-x-2 mb-1">
											<Skeleton className="h-4 w-24" />
											<Skeleton className="h-5 w-16 rounded-full" />
										</div>
										<Skeleton className="h-3 w-40 mb-2" />
										<div className="flex items-center space-x-4">
											<Skeleton className="h-3 w-20" />
											<Skeleton className="h-4 w-12 rounded-full" />
										</div>
									</div>
								</div>
								<div className="flex items-center space-x-2">
									<Skeleton className="h-8 w-20" />
								</div>
							</div>
						))}
					</div>

					{/* Multi passkey info skeleton */}
					<div className="p-3 bg-muted/20 border rounded-lg">
						<div className="flex items-center space-x-2 mb-1">
							<Skeleton className="h-4 w-4" />
							<Skeleton className="h-4 w-48" />
						</div>
						<Skeleton className="h-3 w-full" />
						<Skeleton className="h-3 w-3/4 mt-1" />
					</div>
				</div>
			</CardContent>
		</Card>
	)
}
