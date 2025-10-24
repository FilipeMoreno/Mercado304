// render/src/lib/crypto-utils.ts
// Utilitários de criptografia e checksum para backups

import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto"
import { promisify } from "node:util"

const randomBytesAsync = promisify(randomBytes)

// Chave de criptografia (em produção, deve vir de variável de ambiente)
const ENCRYPTION_KEY = process.env.BACKUP_ENCRYPTION_KEY || "mercado304-backup-key-2024"
const ALGORITHM = "aes-256-cbc"

/**
 * Gera checksum SHA-256 de um buffer
 */
export function generateChecksum(data: Buffer): string {
	const hash = createHash("sha256")
	hash.update(data)
	return hash.digest("hex")
}

/**
 * Verifica se o checksum de um buffer está correto
 */
export function verifyChecksum(data: Buffer, expectedChecksum: string): boolean {
	const actualChecksum = generateChecksum(data)
	return actualChecksum === expectedChecksum
}

/**
 * Criptografa dados usando AES-256-CBC
 */
export async function encryptData(data: Buffer): Promise<{ encrypted: Buffer; iv: Buffer }> {
	const iv = await randomBytesAsync(16) // Vetor de inicialização
	const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)) // Garantir 32 bytes
	const cipher = createCipheriv(ALGORITHM, key, iv)

	const encrypted = Buffer.concat([cipher.update(data), cipher.final()])

	return { encrypted, iv }
}

/**
 * Descriptografa dados usando AES-256-CBC
 */
export function decryptData(encryptedData: Buffer, iv: Buffer): Buffer {
	const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, "0").slice(0, 32)) // Garantir 32 bytes
	const decipher = createDecipheriv(ALGORITHM, key, iv)

	const decrypted = Buffer.concat([decipher.update(encryptedData), decipher.final()])

	return decrypted
}

/**
 * Criptografa dados e retorna com IV concatenado
 */
export async function encryptDataWithIV(data: Buffer): Promise<Buffer> {
	const { encrypted, iv } = await encryptData(data)
	// Concatenar IV + dados criptografados
	return Buffer.concat([iv, encrypted])
}

/**
 * Descriptografa dados com IV concatenado
 */
export function decryptDataWithIV(encryptedDataWithIV: Buffer): Buffer {
	// Extrair IV (primeiros 16 bytes) e dados criptografados
	const iv = encryptedDataWithIV.subarray(0, 16)
	const encryptedData = encryptedDataWithIV.subarray(16)

	return decryptData(encryptedData, iv)
}

/**
 * Gera metadados de segurança para backup
 */
export async function generateSecurityMetadata(
	data: Buffer,
	encrypt: boolean = true,
): Promise<{
	checksum: string
	encrypted: boolean
	originalSize: number
	encryptedSize?: number
	algorithm?: string
}> {
	const checksum = generateChecksum(data)
	const metadata: {
		checksum: string
		encrypted: boolean
		originalSize: number
		encryptedSize?: number
		algorithm?: string
	} = {
		checksum,
		encrypted: encrypt,
		originalSize: data.length,
	}

	if (encrypt) {
		const encryptedData = await encryptDataWithIV(data)
		metadata.encryptedSize = encryptedData.length
		metadata.algorithm = ALGORITHM
	}

	return metadata
}

/**
 * Valida e descriptografa dados de backup se necessário
 */
export async function validateAndDecryptBackup(
	data: Buffer,
	metadata: {
		checksum: string
		encrypted: boolean
		originalSize: number
		encryptedSize?: number
		algorithm?: string
	},
	decrypt: boolean = true,
): Promise<{ data: Buffer; valid: boolean; error?: string }> {
	try {
		let processedData = data

		// Descriptografar se necessário
		if (metadata.encrypted && decrypt) {
			if (data.length !== metadata.encryptedSize) {
				return {
					data: Buffer.alloc(0),
					valid: false,
					error: "Tamanho dos dados criptografados não confere",
				}
			}

			processedData = decryptDataWithIV(data)

			if (processedData.length !== metadata.originalSize) {
				return {
					data: Buffer.alloc(0),
					valid: false,
					error: "Tamanho dos dados descriptografados não confere",
				}
			}
		}

		// Verificar checksum
		if (!verifyChecksum(processedData, metadata.checksum)) {
			return {
				data: Buffer.alloc(0),
				valid: false,
				error: "Checksum não confere - arquivo pode estar corrompido",
			}
		}

		return {
			data: processedData,
			valid: true,
		}
	} catch (error) {
		return {
			data: Buffer.alloc(0),
			valid: false,
			error: error instanceof Error ? error.message : "Erro desconhecido na validação",
		}
	}
}
