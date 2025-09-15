import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function DashboardSkeleton() {
	return (
		<div className="space-y-6">
			<div>
				<Skeleton className="h-9 w-48 mb-2" />
				<Skeleton className="h-5 w-96" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
				{Array.from({ length: 4 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-24" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-16" />
						</CardContent>
					</Card>
				))}
			</div>

			<Card className="md:col-span-2">
				<CardHeader>
					<Skeleton className="h-6 w-48 mb-2" />
					<Skeleton className="h-4 w-64" />
				</CardHeader>
				<CardContent>
					<div className="h-64 animate-pulse rounded-lg" />
				</CardContent>
			</Card>

			<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 5 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div className="flex items-center gap-3">
										<Skeleton className="w-6 h-6 rounded-full" />
										<div>
											<Skeleton className="h-4 w-24 mb-1" />
											<Skeleton className="h-3 w-16" />
										</div>
									</div>
									<div className="text-right">
										<Skeleton className="h-4 w-16 mb-1" />
										<Skeleton className="h-3 w-12" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>

				<Card>
					<CardHeader>
						<Skeleton className="h-6 w-40" />
						<Skeleton className="h-4 w-32" />
					</CardHeader>
					<CardContent>
						<div className="space-y-3">
							{Array.from({ length: 3 }).map((_, i) => (
								<div key={i} className="flex items-center justify-between">
									<div>
										<Skeleton className="h-4 w-28 mb-1" />
										<Skeleton className="h-3 w-16" />
									</div>
									<div className="text-right">
										<Skeleton className="h-4 w-16 mb-1" />
										<Skeleton className="h-3 w-20" />
									</div>
								</div>
							))}
						</div>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardHeader>
					<Skeleton className="h-6 w-32" />
					<Skeleton className="h-4 w-40" />
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{Array.from({ length: 5 }).map((_, i) => (
							<div key={i} className="flex items-center justify-between p-3 border rounded-lg">
								<div className="flex items-center gap-3">
									<Skeleton className="h-5 w-5" />
									<div>
										<Skeleton className="h-4 w-24 mb-1" />
										<Skeleton className="h-3 w-16" />
									</div>
								</div>
								<div className="text-right">
									<Skeleton className="h-4 w-16 mb-1" />
									<Skeleton className="h-3 w-12" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
