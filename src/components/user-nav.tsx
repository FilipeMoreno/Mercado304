"use client"

import { LogOut, User, Sun, Moon, Monitor } from "lucide-react"
import { useTheme } from "@/lib/theme"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { useSession, signOut } from "next-auth/react"
import { Skeleton } from "./ui/skeleton"

interface UserNavProps {
  collapsed?: boolean
}

export function UserNav({ collapsed }: UserNavProps) {
  const { setTheme, theme } = useTheme();
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center gap-2 p-2">
        <Skeleton className="h-8 w-8 rounded-full" />
        {!collapsed && <Skeleton className="h-4 w-24" />}
      </div>
    )
  }

  if (status === "unauthenticated" || !session?.user) {
    // Pode redirecionar para o login ou mostrar um botão de login aqui se preferir
    return null;
  }

  const { user } = session;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div 
          className={cn(
            "flex cursor-pointer items-center gap-2 rounded-lg p-2 transition-colors hover:bg-muted",
            collapsed && "flex-col p-1"
          )}
          aria-label="User menu"
        >
          <img
            src={user.image || `https://avatar.vercel.sh/${user.email}`}
            alt="Avatar"
            className={cn("h-8 w-8 rounded-full", collapsed && "h-7 w-7")}
          />
          {!collapsed && (
            <div className="flex flex-col items-start">
              <span className="text-sm font-semibold leading-none">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          )}
        </div>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" side="right" forceMount>
        <DropdownMenuLabel className="flex flex-col space-y-1">
          <div className="flex items-center gap-2">
            <img src={user.image || `https://avatar.vercel.sh/${user.email}`} alt="Avatar" className="h-8 w-8 rounded-full" />
            <div className="flex flex-col">
              <span className="text-sm font-semibold">{user.name}</span>
              <span className="text-xs text-muted-foreground">{user.email}</span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem>
            <User className="mr-2 h-4 w-4" />
            <span>Conta</span>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Sun className="mr-2 h-4 w-4" />
            <span>Tema</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            <DropdownMenuItem onClick={() => setTheme("light")}>
              <Sun className={cn("mr-2 h-4 w-4", theme === "light" && "text-primary")} />
              <span>Claro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              <Moon className={cn("mr-2 h-4 w-4", theme === "dark" && "text-primary")} />
              <span>Escuro</span>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              <Monitor className={cn("mr-2 h-4 w-4", theme === "system" && "text-primary")} />
              <span>Sistema</span>
            </DropdownMenuItem>
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>Sair</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}