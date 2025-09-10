import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export default function WasteSkeleton() {
	return (
		<div className="container mx-auto p-6">
			{/* Header */}
			<div className="flex justify-between items-center mb-6">
				<div>
					<Skeleton className="h-8 w-64 mb-2" />
					<Skeleton className="h-4 w-80" />
				</div>
				<Skeleton className="h-10 w-48" />
			</div>

			{/* Stats Cards */}
			<div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
							<Skeleton className="h-4 w-32" />
							<Skeleton className="h-4 w-4" />
						</CardHeader>
						<CardContent>
							<Skeleton className="h-8 w-24 mb-1" />
							<Skeleton className="h-3 w-16" />
						</CardContent>
					</Card>
				))}
			</div>

			{/* Filters */}
			<div className="flex flex-col sm:flex-row gap-4 mb-6">
				<Skeleton className="h-10 flex-1" />
				<Skeleton className="h-10 w-full sm:w-48" />
			</div>

			{/* Waste Records List */}
			<div className="space-y-4">
				{[1, 2, 3, 4].map((i) => (
					<Card key={i}>
						<CardContent className="p-6">
							<div className="flex items-start justify-between">
								<div className="flex-1">
									<div className="flex items-start gap-4">
										<div className="flex-1">
											<Skeleton className="h-6 w-48 mb-2" />
											<div className="flex items-center gap-4 mb-2">
												<Skeleton className="h-4 w-16" />
												<Skeleton className="h-4 w-20" />
												<Skeleton className="h-4 w-24" />
												<Skeleton className="h-4 w-32" />
											</div>
											<div className="flex items-center gap-2">
												<Skeleton className="h-6 w-20" />
												<Skeleton className="h-6 w-16" />
												<Skeleton className="h-6 w-24" />
											</div>
										</div>
									</div>
								</div>
								<Skeleton className="h-8 w-8" />
							</div>
						</CardContent>
					</Card>
				))}
			</div>
		</div>
	);
}
