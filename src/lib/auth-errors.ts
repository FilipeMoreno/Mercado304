import { toast } from "sonner";

// Better Auth error codes and their Portuguese translations
export const AUTH_ERRORS = {
	// Authentication errors
	INVALID_EMAIL: "Email inválido. Por favor, verifique o formato do email.",
	INVALID_PASSWORD: "Senha inválida. Verifique sua senha e tente novamente.",
	USER_NOT_FOUND: "Usuário não encontrado. Verifique suas credenciais.",
	WRONG_PASSWORD: "Credenciais inválidas. Por favor, tente novamente.",
	EMAIL_NOT_VERIFIED: "Email não verificado. Por favor, verifique seu email antes de fazer login.",
	ACCOUNT_NOT_FOUND: "Credenciais inválidas. Por favor, tente novamente.",
	
	// Registration errors
	EMAIL_ALREADY_EXISTS: "Este email já está em uso. Tente fazer login ou use outro email.",
	USER_ALREADY_EXISTS: "Usuário já existe. Tente fazer login ou use outro email.",
	FAILED_TO_CREATE_USER: "Erro ao criar usuário. Tente novamente.",
	NORMALIZED_EMAIL_EXISTS: "Este email ou uma variação similar (como user@gmail.com vs u.ser@gmail.com) já está cadastrado. Tente fazer login ou use outro email.",
	WEAK_PASSWORD: "Senha muito fraca. Use uma combinação de letras, números e símbolos.",
	PASSWORD_TOO_SHORT: "Senha muito curta. Use pelo menos 8 caracteres.",
	PASSWORD_TOO_LONG: "Senha muito longa. Use no máximo 128 caracteres.",
	
	// Password security
	PASSWORD_COMPROMISED: "Essa senha já foi comprometida em vazamentos! Por segurança, escolha uma senha única que você não use em outros sites.",
	
	// Email verification
	INVALID_VERIFICATION_TOKEN: "Token de verificação inválido ou expirado. Solicite um novo.",
	VERIFICATION_TOKEN_EXPIRED: "Token de verificação expirado. Solicite um novo token.",
	EMAIL_VERIFICATION_FAILED: "Falha na verificação do email. Tente novamente.",
	
	// Password reset
	INVALID_RESET_TOKEN: "Token de redefinição inválido ou expirado. Solicite um novo.",
	RESET_TOKEN_EXPIRED: "Token de redefinição expirado. Solicite um novo token.",
	PASSWORD_RESET_FAILED: "Falha ao redefinir senha. Tente novamente.",
	
	// Session errors
	SESSION_EXPIRED: "Sua sessão expirou. Por favor, faça login novamente.",
	INVALID_SESSION: "Sessão inválida. Por favor, faça login novamente.",
	SESSION_NOT_FOUND: "Sessão não encontrada. Por favor, faça login novamente.",
	
	// OAuth/Social login errors
	OAUTH_ERROR: "Erro no login social. Tente novamente ou use email/senha.",
	OAUTH_ACCOUNT_NOT_LINKED: "Conta social não vinculada. Por favor, vincule sua conta primeiro.",
	OAUTH_CALLBACK_ERROR: "Erro no callback do provedor social. Tente novamente.",
	
	// Rate limiting
	RATE_LIMITED: "Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.",
	TOO_MANY_REQUESTS: "Muitas solicitações. Aguarde antes de tentar novamente.",
	
	// Network/Server errors
	NETWORK_ERROR: "Erro de conexão. Verifique sua internet e tente novamente.",
	INTERNAL_SERVER_ERROR: "Erro interno do servidor. Tente novamente em instantes.",
	SERVICE_UNAVAILABLE: "Serviço temporariamente indisponível. Tente novamente.",
	
	// Generic errors
	UNKNOWN_ERROR: "Erro desconhecido. Por favor, tente novamente.",
	VALIDATION_ERROR: "Dados inválidos. Verifique as informações fornecidas.",
	FORBIDDEN: "Acesso negado. Você não tem permissão para esta ação.",
	UNAUTHORIZED: "Não autorizado. Por favor, faça login novamente.",
} as const;

export type AuthErrorCode = keyof typeof AUTH_ERRORS;

interface AuthError {
	code?: string;
	message?: string;
	details?: any;
}

/**
 * Handles Better Auth errors and shows appropriate toast messages
 */
export function handleAuthError(error: AuthError, context: 'signin' | 'signup' | 'general' = 'general') {
	const errorCode = error.code as AuthErrorCode;
	
	// Handle specific Prisma errors first
	if (error.code === 'P2002') {
		// Unique constraint failed
		const target = (error as any)?.meta?.target;
		if (Array.isArray(target) && target.includes('normalizedEmail')) {
			toast.error(AUTH_ERRORS.NORMALIZED_EMAIL_EXISTS);
			return;
		}
		if (Array.isArray(target) && target.includes('email')) {
			toast.error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
			return;
		}
	}
	
	// Handle Better Auth error codes
	if (errorCode && AUTH_ERRORS[errorCode]) {
		// Special handling for password compromised error
		if (errorCode === 'PASSWORD_COMPROMISED') {
			toast.error(AUTH_ERRORS[errorCode], {
				duration: 8000, // Show for 8 seconds
			});
			return;
		}
		
		// Handle other specific errors
		toast.error(AUTH_ERRORS[errorCode]);
		return;
	}
	
	// Handle errors by context and message content
	if (error.message) {
		const message = error.message.toLowerCase();
		
		// Specific email constraint errors
		if (message.includes('normalizedemail') || message.includes('normalized email')) {
			toast.error(AUTH_ERRORS.NORMALIZED_EMAIL_EXISTS);
			return;
		}
		
		// Generic unique constraint on email fields
		if (message.includes('unique constraint') && message.includes('email')) {
			if (message.includes('normalized')) {
				toast.error(AUTH_ERRORS.NORMALIZED_EMAIL_EXISTS);
			} else {
				toast.error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
			}
			return;
		}
		
		// Email verification related
		if (message.includes('verification') || message.includes('verify')) {
			toast.error(AUTH_ERRORS.EMAIL_NOT_VERIFIED);
			return;
		}
		
		// Password related
		if (message.includes('password')) {
			if (context === 'signin') {
				toast.error(AUTH_ERRORS.WRONG_PASSWORD);
			} else {
				toast.error(AUTH_ERRORS.INVALID_PASSWORD);
			}
			return;
		}
		
		// Email related
		if (message.includes('email')) {
			if (message.includes('exists') || message.includes('already')) {
				toast.error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
			} else if (message.includes('invalid') || message.includes('format')) {
				toast.error(AUTH_ERRORS.INVALID_EMAIL);
			} else {
				toast.error(AUTH_ERRORS.USER_NOT_FOUND);
			}
			return;
		}
		
		// User related
		if (message.includes('user')) {
			if (message.includes('not found')) {
				toast.error(AUTH_ERRORS.USER_NOT_FOUND);
			} else if (message.includes('exists')) {
				toast.error(AUTH_ERRORS.USER_ALREADY_EXISTS);
			}
			return;
		}
		
		// Session related
		if (message.includes('session')) {
			if (message.includes('expired')) {
				toast.error(AUTH_ERRORS.SESSION_EXPIRED);
			} else {
				toast.error(AUTH_ERRORS.INVALID_SESSION);
			}
			return;
		}
		
		// Rate limiting
		if (message.includes('rate') || message.includes('too many')) {
			toast.error(AUTH_ERRORS.RATE_LIMITED);
			return;
		}
		
		// Network errors
		if (message.includes('network') || message.includes('connection')) {
			toast.error(AUTH_ERRORS.NETWORK_ERROR);
			return;
		}
	}
	
	// Handle errors by details/meta patterns (fallback)
	if (error.details?.meta?.target?.includes('normalizedEmail')) {
		toast.error(AUTH_ERRORS.NORMALIZED_EMAIL_EXISTS);
		return;
	}
	
	if (error.details?.meta?.target?.includes('email')) {
		toast.error(AUTH_ERRORS.EMAIL_ALREADY_EXISTS);
		return;
	}
	
	// Fallback based on context
	if (context === 'signin') {
		toast.error("Credenciais inválidas. Verifique seu email e senha.");
	} else if (context === 'signup') {
		toast.error("Erro ao criar conta. Verifique os dados e tente novamente.");
	} else {
		toast.error(error.message || AUTH_ERRORS.UNKNOWN_ERROR);
	}
}

/**
 * Shows success messages for auth actions
 */
export function showAuthSuccess(action: 'signin' | 'signup' | 'signout' | 'password-reset' | 'email-verified') {
	const messages = {
		signin: "Login realizado com sucesso! Bem-vindo(a)!",
		signup: "Conta criada com sucesso! Bem-vindo(a) ao Mercado304!",
		signout: "Logout realizado com sucesso. Até mais!",
		'password-reset': "Senha redefinida com sucesso!",
		'email-verified': "Email verificado com sucesso!",
	};
	
	toast.success(messages[action]);
}