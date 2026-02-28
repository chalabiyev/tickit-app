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
  X, Plus, Minus, ShieldCheck, CheckCircle2, ReceiptText
} from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=800&fit=crop"
const GRID = 36; 

function PublicSeatMap({ event, selectedSeats, onToggleSeat, bounds, rowLabels }: any) {
  const { locale } = useLocale()
  const config = event.seatMapConfig || {};
  
  const stages = config.stages || [
    { id: 'stage-default', x: config.stageRect?.x ?? -100, y: config.stageRect?.y ?? -150, w: config.stageRect?.w ?? 200, h: config.stageRect?.h ?? 50, label: t(locale, "stage") || "STAGE" }
  ];
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // ИСПРАВЛЕНИЕ: Безопасно берем массив проданных мест (если с бэка пришел null, делаем пустой массив)
  const soldSeats = event.soldSeats || [];

  const selectedSeatsData = useMemo(() => {
    return selectedSeats.map((key: string) => {
      const [r, c] = key.split('_').map(Number);
      const seat = event.seats.find((s: any) => s.row === r && s.col === c);
      const tier = event.tiers.find((t: any) => 
        String(t.tierId) === String(seat?.tierId) || 
        String(t._safeId) === String(seat?.tierId) || 
        String(t.id) === String(seat?.tierId)
      );
      return { key, row: r, col: c, tierName: tier?.name || "Standard", price: tier?.price || 0, color: tier?.color || "#3b82f6" };
    });
  }, [selectedSeats, event.seats, event.tiers]);

  if (!bounds) return null;
  const actualGridWidth = (bounds.maxC - bounds.minC + 1) * GRID;
  const actualGridHeight = (bounds.maxR - bounds.minR + 1) * GRID;
  const globalOffsetX = -bounds.minC * GRID;
  const globalOffsetY = -bounds.minR * GRID;

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-full min-h-[500px]">
      <div 
        onWheel={(e) => setScale(s => Math.min(Math.max(s + (e.deltaY > 0 ? -0.05 : 0.05), 0.3), 3))}
        onMouseDown={() => setIsDragging(true)}
        onMouseMove={(e) => isDragging && setOffset(prev => ({ x: prev.x + e.movementX, y: prev.y + e.movementY }))}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
        className="flex-[4] relative bg-black/40 rounded-[2rem] border border-border/40 overflow-hidden shadow-inner cursor-grab active:cursor-grabbing h-full"
      >
        <div className="absolute top-4 right-4 z-30 flex flex-col gap-2">
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScale(s => Math.min(s + 0.2, 3))}><Plus className="h-4 w-4"/></Button>
          <Button variant="secondary" size="icon" className="h-9 w-9 rounded-xl" onClick={() => setScale(s => Math.max(s - 0.2, 0.3))}><Minus className="h-4 w-4"/></Button>
        </div>

        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})`, transition: isDragging ? 'none' : 'transform 0.1s' }}>
          <div className="relative pointer-events-auto" style={{ width: actualGridWidth, height: actualGridHeight }}>
            {stages.map((stage: any) => (
              <div key={stage.id} className="absolute bg-muted/90 backdrop-blur border border-border text-foreground font-black tracking-widest text-[10px] rounded-lg flex items-center justify-center z-20 shadow-md select-none" style={{ left: stage.x + globalOffsetX, top: stage.y + globalOffsetY, width: stage.w, height: stage.h }}>
                {stage.label || t(locale, "stage") || "STAGE"}
              </div>
            ))}
            {bounds.sortedRows.map((r: any) => (
              <div key={`lbl-${r}`} style={{ position: 'absolute', top: (r * GRID) + globalOffsetY + (GRID/2), left: -35, transform: 'translate(0, -50%)' }} className="text-[11px] text-muted-foreground font-mono font-bold opacity-40">{rowLabels[r]}</div>
            ))}
            {event.seats?.map((seat: any) => {
              const tier = event.tiers?.find((t: any) => 
                String(t.tierId) === String(seat.tierId) || 
                String(t._safeId) === String(seat.tierId) || 
                String(t.id) === String(seat.tierId)
              );
              
              const seatKey = `${seat.row}_${seat.col}`;
              const isSelected = selectedSeats.includes(seatKey);
              const isSold = soldSeats.includes(seatKey); // ИСПРАВЛЕНИЕ: Проверяем, продано ли место
              
              return (
                <button 
                  type="button" 
                  key={seatKey} 
                  // Если продано или нет тира — блокируем клик
                  onClick={() => tier && !isSold && onToggleSeat(seatKey)} 
                  disabled={isSold || !tier}
                  style={{ 
                    position: 'absolute', 
                    top: (seat.row * GRID) + globalOffsetY, 
                    left: (seat.col * GRID) + globalOffsetX, 
                    width: GRID - 10, 
                    height: GRID - 10, 
                    backgroundColor: isSold ? '#333333' : isSelected ? '#ffffff' : (tier?.color || '#334155'), 
                    color: isSelected ? '#000000' : '#ffffff',
                    opacity: isSold ? 0.4 : 1 // Проданные места тусклые
                  }} 
                  className={cn(
                    "rounded-xl flex items-center justify-center text-[10px] font-bold transition-all shadow-sm", 
                    isSelected ? "ring-4 ring-primary z-10" : "hover:brightness-110", 
                    (!tier || isSold) && "cursor-not-allowed"
                  )}
                >
                  {/* ИСПРАВЛЕНИЕ: Если продано, рисуем крестик, иначе номер места */}
                  {isSold ? <X className="w-3 h-3 opacity-50" /> : (seat.col - bounds.minC + 1)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[320px] flex flex-col bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
        <div className="p-4 border-b bg-secondary/10 flex items-center gap-2">
          <ReceiptText className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-xs uppercase tracking-widest">{t(locale, "selectedTickets") || "Selected"}</h3>
          <Badge className="ml-auto font-bold px-2 h-5 text-[10px]">{selectedSeats.length}</Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar min-h-[300px]">
          {selectedSeatsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 opacity-20"><Ticket className="w-10 h-10 mb-2" /><p className="text-[10px] font-bold uppercase tracking-widest">{t(locale, "noSeatsSelected") || "Select seats"}</p></div>
          ) : (
            selectedSeatsData.map((s: any) => (
              <div key={s.key} className="p-3 rounded-2xl bg-secondary/20 border border-border/40 flex flex-col gap-1 relative animate-in fade-in slide-in-from-right-2">
                <button onClick={() => onToggleSeat(s.key)} className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"><X className="h-4 w-4" /></button>
                <div className="flex items-center gap-2"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} /><span className="text-[9px] font-bold text-muted-foreground uppercase">{s.tierName}</span></div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold">{t(locale, "row") || "Row"} {rowLabels[s.row]}, {t(locale, "seat") || "Seat"} {s.col - bounds.minC + 1}</span>
                  <span className="font-black text-primary">{s.price} ₼</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default function PublicEventPage() {
  const { locale } = useLocale()
  const params = useParams()
  const shortLink = params.shortLink as string
  
  const [mounted, setMounted] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2 | 3>(1) 
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]) 
  const [buyerInfo, setBuyerInfo] = useState({ firstName: "", lastName: "", email: "" })
  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({})
  const [isProcessing, setIsProcessing] = useState(false)
  
  // ИСПРАВЛЕНИЕ: Добавляем Toast для вывода ошибок (например, лимит билетов)
  const [toast, setToast] = useState<{ show: boolean, message: string }>({ show: false, message: '' })

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://72.60.135.9:8080/api/v1/events/s/${shortLink}`)
        if (!res.ok) throw new Error("Event not found")
        const data = await res.json()
        
        if (data.tiers && data.seats) {
          const usedTierIds = Array.from(new Set(data.seats.map((s: any) => String(s.tierId)).filter(Boolean)));
          data.tiers = data.tiers.map((tier: any, index: number) => {
            if (tier.tierId) return { ...tier, _safeId: String(tier.tierId) };
            const fallbackId = usedTierIds[index] || tier.id || tier._id;
            return { ...tier, _safeId: String(fallbackId) };
          });
        }
        
        setEvent(data)
      } catch (err: any) { setError(t(locale, "eventNotFound") || "Not found") } 
      finally { setLoading(false) }
    }
    if (shortLink && mounted) fetchEvent()
  }, [shortLink, mounted, locale])

  const showToast = (message: string) => {
    setToast({ show: true, message })
    setTimeout(() => setToast({ show: false, message: '' }), 3000)
  }

  const toggleSeat = (seatKey: string) => {
    setSelectedSeats(prev => {
      if (prev.includes(seatKey)) {
        return prev.filter(k => k !== seatKey);
      } else {
        // ИСПРАВЛЕНИЕ: Проверяем лимит билетов (Max Tickets Per Order)
        const maxLimit = event.maxTicketsPerOrder || 10;
        if (prev.length >= maxLimit) {
          showToast(`Siz maksimum ${maxLimit} bilet seçə bilərsiniz.`);
          return prev;
        }
        return [...prev, seatKey];
      }
    });
  }

  const isReserved = event?.isReservedSeating
  const totalPrice = selectedSeats.reduce((sum, seatKey) => {
    const [r, c] = seatKey.split('_').map(Number);
    const seat = event.seats.find((s: any) => s.row === r && s.col === c);
    const tier = event.tiers.find((t: any) => 
      String(t.tierId) === String(seat?.tierId) || 
      String(t._safeId) === String(seat?.tierId) || 
      String(t.id) === String(seat?.tierId)
    );
    return sum + (tier?.price || 0);
  }, 0)

  const stepText = (t(locale, "stepOf") || "{step} / {total} addım")
    .replace(/{step}/gi, checkoutStep.toString())
    .replace(/{total}/gi, "2");

  const isFormValid = useMemo(() => {
    if (!buyerInfo.firstName.trim() || !buyerInfo.lastName.trim() || !buyerInfo.email.trim()) return false;
    if (event?.buyerQuestions && Array.isArray(event.buyerQuestions)) {
      for (const q of event.buyerQuestions) {
        if (q.required && !customAnswers[q.id]?.trim()) return false;
      }
    }
    return true;
  }, [buyerInfo, customAnswers, event?.buyerQuestions]);

  const bounds = useMemo(() => {
    if (!event || !event.seats || event.seats.length === 0) return null;
    const rows = event.seats.map((s: any) => Number(s.row));
    const cols = event.seats.map((s: any) => Number(s.col));
    return { minR: Math.min(...rows), maxR: Math.max(...rows), minC: Math.min(...cols), maxC: Math.max(...cols), sortedRows: Array.from(new Set(rows)).sort((a: any, b: any) => a - b) };
  }, [event]);

  const rowLabels: Record<number, string> = useMemo(() => {
    if (!bounds || !event?.seatMapConfig) return {};
    const labels: Record<number, string> = {};
    const config = event.seatMapConfig;
    bounds.sortedRows.forEach((r: any, i: number) => {
      if (config.rowLabelType === 'letters') {
        let label = ''; let n = i; while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }; labels[r] = label
      } else { labels[r] = (i + 1).toString() }
    });
    return labels;
  }, [bounds, event]);

  const handleCheckout = async () => {
    setIsProcessing(true);

    try {
      // ИСПРАВЛЕНИЕ: Отправляем запрос на создание заказа в Spring Boot
      const orderPayload = {
        eventId: event.id,
        customerName: `${buyerInfo.firstName} ${buyerInfo.lastName}`,
        customerEmail: buyerInfo.email,
        seatIds: selectedSeats,
        totalAmount: totalPrice
      };

      const res = await fetch("http://72.60.135.9:8080/api/v1/orders/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(orderPayload)
      });

      if (!res.ok) {
        throw new Error("Sifariş yaradılarkən xəta baş verdi. Bəzi yerlər artıq satılmış ola bilər.");
      }

      // Генерация PDF билетов
      const { jsPDF } = await import("jspdf");

      for (const seatKey of selectedSeats) {
        const [r, c] = seatKey.split('_').map(Number);
        const seat = event.seats.find((s: any) => s.row === r && s.col === c);
        const tier = event.tiers.find((t: any) => 
          String(t.tierId) === String(seat?.tierId) || 
          String(t._safeId) === String(seat?.tierId) || 
          String(t.id) === String(seat?.tierId)
        );

        const seatLabel = `${t(locale, "row") || "Row"} ${rowLabels[r]}, ${t(locale, "seat") || "Seat"} ${c - (bounds?.minC || 0) + 1}`;
        const ticketType = tier?.name || "Standard";

        const design = event.ticketDesign || { bgColor: "#09090b", elements: [] };
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 800;
        const ctx = canvas.getContext("2d");

        if (ctx) {
          ctx.fillStyle = design.bgColor || "#09090b";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          const elements = design.elements && design.elements.length > 0 ? design.elements : [
            { type: 'text', x: 24, y: 100, content: '{{Event_Name}}', color: '#ffffff', fontSize: 32, fontWeight: 'bold' },
            { type: 'text', x: 24, y: 150, content: '{{Event_Date}}', color: '#a1a1aa', fontSize: 14 },
            { type: 'text', x: 24, y: 220, content: '{{Guest_Name}}', color: '#ffffff', fontSize: 24, fontWeight: 'bold' },
            { type: 'text', x: 24, y: 260, content: '{{Ticket_Type}} • {{Seat_Info}}', color: '#3b82f6', fontSize: 16, fontWeight: 'bold' },
            { type: 'qr', x: 125, y: 500, fontSize: 150 }
          ];

          for (const el of elements) {
            if (el.type === "text") {
              let text = el.content || "";
              text = text.replace(/{{Event_Name}}/gi, event.title || "");
              text = text.replace(/{{Event_Date}}/gi, event.eventDate || "");
              text = text.replace(/{{Location}}/gi, event.venueName || event.address || "Online");
              text = text.replace(/{{Guest_Name}}/gi, `${buyerInfo.firstName} ${buyerInfo.lastName}`);
              text = text.replace(/{{Ticket_Type}}/gi, ticketType);
              text = text.replace(/{{Seat_Info}}/gi, seatLabel);

              ctx.fillStyle = el.color || "#ffffff";
              ctx.font = `${el.fontWeight || "normal"} ${el.fontSize || 16}px ${el.fontFamily || "Arial, sans-serif"}`;
              ctx.textAlign = el.textAlign || "left";
              ctx.textBaseline = "top";
              ctx.fillText(text, el.x, el.y);
            } else if (el.type === "qr") {
              const qrData = `${event.shortLink}-${seatKey}-${buyerInfo.email}`;
              const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${el.fontSize || 150}x${el.fontSize || 150}&data=${encodeURIComponent(qrData)}&margin=0`;
              try {
                const qrImg = new Image();
                qrImg.crossOrigin = "anonymous";
                qrImg.src = qrUrl;
                await new Promise((resolve) => {
                  qrImg.onload = () => {
                    ctx.drawImage(qrImg, el.x, el.y, el.fontSize || 150, el.fontSize || 150);
                    resolve(true);
                  };
                  qrImg.onerror = () => resolve(false);
                });
              } catch (e) {
                console.error("QR Generation failed", e);
              }
            }
          }

          const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [400, 800] });
          pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 400, 800);
          pdf.save(`${event.title}_Bilet_${seatLabel.replace(/ /g, "_")}.pdf`);
        }
      }
      
      setCheckoutStep(3); // Переход на страницу Успеха

    } catch (err: any) {
      console.error("Checkout failed", err);
      showToast(err.message || "Xəta baş verdi. Yenidən cəhd edin.");
    } finally {
      setIsProcessing(false);
    }
  }

  // Сброс формы при закрытии модалки (чтобы купленные места не висели в корзине при повторном открытии)
  const closeCheckout = () => {
    setIsCheckoutOpen(false);
    if (checkoutStep === 3) {
      window.location.reload(); // Перезагружаем страницу, чтобы обновить карту и показать новые серые места
    }
  }

  if (!mounted) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="animate-spin text-primary w-10 h-10" /></div>
  if (error || !event) return <div className="min-h-screen flex flex-col items-center justify-center bg-background"><h2 className="text-xl font-bold">{error}</h2></div>

  const minPrice = event.tiers?.length > 0 ? Math.min(...event.tiers.map((t: any) => t.price)) : 0
  const coverUrl = event.coverImageUrl ? (event.coverImageUrl.startsWith('http') ? event.coverImageUrl : `http://72.60.135.9:8080${event.coverImageUrl}`) : DEFAULT_COVER;

  return (
    <div className="min-h-screen bg-background relative selection:bg-primary/20 pb-12">
      <nav className="fixed top-0 left-0 right-0 z-40 flex items-center justify-center px-6 py-4 bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-sm">
        <div className="flex items-center gap-2"><Ticket className="w-6 h-6 text-primary" /><span className="font-black tracking-[0.2em] text-lg mt-0.5 text-foreground uppercase">TICKIT</span></div>
      </nav>

      <div className="w-full h-[50vh] lg:h-[60vh] relative overflow-hidden flex flex-col justify-end mt-[60px]">
        <img src={coverUrl} className="absolute inset-0 w-full h-full object-cover z-0" crossOrigin="anonymous" alt="Poster" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-black/30 z-10" />
        <div className="relative z-20 max-w-6xl mx-auto px-6 w-full pb-20"><Badge className="mb-4 bg-primary text-primary-foreground uppercase tracking-widest font-black px-3 py-1">{event.category || "Event"}</Badge><h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-foreground drop-shadow-2xl leading-tight">{event.title}</h1></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-20 -mt-16">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-8 w-full">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/40 backdrop-blur-xl border border-border/50 shadow-sm"><div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50"><CalendarDays className="w-6 h-6 text-primary" /></div><div className="flex flex-col mt-0.5"><span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t(locale, "dateTime")}</span><span className="font-bold text-base text-foreground">{event.eventDate}</span><span className="text-xs font-medium text-muted-foreground">{event.startTime}</span></div></div>
              <div className="flex items-start gap-4 p-5 rounded-3xl bg-secondary/40 backdrop-blur-xl border border-border/50 shadow-sm"><div className="p-3 bg-background rounded-2xl shadow-sm border border-border/50"><MapPin className="w-6 h-6 text-primary" /></div><div className="flex flex-col mt-0.5"><span className="text-[10px] font-bold text-muted-foreground uppercase mb-1">{t(locale, "location")}</span><span className="font-bold text-base text-foreground">{event.isPhysical ? event.venueName : t(locale, "onlineEvent")}</span><span className="text-xs font-medium text-muted-foreground line-clamp-2">{event.isPhysical ? event.address : t(locale, "linkProvided")}</span></div></div>
            </div>
            <div className="flex flex-col gap-4 pb-20"><h3 className="text-2xl font-black tracking-tight">{t(locale, "aboutEvent")}</h3><p className="text-muted-foreground leading-relaxed text-base font-medium">{event.description}</p></div>
          </div>

          <div className="hidden lg:block w-[350px] shrink-0 sticky top-24 z-30">
            <div className="bg-card border border-border/40 shadow-2xl rounded-[2.5rem] p-8 flex flex-col">
              <div className="text-center mb-6 pt-2">
                <span className="text-[10px] text-muted-foreground uppercase font-black tracking-widest block mb-1 opacity-60">{t(locale, "ticketsFrom")}</span>
                <span className="text-5xl font-black text-foreground">{minPrice} ₼</span>
              </div>
              <Separator className="my-5 bg-border/60" />
              <div className="flex flex-col gap-3 mb-8">
                {event.tiers?.map((tier: any) => (
                  <div key={tier.tierId || tier.id} className="flex items-center justify-between p-3.5 rounded-xl border bg-secondary/10 shadow-sm"><div className="flex items-center gap-3 font-bold text-sm"><div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: tier.color }} />{tier.name}</div><div className="font-black text-base">{tier.price} ₼</div></div>
                ))}
              </div>
              <Button size="lg" className="w-full h-14 font-black text-lg rounded-xl shadow-xl hover:scale-[1.02] transition-transform" onClick={() => setIsCheckoutOpen(true)}>{t(locale, "buyTickets")}</Button>
              <div className="flex items-center justify-center gap-2 mt-5 text-muted-foreground opacity-60"><ShieldCheck className="w-4 h-4 text-green-500" /><span className="text-[10px] font-bold uppercase tracking-widest">{t(locale, "secureCheckout")}</span></div>
            </div>
          </div>
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-background/95 backdrop-blur-md sm:p-4 animate-in fade-in duration-300">
          <div className={cn("bg-card w-full border-t sm:border border-border/60 rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl flex flex-col", isReserved && checkoutStep === 1 ? "max-w-[1300px] h-[90vh]" : "max-w-xl max-h-[92vh]")}>
            <div className="p-6 border-b flex justify-between items-center bg-secondary/10">
              <div className="flex flex-col gap-0.5"><h2 className="text-xl font-black uppercase tracking-tight">{checkoutStep === 1 ? t(locale, "selectTickets") : checkoutStep === 2 ? t(locale, "buyerDetails") : t(locale, "success")}</h2>{checkoutStep < 3 && <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">{stepText}</span>}</div>
              <Button variant="secondary" size="icon" className="rounded-xl w-10 h-10" onClick={closeCheckout}><X className="w-5 h-5" /></Button>
            </div>
            
            <div className="p-4 sm:p-8 overflow-y-auto flex-1 custom-scrollbar bg-background">
              {checkoutStep === 1 ? (
                <PublicSeatMap event={event} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} bounds={bounds} rowLabels={rowLabels} />
              ) : checkoutStep === 2 ? (
                <div className="flex flex-col gap-8 p-2 animate-in fade-in slide-in-from-right-4">
                  <div className="flex flex-col gap-4">
                    <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale, "contactInfo") || "Contact Info"}</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <Input className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale, "firstName") || "Ad"} value={buyerInfo.firstName} onChange={e => setBuyerInfo({...buyerInfo, firstName: e.target.value})} />
                      <Input className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale, "lastName") || "Soyad"} value={buyerInfo.lastName} onChange={e => setBuyerInfo({...buyerInfo, lastName: e.target.value})} />
                    </div>
                    <Input type="email" className="h-12 bg-secondary/10 rounded-xl font-bold border-none shadow-inner" placeholder={t(locale, "emailAddress") || "E-poçt"} value={buyerInfo.email} onChange={e => setBuyerInfo({...buyerInfo, email: e.target.value})} />
                  </div>

                  {event.buyerQuestions && event.buyerQuestions.length > 0 && (
                    <>
                      <Separator className="bg-border/60" />
                      <div className="flex flex-col gap-4">
                        <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale, "additionalDetails") || "Additional Details"}</Label>
                        {event.buyerQuestions.map((q: any) => (
                          <div key={q.id} className="flex flex-col gap-2">
                            <Label className="text-sm font-semibold ml-1 text-foreground">
                              {q.label} {q.required && <span className="text-destructive">*</span>}
                            </Label>
                            <Input 
                              className="h-12 bg-secondary/10 rounded-xl font-medium border-none shadow-inner" 
                              required={q.required}
                              value={customAnswers[q.id] || ""} 
                              onChange={e => setCustomAnswers({...customAnswers, [q.id]: e.target.value})} 
                            />
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center p-6">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mb-4" />
                  <h3 className="text-2xl font-black mb-2 uppercase tracking-tight">{t(locale, "paymentSuccessful") || "ÖDƏNİŞ UĞURLUDUR!"}</h3>
                  <p className="text-muted-foreground text-sm max-w-xs">{t(locale, "ticketsDownloaded") || "Biletləriniz PDF formatında cihazınıza yükləndi!"}</p>
                  <Button size="lg" className="mt-8 px-10 rounded-xl font-bold" onClick={closeCheckout}>{t(locale, "done")}</Button>
                </div>
              )}
            </div>

            {checkoutStep < 3 && (
              <div className="p-6 border-t bg-card rounded-b-[2.5rem] flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex flex-col items-center sm:items-start">
                  <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">{t(locale, "total")}</span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black text-primary tracking-tighter">{totalPrice}</span>
                    <span className="text-lg font-black text-primary">₼</span>
                  </div>
                  <span className="text-[10px] font-black text-muted-foreground uppercase mt-1">{selectedSeats.length} {t(locale, "ticketsSelected")}</span>
                </div>
                <div className="flex gap-3 w-full sm:w-auto">
                  {checkoutStep === 2 && <Button variant="outline" size="lg" className="h-14 px-8 rounded-xl font-bold" onClick={() => setCheckoutStep(1)}>{t(locale, "back") || "Geri"}</Button>}
                  <Button 
                    size="lg" 
                    className={cn("h-14 px-10 rounded-xl font-black text-lg flex-1 sm:flex-none shadow-xl", checkoutStep === 2 ? "bg-green-600 hover:bg-green-700" : "bg-primary")} 
                    onClick={() => checkoutStep === 1 ? setCheckoutStep(2) : handleCheckout()} 
                    disabled={checkoutStep === 1 ? selectedSeats.length === 0 : (!isFormValid || isProcessing)}
                  >
                    {isProcessing ? <Loader2 className="animate-spin w-5 h-5" /> : checkoutStep === 1 ? (t(locale, "continueBtn") || "Davam et") : (t(locale, "payNow") || "İndi Ödə")}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* НОВЫЙ TOAST УВЕДОМЛЕНИЙ */}
      {toast.show && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 px-6 py-4 rounded-full shadow-2xl border bg-destructive text-destructive-foreground animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999]">
          <AlertCircle className="h-5 w-5" />
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

    </div>
  )
}