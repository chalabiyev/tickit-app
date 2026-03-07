"use client"

import { useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import {
  LayoutDashboard,
  CalendarDays,
  ShoppingCart,
  ScanLine,
  Tag,
  Wallet,
  Settings,
  Ticket,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { LucideIcon } from "lucide-react"

interface NavItem {
  key: string
  icon: LucideIcon
}

interface User {
  fullName: string
  email: string
  avatarUrl?: string
}

interface AppSidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  user?: User | null
}

const NAV_ITEMS: NavItem[] = [
  { key: "dashboard",   icon: LayoutDashboard },
  { key: "myEvents",    icon: CalendarDays },
  { key: "orders",      icon: ShoppingCart },
  { key: "scanner",     icon: ScanLine },
  { key: "promocodes",  icon: Tag },
  { key: "finances",    icon: Wallet },
  { key: "settings",    icon: Settings },
]

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

function getInitials(name?: string): string {
  if (!name?.trim()) return "AK"
  const parts = name.trim().split(/\s+/)
  const initials = parts
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("")
  return initials || "AK"
}

function resolveAvatarUrl(avatarUrl?: string): string | null {
  if (!avatarUrl) return null
  return avatarUrl.startsWith("http") ? avatarUrl : `${API_BASE}${avatarUrl}`
}

export function AppSidebar({ activePage, onNavigate, user }: AppSidebarProps) {
  const { locale } = useLocale()

  const avatarSrc = useMemo(() => resolveAvatarUrl(user?.avatarUrl), [user?.avatarUrl])
  const initials = useMemo(() => getInitials(user?.fullName), [user?.fullName])

  return (
    <aside className="flex h-full w-full flex-col bg-background border-r border-border">

      {/* Logo */}
      <div className="flex items-center gap-3 px-6 py-7 shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform hover:rotate-12 duration-300">
          <Ticket className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-baseline">
            <span className="text-xl font-black tracking-tighter text-primary">e</span>
            <span className="text-xl font-black tracking-tighter text-foreground">tick</span>
            <span className="text-xl font-light tracking-tighter text-muted-foreground/70">system</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 mt-0.5">
            Admin Panel
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto" aria-label="Main navigation">
        <ul className="flex flex-col gap-0.5" role="list">
          {NAV_ITEMS.map(({ key, icon: Icon }) => {
            const isActive = activePage === key
            return (
              <li key={key}>
                <button
                  onClick={() => onNavigate(key)}
                  aria-current={isActive ? "page" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 outline-none focus-visible:ring-2 focus-visible:ring-primary/40 group",
                    isActive
                      ? "bg-primary/10 text-primary font-semibold"
                      : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon
                    className={cn(
                      "h-[18px] w-[18px] shrink-0 transition-colors duration-200",
                      isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground"
                    )}
                  />
                  {t(locale, key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      {/* User info */}
      <div className="p-3 border-t border-border shrink-0">
        <div className="flex items-center gap-3 rounded-xl hover:bg-secondary/40 p-2 transition-colors duration-200 cursor-default group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary overflow-hidden border border-border group-hover:border-primary/30 transition-colors duration-200">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                className="w-full h-full object-cover"
                alt={user?.fullName ?? "Avatar"}
                loading="lazy"
                onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }}
              />
            ) : (
              <span className="text-xs font-bold text-foreground select-none">{initials}</span>
            )}
          </div>
          <div className="flex flex-col overflow-hidden min-w-0">
            <span className="truncate text-sm font-semibold text-foreground">
              {user?.fullName ?? "İstifadəçi"}
            </span>
            <span className="truncate text-[11px] text-muted-foreground">
              {user?.email ?? "admin@eticksystem.com"}
            </span>
          </div>
        </div>
      </div>
    </aside>
  )
}