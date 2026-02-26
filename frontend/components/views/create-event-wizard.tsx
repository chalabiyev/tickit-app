"use client"

import { useState, useRef } from "react"
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
  ArrowLeft, ArrowRight, Check, MapPin, Upload, Plus, Trash2, 
  CreditCard, Search, Monitor, Lock, Globe, Clock,
  CheckCircle2, Copy, Share2, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"

import { TicketDesignEditor, type TicketDesign } from "./TicketDesignEditor"
import { StepIndicator } from "./create-event/StepIndicator"
import { MobileTicketMockup } from "./create-event/MobileTicketMockup"
import { SeatMapGrid } from "./create-event/SeatMapGrid"

import { LocationPicker } from "./create-event/LocationPicker"

interface CreateEventWizardProps { onBack: () => void }
export interface TicketTier { id: number | string; name: string; price: number; quantity: number; color: string }

const STEPS = ["mainInfo", "ticketTypes", "places", "ticketDesign", "preview", "payment", "success"] as const
const categories = ["concert", "conference", "workshop", "sports", "theater", "exhibition", "other"] as const
const ageRestrictions = ["0+", "3+", "6+", "12+", "16+", "18+", "21+"] as const
export const TICKET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

function calculatePlatformFee(capacity: number): number {
  if (capacity <= 10) return 0
  if (capacity <= 50) return 5
  if (capacity <= 100) return 10
  if (capacity <= 200) return 15
  return 15
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
  const [customCategory, setCustomCategory] = useState("") // НОВОЕ СОСТОЯНИЕ ДЛЯ "OTHER"
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

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(generatedLink);
      showToast("Link copied to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy link", "error");
    }
  };

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
      // НОВАЯ ПРОВЕРКА ДЛЯ КАСТОМНОЙ КАТЕГОРИИ
      if (category === "other" && !customCategory.trim()) return setStepError(t(locale, "errCustomCatReq") || "Please specify your custom category.");

      if (!eventDate) return setStepError(t(locale, "errDateReq") || "Please select the Event Date.");
      if (!startTime) return setStepError(t(locale, "errStartReq") || "Please select the Start Time.");
      if (!endTime) return setStepError(t(locale, "errEndReq") || "Please select the End Time.");
      if (isPhysical) {
        if (!venueName.trim()) return setStepError(t(locale, "errVenueReq") || "Please enter the Venue Name.");
        if (!address.trim()) return setStepError(t(locale, "errAddrReq") || "Please enter the Address.");
      }
      if (!coverImageUrl) return setStepError(t(locale, "errCoverReq") || "Please upload an Event Poster.");
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
      title: eventTitle, 
      description: description, 
      // ЕСЛИ ВЫБРАНО OTHER - ОТПРАВЛЯЕМ КАСТОМНЫЙ ТЕКСТ
      category: category === "other" ? customCategory.trim() : category, 
      ageRestriction: ageRestriction,
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
      setGeneratedLink(`72.60.135.9:3000/e/${data.shortLink}`)
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
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[250px]">
                      <Label className="text-sm font-semibold">{t(locale, "category") || "Category"} <span className="text-destructive">*</span></Label>
                      {/* НОВОЕ ПОВЕДЕНИЕ ВЫБОРА КАТЕГОРИИ */}
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-11"><SelectValue placeholder={t(locale, "selectCategory")} /></SelectTrigger>
                        <SelectContent>{categories.map((cat) => (<SelectItem key={cat} value={cat}>{t(locale, cat) || cat}</SelectItem>))}</SelectContent>
                      </Select>
                      {category === "other" && (
                        <Input 
                          placeholder={t(locale, "specifyCategory") || "Please specify..."} 
                          value={customCategory} 
                          onChange={(e) => setCustomCategory(e.target.value)} 
                          className="h-11 mt-1 animate-in fade-in slide-in-from-top-2" 
                          autoFocus
                        />
                      )}
                    </div>
                    
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
                    {isPhysical && (<div className="flex flex-col gap-2.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t(locale, "address") || "Address"} <span className="text-destructive">*</span>
                      </Label>
                      <LocationPicker address={address} setAddress={setAddress} />
                    </div>)}
                  </div>
                  <div className="flex flex-col gap-5 flex-1">
                    <Label className="text-base font-bold">{t(locale, "privacySettings") || "Privacy Settings"}</Label>
                    
                    <div className="flex flex-col gap-3">
                      {/* Public Option */}
                      <div 
                        onClick={() => setIsPrivate(false)}
                        className={cn("flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all", !isPrivate ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-secondary/10")}
                      >
                        <div className={cn("mt-0.5 p-2 rounded-full shrink-0 transition-colors", !isPrivate ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm text-muted-foreground")}>
                          <Globe className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-foreground">{t(locale, "publicEvent") || "Public Event"}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{t(locale, "publicEventDesc") || "Event will be listed on the main Tickit platform for everyone."}</span>
                        </div>
                      </div>

                      {/* Private Option */}
                      <div 
                        onClick={() => setIsPrivate(true)}
                        className={cn("flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all", isPrivate ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-secondary/10")}
                      >
                        <div className={cn("mt-0.5 p-2 rounded-full shrink-0 transition-colors", isPrivate ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm text-muted-foreground")}>
                          <Lock className="h-4 w-4" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="font-bold text-sm text-foreground">{t(locale, "privateEvent") || "Private Event"}</span>
                          <span className="text-xs text-muted-foreground leading-relaxed">{t(locale, "privateEventDesc") || "Only people with the link can see and buy tickets."}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col gap-3 mt-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t(locale, "eventPoster") || "Event Poster"} <span className="text-destructive">*</span>
                      </Label>
                      <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                      <div onClick={() => fileInputRef.current?.click()} className={cn("flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group", coverImageUrl ? "border-primary/50" : "border-border/80 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50", isUploading && "opacity-50 cursor-wait")}>
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
                            <Upload className="h-5 w-5" />
                            <span className="text-sm font-semibold">{t(locale, "uploading") || "Uploading..."}</span>
                          </div>
                        ) : coverImageUrl ? (
                          <>
                            <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-semibold text-sm drop-shadow-md">{t(locale, "changeImage") || "Change Image"}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="p-3 bg-background rounded-full shadow-sm border">
                              <Upload className="h-5 w-5 text-foreground" />
                            </div>
                            <span className="text-sm font-semibold">{t(locale, "uploadCover") || "Upload Cover Image"}</span>
                          </div>
                        )}
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
                    <div className="bg-background px-4 py-3.5 rounded-xl text-sm font-bold font-mono text-foreground flex-1 truncate text-left border shadow-sm">
                      {generatedLink}
                    </div>
                    <Button 
                      size="lg" 
                      className="shrink-0 gap-2 rounded-xl px-6 font-bold"
                      onClick={handleCopyLink}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
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