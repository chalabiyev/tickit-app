"use client"

import { useState, useRef } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ArrowLeft,
  DollarSign,
  Ticket,
  OctagonX,
  Play,
  Lock,
  MapPin,
  Search,
  Upload,
  CalendarDays,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Trash2 // <-- Иконка корзины
} from "lucide-react"
import { cn } from "@/lib/utils"

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

// Mock guest list data
const guestData = [
  { id: 1, name: "Leyla Mammadova", ticketType: "vip", checkedIn: true },
  { id: 2, name: "Orhan Yilmaz", ticketType: "standard", checkedIn: true },
  { id: 3, name: "Ivan Petrov", ticketType: "vip", checkedIn: false },
  { id: 4, name: "Aysel Huseynova", ticketType: "standard", checkedIn: true },
  { id: 5, name: "Mehmet Demir", ticketType: "economy", checkedIn: false },
]

export function EventManageView({ event, onBack }: EventManageViewProps) {
  const { locale } = useLocale()
  
  // --- СОСТОЯНИЯ ФОРМЫ ---
  const [salesActive, setSalesActive] = useState(event.status === "active")
  const [title, setTitle] = useState(event.name)
  const [description, setDescription] = useState(`${event.name} - an exciting event happening in ${event.location}.`)
  const [category, setCategory] = useState("concert") 
  const [location, setLocation] = useState(event.location)
  
  // Картинка
  const [coverImageUrl, setCoverImageUrl] = useState<string | null>(event.image)
  const [isUploading, setIsUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Кнопки процессов
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // Модалка удаления
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // Уведомление
  const [toast, setToast] = useState<{ show: boolean, message: string, type: 'success' | 'error' }>({ show: false, message: '', type: 'success' })

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 3000)
  }

  const revenue = event.sold * 42 

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsUploading(true)
    const formData = new FormData()
    formData.append("file", file)

    try {
      const token = localStorage.getItem("tickit_token") || ""
      const response = await fetch("http://localhost:8080/api/v1/upload/image", {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` },
        body: formData
      })

      if (!response.ok) throw new Error("Upload failed")
      const data = await response.json()
      setCoverImageUrl(`http://localhost:8080${data.url}`)
    } catch (error) {
      console.error(error)
      showToast("Şəkil yüklənə bilmədi / Error uploading image", "error") 
    } finally {
      setIsUploading(false)
    }
  }

  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem("tickit_token") || ""
      const payload = { title, description, category, address: location, coverImageUrl }

      const response = await fetch(`http://localhost:8080/api/v1/events/${event.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (!response.ok) throw new Error("Failed to update event")

      showToast("Məlumatlar uğurla yadda saxlanıldı!", "success") 
    } catch (error) {
      console.error(error)
      showToast("Səhv baş verdi! / Error saving changes.", "error") 
    } finally {
      setIsSaving(false)
    }
  }

  // --- ЛОГИКА УДАЛЕНИЯ ---
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem("tickit_token") || ""
      
      const response = await fetch(`http://localhost:8080/api/v1/events/${event.id}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      })

      if (!response.ok) throw new Error("Failed to delete event")

      setShowDeleteModal(false)
      showToast("Tədbir silindi! / Event deleted successfully!", "success") 
      
      // Через 1.5 секунды возвращаем пользователя в список ивентов
      setTimeout(() => {
        onBack()
      }, 1500)
      
    } catch (error) {
      console.error(error)
      showToast("Səhv baş verdi! / Error deleting event.", "error") 
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  return (
    <div className="flex flex-col gap-6 relative">
      <Button variant="ghost" size="sm" className="gap-1.5 self-start text-muted-foreground -ml-2" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> {t(locale, "backToEvents") || "Back to Events"}
      </Button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
            <Badge variant={salesActive ? "default" : "secondary"} className="text-xs">
              {salesActive ? t(locale, "salesActive") || "Sales Active" : t(locale, "salesStopped") || "Sales Stopped"}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />{event.date}</div>
            <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{location}</div>
          </div>
        </div>
        <Button variant={salesActive ? "destructive" : "default"} className="gap-2 shrink-0 font-semibold" onClick={() => setSalesActive(!salesActive)}>
          {salesActive ? <><OctagonX className="h-4 w-4" />{t(locale, "stopSales") || "Stop Sales"}</> : <><Play className="h-4 w-4" />{t(locale, "resumeSales") || "Resume Sales"}</>}
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 max-w-lg">
        <Card className="border-border/50 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10"><DollarSign className="h-5 w-5 text-primary" /></div><div className="flex flex-col"><span className="text-xs text-muted-foreground">{t(locale, "revenue") || "Revenue"}</span><span className="text-xl font-bold tracking-tight text-foreground">${revenue.toLocaleString()}</span></div></CardContent></Card>
        <Card className="border-border/50 shadow-sm"><CardContent className="flex items-center gap-4 p-5"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10"><Ticket className="h-5 w-5 text-success" /></div><div className="flex flex-col"><span className="text-xs text-muted-foreground">{t(locale, "soldTotal") || "Tickets Sold"}</span><span className="text-xl font-bold tracking-tight text-foreground">{event.sold}/{event.total}</span></div></CardContent></Card>
      </div>

      <Tabs defaultValue="editDetails">
        <TabsList>
          <TabsTrigger value="editDetails">{t(locale, "editDetails") || "Edit Details"}</TabsTrigger>
          <TabsTrigger value="guestList">{t(locale, "guestList") || "Guest List"}</TabsTrigger>
        </TabsList>

        <TabsContent value="editDetails" className="mt-4">
          <Card className="border-border/50 shadow-sm max-w-2xl">
            <CardContent className="flex flex-col gap-5 p-6">
              
              <div className="flex flex-col gap-2"><Label className="text-sm font-medium text-foreground">{t(locale, "eventTitle") || "Event Title"}</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} className="max-w-lg" /></div>
              <div className="flex flex-col gap-2"><Label className="text-sm font-medium text-foreground">{t(locale, "description") || "Description"}</Label><Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="max-w-lg resize-none" /></div>
              
              <div className="flex flex-col gap-2 max-w-xs">
                <Label className="text-sm font-medium text-foreground">{t(locale, "category") || "Category"}</Label>
                <Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{t(locale, cat) || cat}</SelectItem>))}</SelectContent></Select>
              </div>

              <div className="flex flex-col gap-2 max-w-xs"><div className="flex items-center gap-2"><Label className="text-sm font-medium text-foreground">{t(locale, "eventDate") || "Event Date"}</Label><div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />{t(locale, "lockedField") || "Locked"}</div></div><Input type="date" value={event.date} disabled className="opacity-60 cursor-not-allowed" /></div>
              <div className="flex flex-col gap-2 max-w-xs"><div className="flex items-center gap-2"><Label className="text-sm font-medium text-foreground">{t(locale, "totalCapacity") || "Total Capacity"}</Label><div className="flex items-center gap-1 text-xs text-muted-foreground"><Lock className="h-3 w-3" />{t(locale, "lockedField") || "Locked"}</div></div><Input type="number" value={event.total} disabled className="opacity-60 cursor-not-allowed" /></div>

              <div className="flex flex-col gap-2 max-w-lg">
                <Label className="text-sm font-medium text-foreground">{t(locale, "location") || "Location"}</Label>
                <div className="relative"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={location} onChange={(e) => setLocation(e.target.value)} className="pl-9" /></div>
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">{t(locale, "media") || "Event Poster"}</Label>
                <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                <div onClick={() => fileInputRef.current?.click()} className={cn("flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group max-w-lg", coverImageUrl ? "border-primary/50" : "border-border bg-secondary/30 hover:border-primary/40", isUploading && "opacity-50 cursor-wait")}>
                  {isUploading ? (<div className="flex flex-col items-center gap-1.5 text-muted-foreground animate-pulse"><Upload className="h-6 w-6" /><span className="text-xs">Uploading...</span></div>) : coverImageUrl ? (<><img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" crossOrigin="anonymous" /><div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><span className="text-white font-semibold text-sm">Change Image</span></div></>) : (<div className="flex flex-col items-center gap-1.5 text-muted-foreground"><Upload className="h-6 w-6" /><span className="text-xs">{t(locale, "dragOrClick") || "Click to upload"}</span></div>)}
                </div>
              </div>

              {/* ОБНОВЛЕННЫЙ БЛОК С КНОПКАМИ */}
              <div className="flex items-center justify-between mt-4 pt-6 border-t border-border/50">
                <Button className="gap-2" onClick={handleSave} disabled={isSaving}>
                  {isSaving && <Loader2 className="h-4 w-4 animate-spin" />}
                  {t(locale, "saveChanges") || "Save Changes"}
                </Button>
                
                <Button variant="destructive" className="gap-2 bg-destructive/10 text-destructive hover:bg-destructive hover:text-white border-none shadow-none" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-4 w-4" />
                  {t(locale, "deleteEvent") || "Delete Event"}
                </Button>
              </div>

            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guestList" className="mt-4">
          {/* ... Код гостевого листа оставлен без изменений для краткости ... */}
          <Card className="border-border/50 shadow-sm"><CardContent className="pt-6"><p className="text-sm text-muted-foreground">Guest list tracking will be integrated soon.</p></CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* --- КРАСИВЫЙ TOAST --- */}
      {toast.show && (
        <div className={cn("fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border bg-popover text-popover-foreground animate-in slide-in-from-bottom-5 fade-in duration-300 z-50", toast.type === 'success' ? "border-border" : "border-destructive/30 bg-destructive/10")}>
          {toast.type === 'success' ? <CheckCircle2 className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-destructive" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}

      {/* --- МОДАЛЬНОЕ ОКНО ПОДТВЕРЖДЕНИЯ УДАЛЕНИЯ --- */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-md w-full mx-4 border border-border animate-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold text-foreground mb-2">
              Tədbiri silmək istəyirsiniz?
            </h3>
            <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
              Bu əməliyyat geri qaytarıla bilməz. Tədbir və ona aid olan bütün məlumatlar sistemdən həmişəlik silinəcək. (This action cannot be undone).
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDeleteModal(false)} disabled={isDeleting} className="font-semibold">
                {t(locale, "cancel") || "Cancel"}
              </Button>
              <Button variant="destructive" onClick={handleDelete} disabled={isDeleting} className="gap-2 font-semibold">
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                {t(locale, "delete") || "Delete Permanently"}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}