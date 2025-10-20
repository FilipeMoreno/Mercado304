"use client"

import { CheckCircle, Fingerprint, Info, Loader2, Lock, Smartphone, Timer } from "lucide-react"
import { useEffect, useId, useState } from "react"
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Switch } from "@/components/ui/switch"
import { useBiometricAvailable, useBiometricLock } from "@/hooks/use-biometric-lock"
import { passkey } from "@/lib/auth-client"
import { handleAuthError } from "@/lib/auth-errors"

export function BiometricLockSettings() {
	const { config, hasCredential, updateConfig, setHasCredential } = useBiometricLock()
	const { available, loading } = useBiometricAvailable()
	const [isRegistering, setIsRegistering] = useState(false)
	const [localEnabled, setLocalEnabled] = useState(config.enabled)
	const [localLockOnClose, setLocalLockOnClose] = useState(config.lockOnClose)
	const [localInactivityTimeout, setLocalInactivityTimeout] = useState(config.inactivityTimeout)

	// Gera IDs únicos para os campos
	const biometricEnabledId = useId()
	const lockOnCloseId = useId()
	const timeoutDisabledId = useId()
	const timeout1Id = useId()
	const timeout5Id = useId()
	const timeout15Id = useId()
	const timeout30Id = useId()

	// Sincroniza estado local com config
	useEffect(() => {
		setLocalEnabled(config.enabled)
		setLocalLockOnClose(config.lockOnClose)
		setLocalInactivityTimeout(config.inactivityTimeout)
	}, [config])

	// Registra credencial biométrica
	const handleRegisterBiometric = async () => {
		setIsRegistering(true)

		try {
			// Verifica se já tem passkey registrada
			const result = await passkey.listUserPasskeys()

			if (result.data && result.data.length > 0) {
				// Já tem passkey registrada
				setHasCredential(true)
				toast.success("Credencial biométrica já está configurada!")
			} else {
				// Registra nova passkey
				const addResult = await passkey.addPasskey()

				if (addResult?.error) {
					throw addResult.error
				}

				setHasCredential(true)
				toast.success("Credencial biométrica registrada com sucesso!")
			}
		} catch (err) {
			console.error("Erro ao registrar biometria:", err)
			const error = err as Error & { name?: string }

			if (error.name === "NotAllowedError") {
				toast.error("Registro cancelado ou não permitido")
			} else if (error.name === "NotSupportedError") {
				toast.error("Biometria não suportada neste dispositivo")
			} else {
				handleAuthError(error, "general")
			}
		} finally {
			setIsRegistering(false)
		}
	}

	// Atualiza configuração de habilitação
	const handleToggleEnabled = async (checked: boolean) => {
		if (checked && !hasCredential) {
			// Precisa registrar credencial primeiro
			toast.info("Configure a biometria primeiro")
			await handleRegisterBiometric()
			return
		}

		setLocalEnabled(checked)
		updateConfig({ enabled: checked })

		if (checked) {
			toast.success("Bloqueio biométrico ativado!")
		} else {
			toast.success("Bloqueio biométrico desativado")
		}
	}

	// Atualiza configuração de bloqueio ao fechar
	const handleToggleLockOnClose = (checked: boolean) => {
		setLocalLockOnClose(checked)
		updateConfig({ lockOnClose: checked })
		toast.success(checked ? "App será bloqueado ao fechar" : "Bloqueio ao fechar desativado")
	}

	// Atualiza tempo de inatividade
	const handleUpdateInactivityTimeout = (value: string) => {
		const timeout = parseInt(value, 10)
		setLocalInactivityTimeout(timeout)
		updateConfig({ inactivityTimeout: timeout })

		if (timeout === 0) {
			toast.success("Bloqueio por inatividade desativado")
		} else {
			toast.success(`Bloqueio após ${timeout} minuto${timeout > 1 ? "s" : ""} de inatividade`)
		}
	}

	if (loading) {
		return (
			<Card className="border-0 shadow-xs">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950">
							<Fingerprint className="size-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<CardTitle>Bloqueio Biométrico</CardTitle>
							<CardDescription>Carregando...</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<div className="flex items-center justify-center py-8">
						<Loader2 className="size-8 animate-spin text-muted-foreground" />
					</div>
				</CardContent>
			</Card>
		)
	}

	if (!available) {
		return (
			<Card className="border-0 shadow-xs">
				<CardHeader>
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-gray-100 dark:bg-gray-800">
							<Fingerprint className="size-6 text-gray-600 dark:text-gray-400" />
						</div>
						<div>
							<CardTitle>Bloqueio Biométrico</CardTitle>
							<CardDescription>Não disponível neste dispositivo</CardDescription>
						</div>
					</div>
				</CardHeader>
				<CardContent>
					<Alert>
						<Info className="size-4" />
						<AlertDescription>
							Seu dispositivo não suporta autenticação biométrica ou a funcionalidade não está disponível no navegador
							atual. Para usar esta função, acesse através de um dispositivo com suporte a biometria (impressão digital,
							Face ID, etc).
						</AlertDescription>
					</Alert>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card className="border-0 shadow-xs">
			<CardHeader>
				<div className="flex items-center justify-between">
					<div className="flex items-center gap-3">
						<div className="p-2 rounded-full bg-blue-100 dark:bg-blue-950">
							<Fingerprint className="size-6 text-blue-600 dark:text-blue-400" />
						</div>
						<div>
							<CardTitle>Bloqueio Biométrico</CardTitle>
							<CardDescription>Proteja seu app com biometria (impressão digital, Face ID)</CardDescription>
						</div>
					</div>
					{hasCredential && (
						<Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-400">
							<CheckCircle className="h-3 w-3 mr-1" />
							Configurado
						</Badge>
					)}
				</div>
			</CardHeader>
			<CardContent className="space-y-6">
				{/* Status da biometria */}
				{!hasCredential && (
					<Alert>
						<Info className="size-4" />
						<AlertDescription>Configure a biometria para começar a usar o bloqueio do aplicativo.</AlertDescription>
					</Alert>
				)}

				{/* Configurar biometria */}
				{!hasCredential && (
					<div className="flex flex-col sm:flex-row gap-4">
						<Button onClick={handleRegisterBiometric} disabled={isRegistering} className="flex-1" size="lg">
							{isRegistering ? (
								<>
									<Loader2 className="mr-2 size-4 animate-spin" />
									Configurando...
								</>
							) : (
								<>
									<Fingerprint className="mr-2 size-4" />
									Configurar Biometria
								</>
							)}
						</Button>
					</div>
				)}

				{/* Ativar/Desativar bloqueio */}
				{hasCredential && (
					<>
						<div className="flex items-center justify-between space-x-4 p-4 bg-muted/50 rounded-lg">
							<div className="flex items-start gap-3 flex-1">
								<Lock className="size-5 mt-0.5 text-blue-600 dark:text-blue-400" />
								<div className="flex-1">
									<Label htmlFor={biometricEnabledId} className="font-medium cursor-pointer">
										Ativar Bloqueio Biométrico
									</Label>
									<p className="text-sm text-muted-foreground mt-1">Exige biometria para desbloquear o aplicativo</p>
								</div>
							</div>
							<Switch id={biometricEnabledId} checked={localEnabled} onCheckedChange={handleToggleEnabled} />
						</div>

						{/* Opções adicionais (apenas quando habilitado) */}
						{localEnabled && (
							<>
								{/* Bloquear ao fechar */}
								<div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
									<div className="flex items-start gap-3 flex-1">
										<Smartphone className="size-5 mt-0.5 text-muted-foreground" />
										<div className="flex-1">
											<Label htmlFor={lockOnCloseId} className="font-medium cursor-pointer">
												Bloquear ao Fechar App
											</Label>
											<p className="text-sm text-muted-foreground mt-1">
												Solicita biometria sempre que o app for reaberto
											</p>
										</div>
									</div>
									<Switch id={lockOnCloseId} checked={localLockOnClose} onCheckedChange={handleToggleLockOnClose} />
								</div>

								{/* Tempo de inatividade */}
								<div className="space-y-4 p-4 border rounded-lg">
									<div className="flex items-start gap-3">
										<Timer className="size-5 mt-0.5 text-muted-foreground" />
										<div className="flex-1">
											<Label className="font-medium">Bloqueio por Inatividade</Label>
											<p className="text-sm text-muted-foreground mt-1">Tempo sem atividade antes de bloquear o app</p>
										</div>
									</div>

									<RadioGroup
										value={localInactivityTimeout.toString()}
										onValueChange={handleUpdateInactivityTimeout}
										className="space-y-2 ml-8"
									>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="0" id={timeoutDisabledId} />
											<Label htmlFor={timeoutDisabledId} className="font-normal cursor-pointer">
												Desativado
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="1" id={timeout1Id} />
											<Label htmlFor={timeout1Id} className="font-normal cursor-pointer">
												1 minuto
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="5" id={timeout5Id} />
											<Label htmlFor={timeout5Id} className="font-normal cursor-pointer">
												5 minutos (Recomendado)
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="15" id={timeout15Id} />
											<Label htmlFor={timeout15Id} className="font-normal cursor-pointer">
												15 minutos
											</Label>
										</div>
										<div className="flex items-center space-x-2">
											<RadioGroupItem value="30" id={timeout30Id} />
											<Label htmlFor={timeout30Id} className="font-normal cursor-pointer">
												30 minutos
											</Label>
										</div>
									</RadioGroup>
								</div>
							</>
						)}
					</>
				)}

				{/* Informação adicional */}
				{hasCredential && (
					<Alert>
						<Info className="size-4" />
						<AlertDescription className="text-xs">
							O bloqueio biométrico utiliza a mesma tecnologia das Passkeys. Seus dados biométricos nunca saem do seu
							dispositivo.
						</AlertDescription>
					</Alert>
				)}
			</CardContent>
		</Card>
	)
}
