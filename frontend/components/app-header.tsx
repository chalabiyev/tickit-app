"use client"

import { useLocale } from "@/lib/locale-context"
import { t, type Locale } from "@/lib/i18n"
import { Search, Globe, Moon, Sun, Menu, LogOut, Ticket, Check } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface User {
  fullName?: string
  email?: string
}

interface AppHeaderProps {
  onToggleSidebar: () => void
  user?: User | null
  onLogout: () => void
}

const LOCALES: { value: Locale; label: string; flag: string }[] = [
  { value: "az", label: "AZ", flag: "🇦🇿" },
  { value: "en", label: "EN", flag: "🇬🇧" },
  { value: "ru", label: "RU", flag: "🇷🇺" },
  { value: "tr", label: "TR", flag: "🇹🇷" },
]

function getInitials(name?: string): string {
  if (!name?.trim()) return "AK"
  const parts = name.trim().split(/\s+/)
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "AK"
}

export function AppHeader({ onToggleSidebar, user, onLogout }: AppHeaderProps) {
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark")

  return (
    <header
      className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 w-full shadow-sm"
      style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
    >

      {/* Left: toggle + logo (mobile) + search (desktop) */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden hover:bg-secondary/50"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </Button>

        <Ticket className="h-5 w-5 text-primary lg:hidden" />

        <div className="relative hidden lg:block w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            placeholder={t(locale, "search")}
            className="pl-9 h-9 bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary/30"
          />
        </div>
      </div>

      {/* Right: theme toggle + locale + user menu */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Theme toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          className="h-9 w-9 relative"
          aria-label="Toggle theme"
        >
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        {/* Locale switcher */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1.5 h-9 px-2" aria-label="Switch language">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline text-xs font-bold">{locale.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[120px]">
            {LOCALES.map((l) => (
              <DropdownMenuItem
                key={l.value}
                onClick={() => setLocale(l.value)}
                className={cn(
                  "flex items-center gap-2 cursor-pointer rounded-lg py-2 px-3 text-xs font-bold",
                  locale === l.value && "bg-accent"
                )}
              >
                <span>{l.flag}</span>
                <span>{l.label}</span>
                {locale === l.value && <Check className="h-3 w-3 ml-auto text-primary" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 ml-1" aria-label="User menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">
                  {getInitials(user?.fullName)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuItem className="flex flex-col items-start gap-0.5 cursor-default focus:bg-transparent">
                  <span className="text-sm font-semibold truncate w-full">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer">
              {t(locale, "profile") || "Profil"}
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              {t(locale, "settings") || "Tənzimləmələr"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={onLogout}
              className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t(locale, "logout") || "Çıxış"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}