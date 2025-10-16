import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { toast } from "sonner"

type ReauthOperation = "enable-2fa" | "disable-2fa" | "disable-email-2fa" | "generate-backup-codes"

interface UseReauthOptions {
  onSuccess?: (authToken: string, operation: ReauthOperation) => void
  onError?: (error: string) => void
}

export function useReauth(options: UseReauthOptions = {}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isReauthenticating, setIsReauthenticating] = useState(false)

  useEffect(() => {
    // Verifica se voltou de uma reautenticação bem-sucedida
    const reauthSuccess = searchParams.get("reauth_success")
    const operation = searchParams.get("operation") as ReauthOperation
    const authToken = searchParams.get("auth_token")
    const error = searchParams.get("error")

    if (error) {
      const message = searchParams.get("message") || "Erro na reautenticação"
      toast.error(message)
      options.onError?.(message)

      // Limpa os parâmetros da URL
      router.replace("/conta/seguranca")
      return
    }

    if (reauthSuccess === "true" && authToken && operation) {
      console.log("Reauth success detected:", { operation, authToken: authToken.substring(0, 20) + "..." })
      toast.success("Reautenticação bem-sucedida! Processando operação...")

      // Chama o callback de sucesso
      if (options.onSuccess) {
        options.onSuccess(authToken, operation)
      }

      // Limpa os parâmetros da URL após um delay para garantir que o callback foi executado
      setTimeout(() => {
        router.replace("/conta/seguranca")
      }, 100)
    }
  }, [searchParams, router])

  const initiateReauth = async (operation: ReauthOperation) => {
    setIsReauthenticating(true)
    try {
      const response = await fetch("/api/auth/reauth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Erro ao iniciar reautenticação")
      }

      const { reauthUrl } = await response.json()

      // Redireciona para o Google para reautenticação
      window.location.href = reauthUrl
    } catch (error: any) {
      toast.error(error.message || "Erro ao iniciar reautenticação")
      setIsReauthenticating(false)
      options.onError?.(error.message)
    }
  }

  const validateReauthToken = async (authToken: string, operation: ReauthOperation): Promise<boolean> => {
    try {
      const response = await fetch("/api/auth/reauth/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ authToken, operation }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Token inválido")
      }

      const { valid } = await response.json()
      return valid
    } catch (error: any) {
      toast.error(error.message || "Erro ao validar reautenticação")
      return false
    }
  }

  return {
    initiateReauth,
    validateReauthToken,
    isReauthenticating,
  }
}

