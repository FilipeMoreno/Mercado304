import { Resend } from "resend"
import {
	getEmailVerificationTemplate,
	getNewSessionTemplate,
	getPasswordResetTemplate,
	getSecurityAlertTemplate,
	getTwoFactorEmailTemplate,
	getWelcomeEmailTemplate,
} from "./email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
	try {
		console.log(`[Resend] Tentando enviar email...`)
		console.log(`[Resend] De: ${process.env.EMAIL_FROM}`)
		console.log(`[Resend] Para: ${to}`)
		console.log(`[Resend] Assunto: ${subject}`)
		console.log(`[Resend] API Key configurada: ${process.env.RESEND_API_KEY ? "SIM" : "NÃO"}`)

		const result = await resend.emails.send({
			from: process.env.EMAIL_FROM as string,
			to,
			subject,
			html,
		})

		console.log(`[Resend] ✅ Email enviado com sucesso!`)
		console.log(`[Resend] ID do email:`, result.data?.id)
		console.log(`[Resend] Resultado completo:`, JSON.stringify(result, null, 2))
		return result
	} catch (error) {
		console.error(`[Resend] ❌ ERRO ao enviar email para ${to}:`)
		console.error(`[Resend] Detalhes do erro:`, error)
		if (error instanceof Error) {
			console.error(`[Resend] Mensagem:`, error.message)
			console.error(`[Resend] Stack:`, error.stack)
		}
		throw error
	}
}

export async function sendVerificationEmail({ user, url }: { user: { email: string; name?: string }; url: string }) {
	console.log(`[SendVerificationEmail] Preparando email de verificação para ${user.email}`)
	console.log(`[SendVerificationEmail] URL de verificação:`, url)
	console.log(`[SendVerificationEmail] Nome do usuário:`, user.name || "Não fornecido")

	const html = getEmailVerificationTemplate({
		userName: user.name,
		url,
	})

	console.log(`[SendVerificationEmail] Template HTML gerado (primeiros 200 caracteres):`, html.substring(0, 200))

	return sendEmail({
		to: user.email,
		subject: "Verifique seu email - Mercado304",
		html,
	})
}

export async function sendPasswordResetEmail({ user, url }: { user: { email: string; name?: string }; url: string }) {
	const html = getPasswordResetTemplate({
		userName: user.name,
		url,
	})

	return sendEmail({
		to: user.email,
		subject: "Redefinir senha - Mercado304",
		html,
	})
}

export async function sendTwoFactorEmail({ user, code }: { user: { email: string; name?: string }; code: string }) {
	const html = getTwoFactorEmailTemplate({
		userName: user.name,
		code,
	})

	return sendEmail({
		to: user.email,
		subject: "Código de verificação - Mercado304",
		html,
	})
}

export async function sendWelcomeEmail({ user }: { user: { email: string; name?: string } }) {
	const html = getWelcomeEmailTemplate({
		userName: user.name,
	})

	return sendEmail({
		to: user.email,
		subject: "Bem-vindo ao Mercado304! 🎉",
		html,
	})
}

export async function sendSecurityAlertEmail({
	user,
	action,
	device,
	location,
	ipAddress,
	timestamp,
}: {
	user: { email: string; name?: string }
	action: string
	device?: string
	location?: string
	ipAddress?: string
	timestamp?: string
}) {
	const html = getSecurityAlertTemplate({
		userName: user.name,
		action,
		device,
		location,
		ipAddress,
		timestamp,
	})

	return sendEmail({
		to: user.email,
		subject: "🔔 Alerta de Segurança - Mercado304",
		html,
	})
}

export async function sendNewSessionEmail({
	user,
	device,
	location,
	ipAddress,
	timestamp,
}: {
	user: { email: string; name?: string }
	device?: string
	location?: string
	ipAddress?: string
	timestamp?: string
}) {
	const html = getNewSessionTemplate({
		userName: user.name,
		action: "", // não usado neste template
		device,
		location,
		ipAddress,
		timestamp,
	})

	return sendEmail({
		to: user.email,
		subject: "🔐 Novo Login Detectado - Mercado304",
		html,
	})
}
