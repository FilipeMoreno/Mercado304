import { removeBackground } from '@imgly/background-removal'

export interface BackgroundRemovalOptions {
  quality?: number
  outputFormat?: 'image/png' | 'image/jpeg' | 'image/webp'
}

export interface BackgroundRemovalResult {
  blob: Blob
  url: string
  processingTime: number
}

/**
 * Remove o fundo de uma imagem usando IA
 */
export async function removeImageBackground(
  file: File,
  options: BackgroundRemovalOptions = {},
): Promise<BackgroundRemovalResult> {
  const startTime = Date.now()

  const { quality = 0.9, outputFormat = 'image/png' } = options

  try {
    const imgUrl = URL.createObjectURL(file)

    const blob = await removeBackground(imgUrl, {
      progress: (key, current, total) => {
        console.log(`[Background Removal] ${key}: ${Math.round((current / total) * 100)}%`)
      },
    })

    URL.revokeObjectURL(imgUrl)

    let finalBlob = blob
    if (outputFormat !== 'image/png') {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      await new Promise((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx?.drawImage(img, 0, 0)

          canvas.toBlob(
            (convertedBlob) => {
              if (convertedBlob) {
                finalBlob = convertedBlob
                resolve(null)
              } else {
                reject(new Error('Erro ao converter blob'))
              }
            },
            outputFormat,
            quality,
          )
        }
        img.onerror = reject
        img.src = URL.createObjectURL(blob)
      })

      URL.revokeObjectURL(img.src)
    }

    const processingTime = Date.now() - startTime
    const url = URL.createObjectURL(finalBlob)

    console.log(`✅ Fundo removido em ${processingTime}ms`)

    return {
      blob: finalBlob,
      url,
      processingTime,
    }
  } catch (error) {
    console.error('❌ Erro ao remover fundo:', error)
    throw new Error(
      `Falha ao remover fundo da imagem: ${error instanceof Error ? error.message : 'Erro desconhecido'}`,
    )
  }
}

export function isBackgroundRemovalSupported(): boolean {
  return typeof window !== 'undefined' && 'Worker' in window
}

export function estimateProcessingTime(fileSizeMB: number): number {
  return Math.round(fileSizeMB * 3 * 1000)
}



