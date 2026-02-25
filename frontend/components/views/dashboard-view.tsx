"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  DollarSign,
  Ticket,
  Eye,
  CalendarDays,
  TrendingUp,
} from "lucide-react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

const chartData = [
  { month: "jan", revenue: 4200, tickets: 120 },
  { month: "feb", revenue: 5800, tickets: 180 },
  { month: "mar", revenue: 4600, tickets: 140 },
  { month: "apr", revenue: 7200, tickets: 220 },
  { month: "may", revenue: 8400, tickets: 290 },
  { month: "jun", revenue: 9100, tickets: 340 },
  { month: "jul", revenue: 7800, tickets: 280 },
  { month: "aug", revenue: 10200, tickets: 380 },
  { month: "sep", revenue: 11500, tickets: 420 },
  { month: "oct", revenue: 9800, tickets: 350 },
  { month: "nov", revenue: 12400, tickets: 460 },
  { month: "dec", revenue: 14800, tickets: 520 },
]

export function DashboardView() {
  const { locale } = useLocale()

  const localizedChartData = chartData.map((d) => ({
    ...d,
    name: t(locale, d.month),
  }))

  const stats = [
    {
      label: t(locale, "totalRevenue"),
      value: "$114,800",
      change: "+12.5%",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t(locale, "ticketsSold"),
      value: "3,700",
      change: "+8.2%",
      icon: Ticket,
      color: "text-success",
      bgColor: "bg-success/10",
    },
    {
      label: t(locale, "totalViews"),
      value: "48.2K",
      change: "+24.1%",
      icon: Eye,
      color: "text-chart-2",
      bgColor: "bg-chart-2/10",
    },
    {
      label: t(locale, "activeEvents"),
      value: "12",
      change: "+3",
      icon: CalendarDays,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <Card key={stat.label} className="border-border/50 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm text-muted-foreground">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-bold tracking-tight text-foreground">
                      {stat.value}
                    </span>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="h-3 w-3 text-success" />
                      <span className="font-medium text-success">
                        {stat.change}
                      </span>
                    </div>
                  </div>
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${stat.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base font-semibold text-foreground">
            {t(locale, "salesOverview")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="h-[340px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={localizedChartData}
                margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop
                      offset="5%"
                      stopColor="oklch(0.55 0.2 260)"
                      stopOpacity={0.2}
                    />
                    <stop
                      offset="95%"
                      stopColor="oklch(0.55 0.2 260)"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground fill-muted-foreground"
                  stroke="currentColor"
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fontSize: 12 }}
                  className="text-muted-foreground fill-muted-foreground"
                  stroke="currentColor"
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value: number) => `$${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: "8px",
                    border: "1px solid var(--border)",
                    backgroundColor: "var(--card)",
                    color: "var(--card-foreground)",
                    fontSize: "13px",
                  }}
                  formatter={(value: number) => [`$${value.toLocaleString()}`, t(locale, "revenue")]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="oklch(0.55 0.2 260)"
                  strokeWidth={2}
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
