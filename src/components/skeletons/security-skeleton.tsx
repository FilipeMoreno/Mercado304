import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function SecurityOverviewSkeleton() {
	return (
		<div className="grid gap-6 md:grid-cols-2">
			{/* Two-Factor Card Skeleton */}
			<Card>
				<CardHeader>
					<div className="flex items-center space-x-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-4 w-24" />
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-4 w-full" />
				</CardContent>
				<CardFooter>
					<Skeleton className="h-10 w-full" />
				</CardFooter>
			</Card>

			{/* Passkeys Card Skeleton */}
			<Card>
				<CardHeader>
					<div className="flex items-center space-x-3">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-32" />
							<Skeleton className="h-4 w-20" />
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Skeleton className="h-4 w-full" />
				</CardContent>
				<CardFooter>
					<Skeleton className="h-10 w-full" />
				</CardFooter>
			</Card>
		</div>
	)
}

export function SessionsSkeleton() {
	return (
		<Card>
			<CardHeader>
				<div className="flex items-center gap-2">
					<Skeleton className="size-5" />
					<Skeleton className="h-6 w-32" />
				</div>
				<Skeleton className="h-4 w-48 mt-2" />
			</CardHeader>
			<CardContent>
				<div className="space-y-3">
					{[1, 2, 3].map((i) => (
						<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
							<div className="flex items-center space-x-3 flex-1">
								<Skeleton className="size-10 rounded-full" />
								<div className="flex-1 space-y-2">
									<div className="flex items-center space-x-2">
										<Skeleton className="h-5 w-40" />
										{i === 1 && <Skeleton className="h-5 w-16" />}
									</div>
									<Skeleton className="h-4 w-64" />
									<Skeleton className="h-3 w-48" />
								</div>
							</div>
							{i !== 1 && <Skeleton className="h-9 w-24" />}
						</div>
					))}
				</div>
			</CardContent>
		</Card>
	)
}

export function PasskeysListSkeleton() {
	return (
		<div className="space-y-3">
			{[1, 2].map((i) => (
				<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3 flex-1">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<div className="flex items-center space-x-2">
								<Skeleton className="h-5 w-32" />
								<Skeleton className="h-5 w-20" />
							</div>
							<Skeleton className="h-4 w-48" />
							<div className="flex items-center space-x-4 mt-1">
								<Skeleton className="h-3 w-24" />
								<Skeleton className="h-5 w-16" />
							</div>
						</div>
					</div>
					<Skeleton className="h-9 w-24" />
				</div>
			))}
		</div>
	)
}

export function TwoFactorSkeleton() {
	return (
		<div className="space-y-6">
			{[1, 2].map((i) => (
				<div key={i} className="flex items-center justify-between p-4 border rounded-lg">
					<div className="flex items-center space-x-3 flex-1">
						<Skeleton className="size-10 rounded-full" />
						<div className="flex-1 space-y-2">
							<Skeleton className="h-5 w-48" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
					<div className="flex items-center space-x-3">
						<Skeleton className="h-5 w-12" />
						<Skeleton className="h-6 w-11 rounded-full" />
					</div>
				</div>
			))}
		</div>
	)
}
