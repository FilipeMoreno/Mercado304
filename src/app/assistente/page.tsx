"use client";

import { ArrowLeft, Bot, Send } from "lucide-react";
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

export default function AssistentePage() {
	const [input, setInput] = useState("");
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
		<div className="max-w-4xl mx-auto">
			{/* Header */}
			<div className="mb-6">
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-4">
						<Link href="/">
							<Button variant="outline" size="sm" className="gap-2">
								<ArrowLeft className="h-4 w-4" />
								Voltar
							</Button>
						</Link>
						<div className="flex items-center gap-3">
							<div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-full flex items-center justify-center shadow-lg">
								<Bot className="h-6 w-6 text-white" />
							</div>
							<div>
								<h1 className="text-2xl font-bold text-gray-900">
									Zé, o Assistente
								</h1>
								<p className="text-sm text-gray-600">
									Seu assistente inteligente para compras
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>

			{/* Chat Container */}
			<Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
				<CardHeader className="border-b bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-t-lg">
					<CardTitle className="flex items-center gap-2">
						<Bot className="h-5 w-5" />
						Conversa com o Zé
					</CardTitle>
				</CardHeader>
				<CardContent className="p-0">
					{/* Chat Messages */}
					<ScrollArea className="h-[calc(100vh-300px)] p-6">
						<div className="space-y-6">
							{messages.map((msg, index) => (
								<div key={index}>
									<ChatMessage
										role={msg.role}
										content={msg.content}
										isError={msg.isError}
										isStreaming={msg.isStreaming}
										onRetry={retryLastMessage}
										canRetry={msg.isError && !!lastUserMessage && !isLoading}
									/>
									{msg.selectionCard && (
										<div className="mt-4 ml-12">
											{msg.selectionCard.type === "churrascometro" ? (
												<ChurrascoCard onCalculate={handleChurrascoCalculate} />
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

					{/* Input Form */}
					<div className="p-6 border-t bg-gray-50/50">
						<form onSubmit={handleSendMessage} className="flex gap-4">
							<Input
								value={input}
								onChange={(e) => setInput(e.target.value)}
								placeholder="Digite sua mensagem aqui..."
								disabled={isLoading}
								className="flex-1 h-12 text-base bg-white border-2 border-gray-200 focus:border-blue-500 transition-all duration-200"
							/>
							<Button
								type="submit"
								disabled={isLoading || !input.trim()}
								className="h-12 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
							>
								<Send className="h-4 w-4 mr-2" />
								Enviar
							</Button>
						</form>
					</div>
				</CardContent>
			</Card>

			{/* Tips */}
			<div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
				<Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
					<CardContent className="p-4 text-center">
						<Bot className="h-8 w-8 text-blue-600 mx-auto mb-2" />
						<p className="text-sm text-gray-700 font-medium">
							Peça para criar listas de compras
						</p>
					</CardContent>
				</Card>
				<Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
					<CardContent className="p-4 text-center">
						<Bot className="h-8 w-8 text-indigo-600 mx-auto mb-2" />
						<p className="text-sm text-gray-700 font-medium">
							Compare preços entre mercados
						</p>
					</CardContent>
				</Card>
				<Card className="bg-white/70 backdrop-blur-sm border-0 shadow-md hover:shadow-lg transition-shadow">
					<CardContent className="p-4 text-center">
						<Bot className="h-8 w-8 text-purple-600 mx-auto mb-2" />
						<p className="text-sm text-gray-700 font-medium">
							Calcule seu churrasco perfeito
						</p>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
