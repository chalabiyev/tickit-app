"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  Tag,
  Wallet,
  Settings,
  Ticket,
} from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "myEvents", icon: CalendarDays },
  { key: "orders", icon: ShoppingCart },
  { key: "promocodes", icon: Tag },
  { key: "finances", icon: Wallet },
  { key: "settings", icon: Settings },
]

interface AppSidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  user?: {
    fullName: string
    email: string
  } | null
}

function getInitials(name: string | undefined): string {
  if (!name) return "AK"
  const parts = name.trim().split(/\s+/)
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("")
  return initials || "AK"
}

export function AppSidebar({ activePage, onNavigate, user }: AppSidebarProps) {
  const { locale } = useLocale()

  return (
    // Убрали лагучий backdrop-blur и гигантскую тень. Оставили чистый фон.
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-background border-r border-border">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
          <Ticket className="h-4 w-4 text-primary-foreground" />
        </div>
        <span className="text-lg font-black tracking-tight text-foreground uppercase">
          TICKIT
        </span>
      </div>

      <nav className="flex-1 px-3 py-2">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    // Вернули компактность и быструю анимацию только для цвета
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-150 group outline-none",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon 
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors duration-150",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )} 
                  />
                  {t(locale, item.key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* Компактный и аккуратный профиль снизу */}
      <div className="p-3 border-t border-border">
        <div className="flex items-center gap-3 rounded-lg hover:bg-secondary/40 p-2 transition-colors cursor-pointer">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground">
            {getInitials(user?.fullName)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-semibold text-foreground">
              {user?.fullName ?? "User"}
            </span>
            <span className="truncate text-xs text-muted-foreground">
              {user?.email ?? "user@tickit.az"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}