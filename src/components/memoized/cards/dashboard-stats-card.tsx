"use client"

import { memo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

interface DashboardStatsCardMemoProps {
	title: string
	description: string
	icon: React.ReactNode
	children: React.ReactNode
}

export const DashboardStatsCardMemo = memo<DashboardStatsCardMemoProps>(
	({ title, description, icon, children }) => {
		return (
			<Card className="shadow-sm hover:shadow-lg transition-shadow">
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						{icon}
						{title}
					</CardTitle>
					<CardDescription>{description}</CardDescription>
				</CardHeader>
				<CardContent>{children}</CardContent>
			</Card>
		)
	},
	(prevProps, nextProps) => {
		return prevProps.title === nextProps.title && prevProps.description === nextProps.description
	},
)

DashboardStatsCardMemo.displayName = "DashboardStatsCardMemo"
