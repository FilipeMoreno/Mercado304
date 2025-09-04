"use client";

import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

export function LoadingAnimated() {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4">
      <Loader2 className={cn("h-10 w-10 animate-spin text-primary")} />
      <span className="mt-4 text-lg">Carregando...</span>
    </div>
  );
}