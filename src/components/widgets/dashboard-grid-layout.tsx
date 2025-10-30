"use client"

import { useState } from "react"
import { Responsive, WidthProvider, type Layout } from "react-grid-layout"
import "react-grid-layout/css/styles.css"
import "react-resizable/css/styles.css"
import { GRID_CONFIG } from "@/config/widgets"
import type { ResponsiveWidgetLayouts, WidgetLayout, WidgetType } from "@/types/dashboard-widgets"

const ResponsiveGridLayout = WidthProvider(Responsive)

interface DashboardGridLayoutProps {
	layouts: ResponsiveWidgetLayouts
	isEditing: boolean
	onLayoutChange?: (layouts: ResponsiveWidgetLayouts) => void
	children: React.ReactNode
}

export function DashboardGridLayout({
	layouts,
	isEditing,
	onLayoutChange,
	children,
}: DashboardGridLayoutProps) {
	const [currentBreakpoint, setCurrentBreakpoint] = useState<string>("lg")

const handleLayoutChange = (currentLayout: Layout[], allLayouts: any) => {
		if (isEditing && onLayoutChange) {
			const responsiveLayouts: ResponsiveWidgetLayouts = {
				lg: allLayouts.lg || [],
				md: allLayouts.md || [],
				sm: allLayouts.sm || [],
				xs: allLayouts.xs || [],
				xxs: allLayouts.xxs || [],
			}
			onLayoutChange(responsiveLayouts)
		}
	}

const handleBreakpointChange = (breakpoint: string) => {
		setCurrentBreakpoint(breakpoint)
}

	return (
		<div className="w-full">
			<ResponsiveGridLayout
				className="layout"
				layouts={{
					lg: layouts.lg,
					md: layouts.md,
					sm: layouts.sm,
					xs: layouts.xs,
					xxs: layouts.xxs,
				}}
				breakpoints={GRID_CONFIG.breakpoints}
				cols={GRID_CONFIG.cols}
				rowHeight={GRID_CONFIG.rowHeight}
				margin={GRID_CONFIG.margin}
				containerPadding={GRID_CONFIG.containerPadding}
				isDraggable={isEditing}
				isResizable={isEditing}
				onLayoutChange={handleLayoutChange}
				onBreakpointChange={handleBreakpointChange}
				compactType="vertical"
				preventCollision={false}
				useCSSTransforms={true}
				draggableHandle=".cursor-move"
			>
				{children}
			</ResponsiveGridLayout>

			{/* Indicador de breakpoint em modo de edição */}
			{isEditing && (
				<div className="fixed bottom-4 left-4 bg-primary text-primary-foreground px-3 py-2 rounded-lg shadow-lg text-xs font-medium z-50">
					Breakpoint: {currentBreakpoint} ({GRID_CONFIG.cols[currentBreakpoint as keyof typeof GRID_CONFIG.cols]}{" "}
					colunas)
				</div>
			)}
		</div>
	)
}
