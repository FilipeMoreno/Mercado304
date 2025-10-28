import { DeleteObjectCommand } from "@aws-sdk/client-s3"
import { R2_BUCKET_NAME, r2Client } from "./r2-client"

/**
 * Deleta uma imagem do R2
 * @param imageUrl URL completa da imagem no R2
 * @returns Promise<boolean> true se deletado com sucesso
 */
export async function deleteImageFromR2(imageUrl: string): Promise<boolean> {
	try {
		// Extrair o nome do arquivo da URL
		const url = new URL(imageUrl)
		const fileName = url.pathname.substring(1) // Remove a barra inicial

		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: fileName,
		})

		await r2Client.send(command)
		return true
	} catch (error) {
		console.error("Erro ao deletar imagem do R2:", error)
		return false
	}
}

/**
 * Extrai o nome do arquivo de uma URL do R2
 * @param imageUrl URL da imagem
 * @returns Nome do arquivo ou null se não for uma URL válida
 */
export function extractFileNameFromR2Url(imageUrl: string): string | null {
	try {
		const url = new URL(imageUrl)
		return url.pathname.substring(1) // Remove a barra inicial
	} catch {
		return null
	}
}
