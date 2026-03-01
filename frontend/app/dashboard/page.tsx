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
import { EventStatisticsView } from "@/components/views/EventStatisticsView"
import { ScannerView } from "@/components/views/ScannerView" // <-- Наш сканер
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
    scanner: t(locale, "scanner") || "Scanner", // <-- ДОБАВИЛИ ЗАГОЛОВОК СКАНЕРА
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
          <EventStatisticsView
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
          case "scanner":           // <-- ДОБАВИЛИ КЕЙС ДЛЯ СКАНЕРА
            return <ScannerView />  // Открываем наш компонент
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
    <div className="flex h-screen w-full bg-background overflow-hidden">
      
      {/* ОВЕРЛЕЙ: Затемнение фона на мобилках при открытом меню */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* САЙДБАР КОНТЕЙНЕР: На ПК он статичный, на мобилках выезжает слева */}
      <div
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 transform bg-background transition-transform duration-300 ease-in-out lg:static lg:translate-x-0",
          sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        )}
      >
        <AppSidebar
          activePage={activePage}
          user={user}
          onNavigate={(page) => {
            setView({ type: "page", page })
            setSidebarOpen(false) // Закрываем меню после клика
          }}
        />
      </div>

      {/* ГЛАВНАЯ ЧАСТЬ ЭКРАНА */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* ШАПКА: Передаем функцию открытия меню */}
        <AppHeader
          onToggleSidebar={() => setSidebarOpen(true)}
          user={user}
          onLogout={onLogout}
        />
        
        {/* КОНТЕНТ */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 w-full">
          {title && (
            <h1 className="mb-4 sm:mb-6 text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              {title}
            </h1>
          )}
          <div className="w-full max-w-full">
            {renderView()}
          </div>
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