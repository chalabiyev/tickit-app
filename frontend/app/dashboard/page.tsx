"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LocaleProvider, useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/views/dashboard-view"
import { EventsView } from "@/components/views/events-view"
import type { EventData } from "@/components/views/AdminBookingModal"
import { OrdersView } from "@/components/views/orders-view"
import { PromocodesView } from "@/components/views/promocodes-view"
import { FinancesView } from "@/components/views/finances-view"
import { SettingsView } from "@/components/views/settings-view"
import { CreateEventWizard } from "@/components/views/create-event-wizard"
import { EventManageView } from "@/components/views/event-manage-view"
import { EventStatisticsView } from "@/components/views/EventStatisticsView"
import { ScannerView } from "@/components/views/ScannerView"
import { getToken, clearToken } from "@/lib/auth"
import { cn } from "@/lib/utils"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

// ── Types ──────────────────────────────────────────────────────────────────
type ViewState =
  | { type: "page"; page: string }
  | { type: "createEvent" }
  | { type: "manageEvent"; event: EventData }
  | { type: "editEvent";   event: EventData }

interface CurrentUser {
  fullName: string
  email:    string
  phone:    string
}

// ── DashboardContent ───────────────────────────────────────────────────────
function DashboardContent({ user, onLogout }: { user: CurrentUser | null; onLogout: () => void }) {
  const [view,        setView]        = useState<ViewState>({ type: "page", page: "dashboard" })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { locale } = useLocale()

  const activePage = view.type === "page" ? view.page : "myEvents"

  const pageTitles: Record<string, string> = {
    dashboard:  t(locale, "dashboard"),
    myEvents:   t(locale, "myEvents"),
    orders:     t(locale, "orders"),
    scanner:    t(locale, "scanner") || "Scanner",
    promocodes: t(locale, "promocodes"),
    finances:   t(locale, "finances"),
    settings:   t(locale, "settings"),
  }

  const getTitle = (): string | null => {
    if (view.type !== "page") return null
    return pageTitles[view.page] ?? null
  }

  const navigate = (page: string) => {
    setView({ type: "page", page })
    setSidebarOpen(false)
  }

  const renderView = () => {
    switch (view.type) {
      case "createEvent":
        return <CreateEventWizard onBack={() => navigate("myEvents")} />

      case "manageEvent":
        return (
          <EventStatisticsView
            event={view.event}
            onBack={() => navigate("myEvents")}
            onNavigateToOrders={() => navigate("orders")}
          />
        )

      case "editEvent":
        return <EventManageView event={view.event} onBack={() => navigate("myEvents")} />

      default:
        switch (view.page) {
          case "dashboard":  return <DashboardView />
          case "myEvents":
            return (
              <EventsView
                onCreateEvent={() => setView({ type: "createEvent" })}
                onEditEvent={(event) => setView({ type: "editEvent", event })}
                onManageEvent={(event) => setView({ type: "manageEvent", event })}
              />
            )
          case "orders":     return <OrdersView />
          case "scanner":    return <ScannerView />
          case "promocodes": return <PromocodesView />
          case "finances":   return <FinancesView />
          case "settings":   return <SettingsView />
          default:           return <DashboardView />
        }
    }
  }

  const title = getTitle()

  return (
    <div className="flex h-screen w-full bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 lg:hidden transition-opacity"
          style={{ WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={cn(
        "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
        sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
      )}>
        <AppSidebar activePage={activePage} user={user} onNavigate={navigate} />
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        <AppHeader onToggleSidebar={() => setSidebarOpen(true)} user={user} onLogout={onLogout} />

        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 w-full">
          {title && (
            <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          <div className="w-full max-w-full">{renderView()}</div>
        </main>
      </div>
    </div>
  )
}

// ── DashboardPage ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user,    setUser]    = useState<CurrentUser | null>(null)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!mounted) return

    const token = getToken()
    if (!token) { router.replace("/auth"); return }

    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          headers: { Authorization: `Bearer ${token}` },
          signal:  controller.signal,
        })
        if (res.status === 401) { clearToken(); router.replace("/auth"); return }
        if (!res.ok) return
        setUser(await res.json() as CurrentUser)
      } catch {
        // AbortError or network — silently ignore
      }
    })()

    return () => controller.abort()
  }, [mounted, router])

  const handleLogout = () => { clearToken(); router.replace("/auth") }

  if (!mounted) return null

  return (
    <LocaleProvider>
      <DashboardContent user={user} onLogout={handleLogout} />
    </LocaleProvider>
  )
}