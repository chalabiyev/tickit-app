"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Tag, X, Loader2, Calendar, Trash2, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function PromocodesView() {
  const { locale } = useLocale()
  const activeLocale = (locale || 'az') as any

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const [promocodes, setPromocodes] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoadingData, setIsLoadingData] = useState(true)

  const [newCode, setNewCode] = useState("")
  const [discountType, setDiscountType] = useState("PERCENTAGE")
  const [discountValue, setDiscountValue] = useState("")
  const [limit, setLimit] = useState("")
  const [expiryDate, setExpiryDate] = useState("")
  const [selectedEventId, setSelectedEventId] = useState<string>("all")
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([])

  const fetchData = useCallback(async () => {
    const token = localStorage.getItem("tickit_token")
    if (!token) return;
    const headers = { "Authorization": `Bearer ${token}` }
    
    try {
      const [promoRes, eventRes] = await Promise.all([
        fetch("http://72.60.135.9:8080/api/v1/promocodes/me", { headers }),
        fetch("http://72.60.135.9:8080/api/v1/events/me", { headers })
      ]);

      if (promoRes.ok) setPromocodes(await promoRes.json())

      if (eventRes.ok) {
        const allEvents = await eventRes.json()
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        // --- ЛОГИКА СИНХРОНИЗАЦИИ С ГЛАВНЫМ ЭКРАНОМ ---
        const activeEvents = allEvents.filter((ev: any) => {
          // 1. Убираем удаленные
          if (ev.deleted) return false;

          // 2. Только опубликованные
          if (ev.status !== "PUBLISHED") return false;

          // 3. Проверка даты (чтобы не было прошедших)
          if (ev.eventDate) {
            // Превращаем "08.03.2026" в "2026-03-08" для корректного Date
            const dateStr = ev.eventDate.includes('.') 
              ? ev.eventDate.split('.').reverse().join('-') 
              : ev.eventDate;
            
            const evDate = new Date(dateStr);
            evDate.setHours(0, 0, 0, 0);

            // Если дата ивента меньше сегодняшней — в список выбора не пускаем
            if (evDate.getTime() < today.getTime()) return false;
          }

          return true;
        })
        
        setEvents(activeEvents)
      }
    } catch (e) {
      console.error("Fetch error:", e)
    } finally {
      setIsLoadingData(false)
    }
  }, []);

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    if (!newCode || !discountValue || !limit) return alert("Bütün xanaları doldurun")
    
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem("tickit_token")
      const response = await fetch("http://72.60.135.9:8080/api/v1/promocodes", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          code: newCode.trim().toUpperCase(),
          type: discountType,
          value: parseFloat(discountValue),
          usageLimit: parseInt(limit),
          eventId: selectedEventId === "all" ? null : selectedEventId,
          applicableTierIds: selectedTierIds.length > 0 ? selectedTierIds : null,
          expiresAt: expiryDate ? `${expiryDate}T23:59:59` : null
        })
      })

      if (response.ok) {
        setIsModalOpen(false)
        fetchData()
        setNewCode(""); setDiscountValue(""); setLimit(""); setExpiryDate("");
      }
    } catch (e) { alert("Xəta!") } 
    finally { setIsSubmitting(false) }
  }

  const handleConfirmDelete = async () => {
    if (!promoToDelete) return;
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("tickit_token")
      const res = await fetch(`http://72.60.135.9:8080/api/v1/promocodes/${promoToDelete}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })
      if (res.ok) {
        setPromocodes(prev => prev.filter(p => p.id !== promoToDelete))
        setPromoToDelete(null)
      }
    } catch (e) { 
      console.error(e) 
    } finally {
      setIsDeleting(false)
    }
  }

  const availableTiers = selectedEventId !== "all" 
    ? events.find(e => e.id === selectedEventId)?.tiers || [] 
    : []

  if (isLoadingData) return <div className="flex h-40 items-center justify-center"><Loader2 className="animate-spin" /></div>

  return (
    <div className="flex flex-col gap-6 relative">
      <div className="flex items-center justify-end">
        <Button size="sm" className="gap-1.5 rounded-xl px-5 font-bold" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          {t(activeLocale, "createCode") || "Yeni promo-kod"}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {promocodes.length > 0 ? (
          promocodes.map((promo) => (
            <PromoCard 
              key={promo.id} 
              promo={promo} 
              events={events} 
              locale={activeLocale} 
              onDeleteRequest={() => setPromoToDelete(promo.id)} 
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center text-muted-foreground border-2 border-dashed rounded-3xl bg-secondary/5 font-medium">
             Hələ ki, promo-kod yaradılmayıb.
          </div>
        )}
      </div>

      {promoToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/60 backdrop-blur-md p-4">
          <Card className="w-full max-w-sm shadow-2xl border-destructive/20 animate-in zoom-in-95">
            <CardContent className="p-6 flex flex-col items-center text-center gap-4">
              <div className="h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                <AlertTriangle className="h-8 w-8" />
              </div>
              <h3 className="text-xl font-black uppercase">Əminsiniz?</h3>
              <p className="text-sm text-muted-foreground font-medium">Bu promo-kodu silmək istədiyinizə əminsiniz?</p>
              <div className="flex w-full gap-3 mt-2">
                <Button variant="outline" className="flex-1 h-12 font-bold" onClick={() => setPromoToDelete(null)} disabled={isDeleting}>Ləğv et</Button>
                <Button variant="destructive" className="flex-1 h-12 font-bold" onClick={handleConfirmDelete} disabled={isDeleting}>
                  {isDeleting ? <Loader2 className="animate-spin h-5 w-5" /> : "Bəli, sil"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[40] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in">
          <Card className="w-full max-w-lg shadow-2xl border-primary/20">
            <CardContent className="p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-black">Yeni promo-kod</h3>
                <Button variant="ghost" size="icon" onClick={() => setIsModalOpen(false)} className="rounded-full"><X className="h-5 w-5" /></Button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Tədbir</Label>
                  <Select value={selectedEventId} onValueChange={(val) => { setSelectedEventId(val); setSelectedTierIds([]); }}>
                    <SelectTrigger className="h-11 bg-secondary/20"><SelectValue placeholder="Seçin" /></SelectTrigger>
                    <SelectContent className="z-[1001]">
                      <SelectItem value="all">Bütün tədbirlər</SelectItem>
                      {events.map(ev => <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                {availableTiers.length > 0 && (
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-tight">Bilet növləri (Heç biri seçilməsə hamısına aid olacaq)</Label>
                    <div className="flex flex-wrap gap-2 p-3 border rounded-xl bg-secondary/10">
                      {availableTiers.map((tier: any) => (
                        <Badge 
                          key={tier.tierId} 
                          variant={selectedTierIds.includes(tier.tierId) ? "default" : "outline"}
                          className="cursor-pointer py-1.5 px-3 select-none"
                          onClick={() => setSelectedTierIds(prev => prev.includes(tier.tierId) ? prev.filter(id => id !== tier.tierId) : [...prev, tier.tierId])}
                        >
                          {tier.name}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-2">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Kodun adı</Label>
                  <Input placeholder="Məsələn: DOST25" className="h-11 uppercase font-mono font-bold" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Növü</Label>
                    <Select value={discountType} onValueChange={setDiscountType}>
                      <SelectTrigger className="h-11 bg-background"><SelectValue /></SelectTrigger>
                      <SelectContent className="z-[1001]">
                        <SelectItem value="PERCENTAGE">Faiz (%)</SelectItem>
                        <SelectItem value="FIXED">Məbləğ (₼)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Dəyəri</Label>
                    <Input type="number" placeholder="20" className="h-11 font-bold" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">İstifadə limiti</Label>
                    <Input type="number" placeholder="100" className="h-11" value={limit} onChange={(e) => setLimit(e.target.value)} />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Label className="text-[10px] font-bold uppercase text-muted-foreground tracking-widest">Bitmə tarixi</Label>
                    <Input type="date" className="h-11" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" className="flex-1 h-11 font-bold" onClick={() => setIsModalOpen(false)} disabled={isSubmitting}>Ləğv et</Button>
                <Button className="flex-1 h-11 font-bold" onClick={handleCreate} disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="animate-spin h-5 w-5 mx-auto" /> : "Yarat"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

function PromoCard({ promo, events, locale, onDeleteRequest }: any) {
  const percentage = promo.usageLimit > 0 ? Math.round((promo.usedCount / promo.usageLimit) * 100) : 0
  const associatedEvent = events.find((e: any) => e.id === promo.eventId);

  return (
    <Card className="border-border/50 shadow-sm bg-card/50 relative group transition-all duration-300 hover:border-primary/30">
      <CardContent className="flex flex-col gap-4 p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <Tag className="h-5 w-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-base font-black text-foreground tracking-tight">{promo.code}</span>
                <button onClick={() => navigator.clipboard.writeText(promo.code)} className="text-muted-foreground hover:text-foreground transition-colors"><Copy className="h-3.5 w-3.5" /></button>
              </div>
              <span className="text-xs font-bold text-primary">-{promo.value}{promo.type === 'PERCENTAGE' ? '%' : ' ₼'}</span>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
             <Badge variant={promo.active ? "default" : "secondary"} className="h-5 px-1.5 text-[9px] font-black">
                {promo.active ? "Aktiv" : "Bitmiş"}
             </Badge>
             <Button 
               variant="ghost" 
               size="icon" 
               className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg opacity-0 group-hover:opacity-100 transition-all duration-200"
               onClick={onDeleteRequest}
             >
               <Trash2 className="h-4 w-4" />
             </Button>
          </div>
        </div>
        
        <div className="flex items-center gap-2 py-1.5 px-2.5 rounded-lg bg-secondary/30 text-[10px] font-bold text-muted-foreground uppercase tracking-tight">
          <Calendar className="w-3 h-3 text-primary/60" />
          <span className="line-clamp-1">{associatedEvent ? associatedEvent.title : "Bütün tədbirlər"}</span>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between text-[9px] uppercase font-black tracking-widest text-muted-foreground"><span>İstifadə</span><span>{promo.usedCount} / {promo.usageLimit}</span></div>
          <Progress value={percentage} className="h-1.5 bg-secondary/50" />
        </div>
        <div className="text-[10px] font-bold text-muted-foreground/60 flex items-center justify-between">
          <span>{promo.expiresAt ? `Bitmə: ${promo.expiresAt.split('T')[0]}` : "Müddətsiz"}</span>
          <span className="text-[9px] opacity-40 uppercase">ID: {promo.id.substring(promo.id.length - 4)}</span>
        </div>
      </CardContent>
    </Card>
  )
}