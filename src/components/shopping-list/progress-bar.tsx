import { Card, CardContent } from "@/components/ui/card"

interface ProgressBarProps {
	completedItems: number
	totalItems: number
	progress: number
}

export function ProgressBar({ completedItems, totalItems, progress }: ProgressBarProps) {
	return (
		<Card>
			<CardContent className="pt-6">
				<div className="flex items-center justify-between mb-2">
					<span className="text-sm font-medium">Progresso da Lista</span>
					<span className="text-sm text-gray-600">
						{completedItems}/{totalItems}
					</span>
				</div>
				<div className="w-full bg-gray-200 rounded-full h-2">
					<div
						className="bg-green-500 h-2 rounded-full transition-all duration-300"
						style={{ width: `${progress}%` }}
					></div>
				</div>
			</CardContent>
		</Card>
	)
}
