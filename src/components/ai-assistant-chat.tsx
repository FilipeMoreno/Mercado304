"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, Send, Sparkles, X, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { motion, AnimatePresence } from "framer-motion";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean; // Indica se é uma mensagem de erro
  isStreaming?: boolean; // Indica se é uma mensagem sendo transmitida
  selectionCard?: {
    type: 'products' | 'markets' | 'categories' | 'brands' | 'shopping-lists';
    options: any[];
    searchTerm: string;
    context?: any; // Contexto da operação original
  };
}

interface SelectionCardProps {
  type: string;
  options: any[];
  searchTerm: string;
  context?: any;
  onSelect: (option: any, index: number) => void;
}

// Componente de indicador de digitação
function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center">
      <Bot className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
      <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-1">
        <div className="flex space-x-1">
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-2 h-2 bg-muted-foreground/60 rounded-full animate-bounce"></div>
        </div>
        <span className="text-xs text-muted-foreground ml-2">Zé está digitando...</span>
      </div>
    </div>
  );
}

function SelectionCard({ type, options, searchTerm, context, onSelect }: SelectionCardProps) {
  const getCardContent = (option: any, index: number) => {
    switch (type) {
      case 'products':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <div className="text-xs text-muted-foreground">
              {option.brand && <span>Marca: {option.brand}</span>}
              {option.category && <span> • Categoria: {option.category}</span>}
              {option.barcode && <span> • Código: {option.barcode}</span>}
            </div>
          </div>
        );
      case 'markets':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            {option.location && <span className="text-xs text-muted-foreground">{option.location}</span>}
          </div>
        );
      case 'categories':
        return (
          <div className="flex items-center gap-2">
            {option.icon && <span className="text-lg">{option.icon}</span>}
            <div className="flex flex-col gap-1">
              <span className="font-medium">{option.name}</span>
              {option.isFood && <span className="text-xs text-green-600">🍽️ Alimento</span>}
            </div>
          </div>
        );
      case 'brands':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <span className="text-xs text-muted-foreground">{option.productCount} produtos</span>
          </div>
        );
      case 'shopping-lists':
        return (
          <div className="flex flex-col gap-1">
            <span className="font-medium">{option.name}</span>
            <span className="text-xs text-muted-foreground">
              {option.itemCount} itens • {new Date(option.updatedAt).toLocaleDateString('pt-BR')}
            </span>
          </div>
        );
      default:
        return <span className="font-medium">{option.name}</span>;
    }
  };

  return (
    <div className="bg-muted/50 rounded-lg p-3 space-y-3">
      <div className="text-sm text-muted-foreground">
        Encontradas {options.length} opções para "{searchTerm}". Escolha uma:
      </div>
      <div className="space-y-2">
        {options.map((option, index) => (
          <Button
            key={option.id || index}
            variant="outline"
            className="w-full justify-start h-auto p-3 hover:bg-blue-50 hover:border-blue-200"
            onClick={() => onSelect(option, index)}
          >
            {getCardContent(option, index)}
          </Button>
        ))}
      </div>
    </div>
  );
}

export function AiAssistantChat() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Olá, eu sou o Zé! Estou aqui para te ajudar a economizar e organizar suas compras. O que vamos fazer hoje?" },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [pendingContext, setPendingContext] = useState<any>(null);
  const [lastUserMessage, setLastUserMessage] = useState<string>("");

  const handleSelection = async (option: any, index: number) => {
    const lastMessage = messages[messages.length - 1];
    if (!lastMessage.selectionCard) return;

    // Adiciona a seleção como uma nova mensagem do usuário
    const selectionMessage: Message = { 
      role: "user", 
      content: `Selecionei: ${option.name}` 
    };
    setMessages((prev) => [...prev, selectionMessage]);
    setIsLoading(true);

    try {
      // Envia a seleção de volta para a API com contexto
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: `SELEÇÃO_FEITA: ${JSON.stringify({
            type: lastMessage.selectionCard.type,
            selectedOption: option,
            selectedIndex: index,
            originalContext: lastMessage.selectionCard.context,
            searchTerm: lastMessage.selectionCard.searchTerm
          })}`,
          history: [...messages, selectionMessage]
        }),
      });

      if (!response.ok) {
        throw new Error("A IA não conseguiu processar a seleção.");
      }

      const data = await response.json();
      const assistantMessage: Message = { 
        role: "assistant", 
        content: data.reply,
        isError: data.error || false
      };
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Adiciona mensagem de erro diretamente no chat
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ Não foi possível processar sua seleção. Tente novamente.",
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const retryLastMessage = async () => {
    if (!lastUserMessage.trim() || isLoading) return;
    
    setIsLoading(true);
    await sendMessageToApi(lastUserMessage);
  };

  const sendMessageToApi = async (messageContent: string, useStreaming: boolean = true) => {
    if (useStreaming) {
      return await sendStreamingMessage(messageContent);
    }

    // Fallback para mensagem não-streaming (para function calls complexas)
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageContent, 
          history: messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("A IA não conseguiu processar o seu pedido.");
      }

      const data = await response.json();
      
      // Verifica se a resposta contém dados de seleção
      let assistantMessage: Message = { 
        role: "assistant", 
        content: data.reply,
        isError: data.error || false
      };
      
      // Parse da resposta para verificar se contém cards de seleção
      if (data.selectionData && data.selectionData.showCards) {
        assistantMessage.selectionCard = {
          type: data.selectionData.cardType,
          options: data.selectionData.options,
          searchTerm: data.selectionData.searchTerm,
          context: data.selectionData.context
        };
      }
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      // Adiciona mensagem de erro diretamente no chat
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ Não foi possível processar sua mensagem. Verifique sua conexão e tente novamente.",
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const sendStreamingMessage = async (messageContent: string) => {
    try {
      const response = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: messageContent,
          stream: true,
          history: messages.map(msg => ({
            role: msg.role,
            parts: [{ text: msg.content }]
          }))
        }),
      });

      if (!response.ok) {
        throw new Error("A IA não conseguiu processar o seu pedido.");
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error("Não foi possível obter o reader do stream");

      // Adiciona mensagem de resposta inicial (vazia, para streaming)
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        content: "",
        isStreaming: true
      }]);

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              
              if (data.error) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = { 
                    ...newMessages[lastIndex], 
                    content: data.content, 
                    isError: true, 
                    isStreaming: false 
                  };
                  return newMessages;
                });
                break;
              }
              
              if (data.final) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = { 
                    ...newMessages[lastIndex], 
                    isStreaming: false 
                  };
                  return newMessages;
                });
                break;
              }
              
              if (data.content) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = { 
                    ...newMessages[lastIndex], 
                    content: newMessages[lastIndex].content + data.content 
                  };
                  return newMessages;
                });
              }

              if (data.selectionData) {
                setMessages((prev) => {
                  const newMessages = [...prev];
                  const lastIndex = newMessages.length - 1;
                  newMessages[lastIndex] = { 
                    ...newMessages[lastIndex], 
                    selectionCard: {
                      type: data.selectionData.cardType,
                      options: data.selectionData.options,
                      searchTerm: data.selectionData.searchTerm,
                      context: data.selectionData.context
                    },
                    isStreaming: false
                  };
                  return newMessages;
                });
              }
            } catch (e) {
              console.error('Erro ao parsear dados do stream:', e);
            }
          }
        }
      }
    } catch (error) {
      // Adiciona mensagem de erro diretamente no chat
      const errorMessage: Message = {
        role: "assistant",
        content: "❌ Não foi possível processar sua mensagem. Verifique sua conexão e tente novamente.",
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setLastUserMessage(input);
    setInput("");
    setIsLoading(true);

    await sendMessageToApi(userMessage.content);
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
                  <Bot className="h-5 w-5 text-blue-500" />
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
                        <div
                          className={`flex gap-2 ${
                            msg.role === "user" ? "justify-end" : ""
                          }`}
                        >
                          {msg.role === "assistant" && (
                            <Bot className={`h-6 w-6 flex-shrink-0 ${msg.isError ? "text-red-500" : ""}`} />
                          )}
                          <div className={`max-w-[80%] ${msg.role === "user" ? "flex justify-end" : ""}`}>
                            <div className="flex flex-col gap-2">
                              <p
                                className={`rounded-lg px-3 py-2 text-sm ${
                                  msg.role === "user"
                                    ? "bg-primary text-primary-foreground"
                                    : msg.isError
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-muted"
                                }`}
                              >
                                {msg.content}
                              </p>
                              {msg.isError && lastUserMessage && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={retryLastMessage}
                                  disabled={isLoading}
                                  className="self-start text-xs text-red-600 border-red-200 hover:bg-red-50"
                                >
                                  <RefreshCw className="h-3 w-3 mr-1" />
                                  Tentar novamente
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        {msg.selectionCard && (
                          <div className="mt-3 ml-8">
                            <SelectionCard
                              type={msg.selectionCard.type}
                              options={msg.selectionCard.options}
                              searchTerm={msg.selectionCard.searchTerm}
                              context={msg.selectionCard.context}
                              onSelect={handleSelection}
                            />
                          </div>
                        )}
                        {msg.isStreaming && (
                          <div className="mt-2 ml-8">
                            <div className="flex items-center gap-1">
                              <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse"></div>
                              <span className="text-xs text-muted-foreground animate-pulse">gerando resposta...</span>
                            </div>
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
                    placeholder="Ex: Crie uma lista para o churrasco..."
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
