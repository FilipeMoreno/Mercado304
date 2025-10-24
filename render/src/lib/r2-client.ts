// render/src/lib/r2-client.ts
// Cliente para Cloudflare R2 (S3-compatible)

import {
	DeleteObjectCommand,
	GetObjectCommand,
	ListObjectsV2Command,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3"
import { getSignedUrl } from "@aws-sdk/s3-request-presigner"

const R2_ACCOUNT_ID = process.env.R2_ACCOUNT_ID
const R2_ACCESS_KEY_ID = process.env.R2_ACCESS_KEY_ID
const R2_SECRET_ACCESS_KEY = process.env.R2_SECRET_ACCESS_KEY
const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || "mercado304"

if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
	console.warn("⚠️ R2 credentials not configured. Backup uploads will be disabled.")
}

// Cliente S3 configurado para Cloudflare R2
export const r2Client = new S3Client({
	region: "auto",
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID || "",
		secretAccessKey: R2_SECRET_ACCESS_KEY || "",
	},
})

/**
 * Upload de arquivo para R2
 */
export async function uploadToR2(
	key: string,
	body: Buffer | Uint8Array | string,
	contentType: string = "application/octet-stream",
	metadata?: Record<string, string>,
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return {
				success: false,
				error: "R2 credentials not configured",
			}
		}

		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			Body: body,
			ContentType: contentType,
			Metadata: metadata,
		})

		await r2Client.send(command)

		// Gerar URL pública (se configurado)
		const publicUrl = `https://${R2_BUCKET_NAME}.${R2_ACCOUNT_ID}.r2.cloudflarestorage.com/${key}`

		return {
			success: true,
			url: publicUrl,
		}
	} catch (error) {
		console.error("Error uploading to R2:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Download de arquivo do R2
 */
export async function downloadFromR2(key: string): Promise<{ success: boolean; data?: Buffer; error?: string }> {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return {
				success: false,
				error: "R2 credentials not configured",
			}
		}

		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		})

		const response = await r2Client.send(command)
		const chunks: Uint8Array[] = []

		if (response.Body) {
			for await (const chunk of response.Body as AsyncIterable<Uint8Array>) {
				chunks.push(chunk)
			}
		}

		const data = Buffer.concat(chunks)
		return {
			success: true,
			data,
		}
	} catch (error) {
		console.error("Error downloading from R2:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Listar arquivos no R2
 */
export async function listR2Files(
	prefix?: string,
): Promise<{ success: boolean; files?: Array<{ key: string; size: number; lastModified: Date }>; error?: string }> {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return {
				success: false,
				error: "R2 credentials not configured",
			}
		}

		const command = new ListObjectsV2Command({
			Bucket: R2_BUCKET_NAME,
			Prefix: prefix,
		})

		const response = await r2Client.send(command)
		const files = (response.Contents || []).map((obj) => ({
			key: obj.Key || "",
			size: obj.Size || 0,
			lastModified: obj.LastModified || new Date(),
		}))

		return {
			success: true,
			files,
		}
	} catch (error) {
		console.error("Error listing R2 files:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Deletar arquivo do R2
 */
export async function deleteFromR2(key: string): Promise<{ success: boolean; error?: string }> {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return {
				success: false,
				error: "R2 credentials not configured",
			}
		}

		const command = new DeleteObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		})

		await r2Client.send(command)

		return {
			success: true,
		}
	} catch (error) {
		console.error("Error deleting from R2:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}

/**
 * Gerar URL assinada para download
 */
export async function getSignedDownloadUrl(
	key: string,
	expiresIn: number = 3600,
): Promise<{ success: boolean; url?: string; error?: string }> {
	try {
		if (!R2_ACCOUNT_ID || !R2_ACCESS_KEY_ID || !R2_SECRET_ACCESS_KEY) {
			return {
				success: false,
				error: "R2 credentials not configured",
			}
		}

		const command = new GetObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
		})

		const url = await getSignedUrl(r2Client, command, { expiresIn })
		return {
			success: true,
			url,
		}
	} catch (error) {
		console.error("Error generating signed URL:", error)
		return {
			success: false,
			error: error instanceof Error ? error.message : "Unknown error",
		}
	}
}
