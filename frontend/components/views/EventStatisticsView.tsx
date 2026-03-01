"use client"

import { useState, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  ArrowLeft,
  DollarSign,
  Ticket,
  Eye,
  TrendingUp,
  Download,
  ArrowUpRight,
  Loader2
} from "lucide-react"
import { cn } from "@/lib/utils"

export interface EventData {
  id: string | number 
  name: string
  date: string
  location: string
  sold: number
  total: number
  status: "active" | "pending" | "past"
  image: string
}

interface EventStatisticsViewProps {
  event: EventData
  onBack: () => void
}

export function EventStatisticsView({ event, onBack }: EventStatisticsViewProps) {
  const { locale } = useLocale()
  
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Фейковые данные для графика продаж (позже тоже подключим к бэку)
  const mockChartData = [
    { day: "B.e", sales: 12 },
    { day: "Ç.a", sales: 18 },
    { day: "Çər", sales: 45 },
    { day: "C.a", sales: 30 },
    { day: "Cüm", sales: 65 },
    { day: "Şən", sales: 85 },
    { day: "Bazar", sales: Math.max(event.sold, 10) }, // Немного динамики
  ]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        const response = await fetch(`http://localhost:8080/api/v1/events/${event.id}/statistics`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!response.ok) throw new Error("Failed to load stats")
        const data = await response.json()
        setStats(data)
      } catch (error) {
        console.error("Error fetching statistics:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStats()
  }, [event.id])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium text-sm">Statistika yüklənir...</p>
      </div>
    )
  }

  if (!stats) return null;

  const maxSales = Math.max(...mockChartData.map(d => d.sales))
  const fillPercentage = stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0

  return (
    <div className="flex flex-col gap-6 relative animate-in fade-in duration-300 pb-10">
      
      {/* Шапка */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">Statistika</h1>
            <p className="text-sm text-muted-foreground font-medium line-clamp-1">{event.name}</p>
          </div>
        </div>
        <Button variant="outline" className="gap-2 font-bold shadow-sm rounded-xl px-6 bg-background">
          <Download className="h-4 w-4" /> Hesabatı Yüklə (CSV)
        </Button>
      </div>

      {/* 4 ГЛАВНЫЕ КАРТОЧКИ (KPI) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Доход */}
        <Card className="border-border/50 shadow-sm bg-card/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Ümumi Gəlir</span>
                <span className="text-3xl font-black text-foreground">{stats.revenue.toLocaleString()} ₼</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Билеты */}
        <Card className="border-border/50 shadow-sm bg-card/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Satılmış Biletlər</span>
                <span className="text-3xl font-black text-foreground">{stats.sold} <span className="text-lg text-muted-foreground font-semibold">/ {stats.total}</span></span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-blue-500" />
              </div>
            </div>
            <Progress value={fillPercentage} className="h-2 mt-4 bg-secondary/60" />
            <p className="text-xs text-muted-foreground mt-2 font-medium">Zalın {fillPercentage}%-i dolub</p>
          </CardContent>
        </Card>

        {/* Просмотры */}
        <Card className="border-border/50 shadow-sm bg-card/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Səhifə Baxışları</span>
                <span className="text-3xl font-black text-foreground">{stats.views.toLocaleString()}</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
                <Eye className="h-6 w-6 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Конверсия */}
        <Card className="border-border/50 shadow-sm bg-card/50 hover:border-primary/30 transition-colors">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <span className="text-sm font-semibold text-muted-foreground">Konversiya</span>
                <span className="text-3xl font-black text-foreground">{stats.conversionRate}%</span>
              </div>
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ГРАФИК ПРОДАЖ */}
        <Card className="border-border/50 shadow-sm bg-card/50 lg:col-span-2">
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-lg">Satış Qrafiki (Son 7 gün)</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="flex items-end justify-between h-[250px] gap-2 pt-4">
              {mockChartData.map((data, i) => {
                const heightPercentage = maxSales > 0 ? (data.sales / maxSales) * 100 : 0;
                return (
                  <div key={i} className="flex flex-col items-center gap-3 flex-1 group">
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background text-xs font-bold py-1 px-2 rounded-md mb-1 shadow-lg">
                      {data.sales} bilet
                    </div>
                    <div className="w-full max-w-[40px] bg-secondary/50 rounded-t-md relative overflow-hidden h-full flex items-end justify-center group-hover:bg-secondary/70 transition-colors cursor-pointer">
                      <div 
                        className="w-full bg-primary rounded-t-md transition-all duration-700 ease-out"
                        style={{ height: `${heightPercentage}%` }}
                      >
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-muted-foreground">{data.day}</span>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>

        {/* ТИПЫ БИЛЕТОВ (Пока заглушка, так как нужны сложные агрегации) */}
        <Card className="border-border/50 shadow-sm bg-card/50">
          <CardHeader className="pb-2 border-b border-border/50">
            <CardTitle className="text-lg">Bilet Növləri</CardTitle>
          </CardHeader>
          <CardContent className="p-6 flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <div className="flex justify-between items-center text-sm">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div> Standart
                </span>
                <span className="font-bold">{stats.sold > 0 ? stats.sold : 0} satılıb</span>
              </div>
              <Progress value={stats.sold > 0 ? 100 : 0} className="h-2 [&>div]:bg-blue-500 bg-blue-500/10" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* РЕАЛЬНАЯ ТАБЛИЦА ПОСЛЕДНИХ ЗАКАЗОВ */}
      <Card className="border-border/50 shadow-sm bg-card/50">
        <CardHeader className="pb-4 border-b border-border/50 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Son Sifarişlər</CardTitle>
          <Button variant="link" className="text-primary p-0 h-auto">Hamısına bax</Button>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow className="border-border/50 hover:bg-transparent">
                <TableHead className="font-semibold text-muted-foreground w-[120px] pl-6">Sifariş ID</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Müştəri</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Bilet Sayı</TableHead>
                <TableHead className="font-semibold text-muted-foreground">Tarix</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-right">Məbləğ</TableHead>
                <TableHead className="font-semibold text-muted-foreground text-center pr-6">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stats.recentOrders && stats.recentOrders.length > 0 ? (
                stats.recentOrders.map((order: any) => (
                  <TableRow key={order.id} className="border-border/50 hover:bg-secondary/30 transition-colors cursor-pointer">
                    <TableCell className="font-medium text-foreground pl-6">#{order.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-foreground text-sm">{order.customer}</span>
                        <span className="text-xs text-muted-foreground">{order.email}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-background font-semibold">
                        {order.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground font-medium">{order.date}</TableCell>
                    <TableCell className="text-right font-black text-foreground">{order.amount} ₼</TableCell>
                    <TableCell className="text-center pr-6">
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "font-bold shadow-sm",
                          order.status === "success" ? "bg-green-500/10 text-green-500 hover:bg-green-500/20" : "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20"
                        )}
                      >
                        {order.status === "success" ? "Ödənilib" : "Gözləyir"}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground font-medium">
                    Hələ heç bir sifariş yoxdur.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}