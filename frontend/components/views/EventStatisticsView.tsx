"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft, DollarSign, Ticket, Eye, TrendingUp, Download,
  Loader2, Info, Tag, ChevronDown, ChevronUp, AlertCircle, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { EventData } from "./AdminBookingModal"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

// ── Types ────────────────────────────────────────────────────────────────────
interface Order {
  id: string; customer: string; email: string
  promoCode?: string; type: number; date: string
  amount: number; originalAmount?: number
}
interface SalesDay { date: string; amount: number }
interface Stats {
  revenue: number; sold: number; total: number
  views: number; conversionRate: number
  recentOrders: Order[]; salesHistory: SalesDay[]
}
interface EventStatisticsViewProps {
  event: EventData
  onBack: () => void
  onNavigateToOrders?: () => void
}

// ── Error helper ──────────────────────────────────────────────────────────────
function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status !== undefined && status >= 500) return "errServer"
  return "errUnknown"
}

const AZ_DAYS = ["Baz", "B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən"]

// ── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ title, value, icon, sub, accent, progress }: {
  title: string; value: string | number; icon: React.ReactNode
  sub: string; accent: string; progress?: number
}) {
  return (
    <Card className="border-border/50 bg-card shadow-sm overflow-hidden" style={{ isolation: "isolate" }}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1">{title}</p>
            <p className="text-2xl font-black text-foreground tabular-nums">{value}</p>
          </div>
          <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center", accent)}>{icon}</div>
        </div>
        {progress !== undefined && (
          <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden mb-2">
            <div className="h-full bg-primary rounded-full transition-all duration-700" style={{ width: `${progress}%` }} />
          </div>
        )}
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium">
          <Info className="w-3 h-3 shrink-0" /> {sub}
        </p>
      </CardContent>
    </Card>
  )
}

// ── Bar Chart ─────────────────────────────────────────────────────────────────
function BarChart({ data }: { data: { day: string; val: number }[] }) {
  const maxVal = Math.max(...data.map((d) => d.val), 1)
  return (
    <div className="flex items-end justify-between gap-1.5 h-40">
      {data.map((d, i) => {
        const h = Math.max((d.val / maxVal) * 100, d.val > 0 ? 4 : 3)
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
            <div className="relative w-full flex justify-center">
              <span className="absolute -top-5 text-[10px] font-bold bg-foreground text-background px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                {d.val}
              </span>
              <div
                className={cn(
                  "w-full max-w-8 rounded-t-lg transition-all duration-500",
                  d.val > 0 ? "bg-primary shadow-[0_0_12px_rgba(var(--primary)/0.35)]" : "bg-secondary/50"
                )}
                style={{ height: `${h}%` }}
              />
            </div>
            <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.day}</span>
          </div>
        )
      })}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function EventStatisticsView({ event, onBack }: EventStatisticsViewProps) {
  const { locale }                                    = useLocale()
  const [stats, setStats]                             = useState<Stats | null>(null)
  const [isLoading, setIsLoading]                     = useState(true)
  const [errorKey, setErrorKey]                       = useState<string | null>(null)
  const [isDownloading, setIsDownloading]             = useState(false)
  const [downloadErrKey, setDownloadErrKey]           = useState<string | null>(null)
  const [isOrdersExpanded, setIsOrdersExpanded]       = useState(false)

  const fetchStats = () => {
    const controller = new AbortController()
    setIsLoading(true)
    setErrorKey(null)
    ;(async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) { setErrorKey("errUnauthorized"); setIsLoading(false); return }
        const res = await fetch(`${API_BASE}/api/v1/events/${event.id}/statistics`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setErrorKey(getErrKey(null, res)); return }
        setStats(await res.json())
      } catch (err) {
        if ((err as Error).name !== "AbortError") setErrorKey(getErrKey(err))
      } finally {
        setIsLoading(false)
      }
    })()
    return () => controller.abort()
  }

  useEffect(() => { fetchStats() }, [event.id])

  const handleDownloadPdf = async () => {
    setIsDownloading(true)
    setDownloadErrKey(null)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      if (!token) { setDownloadErrKey("errUnauthorized"); return }
      const res = await fetch(`${API_BASE}/api/v1/events/${event.id}/report/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setDownloadErrKey(getErrKey(null, res)); return }
      const blob = await res.blob()
      const url  = URL.createObjectURL(blob)
      const a    = Object.assign(document.createElement("a"), {
        href: url, download: `Hesabat_${(event.name ?? event.title ?? "event").replace(/\s+/g, "_")}.pdf`,
      })
      document.body.appendChild(a); a.click(); a.remove()
      URL.revokeObjectURL(url)
    } catch (err) {
      setDownloadErrKey(getErrKey(err))
    } finally {
      setIsDownloading(false)
    }
  }

  // ── Loading ──
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm font-medium">{t(locale, "statisticsLoading")}</p>
    </div>
  )

  // ── Error ──
  if (errorKey) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, errorKey)}</p>
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2 rounded-xl font-bold" onClick={fetchStats}>
          <RefreshCw className="h-4 w-4" /> {t(locale, "tryAgain") || "Yenidən cəhd et"}
        </Button>
        <Button variant="ghost" className="gap-2 rounded-xl font-bold" onClick={onBack}>
          <ArrowLeft className="h-4 w-4" /> {t(locale, "back")}
        </Button>
      </div>
    </div>
  )

  if (!stats) return null

  // Chart data (last 7 days)
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d   = new Date(); d.setDate(d.getDate() - (6 - i))
    const key = `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}`
    const hist = stats.salesHistory?.find((s) => s.date === key)
    return { day: AZ_DAYS[d.getDay()], val: hist?.amount ?? 0 }
  })

  const fillPct = stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0
  const orders  = stats.recentOrders ?? []
  const shown   = isOrdersExpanded ? orders : orders.slice(0, 5)

  const kpis = [
    { title: t(locale, "kpiRevenue"),    value: `${stats.revenue} ₼`,            icon: <DollarSign className="h-5 w-5" />, sub: t(locale, "kpiRevenueNote"),    accent: "bg-primary/10 text-primary" },
    { title: t(locale, "kpiTickets"),    value: `${stats.sold} / ${stats.total}`, icon: <Ticket className="h-5 w-5" />,    sub: `${t(locale, "fillRate") || "Zalın"} ${fillPct}%`, accent: "bg-blue-500/10 text-blue-500", progress: fillPct },
    { title: t(locale, "totalViews"),    value: stats.views ?? 0,                 icon: <Eye className="h-5 w-5" />,       sub: t(locale, "kpiViewsNote"),      accent: "bg-violet-500/10 text-violet-500" },
    { title: t(locale, "kpiConversion"), value: `${stats.conversionRate ?? 0}%`,  icon: <TrendingUp className="h-5 w-5" />,sub: t(locale, "kpiConversionNote"), accent: "bg-amber-500/10 text-amber-500" },
  ]

  return (
    <div className="flex flex-col gap-5 pb-10 animate-in fade-in duration-300">

      {/* Header */}
      <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <Button variant="secondary" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0">
            <h1 className="text-base font-bold text-foreground">{t(locale, "statistics")}</h1>
            <p className="text-xs text-muted-foreground truncate">{event.name ?? event.title}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1">
          <Button
            variant="outline"
            className="gap-2 font-bold rounded-xl shrink-0"
            onClick={handleDownloadPdf}
            disabled={isDownloading}
          >
            {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            <span className="hidden sm:inline">{isDownloading ? (t(locale, "uploading") || "Yüklənir...") : "PDF"}</span>
          </Button>
          {/* PDF download error — inline under button */}
          {downloadErrKey && (
            <p className="text-[10px] text-destructive font-semibold max-w-[160px] text-right">
              {t(locale, downloadErrKey)}
            </p>
          )}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.title} {...k} />)}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <Card className="lg:col-span-2 border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold text-foreground">
              {t(locale, "salesOverview") || "Satış Qrafiki"} ({t(locale, "last7days") || "Son 7 gün"})
            </CardTitle>
          </CardHeader>
          <CardContent className="px-5 pb-5">
            <BarChart data={chartData} />
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card shadow-sm">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-bold">{t(locale, "ticketTypesTitle")}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex items-center justify-between text-sm font-bold">
              <span className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                {t(locale, "standardTicket")}
              </span>
              <span className="tabular-nums text-muted-foreground">{stats.sold} {t(locale, "sold") || "satılıb"}</span>
            </div>
            <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full bg-primary rounded-full w-full" />
            </div>
            {stats.sold > 0 && (
              <p className="text-xs text-muted-foreground">{fillPct}% {t(locale, "fillRate") || "dolulluq nisbəti"}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Orders table */}
      <Card className="border-border/50 bg-card shadow-sm overflow-hidden" style={{ isolation: "isolate" }}>
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 py-4 px-5">
          <CardTitle className="text-sm font-bold">{t(locale, "recentOrders") || "Son Sifarişlər"}</CardTitle>
          {orders.length > 5 && (
            <button
              onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
              className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              {isOrdersExpanded
                ? <><ChevronUp className="h-3.5 w-3.5" /> {t(locale, "hide")}</>
                : <><ChevronDown className="h-3.5 w-3.5" /> {t(locale, "showAll")} ({orders.length})</>
              }
            </button>
          )}
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary/20 hover:bg-secondary/20">
                {[
                  { label: "ID",                           align: "pl-5 text-left" },
                  { label: t(locale, "orderCustomer"),     align: "text-left" },
                  { label: t(locale, "orderPromo"),        align: "text-left" },
                  { label: t(locale, "orderQty"),          align: "text-left" },
                  { label: t(locale, "date"),              align: "text-left" },
                  { label: t(locale, "orderAmount"),       align: "pr-5 text-right" },
                ].map(({ label, align }) => (
                  <TableHead key={label} className={cn("text-[10px] font-bold uppercase tracking-widest", align)}>
                    {label}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {shown.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-sm text-muted-foreground font-medium">
                    {t(locale, "noResults") || "Hələ heç bir sifariş yoxdur."}
                  </TableCell>
                </TableRow>
              ) : (
                shown.map((o) => (
                  <TableRow key={o.id} className="hover:bg-secondary/20 transition-colors">
                    <TableCell className="pl-5 font-bold text-xs text-muted-foreground">#{o.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground">{o.customer}</span>
                        <span className="text-[10px] text-muted-foreground">{o.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {o.promoCode ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                          <Tag className="h-2.5 w-2.5" /> {o.promoCode}
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/40">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-[10px] font-bold">
                        {o.type} {t(locale, "pcs") || "ədəd"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-[10px] text-muted-foreground font-medium">{o.date}</TableCell>
                    <TableCell className="pr-5 text-right">
                      <div className="flex flex-col items-end">
                        {o.originalAmount && o.originalAmount > o.amount && (
                          <span className="text-[9px] line-through text-muted-foreground/40 font-bold tabular-nums">
                            {o.originalAmount} ₼
                          </span>
                        )}
                        <span className="text-xs font-black text-foreground tabular-nums">{o.amount} ₼</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  )
}