"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import {
  CalendarDays, MapPin, Pencil, BarChart3, Plus,
  Loader2, Link2, Check, UserPlus, Ticket, AlertCircle, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { AdminBookingModal } from "./AdminBookingModal"
export type { EventData } from "./AdminBookingModal"
import type { EventData } from "./AdminBookingModal"

// ── Local display type (superset of EventData for the card list) ──────────
type EventStatus = "active" | "pending" | "past"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL ?? (typeof window !== "undefined" ? window.location.origin : "")
const TOKEN_KEY = "eticksystem_token"
const DEFAULT_IMG = "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=400&h=200&fit=crop"

// ── Helpers ──────────────────────────────────────────────────────────────────
function resolveImg(url?: string): string {
  if (!url) return DEFAULT_IMG
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}

function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status === 404) return "errNotFound"
  if (status === 429) return "errTooManyRequests"
  if (status !== undefined && status >= 500) return "errServer"
  return "errUnknown"
}

const STATUS_CFG = {
  active:  { cls: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  past:    { cls: "bg-secondary text-muted-foreground border-border/40" },
} as const

// ── Event Card ────────────────────────────────────────────────────────────────
function EventCard({ event, onEdit, onManage, onAdminBook }: {
  event: EventData
  onEdit: (e: EventData) => void
  onManage: (e: EventData) => void
  onAdminBook: (e: EventData) => void
}) {
  const { locale } = useLocale()
  const [copied, setCopied] = useState(false)
  const pct = (event.total ?? 0) > 0 ? Math.round(((event.sold ?? 0) / (event.total ?? 1)) * 100) : 0

  const handleCopyLink = () => {
    if (!event.shortLink) return
    navigator.clipboard.writeText(`${APP_URL}/e/${event.shortLink}`).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const statusLabel =
    event.status === "pending" ? t(locale, "pendingPayment") :
    event.status === "past"    ? t(locale, "past") :
                                 t(locale, "active")

  return (
    // isolation: isolate — фикс для Safari: border-radius + overflow + transform
    <div
      className="group relative flex flex-col rounded-2xl border border-border/50 bg-card overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/25"
      style={{ isolation: "isolate" }}
    >
      {/* Cover */}
      <div className="relative h-44 shrink-0 overflow-hidden bg-secondary/30">
        <img
          src={resolveImg(event.image)}
          alt={event.name ?? event.title ?? ""}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          onError={(e) => { (e.currentTarget as HTMLImageElement).src = DEFAULT_IMG }}
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
        <span className={cn(
          "absolute right-3 top-3 text-[10px] font-bold px-2.5 py-1 rounded-full border",
          STATUS_CFG[event.status ?? "active"].cls
        )}>
          {statusLabel}
        </span>
      </div>

      {/* Body */}
      <div className="flex flex-col flex-1 gap-3 p-4">
        <div>
          <h3 className="text-sm font-bold text-foreground line-clamp-1 mb-1.5">{event.name ?? event.title}</h3>
          <div className="space-y-1">
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CalendarDays className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.date ?? event.eventDate}</span>
            </p>
            <p className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{event.location ?? event.venueName ?? event.address}</span>
            </p>
          </div>
        </div>

        {/* Capacity */}
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-muted-foreground uppercase tracking-wide">{t(locale, "ticketCapacity")}</span>
            <span className="text-foreground tabular-nums">{event.sold ?? 0} / {event.total ?? 0}</span>
          </div>
          <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700", pct > 80 ? "bg-amber-500" : "bg-primary")}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-border/40">
          <button onClick={() => onEdit(event)} className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold bg-secondary/60 hover:bg-primary hover:text-primary-foreground text-foreground transition-all">
            <Pencil className="h-3 w-3" /> {t(locale, "edit")}
          </button>
          <button onClick={() => onManage(event)} className="flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold bg-secondary/60 hover:bg-primary hover:text-primary-foreground text-foreground transition-all">
            <BarChart3 className="h-3 w-3" /> {t(locale, "statistics")}
          </button>
          <button onClick={() => onAdminBook(event)} className="col-span-2 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold border border-border/50 hover:border-primary/40 hover:bg-secondary/60 text-foreground transition-all">
            <UserPlus className="h-3 w-3" /> {t(locale, "adminTicket")}
          </button>
          <button
            onClick={handleCopyLink}
            disabled={!event.shortLink}
            className={cn(
              "col-span-2 flex items-center justify-center gap-1.5 h-8 rounded-lg text-[11px] font-semibold border transition-all disabled:opacity-40 disabled:cursor-not-allowed",
              copied
                ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                : "border-border/50 hover:border-primary/40 hover:bg-secondary/60 text-foreground"
            )}
          >
            {copied
              ? <><Check className="h-3 w-3" /> {t(locale, "linkCopied")}</>
              : <><Link2 className="h-3 w-3" /> {t(locale, "copyLink")}</>
            }
          </button>
        </div>
      </div>
    </div>
  )
}

// ── Event Grid ────────────────────────────────────────────────────────────────
function EventGrid({ events, onEdit, onManage, onAdminBook, emptyKey }: {
  events: EventData[]
  onEdit: (e: EventData) => void
  onManage: (e: EventData) => void
  onAdminBook: (e: EventData) => void
  emptyKey: string
}) {
  const { locale } = useLocale()
  if (!events.length) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground font-medium rounded-2xl border-2 border-dashed border-border/40 bg-secondary/10">
        {t(locale, emptyKey)}
      </div>
    )
  }
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {events.map((ev) => (
        <EventCard key={ev.id} event={ev} onEdit={onEdit} onManage={onManage} onAdminBook={onAdminBook} />
      ))}
    </div>
  )
}

// ── Main View ─────────────────────────────────────────────────────────────────
interface EventsViewProps {
  onCreateEvent: () => void
  onEditEvent: (event: EventData) => void
  onManageEvent: (event: EventData) => void
}

export function EventsView({ onCreateEvent, onEditEvent, onManageEvent }: EventsViewProps) {
  const { locale } = useLocale()
  const [events,         setEvents]        = useState<EventData[]>([])
  const [loading,        setLoading]       = useState(true)
  const [errorKey,       setErrorKey]      = useState<string | null>(null)
  const [adminBookEvent, setAdminBookEvent]= useState<EventData | null>(null)

  const fetchMyEvents = useCallback(async () => {
    setLoading(true)
    setErrorKey(null)
    const controller = new AbortController()
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) { setErrorKey("errUnauthorized"); setLoading(false); return }

      const res = await fetch(`${API_BASE}/api/v1/events/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      })
      if (!res.ok) { setErrorKey(getErrKey(null, res)); return }

      const raw: Record<string, unknown>[] = await res.json()
      const today = new Date()

      setEvents(raw.map((ev): EventData => {
        const evDate = new Date(ev.eventDate as string)
        let status: EventStatus = "active"
        if (ev.status === "PENDING") status = "pending"
        else if (evDate < today) status = "past"
        return {
          id:                String(ev.id),
          name:              String(ev.title ?? ""),
          date:              String(ev.eventDate ?? ""),
          location:          ev.isPhysical ? String(ev.venueName || ev.address || "Physical") : "Online",
          sold:              Number(ev.sold ?? 0),
          total:             Number(ev.totalCapacity ?? 0),
          status,
          image:             resolveImg(ev.coverImageUrl as string | undefined),
          shortLink:         ev.shortLink as string | undefined,
          tiers:             (ev.tiers ?? []) as EventData["tiers"],
          isPhysical:        Boolean(ev.isPhysical),
          isReservedSeating: Boolean(ev.isReservedSeating),
          seats:             (ev.seats ?? []) as EventData["seats"],
          soldSeats:         (ev.soldSeats as string[]) ?? [],
          adminSeats:        (ev.adminSeats as string[]) ?? [],
          seatMapConfig:     ev.seatMapConfig as EventData["seatMapConfig"],
          ticketDesign:      ev.ticketDesign as EventData["ticketDesign"],
          title:             String(ev.title ?? ""),
          eventDate:         String(ev.eventDate ?? ""),
          venueName:         String(ev.venueName ?? ""),
          address:           String(ev.address ?? ""),
        }
      }))
    } catch (err) {
      if ((err as Error).name !== "AbortError") setErrorKey(getErrKey(err))
    } finally {
      setLoading(false)
    }
    return () => controller.abort()
  }, [])

  useEffect(() => { fetchMyEvents() }, [fetchMyEvents])

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-64 gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm font-medium">{t(locale, "loadingData")}</p>
    </div>
  )

  if (errorKey) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, errorKey)}</p>
      <Button variant="outline" className="gap-2 rounded-xl font-bold" onClick={fetchMyEvents}>
        <RefreshCw className="h-4 w-4" /> {t(locale, "tryAgain") || "Yenidən cəhd et"}
      </Button>
    </div>
  )

  const active  = events.filter((e) => e.status === "active")
  const pending = events.filter((e) => e.status === "pending")
  const past    = events.filter((e) => e.status === "past")

  const tabs = [
    { value: "active",  labelKey: "tabActive",  count: active.length,  events: active,  emptyKey: "emptyActive" },
    { value: "pending", labelKey: "tabPending", count: pending.length, events: pending, emptyKey: "emptyPending" },
    { value: "past",    labelKey: "tabPast",    count: past.length,    events: past,    emptyKey: "emptyPast" },
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{t(locale, "eventsSubtitle")}</p>
        <Button className="gap-2 font-bold rounded-xl shadow-sm" onClick={onCreateEvent}>
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">{t(locale, "createNewEvent")}</span>
          <span className="sm:hidden">{t(locale, "next")}</span>
        </Button>
      </div>

      {!events.length ? (
        <div className="flex flex-col items-center justify-center py-24 px-4 text-center rounded-3xl border-2 border-dashed border-border/50 bg-secondary/10 mt-2">
          <div className="h-16 w-16 rounded-2xl bg-card border border-border/50 shadow-sm flex items-center justify-center mb-5">
            <Ticket className="h-8 w-8 text-muted-foreground/40" />
          </div>
          <h3 className="text-xl font-bold text-foreground mb-2">{t(locale, "noEventsTitle")}</h3>
          <p className="text-muted-foreground text-sm max-w-xs mb-6 leading-relaxed">{t(locale, "noEventsDesc")}</p>
          <Button onClick={onCreateEvent} className="font-bold rounded-xl px-7">{t(locale, "createFirstEvent")}</Button>
        </div>
      ) : (
        <Tabs defaultValue="active">
          <TabsList className="mb-5 h-auto gap-1 bg-secondary/40 p-1 rounded-xl">
            {tabs.map(({ value, labelKey, count }) => (
              <TabsTrigger key={value} value={value} className="gap-2 rounded-lg py-2 px-4 font-semibold text-sm data-[state=active]:shadow-sm">
                {t(locale, labelKey)}
                <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md bg-background/80 px-1.5 text-[10px] font-bold text-foreground shadow-sm">
                  {count}
                </span>
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(({ value, events: tabEvs, emptyKey }) => (
            <TabsContent key={value} value={value} className="focus-visible:outline-none mt-0">
              <EventGrid events={tabEvs} onEdit={onEditEvent} onManage={onManageEvent} onAdminBook={(ev) => setAdminBookEvent(ev)} emptyKey={emptyKey} />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {adminBookEvent && (
        <AdminBookingModal
          event={adminBookEvent}
          onClose={() => setAdminBookEvent(null)}
          onSuccess={() => { setAdminBookEvent(null); fetchMyEvents() }}
        />
      )}
    </div>
  )
}