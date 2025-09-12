"use client";

import { LogOut, Monitor, Moon, Sun, User } from "lucide-react";
import Link from "next/link";
import { signIn, signOut, useSession } from "@/lib/auth-client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuGroup,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface UserNavProps {
	collapsed?: boolean;
}

export function UserNav({ collapsed }: UserNavProps) {
	const { setTheme, theme } = useTheme();
	const { data: session } = useSession();

	if (!session) {
		return <Button onClick={() => signIn()}>Sign In</Button>;
	}

	const { user } = session;

	const getInitials = (name: string) => {
		return name
			.split(" ")
			.map((n) => n[0])
			.join("")
			.toUpperCase()
			.slice(0, 2);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<div
					className={cn(
						"flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted",
						collapsed && "flex-col p-1",
					)}
					aria-label="User menu"
				>
					<Avatar className={cn("h-8 w-8", collapsed && "h-7 w-7")}>
						<AvatarImage
							src={user?.image || undefined}
							alt={user?.name || "User"}
						/>
						<AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
					</Avatar>
					{!collapsed && (
						<div className="flex flex-col items-start">
							<span className="text-sm font-semibold leading-none">
								{user?.name}
							</span>
							<span className="text-xs text-muted-foreground">
								{user?.email}
							</span>
						</div>
					)}
				</div>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56" align="end" side="right" forceMount>
				<DropdownMenuLabel className="flex flex-col space-y-1">
					<div className="flex items-center gap-2">
						<Avatar className="h-8 w-8">
							<AvatarImage
								src={user?.image || undefined}
								alt={user?.name || "User"}
							/>
							<AvatarFallback>{getInitials(user?.name || "U")}</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="text-sm font-semibold">{user?.name}</span>
							<span className="text-xs text-muted-foreground">
								{user?.email}
							</span>
						</div>
					</div>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<DropdownMenuItem asChild>
						<Link href="/conta">
							<User className="mr-2 h-4 w-4" />
							<span>Conta</span>
						</Link>
					</DropdownMenuItem>
				</DropdownMenuGroup>
				<DropdownMenuSub>
					<DropdownMenuSubTrigger>
						<div className="flex items-center">
							<Sun className="mr-4 h-4 w-4" />
							<span>Tema</span>
						</div>
					</DropdownMenuSubTrigger>
					<DropdownMenuSubContent>
						<DropdownMenuItem onClick={() => setTheme("light")}>
							<Sun
								className={cn(
									"mr-2 h-4 w-4",
									theme === "light" && "text-primary",
								)}
							/>
							<span>Claro</span>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("dark")}>
							<Moon
								className={cn(
									"mr-2 h-4 w-4",
									theme === "dark" && "text-primary",
								)}
							/>
							<span>Escuro</span>
						</DropdownMenuItem>
						<DropdownMenuItem onClick={() => setTheme("system")}>
							<Monitor
								className={cn(
									"mr-2 h-4 w-4",
									theme === "system" && "text-primary",
								)}
							/>
							<span>Sistema</span>
						</DropdownMenuItem>
					</DropdownMenuSubContent>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem onClick={() => signOut()}>
					<LogOut className="mr-2 h-4 w-4" />
					<span>Sair</span>
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
