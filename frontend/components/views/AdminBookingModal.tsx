"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Loader2, X, Plus, Minus, ReceiptText, Ticket, CheckCircle2, Download, Send, Lock, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"

const GRID = 36;

function SeatMap({ 
  event, 
  selectedSeats, 
  selectedAdminSeats,
  onToggleSeat, 
  onToggleAdminSeat,
  bounds, 
  rowLabels 
}: any) {
  const { locale } = useLocale()
  const config = event.seatMapConfig || {};
  
  const stages = config.stages || [
    { id: 'stage-default', x: config.stageRect?.x ?? -100, y: config.stageRect?.y ?? -150, w: config.stageRect?.w ?? 200, h: config.stageRect?.h ?? 50, label: t(locale, "stage") || "SƏHNƏ" }
  ];
  
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);

  const soldSeats = event.soldSeats || [];
  const adminSeats = event.adminSeats || []; 

  const activeSelection = selectedAdminSeats.length > 0 ? selectedAdminSeats : selectedSeats;
  const isUnblockMode = selectedAdminSeats.length > 0;

  const selectedSeatsData = useMemo(() => {
    return activeSelection.map((key: string) => {
      const [r, c] = key.split('_').map(Number);
      const seat = event.seats.find((s: any) => s.row === r && s.col === c);
      const tier = event.tiers?.find((t: any) => 
        String(t.tierId) === String(seat?.tierId) || 
        String(t._safeId) === String(seat?.tierId) || 
        String(t.id) === String(seat?.tierId)
      );
      return { key, row: r, col: c, tierName: tier?.name || "Standard", price: tier?.price || 0, color: tier?.color || "#3b82f6" };
    });
  }, [activeSelection, event.seats, event.tiers]);

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
                {stage.label || t(locale, "stage") || "SƏHNƏ"}
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
              const isSelectedAdmin = selectedAdminSeats.includes(seatKey);
              
              const isAdminBlocked = adminSeats.includes(seatKey);
              const isActuallySold = soldSeats.includes(seatKey) && !isAdminBlocked; 

              let seatBg = tier?.color || '#334155';
              let opacity = 1;
              let isClickable = true;

              if (isActuallySold) {
                seatBg = '#333333';
                opacity = 0.4;
                isClickable = false;
              } else if (isSelected || isSelectedAdmin) {
                seatBg = '#ffffff';
              }
              
              return (
                <button 
                  type="button" 
                  key={seatKey} 
                  onClick={() => {
                    if (!isClickable || !tier) return;
                    if (isAdminBlocked) {
                      onToggleAdminSeat(seatKey);
                    } else {
                      onToggleSeat(seatKey);
                    }
                  }} 
                  disabled={!isClickable || !tier}
                  style={{ 
                    position: 'absolute', top: (seat.row * GRID) + globalOffsetY, left: (seat.col * GRID) + globalOffsetX, 
                    width: GRID - 10, height: GRID - 10, 
                    backgroundColor: seatBg, 
                    color: (isSelected || isSelectedAdmin) ? '#000000' : '#ffffff',
                    opacity: opacity 
                  }} 
                  className={cn(
                    "rounded-xl flex items-center justify-center text-[10px] font-bold transition-all shadow-sm overflow-hidden", 
                    isSelected ? "ring-4 ring-primary z-10" : "", 
                    isSelectedAdmin ? "ring-4 ring-destructive z-10" : "",
                    (!isSelected && !isSelectedAdmin && isClickable) && "hover:brightness-110",
                    !isClickable && "cursor-not-allowed"
                  )}
                >
                  {isActuallySold ? (
                    <X className="w-3 h-3 opacity-50" />
                  ) : isAdminBlocked && !isSelectedAdmin ? (
                    <div className="relative flex items-center justify-center w-full h-full">
                      <div className="absolute inset-0 bg-black/30"></div> 
                      <Lock className="w-3.5 h-3.5 text-white z-10 drop-shadow-md" />
                    </div>
                  ) : (
                    <span className="z-10">{seat.col - bounds.minC + 1}</span>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      <div className="flex-1 lg:max-w-[320px] flex flex-col bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-xl">
        <div className={cn(
          "p-4 border-b flex items-center gap-2 transition-colors",
          isUnblockMode ? "bg-destructive/10 border-destructive/20" : "bg-secondary/10"
        )}>
          <ReceiptText className={cn("w-4 h-4", isUnblockMode ? "text-destructive" : "text-primary")} />
          <h3 className="font-bold text-xs uppercase tracking-widest">
            {isUnblockMode ? (t(locale, "seatsToUnblock") || "Ləğv ediləcək") : (t(locale, "selectedTickets") || "Seçilmişlər")}
          </h3>
          <Badge variant={isUnblockMode ? "destructive" : "default"} className="ml-auto font-bold px-2 h-5 text-[10px]">
            {activeSelection.length}
          </Badge>
        </div>
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 custom-scrollbar min-h-[300px]">
          {selectedSeatsData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-16 opacity-20">
              <Ticket className="w-10 h-10 mb-2" />
              <p className="text-[10px] font-bold uppercase tracking-widest">{t(locale, "selectSeats") || "Yer seçin"}</p>
            </div>
          ) : (
            selectedSeatsData.map((s: any) => (
              <div key={s.key} className={cn(
                "p-3 rounded-2xl border flex flex-col gap-1 relative animate-in fade-in slide-in-from-right-2",
                isUnblockMode ? "bg-destructive/5 border-destructive/20" : "bg-secondary/20 border-border/40"
              )}>
                <button 
                  onClick={() => isUnblockMode ? onToggleAdminSeat(s.key) : onToggleSeat(s.key)} 
                  className="absolute top-3 right-3 text-muted-foreground hover:text-destructive transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase">{s.tierName}</span>
                </div>
                <div className="flex justify-between items-end">
                  <span className="text-sm font-bold">{t(locale, "row") || "Sıra"} {rowLabels[s.row]}, {t(locale, "seat") || "Yer"} {s.col - bounds.minC + 1}</span>
                  {isUnblockMode ? (
                    <span className="font-black text-destructive text-xs uppercase">Ləğv</span>
                  ) : (
                    <span className="font-black text-primary">0 ₼</span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export function AdminBookingModal({ event, onClose, onSuccess }: any) {
  const { locale } = useLocale()
  const [step, setStep] = useState<1 | 2 | 3>(1)
  const [loading, setLoading] = useState(false)
  
  // Новое состояние для кастомного окна подтверждения
  const [showConfirmModal, setShowConfirmModal] = useState(false)
  
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [selectedAdminSeats, setSelectedAdminSeats] = useState<string[]>([])
  
  const [selectedTiers, setSelectedTiers] = useState<Record<string, number>>({})
  
  const [bookingType, setBookingType] = useState<"block" | "invite">("invite")
  const [inviteMethod, setInviteMethod] = useState<"download" | "email">("download")
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", note: "" })

  const isReservedMap = event?.isPhysical && event?.isReservedSeating;

  const bounds = useMemo(() => {
    if (!event?.seats || event.seats.length === 0) return null;
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

  const toggleSeat = (seatKey: string) => {
    setSelectedAdminSeats([]); 
    setSelectedSeats(prev => prev.includes(seatKey) ? prev.filter(k => k !== seatKey) : [...prev, seatKey]);
  }

  const toggleAdminSeat = (seatKey: string) => {
    setSelectedSeats([]); 
    setSelectedAdminSeats(prev => prev.includes(seatKey) ? prev.filter(k => k !== seatKey) : [...prev, seatKey]);
  }

  // Обновленная функция отмены брони: последовательная отправка запросов (без бага бэкенда)
  const executeUnblockMultiple = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tickit_token");
      
      // Отправляем ОДИН запрос со всеми местами сразу
      const res = await fetch("http://localhost:8080/api/v1/orders/admin-unbook", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ eventId: event.id, seatIds: selectedAdminSeats })
      });

      if (!res.ok) throw new Error("Failed to unblock seats");

      setShowConfirmModal(false);
      setSelectedAdminSeats([]);
      onSuccess(); // Обновляет дашборд и карту
    } catch (e) {
      alert(t(locale, "unblockError") || "Xəta baş verdi");
    } finally {
      setLoading(false);
    }
  }

  const handleIncrementTier = (tierId: string) => setSelectedTiers(prev => ({ ...prev, [tierId]: (prev[tierId] || 0) + 1 }));
  const handleDecrementTier = (tierId: string) => setSelectedTiers(prev => { const newQty = (prev[tierId] || 0) - 1; if (newQty <= 0) { const newState = { ...prev }; delete newState[tierId]; return newState; } return { ...prev, [tierId]: newQty }; });

  const selectedCount = isReservedMap ? selectedSeats.length : Object.values(selectedTiers).reduce((a, b) => a + b, 0);

  const handleAdminBooking = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("tickit_token");
      const finalSeatIds: string[] = [];
      const ticketsToGenerate: any[] = [];

      if (isReservedMap) {
        for (const seatKey of selectedSeats) {
          finalSeatIds.push(seatKey);
          const [r, c] = seatKey.split('_').map(Number);
          const seat = event.seats.find((s: any) => s.row === r && s.col === c);
          const tier = event.tiers?.find((t: any) => String(t.tierId) === String(seat?.tierId) || String(t._safeId) === String(seat?.tierId));
          ticketsToGenerate.push({ seatKey, tier, seatLabel: `${t(locale, "row") || "Sıra"} ${rowLabels[r] || r}, ${t(locale, "seat") || "Yer"} ${c - (bounds?.minC || 0) + 1}` });
        }
      } else {
        Object.entries(selectedTiers).forEach(([tierId, qty]) => {
          const tier = event.tiers?.find((t: any) => String(t._safeId) === tierId || String(t.id) === tierId);
          for (let i = 0; i < qty; i++) {
            const fakeSeatId = `ADM_${tierId}_${Date.now()}_${i}`;
            finalSeatIds.push(fakeSeatId);
            ticketsToGenerate.push({ seatKey: fakeSeatId, tier, seatLabel: event.isPhysical ? "General Admission" : "Online Access" });
          }
        });
      }

      const payload = {
        eventId: event.id,
        customerName: bookingType === "block" ? "ADMIN BLOCK" : `${form.firstName} ${form.lastName}`,
        customerEmail: bookingType === "block" ? "admin@tickit.az" : form.email,
        customerPhone: "-",
        seatIds: finalSeatIds,
        isInvite: bookingType === "invite",
        sendEmail: bookingType === "invite" && inviteMethod === "email",
        inviteNote: form.note
      };

      const res = await fetch("http://localhost:8080/api/v1/orders/admin-book", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Booking failed");
      const orderData = await res.json();
      
      if (bookingType === "invite" && inviteMethod === "download") {
        const backendTickets = orderData.tickets || [];
        const { jsPDF } = await import("jspdf");

        for (const tData of ticketsToGenerate) {
          const ticketType = tData.tier?.name || "Standard";
          const design = event.ticketDesign || { bgColor: "#09090b", elements: [] };
          const matchedBackendTicket = backendTickets.find((t: any) => t.seatId === tData.seatKey);
          const realQrCodeData = matchedBackendTicket ? matchedBackendTicket.qrCode : `${event.shortLink}-${tData.seatKey}`;

          const canvas = document.createElement("canvas");
          canvas.width = 400; canvas.height = 800;
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
                text = text.replace(/{{Event_Name}}/gi, event.title || event.name);
                text = text.replace(/{{Event_Date}}/gi, event.eventDate || "");
                text = text.replace(/{{Location}}/gi, event.isPhysical ? (event.venueName || event.address) : "Online Event");
                text = text.replace(/{{Guest_Name}}/gi, `${form.firstName} ${form.lastName}`);
                text = text.replace(/{{Ticket_Type}}/gi, ticketType);
                text = text.replace(/{{Seat_Info}}/gi, tData.seatLabel);
                ctx.fillStyle = el.color || "#ffffff";
                ctx.font = `${el.fontWeight || "normal"} ${el.fontSize || 16}px Arial`;
                ctx.textBaseline = "top";
                ctx.fillText(text, el.x, el.y);
              } else if (el.type === "qr") {
                const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${el.fontSize}x${el.fontSize}&data=${encodeURIComponent(realQrCodeData)}`;
                const qrImg = new Image(); qrImg.crossOrigin = "anonymous"; qrImg.src = qrUrl;
                await new Promise((resolve) => {
                  qrImg.onload = () => { ctx.drawImage(qrImg, el.x, el.y, el.fontSize, el.fontSize); resolve(true); };
                  qrImg.onerror = () => resolve(false);
                });
              }
            }
            const pdf = new jsPDF({ orientation: "portrait", unit: "px", format: [400, 800] });
            pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, 400, 800);
            pdf.save(`${event.name || 'Ticket'}_Bilet.pdf`);
          }
        }
      }

      setStep(3);
    } catch (e) {
      alert(t(locale, "bookingError") || "Xəta baş verdi!");
    } finally {
      setLoading(false);
    }
  }

  const isFormValid = useMemo(() => {
    if (bookingType === "block") return true;
    if (bookingType === "invite") {
      if (!form.firstName || !form.lastName) return false;
      if (inviteMethod === "email" && !form.email) return false;
      return true;
    }
    return false;
  }, [bookingType, inviteMethod, form]);

  return (
    <>
      <div className="fixed inset-0 z-[120] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 pt-24 animate-in fade-in">
        <Card className={cn(
          "bg-card w-full shadow-2xl border-primary/20 rounded-[2.5rem] flex flex-col transition-all overflow-hidden",
          step === 1 && isReservedMap ? "max-w-6xl h-[85vh]" : "max-w-md"
        )}>
          <div className="p-6 border-b flex justify-between items-center bg-secondary/10 shrink-0">
            <div className="flex flex-col">
              <h3 className="text-xl font-black uppercase tracking-tight">{t(locale, "adminBooking") || "Admin Bronu"}</h3>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{event.name}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full"><X className="h-5 w-5" /></Button>
          </div>

          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
            {step === 1 ? (
              <div className="flex flex-col gap-6 h-full">
                {isReservedMap ? (
                  <div className="flex-1 min-h-[400px]">
                     <SeatMap 
                       event={event} 
                       selectedSeats={selectedSeats} 
                       selectedAdminSeats={selectedAdminSeats}
                       onToggleSeat={toggleSeat}
                       onToggleAdminSeat={toggleAdminSeat} 
                       bounds={bounds} 
                       rowLabels={rowLabels} 
                     />
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 max-w-lg mx-auto w-full pt-10 pb-20">
                    <div className="text-center p-4 mb-4 bg-primary/10 rounded-2xl border border-primary/20 text-sm font-bold text-primary">
                      {t(locale, "noMapMode") || "Xəritəsiz tədbir rejimi."}
                    </div>
                    {event.tiers?.map((tier: any, index: number) => (
                      <div key={tier.tierId || tier.id || tier._safeId || `tier-${index}`} className="flex items-center justify-between p-5 bg-card border border-border/60 rounded-2xl shadow-sm">
                        <div className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color || '#ccc' }} /><h3 className="font-bold">{tier.name}</h3></div>
                        <div className="flex items-center gap-4 bg-secondary/20 p-2 rounded-xl">
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleDecrementTier(tier.id || tier._safeId)} disabled={!selectedTiers[tier.id || tier._safeId]}><Minus className="w-4 h-4" /></Button>
                          <span className="font-bold w-6 text-center">{selectedTiers[tier.id || tier._safeId] || 0}</span>
                          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => handleIncrementTier(tier.id || tier._safeId)}><Plus className="w-4 h-4" /></Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* НИЖНЯЯ ПАНЕЛЬ С КНОПКАМИ */}
                <div className="flex items-center justify-between bg-secondary/20 p-4 rounded-2xl shrink-0 mt-auto">
                  {selectedAdminSeats.length > 0 ? (
                    <>
                      <span className="font-bold text-sm text-destructive">{selectedAdminSeats.length} {t(locale, "adminSeatsSelected") || "admin bronu seçilib"}</span>
                      <Button 
                        variant="destructive"
                        className="rounded-xl px-8 font-bold"
                        onClick={() => setShowConfirmModal(true)} // Открываем наш кастомный попап!
                        disabled={loading}
                      >
                        {t(locale, "unblockSelected") || "Bronları ləğv et"}
                      </Button>
                    </>
                  ) : (
                    <>
                      <span className="font-bold text-sm">{selectedCount} {t(locale, "seatsSelected") || "bilet seçilib"}</span>
                      <Button 
                        disabled={selectedCount === 0} 
                        className="rounded-xl px-8 font-bold"
                        onClick={() => setStep(2)}
                      >
                        {t(locale, "continue") || "Davam et"}
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ) : step === 2 ? (
              <div className="flex flex-col gap-5 animate-in slide-in-from-right-4">
                
                <div className="grid grid-cols-2 gap-3 p-1 bg-secondary/30 rounded-xl">
                  <Button variant={bookingType === "invite" ? "default" : "ghost"} className="rounded-lg text-xs font-bold h-10" onClick={() => setBookingType("invite")}>
                    {t(locale, "invitation") || "Dəvətnamə"}
                  </Button>
                  <Button variant={bookingType === "block" ? "default" : "ghost"} className="rounded-lg text-xs font-bold h-10" onClick={() => setBookingType("block")}>
                    {t(locale, "blockSeats") || "Blokla (Satışdan çıxar)"}
                  </Button>
                </div>

                {bookingType === "invite" && (
                  <div className="flex flex-col gap-4">
                    <div className="flex p-1 bg-secondary/20 rounded-lg">
                      <Button variant={inviteMethod === "download" ? "secondary" : "ghost"} size="sm" className="flex-1 text-xs gap-2" onClick={() => setInviteMethod("download")}>
                        <Download className="w-3.5 h-3.5" /> {t(locale, "downloadPdf") || "PDF Yüklə"}
                      </Button>
                      <Button variant={inviteMethod === "email" ? "secondary" : "ghost"} size="sm" className="flex-1 text-xs gap-2" onClick={() => setInviteMethod("email")}>
                        <Send className="w-3.5 h-3.5" /> {t(locale, "sendEmail") || "E-poçtla Göndər"}
                      </Button>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">{t(locale, "firstName") || "Ad"} *</Label>
                        <Input className="rounded-xl h-12 bg-secondary/10 border-none shadow-inner" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">{t(locale, "lastName") || "Soyad"} *</Label>
                        <Input className="rounded-xl h-12 bg-secondary/10 border-none shadow-inner" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">
                        {t(locale, "email") || "Email"} {inviteMethod === "email" ? <span className="text-destructive">*</span> : `(${t(locale, "optional") || "İstəyə bağlı"})`}
                      </Label>
                      <Input type="email" placeholder="nümunə@mail.com" className="rounded-xl h-12 bg-secondary/10 border-none shadow-inner" value={form.email} onChange={e => setForm({...form, email: e.target.value})} />
                    </div>

                    {inviteMethod === "email" && (
                      <div className="space-y-2">
                        <Label className="text-[10px] font-bold uppercase opacity-60 ml-1">{t(locale, "noteOptional") || "Qeyd / Mesaj (İstəyə bağlı)"}</Label>
                        <textarea 
                          className="flex min-h-[80px] w-full rounded-xl border-none bg-secondary/10 px-3 py-2 text-sm shadow-inner placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none" 
                          placeholder={t(locale, "guestMessagePlaceholder") || "Qonağa xüsusi mesajınız..."}
                          value={form.note} 
                          onChange={e => setForm({...form, note: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>
                )}

                {bookingType === "block" && (
                  <div className="py-8 text-center text-muted-foreground font-medium border-2 border-dashed rounded-2xl bg-secondary/10 border-border/50">
                    <p>{t(locale, "blockInfo") || "Seçdiyiniz biletlər sistemdən çıxarılacaq və satışa qapalı olacaq."}</p>
                    <p className="text-xs mt-2 opacity-60">{t(locale, "noGuestDataNeeded") || "Qonaq məlumatlarına ehtiyac yoxdur."}</p>
                  </div>
                )}

                <Separator className="my-2" />
                
                <div className="flex gap-3 mt-2">
                  <Button variant="outline" className="flex-1 h-14 rounded-xl font-bold" onClick={() => setStep(1)}>{t(locale, "goBack") || "Geri qayıt"}</Button>
                  <Button 
                    className="flex-[2] h-14 rounded-xl font-black uppercase tracking-widest shadow-lg" 
                    onClick={handleAdminBooking}
                    disabled={loading || !isFormValid}
                  >
                    {loading ? <Loader2 className="animate-spin" /> : (bookingType === "invite" && inviteMethod === "email" ? (t(locale, "confirmAndSend") || "Təsdiqlə və Göndər") : (t(locale, "confirm") || "Təsdiqlə"))}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95">
                <CheckCircle2 className="w-20 h-20 text-green-500 mb-6" />
                <h3 className="text-2xl font-black uppercase tracking-tight">{t(locale, "operationSuccess") || "ƏMƏLİYYAT UĞURLUDUR"}</h3>
                {bookingType === "invite" ? (
                  inviteMethod === "download" ? (
                    <p className="text-muted-foreground font-medium mt-2 max-w-sm">{t(locale, "pdfDownloaded") || "Dəvətnamələr PDF formatında kompüterinizə yükləndi."}</p>
                  ) : (
                    <p className="text-muted-foreground font-medium mt-2 max-w-sm">{t(locale, "emailSentSuccess") || "Dəvətnamə qonağın e-poçt ünvanına uğurla göndərildi!"}</p>
                  )
                ) : (
                  <p className="text-muted-foreground font-medium mt-2 max-w-sm">{t(locale, "seatsBlockedSuccess") || "Seçilmiş biletlər satışdan uğurla çıxarıldı."}</p>
                )}
                <Button size="lg" className="mt-10 px-12 rounded-xl font-black h-12 shadow-lg" onClick={() => { onSuccess(); onClose(); }}>{t(locale, "finish") || "Bitir"}</Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* КАСТОМНЫЙ ПОПАП ДЛЯ ПОДТВЕРЖДЕНИЯ ОТМЕНЫ */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in">
          <Card className="max-w-sm w-full p-6 flex flex-col items-center text-center shadow-2xl border-border/50 rounded-3xl mx-4 animate-in zoom-in-95">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
            <h3 className="text-xl font-bold mb-2">{t(locale, "attention") || "Diqqət!"}</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {t(locale, "confirmUnblockMultiple") || "Seçilmiş yerlərin bronunu ləğv etmək istədiyinizə əminsiniz?"}
            </p>
            <div className="flex gap-3 w-full">
              <Button variant="outline" className="flex-1 rounded-xl font-bold" onClick={() => setShowConfirmModal(false)} disabled={loading}>
                {t(locale, "cancel") || "İmtina"}
              </Button>
              <Button variant="destructive" className="flex-1 rounded-xl font-bold" onClick={executeUnblockMultiple} disabled={loading}>
                {loading ? <Loader2 className="animate-spin" /> : (t(locale, "yesUnblock") || "Bəli, ləğv et")}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  )
}