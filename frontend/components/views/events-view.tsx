"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { CalendarDays, MapPin, Pencil, BarChart3, Plus, Loader2, Link2, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

export interface EventData {
  id: string 
  name: string
  date: string
  location: string
  sold: number
  total: number
  status: "active" | "pending" | "past"
  image: string
  shortLink?: string 
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
  const [isCopied, setIsCopied] = useState(false)
  
  const percentage = event.total > 0 ? Math.round((event.sold / event.total) * 100) : 0
  const defaultImage = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=200&fit=crop"

  const handleCopyLink = () => {
    if (!event.shortLink) return;
    const url = `${window.location.origin}/e/${event.shortLink}`;
    navigator.clipboard.writeText(url).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    });
  }

  return (
    // ИСПРАВЛЕНИЕ: Добавили relative и pt-40 (160px отступ сверху под картинку)
    <Card className="relative overflow-hidden border-border/50 transition-all hover:shadow-lg hover:-translate-y-1 hover:border-primary/30 group flex flex-col h-full bg-card/50 backdrop-blur-sm pt-40">
      
      {/* ИСПРАВЛЕНИЕ ЩЕЛИ: Жесткое абсолютное позиционирование прибивает картинку к краям */}
      <div className="absolute top-0 left-0 right-0 h-40 bg-secondary/20 overflow-hidden m-0 p-0 border-none">
        <img
          src={event.image || defaultImage}
          alt={event.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 block m-0 p-0"
          crossOrigin="anonymous"
          onError={(e) => { (e.target as HTMLImageElement).src = defaultImage; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent pointer-events-none" />
        
        <Badge
          variant={event.status === "active" ? "default" : event.status === "pending" ? "secondary" : "outline"}
          className="absolute right-4 top-4 shadow-md backdrop-blur-md"
        >
          {t(locale, event.status === "pending" ? "pendingPayment" : event.status === "past" ? "past" : "active") || event.status}
        </Badge>
      </div>

      <CardContent className="flex flex-col flex-1 gap-4 p-5 relative z-10">
        <div className="flex flex-col gap-1">
          <h3 className="text-base font-bold text-foreground leading-tight line-clamp-1">
            {event.name}
          </h3>
          <div className="flex flex-col gap-1.5 text-xs text-muted-foreground mt-2">
            <div className="flex items-center gap-2 truncate">
              <CalendarDays className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="font-medium">{event.date}</span>
            </div>
            <div className="flex items-center gap-2 truncate">
              <MapPin className="h-3.5 w-3.5 shrink-0 opacity-70" />
              <span className="font-medium">{event.location}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-auto pt-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground font-medium uppercase tracking-wider text-[10px]">
              {t(locale, "ticketCapacity") || "Bilet Tutumu"}
            </span>
            <span className="font-bold text-foreground">
              {event.sold} / {event.total}
            </span>
          </div>
          <Progress value={percentage} className="h-1.5 bg-secondary/50" />
        </div>

        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50 mt-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1 gap-2 text-xs font-semibold h-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
            onClick={() => onEdit(event)}
          >
            <Pencil className="h-3.5 w-3.5" />
            {t(locale, "edit") || "Redaktə"}
          </Button>

          <Button
            variant="secondary"
            size="sm"
            className="flex-1 gap-2 text-xs font-semibold h-9 rounded-lg hover:bg-primary hover:text-primary-foreground transition-colors capitalize"
            onClick={() => onManage(event)}
          >
            <BarChart3 className="h-3.5 w-3.5" />
            {t(locale, "statistics") || "Statistika"}
          </Button>

          <Button
            variant={isCopied ? "default" : "outline"}
            size="sm"
            className={cn(
              "col-span-2 gap-2 text-xs font-semibold h-9 rounded-lg transition-all capitalize",
              isCopied ? "bg-green-600 hover:bg-green-700 text-white border-transparent shadow-md" : "border-border/60 hover:bg-secondary/80"
            )}
            onClick={handleCopyLink}
            disabled={!event.shortLink}
          >
            {isCopied ? (
              <><Check className="h-3.5 w-3.5" /> Kopyalandı</>
            ) : (
              <><Link2 className="h-3.5 w-3.5 opacity-70" /> Linki Kopyala</>
            )}
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
  
  const [events, setEvents] = useState<EventData[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchMyEvents = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        if (!token) throw new Error("No token found")

        const response = await fetch("http://72.60.135.9:8080/api/v1/events/me", {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!response.ok) throw new Error("Failed to fetch events")
        const backendEvents = await response.json()

        const formattedEvents: EventData[] = backendEvents.map((ev: any) => {
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
            sold: 0, 
            total: ev.totalCapacity || 0,
            status: status,
            image: ev.coverImageUrl || "", 
            shortLink: ev.shortLink 
          }
        })

        setEvents(formattedEvents)
      } catch (err: any) {
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
        <p className="font-medium text-sm">Tədbirlər yüklənir...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-destructive gap-3 bg-destructive/10 rounded-2xl border border-destructive/20 max-w-md mx-auto mt-10">
        <AlertCircle className="w-10 h-10" />
        <p className="font-bold">Xəta baş verdi</p>
        <p className="text-sm opacity-80">{error}</p>
        <Button variant="outline" onClick={() => window.location.reload()} className="mt-2 bg-background">Yenidən yoxla</Button>
      </div>
    )
  }

  const activeEvents = events.filter((e) => e.status === "active")
  const pendingEvents = events.filter((e) => e.status === "pending")
  const pastEvents = events.filter((e) => e.status === "past")

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <h2 className="text-2xl font-black tracking-tight text-foreground">
            {t(locale, "myEvents") || "Tədbirlərim"}
          </h2>
          <p className="text-sm text-muted-foreground font-medium">Bütün tədbirlərinizi buradan idarə edin</p>
        </div>
        <Button size="lg" className="gap-2 shadow-lg font-bold rounded-xl hover:scale-105 transition-transform" onClick={onCreateEvent}>
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">{t(locale, "createNewEvent") || "Yeni Tədbir Yarat"}</span>
          <span className="sm:hidden">Yeni</span>
        </Button>
      </div>

      {events.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-20 px-4 text-center border-dashed border-2 bg-secondary/10 shadow-inner rounded-3xl mt-4">
           <div className="h-20 w-20 bg-background rounded-full shadow-md flex items-center justify-center mb-5 border border-border">
             <CalendarDays className="h-10 w-10 text-muted-foreground opacity-60" />
           </div>
           <h3 className="text-2xl font-black text-foreground mb-3">Hələ tədbir yoxdur</h3>
           <p className="text-muted-foreground text-sm max-w-sm mb-8 font-medium leading-relaxed">Siz hələ heç bir tədbir yaratmamısınız. İlk tədbirinizi yaradaraq bilet satışına başlayın!</p>
           <Button onClick={onCreateEvent} size="lg" className="font-bold shadow-xl rounded-xl h-12 px-8">İlk Tədbirini Yarat</Button>
        </Card>
      ) : (
        <Tabs defaultValue="active" className="mt-2">
          <TabsList className="mb-6 bg-secondary/50 p-1 rounded-xl h-auto">
            <TabsTrigger value="active" className="gap-2.5 rounded-lg py-2.5 px-5 font-semibold text-sm data-[state=active]:shadow-sm">
              Aktiv <Badge variant="secondary" className="px-2 py-0.5 rounded-md min-w-6 h-5 flex items-center justify-center bg-background text-foreground shadow-sm">{activeEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="pending" className="gap-2.5 rounded-lg py-2.5 px-5 font-semibold text-sm data-[state=active]:shadow-sm">
              Ödəniş gözləyir <Badge variant="secondary" className="px-2 py-0.5 rounded-md min-w-6 h-5 flex items-center justify-center bg-background text-foreground shadow-sm">{pendingEvents.length}</Badge>
            </TabsTrigger>
            <TabsTrigger value="past" className="gap-2.5 rounded-lg py-2.5 px-5 font-semibold text-sm data-[state=active]:shadow-sm">
              Keçmiş <Badge variant="secondary" className="px-2 py-0.5 rounded-md min-w-6 h-5 flex items-center justify-center bg-background text-foreground shadow-sm">{pastEvents.length}</Badge>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="focus-visible:outline-none">
            {activeEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {activeEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground text-sm border rounded-2xl bg-card/50 font-medium">Aktiv tədbir tapılmadı.</div>
            )}
          </TabsContent>

          <TabsContent value="pending" className="focus-visible:outline-none">
            {pendingEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pendingEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground text-sm border rounded-2xl bg-card/50 font-medium">Ödəniş gözləyən tədbir tapılmadı.</div>
            )}
          </TabsContent>

          <TabsContent value="past" className="focus-visible:outline-none">
             {pastEvents.length > 0 ? (
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pastEvents.map((event) => (
                  <EventCard key={event.id} event={event} onEdit={onEditEvent} onManage={onManageEvent} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16 text-muted-foreground text-sm border rounded-2xl bg-card/50 font-medium">Keçmiş tədbir tapılmadı.</div>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}