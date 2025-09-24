import { Resend } from "resend"
import { 
	getEmailVerificationTemplate, 
	getPasswordResetTemplate, 
	getTwoFactorEmailTemplate,
	getWelcomeEmailTemplate 
} from "./email-templates"

const resend = new Resend(process.env.RESEND_API_KEY)

export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
	try {
		const result = await resend.emails.send({
			from: process.env.EMAIL_FROM as string,
			to,
			subject,
			html,
		})
		
		console.log(`Email enviado para ${to}:`, result)
		return result
	} catch (error) {
		console.error(`Erro ao enviar email para ${to}:`, error)
		throw error
	}
}

export async function sendVerificationEmail({ 
	user, 
	url 
}: { 
	user: { email: string; name?: string }; 
	url: string 
}) {
	const html = getEmailVerificationTemplate({ 
		userName: user.name, 
		url 
	})
	
	return sendEmail({
		to: user.email,
		subject: "Verifique seu email - Mercado304",
		html,
	})
}

export async function sendPasswordResetEmail({ 
	user, 
	url 
}: { 
	user: { email: string; name?: string }; 
	url: string 
}) {
	const html = getPasswordResetTemplate({ 
		userName: user.name, 
		url 
	})
	
	return sendEmail({
		to: user.email,
		subject: "Redefinir senha - Mercado304",
		html,
	})
}

export async function sendTwoFactorEmail({ 
	user, 
	code 
}: { 
	user: { email: string; name?: string }; 
	code: string 
}) {
	const html = getTwoFactorEmailTemplate({ 
		userName: user.name, 
		code 
	})
	
	return sendEmail({
		to: user.email,
		subject: "Código de verificação - Mercado304",
		html,
	})
}

export async function sendWelcomeEmail({ 
	user 
}: { 
	user: { email: string; name?: string } 
}) {
	const html = getWelcomeEmailTemplate({ 
		userName: user.name 
	})
	
	return sendEmail({
		to: user.email,
		subject: "Bem-vindo ao Mercado304! 🎉",
		html,
	})
}
