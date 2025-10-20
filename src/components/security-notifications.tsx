"use client"

import { Bell, CheckCircle, AlertTriangle, Shield, Lock, Unlock, Smartphone, Trash2, CheckCheck } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
	useSecurityNotifications,
	useMarkNotificationAsRead,
	useMarkAllNotificationsAsRead,
	useDeleteNotification,
	useDeleteAllReadNotifications,
} from "@/hooks/use-security-notifications"
import { formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function SecurityNotifications() {
	const { data, isLoading } = useSecurityNotifications()
	const markAsReadMutation = useMarkNotificationAsRead()
	const markAllAsReadMutation = useMarkAllNotificationsAsRead()
	const deleteNotificationMutation = useDeleteNotification()
	const deleteAllReadMutation = useDeleteAllReadNotifications()

	const notifications = data?.notifications || []
	const unreadCount = data?.unreadCount || 0

	const getNotificationIcon = (type: string) => {
		switch (type) {
			case "new_device":
				return <Smartphone className="size-5 text-blue-500" />
			case "password_changed":
				return <Shield className="size-5 text-green-500" />
			case "2fa_disabled":
				return <AlertTriangle className="size-5 text-orange-500" />
			case "suspicious_login":
				return <AlertTriangle className="size-5 text-red-500" />
			case "account_locked":
				return <Lock className="size-5 text-red-600" />
			case "account_unlocked":
				return <Unlock className="size-5 text-green-600" />
			default:
				return <Bell className="size-5 text-gray-500" />
		}
	}

	const getNotificationColor = (type: string) => {
		switch (type) {
			case "new_device":
				return "bg-blue-500/10 border-blue-500/20"
			case "password_changed":
				return "bg-green-500/10 border-green-500/20"
			case "2fa_disabled":
				return "bg-orange-500/10 border-orange-500/20"
			case "suspicious_login":
				return "bg-red-500/10 border-red-500/20"
			case "account_locked":
				return "bg-red-600/10 border-red-600/20"
			case "account_unlocked":
				return "bg-green-600/10 border-green-600/20"
			default:
				return "bg-muted/30 border-muted"
		}
	}

	const handleMarkAsRead = (notificationId: string) => {
		markAsReadMutation.mutate(notificationId)
	}

	const handleDelete = (notificationId: string) => {
		deleteNotificationMutation.mutate(notificationId)
	}

	if (isLoading) {
		return (
			<Card>
				<CardHeader>
					<CardTitle className="flex items-center gap-2">
						<Bell className="size-5" />
						Notificações de Segurança
					</CardTitle>
				</CardHeader>
				<CardContent>
					<div className="space-y-3">
						{[1, 2, 3].map((i) => (
							<div key={i} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30">
								<div className="size-10 rounded-full bg-muted animate-pulse" />
								<div className="flex-1 space-y-2">
									<div className="h-4 bg-muted rounded-sm animate-pulse w-32" />
									<div className="h-3 bg-muted rounded-sm animate-pulse w-48" />
								</div>
							</div>
						))}
					</div>
				</CardContent>
			</Card>
		)
	}

	return (
		<Card>
			<CardHeader>
				<div className="flex items-center justify-between">
					<div>
						<CardTitle className="flex items-center gap-2">
							<Bell className="size-5" />
							Notificações de Segurança
							{unreadCount > 0 && (
								<Badge variant="destructive" className="ml-2">
									{unreadCount}
								</Badge>
							)}
						</CardTitle>
						<CardDescription>Alertas e eventos importantes da sua conta</CardDescription>
					</div>
					{notifications.length > 0 && (
						<div className="flex gap-2">
							{unreadCount > 0 && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => markAllAsReadMutation.mutate()}
									disabled={markAllAsReadMutation.isPending}
								>
									<CheckCheck className="size-4 mr-1" />
									Marcar todas como lidas
								</Button>
							)}
							{notifications.some((n) => n.isRead) && (
								<Button
									variant="outline"
									size="sm"
									onClick={() => deleteAllReadMutation.mutate()}
									disabled={deleteAllReadMutation.isPending}
									className="text-red-600 hover:text-red-700"
								>
									<Trash2 className="size-4 mr-1" />
									Limpar lidas
								</Button>
							)}
						</div>
					)}
				</div>
			</CardHeader>
			<CardContent>
				{notifications.length === 0 ? (
					<div className="text-center py-8">
						<Bell className="size-12 mx-auto text-muted-foreground/50 mb-3" />
						<p className="text-muted-foreground">Nenhuma notificação de segurança</p>
						<p className="text-sm text-muted-foreground mt-1">
							Você será notificado sobre eventos importantes da sua conta
						</p>
					</div>
				) : (
					<ScrollArea className="h-[400px] pr-4">
						<div className="space-y-3">
							{notifications.map((notification) => (
								<div
									key={notification.id}
									className={`flex items-start gap-3 p-4 rounded-lg border transition-all ${
										getNotificationColor(notification.type)
									} ${!notification.isRead ? "border-l-4" : ""}`}
								>
									<div className="p-2 rounded-full bg-background/50">{getNotificationIcon(notification.type)}</div>

									<div className="flex-1 min-w-0">
										<div className="flex items-start justify-between gap-2">
											<div className="flex-1">
												<h4 className="font-semibold text-sm">{notification.title}</h4>
												<p className="text-sm text-muted-foreground mt-1">{notification.message}</p>
												<p className="text-xs text-muted-foreground mt-2">
													{formatDistanceToNow(notification.createdAt, {
														addSuffix: true,
														locale: ptBR,
													})}
												</p>
											</div>
											{!notification.isRead && (
												<Badge variant="default" className="text-xs shrink-0">
													Nova
												</Badge>
											)}
										</div>

										<div className="flex items-center gap-2 mt-3">
											{!notification.isRead && (
												<Button
													variant="ghost"
													size="sm"
													onClick={() => handleMarkAsRead(notification.id)}
													disabled={markAsReadMutation.isPending}
													className="h-7 text-xs"
												>
													<CheckCircle className="h-3 w-3 mr-1" />
													Marcar como lida
												</Button>
											)}
											<Button
												variant="ghost"
												size="sm"
												onClick={() => handleDelete(notification.id)}
												disabled={deleteNotificationMutation.isPending}
												className="h-7 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
											>
												<Trash2 className="h-3 w-3 mr-1" />
												Remover
											</Button>
										</div>
									</div>
								</div>
							))}
						</div>
					</ScrollArea>
				)}
			</CardContent>
		</Card>
	)
}
