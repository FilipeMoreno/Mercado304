import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { haveIBeenPwned, lastLoginMethod, oneTap, twoFactor } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import { localization } from "better-auth-localization";
import { emailHarmony } from 'better-auth-harmony';
import { passkey } from "better-auth/plugins/passkey";

const prisma = new PrismaClient();

export const auth = betterAuth({
	rateLimit: {
		window: 10,
		max: 100,
		enabled: true
	},
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailVerification: {
		sendOnSignUp: true
	},
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: false,
		sendResetPassword: async ({ user, url }) => {
			console.log(`Reset password URL for ${user.email}: ${url}`);
		},
		sendVerificationEmail: async ({ user, url }) => {
			console.log(`Verification URL for ${user.email}: ${url}`);
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
		// NOVO: Adiciona o plugin One Tap
		oneTap({
			google: {
				clientId: process.env.AUTH_GOOGLE_ID as string,
			}
		}),
		haveIBeenPwned({
			customPasswordCompromisedMessage: "Essa senha foi comprometida em vazamentos! Por sua segurança, recomendo trocar por uma senha mais forte e única."
		}
		),
		emailHarmony({
			allowNormalizedSignin: true, 
		}),
		twoFactor({
		totpOptions: {
			applicationName: "Mercado304",
		},
		backupCodesOptions: {
			numBackupCodes: 10,
		},
		sendOTP: async ({ user, otp, type }) => {
			console.log(`2FA OTP for ${user.email}: ${otp} (type: ${type})`);
			// TODO: Implement email sending for OTP
		},
	}),
	passkey({
		rpName: "Mercado304",
		rpID: process.env.BETTER_AUTH_URL ? new URL(process.env.BETTER_AUTH_URL).hostname : "localhost",
		origin: process.env.BETTER_AUTH_URL || "http://localhost:3000",
	}),
		lastLoginMethod({
			storeInDatabase: true,
		}),
		localization({
      defaultLocale: "pt-BR",
      fallbackLocale: "default"
    })
	],
});