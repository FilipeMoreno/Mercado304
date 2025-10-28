// Teste simples para verificar se o R2 está configurado corretamente
import { R2_BUCKET_NAME, R2_PUBLIC_URL, } from "./r2-client"

export async function testR2Connection(): Promise<boolean> {
	try {
		// Verificar se as variáveis estão configuradas
		if (!R2_BUCKET_NAME || !R2_PUBLIC_URL) {
			console.error("Variáveis de ambiente R2 não configuradas")
			return false
		}

		console.log("✅ Configuração R2 carregada com sucesso")
		console.log(`Bucket: ${R2_BUCKET_NAME}`)
		console.log(`URL Pública: ${R2_PUBLIC_URL}`)

		return true
	} catch (error) {
		console.error("❌ Erro na configuração R2:", error)
		return false
	}
}

// Executar teste se este arquivo for importado diretamente
if (typeof window === "undefined") {
	testR2Connection()
}
