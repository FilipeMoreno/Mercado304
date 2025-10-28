import { S3Client } from "@aws-sdk/client-s3"

// Validar variáveis de ambiente
const requiredEnvVars = {
	R2_ENDPOINT: process.env.R2_ENDPOINT,
	R2_ACCESS_KEY_ID: process.env.R2_ACCESS_KEY_ID,
	R2_SECRET_ACCESS_KEY: process.env.R2_SECRET_ACCESS_KEY,
	R2_BUCKET_NAME: process.env.R2_BUCKET_NAME,
	R2_PUBLIC_URL: process.env.R2_PUBLIC_URL,
}

// Verificar se todas as variáveis estão definidas
const missingVars = Object.entries(requiredEnvVars)
	.filter(([, value]) => !value)
	.map(([key]) => key)

if (missingVars.length > 0) {
	console.warn(`Variáveis de ambiente R2 não configuradas: ${missingVars.join(", ")}`)
}

// Configuração do cliente R2 (Cloudflare)
export const r2Client = new S3Client({
	region: "auto",
	endpoint: process.env.R2_ENDPOINT,
	credentials: {
		accessKeyId: process.env.R2_ACCESS_KEY_ID || "",
		secretAccessKey: process.env.R2_SECRET_ACCESS_KEY || "",
	},
})

// Configurações do bucket
export const R2_BUCKET_NAME = process.env.R2_BUCKET_NAME || ""
export const R2_PUBLIC_URL = process.env.R2_PUBLIC_URL || ""
