"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Upload, Plus, Trash2, QrCode,
  CalendarDays, CreditCard, Search, Monitor, Lock, Globe, Clock,
  CheckCircle2, Copy, Share2, Eraser, Hand, ZoomIn, ZoomOut, Focus,
  AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

import { TicketDesignEditor, type TicketDesign } from "./TicketDesignEditor"

interface CreateEventWizardProps { onBack: () => void }
interface TicketTier { id: number | string; name: string; price: number; quantity: number; color: string }

const STEPS = ["mainInfo", "ticketTypes", "places", "ticketDesign", "preview", "payment", "success"] as const
const categories = ["concert", "conference", "workshop", "sports", "theater", "exhibition", "other"] as const
const ageRestrictions = ["0+", "12+", "16+", "18+"] as const
const TICKET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

function calculatePlatformFee(capacity: number): number {
  if (capacity <= 10) return 0
  if (capacity <= 50) return 5
  if (capacity <= 100) return 10
  if (capacity <= 200) return 15
  return 15
}

function StepIndicator({ currentStep, steps }: { currentStep: number; steps: readonly string[] }) {
  const { locale } = useLocale()
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {steps.map((step, index) => (
        <div key={step} className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <div className={cn("flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium transition-colors", index < currentStep ? "bg-primary text-primary-foreground" : index === currentStep ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>{index < currentStep ? <Check className="h-4 w-4" /> : index + 1}</div>
            <span className={cn("hidden text-sm font-medium xl:inline", index === currentStep ? "text-foreground" : "text-muted-foreground")}>{t(locale, step) || step}</span>
          </div>
          {index < steps.length - 1 && <div className={cn("h-px w-4 sm:w-8", index < currentStep ? "bg-primary" : "bg-border")} />}
        </div>
      ))}
    </div>
  )
}

const GRID = 32;

function SeatMapGrid({ tiers, seatMap, setSeatMap, config, setConfig }: any) {
  const { locale } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState<string | 'add' | 'eraser' | 'pan'>('add')
  const [tempRows, setTempRows] = useState("5")
  const [tempCols, setTempCols] = useState("10")
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  const [isDraggingStage, setIsDraggingStage] = useState(false)
  const [resizingHandle, setResizingHandle] = useState<string | null>(null)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [lastDrawnCell, setLastDrawnCell] = useState<{r: number, c: number} | null>(null)

  const { stageRect, rowLabelType } = config

  const updateStageRect = (updater: any) => {
    setConfig((prev: any) => ({ ...prev, stageRect: typeof updater === 'function' ? updater(prev.stageRect) : updater }))
  }

  const generateGrid = useCallback(() => {
    const rCount = parseInt(tempRows) || 5
    const cCount = parseInt(tempCols) || 10
    const newMap: Record<string, { r: number; c: number; tierId: string | null }> = {}
    const startR = -Math.floor(rCount / 2)
    const startC = -Math.floor(cCount / 2)
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        const row = startR + r
        const col = startC + c
        newMap[`${row}-${col}`] = { r: row, c: col, tierId: null }
      }
    }
    setSeatMap(newMap)
    setZoom(1)
    setPan({ x: 0, y: 0 })
    updateStageRect({ x: -100, y: (startR * GRID) - 80, w: 200, h: 50 })
  }, [tempRows, tempCols, setSeatMap, setConfig])

  useEffect(() => { if (Object.keys(seatMap).length === 0) generateGrid() }, [generateGrid, seatMap])

  const getGridCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { r: 0, c: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = (clientX - rect.left - rect.width / 2 - pan.x) / zoom
    const y = (clientY - rect.top - rect.height / 2 - pan.y) / zoom
    return { c: Math.round(x / GRID), r: Math.round(y / GRID) }
  }

  const applyTool = useCallback((r: number, c: number) => {
    const id = `${r}-${c}`
    setSeatMap((prev: any) => {
      const next = { ...prev }
      if (activeTool === 'eraser') delete next[id]
      else if (activeTool === 'add') { if (!next[id]) next[id] = { r, c, tierId: null } } 
      else if (activeTool !== 'pan') { if (next[id]) next[id] = { ...next[id], tierId: activeTool as string } }
      return next
    })
  }, [activeTool, setSeatMap])

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    if (target.dataset.handle) { setResizingHandle(target.dataset.handle); setLastPos({ x: e.clientX, y: e.clientY }); containerRef.current?.setPointerCapture(e.pointerId); return }
    if (target.id === 'stage-drag-area') { setIsDraggingStage(true); setLastPos({ x: e.clientX, y: e.clientY }); containerRef.current?.setPointerCapture(e.pointerId); return }
    if (e.button === 1 || activeTool === 'pan') { setIsPanning(true); setLastPos({ x: e.clientX, y: e.clientY }); containerRef.current?.setPointerCapture(e.pointerId); return }
    setIsDrawing(true)
    const { r, c } = getGridCoords(e.clientX, e.clientY)
    applyTool(r, c)
    setLastDrawnCell({ r, c })
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (resizingHandle) {
      const dx = (e.clientX - lastPos.x) / zoom; const dy = (e.clientY - lastPos.y) / zoom
      updateStageRect((prev: any) => {
        let { x, y, w, h } = prev
        if (resizingHandle.includes('e')) w = Math.max(60, w + dx)
        if (resizingHandle.includes('s')) h = Math.max(30, h + dy)
        if (resizingHandle.includes('w')) { const dw = Math.min(w - 60, dx); x += dw; w -= dw; }
        if (resizingHandle.includes('n')) { const dh = Math.min(h - 30, dy); y += dh; h -= dh; }
        return { x, y, w, h }
      })
      setLastPos({ x: e.clientX, y: e.clientY })
    } else if (isDraggingStage) {
      const dx = (e.clientX - lastPos.x) / zoom; const dy = (e.clientY - lastPos.y) / zoom
      updateStageRect((p: any) => ({ ...p, x: p.x + dx, y: p.y + dy })); setLastPos({ x: e.clientX, y: e.clientY })
    } else if (isPanning) {
      const dx = e.clientX - lastPos.x; const dy = e.clientY - lastPos.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy })); setLastPos({ x: e.clientX, y: e.clientY })
    } else if (isDrawing) {
      const { r, c } = getGridCoords(e.clientX, e.clientY)
      if (!lastDrawnCell || lastDrawnCell.r !== r || lastDrawnCell.c !== c) { applyTool(r, c); setLastDrawnCell({ r, c }) }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false); setIsPanning(false); setIsDraggingStage(false); setResizingHandle(null); setLastDrawnCell(null)
    if (containerRef.current?.hasPointerCapture(e.pointerId)) containerRef.current.releasePointerCapture(e.pointerId)
  }

  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => { e.preventDefault(); const delta = e.deltaY > 0 ? -0.05 : 0.05; setZoom(z => Math.max(0.2, Math.min(3, z + delta))) }
    el.addEventListener('wheel', onWheel, { passive: false }); return () => el.removeEventListener('wheel', onWheel)
  }, [])

  const seatsArray: any[] = Object.values(seatMap)
  const rowKeys = Array.from(new Set(seatsArray.map(s => s.r))).sort((a, b) => a - b)
  const minCol = seatsArray.length > 0 ? Math.min(...seatsArray.map(s => s.c)) : 0

  const rowLabels: Record<number, string> = {}
  rowKeys.forEach((r, i) => {
    if (rowLabelType === 'letters') {
      let label = ''; let n = i; while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }; rowLabels[r] = label
    } else { rowLabels[r] = (i + 1).toString() }
  })

  const seatLabels: Record<string, number> = {}
  rowKeys.forEach(r => {
    const seatsInRow = seatsArray.filter(s => s.r === r).sort((a, b) => a.c - b.c)
    seatsInRow.forEach((s, idx) => { seatLabels[`${s.r}-${s.c}`] = idx + 1 })
  })

  const assignedCount = seatsArray.filter(s => s.tierId).length

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-secondary/30 p-3 rounded-lg border border-border/50">
        <div className="flex items-center gap-1">
          <Button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button onClick={() => setZoom(z => Math.min(3, z + 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); updateStageRect((p:any) => ({ ...p, x: -100, y: -150 })) }} variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground"><Focus className="h-3.5 w-3.5" /> Center</Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">Rows</span>
            <Select value={rowLabelType} onValueChange={(v) => setConfig((p:any)=>({...p, rowLabelType: v}))}>
              <SelectTrigger className="h-6 w-[80px] px-1 py-0 text-xs border-none focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="letters" className="text-xs">A, B, C</SelectItem>
                <SelectItem value="numbers" className="text-xs">1, 2, 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">Grid</span>
            <Input type="number" value={tempRows} onChange={e => setTempRows(e.target.value)} className="w-9 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" />
            <span className="text-xs text-muted-foreground">x</span>
            <Input type="number" value={tempCols} onChange={e => setTempCols(e.target.value)} className="w-9 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" />
          </div>
          <Button onClick={generateGrid} size="sm" variant="secondary" className="h-8 shadow-sm">{t(locale, "generate") || "Generate"}</Button>
          <Button onClick={() => setSeatMap({})} size="sm" variant="destructive" className="h-8 px-2.5 shadow-sm"><Trash2 className="h-4 w-4" /></Button>
        </div>
      </div>

      <div 
        ref={containerRef}
        className="relative w-full h-[600px] border border-border/60 rounded-xl overflow-hidden bg-background shadow-inner cursor-crosshair"
        style={{ touchAction: 'none' }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}
      >
        <div className="absolute top-1/2 left-1/2" style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: '0 0' }}>
          <div className="absolute pointer-events-none opacity-20" style={{ left: -5000, top: -5000, width: 10000, height: 10000, backgroundImage: `radial-gradient(circle at center, currentColor 1.5px, transparent 1.5px)`, backgroundSize: `${GRID}px ${GRID}px`, backgroundPosition: `center center`, zIndex: 0 }} />
          <div style={{ position: 'absolute', left: stageRect.x, top: stageRect.y, width: stageRect.w, height: stageRect.h, zIndex: 10 }} className="bg-muted/80 backdrop-blur border-2 border-border text-foreground font-black tracking-[0.3em] text-sm rounded-xl select-none flex items-center justify-center group hover:border-primary/50 transition-colors shadow-lg">
            <div id="stage-drag-area" className="absolute inset-0 cursor-move" />
            <span className="pointer-events-none">STAGE</span>
            {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
              <div key={handle} data-handle={handle} className={cn("absolute bg-background border-2 border-primary w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm", handle === 'nw' && "-top-1.5 -left-1.5 cursor-nwse-resize", handle === 'ne' && "-top-1.5 -right-1.5 cursor-nesw-resize", handle === 'sw' && "-bottom-1.5 -left-1.5 cursor-nesw-resize", handle === 'se' && "-bottom-1.5 -right-1.5 cursor-nwse-resize", handle === 'n' && "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", handle === 's' && "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", handle === 'e' && "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize", handle === 'w' && "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" )} />
            ))}
          </div>

          {rowKeys.map(r => (
            <div key={`lbl-${r}`} style={{ position: 'absolute', top: r * GRID, left: (minCol * GRID) - 40, transform: 'translate(0, -50%)' }} className="text-[11px] text-muted-foreground font-mono font-bold select-none pointer-events-none">{rowLabels[r]}</div>
          ))}

          <div style={{ zIndex: 20, position: 'relative' }}>
            {seatsArray.map(seat => {
              const tier: any = tiers.find((t: any) => String(t.id) === String(seat.tierId))
              return (
                <div 
                  key={`${seat.r}-${seat.c}`}
                  style={{ position: 'absolute', top: seat.r * GRID, left: seat.c * GRID, transform: 'translate(-50%, -50%)', width: 22, height: 22, backgroundColor: tier ? tier.color : 'var(--secondary)', color: tier ? '#fff' : 'inherit' }}
                  className={cn("rounded-md flex items-center justify-center text-[9px] font-bold select-none transition-transform hover:scale-110 shadow-sm", !tier && "bg-secondary border border-border/50 text-muted-foreground")}
                >
                  {seatLabels[`${seat.r}-${seat.c}`]}
                </div>
              )
            })}
          </div>
        </div>

        <div className="absolute top-4 left-4 bg-background/80 backdrop-blur p-3 rounded-xl border border-border shadow-sm flex flex-col gap-1 pointer-events-none">
           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">Stats</span>
           <span className="text-sm font-medium">Total Seats: <span className="font-bold">{seatsArray.length}</span></span>
           <span className="text-sm font-medium text-primary">Assigned: <span className="font-bold">{assignedCount}</span></span>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-background/95 backdrop-blur-md border border-border/60 rounded-full shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => setActiveTool('pan')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'pan' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')} title="Pan Canvas"><Hand className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => setActiveTool('add')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'add' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')} title="Add Unassigned Seat"><Plus className="h-4 w-4" /></button>
          <button onClick={() => setActiveTool('eraser')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'eraser' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted text-muted-foreground')} title="Erase Seat"><Eraser className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-1.5 px-2">
            {tiers.map((tier: any) => (
              <button 
                key={tier.id} onClick={() => setActiveTool(tier.id.toString())}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform", activeTool === tier.id.toString() ? "scale-105 shadow-md ring-2 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100 border border-border bg-background")}
                // ИСПРАВЛЕНИЕ: boxShadow вместо ringColor
                style={activeTool === tier.id.toString() 
                  ? { backgroundColor: tier.color, color: '#fff', boxShadow: `0 0 0 2px ${tier.color}` } 
                  : { color: tier.color }
                }              >
                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} />
                {tier.name || 'Tier'}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function MobileTicketMockup({ eventName, location, date, startTime }: any) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="bg-primary px-5 py-4 text-center"><span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/80">Tickit Pass</span></div>
        <div className="flex flex-col items-center gap-3 px-5 py-8">
          <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-secondary border border-border/50"><QrCode className="h-24 w-24 text-foreground opacity-80" /></div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mt-2">TKT-2026-XXXX</span>
        </div>
        <div className="relative">
          <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background border-r border-border" />
          <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background border-l border-border" />
          <Separator className="border-dashed border-border/60 mx-4" />
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-6 pb-8 bg-secondary/5">
          <h3 className="text-base font-bold text-foreground leading-tight text-balance">{eventName || "My Awesome Event"}</h3>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium"><MapPin className="h-4 w-4 shrink-0 text-primary/70 mt-0.5" /><span className="line-clamp-2 leading-relaxed">{location || "Venue Address"}</span></div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium"><CalendarDays className="h-4 w-4 shrink-0 text-primary/70" /><span>{date || "Event Date"} {startTime && `• ${startTime}`}</span></div>
        </div>
      </div>
    </div>
  )
}

export function CreateEventWizard({ onBack }: CreateEventWizardProps) {
  const { locale } = useLocale()
  const [currentStep, setCurrentStep] = useState(0)

  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })
  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const fileInputRef = useRef<HTMLInputElement>(null)
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)

  const [eventTitle, setEventTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("")
  const [eventDate, setEventDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isPhysical, setIsPhysical] = useState(true)
  const [venueName, setVenueName] = useState("")
  const [address, setAddress] = useState("")
  const [isPrivate, setIsPrivate] = useState(false)
  const [ageRestriction, setAgeRestriction] = useState("0+")

  const [tiers, setTiers] = useState<TicketTier[]>([
    { id: "tier-1", name: "VIP", price: 100, quantity: 20, color: TICKET_COLORS[0] },
    { id: "tier-2", name: "Standard", price: 30, quantity: 80, color: TICKET_COLORS[1] },
  ])

  const [isReservedSeating, setIsReservedSeating] = useState(false)
  const [seatMapData, setSeatMapData] = useState<Record<string, { r: number; c: number; tierId: string | null }>>({})
  
  const [seatMapConfig, setSeatMapConfig] = useState({
    stageRect: { x: -100, y: -150, w: 200, h: 50 },
    rowLabelType: 'letters' as 'letters' | 'numbers'
  })

  const [ticketDesign, setTicketDesign] = useState<TicketDesign>({
    bgColor: "#121212", bgImage: null, bgOverlay: 0,
    elements: [
      { id: 'qr-1', type: 'qr', x: 100, y: 380, content: 'QR_CODE', color: '#ffffff', fontSize: 120, fontWeight: 'normal' },
      { id: 't-1', type: 'text', x: 20, y: 40, content: '{{Event_Name}}', color: '#ffffff', fontSize: 28, fontWeight: 'bold', fontFamily: 'sans', textAlign: 'left' },
      { id: 't-2', type: 'text', x: 20, y: 85, content: '{{Event_Date}} • {{Location}}', color: '#a1a1aa', fontSize: 12, fontWeight: 'normal', fontFamily: 'sans', textAlign: 'left' },
      { id: 't-3', type: 'text', x: 20, y: 150, content: '{{Guest_Name}}', color: '#ffffff', fontSize: 20, fontWeight: 'normal', fontFamily: 'mono', textAlign: 'left' },
      { id: 't-4', type: 'text', x: 20, y: 180, content: '{{Ticket_Type}}', color: '#3b82f6', fontSize: 16, fontWeight: 'bold', fontFamily: 'sans', textAlign: 'left' },
    ]
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState("")
  const [stepError, setStepError] = useState("") 
  const [generatedLink, setGeneratedLink] = useState("")

  const derivedCapacity = tiers.reduce((sum, tier) => sum + (Number(tier.quantity) || 0), 0)
  const ticketRevenue = tiers.reduce((sum, tier) => sum + (Number(tier.price) || 0) * (Number(tier.quantity) || 0), 0)
  const platformFee = calculatePlatformFee(derivedCapacity)

  const addTier = () => {
    const nextColor = TICKET_COLORS[tiers.length % TICKET_COLORS.length]
    setTiers((prev) => [...prev, { id: `tier-${Date.now()}`, name: "", price: 0, quantity: 0, color: nextColor }])
  }

  const removeTier = (id: string | number) => setTiers((prev) => prev.filter((tier) => tier.id !== id))
  const updateTier = (id: string | number, field: keyof TicketTier, value: string | number) => {
    setTiers((prev) => prev.map((tier) => (tier.id === id ? { ...tier, [field]: value } : tier)))
  }

  const handleNextStep = () => {
    setStepError(""); 
    if (currentStep === 0) {
      if (!eventTitle.trim()) return setStepError(t(locale, "errTitleReq") || "Please enter an Event Title.");
      if (!description.trim()) return setStepError(t(locale, "errDescReq") || "Please enter a Description.");
      if (!category) return setStepError(t(locale, "errCatReq") || "Please select a Category.");
      if (!eventDate) return setStepError(t(locale, "errDateReq") || "Please select the Event Date.");
      if (!startTime) return setStepError(t(locale, "errStartReq") || "Please select the Start Time.");
      if (!endTime) return setStepError(t(locale, "errEndReq") || "Please select the End Time.");
      if (isPhysical) {
        if (!venueName.trim()) return setStepError(t(locale, "errVenueReq") || "Please enter the Venue Name.");
        if (!address.trim()) return setStepError(t(locale, "errAddrReq") || "Please enter the Address.");
      }
    }
    if (currentStep === 1) {
      if (tiers.length === 0) return setStepError("You must create at least one ticket tier.");
      const hasInvalidTier = tiers.some(t => !t.name.trim() || t.price < 0 || t.quantity < 1);
      if (hasInvalidTier) return setStepError("Please ensure all ticket tiers have a name, a valid price, and quantity of at least 1.");
    }
    setCurrentStep((s) => s + 1);
  }

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsUploading(true); const formData = new FormData(); formData.append("file", file)
    try {
      const token = localStorage.getItem("tickit_token") || ""
      const response = await fetch("http://72.60.135.9:8080/api/v1/upload/image", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData })
      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json(); setCoverImageUrl(`http://72.60.135.9:8080${data.url}`)
    } catch (error) { showToast("Şəkil yüklənə bilmədi / Error uploading image", "error") } 
    finally { setIsUploading(false) }
  }

  const submitEvent = async () => {
    setIsSubmitting(true); setErrorMessage("")
    const formattedSeats = Object.values(seatMapData).filter(seat => seat.tierId !== null).map(seat => ({ row: seat.r, col: seat.c, tierId: seat.tierId }))
    const formattedStartTime = startTime.length === 5 ? `${startTime}:00` : startTime;
    const formattedEndTime = endTime.length === 5 ? `${endTime}:00` : endTime;

    const payload = {
      title: eventTitle, description: description, category: category, ageRestriction: ageRestriction,
      eventDate: eventDate, startTime: formattedStartTime, endTime: formattedEndTime,
      isPhysical: isPhysical, venueName: isPhysical ? venueName : null, address: isPhysical ? address : null,
      isPrivate: isPrivate, coverImageUrl: coverImageUrl,
      tiers: tiers.map(t => ({ id: t.id.toString(), name: t.name, price: t.price, quantity: t.quantity, color: t.color })),
      isReservedSeating: isReservedSeating, seats: isReservedSeating ? formattedSeats : [],
      seatMapConfig: seatMapConfig, 
      ticketDesign: ticketDesign 
    }

    try {
      const token = localStorage.getItem("tickit_token") || ""
      const response = await fetch("http://72.60.135.9:8080/api/v1/events", {
        method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify(payload)
      })
      if (!response.ok) { const errorData = await response.json().catch(() => null); throw new Error(errorData?.message || "Failed to create event. Server rejected the payload.") }
      const data = await response.json()
      setGeneratedLink(`tickit.az/e/${data.shortLink}`)
      setCurrentStep(6) 
    } catch (error: any) { console.error(error); setErrorMessage(error.message) } 
    finally { setIsSubmitting(false) }
  }

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full relative">
      {currentStep < 6 && (
        <div className="flex flex-col gap-4">
          <Button variant="ghost" size="sm" className="gap-1.5 self-start text-muted-foreground -ml-2 hover:bg-secondary" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" /> {t(locale, "backToEvents") || "Back to Events"}
          </Button>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <h1 className="text-2xl font-bold tracking-tight text-foreground whitespace-nowrap">{t(locale, "createNewEvent") || "Create New Event"}</h1>
            <StepIndicator currentStep={currentStep} steps={STEPS} />
          </div>
        </div>
      )}

      <Card className="border-border/60 shadow-md overflow-hidden bg-card/50 backdrop-blur-sm">
        <CardContent className="p-0 sm:p-8">
          <div className="p-5 sm:p-0">
            {currentStep === 0 && (
              <div className="flex flex-col gap-10 animate-in fade-in duration-300">
                <div className="flex flex-col gap-5">
                  <div className="flex flex-col gap-2.5"><Label className="text-sm font-semibold">{t(locale, "eventTitle") || "Event Title"} <span className="text-destructive">*</span></Label><Input placeholder={t(locale, "eventTitlePlaceholder")} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="max-w-2xl h-11 text-base" /></div>
                  <div className="flex flex-col gap-2.5"><Label className="text-sm font-semibold">{t(locale, "description") || "Description"} <span className="text-destructive">*</span></Label><Textarea placeholder={t(locale, "descriptionPlaceholder")} rows={5} value={description} onChange={(e) => setDescription(e.target.value)} className="max-w-2xl resize-none text-base" /></div>
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[250px]"><Label className="text-sm font-semibold">{t(locale, "category") || "Category"} <span className="text-destructive">*</span></Label><Select value={category} onValueChange={setCategory}><SelectTrigger className="h-11"><SelectValue placeholder={t(locale, "selectCategory")} /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{t(locale, cat) || cat}</SelectItem>))}</SelectContent></Select></div>
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[150px]"><Label className="text-sm font-semibold">{t(locale, "ageRestriction") || "Age Limit"} <span className="text-destructive">*</span></Label><Select value={ageRestriction} onValueChange={setAgeRestriction}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{ageRestrictions.map((age) => (<SelectItem key={age} value={age}>{age}</SelectItem>))}</SelectContent></Select></div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-5"><h3 className="text-base font-bold text-foreground">{t(locale, "dateTime") || "Date & Time"}</h3>
                  <div className="flex flex-wrap gap-5">
                    <div className="flex flex-col gap-2.5 flex-1 min-w-[160px] max-w-[220px]"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "date") || "Date"} <span className="text-destructive">*</span></Label><Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11" /></div>
                    <div className="flex flex-col gap-2.5 flex-1 min-w-[140px] max-w-[160px]"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "startTime") || "Start Time"} <span className="text-destructive">*</span></Label><div className="relative"><Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="time" className="pl-10 h-11" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div></div>
                    <div className="flex flex-col gap-2.5 flex-1 min-w-[140px] max-w-[160px]"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "endTime") || "End Time"} <span className="text-destructive">*</span></Label><div className="relative"><Clock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input type="time" className="pl-10 h-11" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div></div>
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                  <div className="flex flex-col gap-5 flex-1"><Label className="text-base font-bold">{t(locale, "location") || "Location"}</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      <button onClick={() => setIsPhysical(true)} className={cn("flex items-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold flex-1 min-w-[140px] justify-center transition-all", isPhysical ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40")}><MapPin className="h-5 w-5" />{t(locale, "physicalVenue") || "Physical Venue"}</button>
                      <button onClick={() => setIsPhysical(false)} className={cn("flex items-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold flex-1 min-w-[140px] justify-center transition-all", !isPhysical ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40")}><Monitor className="h-5 w-5" />{t(locale, "onlineEvent") || "Online Event"}</button>
                    </div>
                    {isPhysical && (<div className="flex flex-col gap-4 mt-2 animate-in fade-in slide-in-from-top-2"><div className="flex flex-col gap-2.5"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "venueName") || "Venue Name"} <span className="text-destructive">*</span></Label><Input className="h-11" value={venueName} onChange={(e) => setVenueName(e.target.value)} /></div><div className="flex flex-col gap-2.5"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "address") || "Address"} <span className="text-destructive">*</span></Label><div className="relative"><Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-10 h-11" value={address} onChange={(e) => setAddress(e.target.value)} /></div></div></div>)}
                  </div>
                  <div className="flex flex-col gap-5 flex-1"><Label className="text-base font-bold">{t(locale, "privacySettings") || "Privacy Settings"}</Label>
                    <Card className="border-2 border-border/60 bg-secondary/20 shadow-none"><CardContent className="p-5 flex flex-col gap-4"><div className="flex items-center justify-between gap-4"><div className="flex flex-col gap-1.5"><div className="flex items-center gap-2 font-bold text-sm">{isPrivate ? <Lock className="h-4 w-4 text-primary" /> : <Globe className="h-4 w-4 text-muted-foreground" />}{isPrivate ? t(locale, "privateEvent") || "Private Event" : t(locale, "publicEvent") || "Public Event"}</div><span className="text-xs text-muted-foreground leading-relaxed">{isPrivate ? "Only people with the link can see and buy tickets." : "Event will be listed on the main Tickit platform for everyone."}</span></div><Switch checked={isPrivate} onCheckedChange={setIsPrivate} className="scale-110" /></div></CardContent></Card>
                    <div className="flex flex-col gap-3 mt-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "media") || "Event Poster"}</Label><input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <div onClick={() => fileInputRef.current?.click()} className={cn("flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group", coverImageUrl ? "border-primary/50" : "border-border/80 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50", isUploading && "opacity-50 cursor-wait")}>
                        {isUploading ? (<div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse"><Upload className="h-5 w-5" /><span className="text-sm font-semibold">Uploading...</span></div>) : coverImageUrl ? (<><img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white font-semibold text-sm drop-shadow-md">Change Image</span></div></>) : (<div className="flex flex-col items-center gap-3 text-muted-foreground"><div className="p-3 bg-background rounded-full shadow-sm border"><Upload className="h-5 w-5 text-foreground" /></div><span className="text-sm font-semibold">{t(locale, "uploadCover") || "Upload Cover Image"}</span></div>)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div className="flex flex-col gap-1.5"><h3 className="text-lg font-bold text-foreground">{t(locale, "ticketTypes") || "Ticket Types"}</h3><p className="text-sm text-muted-foreground">Define what you are selling. Capacity is calculated automatically.</p></div>
                  <div className="flex flex-col items-end bg-background px-4 py-2 rounded-xl border shadow-sm"><span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">Total Capacity</span><span className="text-3xl font-black text-primary leading-none mt-1">{derivedCapacity}</span></div>
                </div>
                <div className="flex flex-col gap-5">
                  {tiers.map((tier) => (
                    <Card key={tier.id} className="border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-2.5 transition-all" style={{ backgroundColor: tier.color }} />
                      <CardContent className="p-5 pl-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                          <div className="flex flex-col gap-2 flex-1"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "tierName") || "Tier Name"} <span className="text-destructive">*</span></Label><Input className="h-11 font-medium text-base" value={tier.name} onChange={(e) => updateTier(tier.id, "name", e.target.value)} placeholder="e.g. VIP, Standard" /></div>
                          <div className="flex flex-col gap-2 w-full sm:w-24"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Color</Label><Select value={tier.color} onValueChange={(val) => updateTier(tier.id, "color", val)}><SelectTrigger className="h-11 px-4"><div className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: tier.color }} /></SelectTrigger><SelectContent className="min-w-0 w-auto p-3"><div className="grid grid-cols-4 gap-3">{TICKET_COLORS.map(c => (<button key={c} onClick={() => updateTier(tier.id, "color", c)} className="w-7 h-7 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2" style={{ backgroundColor: c }} />))}</div></SelectContent></Select></div>
                          <div className="flex flex-col gap-2 w-full sm:w-32"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "price") || "Price"} (AZN) <span className="text-destructive">*</span></Label><Input className="h-11 font-mono text-base" type="number" min={0} value={tier.price} onChange={(e) => updateTier(tier.id, "price", Number(e.target.value))} /></div>
                          <div className="flex flex-col gap-2 w-full sm:w-32"><Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "quantity") || "Quantity"} <span className="text-destructive">*</span></Label><Input className="h-11 font-mono text-base" type="number" min={1} value={tier.quantity} onChange={(e) => updateTier(tier.id, "quantity", Number(e.target.value))} /></div>
                          <Button variant="ghost" size="icon" className="h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 self-end transition-colors" onClick={() => removeTier(tier.id)} disabled={tiers.length <= 1}><Trash2 className="h-5 w-5" /></Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 gap-2 font-semibold text-foreground/80 mt-2" onClick={addTier}><Plus className="h-5 w-5" />{t(locale, "addTier") || "Add Another Ticket Type"}</Button>
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                {!isPhysical ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center border-2 rounded-2xl bg-secondary/20 border-dashed border-border/80"><div className="p-5 bg-background rounded-full shadow-sm border border-border mb-6"><Monitor className="h-10 w-10 text-primary/70" /></div><h3 className="text-xl font-bold text-foreground">Online Event</h3><p className="text-sm text-muted-foreground mt-2 max-w-sm text-balance">Online events do not require a physical seat map. Your capacity is ready.</p></div>
                ) : (
                  <><div className="flex flex-col gap-5"><Label className="text-base font-bold text-foreground">{t(locale, "seatingArrangement") || "Seating Arrangement"}</Label><div className="flex flex-wrap items-center gap-4"><button onClick={() => setIsReservedSeating(false)} className={cn("flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-4 text-sm font-semibold flex-1 min-w-[200px] transition-all", !isReservedSeating ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40")}>General Admission / Fan-zone</button><button onClick={() => setIsReservedSeating(true)} className={cn("flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-4 text-sm font-semibold flex-1 min-w-[200px] transition-all", isReservedSeating ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40")}>{t(locale, "reservedSeating") || "Reserved Seating Map"}</button></div></div>{isReservedSeating && (<div className="flex flex-col gap-6 animate-in slide-in-from-bottom-4 duration-500"><SeatMapGrid tiers={tiers} seatMap={seatMapData} setSeatMap={setSeatMapData} config={seatMapConfig} setConfig={setSeatMapConfig} /></div>)}</>
                )}
              </div>
            )}

            {currentStep === 3 && (
              <TicketDesignEditor design={ticketDesign} onChange={setTicketDesign} eventDetails={{ title: eventTitle, date: eventDate, location: isPhysical ? (venueName || address) : "Online Event" }} />
            )}

            {currentStep === 4 && (
              <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 animate-in fade-in duration-300">
                <div className="flex flex-col gap-6 mx-auto lg:mx-0 shrink-0 w-full max-w-[300px]"><h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center lg:text-left">Guest Preview</h3><MobileTicketMockup eventName={eventTitle} location={isPhysical ? (venueName || address) : "Online Event"} date={eventDate} startTime={startTime} /></div>
                <div className="flex-1 flex flex-col gap-8"><div className="flex items-center justify-between border-b pb-4"><h3 className="text-2xl font-bold text-foreground">Event Summary</h3><Badge variant={isPrivate ? "secondary" : "default"} className="px-3 py-1 text-xs">{isPrivate ? "Private" : "Public"}</Badge></div><div className="grid gap-5 sm:grid-cols-2"><div className="flex flex-col p-6 rounded-2xl border bg-card shadow-sm"><span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Total Capacity</span><span className="text-4xl font-black text-foreground">{derivedCapacity}</span></div><div className="flex flex-col p-6 rounded-2xl border bg-card shadow-sm"><span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Expected Revenue</span><span className="text-4xl font-black text-primary">{ticketRevenue} AZN</span></div></div><Card className="border-border/60 shadow-none bg-secondary/10"><CardHeader className="pb-4 px-6 pt-6"><CardTitle className="text-base font-bold uppercase tracking-wide text-muted-foreground">Ticket Tiers</CardTitle></CardHeader><CardContent className="px-6 pb-6"><div className="flex flex-col gap-4">{tiers.map((tier) => (<div key={tier.id} className="flex items-center justify-between text-base bg-background p-3.5 rounded-xl border shadow-sm"><div className="flex items-center gap-3"><div className="w-3 h-3 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} /><span className="font-bold text-foreground">{tier.name || "Unnamed"}</span><Badge variant="secondary" className="font-mono ml-2">{tier.quantity} seats</Badge></div><span className="font-bold text-muted-foreground">{tier.price} AZN</span></div>))}</div></CardContent></Card></div>
              </div>
            )}

            {currentStep === 5 && (
              <div className="flex flex-col gap-10 lg:flex-row lg:gap-14 animate-in fade-in duration-300">
                <div className="flex-1 flex flex-col gap-5"><h3 className="text-lg font-bold text-foreground">Platform Fee</h3><Card className="border-none bg-primary text-primary-foreground relative overflow-hidden shadow-xl"><div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" /><CardContent className="flex flex-col gap-6 p-8 relative z-10"><div className="flex flex-col gap-1"><span className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-widest">Fee for {derivedCapacity} seats</span><span className="text-6xl font-black mt-2">{platformFee === 0 ? "Free" : `${platformFee} AZN`}</span></div><Separator className="bg-primary-foreground/20 my-2" /><div className="flex flex-col gap-3 text-sm font-medium text-primary-foreground/90"><span className="uppercase tracking-wider text-xs font-bold text-primary-foreground/70 mb-1">Tickit Pricing Rules</span><div className="flex justify-between border-b border-primary-foreground/10 pb-2"><span>0 - 10 seats</span> <span>0 AZN</span></div><div className="flex justify-between border-b border-primary-foreground/10 pb-2"><span>11 - 50 seats</span> <span>5 AZN</span></div><div className="flex justify-between border-b border-primary-foreground/10 pb-2"><span>51 - 100 seats</span> <span>10 AZN</span></div><div className="flex justify-between"><span>101 - 200 seats</span> <span>15 AZN</span></div></div></CardContent></Card></div>
                <div className="flex-1 flex flex-col gap-5"><h3 className="text-lg font-bold text-foreground">Payment Method</h3><Card className="border-border/60 shadow-md"><CardContent className="p-8 flex flex-col gap-6">{platformFee === 0 ? (<div className="flex flex-col items-center justify-center py-10 text-center h-full"><div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5"><Check className="h-8 w-8 text-green-500" /></div><p className="text-xl font-bold text-foreground mb-2">No payment required</p><p className="text-sm text-muted-foreground max-w-[250px] leading-relaxed">Your event capacity is 10 seats or under, so publishing is completely free!</p></div>) : (<div className="flex flex-col gap-5"><div className="flex flex-col gap-2.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Cardholder Name</Label><Input placeholder="JOHN DOE" className="h-12 uppercase font-medium" /></div><div className="flex flex-col gap-2.5"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Card Number</Label><div className="relative"><CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input placeholder="0000 0000 0000 0000" className="pl-12 h-12 font-mono text-base" /></div></div><div className="flex gap-5"><div className="flex flex-col gap-2.5 flex-1"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Expiry</Label><Input placeholder="MM/YY" className="h-12 font-mono text-center text-base" /></div><div className="flex flex-col gap-2.5 flex-1"><Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CVC</Label><Input placeholder="123" type="password" maxLength={3} className="h-12 font-mono text-center text-base tracking-widest" /></div></div></div>)}</CardContent></Card></div>
              </div>
            )}

            {currentStep === 6 && (
              <div className="flex flex-col items-center justify-center py-16 text-center animate-in zoom-in-95 duration-500">
                <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8 ring-8 ring-green-500/5"><CheckCircle2 className="h-12 w-12 text-green-500" /></div>
                <h2 className="text-3xl font-black tracking-tight mb-3 text-foreground">Event Published!</h2>
                <p className="text-base text-muted-foreground max-w-md mb-10 leading-relaxed">Your event is now live. Copy the link below to start selling tickets immediately.</p>
                <div className="flex items-center gap-3 w-full max-w-md p-2 rounded-2xl bg-secondary border border-border shadow-inner">
                  <div className="bg-background px-4 py-3.5 rounded-xl text-sm font-bold font-mono text-foreground flex-1 truncate text-left border shadow-sm">{generatedLink}</div>
                  <Button size="lg" className="shrink-0 gap-2 rounded-xl px-6 font-bold"><Copy className="h-4 w-4" />Copy</Button>
                </div>
                <div className="mt-12 flex gap-4 w-full max-w-md">
                  <Button variant="outline" size="lg" className="flex-1 gap-2 border-2 font-bold"><Share2 className="h-4 w-4" />Share</Button>
                  <Button size="lg" variant="secondary" onClick={onBack} className="flex-1 font-bold">Dashboard</Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {currentStep < 6 && (
        <div className="flex flex-col gap-4 pt-4">
          {stepError && (<div className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold p-3.5 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-bottom-2"><AlertCircle className="h-4 w-4" />{stepError}</div>)}
          {errorMessage && (<div className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold p-3.5 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-bottom-2"><AlertCircle className="h-4 w-4" />{errorMessage}</div>)}
          <div className="flex items-center justify-between mt-2">
            <Button variant="outline" onClick={() => { setCurrentStep((s) => s - 1); setStepError(""); setErrorMessage(""); }} disabled={currentStep === 0 || isSubmitting} className="gap-2 w-32 h-12 rounded-xl border-2 font-bold text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" />{t(locale, "back") || "Back"}</Button>
            <Button onClick={() => { if (currentStep === 5) submitEvent(); else handleNextStep(); }} disabled={isSubmitting} className={cn("gap-2 w-40 h-12 rounded-xl font-bold text-base shadow-md transition-all hover:scale-[1.02]", currentStep === 5 && "bg-green-600 hover:bg-green-700 text-white w-48")}>{isSubmitting ? (<span className="animate-pulse">Processing...</span>) : currentStep === 5 ? (<><Check className="h-5 w-5" />Publish</>) : (<>Next<ArrowRight className="h-5 w-5" /></>)}</Button>
          </div>
        </div>
      )}

      {toast.show && (
        <div className={cn("fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border bg-popover text-popover-foreground animate-in slide-in-from-bottom-5 fade-in duration-300 z-50", toast.type === 'success' ? "border-border" : "border-destructive/30 bg-destructive/10")}>{toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-destructive" />}<span className="text-sm font-semibold">{toast.message}</span></div>
      )}
    </div>
  )
}