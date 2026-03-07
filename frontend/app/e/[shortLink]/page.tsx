"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  CalendarDays, MapPin, Ticket, AlertCircle, Loader2,
  X, Plus, Minus, ShieldCheck, CheckCircle2, ReceiptText,
  Tag, Check, ChevronDown, ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TICKET_TEMPLATES } from "@/lib/ticket-templates"
import { QRCodeSVG } from "qrcode.react"
import { toPng } from "html-to-image"

const API_BASE      = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const DEFAULT_COVER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop"
const GRID = 36

// ── Category i18n map ─────────────────────────────────────────────────────
const CATEGORY_KEYS: Record<string, string> = {
  Concert:    "concert",
  Conference: "conference",
  Workshop:   "workshop",
  Sports:     "sports",
  Theater:    "theater",
  Exhibition: "exhibition",
  Other:      "other",
  Konsert:    "concert",
  Konfrans:   "conference",
  Seminar:    "workshop",
  İdman:      "sports",
  Teatr:      "theater",
  Sərgi:      "exhibition",
  Digər:      "other",
}

function localizeCategory(category: string | undefined, locale: string): string {
  if (!category) return ""
  const key = CATEGORY_KEYS[category] ?? category.toLowerCase()
  return t(locale as any, key) || category
}

// ── Countdown ─────────────────────────────────────────────────────────────
// Spring Boot can serialize LocalDate as [2026,3,14] or "2026-03-14"
// and LocalTime as [23,47] or "23:47:00" — handle both
function parseSpringDate(raw: unknown): { y: number; mo: number; d: number } | null {
  if (!raw) return null
  if (Array.isArray(raw) && raw.length >= 3) return { y: raw[0], mo: raw[1], d: raw[2] }
  if (typeof raw === "string" && raw.includes("-")) {
    const [y, mo, d] = raw.split("-").map(Number)
    return { y, mo, d }
  }
  return null
}

function parseSpringTime(raw: unknown): { h: number; m: number; s: number } {
  if (Array.isArray(raw) && raw.length >= 2) return { h: raw[0], m: raw[1], s: raw[2] ?? 0 }
  if (typeof raw === "string") {
    const parts = raw.split(":").map(Number)
    return { h: parts[0] ?? 0, m: parts[1] ?? 0, s: parts[2] ?? 0 }
  }
  return { h: 0, m: 0, s: 0 }
}

function useCountdown(eventDate?: unknown, startTime?: unknown) {
  const [timeLeft, setTimeLeft] = useState({ d: 0, h: 0, m: 0, s: 0, over: false })

  useEffect(() => {
    if (!eventDate) return
    const pd = parseSpringDate(eventDate)
    if (!pd) return
    const pt = parseSpringTime(startTime)
    // Use UTC-safe construction to avoid timezone shifts
    const target = new Date(pd.y, pd.mo - 1, pd.d, pt.h, pt.m, pt.s)

    const calc = () => {
      const diff = target.getTime() - Date.now()
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0, over: true }); return }
      const d = Math.floor(diff / 86400000)
      const h = Math.floor((diff % 86400000) / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft({ d, h, m, s, over: false })
    }
    calc()
    const id = setInterval(calc, 1000)
    return () => clearInterval(id)
  }, [JSON.stringify(eventDate), JSON.stringify(startTime)])

  return timeLeft
}

function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[56px]">
      <div className="bg-white/10 border border-white/15 rounded-2xl px-4 py-3 text-center backdrop-blur-sm">
        <span className="text-3xl font-black text-white tabular-nums leading-none">
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-[9px] font-bold text-white/50 uppercase tracking-widest">{label}</span>
    </div>
  )
}

// ── Format date (without time-zone shift) ─────────────────────────────────
function formatEventDate(dateStr?: unknown, locale?: string): string {
  if (!dateStr) return ""
  const pd = parseSpringDate(dateStr)
  if (!pd) return String(dateStr)
  const { y, mo, d } = pd
  const months: Record<string, string[]> = {
    az: ["Yanvar","Fevral","Mart","Aprel","May","İyun","İyul","Avqust","Sentyabr","Oktyabr","Noyabr","Dekabr"],
    ru: ["Января","Февраля","Марта","Апреля","Мая","Июня","Июля","Августа","Сентября","Октября","Ноября","Декабря"],
    tr: ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"],
    en: ["January","February","March","April","May","June","July","August","September","October","November","December"],
  }
  const mArr = months[locale ?? "az"] ?? months.az
  return `${d} ${mArr[(mo ?? 1) - 1]} ${y}`
}

function formatTime(timeStr?: unknown): string {
  if (!timeStr) return ""
  const pt = parseSpringTime(timeStr)
  return `${String(pt.h).padStart(2,"0")}:${String(pt.m).padStart(2,"0")}`
}

// ── FAQ Accordion ─────────────────────────────────────────────────────────
interface FaqItem { question: string; answer: string }

function FaqAccordion({ items }: { items: FaqItem[] }) {
  const [open, setOpen] = useState<number | null>(null)
  if (!items.length) return null
  return (
    <div className="flex flex-col gap-3">
      {items.map((item, i) => (
        <div key={i} className="rounded-2xl border border-border/50 bg-secondary/20 overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-5 py-4 text-left gap-3"
            onClick={() => setOpen(open === i ? null : i)}
          >
            <span className="font-bold text-sm text-foreground">{item.question}</span>
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground shrink-0 transition-transform duration-200", open === i && "rotate-180")} />
          </button>
          {open === i && (
            <div className="px-5 pb-4 text-sm text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
              {item.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Types ─────────────────────────────────────────────────────────────────
interface SeatItem { row: number; col: number; tierId: string }

interface TierItem {
  id?: string | number
  tierId?: string
  _safeId?: string
  name: string
  price: number
  color?: string
}

interface BuyerQuestion { id: string; label: string; required: boolean }

interface DesignElement {
  id: string
  type: "text" | "qr" | "image"
  x: number; y: number
  content: string
  color: string
  fontSize: number
  fontWeight?: string
  fontFamily?: string
  width?: number; height?: number
  src?: string
  textAlign?: string
}

interface TicketDesign {
  bgColor?: string
  bgImage?: string
  bgScale?: number
  bgOffsetX?: number
  bgOffsetY?: number
  bgOverlay?: number
  elements?: DesignElement[]
}

interface PublicEvent {
  id: string | number
  title: string
  description?: string
  category?: string
  eventDate?: string
  startTime?: string
  isPhysical?: boolean
  isReservedSeating?: boolean
  venueName?: string
  address?: string
  lat?: number
  lng?: number
  shortLink?: string
  coverImageUrl?: string
  status?: string
  maxTicketsPerOrder?: number
  seats?: SeatItem[]
  tiers?: TierItem[]
  soldSeats?: string[]
  seatMapConfig?: { rowLabelType?: "letters" | "numbers"; stages?: unknown[] }
  ticketDesign?: TicketDesign
  buyerQuestions?: BuyerQuestion[]
  faq?: FaqItem[]
  organizerCompanyName?: string
  companyName?: string
  organizer?: { name?: string; companyName?: string; phone?: string }
  organizerCompanyPhone?: string
  companyPhone?: string
}

interface TicketGenData {
  seatKey: string
  tier:     TierItem | undefined
  seatLabel: string
  qrData?:  string
}

interface Bounds {
  minR: number; maxR: number
  minC: number; maxC: number
  sortedRows: number[]
}

interface PromoData {
  id: string
  type: "PERCENTAGE" | "FIXED"
  value: number
  applicableTierIds?: string[]
}

interface SeatDisplay {
  key: string; row: number; col: number
  tierName: string; price: number; color: string
}

// ── Helpers ───────────────────────────────────────────────────────────────
function toLetterLabel(i: number): string {
  let label = ""; let n = i
  while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }
  return label
}

function resolveCover(url: string | undefined): string {
  if (!url) return DEFAULT_COVER
  return url.startsWith("http") ? url : `${API_BASE}${url.startsWith("/") ? "" : "/"}${url}`
}

// ── PublicSeatMap (unchanged) ─────────────────────────────────────────────
interface PublicSeatMapProps {
  event: PublicEvent
  selectedSeats: string[]
  onToggleSeat: (key: string) => void
  bounds: Bounds
  rowLabels: Record<number, string>
}

function PublicSeatMap({ event, selectedSeats, onToggleSeat, bounds, rowLabels }: PublicSeatMapProps) {
  const { locale } = useLocale()
  const config = event.seatMapConfig ?? {}
  const stages = (config.stages as { id: string; x: number; y: number; w: number; h: number; label?: string }[]) ?? [{
    id: "stage-default", x: -100, y: -150, w: 200, h: 50,
  }]

  const [scale,      setScale]      = useState(1)
  const [offset,     setOffset]     = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)

  const soldSeats = event.soldSeats ?? []

  const selectedSeatsData: SeatDisplay[] = useMemo(() => selectedSeats.map((key) => {
    const [r, c] = key.split("_").map(Number)
    const seat   = event.seats?.find((s) => s.row === r && s.col === c)
    const tier   = event.tiers?.find((ti) =>
      String(ti.tierId) === String(seat?.tierId) ||
      String(ti._safeId) === String(seat?.tierId) ||
      String(ti.id) === String(seat?.tierId)
    )
    return { key, row: r, col: c, tierName: tier?.name ?? "Standard", price: tier?.price ?? 0, color: tier?.color ?? "#3b82f6" }
  }), [selectedSeats, event.seats, event.tiers])

  const actualGridWidth  = (bounds.maxC - bounds.minC + 1) * GRID
  const actualGridHeight = (bounds.maxR - bounds.minR + 1) * GRID
  const globalOffsetX    = -bounds.minC * GRID
  const globalOffsetY    = -bounds.minR * GRID

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full min-h-[500px]">
      <div
        onWheel={(e) => setScale((s) => Math.min(Math.max(s + (e.deltaY > 0 ? -0.05 : 0.05), 0.3), 3))}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={(e) => isDragging && setOffset((prev) => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className="flex-[4] relative bg-black/40 rounded-[2rem] border border-border/40 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing h-full"
        style={{ isolation: "isolate" }}
      >
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScale((s) => Math.min(s + 0.2, 3))}><Plus className="h-4 w-4" /></Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScale((s) => Math.max(s - 0.2, 0.3))}><Minus className="h-4 w-4" /></Button>
        </div>

        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transition: isDragging ? "none" : "transform 0.1s" }}
        >
          <div className="relative pointer-events-auto" style={{ width: actualGridWidth, height: actualGridHeight }}>
            {stages.map((stage) => (
              <div
                key={stage.id}
                className="absolute bg-muted/90 border border-border text-foreground font-black tracking-widest text-[10px] rounded-lg flex items-center justify-center z-20 shadow-md select-none"
                style={{ left: stage.x + globalOffsetX, top: stage.y + globalOffsetY, width: stage.w, height: stage.h, WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
              >
                {stage.label || t(locale as any, "stage") || "STAGE"}
              </div>
            ))}

            {bounds.sortedRows.map((r) => (
              <div
                key={`lbl-${r}`}
                style={{ position: "absolute", top: r * GRID + globalOffsetY + GRID / 2, left: -35, transform: "translate(0,-50%)" }}
                className="text-[11px] text-muted-foreground font-mono font-bold opacity-40 select-none pointer-events-none"
              >
                {rowLabels[r]}
              </div>
            ))}

            {event.seats?.map((seat) => {
              const tier     = event.tiers?.find((ti) =>
                String(ti.tierId) === String(seat.tierId) ||
                String(ti._safeId) === String(seat.tierId) ||
                String(ti.id) === String(seat.tierId)
              )
              const seatKey  = `${seat.row}_${seat.col}`
              const isSelected = selectedSeats.includes(seatKey)
              const isSold   = soldSeats.includes(seatKey)

              return (
                <button
                  type="button"
                  key={seatKey}
                  onClick={() => tier && !isSold && onToggleSeat(seatKey)}
                  disabled={isSold || !tier}
                  style={{
                    position: "absolute",
                    top:  seat.row * GRID + globalOffsetY,
                    left: seat.col * GRID + globalOffsetX,
                    width: GRID - 10, height: GRID - 10,
                    backgroundColor: isSold ? "#333333" : isSelected ? "#ffffff" : (tier?.color ?? "#334155"),
                    color:   isSelected ? "#000000" : "#ffffff",
                    opacity: isSold ? 0.4 : 1,
                  }}
                  className={cn(
                    "rounded-xl flex items-center justify-center text-[10px] font-bold transition-all shadow-sm",
                    isSelected && "ring-4 ring-primary z-10",
                    !isSelected && !isSold && "hover:brightness-110",
                    (isSold || !tier) && "cursor-not-allowed"
                  )}
                >
                  {isSold ? <X className="w-3 h-3 opacity-50" /> : seat.col - bounds.minC + 1}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Selection panel */}
      <div className="flex-1 lg:max-w-[320px] flex flex-col bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-xl" style={{ isolation: "isolate" }}>
        <div className="p-4 border-b bg-secondary/10 flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-widest">{t(locale as any, "selectedTickets") || "Selected"}</h3>
          <Badge className="ml-auto font-bold px-2 h-5 text-[10px]">{selectedSeats.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 min-h-[300px]">
          {selectedSeatsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 opacity-20">
              <Ticket className="w-10 h-10 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{t(locale as any, "noSeatsSelected") || "Select seats"}</p>
            </div>
          ) : selectedSeatsData.map((s) => (
            <div key={s.key} className="p-3 rounded-2xl bg-secondary/20 border border-border/40 flex flex-col gap-1 relative animate-in fade-in slide-in-from-right-2">
              <button onClick={() => onToggleSeat(s.key)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors">
                <X className="h-4 w-4" />
              </button>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                <span className="text-[9px] font-bold text-muted-foreground uppercase">{s.tierName}</span>
              </div>
              <div className="flex justify-between items-end">
                <span className="text-sm font-bold">{t(locale as any, "row") || "Row"} {rowLabels[s.row]}, {t(locale as any, "seat") || "Seat"} {s.col - bounds.minC + 1}</span>
                <span className="font-black text-primary">{s.price} ₼</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// ── PublicEventPage ───────────────────────────────────────────────────────
export default function PublicEventPage() {
  const { locale } = useLocale()
  const params    = useParams()
  const shortLink = params.shortLink as string

  const [mounted,          setMounted]          = useState(false)
  const [event,            setEvent]            = useState<PublicEvent | null>(null)
  const [loading,          setLoading]          = useState(true)
  const [error,            setError]            = useState("")
  const [isCheckoutOpen,   setIsCheckoutOpen]   = useState(false)
  const [checkoutStep,     setCheckoutStep]     = useState<1 | 2 | 3>(1)

  // Promo
  const [promoInput,        setPromoInput]        = useState("")
  const [appliedPromo,      setAppliedPromo]      = useState<PromoData | null>(null)
  const [promoError,        setPromoError]        = useState("")
  const [isValidatingPromo, setIsValidatingPromo] = useState(false)

  // Selection
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({})

  const [buyerInfo,      setBuyerInfo]      = useState({ firstName: "", lastName: "", email: "", phone: "" })
  const [customAnswers,  setCustomAnswers]  = useState<Record<string, string>>({})
  const [isProcessing,   setIsProcessing]   = useState(false)
  const [ticketsToRender, setTicketsToRender] = useState<TicketGenData[]>([])

  const [toast, setToast] = useState<{ show: boolean; message: string; type: "error" | "success" }>({ show: false, message: "", type: "error" })

  const showToast = (message: string, type: "error" | "success" = "error") => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((prev) => ({ ...prev, show: false })), 3000)
  }

  // Countdown
  const countdown = useCountdown(event?.eventDate, event?.startTime)

  // Smart-tag replacer
  const fillTags = (content: string, tData: TicketGenData): string => {
    if (!content || !event) return content ?? ""
    const companyName  = event.organizerCompanyName ?? event.companyName ?? event.organizer?.name ?? event.organizer?.companyName ?? "Təşkilatçı"
    const companyPhone = event.organizerCompanyPhone ?? event.companyPhone ?? event.organizer?.phone ?? "-"
    return content
      .replace(/{{Event_Name}}/gi,   event.title ?? "")
      .replace(/{{Event_Date}}/gi,   event.eventDate ?? "")
      .replace(/{{Location}}/gi,     event.isPhysical ? (event.venueName ?? event.address ?? "") : "Online Event")
      .replace(/{{Guest_Name}}/gi,   `${buyerInfo.firstName} ${buyerInfo.lastName}`)
      .replace(/{{Ticket_Type}}/gi,  tData.tier?.name ?? "Standard")
      .replace(/{{Seat_Info}}/gi,    tData.seatLabel ?? "")
      .replace(/{{Company_Name}}/gi, companyName)
      .replace(/{{Company_Phone}}/gi, companyPhone)
      .replace(/ATTENDEE_ID/g,               `${buyerInfo.firstName} ${buyerInfo.lastName}`)
      .replace(/\/\/ SCAN_TO_ENTER \/\//g,   t(locale as any, "scanToEnter") || "Giriş üçün skan edin")
  }

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!shortLink || !mounted) return
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/events/s/${shortLink}`, { cache: "no-store" })
        if (!res.ok) throw new Error("not_found")
        const data: PublicEvent = await res.json()
        // Normalize tier IDs
        if (data.tiers && data.seats) {
          const usedTierIds = Array.from(new Set(data.seats.map((s) => String(s.tierId)).filter(Boolean)))
          data.tiers = data.tiers.map((tier, i) => ({
            ...tier,
            _safeId: tier.tierId ? String(tier.tierId) : String(usedTierIds[i] ?? tier.id ?? `tier_${i}`),
          }))
        }
        setEvent(data)
      } catch {
        setError(t(locale as any, "eventNotFound") || "Tədbir tapılmadı")
      } finally {
        setLoading(false)
      }
    }
    fetchEvent()
  }, [shortLink, mounted, locale])

  const isReservedMap = !!event?.isPhysical && !!event?.isReservedSeating

  const bounds = useMemo((): Bounds | null => {
    if (!event?.seats?.length) return null
    const rows = event.seats.map((s) => Number(s.row))
    const cols = event.seats.map((s) => Number(s.col))
    return {
      minR: Math.min(...rows), maxR: Math.max(...rows),
      minC: Math.min(...cols), maxC: Math.max(...cols),
      sortedRows: Array.from(new Set(rows)).sort((a, b) => a - b),
    }
  }, [event])

  const rowLabels = useMemo((): Record<number, string> => {
    if (!bounds || !event?.seatMapConfig) return {}
    const useLetters = event.seatMapConfig.rowLabelType !== "numbers"
    const labels: Record<number, string> = {}
    bounds.sortedRows.forEach((r, i) => { labels[r] = useLetters ? toLetterLabel(i) : String(i + 1) })
    return labels
  }, [bounds, event])

  const toggleSeat = (seatKey: string) => {
    setSelectedSeats((prev) => {
      if (prev.includes(seatKey)) return prev.filter((k) => k !== seatKey)
      const max = event?.maxTicketsPerOrder ?? 10
      if (prev.length >= max) { showToast(`Maksimum ${max} bilet seçə bilərsiniz.`); return prev }
      return [...prev, seatKey]
    })
  }

  const handleIncrementTier = (tierId: string) => {
    const total = Object.values(selectedTiers).reduce((a, b) => a + b, 0)
    const max   = event?.maxTicketsPerOrder ?? 10
    if (total >= max) { showToast(`Maksimum ${max} bilet seçə bilərsiniz.`); return }
    setSelectedTiers((prev) => ({ ...prev, [tierId]: (prev[tierId] ?? 0) + 1 }))
  }

  const handleDecrementTier = (tierId: string) => {
    setSelectedTiers((prev) => {
      const next = (prev[tierId] ?? 0) - 1
      if (next <= 0) { const s = { ...prev }; delete s[tierId]; return s }
      return { ...prev, [tierId]: next }
    })
  }

  const findTier = (tierId: string): TierItem | undefined =>
    event?.tiers?.find((ti) =>
      String(ti.tierId) === String(tierId) ||
      String(ti._safeId) === String(tierId) ||
      String(ti.id) === String(tierId)
    )

  const baseTotalPrice = useMemo(() => {
    if (!event) return 0
    if (isReservedMap) {
      return selectedSeats.reduce((sum, key) => {
        const [r, c] = key.split("_").map(Number)
        const seat   = event.seats?.find((s) => s.row === r && s.col === c)
        return sum + (findTier(seat?.tierId ?? "")?.price ?? 0)
      }, 0)
    }
    return Object.entries(selectedTiers).reduce((sum, [tierId, qty]) => {
      return sum + ((findTier(tierId)?.price ?? 0) * qty)
    }, 0)
  }, [isReservedMap, selectedSeats, selectedTiers, event])

  const finalTotalPrice = useMemo(() => {
    if (!appliedPromo) return baseTotalPrice
    const promoTiers = appliedPromo.applicableTierIds ?? []

    const isTierEligible = (tier: TierItem | undefined): boolean => {
      if (!tier) return false
      if (promoTiers.length === 0) return true
      return promoTiers.includes(String(tier.tierId)) || promoTiers.includes(String(tier._safeId)) || promoTiers.includes(String(tier.id))
    }

    let discountable = 0; let fixed = 0
    if (isReservedMap) {
      selectedSeats.forEach((key) => {
        const [r, c] = key.split("_").map(Number)
        const seat   = event?.seats?.find((s) => s.row === r && s.col === c)
        const tier   = findTier(seat?.tierId ?? "")
        const price  = tier?.price ?? 0
        isTierEligible(tier) ? (discountable += price) : (fixed += price)
      })
    } else {
      Object.entries(selectedTiers).forEach(([tierId, qty]) => {
        if (qty <= 0) return
        const tier  = findTier(tierId)
        const price = (tier?.price ?? 0) * qty
        isTierEligible(tier) ? (discountable += price) : (fixed += price)
      })
    }

    const discounted = appliedPromo.type === "PERCENTAGE"
      ? discountable * (1 - appliedPromo.value / 100)
      : Math.max(0, discountable - appliedPromo.value)

    return Math.round(discounted + fixed)
  }, [baseTotalPrice, appliedPromo, isReservedMap, selectedSeats, selectedTiers, event])

  const totalCount = isReservedMap
    ? selectedSeats.length
    : Object.values(selectedTiers).reduce((a, b) => a + b, 0)

  const isFormValid = useMemo(() => {
    if (!buyerInfo.firstName.trim() || !buyerInfo.lastName.trim() || !buyerInfo.email.trim() || !buyerInfo.phone.trim()) return false
    for (const q of event?.buyerQuestions ?? []) {
      if (q.required && !customAnswers[q.id]?.trim()) return false
    }
    return true
  }, [buyerInfo, customAnswers, event])

  const handleApplyPromo = async () => {
    if (!promoInput.trim() || !event) return
    setIsValidatingPromo(true); setPromoError("")
    try {
      const res = await fetch(`${API_BASE}/api/v1/promocodes/validate?code=${promoInput}&eventId=${event.id}`)
      if (!res.ok) {
        const err = await res.json().catch(() => ({}))
        throw new Error((err as { message?: string }).message ?? "Promo-kod yanlışdır")
      }
      const data = await res.json() as PromoData
      const promoTiers = data.applicableTierIds ?? []

      let applicable = promoTiers.length === 0
      if (!applicable) {
        if (isReservedMap) {
          applicable = selectedSeats.some((key) => {
            const [r, c] = key.split("_").map(Number)
            const seat   = event.seats?.find((s) => s.row === r && s.col === c)
            return promoTiers.includes(String(seat?.tierId))
          })
        } else {
          applicable = Object.keys(selectedTiers).some((id) => promoTiers.includes(id) && selectedTiers[id] > 0)
        }
      }

      if (!applicable) throw new Error("Bu promo-kod seçdiyiniz bilet növləri üçün keçərli deyil")
      setAppliedPromo(data)
      showToast(t(locale as any, "discountApplied") || "Promo-kod tətbiq edildi!", "success")
    } catch (err) {
      setPromoError((err as Error).message)
      setAppliedPromo(null)
    } finally {
      setIsValidatingPromo(false)
    }
  }

  const handleCheckout = async () => {
    if (!event) return
    setIsProcessing(true)
    try {
      const finalSeatIds:      string[]        = []
      const ticketsToGenerate: TicketGenData[] = []

      if (isReservedMap) {
        for (const seatKey of selectedSeats) {
          finalSeatIds.push(seatKey)
          const [r, c] = seatKey.split("_").map(Number)
          const seat   = event.seats?.find((s) => s.row === r && s.col === c)
          const tier   = findTier(seat?.tierId ?? "")
          ticketsToGenerate.push({
            seatKey, tier,
            seatLabel: `${t(locale as any, "row") || "Row"} ${rowLabels[r] ?? r}, ${t(locale as any, "seat") || "Seat"} ${c - (bounds?.minC ?? 0) + 1}`,
          })
        }
      } else {
        Object.entries(selectedTiers).forEach(([tierId, qty]) => {
          const tier = findTier(tierId)
          for (let i = 0; i < qty; i++) {
            const fakeSeatId = `GA_${tierId}_${Date.now()}_${i}`
            finalSeatIds.push(fakeSeatId)
            ticketsToGenerate.push({
              seatKey: fakeSeatId, tier,
              seatLabel: event.isPhysical ? "General Admission" : "Online Access",
            })
          }
        })
      }

      const orderRes = await fetch(`${API_BASE}/api/v1/orders/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventId:      event.id,
          customerName: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
          customerEmail: buyerInfo.email,
          customerPhone: buyerInfo.phone,
          seatIds:      finalSeatIds,
          totalAmount:  finalTotalPrice,
          promocodeId:  appliedPromo?.id ?? null,
        }),
      })

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}))
        throw new Error((errData as { message?: string }).message ?? "Sifariş yaradılarkən xəta baş verdi.")
      }

      const createdOrder = await orderRes.json()
      const backendTickets = (createdOrder.tickets ?? []) as { seatId: string; qrCode: string }[]

      const prepared: TicketGenData[] = ticketsToGenerate.map((tData) => {
        const matched = backendTickets.find((bt) => bt.seatId === tData.seatKey)
        return { ...tData, qrData: matched ? matched.qrCode : `${event.shortLink ?? ""}-${tData.seatKey}` }
      })

      setTicketsToRender(prepared)
      await new Promise((resolve) => setTimeout(resolve, 1000))

      const { jsPDF } = await import("jspdf")
      const design = event.ticketDesign ?? TICKET_TEMPLATES.classicDark
      const pdf    = new jsPDF("p", "mm", [90, 160])

      for (let i = 0; i < prepared.length; i++) {
        const el = document.getElementById(`render-ticket-${i}`)
        if (el) {
          const dataUrl = await toPng(el, {
            pixelRatio: 2,
            backgroundColor: (design as TicketDesign).bgColor ?? "#09090b",
          })
          if (i > 0) pdf.addPage()
          pdf.addImage(dataUrl, "PNG", 0, 0, 90, 160)
        }
      }

      pdf.save(`${event.title.replace(/\s+/g, "_")}_Biletler.pdf`)

      const pdfBlob   = pdf.output("blob")
      const emailForm = new FormData()
      emailForm.append("file",      pdfBlob, "ticket.pdf")
      emailForm.append("email",     buyerInfo.email)
      emailForm.append("buyerName", buyerInfo.firstName)
      emailForm.append("eventName", event.title)
      emailForm.append("eventDate", `${event.eventDate ?? ""} ${event.startTime ?? ""}`)
      emailForm.append("location",  event.isPhysical ? (event.venueName ?? "") : "Online Event")

      fetch(`${API_BASE}/api/v1/email/send-ticket`, { method: "POST", body: emailForm }).catch(() => {})

      setCheckoutStep(3)
    } catch (err) {
      showToast((err as Error).message || "Xəta baş verdi.", "error")
    } finally {
      setIsProcessing(false)
    }
  }

  const closeCheckout = () => {
    setIsCheckoutOpen(false)
    if (checkoutStep === 3) window.location.reload()
  }

  if (!mounted) return null
  if (loading)  return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
  if (error || !event) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><AlertCircle className="w-12 h-12 text-destructive mb-4" /><h2 className="text-xl font-bold">{error}</h2></div>

  const minPrice = event.tiers?.length ? Math.min(...event.tiers.map((ti) => ti.price)) : 0
  const coverUrl = resolveCover(event.coverImageUrl)
  const stepText = (t(locale as any, "stepOf") || "{step} / {total} addım")
    .replace(/{step}/gi,  String(checkoutStep))
    .replace(/{total}/gi, "2")

  // Google Maps URL
  const mapsUrl = event.lat && event.lng
    ? `https://maps.google.com/?q=${event.lat},${event.lng}`
    : event.address
      ? `https://maps.google.com/?q=${encodeURIComponent(event.address)}`
      : null

  const countdownLabels = {
    az: ["GÜN", "SAAT", "DƏQ", "SAN"],
    ru: ["ДЕНЬ", "ЧАС",  "МИН", "СЕК"],
    tr: ["GÜN", "SAAT", "DAK", "SAN"],
    en: ["DAY", "HRS",  "MIN", "SEC"],
  }[locale] ?? ["GÜN", "SAAT", "DƏQ", "SAN"]

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 pb-12">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center px-6 py-4 border-b border-white/5 shadow-sm" style={{ WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)", backgroundColor: "rgba(var(--background), 0.8)" }}>
        <div className="flex items-center gap-2">
          <Ticket className="w-6 h-6 text-primary" />
          <div className="flex items-center">
            <span className="text-xl font-black tracking-tighter text-primary">e</span>
            <span className="text-xl font-black tracking-tighter text-foreground uppercase">ticksystem</span>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <div className="w-full h-[55vh] lg:h-[65vh] relative overflow-hidden flex flex-col justify-end mt-[60px]" style={{ isolation: "isolate" }}>
        <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" alt={event.title} />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-black/20 z-10" />
        <div className="relative z-20 max-w-6xl mx-auto px-6 w-full pb-10">
          {/* Category badge — localised */}
          <Badge className="mb-4 bg-primary text-primary-foreground uppercase tracking-widest font-black px-3 py-1">
            {localizeCategory(event.category, locale)}
          </Badge>
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground drop-shadow-2xl leading-tight mb-8">{event.title}</h1>

          {/* ── Countdown ── */}
          {!countdown.over && (
            <div className="flex items-center gap-3 flex-wrap">
              <CountdownBlock value={countdown.d} label={countdownLabels[0]} />
              <span className="text-white/30 font-black text-2xl mb-5">:</span>
              <CountdownBlock value={countdown.h} label={countdownLabels[1]} />
              <span className="text-white/30 font-black text-2xl mb-5">:</span>
              <CountdownBlock value={countdown.m} label={countdownLabels[2]} />
              <span className="text-white/30 font-black text-2xl mb-5">:</span>
              <CountdownBlock value={countdown.s} label={countdownLabels[3]} />
            </div>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 relative z-20 -mt-4">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          {/* Left */}
          <div className="flex-1 flex flex-col gap-8 w-full">

            {/* Date + Location cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Date card */}
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/40 border border-border/50 shadow-sm" style={{ WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)" }}>
                <div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50 shrink-0">
                  <CalendarDays className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col mt-0.5 min-w-0">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t(locale as any, "dateTime")}</span>
                  <span className="font-bold text-base text-foreground">{formatEventDate(event.eventDate, locale)}</span>
                  {event.startTime && (
                    <span className="text-sm font-semibold text-primary/80 mt-0.5">{formatTime(event.startTime)}</span>
                  )}
                </div>
              </div>

              {/* Location card — compact, clickable for map */}
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/40 border border-border/50 shadow-sm" style={{ WebkitBackdropFilter: "blur(16px)", backdropFilter: "blur(16px)" }}>
                <div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50 shrink-0">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <div className="flex flex-col mt-0.5 min-w-0 flex-1">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t(locale as any, "location")}</span>
                  <span className="font-bold text-base text-foreground truncate">
                    {event.isPhysical ? event.venueName : t(locale as any, "onlineEvent")}
                  </span>
                  {/* Address: show "Open map" link instead of full address */}
                  {event.isPhysical && mapsUrl && (
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-xs font-semibold text-primary/70 hover:text-primary mt-1 transition-colors w-fit"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>
                        {locale === "ru" ? "Открыть карту" : locale === "tr" ? "Haritayı aç" : locale === "en" ? "Open map" : "Xəritəni aç"}
                      </span>
                    </a>
                  )}
                  {event.isPhysical && !mapsUrl && (
                    <span className="text-xs font-medium text-muted-foreground mt-0.5 truncate">{event.address}</span>
                  )}
                  {!event.isPhysical && (
                    <span className="text-xs font-medium text-muted-foreground mt-0.5">{t(locale as any, "linkProvided")}</span>
                  )}
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="flex flex-col gap-4">
              <h3 className="text-2xl font-black tracking-tight">{t(locale as any, "aboutEvent")}</h3>
              <div
                className="text-muted-foreground leading-relaxed prose prose-invert max-w-none"
                dangerouslySetInnerHTML={{ __html: event.description ?? "" }}
              />
            </div>

            {/* FAQ — show only if manager added questions */}
            {(event.faq?.length ?? 0) > 0 && (
              <div className="flex flex-col gap-4 pb-4">
                <h3 className="text-2xl font-black tracking-tight">FAQ</h3>
                <FaqAccordion items={event.faq!} />
              </div>
            )}

            {/* Mobile buy button */}
            <div className="lg:hidden pb-20">
              {event.status === "PAUSED" ? (
                <div className="flex flex-col items-center justify-center text-center py-6 bg-card rounded-3xl border border-border/40 p-6">
                  <AlertCircle className="h-8 w-8 text-destructive mb-3" />
                  <h3 className="font-black text-lg text-foreground mb-1 uppercase">{t(locale as any, "salesPaused") || "Satış dayandırılıb"}</h3>
                  <p className="text-sm text-muted-foreground">{t(locale as any, "salesPausedDesc")}</p>
                </div>
              ) : (
                <Button size="lg" className="w-full h-14 font-black text-lg rounded-2xl shadow-xl" onClick={() => setIsCheckoutOpen(true)}>
                  {t(locale as any, "buyTickets")} — {minPrice === 0 ? t(locale as any, "free") : `${minPrice} ₼`}
                </Button>
              )}
            </div>
          </div>

          {/* Right: sticky purchase card */}
          <div className="hidden lg:block w-[350px] shrink-0 sticky top-24 z-30">
            <div className="bg-card border border-border/40 shadow-2xl rounded-[2.5rem] p-8 flex flex-col" style={{ isolation: "isolate" }}>
              {event.status === "PAUSED" ? (
                <div className="flex flex-col items-center justify-center text-center py-6">
                  <div className="h-16 w-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mb-4"><AlertCircle className="h-8 w-8" /></div>
                  <h3 className="font-black text-xl text-foreground mb-2 uppercase tracking-tight">{t(locale as any, "salesPaused") || "Satış dayandırılıb"}</h3>
                  <p className="text-sm font-medium text-muted-foreground">{t(locale as any, "salesPausedDesc")}</p>
                </div>
              ) : (
                <>
                  <div className="text-center mb-6 pt-2">
                    <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-1 opacity-60">{t(locale as any, "ticketsFrom")}</span>
                    <span className="text-5xl font-black text-foreground">{minPrice === 0 ? (t(locale as any, "free") || "Free") : `${minPrice} ₼`}</span>
                  </div>
                  <Separator className="my-5 bg-border/60" />
                  <div className="flex flex-col gap-3 mb-8">
                    {event.tiers?.map((tier) => (
                      <div key={tier.tierId ?? String(tier.id)} className="flex items-center justify-between p-3.5 rounded-xl border bg-secondary/10 shadow-sm">
                        <div className="flex items-center gap-3 font-bold text-sm">
                          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />
                          {tier.name}
                        </div>
                        <div className="font-black text-base">{tier.price === 0 ? (t(locale as any, "free") || "Free") : `${tier.price} ₼`}</div>
                      </div>
                    ))}
                  </div>
                  <Button size="lg" className="w-full h-14 font-black text-lg rounded-xl shadow-xl hover:scale-[1.02] transition-transform" onClick={() => setIsCheckoutOpen(true)}>
                    {t(locale as any, "buyTickets")}
                  </Button>
                  <div className="flex items-center justify-center gap-2 mt-5 text-muted-foreground opacity-60">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t(locale as any, "secureCheckout")}</span>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Checkout modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-300" style={{ backgroundColor: "rgba(var(--background), 0.95)", WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
          <div className={cn(
            "bg-card w-full border-t sm:border border-border/60 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col",
            isReservedMap && checkoutStep === 1 ? "max-w-[1300px] h-[90vh]" : "max-w-xl max-h-[92vh]"
          )}>
            {/* Modal header */}
            <div className="p-6 border-b flex justify-between items-center bg-secondary/10 shrink-0">
              <div className="flex flex-col gap-0.5">
                <h2 className="text-xl font-black uppercase tracking-tight">
                  {checkoutStep === 1 ? t(locale as any, "selectTickets") : checkoutStep === 2 ? t(locale as any, "buyerDetails") : t(locale as any, "success")}
                </h2>
                {checkoutStep < 3 && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stepText}</span>}
              </div>
              <Button variant="secondary" size="icon" className="rounded-xl w-10 h-10" onClick={closeCheckout}><X className="w-5 h-5" /></Button>
            </div>

            <div className="p-4 sm:p-8 overflow-y-auto flex-1 bg-background">
              {/* Step 1: Select */}
              {checkoutStep === 1 && (
                isReservedMap && bounds ? (
                  <PublicSeatMap event={event} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} bounds={bounds} rowLabels={rowLabels} />
                ) : (
                  <div className="flex flex-col gap-4 max-w-lg mx-auto w-full">
                    {event.tiers?.map((tier) => {
                      const tierId = tier._safeId ?? String(tier.id)
                      return (
                        <div key={tierId} className="flex items-center justify-between p-5 bg-card border border-border/60 rounded-2xl shadow-sm hover:border-primary/40 transition-colors">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} />
                              <h3 className="font-bold text-lg text-foreground">{tier.name}</h3>
                            </div>
                            <span className="text-primary font-black text-xl">{tier.price === 0 ? (t(locale as any, "free") || "Free") : `${tier.price} ₼`}</span>
                          </div>
                          <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-xl border border-border/50">
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleDecrementTier(tierId)} disabled={!selectedTiers[tierId]}><Minus className="w-4 h-4" /></Button>
                            <span className="font-bold w-6 text-center text-lg">{selectedTiers[tierId] ?? 0}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8 rounded-lg" onClick={() => handleIncrementTier(tierId)}><Plus className="w-4 h-4" /></Button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              )}

              {/* Step 2: Buyer details */}
              {checkoutStep === 2 && (
                <div className="flex flex-col gap-6 p-2">
                  {/* Contact info */}
                  <div className="flex flex-col gap-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale as any, "contactInfo") || "Contact Info"}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale as any, "firstName") || "Ad"} value={buyerInfo.firstName} onChange={(e) => setBuyerInfo({ ...buyerInfo, firstName: e.target.value })} />
                      <Input className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale as any, "lastName") || "Soyad"} value={buyerInfo.lastName} onChange={(e) => setBuyerInfo({ ...buyerInfo, lastName: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <Input type="email" className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale as any, "emailAddress") || "E-poçt"} value={buyerInfo.email} onChange={(e) => setBuyerInfo({ ...buyerInfo, email: e.target.value })} />
                      <Input type="tel" className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale as any, "phoneNumber") || "Telefon"} value={buyerInfo.phone} onChange={(e) => setBuyerInfo({ ...buyerInfo, phone: e.target.value })} />
                    </div>
                  </div>

                  {/* Custom questions */}
                  {(event.buyerQuestions?.length ?? 0) > 0 && (
                    <div className="flex flex-col gap-4">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale as any, "additionalDetails") || "Additional Details"}</Label>
                      {event.buyerQuestions!.map((q) => (
                        <div key={q.id} className="flex flex-col gap-2">
                          <Label className="text-sm font-semibold ml-1">{q.label} {q.required && <span className="text-destructive">*</span>}</Label>
                          <Input className="h-12 bg-secondary/10 rounded-xl font-medium border-none" required={q.required} value={customAnswers[q.id] ?? ""} onChange={(e) => setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })} />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Promo code — always at the BOTTOM of the form */}
                  <div className="p-5 rounded-[2rem] border bg-primary/5 flex flex-col gap-3 mt-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-primary flex items-center gap-2">
                      <Tag className="w-3 h-3" /> {t(locale as any, "havePromo") || "Promo-kodunuz var?"}
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        placeholder={t(locale as any, "enterCode") || "Kodu daxil edin"}
                        value={promoInput}
                        onChange={(e) => { setPromoInput(e.target.value.toUpperCase()); setPromoError("") }}
                        className="h-12 bg-background border-none rounded-xl font-bold uppercase"
                        disabled={!!appliedPromo || isValidatingPromo}
                      />
                      {appliedPromo ? (
                        <Button variant="secondary" className="h-12 rounded-xl text-destructive" onClick={() => { setAppliedPromo(null); setPromoInput("") }}><X className="w-5 h-5" /></Button>
                      ) : (
                        <Button className="h-12 px-6 rounded-xl font-bold" onClick={handleApplyPromo} disabled={isValidatingPromo || !promoInput.trim()}>
                          {isValidatingPromo ? <Loader2 className="animate-spin w-4 h-4" /> : (t(locale as any, "apply") || "Tətbiq et")}
                        </Button>
                      )}
                    </div>
                    {promoError && <p className="text-[10px] text-destructive font-bold uppercase ml-1">{promoError}</p>}
                    {appliedPromo && (
                      <div className="flex items-center justify-between text-green-600 bg-green-500/10 p-3 rounded-xl border border-green-500/20">
                        <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2"><Check className="w-3 h-3" /> {t(locale as any, "discountApplied") || "Endirim tətbiq olundu!"}</span>
                        <span className="text-sm font-black">-{appliedPromo.value}{appliedPromo.type === "PERCENTAGE" ? "%" : " ₼"}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Step 3: Success */}
              {checkoutStep === 3 && (
                <div className="flex flex-col items-center justify-center py-10 text-center">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{t(locale as any, "paymentSuccessful") || "ÖDƏNİŞ UĞURLUDUR!"}</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">{t(locale as any, "ticketsDownloaded") || "Biletləriniz PDF formatında yükləndi!"}</p>
                  <Button size="lg" className="mt-8 px-10 rounded-xl font-bold" onClick={closeCheckout}>{t(locale as any, "done")}</Button>
                </div>
              )}
            </div>

            {/* Bottom bar */}
            {checkoutStep < 3 && (
              <div className="p-6 border-t bg-card rounded-b-[2.5rem] flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t(locale as any, "total")}</span>
                  <div className="flex items-baseline gap-1">
                    {appliedPromo && <span className="text-sm line-through text-muted-foreground mr-2 opacity-50 font-bold">{baseTotalPrice} ₼</span>}
                    <span className="text-4xl font-black text-primary tracking-tighter">{finalTotalPrice}</span>
                    <span className="text-lg font-black text-primary">₼</span>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase mt-1">{totalCount} {t(locale as any, "ticketsSelected")}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {checkoutStep === 2 && (
                    <Button variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold" onClick={() => setCheckoutStep(1)}>
                      {t(locale as any, "back") || "Geri"}
                    </Button>
                  )}
                  <Button
                    size="lg"
                    className={cn("h-14 px-10 rounded-xl font-black text-lg flex-1 sm:flex-none shadow-xl", checkoutStep === 2 ? "bg-green-600 hover:bg-green-700" : "")}
                    onClick={() => checkoutStep === 1 ? setCheckoutStep(2) : handleCheckout()}
                    disabled={checkoutStep === 1 ? totalCount === 0 : (!isFormValid || isProcessing)}
                  >
                    {isProcessing
                      ? <Loader2 className="animate-spin w-5 h-5" />
                      : checkoutStep === 1
                        ? (t(locale as any, "continueBtn") || "Davam et")
                        : finalTotalPrice === 0
                          ? (t(locale as any, "register") || "Qeydiyyat")
                          : (t(locale as any, "payNow") || "İndi Ödə")
                    }
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={cn(
          "fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border text-white animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999]",
          toast.type === "error" ? "bg-destructive border-destructive" : "bg-green-600 border-green-600"
        )}>
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {/* Hidden ticket render zone */}
      <div className="absolute -left-[9999px] top-0 pointer-events-none" aria-hidden="true">
        {ticketsToRender.map((tData, index) => {
          const design = (event.ticketDesign ?? TICKET_TEMPLATES.classicDark) as TicketDesign
          return (
            <div
              key={index}
              id={`render-ticket-${index}`}
              className="relative overflow-hidden"
              style={{ width: 360, height: 640, backgroundColor: design.bgColor ?? "#000" }}
            >
              {/* Background image — object-contain so it doesn't crop */}
              {design.bgImage && (
                <>
                  <div className="absolute inset-0 z-0 flex items-center justify-center">
                    <img
                      src={design.bgImage}
                      crossOrigin="anonymous"
                      className="w-full h-full"
                      style={{
                        objectFit: "contain",
                        transform: `scale(${(design.bgScale ?? 100) / 100}) translate(${design.bgOffsetX ?? 0}px, ${design.bgOffsetY ?? 0}px)`,
                      }}
                      alt=""
                    />
                  </div>
                  <div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${design.bgOverlay ?? 0})` }} />
                </>
              )}

              {/* Elements */}
              <div className="absolute inset-0 z-20">
                {design.elements?.map((el) => (
                  <div
                    key={el.id}
                    className="absolute flex flex-col"
                    style={{
                      left: el.x, top: el.y,
                      color: el.color, fontSize: el.fontSize,
                      fontWeight: el.fontWeight, fontFamily: el.fontFamily,
                      width:  el.width  || (el.type === "qr" ? el.fontSize : "auto"),
                      height: el.height || (el.type === "qr" ? el.fontSize : "auto"),
                      textAlign: (el.textAlign as React.CSSProperties["textAlign"]) || "left",
                    }}
                  >
                    {el.type === "text" && <span className="leading-tight break-words px-1">{fillTags(el.content, tData)}</span>}
                    {el.type === "qr" && (
                      <div className="w-full h-full flex items-center justify-center p-3">
                        <QRCodeSVG
                          value={tData.qrData ?? "TICKET"}
                          size={el.width ? el.width - 24 : el.fontSize - 24}
                          level="H"
                          bgColor="transparent"
                          fgColor={el.color || "#ffffff"}
                        />
                      </div>
                    )}
                    {el.type === "image" && el.src && <img src={el.src} alt="" crossOrigin="anonymous" className="w-full h-full object-contain" />}
                  </div>
                ))}
              </div>

              {/* Footer watermark */}
              <div className="absolute bottom-0 left-0 right-0 h-[50px] flex items-center justify-center z-50 border-t border-white/5" style={{ backgroundColor: "rgba(0,0,0,0.7)", WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
                <div className="flex items-center gap-2.5 opacity-60">
                  <Ticket className="h-5 w-5 text-white/90" />
                  <span className="font-medium tracking-[0.3em] text-[11px] mt-0.5 uppercase text-white/90">eticksystem.com</span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}