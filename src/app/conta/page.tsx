"use client";

import {
	AlertCircle,
	Camera,
	CheckCircle, Loader2, Save, Trash2,
	User
} from "lucide-react";
import { useRouter } from "next/navigation";
import { signOut, useSession, updateSession } from "@/lib/auth-client";
import { useState } from "react";
import { toast } from "sonner";
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
} from "@/components/ui/alert-dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SecurityTab } from "@/components/auth/security-tab";

export default function ContaPage() {
	const { data: session } = useSession();
	const router = useRouter();

	// Estados para perfil
	const [name, setName] = useState(session?.user?.name || "");
	const [email, setEmail] = useState(session?.user?.email || "");
	const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

	// Estados para exclusão de conta
	const [deleteConfirmation, setDeleteConfirmation] = useState("");
	const [isDeletingAccount, setIsDeletingAccount] = useState(false);

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	const handleUpdateProfile = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsUpdatingProfile(true);

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
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao atualizar perfil");
			}

			// Atualizar a sessão
			await updateSession();
			toast.success("Perfil atualizado com sucesso!");
		} catch (error: any) {
			toast.error(error.message || "Erro ao atualizar perfil");
		} finally {
			setIsUpdatingProfile(false);
		}
	};

	const handleDeleteAccount = async () => {
		if (deleteConfirmation !== "DELETAR") {
			toast.error('Digite "DELETAR" para confirmar');
			return;
		}

		setIsDeletingAccount(true);

		try {
			const response = await fetch("/api/user/delete", {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
			});

			if (!response.ok) {
				const data = await response.json();
				throw new Error(data.error || "Erro ao excluir conta");
			}

			toast.success("Conta excluída com sucesso!");
			await signOut({ callbackUrl: "/auth/signin" });
		} catch (error: any) {
			toast.error(error.message || "Erro ao excluir conta");
		} finally {
			setIsDeletingAccount(false);
		}
	};

	if (!session) {
		return (
			<div className="flex items-center justify-center min-h-[400px]">
				<div className="text-center">
					<Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
					<p className="text-muted-foreground">
						Carregando informações da conta...
					</p>
				</div>
			</div>
		);
	}

	return (
		<div className="container py-6 w-full">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold">Minha Conta</h1>
					<p className="text-muted-foreground">
						Gerencie suas informações pessoais e configurações de segurança
					</p>
				</div>
				<Button variant="outline" onClick={() => router.back()}>
					Voltar
				</Button>
			</div>

			<Tabs defaultValue="perfil" className="space-y-6">
				<TabsList className="grid w-full grid-cols-3">
					<TabsTrigger value="perfil">Perfil</TabsTrigger>
					<TabsTrigger value="seguranca">Segurança</TabsTrigger>
					<TabsTrigger value="conta">Conta</TabsTrigger>
				</TabsList>

				<TabsContent value="perfil">
					<Card>
						<CardHeader>
							<CardTitle className="flex items-center gap-2">
								<User className="h-5 w-5" />
								Informações do Perfil
							</CardTitle>
							<CardDescription>
								Atualize suas informações pessoais e foto de perfil
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="flex items-center gap-6">
								<div className="relative">
									<Avatar className="h-24 w-24">
										<AvatarImage src={session.user?.image || undefined} />
										<AvatarFallback className="text-lg">
											{getInitials(session.user?.name || "U")}
										</AvatarFallback>
									</Avatar>
									<Button
										size="sm"
										variant="outline"
										className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0"
										disabled
									>
										<Camera className="h-4 w-4" />
									</Button>
								</div>
								<div>
									<h3 className="font-medium">{session.user?.name}</h3>
									<p className="text-sm text-muted-foreground">
										{session.user?.email}
									</p>
									<Badge variant="outline" className="mt-2">
										{session.user?.image ? "Google Account" : "Conta Local"}
									</Badge>
								</div>
							</div>

							<Separator />

							<form onSubmit={handleUpdateProfile} className="space-y-4">
								<div className="space-y-2">
									<Label htmlFor="name">Nome completo</Label>
									<Input
										id="name"
										value={name}
										onChange={(e) => setName(e.target.value)}
										placeholder="Seu nome completo"
										required
										disabled={isUpdatingProfile}
									/>
								</div>

								<div className="space-y-2">
									<Label htmlFor="email">Email</Label>
									<Input
										id="email"
										type="email"
										value={email}
										onChange={(e) => setEmail(e.target.value)}
										placeholder="seu@email.com"
										required
										disabled={isUpdatingProfile}
									/>
									<div className="flex items-center gap-1 text-sm text-green-600">
										<CheckCircle className="h-4 w-4" />
										Email verificado
									</div>
								</div>

								<Button type="submit" disabled={isUpdatingProfile}>
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
							</form>
						</CardContent>
					</Card>
				</TabsContent>

				<TabsContent value="seguranca">
					<SecurityTab session={session} onUpdateSession={updateSession} />
				</TabsContent>

				<TabsContent value="conta">
					<Card className="border-red-200">
						<CardHeader>
							<CardTitle className="flex items-center gap-2 text-red-600">
								<AlertCircle className="h-5 w-5" />
								Zona de Perigo
							</CardTitle>
							<CardDescription>
								Ações irreversíveis relacionadas à sua conta
							</CardDescription>
						</CardHeader>
						<CardContent className="space-y-6">
							<div className="p-4 bg-red-50 border border-red-200 rounded-lg">
								<h3 className="font-medium text-red-800 mb-2">Excluir Conta</h3>
								<p className="text-sm text-red-700 mb-4">
									Esta ação não pode ser desfeita. Todos os seus dados,
									incluindo compras, listas e histórico serão permanentemente
									removidos.
								</p>

								<AlertDialog>
									<AlertDialogTrigger asChild>
										<Button variant="destructive" size="sm">
											<Trash2 className="mr-2 h-4 w-4" />
											Excluir Conta
										</Button>
									</AlertDialogTrigger>
									<AlertDialogContent>
										<AlertDialogHeader>
											<AlertDialogTitle>Tem certeza absoluta?</AlertDialogTitle>
											<AlertDialogDescription className="space-y-3">
												<p>
													Esta ação excluirá permanentemente sua conta e todos
													os dados associados.
												</p>
												<p>
													Para confirmar, digite <strong>"DELETAR"</strong> no
													campo abaixo:
												</p>
												<Input
													value={deleteConfirmation}
													onChange={(e) =>
														setDeleteConfirmation(e.target.value)
													}
													placeholder="Digite DELETAR para confirmar"
												/>
											</AlertDialogDescription>
										</AlertDialogHeader>
										<AlertDialogFooter>
											<AlertDialogCancel
												onClick={() => setDeleteConfirmation("")}
											>
												Cancelar
											</AlertDialogCancel>
											<AlertDialogAction
												onClick={handleDeleteAccount}
												disabled={
													deleteConfirmation !== "DELETAR" || isDeletingAccount
												}
												className="bg-red-600 hover:bg-red-700"
											>
												{isDeletingAccount ? (
													<>
														<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														Excluindo...
													</>
												) : (
													"Excluir Permanentemente"
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
	);
}