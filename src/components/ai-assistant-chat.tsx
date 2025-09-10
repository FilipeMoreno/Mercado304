"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";
import { useAiChat } from "@/hooks/use-ai-chat";
import { ChatMessage } from "@/components/ai-chat/chat-message";
import { SelectionCard } from "@/components/ai-chat/selection-cards";
import { ChurrascoCard } from "@/components/ai-chat/churrasco-card";
import { TypingIndicator } from "@/components/ai-chat/typing-indicator";

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
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.3 }}
            className="w-14 h-14 rounded-full bg-blue-600 flex items-center justify-center shadow-lg hover:bg-blue-700 transition"
          >
            <Sparkles className="h-6 w-6 text-white" />
          </motion.button>
        )}

        {isOpen && (
          <motion.div
            key="chat"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="w-96 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-blue-700" />
                  Zé, o assistente
                </CardTitle>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                  className="rounded-full"
                >
                  <X className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-72 pr-4">
                  <div className="space-y-4">
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
                          <div className="mt-3 ml-8">
                            {msg.selectionCard.type === 'churrascometro' ? (
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
                    {isLoading && (
                      <TypingIndicator />
                    )}
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
