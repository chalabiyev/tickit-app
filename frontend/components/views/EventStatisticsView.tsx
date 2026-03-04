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
  Loader2,
  Info,
  Tag,
  ChevronDown,
  ChevronUp
} from "lucide-react"
import { cn } from "@/lib/utils"

interface EventStatisticsViewProps {
  event: any
  onBack: () => void
  onNavigateToOrders?: () => void
}

export function EventStatisticsView({ event, onBack, onNavigateToOrders }: EventStatisticsViewProps) {
  const { locale } = useLocale()
  const [stats, setStats] = useState<any>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isDownloading, setIsDownloading] = useState(false)
  
  // Состояние для раскрытия списка заказов
  const [isOrdersExpanded, setIsOrdersExpanded] = useState(false)

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
        console.error("Error:", error)
        setStats({ revenue: 0, sold: 0, total: 100, views: 0, recentOrders: [], salesHistory: [] })
      } finally {
        setIsLoading(false)
      }
    }
    fetchStats()
  }, [event.id])

  // ИСПРАВЛЕННАЯ ФУНКЦИЯ СКАЧИВАНИЯ PDF С ТОКЕНОМ
  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      const token = localStorage.getItem("tickit_token");
      const response = await fetch(`http://localhost:8080/api/v1/events/${event.id}/report/pdf`, {
        method: 'GET',
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error("Yükləmək mümkün olmadı");

      // Конвертируем ответ в Blob (файл)
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      // Создаем невидимую ссылку и кликаем по ней
      const a = document.createElement('a');
      a.href = url;
      a.download = `Hesabat_${event.name.replace(/\s+/g, '_')}.pdf`; // Красивое имя файла
      document.body.appendChild(a);
      a.click();
      
      // Подчищаем за собой
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      alert("PDF yüklənərkən xəta baş verdi.");
    } finally {
      setIsDownloading(false);
    }
  }

  if (isLoading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>
  if (!stats) return null;

  const daysMap = ["Baz", "B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şən"];
  const chartData = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = daysMap[d.getDay()];
    const dateKey = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const backendData = stats.salesHistory?.find((sh: any) => sh.date === dateKey);
    return { 
      day: dayName, 
      val: backendData ? backendData.amount : 0, 
      dateKey: dateKey 
    };
  });

  const maxVal = Math.max(...chartData.map(d => d.val), 1);
  const fillPercentage = stats.total > 0 ? Math.round((stats.sold / stats.total) * 100) : 0;

  // ЛОГИКА ОТОБРАЖЕНИЯ ЗАКАЗОВ (Разворачиваем/Сворачиваем)
  const orders = stats.recentOrders || [];
  const displayedOrders = isOrdersExpanded ? orders : orders.slice(0, 5);

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300 pb-10">
      
      <div className="flex items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/50">
        <div className="flex items-center gap-4">
          <Button variant="secondary" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <div>
            <h1 className="text-xl font-bold">Statistika</h1>
            <p className="text-sm text-muted-foreground">{event.name}</p>
          </div>
        </div>
        
        {/* ИЗМЕНЕНА КНОПКА СКАЧИВАНИЯ */}
        <Button 
          variant="outline" 
          className="gap-2 font-bold" 
          onClick={handleDownloadPdf}
          disabled={isDownloading}
        >
          {isDownloading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          {isDownloading ? "Yüklənir..." : "PDF Yüklə"}
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="Ümumi Gəlir" value={`${stats.revenue} ₼`} icon={<DollarSign />} sub="Komissiya daxil" color="text-primary" />
        <KpiCard title="Satılmış Biletlər" value={`${stats.sold} / ${stats.total}`} icon={<Ticket />} sub={`Zalın ${fillPercentage}%-i dolub`} color="text-blue-500" progress={fillPercentage} />
        <KpiCard title="Baxışlar" value={stats.views || 0} icon={<Eye />} sub="Unikal girişlər" color="text-purple-500" />
        <KpiCard title="Konversiya" value={`${stats.conversionRate || 0}%`} icon={<TrendingUp />} sub="Baxış vs Satış" color="text-orange-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-lg">Satış Qrafiki (Son 7 gün)</CardTitle></CardHeader>
          <CardContent className="h-[250px] flex items-end justify-between gap-2 pt-4">
            {chartData.map((d, i) => {
              const heightPct = (d.val / maxVal) * 100;
              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                  <div className="text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-foreground text-background px-2 py-1 rounded">
                     {d.val} bilet
                  </div>
                  <div 
                    className={cn("w-full max-w-[32px] rounded-t-lg transition-all duration-500", d.val > 0 ? "bg-primary shadow-[0_0_15px_rgba(59,130,246,0.5)]" : "bg-primary/10")} 
                    style={{ height: `${heightPct > 0 ? heightPct : 5}%` }}
                  />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase">{d.day}</span>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card className="border-border/50 bg-card/50">
          <CardHeader><CardTitle className="text-lg">Bilet Növləri</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="flex justify-between items-center text-sm font-bold">
              <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-blue-500" /> Standart</span>
              <span>{stats.sold} satılıb</span>
            </div>
            <Progress value={100} className="h-1.5 [&>div]:bg-blue-500" />
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 pb-4">
          <CardTitle className="text-lg">Son Sifarişlər</CardTitle>
          
          {/* ИЗМЕНЕНА КНОПКА РАСКРЫТИЯ СПИСКА */}
          {orders.length > 5 && (
            <Button 
              variant="ghost" 
              className="text-primary font-bold gap-1 text-xs" 
              onClick={() => setIsOrdersExpanded(!isOrdersExpanded)}
            >
              {isOrdersExpanded ? (
                <>Gizlət <ChevronUp className="w-4 h-4" /></>
              ) : (
                <>Hamısına bax ({orders.length}) <ChevronDown className="w-4 h-4" /></>
              )}
            </Button>
          )}

        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <Table>
            <TableHeader className="bg-secondary/20">
              <TableRow>
                <TableHead className="pl-6">ID</TableHead>
                <TableHead>Müştəri</TableHead>
                <TableHead>Promo-kod</TableHead>
                <TableHead>Say</TableHead>
                <TableHead>Tarix</TableHead>
                <TableHead className="text-right pr-6">Məbləğ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* РЕНДЕРИМ ТОЛЬКО displayedOrders */}
              {displayedOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-10 text-muted-foreground text-sm font-medium">
                    Hələ heç bir sifariş yoxdur.
                  </TableCell>
                </TableRow>
              ) : (
                displayedOrders.map((o: any) => (
                  <TableRow key={o.id} className="hover:bg-primary/5 transition-colors">
                    <TableCell className="pl-6 font-bold">#{o.id}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-xs">{o.customer}</span>
                        <span className="text-[10px] text-muted-foreground">{o.email}</span>
                      </div>
                    </TableCell>
                    
                    <TableCell>
                      {o.promoCode ? (
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 gap-1 px-1.5 h-6 text-[9px] font-black uppercase">
                          <Tag className="w-2.5 h-2.5" /> {o.promoCode}
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-muted-foreground opacity-40">—</span>
                      )}
                    </TableCell>

                    <TableCell><Badge variant="secondary" className="text-[10px] font-bold">{o.type} ədəd</Badge></TableCell>
                    <TableCell className="text-[10px] font-medium">{o.date}</TableCell>
                    
                    <TableCell className="text-right pr-6">
                      <div className="flex flex-col items-end">
                        {o.originalAmount && o.originalAmount > o.amount && (
                          <span className="text-[9px] line-through text-muted-foreground opacity-50 font-bold">
                            {o.originalAmount} ₼
                          </span>
                        )}
                        <span className="font-black text-xs text-foreground">
                          {o.amount} ₼
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}

function KpiCard({ title, value, icon, sub, color, progress }: any) {
  return (
    <Card className="border-border/50 bg-card/50 overflow-hidden relative">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{title}</span>
            <span className="text-2xl font-black">{value}</span>
          </div>
          <div className={cn("h-10 w-10 rounded-xl bg-secondary flex items-center justify-center", color)}>{icon}</div>
        </div>
        {progress !== undefined && <Progress value={progress} className="h-1 mb-2 bg-secondary" />}
        <p className="text-[10px] text-muted-foreground flex items-center gap-1 font-medium"><Info className="w-3 h-3" /> {sub}</p>
      </CardContent>
    </Card>
  )
}