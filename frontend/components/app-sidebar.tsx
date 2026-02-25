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
    <aside className="fixed left-0 top-0 z-30 flex h-screen w-64 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <div className="flex items-center gap-2.5 px-6 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sidebar-primary">
          <Ticket className="h-5 w-5 text-sidebar-primary-foreground" />
        </div>
        <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
          Tickit
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
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
                  )}
                >
                  <Icon className="h-[18px] w-[18px]" />
                  {t(locale, item.key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="border-t border-sidebar-border px-3 py-4">
        <div className="flex items-center gap-3 px-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {getInitials(user?.fullName)}
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-sidebar-foreground">
              {user?.fullName ?? ""}
            </span>
            <span className="text-xs text-sidebar-foreground/50">
              {user?.email ?? ""}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}
