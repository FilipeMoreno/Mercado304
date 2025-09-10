"use client";

import { Bot } from "lucide-react";

export function TypingIndicator() {
  return (
    <div className="flex gap-2 items-center">
      <Bot className="h-6 w-6 flex-shrink-0 text-muted-foreground" />
      <div className="bg-muted rounded-lg px-3 py-2 flex items-center gap-1">
        <div className="flex space-x-1">
          <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
          <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
          <div className="w-1 h-1 bg-muted-foreground/60 rounded-full animate-bounce"></div>
        </div>
        <span className="text-xs text-muted-foreground ml-2">Zé está digitando...</span>
      </div>
    </div>
  );
}