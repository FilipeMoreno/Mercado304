import { emailOTPClient, oneTapClient, passkeyClient, twoFactorClient } from "better-auth/client/plugins"
import { createAuthClient } from "better-auth/react"

export const authClient = createAuthClient({
	baseURL: process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000",
	plugins: [
		emailOTPClient(),
		twoFactorClient({
			onTwoFactorRedirect(data) {
				// Tenta salvar o email do usuário se disponível
				// O email pode vir do contexto do login
				const emailInput = document.querySelector<HTMLInputElement>('input[type="email"]')
				if (emailInput?.value) {
					sessionStorage.setItem("2fa_user_email", emailInput.value)
					localStorage.setItem("2fa_user_email_temp", emailInput.value)
				}

				// Tenta também pegar do localStorage se já foi salvo antes
				const savedEmail = localStorage.getItem("lastUserEmail")
				if (savedEmail && !emailInput?.value) {
					sessionStorage.setItem("2fa_user_email", savedEmail)
					localStorage.setItem("2fa_user_email_temp", savedEmail)
				}

				window.location.href = "/auth/two-factor"
			},
		}),
		oneTapClient({
			clientId: process.env.NEXT_PUBLIC_AUTH_GOOGLE_ID as string,
			autoSelect: false,
			cancelOnTapOutside: true,
			context: "signin",
			promptOptions: {
				baseDelay: 1000,
				maxAttempts: 5,
			},
		}),
		passkeyClient(),
	],
})

export const { signIn, signUp, signOut, useSession, twoFactor, passkey, oneTap, emailOtp, forgetPassword } = authClient
