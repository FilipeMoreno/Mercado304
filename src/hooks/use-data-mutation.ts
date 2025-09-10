import { useState } from "react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { AppToasts } from "@/lib/toasts";

interface MutationOptions {
  onSuccess?: (data?: any) => void
  onError?: (error: string) => void
  successMessage?: string
  errorMessage?: string
}

export function useDataMutation() {
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const mutate = async (
    url: string, 
    options: RequestInit, 
    mutationOptions?: MutationOptions
  ) => {
    setLoading(true)
    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error || `Erro ${response.status}: ${response.statusText}`)
      }

      const data = await response.json().catch(() => ({}))
      
      if (mutationOptions?.successMessage) {
        AppToasts.success(mutationOptions.successMessage);
      }
      
      if (mutationOptions?.onSuccess) {
        mutationOptions.onSuccess(data)
      }
      
      router.refresh()
      return data
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro na operação'
      
      if (mutationOptions?.errorMessage) {
        AppToasts.error(mutationOptions.errorMessage);
      } else {
        AppToasts.error(errorMessage);
      }
      
      if (mutationOptions?.onError) {
        mutationOptions.onError(errorMessage)
      }
      
      console.error('Erro na mutação:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const create = async (url: string, data: any, options?: MutationOptions) => {
    return mutate(url, {
      method: 'POST',
      body: JSON.stringify(data)
    }, options)
  }

  const update = async (url: string, data: any, options?: MutationOptions) => {
    return mutate(url, {
      method: 'PUT',
      body: JSON.stringify(data)
    }, options)
  }

  const remove = async (url: string, options?: MutationOptions) => {
    return mutate(url, {
      method: 'DELETE'
    }, options)
  }

  return {
    mutate,
    create,
    update,
    remove,
    loading
  }
}