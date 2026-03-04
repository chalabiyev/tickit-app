"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DollarSign, Ticket, Eye, CalendarDays, TrendingUp, Loader2 } from "lucide-react"
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from "recharts"
import { cn } from "@/lib/utils"

export function DashboardView() {
  const { locale } = useLocale()
  const [data, setData] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchGlobalStats = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        const response = await fetch("http://localhost:8080/api/v1/events/stats/global", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const result = await response.json()
        setData(result)
      } catch (error) {
        console.error("Dashboard error:", error)
      } finally {
        setIsLoading(false)
      }
    }
    fetchGlobalStats()
  }, [])

  if (isLoading) return (
    <div className="flex h-[400px] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )

  const stats = [
    {
      label: t(locale, "totalRevenue"),
      value: `${data?.totalRevenue?.toLocaleString() || 0} ₼`,
      change: "+12.5%", // В будущем можно считать динамику
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t(locale, "ticketsSold"),
      value: data?.totalSold?.toLocaleString() || "0",
      change: "+8.2%",
      icon: Ticket,
      color: "text-blue-500",
      bgColor: "bg-blue-500/10",
    },
    {
      label: t(locale, "totalViews"),
      value: data?.totalViews >= 1000 ? `${(data.totalViews / 1000).toFixed(1)}K` : (data?.totalViews || 0),
      change: "+24.1%",
      icon: Eye,
      color: "text-purple-500",
      bgColor: "bg-purple-500/10",
    },
    {
      label: t(locale, "activeEvents"),
      value: data?.activeEvents || "0",
      change: "Aktiv",
      icon: CalendarDays,
      color: "text-orange-500",
      bgColor: "bg-orange-500/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-black tracking-tight text-foreground">
                      {stat.value}
                    </span>
                    <div className="flex items-center gap-1 text-[10px] font-bold">
                      <TrendingUp className="h-3 w-3 text-primary" />
                      <span className="text-primary">{stat.change}</span>
                    </div>
                  </div>
                  <div className={cn("flex h-12 w-12 items-center justify-center rounded-2xl", stat.bgColor)}>
                    <Icon className={cn("h-6 w-6", stat.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/50 shadow-sm bg-card/50 backdrop-blur-sm overflow-hidden">
        <CardHeader className="pb-2 border-b border-border/40 mb-4">
          <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
            {t(locale, "salesOverview")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[340px] w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesHistory || []} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="oklch(0.55 0.2 260)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border/50" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  className="fill-muted-foreground" 
                  axisLine={false} 
                  tickLine={false} 
                />
                <YAxis 
                  tick={{ fontSize: 10, fontWeight: 'bold' }} 
                  className="fill-muted-foreground" 
                  axisLine={false} 
                  tickLine={false} 
                  tickFormatter={(val) => `${val}`}
                />
                <Tooltip
                  contentStyle={{ borderRadius: "16px", border: "1px solid oklch(0.55 0.2 260 / 0.2)", backgroundColor: "var(--card)", fontSize: "12px", fontWeight: "bold" }}
                />
                <Area 
                  type="monotone" 
                  dataKey="amount" // В DTO SalesHistoryData это поле для количества
                  name={t(locale, "ticketsSold")}
                  stroke="oklch(0.55 0.2 260)" 
                  strokeWidth={4} 
                  fill="url(#revenueGrad)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}