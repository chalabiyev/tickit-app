"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { ZoomIn, ZoomOut, Focus, Trash2, Hand, Plus, Eraser, MonitorPlay, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const GRID = 32

// ── Types ──────────────────────────────────────────────────────────────────
interface Tier { id: string | number; name: string; color: string; quantity?: number }

export interface SeatCell { r: number; c: number; tierId: string | null }
export type SeatMap = Record<string, SeatCell>

export interface Stage { id: string; x: number; y: number; w: number; h: number; label?: string }

export interface MapConfig {
  stages?: Stage[]
  stageRect?: { x: number; y: number; w: number; h: number }
  rowLabelType: "letters" | "numbers"
}

interface SeatMapGridProps {
  tiers: Tier[]
  seatMap: SeatMap
  setSeatMap: React.Dispatch<React.SetStateAction<SeatMap>>
  config: MapConfig
  setConfig: React.Dispatch<React.SetStateAction<MapConfig>>
  derivedCapacity: number
}

type ActiveTool = "add" | "eraser" | "pan" | string   // string = tierId

// ── Row label helpers ──────────────────────────────────────────────────────
function toLetterLabel(i: number): string {
  let label = ""; let n = i
  while (n >= 0) { label = String.fromCharCode(65 + (n % 26)) + label; n = Math.floor(n / 26) - 1 }
  return label
}

export function SeatMapGrid({
  tiers, seatMap, setSeatMap, config, setConfig, derivedCapacity,
}: SeatMapGridProps) {
  const { locale } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)

  const [zoom,      setZoom]      = useState(1)
  const [pan,       setPan]       = useState({ x: 0, y: 0 })
  const [activeTool,setActiveTool]= useState<ActiveTool>("add")
  const [tempRows,  setTempRows]  = useState("")
  const [tempCols,  setTempCols]  = useState("")

  const [isDrawing,       setIsDrawing]       = useState(false)
  const [isPanning,       setIsPanning]       = useState(false)
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null)
  const [resizingInfo,    setResizingInfo]    = useState<{ id: string; handle: string } | null>(null)
  const [lastPos,         setLastPos]         = useState({ x: 0, y: 0 })
  const [lastDrawnCell,   setLastDrawnCell]   = useState<{ r: number; c: number } | null>(null)

  const { rowLabelType } = config

  // Default stage if none configured
  const stages: Stage[] = config.stages ?? [
    { id: "stage-default", x: config.stageRect?.x ?? -100, y: config.stageRect?.y ?? -150, w: config.stageRect?.w ?? 200, h: config.stageRect?.h ?? 50, label: "" },
  ]

  const updateStages = useCallback(
    (updater: ((prev: Stage[]) => Stage[]) | Stage[]) => {
      setConfig((prev) => ({
        ...prev,
        stages: typeof updater === "function" ? updater(prev.stages ?? stages) : updater,
      }))
    },
    [setConfig]
  )

  // Keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName
      if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return
      if (e.code === "KeyH") setActiveTool("pan")
      if (e.code === "KeyA") setActiveTool("add")
      if (e.code === "KeyE") setActiveTool("eraser")
      const num = parseInt(e.code.replace("Digit", "").replace("Numpad", ""))
      if (!isNaN(num) && num > 0 && num <= tiers.length) setActiveTool(String(tiers[num - 1].id))
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [tiers])

  // Auto-generate grid from capacity
  useEffect(() => {
    if (Object.keys(seatMap).length > 0 || derivedCapacity <= 0) return
    const cCount = Math.ceil(Math.sqrt(derivedCapacity * 1.5))
    const rCount = Math.ceil(derivedCapacity / cCount)
    setTempRows(String(rCount)); setTempCols(String(cCount))
    generateGrid(rCount, cCount, derivedCapacity)
  }, [derivedCapacity])

  const generateGrid = (rCount: number, cCount: number, cap = 0) => {
    const newMap: SeatMap = {}
    const startR = -Math.floor(rCount / 2)
    const startC = -Math.floor(cCount / 2)
    let created = 0
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        if (cap > 0 && created >= cap) break
        const row = startR + r; const col = startC + c
        newMap[`${row}-${col}`] = { r: row, c: col, tierId: null }
        created++
      }
    }
    setSeatMap(newMap)
    updateStages((prev) => {
      const next = [...prev]
      if (next.length > 0) next[0] = { ...next[0], x: -100, y: (startR * GRID) - 80, w: 200, h: 50 }
      return next
    })
    setZoom(1); setPan({ x: 0, y: 0 })
  }

  const handleManualGenerate = () => {
    let r = Math.max(1, parseInt(tempRows) || 1)
    let c = Math.max(1, parseInt(tempCols) || 1)
    if (derivedCapacity > 0 && r * c < derivedCapacity) { c = Math.ceil(derivedCapacity / r); setTempCols(String(c)) }
    setTempRows(String(r))
    generateGrid(r, c, derivedCapacity)
  }

  const getGridCoords = (clientX: number, clientY: number) => {
    if (!containerRef.current) return { r: 0, c: 0 }
    const rect = containerRef.current.getBoundingClientRect()
    const x = (clientX - rect.left - rect.width  / 2 - pan.x) / zoom
    const y = (clientY - rect.top  - rect.height / 2 - pan.y) / zoom
    return { c: Math.round(x / GRID), r: Math.round(y / GRID) }
  }

  const applyTool = useCallback((r: number, c: number) => {
  const id = `${r}-${c}`
  setSeatMap((prev) => {
      const next = { ...prev }
      if (activeTool === "eraser") {
        delete next[id]
      } else if (activeTool === "add") {
        if (!next[id]) next[id] = { r, c, tierId: null }
      } else if (activeTool !== "pan") {
        // activeTool is a tierId — check per-tier capacity limit
        const tier = tiers.find((ti) => String(ti.id) === activeTool)
        if (tier && next[id]) {
          const tierLimit = Number((tier as { quantity?: number }).quantity ?? 0)
          if (tierLimit > 0) {
            const alreadyAssigned = Object.values(next).filter(
              (s) => String(s.tierId) === activeTool && `${s.r}-${s.c}` !== id
            ).length
            if (alreadyAssigned >= tierLimit) return prev // block — limit reached
          }
          next[id] = { ...next[id], tierId: activeTool }
        }
      }
      return next
    })
  }, [activeTool, setSeatMap, tiers])

  const onPointerDown = (e: React.PointerEvent) => {
    const target = e.target as HTMLElement
    const handle  = target.dataset.handle
    const stageId = target.dataset.stageId

    if (handle && stageId) {
      setResizingInfo({ id: stageId, handle }); setLastPos({ x: e.clientX, y: e.clientY })
      containerRef.current?.setPointerCapture(e.pointerId); return
    }
    if (target.dataset.dragArea && stageId) {
      setDraggingStageId(stageId); setLastPos({ x: e.clientX, y: e.clientY })
      containerRef.current?.setPointerCapture(e.pointerId); return
    }
    if (e.button === 1 || activeTool === "pan") {
      setIsPanning(true); setLastPos({ x: e.clientX, y: e.clientY })
      containerRef.current?.setPointerCapture(e.pointerId); return
    }
    setIsDrawing(true)
    const { r, c } = getGridCoords(e.clientX, e.clientY)
    applyTool(r, c); setLastDrawnCell({ r, c })
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (resizingInfo) {
      const dx = (e.clientX - lastPos.x) / zoom
      const dy = (e.clientY - lastPos.y) / zoom
      updateStages((prev) => prev.map((stage) => {
        if (stage.id !== resizingInfo.id) return stage
        let { x, y, w, h } = stage
        if (resizingInfo.handle.includes("e")) w = Math.max(60, w + dx)
        if (resizingInfo.handle.includes("s")) h = Math.max(30, h + dy)
        if (resizingInfo.handle.includes("w")) { const dw = Math.min(w - 60, dx); x += dw; w -= dw }
        if (resizingInfo.handle.includes("n")) { const dh = Math.min(h - 30, dy); y += dh; h -= dh }
        return { ...stage, x, y, w, h }
      }))
      setLastPos({ x: e.clientX, y: e.clientY }); return
    }
    if (draggingStageId) {
      const dx = (e.clientX - lastPos.x) / zoom; const dy = (e.clientY - lastPos.y) / zoom
      updateStages((prev) => prev.map((s) => s.id === draggingStageId ? { ...s, x: s.x + dx, y: s.y + dy } : s))
      setLastPos({ x: e.clientX, y: e.clientY }); return
    }
    if (isPanning) {
      setPan((p) => ({ x: p.x + e.clientX - lastPos.x, y: p.y + e.clientY - lastPos.y }))
      setLastPos({ x: e.clientX, y: e.clientY }); return
    }
    if (isDrawing) {
      const { r, c } = getGridCoords(e.clientX, e.clientY)
      if (!lastDrawnCell || lastDrawnCell.r !== r || lastDrawnCell.c !== c) {
        applyTool(r, c); setLastDrawnCell({ r, c })
      }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false); setIsPanning(false); setDraggingStageId(null); setResizingInfo(null); setLastDrawnCell(null)
    if (containerRef.current?.hasPointerCapture(e.pointerId)) containerRef.current.releasePointerCapture(e.pointerId)
  }

  // Wheel zoom
  useEffect(() => {
    const el = containerRef.current; if (!el) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      setZoom((z) => Math.max(0.2, Math.min(3, z + (e.deltaY > 0 ? -0.05 : 0.05))))
    }
    el.addEventListener("wheel", onWheel, { passive: false })
    return () => el.removeEventListener("wheel", onWheel)
  }, [])

  // Computed display data
  const seatsArray = Object.values(seatMap)
  const rowKeys    = Array.from(new Set(seatsArray.map((s) => s.r))).sort((a, b) => a - b)
  const minCol     = seatsArray.length > 0 ? Math.min(...seatsArray.map((s) => s.c)) : 0

  const rowLabels: Record<number, string> = {}
  rowKeys.forEach((r, i) => { rowLabels[r] = rowLabelType === "letters" ? toLetterLabel(i) : String(i + 1) })

  const seatLabels: Record<string, number> = {}
  rowKeys.forEach((r) => {
    seatsArray.filter((s) => s.r === r).sort((a, b) => a.c - b.c)
      .forEach((s, idx) => { seatLabels[`${s.r}-${s.c}`] = idx + 1 })
  })

  const assignedCount = seatsArray.filter((s) => s.tierId).length
  const seatsDeficit  = derivedCapacity - seatsArray.length

  const HANDLE_CURSORS: Record<string, string> = {
    nw: "cursor-nwse-resize", ne: "cursor-nesw-resize",
    sw: "cursor-nesw-resize", se: "cursor-nwse-resize",
    n:  "cursor-ns-resize",   s:  "cursor-ns-resize",
    e:  "cursor-ew-resize",   w:  "cursor-ew-resize",
  }
  const HANDLE_POS: Record<string, string> = {
    nw: "-top-1.5 -left-1.5",  ne: "-top-1.5 -right-1.5",
    sw: "-bottom-1.5 -left-1.5", se: "-bottom-1.5 -right-1.5",
    n:  "-top-1.5 left-1/2 -translate-x-1/2",
    s:  "-bottom-1.5 left-1/2 -translate-x-1/2",
    e:  "top-1/2 -right-1.5 -translate-y-1/2",
    w:  "top-1/2 -left-1.5 -translate-y-1/2",
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-secondary/30 p-3 rounded-lg border border-border/50">
        {/* Zoom controls */}
        <div className="flex items-center gap-1">
          <Button onClick={() => setZoom((z) => Math.max(0.2, z - 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button onClick={() => setZoom((z) => Math.min(3, z + 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
            <Focus className="h-3.5 w-3.5" /> {t(locale, "center") || "Center"}
          </Button>
        </div>

        {/* Grid controls */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={() => updateStages((prev) => {
              const last = prev[prev.length - 1]
              return [...prev, { id: `stage-${Date.now()}`, x: last ? last.x + last.w + 20 : -100, y: last ? last.y : -200, w: 200, h: 50, label: `${t(locale, "stage") || "STAGE"} ${prev.length + 1}` }]
            })}
            size="sm" variant="outline" className="h-8 shadow-sm gap-1.5 border-primary/20 text-primary hover:bg-primary/10"
          >
            <MonitorPlay className="h-4 w-4" /> {t(locale, "addStage") || "Add Stage"}
          </Button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{t(locale, "rows") || "Rows"}</span>
            <Select value={rowLabelType} onValueChange={(v) => setConfig((p) => ({ ...p, rowLabelType: v as "letters" | "numbers" }))}>
              <SelectTrigger className="h-6 w-[80px] px-1 py-0 text-xs border-none focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="letters" className="text-xs">A, B, C</SelectItem>
                <SelectItem value="numbers" className="text-xs">1, 2, 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">{t(locale, "grid") || "Grid"}</span>
            <Input type="number" min="1" value={tempRows} onChange={(e) => setTempRows(e.target.value.replace(/\D/g, ""))} className="w-12 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" />
            <span className="text-xs text-muted-foreground">×</span>
            <Input type="number" min="1" value={tempCols} onChange={(e) => setTempCols(e.target.value.replace(/\D/g, ""))} className="w-12 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" />
          </div>
          <Button onClick={handleManualGenerate} size="sm" variant="secondary" className="h-8 shadow-sm">
            {t(locale, "generate") || "Generate"}
          </Button>
          <Button onClick={() => setSeatMap({})} size="sm" variant="destructive" className="h-8 px-2.5 shadow-sm" title={t(locale, "reset") || "Reset"}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[600px] border border-border/60 rounded-xl overflow-hidden bg-background shadow-inner cursor-crosshair"
        style={{ touchAction: "none" }}
        onPointerDown={onPointerDown} onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}    onPointerLeave={onPointerUp}
      >
        <div
          className="absolute top-1/2 left-1/2"
          style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`, transformOrigin: "0 0" }}
        >
          {/* Dot grid */}
          <div
            className="absolute pointer-events-none opacity-20"
            style={{ left: -5000, top: -5000, width: 10000, height: 10000, backgroundImage: "radial-gradient(circle at center, currentColor 1.5px, transparent 1.5px)", backgroundSize: `${GRID}px ${GRID}px`, backgroundPosition: "center center", zIndex: 0 }}
          />

          {/* Stages */}
          {stages.map((stage) => (
            <div
              key={stage.id}
              className="bg-muted/80 border-2 border-border text-foreground font-black tracking-[0.2em] text-xs sm:text-sm rounded-xl select-none flex items-center justify-center group hover:border-primary/50 transition-colors shadow-lg"
              style={{ position: "absolute", left: stage.x, top: stage.y, width: stage.w, height: stage.h, zIndex: 10, WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}
            >
              <div data-drag-area="true" data-stage-id={stage.id} className="absolute inset-0 cursor-move" />
              <span className="pointer-events-none">{stage.label || (t(locale, "stage") || "STAGE")}</span>

              <button
                onPointerDown={(e) => { e.stopPropagation(); updateStages((prev) => prev.filter((s) => s.id !== stage.id)) }}
                className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md z-30 cursor-pointer hover:scale-110"
              >
                <Trash2 className="w-3 h-3 pointer-events-none" />
              </button>

              {Object.keys(HANDLE_CURSORS).map((handle) => (
                <div
                  key={handle}
                  data-handle={handle} data-stage-id={stage.id}
                  className={cn("absolute bg-background border-2 border-primary w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm", HANDLE_POS[handle], HANDLE_CURSORS[handle])}
                />
              ))}
            </div>
          ))}

          {/* Row labels */}
          {rowKeys.map((r) => (
            <div key={`lbl-${r}`} style={{ position: "absolute", top: r * GRID, left: minCol * GRID - 40, transform: "translate(0, -50%)" }} className="text-[11px] text-muted-foreground font-mono font-bold select-none pointer-events-none">
              {rowLabels[r]}
            </div>
          ))}

          {/* Seats */}
          <div style={{ zIndex: 20, position: "relative" }}>
            {seatsArray.map((seat) => {
              const tier = tiers.find((ti) => String(ti.id) === String(seat.tierId))
              return (
                <div
                  key={`${seat.r}-${seat.c}`}
                  style={{
                    position: "absolute", top: seat.r * GRID, left: seat.c * GRID,
                    transform: "translate(-50%, -50%)", width: 22, height: 22,
                    backgroundColor: tier ? tier.color : "var(--secondary)",
                    color: tier ? "#fff" : "inherit",
                  }}
                  className={cn(
                    "rounded-md flex items-center justify-center text-[9px] font-bold select-none transition-transform hover:scale-110 shadow-sm",
                    !tier && "bg-secondary border border-border/50 text-muted-foreground"
                  )}
                >
                  {seatLabels[`${seat.r}-${seat.c}`]}
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats overlay */}
        <div className="absolute top-4 left-4 bg-background/80 p-3 rounded-xl border border-border shadow-sm flex flex-col gap-1 pointer-events-none" style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">
            {t(locale, "stats") || "STATS"}
          </span>
          <span className="text-sm font-medium">
            {t(locale, "totalSeats") || "Total Seats"}:{" "}
            <span className={cn("font-bold", seatsDeficit > 0 && "text-destructive")}>{seatsArray.length}</span>
            <span className="text-xs text-muted-foreground ml-1">/ {derivedCapacity}</span>
          </span>
          <span className="text-sm font-medium text-primary">
            {t(locale, "assigned") || "Assigned"}: <span className="font-bold">{assignedCount}</span>
          </span>
        </div>

        {/* Tool palette */}
        <div
          className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-background/95 border border-border/60 rounded-full shadow-2xl"
          style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <button onClick={() => setActiveTool("pan")} className={cn("p-2.5 rounded-full transition-colors", activeTool === "pan" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")} title="Pan (H)"><Hand className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => setActiveTool("add")} className={cn("p-2.5 rounded-full transition-colors", activeTool === "add" ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground")} title="Add (A)"><Plus className="h-4 w-4" /></button>
          <button onClick={() => setActiveTool("eraser")} className={cn("p-2.5 rounded-full transition-colors", activeTool === "eraser" ? "bg-destructive text-destructive-foreground" : "hover:bg-muted text-muted-foreground")} title="Erase (E)"><Eraser className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-1.5 px-2">
            {tiers.map((tier, index) => (
              <button
                key={tier.id}
                onClick={() => setActiveTool(String(tier.id))}
                title={`${tier.name || "Tier"} (${index + 1})`}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform",
                  activeTool === String(tier.id)
                    ? "scale-105 shadow-md ring-2 ring-offset-1 ring-offset-background"
                    : "opacity-70 hover:opacity-100 border border-border bg-background"
                )}
                style={
                  activeTool === String(tier.id)
                    ? { backgroundColor: tier.color, color: "#fff", boxShadow: `0 0 0 2px ${tier.color}` }
                    : { color: tier.color }
                }
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} />
                {tier.name || "Tier"}
                <span className="opacity-50 ml-1">({index + 1})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}