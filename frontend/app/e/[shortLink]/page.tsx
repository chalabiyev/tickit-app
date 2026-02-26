"use client"

import { useEffect, useState, useMemo } from "react"
import { useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { 
  CalendarDays, MapPin, Clock, Ticket, AlertCircle, Loader2, Info, 
  X, Plus, Minus, User, Mail, CreditCard, ArrowLeft
} from "lucide-react"
import { cn } from "@/lib/utils"

const DEFAULT_COVER = "https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1200&h=400&fit=crop"
const GRID = 36; 

function PublicSeatMap({ event, selectedSeats, onToggleSeat }: any) {
  const config = event.seatMapConfig || { stageRect: { x: -100, y: -150, w: 200, h: 50 }, rowLabelType: 'letters' };
  const stageRect = config.stageRect;

  const bounds = useMemo(() => {
    if (!event.seats || event.seats.length === 0) return null;
    const rows = event.seats.map((s: any) => Number(s.row));
    const cols = event.seats.map((s: any) => Number(s.col));
    const uniqueRows = Array.from(new Set(rows)).sort((a: any, b: any) => a - b);
    return { 
      minR: Math.min(...rows), maxR: Math.max(...rows),
      minC: Math.min(...cols), maxC: Math.max(...cols),
      sortedRows: uniqueRows
    };
  }, [event.seats]);

  if (!bounds) return null;

  const actualGridWidth = (bounds.maxC - bounds.minC + 1) * GRID;
  const actualGridHeight = (bounds.maxR - bounds.minR + 1) * GRID;
  const offsetX = -bounds.minC * GRID;
  const offsetY = -bounds.minR * GRID;

  const rowLabels: Record<number, string> = {}
  bounds.sortedRows.forEach((r: any, i: number) => {
    if (config.rowLabelType === 'letters') {
      let label = ''; let n = i; while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }; rowLabels[r] = label
    } else { rowLabels[r] = (i + 1).toString() }
  })

  return (
    <div className="flex flex-col gap-4 w-full h-full">
      <div className="flex flex-wrap gap-3 justify-center bg-secondary/20 p-3 rounded-xl border shrink-0">
        {event.tiers?.map((tier: any) => (
          <div key={tier._safeId} className="flex items-center gap-1.5 text-xs font-medium">
            <div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} />
            <span>{tier.name} ({tier.price} AZN)</span>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-auto bg-secondary/10 rounded-xl border shadow-inner p-8 custom-scrollbar flex items-center justify-center">
        <div className="relative" style={{ width: actualGridWidth, height: actualGridHeight, marginTop: 60 }}>
          <div 
            className="absolute bg-muted/80 backdrop-blur border-2 border-border text-foreground font-black tracking-[0.3em] text-[10px] rounded-lg flex items-center justify-center shadow-sm z-20"
            style={{ left: '50%', transform: 'translateX(-50%)', top: -60, width: stageRect.w, height: stageRect.h }}
          >STAGE</div>

          {bounds.sortedRows.map((r: any) => (
            <div key={`lbl-${r}`} style={{ position: 'absolute', top: (r * GRID) + offsetY + (GRID/2), left: -30, transform: 'translate(0, -50%)' }} className="text-[11px] text-muted-foreground font-mono font-bold select-none pointer-events-none">
              {rowLabels[r]}
            </div>
          ))}

          {event.seats?.map((seat: any) => {
            const tier = event.tiers?.find((t: any) => String(t._safeId) === String(seat.tierId));
            const isSelected = selectedSeats.includes(`${seat.row}-${seat.col}`);
            const seatColor = tier ? tier.color : '#94a3b8'; 

            return (
              <button
                type="button"
                key={`${seat.row}-${seat.col}`}
                onClick={() => tier && onToggleSeat(`${seat.row}-${seat.col}`)}
                style={{ 
                  position: 'absolute', top: (seat.row * GRID) + offsetY, left: (seat.col * GRID) + offsetX,
                  width: GRID - 4, height: GRID - 4,
                  backgroundColor: isSelected ? '#ffffff' : seatColor,
                  color: isSelected ? '#000000' : '#ffffff',
                  boxShadow: isSelected ? `0 0 0 3px ${seatColor}` : 'none'
                }}
                className={cn("rounded-md flex items-center justify-center text-[9px] font-bold transition-all shadow-sm", isSelected ? "scale-110 z-10" : "hover:scale-110", !tier && "opacity-20")}
              >
                {seat.col - bounds.minC + 1}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function PublicEventPage() {
  const params = useParams()
  const shortLink = params.shortLink as string
  const [mounted, setMounted] = useState(false)
  const [event, setEvent] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<1 | 2>(1) 
  const [cart, setCart] = useState<Record<string, number>>({})
  const [selectedSeats, setSelectedSeats] = useState<string[]>([])
  const [buyerInfo, setBuyerInfo] = useState({ firstName: "", lastName: "", email: "" })
  const [isProcessing, setIsProcessing] = useState(false)

  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/v1/events/s/${shortLink}`)
        if (!res.ok) throw new Error("Event not found")
        const data = await res.json()

        if (data.tiers && data.seats) {
          const seatTierIds = Array.from(new Set(data.seats.map((s: any) => String(s.tierId)).filter(Boolean)));
          data.tiers = data.tiers.map((tier: any, index: number) => ({
            ...tier,
            _safeId: String(seatTierIds[index] || tier.tierId || tier.id)
          }));
        }
        setEvent(data)
      } catch (err: any) { setError(err.message) } 
      finally { setLoading(false) }
    }
    if (shortLink && mounted) fetchEvent()
  }, [shortLink, mounted])

  const toggleSeat = (seatKey: string) => {
    setSelectedSeats(prev => prev.includes(seatKey) ? prev.filter(k => k !== seatKey) : [...prev, seatKey])
  }

  const isReserved = event?.isReservedSeating
  const totalTickets = isReserved ? selectedSeats.length : Object.values(cart).reduce((a, b) => a + b, 0)
  const totalPrice = isReserved
    ? selectedSeats.reduce((sum, seatKey) => {
        const [r, c] = seatKey.split('-').map(Number)
        const seatData = event.seats.find((s: any) => s.row === r && s.col === c)
        const tier = event.tiers.find((t: any) => String(t._safeId) === String(seatData?.tierId))
        return sum + (tier ? tier.price : 0)
      }, 0)
    : event?.tiers?.reduce((sum: number, tier: any) => sum + (tier.price * (cart[tier._safeId] || 0)), 0) || 0

  if (!mounted) return null;
  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>
  if (error || !event) return <div className="min-h-screen flex items-center justify-center text-destructive">{error}</div>

  const minPrice = event.tiers?.length > 0 ? Math.min(...event.tiers.map((t: any) => t.price)) : 0

  return (
    <div className="min-h-screen bg-background pb-20 relative">
      <div className="w-full h-[40vh] md:h-[50vh] relative overflow-hidden bg-secondary/20">
        <img src={event.coverImageUrl ? `http://localhost:8080${event.coverImageUrl}` : DEFAULT_COVER} className="w-full h-full object-cover" crossOrigin="anonymous"/>
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="max-w-5xl mx-auto px-4 -mt-24 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <div className="flex-1 flex flex-col gap-6">
            <h1 className="text-4xl md:text-5xl font-black">{event.title}</h1>
            <Card className="p-6 flex flex-col sm:flex-row gap-12 bg-card/50 backdrop-blur-md">
              <div className="flex items-center gap-4"><CalendarDays className="text-primary" /><div><div className="font-bold">{event.eventDate}</div><div className="text-sm text-muted-foreground">{event.startTime}</div></div></div>
              <div className="flex items-center gap-4"><MapPin className="text-primary" /><div><div className="font-bold">{event.venueName}</div><div className="text-sm text-muted-foreground">{event.address}</div></div></div>
            </Card>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{event.description}</p>
          </div>

          <Card className="w-full lg:w-[380px] p-6 shadow-2xl sticky top-8">
            <div className="text-center mb-6"><div className="text-sm text-muted-foreground uppercase font-black">Tickets from</div><div className="text-4xl font-black">{minPrice} AZN</div></div>
            <Separator className="mb-6" />
            <div className="flex flex-col gap-3 mb-6">
              {event.tiers?.map((tier: any) => (
                <div key={tier._safeId} className="flex items-center justify-between p-3 rounded-xl border bg-secondary/10">
                  <div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: tier.color }} />{tier.name}</div>
                  <div className="font-bold">{tier.price} AZN</div>
                </div>
              ))}
            </div>
            <Button size="lg" className="w-full h-14 font-black text-lg" onClick={() => setIsCheckoutOpen(true)}>Get Tickets</Button>
          </Card>
        </div>
      </div>

      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/90 backdrop-blur-xl p-4">
          <div className={cn("bg-card w-full border rounded-[2rem] shadow-2xl flex flex-col", isReserved && checkoutStep === 1 ? "max-w-4xl h-[85vh]" : "max-w-lg")}>
            <div className="p-6 border-b flex justify-between items-center">
              <h2 className="text-xl font-black">{checkoutStep === 1 ? "Select Seats" : "Buyer Details"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsCheckoutOpen(false)}><X /></Button>
            </div>
            <div className="p-6 overflow-y-auto flex-1">
              {checkoutStep === 1 ? <PublicSeatMap event={event} selectedSeats={selectedSeats} onToggleSeat={toggleSeat} /> : 
                <div className="flex flex-col gap-4">
                  <Input placeholder="First Name" value={buyerInfo.firstName} onChange={e => setBuyerInfo({...buyerInfo, firstName: e.target.value})} />
                  <Input placeholder="Last Name" value={buyerInfo.lastName} onChange={e => setBuyerInfo({...buyerInfo, lastName: e.target.value})} />
                  <Input placeholder="Email" value={buyerInfo.email} onChange={e => setBuyerInfo({...buyerInfo, email: e.target.value})} />
                </div>
              }
            </div>
            <div className="p-6 border-t flex justify-between items-center">
              <div className="text-2xl font-black">{totalPrice} AZN</div>
              {checkoutStep === 1 ? <Button onClick={() => setCheckoutStep(2)} disabled={totalTickets === 0}>Next</Button> : <Button className="bg-green-600">Pay Now</Button>}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}