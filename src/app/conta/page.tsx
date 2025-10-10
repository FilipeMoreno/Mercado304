"use client"

import { AlertCircle, ArrowLeft, Camera, CheckCircle, Loader2, Mail, Save, Shield, Trash2, User } from "lucide-react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { toast } from "sonner"
import { SecurityTab } from "@/components/auth/security-tab"
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { signOut, useSession } from "@/lib/auth-client"

export default function ContaPage() {
	const { data: session } = useSession()
	const router = useRouter()

	// Estados para perfil
	const [name, setName] = useState(session?.user?.name || "")
	const [email, setEmail] = useState(session?.user?.email || "")
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)

	// Estados para exclusão de conta
	const [deleteConfirmation, setDeleteConfirmation] = useState("")
	const [isDeletingAccount, setIsDeletingAccount] = useState(false)

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2)
	}

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault()
		setIsUpdatingProfile(true)

		try {
			const response = await fetch("/api/user/profile", {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					name,
					email,
				}),
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao atualizar perfil")
			}

			toast.success("Perfil atualizado com sucesso!")
		} catch (error: any) {
			toast.error(error.message || "Erro ao atualizar perfil")
		} finally {
			setIsUpdatingProfile(false)
		}
	}

	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== "DELETAR") {
			toast.error('Digite "DELETAR" para confirmar')
			return
		}

		setIsDeletingAccount(true)

		try {
			const response = await fetch("/api/user/delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			})

			if (!response.ok) {
				const data = await response.json()
				throw new Error(data.error || "Erro ao excluir conta")
			}

			toast.success("Conta excluída com sucesso!")
			await signOut()
			window.location.href = "/auth/signin"
		} catch (error: any) {
			toast.error(error.message || "Erro ao excluir conta")
		} finally {
			setIsDeletingAccount(false)
		}
	}

	if (!session) {
		return (
			<div className="flex items-center justify-center min-h-screen">
				<div className="text-center space-y-4">
					<Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
					<p className="text-muted-foreground">Carregando...</p>
				</div>
			</div>
		)
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
			{/* Header Minimalista */}
			<div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container max-w-6xl mx-auto px-4 py-6">
					<div className="flex items-center justify-between">
						<div className="flex items-center gap-4">
							<Button
								variant="ghost"
								size="icon"
								onClick={() => router.back()}
								className="rounded-full"
							>
								<ArrowLeft className="h-5 w-5" />
							</Button>
							<div>
								<h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
								<p className="text-sm text-muted-foreground mt-1">Gerencie sua conta e preferências</p>
							</div>
						</div>
						
						{/* Avatar no Header */}
						<Avatar className="h-12 w-12 border-2 border-primary/20">
							<AvatarImage src={session.user?.image || undefined} />
							<AvatarFallback className="bg-primary/10 text-primary font-semibold">
								{getInitials(session.user?.name || "U")}
							</AvatarFallback>
						</Avatar>
					</div>
				</div>
			</div>

			{/* Content */}
			<div className="container max-w-6xl mx-auto px-4 py-8">
				<Tabs defaultValue="perfil" className="space-y-8">
					<TabsList className="inline-flex h-11 items-center justify-center rounded-lg bg-muted p-1 text-muted-foreground w-auto">
						<TabsTrigger value="perfil" className="rounded-md px-6">
							<User className="h-4 w-4 mr-2" />
							Perfil
						</TabsTrigger>
						<TabsTrigger value="seguranca" className="rounded-md px-6">
							<Shield className="h-4 w-4 mr-2" />
							Segurança
						</TabsTrigger>
						<TabsTrigger value="conta" className="rounded-md px-6">
							<AlertCircle className="h-4 w-4 mr-2" />
							Conta
						</TabsTrigger>
					</TabsList>

				<TabsContent value="perfil" className="space-y-6">
					{/* Card de Perfil Minimalista */}
					<Card className="border-0 shadow-sm">
						<CardContent className="pt-6">
							<div className="flex flex-col md:flex-row gap-8">
								{/* Avatar Section */}
								<div className="flex flex-col items-center space-y-4">
									<div className="relative group">
										<Avatar className="h-32 w-32 border-4 border-background shadow-lg">
											<AvatarImage src={session.user?.image || undefined} />
											<AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-bold">
												{getInitials(session.user?.name || "U")}
											</AvatarFallback>
										</Avatar>
										<Button
											size="icon"
											variant="secondary"
											className="absolute bottom-0 right-0 h-10 w-10 rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
											disabled
										>
											<Camera className="h-5 w-5" />
										</Button>
									</div>
									<Badge variant="secondary" className="px-3 py-1">
										{session.user?.image ? (
											<>
												<Mail className="h-3 w-3 mr-1" />
												Conta Google
											</>
										) : (
											<>
												<User className="h-3 w-3 mr-1" />
												Conta Local
											</>
										)}
									</Badge>
								</div>

								{/* Form Section */}
								<div className="flex-1 space-y-6">
									<div>
										<h2 className="text-2xl font-bold mb-1">{session.user?.name}</h2>
										<p className="text-muted-foreground flex items-center gap-2">
											<Mail className="h-4 w-4" />
											{session.user?.email}
										</p>
									</div>

									<Separator />

									<form onSubmit={handleUpdateProfile} className="space-y-5">
										<div className="grid gap-5 md:grid-cols-2">
											<div className="space-y-2">
												<Label htmlFor="name" className="text-sm font-medium">
													Nome completo
												</Label>
												<Input
													id="name"
													value={name}
													onChange={(e) => setName(e.target.value)}
													placeholder="Seu nome completo"
													required
													disabled={isUpdatingProfile}
													className="h-11"
												/>
											</div>

											<div className="space-y-2">
												<Label htmlFor="email" className="text-sm font-medium">
													Email
												</Label>
												<div className="relative">
													<Input
														id="email"
														type="email"
														value={email}
														onChange={(e) => setEmail(e.target.value)}
														placeholder="seu@email.com"
														required
														disabled={isUpdatingProfile}
														className="h-11 pr-10"
													/>
													<CheckCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-green-500" />
												</div>
												<p className="text-xs text-muted-foreground">Email verificado</p>
											</div>
										</div>

										<div className="flex justify-end pt-4">
											<Button type="submit" disabled={isUpdatingProfile} size="lg" className="px-8">
												{isUpdatingProfile ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Salvando...
													</>
												) : (
													<>
														<Save className="mr-2 h-4 w-4" />
														Salvar Alterações
													</>
												)}
											</Button>
										</div>
									</form>
								</div>
							</div>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="seguranca">
					<SecurityTab session={session} />
				</TabsContent>

					<TabsContent value="conta" className="space-y-6">
					{/* Zona de Perigo Minimalista */}
					<Card className="border-0 shadow-sm overflow-hidden">
					<div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20 p-6 border-b border-red-200 dark:border-red-900">
						<div className="flex items-center gap-3">
							<div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
								<AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
							</div>
							<div>
								<h3 className="text-lg font-semibold text-red-900 dark:text-red-100">Zona de Perigo</h3>
								<p className="text-sm text-red-700 dark:text-red-300">Ações irreversíveis</p>
							</div>
						</div>
					</div>

					<CardContent className="p-6">
						<div className="space-y-4">
							<div>
								<h4 className="font-medium text-foreground mb-2">Excluir Conta Permanentemente</h4>
								<p className="text-sm text-muted-foreground mb-6">
									Esta ação não pode ser desfeita. Todos os seus dados, incluindo compras, listas e histórico serão permanentemente removidos de nossos servidores.
								</p>
							</div>

							<AlertDialog>
								<AlertDialogTrigger asChild>
									<Button variant="destructive" className="w-full sm:w-auto">
										<Trash2 className="mr-2 h-4 w-4" />
										Excluir Minha Conta
									</Button>
								</AlertDialogTrigger>
								<AlertDialogContent className="max-w-md">
									<AlertDialogHeader>
										<AlertDialogTitle className="text-xl">Tem certeza absoluta?</AlertDialogTitle>
										<AlertDialogDescription className="space-y-4 text-base">
											<p className="text-foreground font-medium">
												Esta ação excluirá permanentemente sua conta e todos os dados associados.
											</p>
											<div className="space-y-2">
												<Label htmlFor="delete-confirm" className="text-sm font-medium">
													Para confirmar, digite <span className="font-bold text-red-600">"DELETAR"</span> abaixo:
												</Label>
												<Input
													id="delete-confirm"
													value={deleteConfirmation}
													onChange={(e) => setDeleteConfirmation(e.target.value)}
													placeholder="Digite DELETAR"
													className="h-11"
												/>
											</div>
										</AlertDialogDescription>
									</AlertDialogHeader>
									<AlertDialogFooter className="flex-col sm:flex-row gap-2">
										<AlertDialogCancel onClick={() => setDeleteConfirmation("")} className="w-full sm:w-auto">
											Cancelar
										</AlertDialogCancel>
										<AlertDialogAction
											onClick={handleDeleteAccount}
											disabled={deleteConfirmation !== "DELETAR" || isDeletingAccount}
											className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
										>
											{isDeletingAccount ? (
												<>
													<Loader2 className="mr-2 h-4 w-4 animate-spin" />
													Excluindo...
												</>
											) : (
												<>
													<Trash2 className="mr-2 h-4 w-4" />
													Excluir Permanentemente
												</>
											)}
										</AlertDialogAction>
									</AlertDialogFooter>
								</AlertDialogContent>
							</AlertDialog>
						</div>
					</CardContent>
					</Card>
				</TabsContent>
			</Tabs>
			</div>
		</div>
	)
}
