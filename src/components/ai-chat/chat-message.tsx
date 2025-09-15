"use client"

import { Bot, RefreshCw } from "lucide-react"
import ReactMarkdown from "react-markdown"
import { Button } from "@/components/ui/button"

interface ChatMessageProps {
	role: "user" | "assistant"
	content: string
	isError?: boolean
	isStreaming?: boolean
	onRetry?: () => void
	canRetry?: boolean
}

export function ChatMessage({ role, content, isError, isStreaming, onRetry, canRetry }: ChatMessageProps) {
	return (
		<div className={`flex gap-2 ${role === "user" ? "justify-end" : ""}`}>
			{role === "assistant" && (
				<Bot className={`h-6 w-6 flex-shrink-0 ${isError ? "text-red-500" : "text-blue-700"}`} />
			)}
			<div className={`max-w-[80%] ${role === "user" ? "flex justify-end" : ""}`}>
				<div className="flex flex-col gap-2">
					<div
						className={`rounded-lg px-3 py-2 text-sm ${
							role === "user"
								? "bg-primary text-primary-foreground"
								: isError
									? "bg-red-50 text-red-700 border border-red-200"
									: "bg-muted"
						}`}
					>
						{role === "assistant" ? (
							<div className="prose prose-sm max-w-none">
								<ReactMarkdown
									components={{
										p: ({ children }) => <p className="my-1 last:mb-0">{children}</p>,
										ul: ({ children }) => <ul className="my-1 ml-4 list-disc last:mb-0">{children}</ul>,
										ol: ({ children }) => <ol className="my-1 ml-4 list-decimal last:mb-0">{children}</ol>,
										li: ({ children }) => <li className="my-0">{children}</li>,
										strong: ({ children }) => <strong className="font-bold">{children}</strong>,
										em: ({ children }) => <em className="italic">{children}</em>,
									}}
								>
									{content}
								</ReactMarkdown>
							</div>
						) : (
							content
						)}
					</div>
					{isError && canRetry && onRetry && (
						<Button
							variant="outline"
							size="sm"
							onClick={onRetry}
							className="self-start text-xs text-red-600 border-red-200 hover:bg-red-50"
						>
							<RefreshCw className="h-3 w-3 mr-1" />
							Tentar novamente
						</Button>
					)}
				</div>
			</div>
			{isStreaming && (
				<div className="mt-2 ml-8">
					<div className="flex items-center gap-1">
						<div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
						<span className="text-xs text-muted-foreground animate-pulse">gerando resposta...</span>
					</div>
				</div>
			)}
		</div>
	)
}
