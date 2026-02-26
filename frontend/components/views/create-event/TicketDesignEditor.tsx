"use client"

import { useState, useRef, useEffect } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Slider } from "@/components/ui/slider"
import { Separator } from "@/components/ui/separator"
import { QrCode, Type, Palette, Maximize, Trash, Image as ImageIcon, LayoutTemplate, AlignLeft, AlignCenter, AlignRight, Upload, Loader2, ArrowLeft, MoveHorizontal, MoveVertical, Ticket } from "lucide-react"
import { cn } from "@/lib/utils"

export type ElementType = 'text' | 'qr' | 'image'

export interface TicketElement {
  id: string; type: ElementType; x: number; y: number; content: string; color: string; 
  fontSize: number; fontWeight: 'normal' | 'bold'; fontFamily?: string; textAlign?: 'left' | 'center' | 'right';
  width?: number; height?: number; src?: string;
}

export interface TicketDesign {
  bgColor: string; bgImage: string | null; bgOverlay: number; 
  bgScale?: number; bgOffsetX?: number; bgOffsetY?: number;
  elements: TicketElement[]
}

interface TicketDesignEditorProps {
  design: TicketDesign; 
  onChange: (d: TicketDesign) => void; 
  eventDetails: { title: string; date: string; location: string };
  buyerQuestions?: { id: string; label: string; required: boolean }[];
}

const HEADER_HEIGHT = 70; // "Потолок" для элементов
const CANVAS_WIDTH = 360;

// НОВЫЕ ПРЕМИУМ-ШАБЛОНЫ
const TEMPLATES: Record<string, TicketDesign> = {
  minimalDark: { 
    bgColor: "#09090b", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: 'qr-1', type: 'qr', x: 120, y: 460, content: 'QR_CODE', color: '#ffffff', fontSize: 120, fontWeight: 'normal' }, 
      { id: 't-1', type: 'text', x: 24, y: 100, content: '{{Event_Name}}', color: '#ffffff', fontSize: 32, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }, 
      { id: 't-2', type: 'text', x: 24, y: 150, content: '{{Event_Date}} • {{Location}}', color: '#a1a1aa', fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }, 
      { id: 't-3', type: 'text', x: 24, y: 220, content: '{{Guest_Name}}', color: '#ffffff', fontSize: 24, fontWeight: 'bold', fontFamily: '"Courier New", Courier, monospace', textAlign: 'left', width: 312 }, 
      { id: 't-4', type: 'text', x: 24, y: 260, content: '{{Ticket_Type}} • {{Seat_Info}}', color: '#3b82f6', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }
    ] 
  },
  goldVip: { 
    bgColor: "#0f172a", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: 'qr-1', type: 'qr', x: 120, y: 440, content: 'QR_CODE', color: '#ffffff', fontSize: 120, fontWeight: 'normal' }, 
      { id: 't-1', type: 'text', x: 0, y: 110, content: '{{Event_Name}}', color: '#d4af37', fontSize: 30, fontWeight: 'bold', fontFamily: 'Georgia, serif', textAlign: 'center', width: CANVAS_WIDTH }, 
      { id: 't-2', type: 'text', x: 0, y: 200, content: 'V I P   T I C K E T', color: '#d4af37', fontSize: 14, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'center', width: CANVAS_WIDTH }, 
      { id: 't-3', type: 'text', x: 0, y: 240, content: '{{Guest_Name}}', color: '#ffffff', fontSize: 26, fontWeight: 'normal', fontFamily: 'Georgia, serif', textAlign: 'center', width: CANVAS_WIDTH },
      { id: 't-4', type: 'text', x: 0, y: 280, content: '{{Seat_Info}}', color: '#94a3b8', fontSize: 16, fontWeight: 'normal', fontFamily: 'Arial, sans-serif', textAlign: 'center', width: CANVAS_WIDTH }
    ] 
  },
  milliAz: { 
    bgColor: "#00b5e2", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: 'qr-1', type: 'qr', x: 120, y: 450, content: 'QR_CODE', color: '#ffffff', fontSize: 120, fontWeight: 'normal' }, 
      { id: 't-1', type: 'text', x: 0, y: 110, content: '{{Event_Name}}', color: '#ffffff', fontSize: 36, fontWeight: 'bold', fontFamily: 'Impact, Charcoal, sans-serif', textAlign: 'center', width: CANVAS_WIDTH }, 
      { id: 't-2', type: 'text', x: 0, y: 165, content: '{{Event_Date}}', color: '#509e2f', fontSize: 20, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'center', width: CANVAS_WIDTH }, 
      { id: 't-3', type: 'text', x: 0, y: 240, content: '{{Guest_Name}}', color: '#ffffff', fontSize: 28, fontWeight: 'bold', fontFamily: '"Trebuchet MS", sans-serif', textAlign: 'center', width: CANVAS_WIDTH }, 
      { id: 't-4', type: 'text', x: 0, y: 280, content: '{{Ticket_Type}} | {{Seat_Info}}', color: '#ef3340', fontSize: 18, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'center', width: CANVAS_WIDTH }
    ] 
  },
  corporateBlue: {
    bgColor: "#ffffff", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: 'qr-1', type: 'qr', x: 24, y: 450, content: 'QR_CODE', color: '#000000', fontSize: 110, fontWeight: 'normal' }, 
      { id: 't-1', type: 'text', x: 24, y: 100, content: '{{Event_Name}}', color: '#0f172a', fontSize: 28, fontWeight: 'bold', fontFamily: '"Trebuchet MS", sans-serif', textAlign: 'left', width: 312 }, 
      { id: 't-2', type: 'text', x: 24, y: 145, content: '{{Location}}', color: '#64748b', fontSize: 14, fontWeight: 'normal', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }, 
      { id: 't-3', type: 'text', x: 24, y: 240, content: '{{Guest_Name}}', color: '#0f172a', fontSize: 30, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }, 
      { id: 't-4', type: 'text', x: 24, y: 285, content: '{{Ticket_Type}}', color: '#2563eb', fontSize: 16, fontWeight: 'bold', fontFamily: 'Arial, sans-serif', textAlign: 'left', width: 312 }
    ]
  }
}

const FONTS = [
  { name: 'Inter / Arial', value: 'Arial, sans-serif' },
  { name: 'Helvetica', value: 'Helvetica, sans-serif' },
  { name: 'Georgia (Serif)', value: 'Georgia, serif' },
  { name: 'Palatino', value: '"Palatino Linotype", "Book Antiqua", Palatino, serif' },
  { name: 'Courier (Mono)', value: '"Courier New", Courier, monospace' },
  { name: 'Impact (Bold)', value: 'Impact, Charcoal, sans-serif' },
  { name: 'Trebuchet MS', value: '"Trebuchet MS", "Lucida Grande", "Lucida Sans Unicode", "Lucida Sans", Tahoma, sans-serif' },
]

export function TicketDesignEditor({ design, onChange, eventDetails, buyerQuestions = [] }: TicketDesignEditorProps) {
  const { locale } = useLocale()
  const containerRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const logoInputRef = useRef<HTMLInputElement>(null)
  
  const [selectedId, setSelectedId] = useState<string | null>(null)
  
  // Состояния для перетаскивания и ресайза
  const [interactionMode, setInteractionMode] = useState<'none'|'move'|'resize'>('none')
  const [isUploading, setIsUploading] = useState(false)
  
  // Для расчетов при перетаскивании
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [initialSize, setInitialSize] = useState(0)

  // ЖЕСТКАЯ ЗАЩИТА: Если design пустой, берем дефолтный
  const safeDesign = design || TEMPLATES.minimalDark;

  const currentDesign = {
    ...safeDesign,
    bgScale: safeDesign.bgScale ?? 100,
    bgOffsetX: safeDesign.bgOffsetX ?? 0,
    bgOffsetY: safeDesign.bgOffsetY ?? 0,
    elements: safeDesign.elements || []
  }

  const selectedElement = currentDesign.elements.find(e => e.id === selectedId)

  // УМНЫЙ ПРЕДПРОСМОТР ТЕГОВ
  const renderSmartPreview = (content: string) => {
    let preview = content
      .replace(/{{Event_Name}}/g, eventDetails.title || "My Awesome Event")
      .replace(/{{Event_Date}}/g, eventDetails.date || "12.12.2026")
      .replace(/{{Location}}/g, eventDetails.location || "Baku, AZ")
      .replace(/{{Guest_Name}}/g, "John Doe")
      .replace(/{{Ticket_Type}}/g, "VIP")
      .replace(/{{Seat_Info}}/g, "Row 1, Seat 12");

    buyerQuestions.forEach(q => {
      if (q.label.trim()) {
        const regex = new RegExp(`{{${q.label}}}`, 'g');
        preview = preview.replace(regex, `Sample ${q.label}`);
      }
    });
    return preview;
  }

  // === ЛОГИКА МЫШИ (ДРАГ И РЕСАЙЗ) ===
  const handleElementPointerDown = (e: React.PointerEvent, id: string, mode: 'move'|'resize') => { 
    // Отключаем дефолтное поведение браузера (выделение текста, картинок)
    e.preventDefault(); 
    e.stopPropagation(); 
    
    setSelectedId(id); 
    setInteractionMode(mode); 
    
    const el = currentDesign.elements.find(el => el.id === id); 
    if (el) {
      if (mode === 'move') {
        setDragOffset({ x: e.clientX - el.x, y: e.clientY - el.y }); 
      } else if (mode === 'resize') {
        // Запоминаем изначальный размер для ресайза
        setInitialSize(el.type === 'text' ? el.fontSize : (el.width || el.fontSize));
        setDragOffset({ x: e.clientX, y: e.clientY }); // Используем dragOffset для хранения стартовой точки мыши
      }
    }
    containerRef.current?.setPointerCapture(e.pointerId) 
  }
  
  const handlePointerMove = (e: React.PointerEvent) => { 
    if (interactionMode === 'none' || !selectedId) return; 
    
    if (interactionMode === 'move') {
      let newX = e.clientX - dragOffset.x; 
      let newY = e.clientY - dragOffset.y; 
      
      // ПОТОЛОК: Не даем элементу залезть на шапку TICKIT
      if (newY < HEADER_HEIGHT) newY = HEADER_HEIGHT;
      // ОГРАНИЧИТЕЛЬ: Не даем улететь за левый/правый край
      if (newX < -200) newX = -200; 

      onChange({ ...currentDesign, elements: currentDesign.elements.map(el => el.id === selectedId ? { ...el, x: newX, y: newY } : el) }) 
    
    } else if (interactionMode === 'resize') {
      const dx = e.clientX - dragOffset.x;
      // Меняем размер на величину смещения мыши (с коэффициентом для плавности)
      const newSize = Math.max(10, Math.floor(initialSize + dx * 0.8)); 
      
      onChange({ ...currentDesign, elements: currentDesign.elements.map(el => {
        if (el.id !== selectedId) return el;
        if (el.type === 'text') return { ...el, fontSize: newSize };
        return { ...el, width: newSize, height: newSize, fontSize: newSize }; // Для QR и Image
      })})
    }
  }
  
  const handlePointerUp = (e: React.PointerEvent) => { 
    setInteractionMode('none'); 
    if (containerRef.current?.hasPointerCapture(e.pointerId)) containerRef.current.releasePointerCapture(e.pointerId) 
  }

  // === ОБНОВЛЕНИЕ ПАРАМЕТРОВ ЧЕРЕЗ МЕНЮ ===
  const updateSelected = (updates: Partial<TicketElement>) => { 
    if (!selectedId) return; 
    
    // ИДЕАЛЬНОЕ ВЫРАВНИВАНИЕ: Растягиваем блок по ширине, чтобы центровка работала
    if (updates.textAlign === 'center') {
      updates.x = 0; updates.width = CANVAS_WIDTH;
    } else if (updates.textAlign === 'left') {
      updates.x = 24; updates.width = CANVAS_WIDTH - 48;
    } else if (updates.textAlign === 'right') {
      updates.x = 0; updates.width = CANVAS_WIDTH - 24; 
    }

    onChange({ ...currentDesign, elements: currentDesign.elements.map(el => el.id === selectedId ? { ...el, ...updates } : el) }) 
  }

  const addElement = (content: string, type: ElementType = 'text', additionalProps: any = {}) => { 
    const newEl: TicketElement = { 
      id: `el-${Date.now()}`, type, x: 24, y: 300, content, 
      color: '#ffffff', fontSize: type === 'qr' ? 100 : 18, fontWeight: 'normal', fontFamily: 'Arial, sans-serif', textAlign: 'left',
      width: type === 'text' ? (CANVAS_WIDTH - 48) : 100, // По умолчанию текст на всю ширину с отступами
      ...additionalProps
    }; 
    onChange({ ...currentDesign, elements: [...currentDesign.elements, newEl] }); 
    setSelectedId(newEl.id) 
  }

  const deleteSelected = () => { 
    if (!selectedId) return; 
    if (selectedElement?.type === 'qr') { alert("QR Code is required!"); return }; 
    onChange({ ...currentDesign, elements: currentDesign.elements.filter(e => e.id !== selectedId) }); 
    setSelectedId(null) 
  }

  const applyTemplate = (key: keyof typeof TEMPLATES) => { onChange(TEMPLATES[key]); setSelectedId(null) }

  // ЗАГРУЗКА ФОНА И ЛОГОТИПОВ
  const handleBgImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploading(true); const formData = new FormData(); formData.append("file", file)
    try { 
      const token = localStorage.getItem("tickit_token") || ""; 
      const response = await fetch("http://localhost:8080/api/v1/upload/image", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData }); 
      if (!response.ok) throw new Error("Upload failed"); 
      const data = await response.json(); 
      onChange({ ...currentDesign, bgImage: `http://localhost:8080${data.url}`, bgOverlay: 0.2, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0 }) 
    } catch (error) { console.error(error); alert("Failed to upload background") } finally { setIsUploading(false) }
  }

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return; setIsUploading(true); const formData = new FormData(); formData.append("file", file)
    try { 
      const token = localStorage.getItem("tickit_token") || ""; 
      const response = await fetch("http://localhost:8080/api/v1/upload/image", { method: "POST", headers: { "Authorization": `Bearer ${token}` }, body: formData }); 
      if (!response.ok) throw new Error("Upload failed"); 
      const data = await response.json(); 
      addElement('Logo', 'image', { src: `http://localhost:8080${data.url}`, width: 100, height: 100 });
    } catch (error) { console.error(error); alert("Failed to upload logo") } finally { setIsUploading(false) }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-8 animate-in slide-in-from-bottom-4 duration-500 items-start">
      
      {/* КАНВАС БИЛЕТА (Увеличенный размер 360x640) */}
      <div className="flex-1 flex flex-col items-center justify-center bg-secondary/20 rounded-[2rem] border-2 border-border/50 p-6 lg:p-10 shadow-inner relative w-full overflow-hidden">
        <div 
          ref={containerRef} 
          className="relative w-[360px] h-[640px] rounded-[32px] shadow-2xl overflow-hidden ring-1 ring-border/20 cursor-crosshair transition-colors bg-background" 
          style={{ backgroundColor: currentDesign.bgColor, touchAction: 'none' }} 
          onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerLeave={handlePointerUp} onPointerDown={() => setSelectedId(null)}
        >
          {/* Слой Изображения Фона (Используем Translate для правильного сдвига) */}
          {currentDesign.bgImage && (
            <div className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none">
              <img 
                src={currentDesign.bgImage} 
                className="min-w-full min-h-full object-cover"
                style={{ 
                  transform: `scale(${currentDesign.bgScale! / 100}) translate(${currentDesign.bgOffsetX}px, ${currentDesign.bgOffsetY}px)` 
                }}
                alt="ticket-bg"
              />
            </div>
          )}

          {/* Слой затемнения фона */}
          {currentDesign.bgImage && (<div className="absolute inset-0 z-0 pointer-events-none" style={{ backgroundColor: `rgba(0,0,0,${currentDesign.bgOverlay})` }} />)}
          
          {/* ФИКСИРОВАННАЯ ШАПКА БИЛЕТА (TICKIT BRANDING) */}
          <div className="absolute top-0 left-0 right-0 h-[70px] bg-zinc-950 text-white flex items-center justify-center z-40 border-b border-white/10 shadow-sm pointer-events-none">
            <div className="flex items-center gap-2 opacity-95">
              <Ticket className="h-6 w-6" />
              <span className="font-black tracking-[0.25em] text-lg mt-0.5">TICKIT</span>
            </div>
          </div>

          {/* РЕНДЕР ЭЛЕМЕНТОВ */}
          {currentDesign.elements.map(el => (
            <div 
              key={el.id} 
              onPointerDown={(e) => handleElementPointerDown(e, el.id, 'move')} 
              className={cn("absolute cursor-move transition-shadow rounded-lg z-20 flex flex-col group", selectedId === el.id ? "ring-2 ring-primary bg-white/5 shadow-lg" : "hover:ring-1 hover:ring-white/20")} 
              style={{ 
                left: el.x, top: el.y, color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight, fontFamily: el.fontFamily, 
                width: el.width || (el.type === 'qr' ? el.fontSize : 'auto'), 
                height: el.height || (el.type === 'qr' ? el.fontSize : 'auto'),
                textAlign: el.textAlign || 'left' 
              }}
            >
              {el.type === 'text' && (<span className="leading-tight break-words px-1 select-none">{renderSmartPreview(el.content)}</span>)}
              {el.type === 'qr' && (<div className="w-full h-full bg-white rounded-2xl flex items-center justify-center p-3 shadow-md border pointer-events-none"><QrCode className="w-full h-full text-black" /></div>)}
              {el.type === 'image' && el.src && (<img src={el.src} alt="logo" className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm" draggable={false} />)}
              
              {/* ТОЧКА ДЛЯ ИЗМЕНЕНИЯ РАЗМЕРА (RESIZE HANDLE) */}
              {selectedId === el.id && (
                <div 
                  className="absolute -bottom-2 -right-2 w-5 h-5 bg-primary border-2 border-white rounded-full cursor-nwse-resize z-50 shadow-md hover:scale-110 transition-transform"
                  onPointerDown={(e) => handleElementPointerDown(e, el.id, 'resize')}
                />
              )}
            </div>
          ))}
        </div>
        <span className="text-xs text-muted-foreground mt-8 uppercase tracking-widest font-bold bg-background px-5 py-2.5 rounded-full border shadow-sm">
          Mobile Ticket (360x640)
        </span>
      </div>

      {/* ПАНЕЛЬ ИНСТРУМЕНТОВ */}
      <div className="w-full lg:w-[400px] flex flex-col gap-4">
        <Tabs defaultValue="elements" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="templates" className="text-xs"><LayoutTemplate className="h-3.5 w-3.5 mr-1.5"/> {t(locale, "presets") || "Presets"}</TabsTrigger>
            <TabsTrigger value="background" className="text-xs"><ImageIcon className="h-3.5 w-3.5 mr-1.5"/> {t(locale, "canvas") || "Canvas"}</TabsTrigger>
            <TabsTrigger value="elements" className="text-xs"><Type className="h-3.5 w-3.5 mr-1.5"/> {t(locale, "elements") || "Elements"}</TabsTrigger>
          </TabsList>
          
          {/* ВКЛАДКА: ПРЕСЕТЫ */}
          <TabsContent value="templates" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3">
                <span className="text-sm font-semibold mb-2">{t(locale, "quickTemplates") || "Quick Templates"}</span>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => applyTemplate('minimalDark')}><div className="w-6 h-6 rounded bg-[#09090b] border" /> Minimal Dark</Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => applyTemplate('goldVip')}><div className="w-6 h-6 rounded bg-[#0f172a] border border-yellow-600/50" /> Gold VIP</Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => applyTemplate('milliAz')}><div className="w-6 h-6 rounded bg-[#00b5e2] border border-[#ef3340]" /> Milli (AZ)</Button>
                <Button variant="outline" className="justify-start gap-3 h-12" onClick={() => applyTemplate('corporateBlue')}><div className="w-6 h-6 rounded bg-white border border-blue-600" /> Corporate White</Button>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ВКЛАДКА: ФОН */}
          <TabsContent value="background" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm">
              <CardContent className="p-6 flex flex-col gap-8">
                <div className="flex flex-col gap-3">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "solidColor") || "Solid Color"}</Label>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full shadow-inner overflow-hidden border-4 border-background shrink-0 ring-1 ring-border">
                      <input type="color" value={currentDesign.bgColor} onChange={(e) => onChange({ ...currentDesign, bgColor: e.target.value })} className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                    </div>
                    <Input value={currentDesign.bgColor} onChange={(e) => onChange({ ...currentDesign, bgColor: e.target.value })} className="font-mono text-sm uppercase h-12" />
                  </div>
                </div>
                <Separator />
                <div className="flex flex-col gap-5">
                  <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "bgImage") || "Background Image"}</Label>
                  <input type="file" ref={fileInputRef} onChange={handleBgImageUpload} accept="image/*" className="hidden" />
                  
                  {currentDesign.bgImage ? (
                    <div className="flex flex-col gap-6">
                      <div className="relative h-28 rounded-xl overflow-hidden border border-border group shadow-sm">
                        <img src={currentDesign.bgImage} className="w-full h-full object-cover" crossOrigin="anonymous"/>
                        <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => onChange({ ...currentDesign, bgImage: null })}><Trash className="h-4 w-4" /></Button>
                      </div>
                      
                      {/* УПРАВЛЕНИЕ ФОНОМ (ИСПРАВЛЕНО НА ПИКСЕЛИ) */}
                      <div className="flex flex-col gap-4 bg-secondary/20 p-4 rounded-xl border">
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between"><Label className="text-xs font-semibold flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5 text-primary"/> {t(locale, "zoom") || "Zoom"}</Label><span className="text-xs text-muted-foreground font-mono">{currentDesign.bgScale}%</span></div>
                          <Slider value={[currentDesign.bgScale || 100]} min={50} max={300} step={5} onValueChange={(v) => onChange({ ...currentDesign, bgScale: v[0] })} />
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between"><Label className="text-xs font-semibold flex items-center gap-1.5"><MoveHorizontal className="h-3.5 w-3.5 text-primary"/> {t(locale, "positionX") || "Position X"}</Label><span className="text-xs text-muted-foreground font-mono">{currentDesign.bgOffsetX}px</span></div>
                          <Slider value={[currentDesign.bgOffsetX || 0]} min={-300} max={300} step={5} onValueChange={(v) => onChange({ ...currentDesign, bgOffsetX: v[0] })} />
                        </div>
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between"><Label className="text-xs font-semibold flex items-center gap-1.5"><MoveVertical className="h-3.5 w-3.5 text-primary"/> {t(locale, "positionY") || "Position Y"}</Label><span className="text-xs text-muted-foreground font-mono">{currentDesign.bgOffsetY}px</span></div>
                          <Slider value={[currentDesign.bgOffsetY || 0]} min={-300} max={300} step={5} onValueChange={(v) => onChange({ ...currentDesign, bgOffsetY: v[0] })} />
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between"><Label className="text-xs font-semibold">{t(locale, "darkOverlay") || "Dark Overlay"}</Label><span className="text-xs text-muted-foreground font-mono">{Math.round(currentDesign.bgOverlay * 100)}%</span></div>
                        <Slider value={[currentDesign.bgOverlay]} max={1} step={0.05} onValueChange={(v) => onChange({ ...currentDesign, bgOverlay: v[0] })} />
                      </div>
                    </div>
                  ) : (
                    <Button variant="outline" className="w-full border-dashed h-14 gap-2 text-muted-foreground font-semibold" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>{isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Upload className="h-5 w-5" />} {t(locale, "uploadImage") || "Upload Image"}</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* ВКЛАДКА: ЭЛЕМЕНТЫ */}
          <TabsContent value="elements" className="mt-4 flex flex-col gap-3">
            <Card className="border-border/60 shadow-sm flex-1">
              <CardHeader className="pb-4 border-b mb-5 flex flex-row items-center justify-between bg-secondary/10 rounded-t-xl">
                
                {selectedId ? (
                  <Button variant="secondary" size="sm" className="gap-2 -ml-2 font-semibold hover:bg-secondary/80 shadow-sm" onClick={() => setSelectedId(null)}>
                    <ArrowLeft className="h-4 w-4" /> {t(locale, "backToElements") || "Back"}
                  </Button>
                ) : (
                  <CardTitle className="text-base">{t(locale, "editor") || "Editor"}</CardTitle>
                )}

                {selectedId && <Button variant="destructive" size="icon" className="h-8 w-8 -mr-2 shadow-sm" onClick={deleteSelected}><Trash className="h-4 w-4" /></Button>}
              </CardHeader>
              
              <CardContent className="flex flex-col gap-6">
                {selectedElement ? (
                  <div className="flex flex-col gap-6 animate-in fade-in slide-in-from-right-2">
                    
                    <Badge className="w-max bg-primary/10 text-primary hover:bg-primary/20 border-primary/20">
                      {selectedElement.type === 'qr' ? 'QR Code' : selectedElement.type === 'image' ? 'Image/Logo' : 'Text Block'}
                    </Badge>

                    {selectedElement.type === 'text' && (
                      <div className="flex flex-col gap-2.5">
                        <Label className="text-xs uppercase text-muted-foreground font-bold">Content</Label>
                        <Input value={selectedElement.content} onChange={(e) => updateSelected({ content: e.target.value })} className="h-11 font-medium" />
                      </div>
                    )}

                    {(selectedElement.type === 'qr' || selectedElement.type === 'image') && (
                      <div className="flex flex-col gap-3">
                        <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5"/> {t(locale, "imageSize") || "Size"}</Label>
                        <div className="flex items-center gap-4">
                          <Slider value={[selectedElement.width || selectedElement.fontSize]} min={20} max={300} step={5} onValueChange={(v) => updateSelected({ width: v[0], height: v[0], fontSize: v[0] })} className="flex-1" />
                          <span className="text-xs font-mono text-muted-foreground w-12 text-right bg-secondary px-2 py-1.5 rounded-md border">{selectedElement.width || selectedElement.fontSize}px</span>
                        </div>
                      </div>
                    )}

                    {selectedElement.type === 'text' && (
                      <>
                        <div className="flex gap-5">
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5"><Palette className="h-3.5 w-3.5"/> Color</Label>
                            <div className="flex items-center gap-2">
                              <div className="w-10 h-10 rounded-md shadow-inner overflow-hidden border border-border shrink-0">
                                <input type="color" value={selectedElement.color} onChange={(e) => updateSelected({ color: e.target.value })} className="w-[200%] h-[200%] -translate-x-1/4 -translate-y-1/4 cursor-pointer" />
                              </div>
                              <Input value={selectedElement.color} onChange={(e) => updateSelected({ color: e.target.value })} className="h-10 text-xs font-mono uppercase" />
                            </div>
                          </div>
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold flex items-center gap-1.5"><Maximize className="h-3.5 w-3.5"/> {t(locale, "fontSize") || "Size"}</Label>
                            <Input type="number" value={selectedElement.fontSize} onChange={(e) => updateSelected({ fontSize: Number(e.target.value) })} className="h-10 text-sm font-mono" />
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "fontFamily") || "Font Family"}</Label>
                          <Select value={selectedElement.fontFamily || 'Arial, sans-serif'} onValueChange={(v) => updateSelected({ fontFamily: v })}>
                            <SelectTrigger className="h-11 text-sm"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              {FONTS.map(font => (
                                <SelectItem key={font.value} value={font.value} style={{ fontFamily: font.value }}>{font.name}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="flex gap-5">
                          <div className="flex flex-col gap-2.5 flex-1">
                            <Label className="text-xs uppercase text-muted-foreground font-bold">{t(locale, "weight") || "Weight"}</Label>
                            <Select value={selectedElement.fontWeight} onValueChange={(v: 'normal'|'bold') => updateSelected({ fontWeight: v })}>
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
                              <Button variant={selectedElement.textAlign === 'left' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-full" onClick={() => updateSelected({ textAlign: 'left' })}><AlignLeft className="h-4 w-4" /></Button>
                              <Button variant={selectedElement.textAlign === 'center' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-full" onClick={() => updateSelected({ textAlign: 'center' })}><AlignCenter className="h-4 w-4" /></Button>
                              <Button variant={selectedElement.textAlign === 'right' ? 'secondary' : 'ghost'} size="sm" className="flex-1 h-full" onClick={() => updateSelected({ textAlign: 'right' })}><AlignRight className="h-4 w-4" /></Button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col gap-6">
                    
                    <div className="flex gap-3">
                      <Button variant="default" className="flex-1 gap-2 h-12 font-semibold shadow-md" onClick={() => addElement('New Text')}>
                        <Type className="h-4 w-4" /> {t(locale, "addText") || "Text"}
                      </Button>
                      
                      <input type="file" ref={logoInputRef} onChange={handleLogoUpload} accept="image/*" className="hidden" />
                      <Button variant="secondary" className="flex-1 gap-2 h-12 font-semibold border shadow-sm" onClick={() => logoInputRef.current?.click()} disabled={isUploading}>
                        {isUploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />} {t(locale, "addLogo") || "Logo"}
                      </Button>
                    </div>

                    <Separator />
                    <div className="flex flex-col gap-3">
                      <Label className="text-xs uppercase text-muted-foreground font-bold tracking-wider">{t(locale, "smartTags") || "Smart Tags"}</Label>
                      
                      <div className="grid grid-cols-2 gap-2.5">
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-background hover:bg-secondary/50" onClick={() => addElement('{{Event_Name}}')}>+ Event Name</Button>
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-background hover:bg-secondary/50" onClick={() => addElement('{{Event_Date}}')}>+ Date & Time</Button>
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-background hover:bg-secondary/50" onClick={() => addElement('{{Location}}')}>+ Location</Button>
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => addElement('{{Guest_Name}}')}>+ Guest Name</Button>
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => addElement('{{Ticket_Type}}')}>+ Ticket Type</Button>
                        <Button variant="outline" className="text-xs h-10 border-dashed font-mono bg-primary/5 text-primary border-primary/20 hover:bg-primary/10" onClick={() => addElement('{{Seat_Info}}')}>+ Row & Seat</Button>
                        
                        {buyerQuestions.filter(q => q.label.trim()).map(q => (
                          <Button key={q.id} variant="secondary" className="text-xs h-10 border border-border/50 font-mono shadow-sm" onClick={() => addElement(`{{${q.label}}}`)}>
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