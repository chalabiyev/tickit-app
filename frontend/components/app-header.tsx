"use client"

import { useLocale } from "@/lib/locale-context"
import { t, type Locale } from "@/lib/i18n"
import { Search, Globe, Moon, Sun, Menu, LogOut, Ticket } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { useTheme } from "next-themes"

const locales: { value: Locale; label: string }[] = [
  { value: "az", label: "AZ" },
  { value: "ru", label: "RU" },
  { value: "tr", label: "TR" },
]

function getInitials(name: string | undefined): string {
  if (!name) return "AK"
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "AK"
}

// ВАЖНО: Без слова default!
export function AppHeader({ onToggleSidebar, user, onLogout }: any) {
  const { locale, setLocale } = useLocale()
  const { theme, setTheme } = useTheme()

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/95 px-4 backdrop-blur-md sm:px-6 w-full shadow-sm">
      
      {/* ЛЕВАЯ ЧАСТЬ: Гамбургер (слева на мобилках) */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="lg:hidden hover:bg-secondary/50" onClick={onToggleSidebar}>
          <Menu className="h-6 w-6 text-foreground" />
        </Button>
        
        <div className="flex items-center gap-1.5 lg:hidden">
          <Ticket className="h-5 w-5 text-primary" />
        </div>

        <div className="relative hidden lg:block w-64 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder={t(locale, "search")} className="pl-9 h-9 bg-secondary/50 border-none" />
        </div>
      </div>

      {/* ПРАВАЯ ЧАСТЬ: Иконки */}
      <div className="flex items-center gap-1 sm:gap-2">
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="h-9 w-9">
          <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-1 h-9 px-2">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline font-bold">{locale.toUpperCase()}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {locales.map((l) => (
              <DropdownMenuItem key={l.value} onClick={() => setLocale(l.value)} className={locale === l.value ? "bg-accent" : ""}>
                {l.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9 ml-1">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-bold">{getInitials(user?.fullName)}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            {user && (
              <>
                <DropdownMenuItem className="flex flex-col items-start cursor-default">
                  <span className="text-sm font-bold truncate w-full">{user.fullName}</span>
                  <span className="text-xs text-muted-foreground truncate w-full">{user.email}</span>
                </DropdownMenuItem>
                <DropdownMenuItem disabled className="h-px p-0 my-1 bg-border" />
              </>
            )}
            <DropdownMenuItem className="cursor-pointer">{t(locale, "profile") || "Profil"}</DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">{t(locale, "settings") || "Tənzimləmələr"}</DropdownMenuItem>
            <DropdownMenuItem disabled className="h-px p-0 my-1 bg-border" />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10">
              <LogOut className="h-4 w-4 mr-2" /> {t(locale, "logout") || "Çıxış"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}