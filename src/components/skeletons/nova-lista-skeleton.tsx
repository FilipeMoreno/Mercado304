import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function NovaListaSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex items-center gap-4">
				<Skeleton className="h-9 w-20" />
				<div>
					<Skeleton className="h-9 w-48 mb-2" />
					<Skeleton className="h-5 w-80" />
				</div>
			</div>

			<Card className="max-w-4xl">
				<CardHeader>
					<div className="flex items-center gap-2">
						<Skeleton className="size-5" />
						<Skeleton className="h-6 w-40" />
					</div>
				</CardHeader>
				<CardContent className="space-y-4">
					<div className="space-y-2">
						<Skeleton className="h-4 w-32" />
						<Skeleton className="h-10 w-full" />
					</div>
				</CardContent>
			</Card>

			<Card className="max-w-4xl">
				<CardHeader>
					<div className="flex justify-between items-center">
						<div className="flex items-center gap-2">
							<Skeleton className="size-5" />
							<Skeleton className="h-6 w-32" />
						</div>
						<Skeleton className="h-10 w-36" />
					</div>
				</CardHeader>
				<CardContent>
					<div className="space-y-4">
						{Array.from({ length: 3 }).map((_, i) => (
							<div key={i} className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-lg">
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<div className="flex gap-2">
										<Skeleton className="h-10 flex-1" />
										<Skeleton className="size-10" />
										<Skeleton className="size-10" />
									</div>
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-24" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-16" />
									<Skeleton className="h-10 w-full" />
								</div>
								<div className="space-y-2">
									<Skeleton className="h-4 w-12" />
									<div className="flex items-center gap-2">
										<Skeleton className="h-10 flex-1" />
										<Skeleton className="size-10" />
									</div>
								</div>
							</div>
						))}
					</div>

					<div className="flex justify-between items-center pt-6 border-t mt-6">
						<Skeleton className="h-6 w-48" />
						<div className="flex gap-3">
							<Skeleton className="h-10 w-32" />
							<Skeleton className="h-10 w-24" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
