"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { LayoutDashboard, CalendarDays, ShoppingCart, ScanLine, Tag, Wallet, Settings, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

const navItems = [
  { key: "dashboard", icon: LayoutDashboard },
  { key: "myEvents", icon: CalendarDays },
  { key: "orders", icon: ShoppingCart },
  { key: "scanner", icon: ScanLine },
  { key: "promocodes", icon: Tag },
  { key: "finances", icon: Wallet },
  { key: "settings", icon: Settings },
]

function getInitials(name: string | undefined): string {
  if (!name) return "AK"
  const parts = name.trim().split(/\s+/)
  return parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "AK"
}

// ВАЖНО: Без слова default!
export function AppSidebar({ activePage, onNavigate, user }: AppSidebarProps) {
  const { locale } = useLocale()

  return (
    <aside className="flex h-full w-full flex-col bg-background border-r border-border">
      <div className="flex items-center gap-3 px-6 py-7">
        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20 transition-transform hover:rotate-12">
          <Ticket className="h-5 w-5 text-primary-foreground" />
        </div>
        <div className="flex flex-col leading-none">
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tighter text-primary">e</span>
            <span className="text-xl font-black tracking-tighter text-foreground">tick</span>
            <span className="text-xl font-light tracking-tighter text-muted-foreground/80">system</span>
          </div>
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/50 ml-0.5">Admin Panel</span>
        </div>
      </div>

      <nav className="flex-1 px-3 py-2 overflow-y-auto custom-scrollbar">
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = activePage === item.key
            return (
              <li key={item.key}>
                <button
                  onClick={() => onNavigate(item.key)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group outline-none",
                    isActive ? "bg-primary/10 text-primary font-semibold shadow-sm" : "text-muted-foreground hover:bg-secondary/60 hover:text-foreground"
                  )}
                >
                  <Icon className={cn("h-[18px] w-[18px] shrink-0 transition-colors duration-200", isActive ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
                  {t(locale, item.key)}
                </button>
              </li>
            )
          })}
        </ul>
      </nav>

      <div className="p-3 border-t border-border mt-auto">
        <div className="flex items-center gap-3 rounded-xl hover:bg-secondary/40 p-2 transition-all cursor-pointer group">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-foreground border border-border group-hover:border-primary/30 transition-colors">
            {getInitials(user?.fullName)}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="truncate text-sm font-bold text-foreground">{user?.fullName ?? "User"}</span>
            <span className="truncate text-[11px] text-muted-foreground font-medium">{user?.email ?? "admin@eticksystem.com"}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}

interface AppSidebarProps {
  activePage: string
  onNavigate: (page: string) => void
  user?: { fullName: string; email: string } | null
}