import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { emailOTP, haveIBeenPwned, lastLoginMethod, oneTap, twoFactor } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { emailHarmony } from "better-auth-harmony"
import { localization } from "better-auth-localization"
import { sendPasswordResetEmail, sendTwoFactorEmail, sendVerificationEmail } from "./email"
import { prisma } from "./prisma"

export const auth = betterAuth({
	secret: process.env.BETTER_AUTH_SECRET || "fallback-secret-for-development-only",
	rateLimit: {
		window: 60, // 1 minuto
		max: 10, // 10 tentativas por minuto (mais restritivo)
		enabled: true,
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	user: {
		// Adiciona campos customizados ao objeto user na sessão
		additionalFields: {
			twoFactorEmailEnabled: {
				type: "boolean",
				defaultValue: false,
				input: false, // Não aceita input do usuário
			},
		},
	},
	emailVerification: {
		sendOnSignUp: true,
		autoSignInAfterVerification: true,
		sendVerificationEmail: async ({ user, url }: { user: { id: string; createdAt: Date; updatedAt: Date; emailVerified: boolean; name: string; email?: string; image?: string }; url: string; token: string }) => {
			try {
				await sendVerificationEmail({ user: { email: user.email!, name: user.name }, url })
				console.log(`[Better Auth] Email de verificação enviado para ${user.email}`)
			} catch (error) {
				console.error(`[Better Auth] Erro ao enviar email de verificação para ${user.email}:`, error)
				throw error
			}
		},
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false, // Permitimos login, mas middleware controla acesso
		sendResetPassword: async ({ user, url }: { user: { id: string; createdAt: Date; updatedAt: Date; emailVerified: boolean; name: string; email?: string; image?: string }; url: string; token: string }) => {
			try {
				await sendPasswordResetEmail({ user: { email: user.email!, name: user.name }, url })
				console.log(`[Better Auth] Email de reset de senha enviado para ${user.email}`)
			} catch (error) {
				console.error(`[Better Auth] Erro ao enviar email de reset para ${user.email}:`, error)
				throw error
			}
		},
	},
	socialProviders: {
		google: {
			clientId: process.env.AUTH_GOOGLE_ID as string,
			clientSecret: process.env.AUTH_GOOGLE_SECRET as string,
		},
	},
	session: {
		expiresIn: 60 * 60 * 24 * 7, // 1 week
		updateAge: 60 * 60 * 24, // 1 day
	},
	trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3000"],
	plugins: [
		oneTap({
			clientId: process.env.AUTH_GOOGLE_ID as string,
		}),
		haveIBeenPwned({
			customPasswordCompromisedMessage:
				"Essa senha foi comprometida em vazamentos! Por sua segurança, recomendo trocar por uma senha mais forte e única.",
		}),
		emailHarmony({
			allowNormalizedSignin: true,
		}),
		emailOTP({
			async sendVerificationOTP({ email, otp, type }) {
				console.log(`[EmailOTP] Sending ${type} OTP to ${email}`)

				try {
					await sendTwoFactorEmail({
						user: { email },
						code: otp,
					})
					console.log(`[EmailOTP] OTP sent successfully`)
				} catch (error) {
					console.error(`[EmailOTP] Error sending OTP:`, error)
					throw error
				}
			},
			otpLength: 6,
			expiresIn: 600, // 10 minutos
			sendVerificationOnSignUp: false,
			disableSignUp: true,
		}),
		twoFactor({
			backupCodeOptions: {
				amount: 10,
			},
		}),
		passkey({
			rpName: "Mercado304",
			rpID:
				process.env.NODE_ENV === "production"
					? process.env.BETTER_AUTH_URL
						? new URL(process.env.BETTER_AUTH_URL).hostname
						: "mercado.filipemoreno.com.br"
					: "localhost",
			origin:
				process.env.NODE_ENV === "production"
					? process.env.BETTER_AUTH_URL || "https://mercado.filipemoreno.com.br"
					: "http://localhost:3000",
		}),
		lastLoginMethod({
			storeInDatabase: true,
		}),
		localization({
			defaultLocale: "pt-BR",
			fallbackLocale: "default",
		}),
	],
})
