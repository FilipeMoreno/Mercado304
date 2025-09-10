"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Bot, ExternalLink, Send, Sparkles, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ChatMessage } from "@/components/ai-chat/chat-message";
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card";
import { SelectionCard } from "@/components/ai-chat/selection-cards";
import { TypingIndicator } from "@/components/ai-chat/typing-indicator";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAiChat } from "@/hooks/use-ai-chat";

export function AiAssistantChat() {
	const [input, setInput] = useState("");
	const [isOpen, setIsOpen] = useState(false);
	const {
		messages,
		isLoading,
		lastUserMessage,
		sendMessage,
		retryLastMessage,
		handleSelection,
		handleChurrascoCalculate,
	} = useAiChat();

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim()) return;

		await sendMessage(input);
		setInput("");
	};

	return (
		<div className="fixed bottom-4 right-4 z-50">
			<AnimatePresence>
				{!isOpen && (
					<motion.button
						key="bubble"
						onClick={() => setIsOpen(true)}
						initial={{ opacity: 0, scale: 0.5, y: 40, rotate: -180 }}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
							rotate: 0,
							boxShadow: [
								"0 4px 20px rgba(59, 130, 246, 0.4)",
								"0 8px 30px rgba(59, 130, 246, 0.6)",
								"0 4px 20px rgba(59, 130, 246, 0.4)",
							],
						}}
						exit={{
							opacity: 0,
							scale: 0.3,
							y: 40,
							rotate: 180,
							transition: { duration: 0.2 },
						}}
						whileHover={{
							scale: 1.1,
							boxShadow: "0 10px 40px rgba(59, 130, 246, 0.8)",
							transition: { duration: 0.2 },
						}}
						whileTap={{ scale: 0.95 }}
						transition={{
							duration: 0.5,
							type: "spring",
							stiffness: 200,
							damping: 20,
							boxShadow: {
								duration: 2,
								repeat: Infinity,
								repeatType: "reverse",
							},
						}}
						className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 flex items-center justify-center shadow-2xl border-2 border-white/20 backdrop-blur-sm"
					>
						<Sparkles className="h-7 w-7 text-white drop-shadow-lg" />
						<div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/20 to-transparent"></div>
					</motion.button>
				)}

				{isOpen && (
					<motion.div
						key="chat"
						initial={{
							opacity: 0,
							scale: 0.8,
							y: 50,
							x: 20,
						}}
						animate={{
							opacity: 1,
							scale: 1,
							y: 0,
							x: 0,
						}}
						exit={{
							opacity: 0,
							scale: 0.7,
							y: 50,
							x: 20,
							transition: { duration: 0.2 },
						}}
						transition={{
							duration: 0.4,
							type: "spring",
							stiffness: 300,
							damping: 30,
						}}
					>
						<Card className="w-96 shadow-2xl border-0 bg-white/95 backdrop-blur-md">
							<CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
								<CardTitle className="flex items-center gap-2">
									<div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
										<Bot className="h-4 w-4" />
									</div>
									Zé, o assistente
								</CardTitle>
								<div className="flex items-center gap-1">
									<Link href="/assistente">
										<Button
											variant="ghost"
											size="icon"
											className="rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors"
											title="Abrir em página completa"
										>
											<ExternalLink className="h-4 w-4" />
										</Button>
									</Link>
									<Button
										variant="ghost"
										size="icon"
										onClick={() => setIsOpen(false)}
										className="rounded-full h-8 w-8 text-white hover:bg-white/20 transition-colors"
									>
										<X className="h-4 w-4" />
									</Button>
								</div>
							</CardHeader>
							<CardContent>
								<ScrollArea className="h-72 pr-4 mt-4">
									<div className="space-y-4">
										{messages.map((msg, index) => (
											<div key={index}>
												<ChatMessage
													role={msg.role}
													content={msg.content}
													isError={msg.isError}
													isStreaming={msg.isStreaming}
													onRetry={retryLastMessage}
													canRetry={
														msg.isError && !!lastUserMessage && !isLoading
													}
												/>
												{msg.selectionCard && (
													<div className="mt-3 ml-8">
														{msg.selectionCard.type === "churrascometro" ? (
															<ChurrascoCard
																onCalculate={handleChurrascoCalculate}
															/>
														) : (
															<SelectionCard
																type={msg.selectionCard.type}
																options={msg.selectionCard.options}
																searchTerm={msg.selectionCard.searchTerm}
																context={msg.selectionCard.context}
																onSelect={handleSelection}
															/>
														)}
													</div>
												)}
											</div>
										))}
										{isLoading && <TypingIndicator />}
									</div>
								</ScrollArea>
								<form onSubmit={handleSendMessage} className="mt-4 flex gap-2">
									<Input
										value={input}
										onChange={(e) => setInput(e.target.value)}
										placeholder="Como posso ajudar você hoje?"
										disabled={isLoading}
									/>
									<Button type="submit" size="icon" disabled={isLoading}>
										<Send className="h-4 w-4" />
									</Button>
								</form>
							</CardContent>
						</Card>
					</motion.div>
				)}
			</AnimatePresence>
		</div>
	);
}
