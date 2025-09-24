// src/lib/email-templates.ts

interface EmailTemplateProps {
	userName?: string
	url: string
	code?: string
	expiresIn?: string
}

export function getEmailVerificationTemplate({ userName, url }: EmailTemplateProps) {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Verificação de Email - Mercado304</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #047857;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛒 Mercado304</div>
            <h1 class="title">Verifique seu email</h1>
        </div>
        
        <div class="content">
            <p>Olá${userName ? `, ${userName}` : ''}!</p>
            
            <p>Obrigado por se cadastrar no Mercado304! Para completar seu cadastro e começar a usar nossa plataforma, você precisa verificar seu endereço de email.</p>
            
            <p>Clique no botão abaixo para verificar sua conta:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button">Verificar Email</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 24 horas por motivos de segurança.
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${url}</p>
        </div>
        
        <div class="footer">
            <p>Se você não criou uma conta no Mercado304, pode ignorar este email.</p>
            <p>© 2024 Mercado304. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
	`
}

export function getPasswordResetTemplate({ userName, url }: EmailTemplateProps) {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Redefinir Senha - Mercado304</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .button {
            display: inline-block;
            background-color: #dc2626;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #b91c1c;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef2f2;
            border: 1px solid #f87171;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #991b1b;
        }
        .security-tip {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #0c4a6e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛒 Mercado304</div>
            <h1 class="title">Redefinir Senha</h1>
        </div>
        
        <div class="content">
            <p>Olá${userName ? `, ${userName}` : ''}!</p>
            
            <p>Recebemos uma solicitação para redefinir a senha da sua conta no Mercado304.</p>
            
            <p>Clique no botão abaixo para criar uma nova senha:</p>
            
            <div style="text-align: center;">
                <a href="${url}" class="button">Redefinir Senha</a>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este link expira em 1 hora por motivos de segurança.
            </div>
            
            <div class="security-tip">
                <strong>🔒 Dica de Segurança:</strong> Se você não solicitou esta redefinição, ignore este email. Sua conta permanece segura.
            </div>
            
            <p>Se o botão não funcionar, copie e cole este link no seu navegador:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace;">${url}</p>
        </div>
        
        <div class="footer">
            <p>Se você não solicitou a redefinição de senha, pode ignorar este email.</p>
            <p>© 2024 Mercado304. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
	`
}

export function getTwoFactorEmailTemplate({ userName, code }: EmailTemplateProps) {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Código de Verificação - Mercado304</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .code-container {
            background-color: #f3f4f6;
            border: 2px solid #d1d5db;
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
        }
        .code {
            font-size: 36px;
            font-weight: bold;
            color: #059669;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
        .warning {
            background-color: #fef3c7;
            border: 1px solid #f59e0b;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #92400e;
        }
        .security-tip {
            background-color: #f0f9ff;
            border: 1px solid #0ea5e9;
            border-radius: 8px;
            padding: 16px;
            margin: 20px 0;
            color: #0c4a6e;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛒 Mercado304</div>
            <h1 class="title">Código de Verificação</h1>
        </div>
        
        <div class="content">
            <p>Olá${userName ? `, ${userName}` : ''}!</p>
            
            <p>Você solicitou um código de verificação para acessar sua conta no Mercado304.</p>
            
            <div class="code-container">
                <div class="code">${code}</div>
            </div>
            
            <div class="warning">
                <strong>⚠️ Importante:</strong> Este código expira em 10 minutos por motivos de segurança.
            </div>
            
            <div class="security-tip">
                <strong>🔒 Dica de Segurança:</strong> Nunca compartilhe este código com ninguém. A equipe do Mercado304 nunca solicitará este código por telefone ou email.
            </div>
            
            <p>Se você não solicitou este código, ignore este email e considere alterar sua senha.</p>
        </div>
        
        <div class="footer">
            <p>Este é um email automático, não responda.</p>
            <p>© 2024 Mercado304. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
	`
}

export function getWelcomeEmailTemplate({ userName }: EmailTemplateProps) {
	return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao Mercado304!</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
        }
        .container {
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
        }
        .logo {
            font-size: 28px;
            font-weight: bold;
            color: #059669;
            margin-bottom: 10px;
        }
        .title {
            font-size: 24px;
            color: #1f2937;
            margin-bottom: 20px;
        }
        .content {
            margin-bottom: 30px;
        }
        .feature {
            background-color: #f0f9ff;
            border-left: 4px solid #0ea5e9;
            padding: 16px;
            margin: 16px 0;
            border-radius: 0 8px 8px 0;
        }
        .button {
            display: inline-block;
            background-color: #059669;
            color: white;
            padding: 14px 28px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            text-align: center;
            margin: 20px 0;
        }
        .button:hover {
            background-color: #047857;
        }
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 14px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">🛒 Mercado304</div>
            <h1 class="title">Bem-vindo ao Mercado304!</h1>
        </div>
        
        <div class="content">
            <p>Olá${userName ? `, ${userName}` : ''}!</p>
            
            <p>🎉 Parabéns! Sua conta foi verificada com sucesso e você já pode aproveitar todos os recursos do Mercado304.</p>
            
            <h3>O que você pode fazer agora:</h3>
            
            <div class="feature">
                <strong>📱 Escaneie produtos</strong><br>
                Use a câmera do seu celular para escanear códigos de barras e adicionar produtos rapidamente.
            </div>
            
            <div class="feature">
                <strong>📊 Controle seu estoque</strong><br>
                Monitore produtos próximos do vencimento e receba alertas inteligentes.
            </div>
            
            <div class="feature">
                <strong>💰 Compare preços</strong><br>
                Encontre os melhores preços em diferentes mercados da sua região.
            </div>
            
            <div class="feature">
                <strong>🤖 Assistente IA</strong><br>
                Receba sugestões personalizadas e insights sobre seus hábitos de compra.
            </div>
            
            <div style="text-align: center;">
                <a href="${process.env.BETTER_AUTH_URL || 'http://localhost:3000'}" class="button">Começar a usar</a>
            </div>
            
            <p>Se você tiver alguma dúvida, nossa equipe de suporte está sempre pronta para ajudar!</p>
        </div>
        
        <div class="footer">
            <p>Obrigado por escolher o Mercado304!</p>
            <p>© 2024 Mercado304. Todos os direitos reservados.</p>
        </div>
    </div>
</body>
</html>
	`
}
