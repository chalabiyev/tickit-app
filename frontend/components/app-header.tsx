"use client"

import { useLocale } from "@/lib/locale-context"
import { t, type Locale } from "@/lib/i18n"
import { Search, Globe, Moon, Sun, Menu } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"

const locales: { value: Locale; label: string }[] = [
  { value: "az", label: "AZ" },
  { value: "ru", label: "RU" },
  { value: "tr", label: "TR" },
]

interface AppHeaderProps {
  onToggleSidebar?: () => void
  user?: {
    fullName: string
    email: string
  } | null
  onLogout?: () => void
}

function getInitials(name: string | undefined): string {
  if (!name) return "AK"
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
  return initials || "AK"
}

export function AppHeader({ onToggleSidebar, user, onLogout }: AppHeaderProps) {
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-sm px-6">
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden"
          onClick={onToggleSidebar}
        >
          <Menu className="h-5 w-5" />
          <span className="sr-only">Toggle menu</span>
        </Button>
        <div className="relative w-64 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t(locale, "search")}
            className="pl-9 h-9 bg-secondary/50 border-none"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="h-9 w-9"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-3 text-sm">
              <Globe className="h-4 w-4" />
              {locale.toUpperCase()}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((l) => (
              <DropdownMenuItem
                key={l.value}
                onClick={() => setLocale(l.value)}
                className={locale === l.value ? "bg-accent" : ""}
              >
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {user && (
              <>
                <DropdownMenuItem className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="h-px p-0">
                  <div className="h-px w-full bg-border" />
                </DropdownMenuItem>
              </>
            )}
            <DropdownMenuItem>{t(locale, "profile")}</DropdownMenuItem>
            <DropdownMenuItem>{t(locale, "settings")}</DropdownMenuItem>
            <DropdownMenuItem onClick={onLogout}>{t(locale, "logout")}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
