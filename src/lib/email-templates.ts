// src/lib/email-templates.ts

interface EmailTemplateProps {
	userName?: string
	url: string
	code?: string
	expiresIn?: string
}

interface TwoFactorTemplateProps {
	userName?: string
	code: string
}

interface WelcomeTemplateProps {
	userName?: string
}

const getBaseTemplate = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    <title>${title} - Mercado304</title>
    <style>
        :root {
            --brand-color: #2563eb;
            --brand-color-dark: #1d4ed8;
            --background-color: #f3f4f6;
            --card-background: #ffffff;
            --text-color: #374151;
            --text-light: #6b7280;
            --border-color: #e5e7eb;
            --font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        @media (prefers-color-scheme: dark) {
            :root {
                --background-color: #111827;
                --card-background: #1f2937;
                --text-color: #f9fafb;
                --text-light: #9ca3af;
                --border-color: #4b5563;
            }
        }
        body {
            margin: 0;
            padding: 20px;
            background-color: var(--background-color);
            font-family: var(--font-family);
            -webkit-font-smoothing: antialiased;
            -moz-osx-font-smoothing: grayscale;
        }
        .wrapper {
            max-width: 600px;
            margin: 0 auto;
            background-color: var(--card-background);
            border-radius: 12px;
            box-shadow-sm: 0 4px 12px rgba(0,0,0,0.05);
            overflow: hidden;
        }
        .header {
            padding: 32px 40px;
            text-align: center;
            border-bottom: 1px solid var(--border-color);
        }
        .logo {
            font-size: 24px;
            font-weight: 700;
            color: var(--brand-color);
        }
        .main {
            padding: 40px;
        }
        .title {
            font-size: 28px;
            font-weight: 700;
            color: var(--text-color);
            margin: 0 0 16px;
        }
        .paragraph {
            font-size: 16px;
            line-height: 1.6;
            color: var(--text-light);
            margin: 0 0 24px;
        }
        .button-wrapper {
            margin: 32px 0;
            text-align: center;
        }
        .button {
            display: inline-block;
            background-color: var(--brand-color);
            color: #ffffff;
            padding: 16px 32px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            transition: background-color 0.2s;
        }
        .button:hover {
            background-color: var(--brand-color-dark);
        }
        .link {
            font-size: 14px;
            color: var(--text-light);
            word-break: break-all;
            background-color: var(--background-color);
            padding: 12px;
            border-radius: 6px;
            display: block;
            font-family: monospace;
        }
        .footer {
            padding: 32px 40px;
            text-align: center;
            font-size: 14px;
            color: var(--text-light);
            border-top: 1px solid var(--border-color);
        }
        .code-box {
            background-color: var(--background-color);
            border-radius: 12px;
            padding: 24px;
            text-align: center;
            margin: 32px 0;
        }
        .code {
            font-size: 40px;
            font-weight: 700;
            color: var(--brand-color);
            letter-spacing: 10px;
            font-family: 'Courier New', monospace;
        }
    </style>
</head>
<body>
    <div class="wrapper">
        <div class="header">
            <div class="logo">🛒 Mercado304</div>
        </div>
        <div class="main">
            ${content}
        </div>
        <div class="footer">
            <p>Se você não solicitou esta ação, pode ignorar este e-mail com segurança.</p>
            <p>© ${new Date().getFullYear()} Mercado304. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
`

export function getEmailVerificationTemplate({ userName, url }: EmailTemplateProps) {
	const content = `
        <h1 class="title">Verifique seu e-mail</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Obrigado por se registrar! Para ativar sua conta, por favor, confirme seu endereço de e-mail clicando no botão abaixo.</p>
        <div class="button-wrapper">
            <a href="${url}" class="button">Verificar E-mail</a>
        </div>
        <p class="paragraph">Este link de verificação expira em 24 horas.</p>
        <p class="paragraph">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p class="link">${url}</p>
    `
	return getBaseTemplate("Verificação de E-mail", content)
}

export function getPasswordResetTemplate({ userName, url }: EmailTemplateProps) {
	const content = `
        <h1 class="title">Redefinição de Senha</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Recebemos uma solicitação para redefinir a senha da sua conta. Clique no botão abaixo para escolher uma nova senha.</p>
        <div class="button-wrapper">
            <a href="${url}" class="button" style="background-color: #dc2626; color: #ffffff;">Redefinir Senha</a>
        </div>
        <p class="paragraph">Este link para redefinição de senha expira em 1 hora.</p>
        <p class="paragraph">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
        <p class="link">${url}</p>
    `
	return getBaseTemplate("Redefinição de Senha", content)
}

export function getTwoFactorEmailTemplate({ userName, code }: TwoFactorTemplateProps) {
	const content = `
        <h1 class="title">Seu Código de Acesso</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Use o código abaixo para concluir seu login. Não o compartilhe com ninguém.</p>
        <div class="code-box">
            <div class="code">${code}</div>
        </div>
        <p class="paragraph">Este código expira em 10 minutos.</p>
    `
	return getBaseTemplate("Código de Verificação", content)
}

export function getWelcomeEmailTemplate({ userName }: WelcomeTemplateProps) {
	const startUrl = process.env.BETTER_AUTH_URL || "http://localhost:3000"
	const content = `
        <h1 class="title">🎉 Bem-vindo ao Mercado304!</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Sua conta foi verificada com sucesso! Estamos felizes em ter você conosco. Agora você pode explorar todos os recursos que preparamos para otimizar suas compras.</p>
        <div class="button-wrapper">
            <a href="${startUrl}" class="button">Começar a Usar</a>
        </div>
        <p class="paragraph">Qualquer dúvida, nossa equipe de suporte está à disposição para ajudar.</p>
    `
	return getBaseTemplate("Bem-vindo!", content)
}

interface SecurityAlertTemplateProps {
	userName?: string
	action: string
	device?: string
	location?: string
	ipAddress?: string
	timestamp?: string
}

export function getSecurityAlertTemplate({
	userName,
	action,
	device,
	location,
	ipAddress,
	timestamp,
}: SecurityAlertTemplateProps) {
	const securityUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/conta/seguranca`
	const content = `
        <h1 class="title">🔔 Alerta de Segurança</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Detectamos uma alteração importante na segurança da sua conta:</p>
        <div class="code-box">
            <div style="text-align: left; font-size: 14px; line-height: 1.8;">
                <strong style="color: var(--brand-color);">Ação:</strong> ${action}<br>
                ${device ? `<strong>Dispositivo:</strong> ${device}<br>` : ""}
                ${location ? `<strong>Localização:</strong> ${location}<br>` : ""}
                ${ipAddress ? `<strong>IP:</strong> ${ipAddress}<br>` : ""}
                ${timestamp ? `<strong>Data/Hora:</strong> ${timestamp}` : ""}
            </div>
        </div>
        <p class="paragraph">Se você reconhece esta atividade, pode ignorar este email com segurança.</p>
        <p class="paragraph"><strong>Se você NÃO reconhece esta atividade:</strong></p>
        <div class="button-wrapper">
            <a href="${securityUrl}" class="button" style="background-color: #dc2626;">Revisar Configurações de Segurança</a>
        </div>
        <p class="paragraph">Recomendamos alterar sua senha imediatamente e verificar suas configurações de segurança.</p>
    `
	return getBaseTemplate("Alerta de Segurança", content)
}

export function getNewSessionTemplate({
	userName,
	device,
	location,
	ipAddress,
	timestamp,
}: SecurityAlertTemplateProps) {
	const securityUrl = `${process.env.BETTER_AUTH_URL || "http://localhost:3000"}/conta/seguranca`
	const content = `
        <h1 class="title">🔐 Novo Login Detectado</h1>
        <p class="paragraph">Olá${userName ? `, ${userName}` : ""},</p>
        <p class="paragraph">Um novo login foi realizado na sua conta:</p>
        <div class="code-box">
            <div style="text-align: left; font-size: 14px; line-height: 1.8;">
                ${device ? `<strong>Dispositivo:</strong> ${device}<br>` : ""}
                ${location ? `<strong>Localização:</strong> ${location}<br>` : ""}
                ${ipAddress ? `<strong>IP:</strong> ${ipAddress}<br>` : ""}
                ${timestamp ? `<strong>Data/Hora:</strong> ${timestamp}` : ""}
            </div>
        </div>
        <p class="paragraph">Se foi você, tudo certo! Pode ignorar este email.</p>
        <p class="paragraph"><strong>Não foi você?</strong> Sua conta pode estar comprometida.</p>
        <div class="button-wrapper">
            <a href="${securityUrl}" class="button" style="background-color: #dc2626;">Proteger Minha Conta</a>
        </div>
        <p class="paragraph">Recomendamos alterar sua senha imediatamente e ativar autenticação de dois fatores.</p>
    `
	return getBaseTemplate("Novo Login Detectado", content)
}
