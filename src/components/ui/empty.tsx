"use client"

import type * as React from "react"

import { cn } from "@/lib/utils"

interface EmptyProps extends React.HTMLAttributes<HTMLDivElement> {}

export function Empty({ className, children, ...props }: EmptyProps) {
	return (
		<div className={cn("flex w-full flex-col items-center justify-center text-center", className)} {...props}>
			{children}
		</div>
	)
}

export function EmptyHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("flex flex-col items-center gap-2", className)} {...props}>
			{children}
		</div>
	)
}

export function EmptyMedia({
	className,
	variant = "default",
	children,
	...props
}: React.HTMLAttributes<HTMLDivElement> & { variant?: "default" | "icon" }) {
	return (
		<div
			className={cn(
				"flex items-center justify-center rounded-md",
				variant === "icon" ? "size-12 bg-muted text-muted-foreground" : "",
				className,
			)}
			{...props}
		>
			{children}
		</div>
	)
}

export function EmptyTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
	return (
		<h3 className={cn("text-lg font-semibold", className)} {...props}>
			{children}
		</h3>
	)
}

export function EmptyDescription({ className, children, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
	return (
		<p className={cn("text-sm text-muted-foreground", className)} {...props}>
			{children}
		</p>
	)
}

export function EmptyContent({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
	return (
		<div className={cn("mt-4", className)} {...props}>
			{children}
		</div>
	)
}
