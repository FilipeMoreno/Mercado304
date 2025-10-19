# Bloqueio Biométrico PWA

Sistema de bloqueio biométrico implementado para o PWA Mercado304, que utiliza WebAuthn/Passkeys para autenticação por biometria (impressão digital, Face ID, etc).

## 📋 Funcionalidades

- ✅ **Bloqueio ao abrir o app**: Solicita biometria quando o PWA é aberto
- ✅ **Bloqueio por inatividade**: Bloqueia automaticamente após período configurável de inatividade
- ✅ **Configuração flexível**: Permite ativar/desativar cada funcionalidade individualmente
- ✅ **Integração com Passkeys**: Usa a mesma tecnologia das Passkeys do Better Auth
- ✅ **Suporte multiplataforma**: Funciona em iOS (Face ID/Touch ID), Android (impressão digital), e desktop (Windows Hello)

## 🏗️ Arquitetura

### Componentes Criados

1. **`use-biometric-lock.ts`** - Hook principal que gerencia:
   - Estado do bloqueio (ativo/inativo)
   - Configurações (ativar, bloquear ao fechar, tempo de inatividade)
   - Monitoramento de atividade do usuário
   - Verificação de disponibilidade de biometria

2. **`biometric-lock-screen.tsx`** - Tela de bloqueio:
   - Interface visual moderna com gradiente
   - Prompt automático de biometria
   - Opção de fazer logout
   - Tratamento de erros específicos

3. **`biometric-lock-wrapper.tsx`** - Wrapper que envolve o app:
   - Decide quando mostrar a tela de bloqueio
   - Integra-se com o sistema de autenticação

4. **`biometric-lock-settings.tsx`** - Configurações na página de segurança:
   - Registro de credencial biométrica
   - Ativação/desativação do bloqueio
   - Configuração de bloqueio ao fechar
   - Configuração de tempo de inatividade (1, 5, 15, 30 min ou desativado)

### Integração

O bloqueio biométrico foi integrado no `pwa-splash-wrapper.tsx`, garantindo que:
1. A splash screen seja exibida primeiro
2. Após a splash, o bloqueio biométrico seja verificado
3. Apenas depois da autenticação, o conteúdo do app seja exibido

## 🚀 Como Usar

### Para o Usuário

1. Acesse **Configurações → Segurança**
2. Role até a seção **Bloqueio Biométrico**
3. Clique em **Configurar Biometria** (se ainda não tiver passkey)
4. Ative o **Bloqueio Biométrico**
5. Configure as opções:
   - **Bloquear ao Fechar App**: Solicita biometria toda vez que reabrir
   - **Bloqueio por Inatividade**: Define tempo de inatividade antes de bloquear

### Para Desenvolvedores

#### Usar o Hook

```typescript
import { useBiometricLock } from "@/hooks/use-biometric-lock"

function MyComponent() {
  const { 
    isLocked,           // Se o app está bloqueado
    config,             // Configurações atuais
    hasCredential,      // Se tem credencial biométrica
    lock,               // Função para bloquear
    unlock,             // Função para desbloquear
    updateConfig,       // Atualizar configurações
  } = useBiometricLock()
}
```

#### Verificar Disponibilidade

```typescript
import { useBiometricAvailable } from "@/hooks/use-biometric-lock"

function MyComponent() {
  const { available, loading } = useBiometricAvailable()
  
  if (loading) return <div>Carregando...</div>
  if (!available) return <div>Biometria não disponível</div>
  
  return <div>Biometria disponível!</div>
}
```

## 🔒 Segurança

- **Dados biométricos nunca saem do dispositivo**: Usa WebAuthn, que mantém os dados biométricos localmente
- **Integração com Better Auth**: Usa o mesmo sistema de Passkeys já implementado
- **Sem armazenamento de senhas**: Não armazena ou transmite informações biométricas
- **Criptografia nativa**: Utiliza as APIs nativas do navegador/SO que são criptografadas

## 📱 Compatibilidade

### Navegadores Suportados
- ✅ Safari (iOS 14+) - Touch ID, Face ID
- ✅ Chrome/Edge (Android 9+) - Impressão digital
- ✅ Chrome/Edge/Firefox (Windows 10+) - Windows Hello
- ✅ Chrome (macOS) - Touch ID

### Requisitos
- PWA instalado (standalone mode)
- Dispositivo com hardware biométrico
- Navegador com suporte a WebAuthn
- Credencial biométrica (passkey) registrada

## 🎨 Configurações de UI

### Tempos de Inatividade Disponíveis
- Desativado (sem bloqueio automático)
- 1 minuto
- 5 minutos (recomendado)
- 15 minutos
- 30 minutos

### Estados da Tela de Bloqueio
1. **Normal**: Mostra ícone de impressão digital e solicita autenticação
2. **Autenticando**: Mostra spinner enquanto processa
3. **Erro**: Mostra ícone de alerta e mensagem de erro específica

## 📦 Armazenamento Local

O sistema usa `localStorage` para armazenar:
- `mercado304-biometric-config`: Configurações do bloqueio
- `mercado304-last-activity`: Timestamp da última atividade
- `mercado304-has-biometric-credential`: Cache de disponibilidade
- `mercado304-biometric-lock`: Flag de bloqueio ativo

## 🔄 Fluxo de Funcionamento

### 1. Inicialização
```
App inicia
  → PWA Splash Screen (se aplicável)
  → Verifica se tem sessão ativa
  → Verifica configurações de bloqueio
  → Se bloqueio ativo → Mostra Biometric Lock Screen
  → Se autenticado → Mostra conteúdo
```

### 2. Monitoramento de Atividade
```
Usuário interage com o app
  → Eventos: click, touch, scroll, keypress, mousemove
  → Atualiza timestamp de última atividade
  → Timer verifica a cada 30 segundos
  → Se ultrapassou tempo configurado → Bloqueia
```

### 3. Bloqueio ao Fechar
```
Usuário minimiza/fecha o app
  → Evento: visibilitychange (document.hidden = true)
  → Atualiza última atividade
  → Quando reabre:
    → Verifica tempo de inatividade
    → Se configurado para bloquear ao fechar → Bloqueia
```

## 🧪 Testes

Para testar o bloqueio biométrico:

1. **Teste básico**:
   - Configure e ative o bloqueio
   - Feche e reabra o app
   - Deve solicitar biometria

2. **Teste de inatividade**:
   - Configure tempo de inatividade para 1 minuto
   - Não interaja com o app por 1 minuto
   - Deve bloquear automaticamente

3. **Teste de erro**:
   - Ative o bloqueio
   - Feche o app
   - Cancele a solicitação de biometria
   - Deve mostrar mensagem de erro

## 🐛 Troubleshooting

### Biometria não aparece como disponível
- Verifique se o dispositivo tem hardware biométrico
- Confirme que está usando HTTPS ou localhost
- Verifique se o navegador suporta WebAuthn
- Tente registrar uma passkey primeiro

### Bloqueio não está funcionando
- Verifique se o bloqueio está ativado nas configurações
- Confirme que tem uma credencial biométrica registrada
- Verifique o console para erros
- Limpe o cache e recarregue o app

### Erro "No credential available"
- Registre uma passkey primeiro
- Vá em Configurações → Segurança → Bloqueio Biométrico
- Clique em "Configurar Biometria"

## 📝 Notas Importantes

1. O bloqueio biométrico **requer** que o usuário tenha uma passkey registrada
2. O sistema usa a mesma tecnologia das passkeys (WebAuthn)
3. A biometria é opcional e pode ser desativada a qualquer momento
4. O bloqueio só funciona quando o PWA está instalado (standalone mode)
5. Os dados biométricos nunca são enviados ao servidor

## 🔮 Melhorias Futuras

- [ ] Opção de "Lembrar este dispositivo por X dias"
- [ ] Estatísticas de uso do bloqueio
- [ ] Notificação quando houver tentativa de acesso não autorizada
- [ ] Bloqueio em telas específicas (ex: apenas configurações)
- [ ] Fallback para PIN quando biometria falhar múltiplas vezes
- [ ] Integração com dispositivos confiáveis

## 📄 Licença

Este recurso faz parte do projeto Mercado304 e segue a mesma licença do projeto principal.

