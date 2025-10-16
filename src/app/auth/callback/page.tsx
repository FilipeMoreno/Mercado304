"use client"

import { Loader2, ShoppingCart } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { useSession } from "@/lib/auth-client"
import { showAuthSuccess } from "@/lib/auth-errors"

export default function AuthCallbackPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session, isPending: sessionLoading } = useSession()
  const [hasProcessed, setHasProcessed] = useState(false)

  useEffect(() => {
    if (sessionLoading || hasProcessed) return

    if (session?.user) {
      // Login bem-sucedido via OAuth
      const provider = searchParams.get("provider") || "google"

      // Salva o método de login usado
      localStorage.setItem("lastLoginMethod", provider)

      // Mostra toast de sucesso
      showAuthSuccess("signin")

      setHasProcessed(true)

      // Verifica se email está verificado antes de redirecionar
      if (!session.user.emailVerified) {
        router.push("/auth/verify-request")
      } else {
        router.push("/")
      }
    } else if (!sessionLoading) {
      // Se não há sessão após o callback, houve algum erro
      router.push("/auth/signin")
    }
  }, [session, sessionLoading, hasProcessed, router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
        <p className="text-muted-foreground">Finalizando autenticação...</p>
      </div>
    </div>
  )
}

