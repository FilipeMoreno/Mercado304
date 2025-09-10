"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Drumstick } from "lucide-react";

interface ChurrascoCardProps {
  onCalculate: (data: {
    adults: number;
    children: number;
    drinkers: number;
    preferences: string;
  }) => void;
}

export function ChurrascoCard({ onCalculate }: ChurrascoCardProps) {
  const [adults, setAdults] = useState(10);
  const [children, setChildren] = useState(2);
  const [drinkers, setDrinkers] = useState(8);
  const [preferences, setPreferences] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCalculate({ adults, children, drinkers, preferences });
  };

  return (
    <form onSubmit={handleSubmit} className="bg-muted/50 rounded-lg p-3 space-y-3">
      <div className="text-sm text-muted-foreground">
        Claro! Por favor, preencha os detalhes abaixo para o churrasco.
      </div>
      <div className="space-y-2">
        <div className="grid grid-cols-3 gap-2">
          <div>
            <Label htmlFor="adults-chat" className="text-xs">Adultos</Label>
            <Input 
              id="adults-chat" 
              type="number" 
              value={adults} 
              onChange={e => setAdults(Number(e.target.value))} 
              className="h-8"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="children-chat" className="text-xs">Crianças</Label>
            <Input 
              id="children-chat" 
              type="number" 
              value={children} 
              onChange={e => setChildren(Number(e.target.value))} 
              className="h-8"
              min="0"
            />
          </div>
          <div>
            <Label htmlFor="drinkers-chat" className="text-xs">Bebem</Label>
            <Input 
              id="drinkers-chat" 
              type="number" 
              value={drinkers} 
              onChange={e => setDrinkers(Number(e.target.value))} 
              className="h-8"
              min="0"
              max={adults}
            />
          </div>
        </div>
        <div>
          <Label htmlFor="preferences-chat" className="text-xs">Preferências (opcional)</Label>
          <Input 
            id="preferences-chat" 
            value={preferences} 
            onChange={e => setPreferences(e.target.value)} 
            placeholder="Ex: vegetariano, mais carne, sem álcool" 
            className="h-8" 
          />
        </div>
        <Button type="submit" className="w-full">
          <Drumstick className="mr-2 h-4 w-4" />
          Calcular Churrasco
        </Button>
      </div>
    </form>
  );
}