"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Ticket, Eye, CalendarDays, TrendingUp, Loader2, ArrowUpRight, AlertCircle, RefreshCw } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

interface SalesHistoryPoint { date: string; amount: number }
interface GlobalStats {
  totalRevenue: number
  totalSold: number
  totalViews: number
  activeEvents: number
  salesHistory: SalesHistoryPoint[]
}

function formatViews(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n)
}

const STAT_CONFIG = [
  { key: "totalRevenue",  icon: DollarSign,   accent: "text-primary",       bg: "bg-primary/10",     change: "+12.5%" },
  { key: "ticketsSold",   icon: Ticket,       accent: "text-cyan-500",      bg: "bg-cyan-500/10",    change: "+8.2%"  },
  { key: "totalViews",    icon: Eye,          accent: "text-violet-500",    bg: "bg-violet-500/10",  change: "+24.1%" },
  { key: "activeEvents",  icon: CalendarDays, accent: "text-amber-500",     bg: "bg-amber-500/10",   change: "Aktiv"  },
] as const

const TOKEN_KEY = "eticksystem_token"

function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status !== undefined && status >= 500) return "errServer"
  return "errUnknown"
}

export function DashboardView() {
  const { locale }                = useLocale()
  const [data, setData]           = useState<GlobalStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [errorKey, setErrorKey]   = useState<string | null>(null)

  const fetchStats = () => {
    const controller = new AbortController()
    setIsLoading(true)
    setErrorKey(null)
    ;(async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) { setErrorKey("errUnauthorized"); setIsLoading(false); return }
        const res = await fetch(`${API_BASE}/api/v1/events/stats/global`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setErrorKey(getErrKey(null, res)); return }
        setData(await res.json())
      } catch (err) {
        if ((err as Error).name !== "AbortError") setErrorKey(getErrKey(err))
      } finally { setIsLoading(false) }
    })()
    return () => controller.abort()
  }

  useEffect(() => { fetchStats() }, [])

  if (isLoading) return (
    <div className="flex h-[400px] items-center justify-center" role="status">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  if (errorKey) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, errorKey)}</p>
      <button onClick={fetchStats} className="flex items-center gap-2 text-sm font-bold text-primary hover:underline">
        <RefreshCw className="h-4 w-4" /> {t(locale, "tryAgain") || "Yenidən cəhd et"}
      </button>
    </div>
  )

  const statValues = [
    `${data?.totalRevenue?.toLocaleString() ?? 0} ₼`,
    data?.totalSold?.toLocaleString() ?? "0",
    formatViews(data?.totalViews ?? 0),
    String(data?.activeEvents ?? 0),
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {STAT_CONFIG.map(({ key, icon: Icon, accent, bg, change }, i) => (
          <Card key={key} className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className={cn("flex h-11 w-11 items-center justify-center rounded-[14px]", bg)}>
                  <Icon className={cn("h-5 w-5", accent)} />
                </div>
                <div className={cn("flex items-center gap-1 text-[10px] font-bold px-2.5 py-1 rounded-full", bg, accent)}>
                  <TrendingUp className="h-2.5 w-2.5" />
                  {change}
                </div>
              </div>
              <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                {t(locale, key)}
              </p>
              <p className="text-2xl font-black tracking-tight text-foreground">{statValues[i]}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
        <CardHeader className="pb-4 border-b border-border/40">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground mb-1.5">
                {t(locale, "salesOverview")}
              </CardTitle>
              <p className="text-2xl font-black text-foreground">
                {data?.totalRevenue?.toLocaleString() ?? 0}
                <span className="text-primary ml-1">₼</span>
              </p>
            </div>
            <button className="flex items-center gap-1.5 text-[11px] font-bold px-3.5 py-2 rounded-xl border border-border/50 text-muted-foreground hover:text-foreground hover:border-border transition-colors">
              Son 30 gün <ArrowUpRight className="h-3 w-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent className="pt-4">
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesHistory ?? []} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="blueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0}   />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  className="fill-muted-foreground"
                  axisLine={false} tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 10, fontWeight: 700 }}
                  className="fill-muted-foreground"
                  axisLine={false} tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "14px",
                    border: "1px solid hsl(var(--border))",
                    backgroundColor: "hsl(var(--card))",
                    color: "hsl(var(--foreground))",
                    fontSize: "12px",
                    fontWeight: 700,
                    boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                  }}
                  cursor={{ stroke: "hsl(var(--primary) / 0.2)", strokeWidth: 1 }}
                />
                <Area
                  type="monotone"
                  dataKey="amount"
                  name={t(locale, "ticketsSold")}
                  stroke="hsl(var(--primary))"
                  strokeWidth={3}
                  fill="url(#blueGrad)"
                  dot={false}
                  activeDot={{ r: 5, strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}