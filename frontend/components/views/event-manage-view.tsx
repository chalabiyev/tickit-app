"use client"

import { useState, useRef, useEffect } from "react"
import dynamic from "next/dynamic"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  MapPin,
  Search,
  Upload,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Clock,
  Globe,
  Power,
  ShieldAlert,
  Lock,
  Ticket,
  UserCheck
} from "lucide-react"
import { cn } from "@/lib/utils"

// 1. ЗАГРУЖАЕМ КАРТУ БЕЗ SSR
const MapComponent = dynamic(() => import("./create-event/MapComponent"), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-secondary/50 animate-pulse flex items-center justify-center text-muted-foreground text-sm font-medium border-2 border-border rounded-xl">Xəritə yüklənir...</div> 
})

// 2. ВСТРАИВАЕМ КОМПОНЕНТ ПОИСКА ЛОКАЦИИ
interface LocationPickerProps {
  address: string
  setAddress: (address: string) => void
}

export function LocationPicker({ address, setAddress }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([40.409264, 49.867092]) 
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  const handleSearch = (query: string) => {
    setAddress(query) 
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (query.length < 3) { setSuggestions([]); return }
    
    setIsSearching(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=az&limit=5&accept-language=az&email=dev@tickit.az`)        
        if (!res.ok) throw new Error("API limit reached")
        const data = await res.json()
        setSuggestions(data)
      } catch (e) {
        console.error("Search failed.", e)
      } finally {
        setIsSearching(false)
      }
    }, 800) 
  }

  const handleSelect = (item: any) => {
    setAddress(item.display_name)
    setPosition([parseFloat(item.lat), parseFloat(item.lon)])
    setSuggestions([])
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng])
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=az&email=dev@tickit.az`)
      if (!res.ok) throw new Error("API limit reached")
      const data = await res.json()
      if (data && data.display_name) setAddress(data.display_name)
    } catch (e) {
      console.error("Reverse geocoding failed", e)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full relative">
      <div className="relative z-50">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Məsələn: Nizami küçəsi 50, Bakı" className="pl-10 h-11 text-base shadow-sm bg-secondary/20" value={address} onChange={(e) => handleSearch(e.target.value)} />
        {isSearching && <div className="absolute right-3 top-1/2 -translate-y-1/2"><div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div></div>}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((item, i) => (
              <div key={i} className="flex items-start gap-3 p-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-0 transition-colors" onClick={() => handleSelect(item)}>
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-sm font-medium text-foreground leading-snug">{item.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border-2 border-border/50 shadow-inner z-0">
        <MapComponent position={position} onMapClick={handleMapClick} />
      </div>
    </div>
  )
}

// 3. ОСНОВНОЙ КОМПОНЕНТ
export interface EventData {
  id: string | number 
  name: string
  date: string
  location: string
  sold: number
  total: number
  status: "active" | "pending" | "past"
  image: string
}

interface EventManageViewProps {
  event: EventData
  onBack: () => void
}

const categories = ["concert", "conference", "workshop", "sports", "theater", "exhibition", "other"] as const
const ageRestrictions = ["0+", "3+", "6+", "12+", "16+", "18+", "21+"] as const

export function EventManageView({ event, onBack }: EventManageViewProps) {
  const { locale } = useLocale()
  
  const [isLoading, setIsLoading] = useState(true)
  const [fetchError, setFetchError] = useState("")

  const [salesActive, setSalesActive] = useState(event.status === "active")
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [category, setCategory] = useState("concert") 
  const [date, setDate] = useState("")
  const [startTime, setStartTime] = useState("")
  const [endTime, setEndTime] = useState("")
  const [isPhysical, setIsPhysical] = useState(true)
  const [venueName, setVenueName] = useState("")
  const [address, setAddress] = useState("")
  
  const [isPrivate, setIsPrivate] = useState(false)
  const [ageRestriction, setAgeRestriction] = useState("0+")
  const [maxTicketsPerOrder, setMaxTicketsPerOrder] = useState<number>(10)

  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  useEffect(() => {
    const fetchFullEvent = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        const response = await fetch(`http://72.60.135.9:8080/api/v1/events/${event.id}`, {
          headers: { "Authorization": `Bearer ${token}` }
        })

        if (!response.ok) throw new Error("Failed to load full event details")
        const data = await response.json()

        setTitle(data.title || "")
        setDescription(data.description || "")
        setCategory(data.category || "concert")
        setDate(data.eventDate || "")
        setStartTime(data.startTime || "")
        setEndTime(data.endTime || "")
        setIsPhysical(data.isPhysical ?? true)
        setVenueName(data.venueName || "")
        setAddress(data.address || "")
        if (data.coverImageUrl) {
          const imgPath = data.coverImageUrl;
          // Если ссылка уже содержит http (например, с внешнего сервера), оставляем как есть.
          // Иначе аккуратно приклеиваем 72.60.135.9, проверяя слеши.
          setCoverImageUrl(imgPath.startsWith("http") ? imgPath : `http://72.60.135.9:8080${imgPath.startsWith("/") ? "" : "/"}${imgPath}`);
        } else {
          setCoverImageUrl(null);
        }
        setSalesActive(data.status !== "PAUSED") 
        
        setIsPrivate(data.isPrivate || false)
        setAgeRestriction(data.ageRestriction || "0+")
        setMaxTicketsPerOrder(data.maxTicketsPerOrder || 10) 

      } catch (err: any) {
        setFetchError(err.message)
      } finally {
        setIsLoading(false)
      }
    }
    fetchFullEvent()
  }, [event.id])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("tickit_token") || ""
      const response = await fetch("http://72.60.135.9:8080/api/v1/upload/image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      setCoverImageUrl(`http://72.60.135.9:8080${data.url}`)
    } catch (error) {
      showToast("Şəkil yüklənə bilmədi", "error") 
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("tickit_token") || ""
      
      const payload = { 
        title, 
        description, 
        category, 
        eventDate: date,
        startTime,
        endTime,
        isPhysical,
        venueName,
        address,
        isPrivate, 
        ageRestriction, 
        maxTicketsPerOrder, 
        coverImageUrl: coverImageUrl?.replace("http://72.60.135.9:8080", "") 
      }

      const response = await fetch(`http://72.60.135.9:8080/api/v1/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error("Failed to update event")
      
      showToast("Məlumatlar uğurla yadda saxlanıldı!", "success") 
      
      // ИСПРАВЛЕНИЕ: Автоматический возврат в дашборд через 1.5 секунды
      setTimeout(() => {
        onBack()
      }, 1500)

    } catch (error) {
      showToast("Səhv baş verdi!", "error") 
      setIsSaving(false) // Сбрасываем только если ошибка, иначе спиннер крутится до редиректа
    } 
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("tickit_token") || ""
      const response = await fetch(`http://72.60.135.9:8080/api/v1/events/${event.id}`, {
        method: "DELETE",
        headers: { "Authorization": `Bearer ${token}` }
      })

      if (!response.ok) throw new Error("Failed to delete event")

      setShowDeleteModal(false)
      showToast("Tədbir silindi!", "success") 
      setTimeout(() => onBack(), 1500)
    } catch (error) {
      showToast("Səhv baş verdi!", "error") 
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-muted-foreground gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="font-medium text-sm">Məlumatlar yüklənir...</p>
      </div>
    )
  }

  // ИСПРАВЛЕНИЕ: Оборачиваем все в Fragment (<>), чтобы Toast был вне анимированного контейнера
  return (
    <>
      <div className="flex flex-col gap-6 relative animate-in fade-in duration-300 pb-10">
        
        {/* Шапка (убрали отсюда кнопку Сохранить) */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/50 shadow-sm">
          <div className="flex items-center gap-4">
            <Button variant="secondary" size="icon" className="h-10 w-10 rounded-xl bg-secondary/50 hover:bg-secondary" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground line-clamp-1">Tədbiri Redaktə Et</h1>
              <p className="text-sm text-muted-foreground font-medium line-clamp-1">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant={salesActive ? "default" : "destructive"} className="px-3 py-1 text-xs shadow-sm">
              {salesActive ? "Satış Aktivdir" : "Satış Dayandırılıb"}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* ЛЕВАЯ КОЛОНКА */}
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Əsas Məlumatlar</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 p-6">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">{t(locale, "eventTitle") || "Tədbirin Adı"}</Label>
                  <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-11 bg-secondary/20" placeholder="Məsələn: Rammstein Baku Concert" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">{t(locale, "description") || "Təsvir"}</Label>
                  <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={5} className="resize-none bg-secondary/20" placeholder="Tədbir haqqında ətraflı məlumat..." />
                </div>
                <div className="flex flex-col gap-2 max-w-sm">
                  <Label className="text-sm font-semibold text-foreground">{t(locale, "category") || "Kateqoriya"}</Label>
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-11 bg-secondary/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (<SelectItem key={cat} value={cat}>{t(locale, cat) || cat}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary"/> Tarix və Zaman</CardTitle>
              </CardHeader>
              <CardContent className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">Tarix</Label>
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-11 bg-secondary/20" />
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">Başlama Saatı</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-11 pl-9 bg-secondary/20" />
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Label className="text-sm font-semibold text-foreground">Bitmə Saatı</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-11 pl-9 bg-secondary/20" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card/50 overflow-hidden">
              <CardHeader className="pb-4 border-b border-border/50 bg-secondary/10 flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2"><MapPin className="h-5 w-5 text-primary"/> Məkan</CardTitle>
                <div className="flex items-center gap-2 bg-background p-1 rounded-lg border border-border/50 shadow-sm">
                  <button onClick={() => setIsPhysical(true)} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", isPhysical ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Fiziki</button>
                  <button onClick={() => setIsPhysical(false)} className={cn("px-3 py-1 text-xs font-bold rounded-md transition-all", !isPhysical ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground")}>Onlayn</button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                {isPhysical ? (
                  <div className="flex flex-col p-6 gap-6">
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-semibold">Məkanın Adı</Label>
                      <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="h-11 bg-secondary/20" placeholder="Məsələn: Crystal Hall" />
                    </div>
                    <div className="flex flex-col gap-2">
                      <Label className="text-sm font-semibold">Dəqiq Ünvan və Xəritə</Label>
                      <LocationPicker address={address} setAddress={setAddress} />
                    </div>
                  </div>
                ) : (
                  <div className="p-6 flex flex-col items-center justify-center text-center gap-3 bg-secondary/10">
                    <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Globe className="h-6 w-6" /></div>
                    <div>
                      <h4 className="font-bold text-foreground">Onlayn Tədbir</h4>
                      <p className="text-sm text-muted-foreground mt-1 max-w-sm">Tədbir linki (Zoom, Teams və s.) bilet alan şəxslərə elektron poçt vasitəsilə göndəriləcək.</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ПРАВАЯ КОЛОНКА */}
          <div className="flex flex-col gap-6">
            
            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Tədbir Posteri</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <div 
                  onClick={() => fileInputRef.current?.click()} 
                  className={cn(
                    "flex h-48 items-center justify-center rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group", 
                    coverImageUrl ? "border-primary/50" : "border-border bg-secondary/30 hover:border-primary/40 hover:bg-secondary/50", 
                    isUploading && "opacity-50 cursor-wait"
                  )}
                >
                  {isUploading ? (
                    <div className="flex flex-col items-center gap-2 text-primary animate-pulse">
                      <Loader2 className="h-8 w-8 animate-spin" />
                      <span className="text-xs font-bold uppercase tracking-widest">Yüklənir...</span>
                    </div>
                  ) : coverImageUrl ? (
                    <>
                      <img 
                        src={coverImageUrl} 
                        alt="Cover" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                        onError={(e) => {
                          console.error("Failed to load image:", coverImageUrl);
                          // Если картинка сломана, временно сбрасываем ее, чтобы показать кнопку загрузки
                          setCoverImageUrl(null);
                        }}
                      />
                      <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-sm">
                        <Upload className="h-6 w-6 text-foreground" />
                        <span className="text-foreground font-bold text-sm">Şəkli Dəyiş</span>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <div className="p-3 bg-background rounded-full shadow-sm border border-border/50"><Upload className="h-6 w-6" /></div>
                      <span className="text-sm font-semibold mt-1">Kliklə və ya sürüklə</span>
                      <span className="text-[10px] uppercase tracking-widest opacity-60">1920x1080px tövsiyə olunur</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/50 shadow-sm bg-card/50">
              <CardHeader className="pb-4 border-b border-border/50">
                <CardTitle className="text-lg">Əlavə Tənzimləmələr</CardTitle>
              </CardHeader>
              <CardContent className="p-6 flex flex-col gap-6">
                
                <div className="flex flex-col gap-3">
                  <Label className="text-sm font-semibold text-foreground">Məxfilik ayarları</Label>
                  <div className="flex flex-col gap-3">
                    <div onClick={() => setIsPrivate(false)} className={cn("flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", !isPrivate ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50")}>
                      <div className={cn("p-2 rounded-full", !isPrivate ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}><Globe className="w-5 h-5" /></div>
                      <div className="flex flex-col"><span className="font-bold text-foreground">İctimai tədbir</span><span className="text-xs text-muted-foreground mt-1">Tədbir Tickit platformasında hamı üçün yerləşdiriləcək.</span></div>
                    </div>
                    <div onClick={() => setIsPrivate(true)} className={cn("flex items-start gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all", isPrivate ? "border-primary bg-primary/5" : "border-border/50 hover:border-primary/50")}>
                      <div className={cn("p-2 rounded-full", isPrivate ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}><Lock className="w-5 h-5" /></div>
                      <div className="flex flex-col"><span className="font-bold text-foreground">Özəl tədbir</span><span className="text-xs text-muted-foreground mt-1">Yalnız linki olan şəxslər tədbiri görə və bilet ala bilər.</span></div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <Label className="font-semibold flex items-center gap-2 text-foreground"><UserCheck className="w-4 h-4 text-primary"/> Yaş Məhdudiyyəti</Label>
                    <span className="text-xs text-muted-foreground">Tədbirə buraxılacaq minimum yaş həddi.</span>
                  </div>
                  <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                    <SelectTrigger className="h-10 bg-secondary/20"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ageRestrictions.map((age) => (<SelectItem key={age} value={age}>{age} Yaş</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex flex-col gap-3 pt-6 border-t border-border/50">
                  <div className="flex flex-col gap-1">
                    <Label className="font-semibold flex items-center gap-2 text-foreground"><Ticket className="w-4 h-4 text-primary"/> Bir sifarişdə maksimum bilet</Label>
                    <span className="text-xs text-muted-foreground leading-snug">Bir istifadəçinin eyni anda ala biləcəyi maksimum bilet sayı (qara bazara qarşı qorunma).</span>
                  </div>
                  <Input type="number" min={1} max={100} value={maxTicketsPerOrder} onChange={(e) => setMaxTicketsPerOrder(Number(e.target.value))} className="h-11 bg-secondary/20 font-bold"/>
                </div>
              </CardContent>
            </Card>

            <Card className={cn("border-border/50 shadow-sm transition-colors", salesActive ? "bg-card/50" : "bg-destructive/5 border-destructive/20")}>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">Bilet Satışı</CardTitle>
                <CardDescription>Satışları müvəqqəti dayandırın və ya bərpa edin.</CardDescription>
              </CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-background shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className={cn("h-3 w-3 rounded-full animate-pulse", salesActive ? "bg-green-500" : "bg-destructive")}></div>
                    <span className="font-bold text-sm">{salesActive ? "Satış Aktivdir" : "Dayandırılıb"}</span>
                  </div>
                  <Button variant={salesActive ? "secondary" : "default"} size="sm" className={cn("gap-2 font-bold", salesActive ? "text-destructive hover:bg-destructive/10 hover:text-destructive" : "bg-green-600 hover:bg-green-700 text-white")} onClick={() => setSalesActive(!salesActive)}>
                    <Power className="h-4 w-4" />{salesActive ? "Dayandır" : "Bərpa Et"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-destructive/20 shadow-sm bg-destructive/5">
              <CardContent className="p-6 flex flex-col gap-4">
                <div className="flex items-center gap-3 text-destructive">
                  <ShieldAlert className="h-5 w-5" />
                  <h3 className="font-bold">Təhlükə Zonası</h3>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">Əgər tədbiri sadəcə gizlətmək istəyirsinizsə, yuxarıdan <b>"Özəl Tədbir"</b> seçimini aktiv edin. Sildikdən sonra məlumatları geri qaytarmaq mümkün olmayacaq.</p>
                <Button variant="destructive" className="w-full gap-2 font-bold shadow-sm" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" /> Tədbiri Tamamilə Sil
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ИСПРАВЛЕНИЕ: Плавающий "липкий" подвал для кнопки сохранения */}
        <div className="sticky bottom-4 z-40 mt-8 flex items-center justify-between rounded-2xl border border-border/50 bg-card/80 p-4 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-col hidden sm:flex">
             <span className="text-sm font-semibold text-foreground">Dəyişiklikləri təsdiqləyin</span>
             <span className="text-xs text-muted-foreground">Bütün dəyişikliklər dərhal tətbiq olunacaq</span>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
            <Button variant="ghost" onClick={onBack} disabled={isSaving} className="font-bold">İmtina</Button>
            <Button className="gap-2 font-bold shadow-lg rounded-xl px-8 h-11 transition-all hover:scale-105" onClick={handleSave} disabled={isSaving}>
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Dəyişiklikləri Yadda Saxla
            </Button>
          </div>
        </div>

      </div>

      {/* ИСПРАВЛЕНИЕ: Toast вынесен в самый корень, теперь fixed работает безупречно! */}
      {toast.show && (
        <div className={cn("fixed bottom-8 right-8 flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl border bg-popover text-popover-foreground animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999]", toast.type === 'success' ? "border-border" : "border-destructive/30 bg-destructive/10")}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
          <span className="text-sm font-bold">{toast.message}</span>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card p-6 rounded-3xl shadow-2xl max-w-md w-full mx-4 border border-border animate-in zoom-in-95 duration-200">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-6 w-6 text-destructive" />
            </div>
            <h3 className="text-xl font-black text-foreground mb-2">Tədbiri silmək istəyirsiniz?</h3>
            <p className="text-sm text-muted-foreground mb-6 font-medium leading-relaxed">
              Bu əməliyyat geri qaytarıla bilməz. Tədbir və ona aid olan bütün məlumatlar sistemdən həmişəlik silinəcək.
            </p>
            <div className="flex items-center gap-3">
              <Button variant="outline" className="flex-1 font-bold h-11 rounded-xl" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>
                İmtina
              </Button>
              <Button variant="destructive" className="flex-1 gap-2 font-bold h-11 rounded-xl shadow-md" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Bəli, Sil
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}