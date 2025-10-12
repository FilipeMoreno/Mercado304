import { PrismaClient } from "@prisma/client"
import { betterAuth } from "better-auth"
import { prismaAdapter } from "better-auth/adapters/prisma"
import { haveIBeenPwned, lastLoginMethod, oneTap, twoFactor } from "better-auth/plugins"
import { passkey } from "better-auth/plugins/passkey"
import { emailHarmony } from "better-auth-harmony"
import { localization } from "better-auth-localization"
import { sendPasswordResetEmail, sendVerificationEmail } from "./email"

const prisma = new PrismaClient()

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
	emailVerification: {
		sendOnSignUp: true,
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
			try {
				await sendPasswordResetEmail({ user, url })
				console.log(`Email de reset de senha enviado para ${user.email}`)
			} catch (error) {
				console.error(`Erro ao enviar email de reset para ${user.email}:`, error)
			}
		},
		sendVerificationEmail: async ({ user, url }: { user: { email: string; name?: string }; url: string }) => {
			try {
				await sendVerificationEmail({ user, url })
				console.log(`Email de verificação enviado para ${user.email}`)
			} catch (error) {
				console.error(`Erro ao enviar email de verificação para ${user.email}:`, error)
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
	trustedOrigins: [process.env.BETTER_AUTH_URL || "http://localhost:3001"],
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
					: "http://localhost:3001",
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
