import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";

export default function VerifyRequestPage() {
  return (
    <div className="container relative flex-col items-center justify-center grid lg:grid-cols-2">
      <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500 via-blue-600 to-cyan-700" />
        <div className="relative z-20 flex items-center text-lg font-medium">
          <ShoppingCart className="mr-2 h-6 w-6" />
          Mercado304
        </div>
        <div className="relative z-20 mt-auto">
          <blockquote className="space-y-2">
            <p className="text-lg">
              "Gerencie suas compras de forma inteligente e eficiente. Controle seu estoque, 
              compare preços e nunca mais desperdice alimentos."
            </p>
            <footer className="text-sm">Sistema de Gestão de Compras</footer>
          </blockquote>
        </div>
      </div>
      <div className="lg:p-8">
        <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[350px]">
          <Card>
            <CardHeader>
              <CardTitle>Verifique seu email</CardTitle>
              <CardDescription>
                Um link de verificação foi enviado para o seu endereço de email.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Por favor, verifique sua caixa de entrada e siga as instruções para completar o seu cadastro.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}