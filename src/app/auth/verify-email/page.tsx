import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined };
}) {
  const token = searchParams.token as string;

  if (!token) {
    return redirect("/auth/signin");
  }

  const verificationToken = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verificationToken) {
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
                <CardTitle>Token inválido</CardTitle>
                <CardDescription>
                  O token de verificação é inválido ou não foi encontrado.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (new Date() > verificationToken.expires) {
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
                <CardTitle>Token expirado</CardTitle>
                <CardDescription>
                  O token de verificação expirou. Por favor, solicite um novo.
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  await prisma.user.update({
    where: { email: verificationToken.identifier },
    data: { emailVerified: new Date() },
  });

  await prisma.verificationToken.delete({
    where: { token },
  });

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
              <CardTitle>Email verificado</CardTitle>
              <CardDescription>
                Seu email foi verificado com sucesso.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center text-sm text-muted-foreground">
                Agora você pode fazer login na sua conta.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link href="/auth/signin">Fazer login</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}