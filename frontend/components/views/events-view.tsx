"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, MapPin, Pencil, Settings2, Plus, Loader2 } from "lucide-react"

export interface EventData {
  id: string // Изменили на string, так как в MongoDB ID это строка
  name: string
  date: string
  location: string
  sold: number
  total: number
  status: "active" | "pending" | "past"
  image: string
}

function EventCard({
  event,
  onEdit,
  onManage,
}: {
  event: EventData
  onEdit: (event: EventData) => void
  onManage: (event: EventData) => void
}) {
  const { locale } = useLocale()
  
  // Защита от деления на ноль, если total = 0
  const percentage = event.total > 0 ? Math.round((event.sold / event.total) * 100) : 0

  // Заглушка, если юзер не загрузил картинку
  const defaultImage = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=200&fit=crop"

  return (
    <Card className="overflow-hidden border-border/50 shadow-sm transition-shadow hover:shadow-md">
      <div className="relative h-36 overflow-hidden bg-secondary/20">
        <img
          src={event.image || defaultImage}
          alt={event.name}
          className="h-full w-full object-cover"
          crossOrigin="anonymous"
          // Если картинка не загрузится (например, сломался URL), покажем дефолтную
          onError={(e) => {
            (e.target as HTMLImageElement).src = defaultImage;
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <Badge
          variant={
            event.status === "active"
              ? "default"
              : event.status === "pending"
              ? "secondary"
              : "outline"
          }
          className="absolute right-3 top-3"
        >
          {t(locale, event.status === "pending" ? "pendingPayment" : event.status === "past" ? "past" : "active")}
        </Badge>
      </div>
      <CardContent className="flex flex-col gap-3 p-4">
        <h3 className="text-sm font-semibold text-foreground leading-tight text-balance truncate">
          {event.name}
        </h3>
        <div className="flex flex-col gap-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5 truncate">
            <CalendarDays className="h-3.5 w-3.5 shrink-0" />
            {event.date}
          </div>
          <div className="flex items-center gap-1.5 truncate">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            {event.location}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {t(locale, "ticketCapacity") || "Capacity"}
            </span>
            <span className="font-medium text-foreground">
              {event.sold} {t(locale, "of") || "of"} {event.total}
            </span>
          </div>
          <Progress value={percentage} className="h-1.5" />
        </div>

        <div className="flex gap-2 pt-1">
          <Button
            variant="outline"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onEdit(event)}
          >
            <Pencil className="h-3 w-3" />
            {t(locale, "edit") || "Edit"}
          </Button>
          <Button
            variant="default"
            size="sm"
            className="flex-1 gap-1.5 text-xs"
            onClick={() => onManage(event)}
          >
            <Settings2 className="h-3 w-3" />
            {t(locale, "manage") || "Manage"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

interface EventsViewProps {
  onCreateEvent: () => void
  onEditEvent: (event: EventData) => void
  onManageEvent: (event: EventData) => void
}

export function EventsView({ onCreateEvent, onEditEvent, onManageEvent }: EventsViewProps) {
  const { locale } = useLocale()
  
  // --- НОВЫЕ СОСТОЯНИЯ ДЛЯ БЭКЕНДА ---
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  // Загружаем ивенты при монтировании компонента
  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        if (!token) throw new Error("No token found")

        const response = await fetch("http://localhost:8080/api/v1/events/me", {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        })

        if (!response.ok) {
          throw new Error("Failed to fetch events")
        }

        const backendEvents = await response.json()

        // Преобразуем данные из базы в формат нашего фронтенда
        const formattedEvents: EventData[] = backendEvents.map((ev: any) => {
          // Определяем статус на основе даты (упрощенная логика)
          const eventDate = new Date(ev.eventDate)
          const today = new Date()
          let status: "active" | "pending" | "past" = "active"
          
          if (ev.status === "PENDING") status = "pending"
          else if (eventDate < today) status = "past"

          return {
            id: ev.id,
            name: ev.title,
            date: ev.eventDate,
            location: ev.isPhysical ? (ev.venueName || ev.address || "Physical Event") : "Online Event",
            sold: 0, // Пока ставим 0, так как у нас еще нет системы покупок билетов
            total: ev.totalCapacity || 0,
            status: status,
            image: ev.coverImageUrl || "", 
          }
        })

        setEvents(formattedEvents)
      } catch (err: any) {
        console.error(err)
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMyEvents()
  }, [])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p>Loading your events...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-3">
        <p className="font-semibold">Failed to load events</p>
        <p className="text-sm opacity-80">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-2">Try Again</Button>
      </div>
    )
  }

  const activeEvents = events.filter((e) => e.status === "active")
  const pendingEvents = events.filter((e) => e.status === "pending")
  const pastEvents = events.filter((e) => e.status === "past")

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-foreground">
          {t(locale, "myEvents") || "My Events"}
        </h2>
        <Button size="sm" className="gap-1.5 shadow-sm" onClick={onCreateEvent}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t(locale, "createNewEvent") || "Create Event"}</span>
          <span className="sm:hidden">Create</span>
        </Button>
      </div>

      {events.length === 0 ? (
        // Пустое состояние (если у юзера нет ни одного ивента)
        <Card className="flex flex-col items-center justify-center py-16 px-4 text-center border-dashed border-2 bg-secondary/10">
           <div className="h-16 w-16 bg-background rounded-full shadow-sm flex items-center justify-center mb-4">
             <CalendarDays className="h-8 w-8 text-muted-foreground opacity-50" />
           </div>
           <h3 className="text-xl font-bold text-foreground mb-2">No events yet</h3>
           <p className="text-muted-foreground text-sm max-w-sm mb-6">You haven't created any events. Start your journey by creating your first awesome event!</p>
           <Button onClick={onCreateEvent} size="lg" className="font-semibold shadow-md">Create Your First Event</Button>
        </Card>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-4">
            <TabsTrigger value="active" className="gap-2">
              {t(locale, "active") || "Active"} <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{activeEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2">
              {t(locale, "pendingPayment") || "Pending"} <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{pendingEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2">
              {t(locale, "past") || "Past"} <Badge variant="secondary" className="px-1.5 py-0 min-w-5 h-5 flex items-center justify-center">{pastEvents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl bg-card">No active events found.</div>
            )}
          </TabsContent>

          <TabsContent value="pending">
            {pendingEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl bg-card">No pending events found.</div>
            )}
          </TabsContent>

          <TabsContent value="past">
             {pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-10 text-muted-foreground text-sm border rounded-xl bg-card">No past events found.</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}