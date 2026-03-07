"use client"

import { useState, useRef } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import {
  QrCode, Type, Palette, Maximize, Trash, Image as ImageIcon, LayoutTemplate,
  AlignLeft, AlignCenter, AlignRight, Upload, Loader2, ArrowLeft,
  MoveHorizontal, MoveVertical, Ticket, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { TICKET_TEMPLATES } from "@/lib/ticket-templates"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"
const CANVAS_WIDTH = 360

// ── Types ──────────────────────────────────────────────────────────────────
export type ElementType = "text" | "qr" | "image"

export interface TicketElement {
  id: string; type: ElementType; x: number; y: number; content: string
  color: string; fontSize: number; fontWeight: "normal" | "bold"
  fontFamily?: string; textAlign?: "left" | "center" | "right"
  width?: number; height?: number; src?: string
}

export interface TicketDesign {
  bgColor: string; bgImage: string | null; bgOverlay: number
  bgScale?: number; bgOffsetX?: number; bgOffsetY?: number
  elements: TicketElement[]
}

interface TicketDesignEditorProps {
  design: TicketDesign
  onChange: (d: TicketDesign) => void
  eventDetails: { title: string; date: string; location: string }
  buyerQuestions?: { id: string; label: string; required: boolean }[]
}

const FONTS = [
  { name: "Inter / Arial",   value: "Arial, sans-serif" },
  { name: "Helvetica",       value: "Helvetica, sans-serif" },
  { name: "Georgia (Serif)", value: "Georgia, serif" },
  { name: "Palatino",        value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: "Courier (Mono)",  value: '"Courier New", Courier, monospace' },
  { name: "Impact (Bold)",   value: "Impact, Charcoal, sans-serif" },
  { name: "Trebuchet MS",    value: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif' },
]

const HEADER_HEIGHT = 70

// Replace template tags with preview values
function renderPreview(
  content: string,
  details: { title: string; date: string; location: string },
  questions: { id: string; label: string }[]
): string {
  let out = content
    .replace(/{{Event_Name}}/g,    details.title    || "My Awesome Event")
    .replace(/{{Event_Date}}/g,    details.date     || "12.12.2026")
    .replace(/{{Location}}/g,      details.location || "Baku, AZ")
    .replace(/{{Guest_Name}}/g,    "John Doe")
    .replace(/{{Ticket_Type}}/g,   "VIP")
    .replace(/{{Seat_Info}}/g,     "Row 1, Seat 12")
    .replace(/{{Company_Name}}/g,  "My Company MMC")
    .replace(/{{Company_Phone}}/g, "+994 50 123 45 67")
  questions.forEach((q) => {
    if (q.label.trim()) out = out.replace(new RegExp(`{{${q.label}}}`, "g"), `Sample ${q.label}`)
  })
  return out
}

export function TicketDesignEditor({
  design,
  onChange,
  eventDetails,
  buyerQuestions = [],
}: TicketDesignEditorProps) {
  const { locale }   = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)

  const [selectedId,       setSelectedId]       = useState<string | null>(null)
  const [interactionMode,  setInteractionMode]  = useState<"none" | "move" | "resize">("none")
  const [isUploading,      setIsUploading]      = useState(false)
  const [uploadError,      setUploadError]      = useState("")
  const [dragOffset,       setDragOffset]       = useState({ x: 0, y: 0 })
  const [initialSize,      setInitialSize]      = useState(0)

  // Fallback to default template if design is empty
  const safeDesign = design?.elements ? design : TICKET_TEMPLATES.classicDark
  const cur = {
    ...safeDesign,
    bgScale:   safeDesign.bgScale   ?? 100,
    bgOffsetX: safeDesign.bgOffsetX ?? 0,
    bgOffsetY: safeDesign.bgOffsetY ?? 0,
    elements:  safeDesign.elements  || [],
  }

  const selectedEl = cur.elements.find((e) => e.id === selectedId)

  // Upload helper — shared by bg image and logo
  const uploadFile = async (file: File): Promise<string> => {
    const token = localStorage.getItem(TOKEN_KEY) ?? ""
    const form  = new FormData(); form.append("file", file)
    const res   = await fetch(`${API_BASE}/api/v1/upload/image`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: form,
    })
    if (!res.ok) throw new Error("Upload failed")
    const data = await res.json()
    return `${API_BASE}${data.url}`
  }

  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsUploading(true); setUploadError("")
    try {
      const url = await uploadFile(file)
      onChange({ ...cur, bgImage: url, bgOverlay: 0.2, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0 })
    } catch {
      setUploadError(t(locale, "imageUploadFailed") || "Şəkil yüklənə bilmədi")
    } finally { setIsUploading(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return
    setIsUploading(true); setUploadError("")
    try {
      const url = await uploadFile(file)
      addElement("Logo", "image", { src: url, width: 100, height: 100 })
    } catch {
      setUploadError(t(locale, "imageUploadFailed") || "Şəkil yüklənə bilmədi")
    } finally { setIsUploading(false) }
  }

  // Pointer interaction
  const handleElementPointerDown = (
    e: React.PointerEvent, id: string, mode: "move" | "resize"
  ) => {
    e.preventDefault(); e.stopPropagation()
    setSelectedId(id); setInteractionMode(mode)
    const el = cur.elements.find((el) => el.id === id)
    if (el) {
      if (mode === "move")   { setDragOffset({ x: e.clientX - el.x, y: e.clientY - el.y }) }
      if (mode === "resize") { setInitialSize(el.type === "text" ? el.fontSize : (el.width || el.fontSize)); setDragOffset({ x: e.clientX, y: e.clientY }) }
    }
    containerRef.current?.setPointerCapture(e.pointerId)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (interactionMode === "none" || !selectedId) return

    if (interactionMode === "move") {
      let newX = e.clientX - dragOffset.x
      let newY = e.clientY - dragOffset.y
      if (newY < HEADER_HEIGHT) newY = HEADER_HEIGHT
      if (newX < -200) newX = -200
      onChange({ ...cur, elements: cur.elements.map((el) =>
        el.id === selectedId ? { ...el, x: newX, y: newY } : el
      )})
    } else if (interactionMode === "resize") {
      const dx      = e.clientX - dragOffset.x
      const newSize = Math.max(10, Math.floor(initialSize + dx * 0.8))
      onChange({ ...cur, elements: cur.elements.map((el) => {
        if (el.id !== selectedId) return el
        if (el.type === "text") return { ...el, fontSize: newSize }
        return { ...el, width: newSize, height: newSize, fontSize: newSize }
      })})
    }
  }

  const handlePointerUp = (e: React.PointerEvent) => {
    setInteractionMode("none")
    if (containerRef.current?.hasPointerCapture(e.pointerId))
      containerRef.current.releasePointerCapture(e.pointerId)
  }

  const updateSelected = (updates: Partial<TicketElement>) => {
    if (!selectedId) return
    if (updates.textAlign === "center") { updates.x = 0; updates.width = CANVAS_WIDTH }
    else if (updates.textAlign === "left")  { updates.x = 24; updates.width = CANVAS_WIDTH - 48 }
    else if (updates.textAlign === "right") { updates.x = 0;  updates.width = CANVAS_WIDTH - 24 }
    onChange({ ...cur, elements: cur.elements.map((el) =>
      el.id === selectedId ? { ...el, ...updates } : el
    )})
  }

  const addElement = (
    content: string, type: ElementType = "text", additionalProps: Partial<TicketElement> = {}
  ) => {
    const newEl: TicketElement = {
      id: `el-${Date.now()}`, type, x: 24, y: 300, content,
      color: "#ffffff", fontSize: type === "qr" ? 100 : 18,
      fontWeight: "normal", fontFamily: "Arial, sans-serif", textAlign: "left",
      width: type === "text" ? CANVAS_WIDTH - 48 : 100,
      ...additionalProps,
    }
    onChange({ ...cur, elements: [...cur.elements, newEl] })
    setSelectedId(newEl.id)
  }

  const deleteSelected = () => {
    if (!selectedId) return
    // QR is required — don't allow deleting it
    if (selectedEl?.type === "qr") {
      setUploadError(t(locale, "qrRequired") || "QR kodu silinə bilməz — məcburidir")
      return
    }
    onChange({ ...cur, elements: cur.elements.filter((e) => e.id !== selectedId) })
    setSelectedId(null)
  }

  const applyTemplate = (key: keyof typeof TICKET_TEMPLATES) => {
    onChange(TICKET_TEMPLATES[key]); setSelectedId(null)
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-500 items-start">

      {/* ── Canvas ── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary/20 rounded-[2rem] border-2 border-border/50 p-6 lg:p-10 shadow-inner relative w-full overflow-hidden">
        <div
          ref={containerRef}
          className="relative w-[360px] h-[640px] rounded-[32px] shadow-2xl overflow-hidden ring-1 ring-border/20 cursor-crosshair"
          style={{ backgroundColor: cur.bgColor, touchAction: "none", isolation: "isolate" }}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
          onPointerDown={() => setSelectedId(null)}
        >
          {/* Background image */}
          {cur.bgImage && (
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <img
                src={cur.bgImage}
                className="min-w-full min-h-full object-cover"
                style={{ transform: `scale(${cur.bgScale! / 100}) translate(${cur.bgOffsetX}px, ${cur.bgOffsetY}px)` }}
                alt="ticket-bg"
              />
            </div>
          )}
          {cur.bgImage && (
            <div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${cur.bgOverlay})` }} />
          )}

          {/* Header */}
          <div className="absolute top-0 left-0 right-0 h-[70px] bg-zinc-950 text-white flex items-center justify-center z-40 border-b border-white/10 shadow-sm pointer-events-none">
            <div className="flex items-center gap-2 opacity-95">
              <Ticket className="h-6 w-6" />
              <span className="font-black tracking-[0.25em] text-lg mt-0.5">eticksystem</span>
            </div>
          </div>

          {/* Elements */}
          {cur.elements.map((el) => (
            <div
              key={el.id}
              onPointerDown={(e) => handleElementPointerDown(e, el.id, "move")}
              className={cn(
                "absolute cursor-move transition-shadow rounded-lg z-20 flex flex-col group",
                selectedId === el.id
                  ? "ring-2 ring-primary bg-white/5 shadow-lg"
                  : "hover:ring-1 hover:ring-white/20"
              )}
              style={{
                left: el.x, top: el.y,
                color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight,
                fontFamily: el.fontFamily,
                width:  el.width  || (el.type === "qr" ? el.fontSize : "auto"),
                height: el.height || (el.type === "qr" ? el.fontSize : "auto"),
                textAlign: el.textAlign || "left",
              }}
            >
              {el.type === "text" && (
                <span className="leading-tight break-words px-1 select-none">
                  {renderPreview(el.content, eventDetails, buyerQuestions)}
                </span>
              )}
              {el.type === "qr" && (
                <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center p-3 shadow-md border pointer-events-none">
                  <QrCode className="w-full h-full text-black" />
                </div>
              )}
              {el.type === "image" && el.src && (
                <img src={el.src} alt="logo" className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm" draggable={false} />
              )}

              {selectedId === el.id && (
                <div
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-50 shadow-md hover:scale-110 transition-transform"
                  onPointerDown={(e) => handleElementPointerDown(e, el.id, "resize")}
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-8 uppercase tracking-widest font-bold bg-background px-5 py-2.5 rounded-full border shadow-sm">
          Mobile Ticket (360×640)
        </span>
      </div>

      {/* ── Controls ── */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">

        {/* Upload error */}
        {uploadError && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold animate-in fade-in">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{uploadError}</span>
          </div>
        )}

        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="text-xs">
              <LayoutTemplate className="h-3.5 w-3.5 mr-1.5" />
              {t(locale, "presets") || "Presets"}
            </TabsTrigger>
            <TabsTrigger value="background" className="text-xs">
              <ImageIcon className="h-3.5 w-3.5 mr-1.5" />
              {t(locale, "canvas") || "Canvas"}
            </TabsTrigger>
            <TabsTrigger value="elements" className="text-xs">
              <Type className="h-3.5 w-3.5 mr-1.5" />
              {t(locale, "elements") || "Elements"}
            </TabsTrigger>
          </TabsList>

          {/* Templates */}
          <TabsContent value="templates" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3">
                <span className="text-sm font-semibold mb-2">{t(locale, "quickTemplates") || "Quick Templates"}</span>
                {[
                  { key: "classicDark",   bg: "#09090b",  border: "border-white/10", label: "Classic Dark" },
                  { key: "elegantLight",  bg: "#ffffff",  border: "border-black/10", label: "Elegant Light" },
                  { key: "neonCyber",     bg: "#020617",  border: "border-cyan-500/50", label: "Neon Cyber" },
                  { key: "goldVip",       bg: "#1e293b",  border: "border-amber-500/50", label: "Gold VIP" },
                ].map(({ key, bg, border, label }) => (
                  <Button
                    key={key}
                    variant="outline"
                    className="justify-start gap-3 h-12 hover:bg-secondary/50 transition-colors"
                    onClick={() => applyTemplate(key as keyof typeof TICKET_TEMPLATES)}
                  >
                    <div className={cn("w-6 h-6 rounded border", border)} style={{ backgroundColor: bg }} />
                    {label}
                  </Button>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Background */}
          <TabsContent value="background" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 flex flex-col gap-8">

                {/* Solid color */}
                <div className="flex flex-col gap-3">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">
                    {t(locale, "solidColor") || "Solid Color"}
                  </Label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full shadow-inner overflow-hidden border-4 border-background shrink-0 ring-1 ring-border">
                      <input
                        type="color" value={cur.bgColor}
                        onChange={(e) => onChange({ ...cur, bgColor: e.target.value })}
                        className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer"
                      />
                    </div>
                    <Input
                      value={cur.bgColor}
                      onChange={(e) => onChange({ ...cur, bgColor: e.target.value })}
                      className="font-mono text-sm uppercase h-12"
                    />
                  </div>
                </div>

                <Separator />

                {/* Background image */}
                <div className="flex flex-col gap-5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">
                    {t(locale, "bgImage") || "Background Image"}
                  </Label>
                  <input type="file" ref={fileInputRef} onChange={handleBgImageUpload} accept="image/*" className="hidden" />

                  {cur.bgImage ? (
                    <div className="flex flex-col gap-6">
                      <div className="relative h-28 rounded-xl overflow-hidden border border-border group shadow-sm" style={{ isolation: "isolate" }}>
                        <img src={cur.bgImage} className="w-full h-full object-cover" crossOrigin="anonymous" />
                        <Button
                          variant="destructive" size="icon"
                          className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => onChange({ ...cur, bgImage: null })}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Zoom / offset / overlay */}
                      <div className="flex flex-col gap-4 bg-secondary/20 p-4 rounded-xl border">
                        {[
                          { label: t(locale, "zoom") || "Zoom",       icon: <Maximize className="h-3.5 w-3.5 text-primary" />,       val: cur.bgScale!,    min: 50,   max: 300, step: 5,  onChange: (v: number) => onChange({ ...cur, bgScale: v }),   suffix: "%" },
                          { label: t(locale, "positionX") || "Pos X", icon: <MoveHorizontal className="h-3.5 w-3.5 text-primary" />, val: cur.bgOffsetX!, min: -300, max: 300, step: 5,  onChange: (v: number) => onChange({ ...cur, bgOffsetX: v }), suffix: "px" },
                          { label: t(locale, "positionY") || "Pos Y", icon: <MoveVertical className="h-3.5 w-3.5 text-primary" />,   val: cur.bgOffsetY!, min: -300, max: 300, step: 5,  onChange: (v: number) => onChange({ ...cur, bgOffsetY: v }), suffix: "px" },
                        ].map(({ label, icon, val, min, max, step, onChange: onSlide, suffix }) => (
                          <div key={label} className="flex flex-col gap-3">
                            <div className="flex justify-between">
                              <Label className="text-xs font-semibold flex items-center gap-1.5">{icon} {label}</Label>
                              <span className="text-xs text-muted-foreground font-mono">{val}{suffix}</span>
                            </div>
                            <Slider value={[val]} min={min} max={max} step={step} onValueChange={(v) => onSlide(v[0])} />
                          </div>
                        ))}

                        <div className="flex flex-col gap-3 pt-2 border-t border-border/40">
                          <div className="flex justify-between">
                            <Label className="text-xs font-semibold">{t(locale, "darkOverlay") || "Dark Overlay"}</Label>
                            <span className="text-xs text-muted-foreground font-mono">{Math.round(cur.bgOverlay * 100)}%</span>
                          </div>
                          <Slider value={[cur.bgOverlay]} max={1} step={0.05} onValueChange={(v) => onChange({ ...cur, bgOverlay: v[0] })} />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      className="w-full border-dashed h-14 gap-2 text-muted-foreground font-semibold"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                    >
                      {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />}
                      {t(locale, "uploadImage") || "Upload Image"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Elements */}
          <TabsContent value="elements" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm flex-1">
              <CardHeader className="pb-4 border-b mb-5 flex flex-row items-center justify-between bg-secondary/10 rounded-t-xl">
                {selectedId ? (
                  <Button
                    variant="secondary" size="sm"
                    className="gap-2 -ml-2 font-semibold hover:bg-secondary/80 shadow-sm"
                    onClick={() => setSelectedId(null)}
                  >
                    <ArrowLeft className="h-4 w-4" /> {t(locale, "backToElements") || "Back"}
                  </Button>
                ) : (
                  <CardTitle className="text-base">{t(locale, "editor") || "Editor"}</CardTitle>
                )}
                {selectedId && (
                  <Button variant="destructive" size="icon" className="h-8 w-8 -mr-2 shadow-sm" onClick={deleteSelected}>
                    <Trash className="h-4 w-4" />
                  </Button>
                )}
              </CardHeader>

              <CardContent className="flex flex-col gap-6">
                {selectedEl ? (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2">
                    <Badge className="w-max bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                      {selectedEl.type === "qr" ? "QR Code" : selectedEl.type === "image" ? "Image/Logo" : "Text Block"}
                    </Badge>

                    {selectedEl.type === "text" && (
                      <div className="flex flex-col gap-2.5">
                        <Label className="text-xs uppercase text-muted-foreground font-bold">Content</Label>
                        <Input value={selectedEl.content} onChange={(e) => updateSelected({ content: e.target.value })} className="h-11 font-medium" />
                      </div>
                    )}

                    {(selectedEl.type === "qr" || selectedEl.type === "image") && (
                      <div className="flex flex-col gap-3">
                        <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                          <Maximize className="h-3.5 w-3.5" /> {t(locale, "imageSize") || "Size"}
                        </Label>
                        <div className="flex items-center gap-4">
                          <Slider
                            value={[selectedEl.width || selectedEl.fontSize]} min={20} max={300} step={5}
                            onValueChange={(v) => updateSelected({ width: v[0], height: v[0], fontSize: v[0] })}
                            className="flex-1"
                          />
                          <span className="text-xs font-mono text-muted-foreground w-12 text-right bg-secondary px-2 py-1.5 rounded-md border">
                            {selectedEl.width || selectedEl.fontSize}px
                          </span>
                        </div>
                      </div>
                    )}

                    {selectedEl.type === "text" && (
                      <>
                        <div className="flex gap-5">
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                              <Palette className="h-3.5 w-3.5" /> Color
                            </Label>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-md shadow-inner overflow-hidden border border-border shrink-0">
                                <input type="color" value={selectedEl.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                              </div>
                              <Input value={selectedEl.color} onChange={(e) => updateSelected({ color: e.target.value })} className="h-10 text-xs font-mono uppercase" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5">
                              <Maximize className="h-3.5 w-3.5" /> {t(locale, "fontSize") || "Size"}
                            </Label>
                            <Input type="number" value={selectedEl.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="h-10 text-sm font-mono" />
                          </div>
                        </div>

                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "fontFamily") || "Font Family"}</Label>
                          <Select value={selectedEl.fontFamily || "Arial, sans-serif"} onValueChange={(v) => updateSelected({ fontFamily: v })}>
                            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONTS.map((font) => (
                                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-5">
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "weight") || "Weight"}</Label>
                            <Select value={selectedEl.fontWeight} onValueChange={(v: "normal" | "bold") => updateSelected({ fontWeight: v })}>
                              <SelectTrigger className="h-10 text-sm"><SelectValue /></SelectTrigger>
                              <SelectContent>
                                <SelectItem value="normal" className="text-sm">Normal</SelectItem>
                                <SelectItem value="bold" className="text-sm font-bold">Bold</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "align") || "Align"}</Label>
                            <div className="flex items-center gap-1 bg-secondary/30 p-1 rounded-lg border h-10">
                              {(["left", "center", "right"] as const).map((align) => (
                                <Button
                                  key={align}
                                  variant={selectedEl.textAlign === align ? "secondary" : "ghost"}
                                  size="sm" className="flex-1 h-full"
                                  onClick={() => updateSelected({ textAlign: align })}
                                >
                                  {align === "left"   && <AlignLeft className="h-4 w-4" />}
                                  {align === "center" && <AlignCenter className="h-4 w-4" />}
                                  {align === "right"  && <AlignRight className="h-4 w-4" />}
                                </Button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    <div className="flex gap-3">
                      <Button variant="default" className="flex-1 gap-2 h-12 font-semibold shadow-md" onClick={() => addElement("New Text")}>
                        <Type className="h-4 w-4" /> {t(locale, "addText") || "Text"}
                      </Button>
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      <Button variant="secondary" className="flex-1 gap-2 h-12 font-semibold border shadow-sm" onClick={() => logoInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                        {t(locale, "addLogo") || "Logo"}
                      </Button>
                    </div>

                    <Separator />

                    <div className="flex flex-col gap-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">
                        {t(locale, "smartTags") || "Smart Tags"}
                      </Label>
                      <div className="grid grid-cols-2 gap-2.5">
                        {[
                          { label: "+ Event Name",    tag: "{{Event_Name}}" },
                          { label: "+ Date & Time",   tag: "{{Event_Date}}" },
                          { label: "+ Location",      tag: "{{Location}}" },
                          { label: "+ Guest Name",    tag: "{{Guest_Name}}",   primary: true },
                          { label: "+ Ticket Type",   tag: "{{Ticket_Type}}", primary: true },
                          { label: "+ Row & Seat",    tag: "{{Seat_Info}}",   primary: true },
                          { label: "+ Company Name",  tag: "{{Company_Name}}" },
                          { label: "+ Company Phone", tag: "{{Company_Phone}}" },
                        ].map(({ label, tag, primary }) => (
                          <Button
                            key={tag} variant="outline"
                            className={cn(
                              "text-xs h-10 border-dashed font-mono bg-background hover:bg-secondary/50",
                              primary && "bg-primary/5 text-primary border-primary/20 hover:bg-primary/10"
                            )}
                            onClick={() => addElement(tag)}
                          >
                            {label}
                          </Button>
                        ))}
                        {buyerQuestions.filter((q) => q.label.trim()).map((q) => (
                          <Button
                            key={q.id} variant="secondary"
                            className="text-xs h-10 border border-border/50 font-mono shadow-sm"
                            onClick={() => addElement(`{{${q.label}}}`)}
                          >
                            + {q.label}
                          </Button>
                        ))}
                      </div>
                      <span className="text-[10px] text-muted-foreground text-center mt-1 leading-relaxed">
                        {t(locale, "autoFillDesc") || "Smart tags automatically fill with buyer data."}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}