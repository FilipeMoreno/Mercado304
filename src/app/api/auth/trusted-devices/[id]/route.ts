import { headers } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getRequestInfo } from "@/lib/auth-logger"
import { prisma } from "@/lib/prisma"
import { logSecurityEvent, SecurityEventType } from "@/lib/security-utils"

/**
 * Endpoint para remover um dispositivo confiável
 */
export async function DELETE(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
	try {
		const session = await auth.api.getSession({
			headers: await headers(),
		})

		if (!session?.user) {
			return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
		}

		const { id } = await params

		// Verifica se o dispositivo pertence ao usuário
		const device = await prisma.trustedDevice.findFirst({
			where: {
				id,
				userId: session.user.id,
			},
		})

		if (!device) {
			return NextResponse.json({ error: "Dispositivo não encontrado" }, { status: 404 })
		}

		// Remove o dispositivo
		await prisma.trustedDevice.delete({
			where: { id },
		})

		// Registra evento de segurança
		const { ipAddress, userAgent } = await getRequestInfo()
		await logSecurityEvent({
			userId: session.user.id,
			eventType: SecurityEventType.LOGIN_SUCCESS, // Poderia criar um novo tipo "TRUSTED_DEVICE_REMOVED"
			ipAddress,
			userAgent,
			location: undefined,
			metadata: {
				action: "trusted_device_removed",
				deviceId: id,
			},
		}).catch((err) => console.error("Failed to log device removal:", err))

		return NextResponse.json({ success: true })
	} catch (error: any) {
		console.error("[TrustedDevices] Error removing device:", error)
		return NextResponse.json({ error: error.message || "Erro ao remover dispositivo" }, { status: 500 })
	}
}
