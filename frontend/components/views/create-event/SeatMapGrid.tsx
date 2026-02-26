"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ZoomIn, ZoomOut, Focus, Trash2, Hand, Plus, Eraser, MonitorPlay, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"

const GRID = 32;

export function SeatMapGrid({ tiers, seatMap, setSeatMap, config, setConfig, derivedCapacity }: any) {
  const { locale } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeTool, setActiveTool] = useState<string | 'add' | 'eraser' | 'pan'>('add')
  const [tempRows, setTempRows] = useState("")
  const [tempCols, setTempCols] = useState("")
  const [isDrawing, setIsDrawing] = useState(false)
  const [isPanning, setIsPanning] = useState(false)
  
  const [draggingStageId, setDraggingStageId] = useState<string | null>(null)
  const [resizingStageInfo, setResizingStageInfo] = useState<{ id: string, handle: string } | null>(null)
  
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [lastDrawnCell, setLastDrawnCell] = useState<{r: number, c: number} | null>(null)

  const { rowLabelType } = config

  const stages = config.stages || [
    { 
      id: 'stage-default', 
      x: config.stageRect?.x ?? -100, 
      y: config.stageRect?.y ?? -150, 
      w: config.stageRect?.w ?? 200, 
      h: config.stageRect?.h ?? 50, 
      label: t(locale, "stage") || 'STAGE' 
    }
  ]

  const updateStages = useCallback((updater: any) => {
    setConfig((prev: any) => ({ 
      ...prev, 
      stages: typeof updater === 'function' ? updater(prev.stages || stages) : updater 
    }))
  }, [setConfig, stages])

  const handleAddStage = () => {
    updateStages((prev: any[]) => {
      const lastStage = prev[prev.length - 1];
      const xOffset = lastStage ? lastStage.x + lastStage.w + 20 : -100;
      const yOffset = lastStage ? lastStage.y : -200;

      return [
        ...prev,
        { 
          id: `stage-${Date.now()}`, 
          x: xOffset, 
          y: yOffset, 
          w: 200, 
          h: 50, 
          label: `${t(locale, "stage") || "STAGE"} ${prev.length + 1}` 
        }
      ]
    })
  }

  const handleDeleteStage = (id: string) => {
    updateStages((prev: any[]) => prev.filter(s => s.id !== id))
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName)) return;

      const code = e.code;
      if (code === 'KeyH') setActiveTool('pan');
      if (code === 'KeyA') setActiveTool('add');
      if (code === 'KeyE') setActiveTool('eraser');

      if (code.startsWith('Digit')) {
        const num = parseInt(code.replace('Digit', ''));
        if (!isNaN(num) && num > 0 && num <= tiers.length) {
          setActiveTool(tiers[num - 1].id.toString());
        }
      }
      if (code.startsWith('Numpad')) {
        const num = parseInt(code.replace('Numpad', ''));
        if (!isNaN(num) && num > 0 && num <= tiers.length) {
          setActiveTool(tiers[num - 1].id.toString());
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tiers]);

  useEffect(() => { 
    if (Object.keys(seatMap).length === 0 && derivedCapacity > 0) {
      const cCount = Math.ceil(Math.sqrt(derivedCapacity * 1.5));
      const rCount = Math.ceil(derivedCapacity / cCount);
      
      setTempRows(rCount.toString());
      setTempCols(cCount.toString());

      const newMap: Record<string, { r: number; c: number; tierId: string | null }> = {}
      const startR = -Math.floor(rCount / 2)
      const startC = -Math.floor(cCount / 2)
      
      let createdSeats = 0;
      for (let r = 0; r < rCount; r++) {
        for (let c = 0; c < cCount; c++) {
          if (createdSeats >= derivedCapacity) break; 
          const row = startR + r
          const col = startC + c
          newMap[`${row}-${col}`] = { r: row, c: col, tierId: null }
          createdSeats++;
        }
      }
      
      setSeatMap(newMap)
      updateStages((prev: any[]) => {
        const newStages = [...prev];
        if (newStages.length > 0) {
          newStages[0] = { ...newStages[0], x: -100, y: (startR * GRID) - 80, w: 200, h: 50 };
        }
        return newStages;
      })
    }
  }, [derivedCapacity, seatMap, setSeatMap, updateStages])

  // УМНАЯ РУЧНАЯ ГЕНЕРАЦИЯ (С защитой от минусов и нехватки мест)
  const handleManualGenerate = () => {
    // Если пусто или минус, ставим минимум 1
    let rCount = Math.max(1, parseInt(tempRows) || 1);
    let cCount = Math.max(1, parseInt(tempCols) || 1);
    
    // Защита: Если мест меньше, чем вместимость (derivedCapacity), увеличиваем колонки
    if (derivedCapacity > 0 && (rCount * cCount) < derivedCapacity) {
      cCount = Math.ceil(derivedCapacity / rCount);
      setTempCols(cCount.toString()); // Обновляем инпут, чтобы юзер видел корректировку
    }
    setTempRows(rCount.toString());

    const newMap: Record<string, { r: number; c: number; tierId: string | null }> = {}
    const startR = -Math.floor(rCount / 2)
    const startC = -Math.floor(cCount / 2)
    
    let createdSeats = 0;
    for (let r = 0; r < rCount; r++) {
      for (let c = 0; c < cCount; c++) {
        if (derivedCapacity > 0 && createdSeats >= derivedCapacity) break;
        const row = startR + r
        const col = startC + c
        newMap[`${row}-${col}`] = { r: row, c: col, tierId: null }
        createdSeats++;
      }
    }
    setSeatMap(newMap)
    setZoom(1)
    setPan({ x: 0, y: 0 })
  }

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
    
    const handle = target.dataset.handle;
    const stageId = target.dataset.stageId;
    
    if (handle && stageId) { 
      setResizingStageInfo({ id: stageId, handle: handle }); 
      setLastPos({ x: e.clientX, y: e.clientY }); 
      containerRef.current?.setPointerCapture(e.pointerId); 
      return 
    }
    if (target.dataset.dragArea && stageId) { 
      setDraggingStageId(stageId); 
      setLastPos({ x: e.clientX, y: e.clientY }); 
      containerRef.current?.setPointerCapture(e.pointerId); 
      return 
    }

    if (e.button === 1 || activeTool === 'pan') { setIsPanning(true); setLastPos({ x: e.clientX, y: e.clientY }); containerRef.current?.setPointerCapture(e.pointerId); return }
    setIsDrawing(true)
    const { r, c } = getGridCoords(e.clientX, e.clientY)
    applyTool(r, c)
    setLastDrawnCell({ r, c })
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (resizingStageInfo) {
      const dx = (e.clientX - lastPos.x) / zoom; 
      const dy = (e.clientY - lastPos.y) / zoom;
      
      updateStages((prev: any[]) => prev.map(stage => {
        if (stage.id !== resizingStageInfo.id) return stage;
        let { x, y, w, h } = stage;
        if (resizingStageInfo.handle.includes('e')) w = Math.max(60, w + dx)
        if (resizingStageInfo.handle.includes('s')) h = Math.max(30, h + dy) 
        if (resizingStageInfo.handle.includes('w')) { const dw = Math.min(w - 60, dx); x += dw; w -= dw; }
        if (resizingStageInfo.handle.includes('n')) { const dh = Math.min(h - 30, dy); y += dh; h -= dh; }
        return { ...stage, x, y, w, h }
      }))
      setLastPos({ x: e.clientX, y: e.clientY })
    } else if (draggingStageId) {
      const dx = (e.clientX - lastPos.x) / zoom; 
      const dy = (e.clientY - lastPos.y) / zoom;
      updateStages((prev: any[]) => prev.map(stage => 
        stage.id === draggingStageId ? { ...stage, x: stage.x + dx, y: stage.y + dy } : stage
      ))
      setLastPos({ x: e.clientX, y: e.clientY })
    } else if (isPanning) {
      const dx = e.clientX - lastPos.x; const dy = e.clientY - lastPos.y
      setPan(p => ({ x: p.x + dx, y: p.y + dy })); setLastPos({ x: e.clientX, y: e.clientY })
    } else if (isDrawing) {
      const { r, c } = getGridCoords(e.clientX, e.clientY)
      if (!lastDrawnCell || lastDrawnCell.r !== r || lastDrawnCell.c !== c) { applyTool(r, c); setLastDrawnCell({ r, c }) }
    }
  }

  const onPointerUp = (e: React.PointerEvent) => {
    setIsDrawing(false); setIsPanning(false); setDraggingStageId(null); setResizingStageInfo(null); setLastDrawnCell(null)
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
  const seatsDeficit = derivedCapacity - seatsArray.length;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-secondary/30 p-3 rounded-lg border border-border/50">
        <div className="flex items-center gap-1">
          <Button onClick={() => setZoom(z => Math.max(0.2, z - 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomOut className="h-4 w-4" /></Button>
          <span className="text-xs font-mono w-12 text-center text-muted-foreground">{Math.round(zoom * 100)}%</span>
          <Button onClick={() => setZoom(z => Math.min(3, z + 0.2))} size="icon" variant="ghost" className="h-8 w-8"><ZoomIn className="h-4 w-4" /></Button>
          <div className="w-px h-4 bg-border mx-2" />
          <Button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); }} variant="ghost" size="sm" className="h-8 gap-1 text-muted-foreground">
            <Focus className="h-3.5 w-3.5" /> {t(locale, "center") || "Center"}
          </Button>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={handleAddStage} size="sm" variant="outline" className="h-8 shadow-sm gap-1.5 border-primary/20 text-primary hover:bg-primary/10">
            <MonitorPlay className="h-4 w-4" /> 
            {t(locale, "addStage") || "Add Stage"}
          </Button>

          <div className="w-px h-6 bg-border mx-1" />

          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground">{t(locale, "rows") || "Rows"}</span>
            <Select value={rowLabelType} onValueChange={(v) => setConfig((p:any)=>({...p, rowLabelType: v}))}>
              <SelectTrigger className="h-6 w-[80px] px-1 py-0 text-xs border-none focus:ring-0 shadow-none"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="letters" className="text-xs">A, B, C</SelectItem>
                <SelectItem value="numbers" className="text-xs">1, 2, 3</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2 bg-background border rounded-md px-2 h-8 shadow-sm">
            <span className="text-[10px] uppercase font-bold text-muted-foreground mr-1">{t(locale, "grid") || "Grid"}</span>
            {/* ИНПУТЫ ТЕПЕРЬ ШИРЕ И НЕ ПУСКАЮТ МИНУСЫ */}
            <Input 
              type="number" min="1" value={tempRows} 
              onChange={e => setTempRows(e.target.value.replace(/[^0-9]/g, ''))} 
              className="w-12 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" 
            />
            <span className="text-xs text-muted-foreground">x</span>
            <Input 
              type="number" min="1" value={tempCols} 
              onChange={e => setTempCols(e.target.value.replace(/[^0-9]/g, ''))} 
              className="w-12 h-6 px-1 py-0 text-center border-none focus-visible:ring-0 text-xs font-mono" 
            />
          </div>
          
          <Button onClick={handleManualGenerate} size="sm" variant="secondary" className="h-8 shadow-sm">
            {t(locale, "generate") || "Generate"}
          </Button>
          
          {/* КНОПКА СБРОСА С ИКОНКОЙ ROTATE */}
          <Button onClick={() => setSeatMap({})} size="sm" variant="destructive" className="h-8 px-2.5 shadow-sm" title={t(locale, "reset") || "Reset"}>
            <RotateCcw className="h-4 w-4" />
          </Button>
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
          
          {stages.map((stage: any) => (
            <div 
              key={stage.id} 
              style={{ position: 'absolute', left: stage.x, top: stage.y, width: stage.w, height: stage.h, zIndex: 10 }} 
              className="bg-muted/80 backdrop-blur border-2 border-border text-foreground font-black tracking-[0.2em] text-xs sm:text-sm rounded-xl select-none flex items-center justify-center group hover:border-primary/50 transition-colors shadow-lg"
            >
              <div data-drag-area="true" data-stage-id={stage.id} className="absolute inset-0 cursor-move" />
              <span className="pointer-events-none">{stage.label || (t(locale, "stage") || "STAGE")}</span>
              
              <button
                onPointerDown={(e) => { 
                  e.stopPropagation(); 
                  handleDeleteStage(stage.id); 
                }}
                className="absolute -top-3 -right-3 bg-destructive text-destructive-foreground w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-md z-30 cursor-pointer hover:scale-110"
              >
                <Trash2 className="w-3 h-3 pointer-events-none" />
              </button>

              {['nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'].map(handle => (
                <div key={handle} data-handle={handle} data-stage-id={stage.id} className={cn("absolute bg-background border-2 border-primary w-3 h-3 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-20 shadow-sm", handle === 'nw' && "-top-1.5 -left-1.5 cursor-nwse-resize", handle === 'ne' && "-top-1.5 -right-1.5 cursor-nesw-resize", handle === 'sw' && "-bottom-1.5 -left-1.5 cursor-nesw-resize", handle === 'se' && "-bottom-1.5 -right-1.5 cursor-nwse-resize", handle === 'n' && "-top-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", handle === 's' && "-bottom-1.5 left-1/2 -translate-x-1/2 cursor-ns-resize", handle === 'e' && "top-1/2 -right-1.5 -translate-y-1/2 cursor-ew-resize", handle === 'w' && "top-1/2 -left-1.5 -translate-y-1/2 cursor-ew-resize" )} />
              ))}
            </div>
          ))}

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
           <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-widest mb-1">{t(locale, "stats") || "STATS"}</span>
           <span className="text-sm font-medium">
             {t(locale, "totalSeats") || "Total Seats"}: <span className={cn("font-bold", seatsDeficit > 0 ? "text-destructive" : "")}>{seatsArray.length}</span>
             <span className="text-xs text-muted-foreground ml-1">/ {derivedCapacity}</span>
           </span>
           <span className="text-sm font-medium text-primary">{t(locale, "assigned") || "Assigned"}: <span className="font-bold">{assignedCount}</span></span>
        </div>

        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-1.5 p-1.5 bg-background/95 backdrop-blur-md border border-border/60 rounded-full shadow-2xl" onPointerDown={(e) => e.stopPropagation()}>
          <button onClick={() => setActiveTool('pan')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'pan' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')} title="Pan Canvas (H)"><Hand className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <button onClick={() => setActiveTool('add')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'add' ? 'bg-primary text-primary-foreground' : 'hover:bg-muted text-muted-foreground')} title="Add Unassigned Seat (A)"><Plus className="h-4 w-4" /></button>
          <button onClick={() => setActiveTool('eraser')} className={cn("p-2.5 rounded-full transition-colors", activeTool === 'eraser' ? 'bg-destructive text-destructive-foreground' : 'hover:bg-muted text-muted-foreground')} title="Erase Seat (E)"><Eraser className="h-4 w-4" /></button>
          <div className="w-px h-6 bg-border mx-1" />
          <div className="flex items-center gap-1.5 px-2">
            {tiers.map((tier: any, index: number) => (
              <button 
                key={tier.id} onClick={() => setActiveTool(tier.id.toString())}
                title={`Select ${tier.name || 'Tier'} (${index + 1})`}
                className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold transition-transform", activeTool === tier.id.toString() ? "scale-105 shadow-md ring-2 ring-offset-1 ring-offset-background" : "opacity-70 hover:opacity-100 border border-border bg-background")}
                style={activeTool === tier.id.toString() 
                  ? { backgroundColor: tier.color, color: '#fff', boxShadow: `0 0 0 2px ${tier.color}` } 
                  : { color: tier.color }
                }              >
                <div className="w-2.5 h-2.5 rounded-full shadow-inner" style={{ backgroundColor: tier.color }} />
                {tier.name || 'Tier'}
                <span className="opacity-50 ml-1">({index + 1})</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}