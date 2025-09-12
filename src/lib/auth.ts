import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { haveIBeenPwned } from "better-auth/plugins";
import { PrismaClient } from "@prisma/client";
import { emailHarmony } from 'better-auth-harmony';

const prisma = new PrismaClient();

export const auth = betterAuth({
	database: prismaAdapter(prisma, {
		provider: "postgresql",
	}),
	emailAndPassword: {
		enabled: true,
		requireEmailVerification: true,
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
		haveIBeenPwned({
			customPasswordCompromisedMessage: "Essa senha foi comprometida em vazamentos! Por sua segurança, recomendo trocar por uma senha mais forte e única."
		}
		),
		emailHarmony({
			allowNormalizedSignin: true, 
		}),
	],
});
