"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { LocaleProvider, useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { AppSidebar } from "@/components/app-sidebar"
import { AppHeader } from "@/components/app-header"
import { DashboardView } from "@/components/views/dashboard-view"
import { EventsView, type EventData } from "@/components/views/events-view"
import { OrdersView } from "@/components/views/orders-view"
import { PromocodesView } from "@/components/views/promocodes-view"
import { FinancesView } from "@/components/views/finances-view"
import { SettingsView } from "@/components/views/settings-view"
import { CreateEventWizard } from "@/components/views/create-event-wizard"
import { EventManageView } from "@/components/views/event-manage-view"
import { getToken, clearToken } from "@/lib/auth"
import { API_BASE } from "@/lib/api"
import { cn } from "@/lib/utils"

type ViewState =
  | { type: "page"; page: string }
  | { type: "createEvent" }
  | { type: "manageEvent"; event: EventData }
  | { type: "editEvent"; event: EventData }

interface CurrentUser {
  fullName: string
  email: string
  phone: string
}

interface DashboardContentProps {
  user: CurrentUser | null
  onLogout: () => void
}

function DashboardContent({ user, onLogout }: DashboardContentProps) {
  const [view, setView] = useState<ViewState>({ type: "page", page: "dashboard" })
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { locale } = useLocale()

  const activePage = view.type === "page" ? view.page : "myEvents"

  const pageTitle: Record<string, string> = {
    dashboard: t(locale, "dashboard"),
    myEvents: t(locale, "myEvents"),
    orders: t(locale, "orders"),
    promocodes: t(locale, "promocodes"),
    finances: t(locale, "finances"),
    settings: t(locale, "settings"),
  }

  const getTitle = () => {
    switch (view.type) {
      case "createEvent":
        return null
      case "manageEvent":
        return null
      case "editEvent":
        return null
      default:
        return pageTitle[view.page]
    }
  }

  const renderView = () => {
    switch (view.type) {
      case "createEvent":
        return (
          <CreateEventWizard
            onBack={() => setView({ type: "page", page: "myEvents" })}
          />
        )
      case "manageEvent":
        return (
          <EventManageView
            event={view.event}
            onBack={() => setView({ type: "page", page: "myEvents" })}
          />
        )
      case "editEvent":
        return (
          <EventManageView
            event={view.event}
            onBack={() => setView({ type: "page", page: "myEvents" })}
          />
        )
      default:
        switch (view.page) {
          case "dashboard":
            return <DashboardView />
          case "myEvents":
            return (
              <EventsView
                onCreateEvent={() => setView({ type: "createEvent" })}
                onEditEvent={(event) => setView({ type: "editEvent", event })}
                onManageEvent={(event) => setView({ type: "manageEvent", event })}
              />
            )
          case "orders":
            return <OrdersView />
          case "promocodes":
            return <PromocodesView />
          case "finances":
            return <FinancesView />
          case "settings":
            return <SettingsView />
          default:
            return <DashboardView />
        }
    }
  }

  const title = getTitle()

  return (
    <div className="flex min-h-screen bg-background">
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div
        className={cn(
          "fixed left-0 top-0 z-30 lg:translate-x-0 transition-transform duration-200",
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <AppSidebar
          activePage={activePage}
          user={user}
          onNavigate={(page) => {
            setView({ type: "page", page })
            setSidebarOpen(false)
          }}
        />
      </div>

      <div className="flex flex-1 flex-col lg:pl-64">
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={onLogout}
        />
        <main className="flex-1 p-6">
          {title && (
            <h1 className="mb-6 text-xl font-semibold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          {renderView()}
        </main>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [user, setUser] = useState<CurrentUser | null>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    const token = getToken()
    if (!token) {
      router.replace("/auth")
      return
    }

    const controller = new AbortController()

    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/users/me`, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          signal: controller.signal,
        })

        if (res.status === 401) {
          clearToken()
          router.replace("/auth")
          return
        }

        if (!res.ok) {
          return
        }

        const data = (await res.json()) as CurrentUser
        setUser(data)
      } catch {
      }
    })()

    return () => {
      controller.abort()
    }
  }, [mounted, router])

  const handleLogout = () => {
    clearToken()
    router.replace("/auth")
  }

  if (!mounted) {
    return null
  }

  return (
    <LocaleProvider>
      <DashboardContent user={user} onLogout={handleLogout} />
    </LocaleProvider>
  )
}
