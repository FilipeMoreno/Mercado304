import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ProductsSkeleton() {
	return (
		<div className="space-y-6">
			<div className="flex justify-between items-center">
				<div>
					<Skeleton className="h-9 w-32 mb-2" />
					<Skeleton className="h-5 w-64" />
				</div>
				<div className="hidden sm:block">
					<Skeleton className="h-10 w-36 rounded-md" />
				</div>
			</div>

			<div className="flex items-center gap-2">
				<Skeleton className="h-10 flex-1 rounded-md" />
				<Skeleton className="h-10 w-10 rounded-md" />
			</div>

			<div className="flex justify-between items-center">
				<Skeleton className="h-5 w-48" />
				<Skeleton className="h-5 w-32" />
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
				{Array.from({ length: 12 }).map((_, i) => (
					<Card key={i}>
						<CardHeader className="pb-3">
							<div className="flex items-center gap-3 mb-2">
								<Skeleton className="h-8 w-8 rounded-xl" />
								<div className="flex-1 space-y-1">
									<Skeleton className="h-5 w-3/4" />
									<Skeleton className="h-4 w-1/2" />
								</div>
							</div>
							<div className="space-y-2 pt-1">
								<Skeleton className="h-4 w-24" />
								<Skeleton className="h-4 w-16" />
							</div>
						</CardHeader>
						<CardContent className="flex-1 p-0" />
						<CardFooter>
							<div className="flex gap-2 w-full">
								<Skeleton className="h-9 flex-1 rounded-md" />
								<Skeleton className="h-9 w-9 rounded-md" />
							</div>
						</CardFooter>
					</Card>
				))}
			</div>

			<div className="flex justify-center items-center gap-2">
				<Skeleton className="h-8 w-24 rounded-md" />
				<div className="flex gap-1">
					<Skeleton className="h-8 w-8 rounded-md" />
					<Skeleton className="h-8 w-8 rounded-md" />
				</div>
				<Skeleton className="h-8 w-24 rounded-md" />
			</div>
		</div>
	)
}