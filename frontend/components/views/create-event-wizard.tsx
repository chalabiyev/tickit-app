"use client"

import { useState, useRef, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import {
  ArrowLeft, ArrowRight, Check, MapPin, Upload, Plus, Trash2,
  CreditCard, Monitor, Lock, Globe, Clock,
  CheckCircle2, AlertCircle, Video, Ticket, X, Loader2,
  HelpCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"
import Cropper from "react-easy-crop"

import { TicketDesignEditor, type TicketDesign }  from "./create-event/TicketDesignEditor"
import { StepIndicator }                          from "./create-event/StepIndicator"
import { SeatMapGrid, type MapConfig }            from "./create-event/SeatMapGrid"
import { BuyerQuestionsStep, type BuyerQuestion } from "./create-event/BuyerQuestionsStep"
import { EventSummaryStep }                       from "./create-event/EventSummaryStep"
import { SuccessStep }                            from "./create-event/SuccessStep"
import { LocationPicker }                         from "./create-event/LocationPicker"

// ── Custom time picker — two number inputs, Safari-safe ───────────────────
function TimeSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const parts = value ? value.split(":") : ["", ""]
  const hh = parts[0] ?? ""
  const mm = parts[1] ?? ""

  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v))

  const handleH = (raw: string) => {
    const n = raw === "" ? "" : String(clamp(parseInt(raw, 10), 0, 23)).padStart(2, "0")
    onChange(`${n}:${mm || "00"}`)
  }
  const handleM = (raw: string) => {
    const n = raw === "" ? "" : String(clamp(parseInt(raw, 10), 0, 59)).padStart(2, "0")
    onChange(`${hh || "00"}:${n}`)
  }

  return (
    <div className="flex items-center gap-1.5 h-11 bg-background border border-input rounded-md px-3 shadow-sm w-fit">
      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
      <input
        type="number"
        min={0} max={23}
        value={hh}
        placeholder="00"
        onChange={(e) => handleH(e.target.value)}
        className="w-9 bg-transparent text-sm font-mono text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <span className="text-muted-foreground font-bold select-none">:</span>
      <input
        type="number"
        min={0} max={59}
        value={mm}
        placeholder="00"
        onChange={(e) => handleM(e.target.value)}
        className="w-9 bg-transparent text-sm font-mono text-center outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
    </div>
  )
}

const API_BASE  = process.env.NEXT_PUBLIC_API_URL  ?? "http://localhost:8080"
const APP_URL   = process.env.NEXT_PUBLIC_APP_URL  ?? (typeof window !== "undefined" ? window.location.origin : "")
const TOKEN_KEY = "eticksystem_token"

// ── Constants ──────────────────────────────────────────────────────────────
// FAQ step inserted between buyerQuestions (idx 3) and ticketDesign (idx 4)
const STEPS = ["mainInfo", "ticketTypes", "places", "buyerQuestions", "faq", "ticketDesign", "preview", "payment", "success"] as const
const CATEGORIES  = ["concert", "conference", "workshop", "sports", "theater", "exhibition", "other"] as const
const AGE_LIMITS  = ["0+", "3+", "6+", "12+", "16+", "18+", "21+"] as const
export const TICKET_COLORS = ["#3b82f6", "#ef4444", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#14b8a6", "#f97316"]

function calculatePlatformFee(capacity: number): number {
  if (capacity <= 10)  return 0
  if (capacity <= 50)  return 5
  if (capacity <= 100) return 10
  return 15
}

// ── Types ──────────────────────────────────────────────────────────────────
export interface TicketTier {
  id: number | string
  name: string
  price: number
  quantity: number
  color: string
  type: "paid" | "free"
}

export interface FaqItem {
  id: string
  question: string
  answer: string
}

// ── Clipboard (HTTP fallback) ──────────────────────────────────────────────
async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text)
  const el = Object.assign(document.createElement("textarea"), {
    value: text, style: "position:fixed;left:-9999px;top:-9999px;opacity:0",
  })
  document.body.appendChild(el); el.focus(); el.select()
  const ok = document.execCommand("copy")
  document.body.removeChild(el)
  if (!ok) throw new Error("execCommand copy failed")
}

// ── Image crop helpers ────────────────────────────────────────────────────
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load",  () => resolve(img))
    img.addEventListener("error", reject)
    img.src = url
  })
}

async function getCroppedImg(
  src: string,
  crop: { x: number; y: number; width: number; height: number }
): Promise<File> {
  const img    = await createImage(src)
  const canvas = document.createElement("canvas")
  const ctx    = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2d context")
  canvas.width = crop.width; canvas.height = crop.height
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => blob ? resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" })) : reject(new Error("Empty canvas")),
      "image/jpeg", 0.9
    )
  )
}

// ── Toast ─────────────────────────────────────────────────────────────────
interface ToastState { show: boolean; message: string; type: "success" | "error" }

interface CreateEventWizardProps { onBack: () => void }

// ── Main component ─────────────────────────────────────────────────────────
export function CreateEventWizard({ onBack }: CreateEventWizardProps) {
  const { locale } = useLocale()

  // UI state
  const [currentStep, setCurrentStep] = useState(0)
  const [stepError,   setStepError]   = useState("")
  const [submitError, setSubmitError] = useState("")
  const [isSubmitting,setIsSubmitting]= useState(false)
  const [toast, setToast] = useState<ToastState>({ show: false, message: "", type: "success" })

  const showToast = useCallback((message: string, type: ToastState["type"]) => {
    setToast({ show: true, message, type })
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
  }, [])

  // Cover image / cropper
  const fileInputRef         = useRef<HTMLInputElement>(null)
  const [coverImageUrl,      setCoverImageUrl]      = useState<string | null>(null)
  const [isUploading,        setIsUploading]        = useState(false)
  const [imageSrc,           setImageSrc]           = useState<string | null>(null)
  const [crop,               setCrop]               = useState({ x: 0, y: 0 })
  const [zoom,               setZoom]               = useState(1)
  const [croppedAreaPixels,  setCroppedAreaPixels]  = useState<{ x: number; y: number; width: number; height: number } | null>(null)
  const [isCropperOpen,      setIsCropperOpen]      = useState(false)

  // Step 0: main info
  const [eventTitle,      setEventTitle]      = useState("")
  const [description,     setDescription]     = useState("")
  const [category,        setCategory]        = useState("")
  const [customCategory,  setCustomCategory]  = useState("")
  const [eventDate,       setEventDate]       = useState("")
  const [startTime,       setStartTime]       = useState("")
  const [endTime,         setEndTime]         = useState("")
  const [isPhysical,      setIsPhysical]      = useState(true)
  const [venueName,       setVenueName]       = useState("")
  const [address,         setAddress]         = useState("")
  const [streamUrl,       setStreamUrl]       = useState("")
  const [streamPassword,  setStreamPassword]  = useState("")
  const [isPrivate,       setIsPrivate]       = useState(false)
  const [ageRestriction,  setAgeRestriction]  = useState("0+")
  const [maxTicketsPerOrder, setMaxTicketsPerOrder] = useState(10)

  // Step 1: tiers
  const [tiers, setTiers] = useState<TicketTier[]>([
    { id: "tier-1", name: "VIP",      price: 100, quantity: 20, color: TICKET_COLORS[0], type: "paid" },
    { id: "tier-2", name: "Standard", price: 30,  quantity: 80, color: TICKET_COLORS[1], type: "paid" },
  ])

  // Step 2: seat map
  const [isReservedSeating, setIsReservedSeating] = useState(false)
  const [seatMapData,       setSeatMapData]       = useState<Record<string, { r: number; c: number; tierId: string | null }>>({})
  const [seatMapConfig,     setSeatMapConfig]     = useState<MapConfig>({ stageRect: { x: -100, y: -150, w: 200, h: 50 }, rowLabelType: "letters" })

  // Step 3: buyer questions
  const [buyerQuestions, setBuyerQuestions] = useState<BuyerQuestion[]>([])

  // Step 4: FAQ
  const [faqItems, setFaqItems] = useState<FaqItem[]>([])

  // Step 5: ticket design
  const [ticketDesign, setTicketDesign] = useState<TicketDesign>({
    bgColor: "#09090b", bgImage: null, bgOverlay: 0, bgScale: 100, bgOffsetX: 0, bgOffsetY: 0,
    elements: [
      { id: "qr-1", type: "qr",   x: 120, y: 460, content: "QR_CODE",                                 color: "#ffffff", fontSize: 120, fontWeight: "normal" },
      { id: "t-1",  type: "text", x: 24,  y: 100, content: "{{Event_Name}}",                          color: "#ffffff", fontSize: 32, fontWeight: "bold",   fontFamily: "Arial, sans-serif", textAlign: "left", width: 312 },
      { id: "t-2",  type: "text", x: 24,  y: 150, content: "{{Event_Date}} • {{Location}}",           color: "#a1a1aa", fontSize: 14, fontWeight: "normal", fontFamily: "Arial, sans-serif", textAlign: "left", width: 312 },
      { id: "t-3",  type: "text", x: 24,  y: 220, content: "{{Guest_Name}}",                          color: "#ffffff", fontSize: 24, fontWeight: "bold",   fontFamily: '"Courier New", Courier, monospace', textAlign: "left", width: 312 },
      { id: "t-4",  type: "text", x: 24,  y: 260, content: "{{Ticket_Type}} • {{Seat_Info}}",         color: "#3b82f6", fontSize: 16, fontWeight: "bold",   fontFamily: "Arial, sans-serif", textAlign: "left", width: 312 },
    ],
  })

  // Step 8: result
  const [generatedLink, setGeneratedLink] = useState("")

  // Derived
  const derivedCapacity = tiers.reduce((s, ti) => s + (Number(ti.quantity) || 0), 0)
  const ticketRevenue   = tiers.reduce((s, ti) => s + (Number(ti.price) || 0) * (Number(ti.quantity) || 0), 0)
  const platformFee     = calculatePlatformFee(derivedCapacity)

  // ── FAQ helpers ───────────────────────────────────────────────────────────
  const addFaq = () =>
    setFaqItems((prev) => [...prev, { id: `faq-${Date.now()}`, question: "", answer: "" }])

  const removeFaq = (id: string) =>
    setFaqItems((prev) => prev.filter((f) => f.id !== id))

  const updateFaq = (id: string, field: "question" | "answer", value: string) =>
    setFaqItems((prev) => prev.map((f) => f.id === id ? { ...f, [field]: value } : f))

  // ── Tier helpers ──────────────────────────────────────────────────────────
  const addTier = () =>
    setTiers((prev) => [...prev, {
      id: `tier-${Date.now()}`, name: "", price: 0, quantity: 0,
      color: TICKET_COLORS[prev.length % TICKET_COLORS.length], type: "paid",
    }])

  const removeTier = (id: string | number) => setTiers((prev) => prev.filter((ti) => ti.id !== id))

  const updateTier = (id: string | number, field: keyof TicketTier, value: string | number) =>
    setTiers((prev) => prev.map((tier) => {
      if (tier.id !== id) return tier
      const next = { ...tier, [field]: value }
      if (field === "type" && value === "free") next.price = 0
      return next
    }))

  // ── Cover image upload ────────────────────────────────────────────────────
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return
    const file = e.target.files[0]
    const reader = new FileReader()
    reader.onload = () => { setImageSrc(reader.result as string); setIsCropperOpen(true) }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsUploading(true); setIsCropperOpen(false)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      const token = localStorage.getItem(TOKEN_KEY) ?? ""
      const form  = new FormData(); form.append("file", croppedFile)
      const res   = await fetch(`${API_BASE}/api/v1/upload/image`, {
        method: "POST", headers: { Authorization: `Bearer ${token}` }, body: form,
      })
      if (!res.ok) throw new Error("Upload failed")
      const data = await res.json()
      setCoverImageUrl(`${API_BASE}${data.url}`)
    } catch {
      showToast(t(locale, "imageUploadFailed") || "Şəkil yüklənə bilmədi", "error")
    } finally { setIsUploading(false); setImageSrc(null) }
  }

  // ── Copy link ─────────────────────────────────────────────────────────────
  const handleCopyLink = async () => {
    try {
      await copyToClipboard(generatedLink)
      showToast(t(locale, "linkCopied") || "Link kopyalandı!", "success")
    } catch {
      showToast(t(locale, "linkCopyFailed") || "Link kopyalana bilmədi", "error")
    }
  }

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNextStep = () => {
    setStepError("")

    // Step 0 validation
    if (currentStep === 0) {
      if (!eventTitle.trim())    return setStepError(t(locale, "errTitleReq")  || "Tədbirin adını daxil edin.")
      if (!description.trim())   return setStepError(t(locale, "errDescReq")   || "Təsviri daxil edin.")
      if (!category)             return setStepError(t(locale, "errCatReq")    || "Kateqoriya seçin.")
      if (category === "other" && !customCategory.trim())
        return setStepError(t(locale, "errCustomCatReq") || "Kateqoriyanı dəqiqləşdirin.")
      if (!eventDate)            return setStepError(t(locale, "errDateReq")   || "Tarix seçin.")
      if (eventDate) {
        const _sel = new Date(eventDate)
        const _tod = new Date(); _tod.setHours(0, 0, 0, 0)
        if (_sel < _tod) return setStepError(t(locale, "errPastDate") || "Keçmiş tarix seçmək olmaz.")
      }
      if (!startTime)            return setStepError(t(locale, "errStartReq")  || "Başlama vaxtı seçin.")
      if (!endTime)              return setStepError(t(locale, "errEndReq")    || "Bitmə vaxtı seçin.")
      if (isPhysical) {
        if (!venueName.trim())   return setStepError(t(locale, "errVenueReq") || "Məkanın adını daxil edin.")
        if (!address.trim())     return setStepError(t(locale, "errAddrReq")  || "Ünvanı daxil edin.")
      } else {
        if (!streamUrl.trim())   return setStepError(t(locale, "errStreamReq") || "Stream linkini daxil edin.")
      }
      if (!coverImageUrl)        return setStepError(t(locale, "errCoverReq") || "Poster yükləyin.")
    }

    // Step 1 validation
    if (currentStep === 1) {
      if (tiers.length === 0)    return setStepError(t(locale, "errNoTiers") || "Ən azı bir bilet növü yaradın.")
      if (tiers.some((ti) => !ti.name.trim() || ti.price < 0 || ti.quantity < 1))
        return setStepError(t(locale, "errInvalidTier") || "Bütün bilet növlərini düzgün doldurun.")
      // Skip seats step for online events
      if (!isPhysical) { setCurrentStep(3); return }
    }

    // Step 2 seat map validation
    if (currentStep === 2 && isReservedSeating) {
      const seats = Object.values(seatMapData)
      if (seats.length < derivedCapacity)
        return setStepError(
          (t(locale, "errNotEnoughSeats") || "Xəritədə ən azı {req} yer lazımdır. İndi {curr} var.")
            .replace("{req}", String(derivedCapacity)).replace("{curr}", String(seats.length))
        )
      const unassigned = seats.filter((s) => s.tierId === null).length
      if (unassigned > 0)
        return setStepError(
          (t(locale, "errUnassignedSeats") || "{unassigned} yer hələ bilet növüne təyin edilməyib.")
            .replace("{unassigned}", String(unassigned))
        )
    }

    // Step 4 FAQ validation — questions with empty fields are skipped but warn
    if (currentStep === 4) {
      const incomplete = faqItems.filter((f) => !f.question.trim() || !f.answer.trim())
      if (incomplete.length > 0)
        return setStepError("Bütün FAQ sahələrini doldurun və ya boş olanları silin.")
    }

    setCurrentStep((s) => s + 1)
  }

  const handleBackStep = () => {
    setStepError(""); setSubmitError("")
    // If online event, skip seats step going back from buyerQuestions
    setCurrentStep((s) => (s === 3 && !isPhysical) ? 1 : s - 1)
  }

  // ── Submit ────────────────────────────────────────────────────────────────
  const submitEvent = async () => {
    setIsSubmitting(true); setSubmitError("")
    const token = localStorage.getItem(TOKEN_KEY) ?? ""
    if (!token) { setSubmitError(t(locale, "errUnauthorized") || "Giriş tələb olunur."); setIsSubmitting(false); return }

    const payload = {
      title:       eventTitle,
      description,
      category:    category === "other" ? customCategory.trim() : category,
      ageRestriction,
      eventDate,
      startTime:   startTime.length === 5 ? `${startTime}:00` : startTime,
      endTime:     endTime.length   === 5 ? `${endTime}:00`   : endTime,
      isPhysical,
      venueName:   isPhysical ? venueName : null,
      address:     isPhysical ? address   : null,
      streamUrl:   !isPhysical ? streamUrl       : null,
      streamPassword: !isPhysical ? streamPassword  : null,
      isPrivate, coverImageUrl,
      tiers: tiers.map((ti) => ({ tierId: String(ti.id), id: String(ti.id), name: ti.name, price: ti.price, quantity: ti.quantity, color: ti.color })),
      isReservedSeating: isPhysical ? isReservedSeating : false,
      seats: isPhysical && isReservedSeating
        ? Object.values(seatMapData).filter((s) => s.tierId !== null).map((s) => ({ row: s.r, col: s.c, tierId: s.tierId }))
        : [],
      seatMapConfig,
      ticketDesign,
      buyerQuestions,
      maxTicketsPerOrder,
      // FAQ — send only complete items
      faq: faqItems
        .filter((f) => f.question.trim() && f.answer.trim())
        .map(({ question, answer }) => ({ question, answer })),
    }

    try {
      const res = await fetch(`${API_BASE}/api/v1/events`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      })
      if (!res.ok) {
        const errData = await res.json().catch(() => null)
        throw new Error(errData?.message || t(locale, "errorOccurred") || "Xəta baş verdi")
      }
      const data = await res.json()
      setGeneratedLink(`${APP_URL}/e/${data.shortLink}`)
      setCurrentStep(8)
    } catch (err) {
      setSubmitError((err as Error).message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto w-full relative">

      {/* Header + step indicator */}
      {currentStep < 8 && (
        <div className="flex flex-col gap-6 w-full">
          <div className="flex items-center gap-4 sm:gap-6">
            <Button variant="outline" size="sm" className="gap-2 h-10 px-4 rounded-xl border-border/60 shadow-sm text-muted-foreground hover:text-foreground shrink-0" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline font-semibold">{t(locale, "backToEvents") || "Geri"}</span>
            </Button>
            <div className="h-6 w-px bg-border hidden sm:block shrink-0" />
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground truncate">
              {t(locale, "createNewEvent") || "Yeni Tədbir Yarat"}
            </h1>
          </div>
          <div className="w-full bg-card/80 border border-border/60 rounded-[2rem] px-2 py-4 sm:px-6 sm:py-6 shadow-sm overflow-hidden" style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
            <StepIndicator currentStep={currentStep} steps={STEPS} />
          </div>
        </div>
      )}

      <Card className="border-border/60 shadow-md overflow-visible bg-card/50" style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
        <CardContent className="p-0 sm:p-8">
          <div className="p-5 sm:p-0">

            {/* ── Step 0: Main Info ── */}
            {currentStep === 0 && (
              <div className="flex flex-col gap-10 animate-in fade-in duration-300">
                <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-sm font-semibold">{t(locale, "eventTitle") || "Tədbirin Adı"} <span className="text-destructive">*</span></Label>
                    <Input placeholder={t(locale, "eventTitlePlaceholder") || "Məs.: Rammstein Baku Concert"} value={eventTitle} onChange={(e) => setEventTitle(e.target.value)} className="max-w-2xl h-11 text-base" />
                  </div>
                  <div className="flex flex-col gap-2.5">
                    <Label className="text-sm font-semibold">{t(locale, "description") || "Təsvir"} <span className="text-destructive">*</span></Label>
                    <Textarea placeholder={t(locale, "descriptionPlaceholder") || "Tədbir haqqında ətraflı..."} rows={6} value={description} onChange={(e) => setDescription(e.target.value)} className="max-w-2xl resize-none text-base bg-background" />
                  </div>
                  <div className="flex flex-col gap-5 sm:flex-row">
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[250px]">
                      <Label className="text-sm font-semibold">{t(locale, "category") || "Kateqoriya"} <span className="text-destructive">*</span></Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger className="h-11"><SelectValue placeholder={t(locale, "selectCategory") || "Seçin"} /></SelectTrigger>
                        <SelectContent>{CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(locale, c) || c}</SelectItem>)}</SelectContent>
                      </Select>
                      {category === "other" && (
                        <Input autoFocus placeholder={t(locale, "specifyCategory") || "Qeyd edin..."} value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="h-11 mt-1 animate-in fade-in slide-in-from-top-2" />
                      )}
                    </div>
                    <div className="flex flex-col gap-2.5 flex-1 max-w-[150px]">
                      <Label className="text-sm font-semibold">{t(locale, "ageRestriction") || "Yaş Hədd"} <span className="text-destructive">*</span></Label>
                      <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                        <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                        <SelectContent>{AGE_LIMITS.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Date & Time */}
                <div className="flex flex-col gap-5">
                  <h3 className="text-base font-bold text-foreground">{t(locale, "dateTime") || "Tarix və vaxt"}</h3>
                  <div className="flex flex-wrap gap-5">
                    <div className="flex flex-col gap-2.5 flex-1 min-w-[140px] max-w-[220px]">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t(locale, "date") || "Tarix"} <span className="text-destructive">*</span>
                      </Label>
                      <Input type="date" value={eventDate} onChange={(e) => setEventDate(e.target.value)} className="h-11" />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t(locale, "startTime") || "Başlanğıc vaxtı"} <span className="text-destructive">*</span>
                      </Label>
                      <TimeSelect value={startTime} onChange={setStartTime} />
                    </div>
                    <div className="flex flex-col gap-2.5">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        {t(locale, "endTime") || "Bitmə vaxtı"} <span className="text-destructive">*</span>
                      </Label>
                      <TimeSelect value={endTime} onChange={setEndTime} />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location + privacy */}
                <div className="flex flex-col gap-8 lg:flex-row lg:gap-12">
                  <div className="flex flex-col gap-5 flex-1">
                    <Label className="text-base font-bold">{t(locale, "location") || "Məkan"}</Label>
                    <div className="flex flex-wrap items-center gap-3">
                      {[
                        { val: true,  icon: <MapPin className="h-5 w-5" />,  label: t(locale, "physical") || "Fiziki" },
                        { val: false, icon: <Monitor className="h-5 w-5" />, label: t(locale, "online")   || "Onlayn" },
                      ].map(({ val, icon, label }) => (
                        <button
                          key={String(val)}
                          onClick={() => setIsPhysical(val)}
                          className={cn(
                            "flex items-center gap-2 rounded-xl border-2 px-5 py-3.5 text-sm font-semibold flex-1 min-w-[140px] justify-center transition-all",
                            isPhysical === val ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40"
                          )}
                        >
                          {icon}{label}
                        </button>
                      ))}
                    </div>

                    {isPhysical ? (
                      <div className="flex flex-col gap-5 mt-2 animate-in fade-in slide-in-from-top-2">
                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "venueName") || "Məkanın Adı"} <span className="text-destructive">*</span></Label>
                          <Input className="h-11 shadow-sm text-base" placeholder="Məs.: Crystal Hall" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "address") || "Ünvan"} <span className="text-destructive">*</span></Label>
                          <LocationPicker address={address} setAddress={setAddress} />
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-5 mt-2 animate-in fade-in slide-in-from-top-2 p-5 bg-secondary/10 border border-primary/20 rounded-2xl">
                        <div className="flex items-center gap-3 text-primary font-bold mb-1">
                          <Video className="h-5 w-5" /> {t(locale, "onlineStreamingDetails") || "Stream Məlumatları"}
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "streamUrlLabel") || "Stream Linki"} <span className="text-destructive">*</span></Label>
                          <Input className="h-11 shadow-sm text-base bg-background" placeholder="https://zoom.us/j/123..." value={streamUrl} onChange={(e) => setStreamUrl(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-2.5">
                          <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "streamPasswordLabel") || "Şifrə (İstəyə görə)"}</Label>
                          <Input className="h-11 shadow-sm text-base bg-background" placeholder="Passcode: 123456" value={streamPassword} onChange={(e) => setStreamPassword(e.target.value)} />
                        </div>
                        <p className="text-xs text-muted-foreground">{t(locale, "streamInfoText") || "Link bilet alındıqdan sonra avtomatik e-poçtla göndəriləcək."}</p>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-col gap-5 flex-1">
                    <Label className="text-base font-bold">{t(locale, "privacySettingsTitle") || "Məxfilik"}</Label>
                    <div className="flex flex-col gap-3">
                      {[
                        { val: false, icon: <Globe className="h-4 w-4" />, title: t(locale, "publicEvent") || "İctimai", desc: t(locale, "publicEventDesc") || "Platformada hamı görür" },
                        { val: true,  icon: <Lock  className="h-4 w-4" />, title: t(locale, "privateEvent") || "Özəl",   desc: t(locale, "privateEventDesc") || "Yalnız link ilə giriş" },
                      ].map(({ val, icon, title, desc }) => (
                        <div
                          key={String(val)}
                          onClick={() => setIsPrivate(val)}
                          className={cn(
                            "flex items-start gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all",
                            isPrivate === val ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-secondary/10"
                          )}
                        >
                          <div className={cn("mt-0.5 p-2 rounded-full shrink-0 transition-colors", isPrivate === val ? "bg-primary text-primary-foreground" : "bg-background border shadow-sm text-muted-foreground")}>
                            {icon}
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="font-bold text-sm text-foreground">{title}</span>
                            <span className="text-xs text-muted-foreground leading-relaxed">{desc}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Max tickets */}
                    <div className="flex flex-col gap-2.5 mt-4">
                      <Label className="text-sm font-semibold flex items-center gap-2 text-foreground">
                        <Ticket className="w-4 h-4 text-primary" /> {t(locale, "maxTicketsPerOrder") || "Maks. bilet / sifariş"}
                      </Label>
                      <p className="text-xs text-muted-foreground mb-1">{t(locale, "maxTicketsDesc") || "Qara bazara qarşı qorunma."}</p>
                      <Input type="number" min={1} max={100} value={maxTicketsPerOrder} onChange={(e) => setMaxTicketsPerOrder(Number(e.target.value))} className="h-11 bg-background max-w-sm font-bold" />
                    </div>

                    {/* Poster upload */}
                    <div className="flex flex-col gap-3 mt-1">
                      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "eventPosterTitle") || "Poster"} <span className="text-destructive">*</span></Label>
                      <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
                      <div
                        onClick={() => !isUploading && fileInputRef.current?.click()}
                        className={cn(
                          "flex h-36 items-center justify-center rounded-xl border-2 border-dashed transition-all cursor-pointer overflow-hidden relative group",
                          coverImageUrl ? "border-primary/50" : "border-border/80 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50",
                          isUploading && "opacity-50 cursor-wait"
                        )}
                        style={{ isolation: "isolate" }}
                      >
                        {isUploading ? (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground animate-pulse">
                            <Loader2 className="h-5 w-5 animate-spin" />
                            <span className="text-sm font-semibold">{t(locale, "uploading") || "Yüklənir..."}</span>
                          </div>
                        ) : coverImageUrl ? (
                          <>
                            <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white font-semibold text-sm drop-shadow-md">{t(locale, "changeImage") || "Dəyiş"}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-3 text-muted-foreground">
                            <div className="p-3 bg-background rounded-full shadow-sm border"><Upload className="h-5 w-5 text-foreground" /></div>
                            <span className="text-sm font-semibold">{t(locale, "clickOrDrag") || "Kliklə və ya sürüklə"}</span>
                            <span className="text-[10px] uppercase tracking-widest opacity-60">1920×1080px</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Step 1: Ticket Types ── */}
            {currentStep === 1 && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex items-center justify-between bg-primary/5 p-6 rounded-2xl border border-primary/10">
                  <div className="flex flex-col gap-1.5">
                    <h3 className="text-lg font-bold text-foreground">{t(locale, "ticketTypes") || "Bilet Növləri"}</h3>
                    <p className="text-sm text-muted-foreground">{t(locale, "ticketTypesDesc") || "Tutum avtomatik hesablanır."}</p>
                  </div>
                  <div className="flex flex-col items-end bg-background px-4 py-2 rounded-xl border shadow-sm">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">{t(locale, "totalCapacity") || "Ümumi"}</span>
                    <span className="text-3xl font-black text-primary leading-none mt-1">{derivedCapacity}</span>
                  </div>
                </div>

                <div className="flex flex-col gap-5">
                  {tiers.map((tier) => (
                    <Card key={tier.id} className="border-border/60 bg-card shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                      <div className="absolute left-0 top-0 bottom-0 w-2.5" style={{ backgroundColor: tier.color }} />
                      <CardContent className="p-5 pl-8">
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-end">
                          <div className="flex flex-col gap-2 flex-1">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "tierName") || "Ad"} <span className="text-destructive">*</span></Label>
                            <Input className="h-11 font-medium text-base" value={tier.name} onChange={(e) => updateTier(tier.id, "name", e.target.value)} placeholder="VIP, Standard..." />
                          </div>

                          {/* Color picker */}
                          <div className="flex flex-col gap-2 w-full sm:w-24">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "color") || "Rəng"}</Label>
                            <Select value={tier.color} onValueChange={(v) => updateTier(tier.id, "color", v)}>
                              <SelectTrigger className="h-11 px-4">
                                <div className="w-5 h-5 rounded-full shadow-inner border border-black/10" style={{ backgroundColor: tier.color }} />
                              </SelectTrigger>
                              <SelectContent className="min-w-0 w-auto p-3">
                                <div className="grid grid-cols-4 gap-3">
                                  {TICKET_COLORS.map((c) => (
                                    <button key={c} onClick={() => updateTier(tier.id, "color", c)} className="w-7 h-7 rounded-full shadow-sm hover:scale-110 transition-transform focus:outline-none" style={{ backgroundColor: c }} />
                                  ))}
                                </div>
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Price */}
                          <div className="flex flex-col gap-2 w-full sm:w-[180px]">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "price") || "Qiymət"} (AZN) <span className="text-destructive">*</span></Label>
                            <div className="flex p-1 bg-secondary/30 rounded-xl border border-border/50 mb-1">
                              {(["paid", "free"] as const).map((type) => (
                                <button
                                  key={type}
                                  onClick={() => updateTier(tier.id, "type", type)}
                                  className={cn(
                                    "flex-1 px-3 py-2 text-xs font-bold rounded-lg transition-all",
                                    tier.type === type
                                      ? type === "free" ? "bg-green-500/10 text-green-600 shadow-sm" : "bg-background shadow-sm text-foreground"
                                      : "text-muted-foreground hover:text-foreground"
                                  )}
                                >
                                  {type === "paid" ? (t(locale, "paid") || "Ödənişli") : (t(locale, "free") || "Pulsuz")}
                                </button>
                              ))}
                            </div>
                            <Input
                              type="number" min={0} value={tier.price}
                              disabled={tier.type === "free"}
                              onChange={(e) => updateTier(tier.id, "price", Number(e.target.value))}
                              className={cn("h-11 font-mono text-base", tier.type === "free" && "opacity-50 bg-secondary/20")}
                            />
                          </div>

                          {/* Quantity */}
                          <div className="flex flex-col gap-2 w-full sm:w-32">
                            <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t(locale, "quantity") || "Say"} <span className="text-destructive">*</span></Label>
                            <Input type="number" min={1} value={tier.quantity} onChange={(e) => updateTier(tier.id, "quantity", Number(e.target.value))} className="h-11 font-mono text-base" />
                          </div>

                          <Button
                            variant="ghost" size="icon"
                            className="h-11 w-11 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 self-end transition-colors"
                            onClick={() => removeTier(tier.id)} disabled={tiers.length <= 1}
                          >
                            <Trash2 className="h-5 w-5" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  <Button variant="outline" className="h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 gap-2 font-semibold mt-2" onClick={addTier}>
                    <Plus className="h-5 w-5" /> {t(locale, "addTier") || "Bilet növü əlavə et"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 2: Seating ── */}
            {currentStep === 2 && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                <div className="flex flex-col gap-5">
                  <Label className="text-xl font-bold text-foreground">{t(locale, "seatingArrangement") || "Oturma Düzümü"}</Label>
                  <div className="flex flex-wrap items-center gap-4">
                    {[
                      { val: false, label: t(locale, "generalAdmission") || "Ümumi Giriş" },
                      { val: true,  label: t(locale, "reservedSeating")  || "Rezerv Oturma" },
                    ].map(({ val, label }) => (
                      <button
                        key={String(val)}
                        onClick={() => setIsReservedSeating(val)}
                        className={cn(
                          "flex items-center justify-center gap-2 rounded-xl border-2 px-5 py-4 text-sm font-semibold flex-1 min-w-[200px] transition-all",
                          isReservedSeating === val ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border text-muted-foreground hover:border-primary/40"
                        )}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                  {isReservedSeating && (
                    <div className="animate-in slide-in-from-bottom-4 duration-500">
                      <SeatMapGrid
                        tiers={tiers} seatMap={seatMapData} setSeatMap={setSeatMapData}
                        config={seatMapConfig} setConfig={setSeatMapConfig}
                        derivedCapacity={derivedCapacity}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ── Step 3: Buyer Questions ── */}
            {currentStep === 3 && <BuyerQuestionsStep questions={buyerQuestions} setQuestions={setBuyerQuestions} />}

            {/* ── Step 4: FAQ ── */}
            {currentStep === 4 && (
              <div className="flex flex-col gap-8 animate-in fade-in duration-300">
                {/* Header */}
                <div className="flex items-start gap-4 p-6 rounded-2xl bg-primary/5 border border-primary/10">
                  <div className="p-3 bg-primary/10 rounded-xl shrink-0">
                    <HelpCircle className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-lg font-bold text-foreground">FAQ</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {t(locale, "faqDesc") || "Tez-tez verilən sualları əlavə edin. Bunlar ictimai səhifədə accordion kimi göstəriləcək. İstəyə görədir."}
                    </p>
                  </div>
                </div>

                {/* Items */}
                <div className="flex flex-col gap-4">
                  {faqItems.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 rounded-2xl border-2 border-dashed border-border/50 text-muted-foreground gap-3">
                      <HelpCircle className="w-10 h-10 opacity-30" />
                      <p className="text-sm font-medium opacity-60">
                        {t(locale, "faqEmpty") || "Hələ FAQ yoxdur. Aşağıdan əlavə edin."}
                      </p>
                    </div>
                  )}

                  {faqItems.map((item, idx) => (
                    <Card key={item.id} className="border-border/60 bg-card shadow-sm">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3">
                          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-primary/10 text-primary font-black text-xs shrink-0 mt-2.5">
                            {idx + 1}
                          </div>
                          <div className="flex flex-col gap-3 flex-1">
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t(locale, "faqQuestion") || "Sual"} <span className="text-destructive">*</span>
                              </Label>
                              <Input
                                className="h-11 font-medium text-base"
                                placeholder={t(locale, "faqQuestionPlaceholder") || "Məs.: Bilet geri qaytarılır?"}
                                value={item.question}
                                onChange={(e) => updateFaq(item.id, "question", e.target.value)}
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                {t(locale, "faqAnswer") || "Cavab"} <span className="text-destructive">*</span>
                              </Label>
                              <Textarea
                                rows={3}
                                className="resize-none text-base bg-background"
                                placeholder={t(locale, "faqAnswerPlaceholder") || "Cavabı daxil edin..."}
                                value={item.answer}
                                onChange={(e) => updateFaq(item.id, "answer", e.target.value)}
                              />
                            </div>
                          </div>
                          <Button
                            variant="ghost" size="icon"
                            className="h-9 w-9 text-muted-foreground hover:bg-destructive/10 hover:text-destructive shrink-0 mt-1.5 rounded-xl"
                            onClick={() => removeFaq(item.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}

                  <Button
                    variant="outline"
                    className="h-12 border-dashed border-2 hover:border-primary hover:bg-primary/5 gap-2 font-semibold mt-2"
                    onClick={addFaq}
                  >
                    <Plus className="h-5 w-5" /> {t(locale, "addFaq") || "FAQ əlavə et"}
                  </Button>
                </div>
              </div>
            )}

            {/* ── Step 5: Ticket Design ── */}
            {currentStep === 5 && (
              <TicketDesignEditor
                design={ticketDesign} onChange={setTicketDesign}
                eventDetails={{ title: eventTitle, date: eventDate, location: isPhysical ? (venueName || address) : "Online Event" }}
                buyerQuestions={buyerQuestions}
              />
            )}

            {/* ── Step 6: Preview ── */}
            {currentStep === 6 && (
              <EventSummaryStep
                eventDetails={{ title: eventTitle, date: eventDate, location: isPhysical ? (venueName || address) : "Online Event" }}
                isPrivate={isPrivate} derivedCapacity={derivedCapacity} ticketRevenue={ticketRevenue}
                tiers={tiers} ticketDesign={ticketDesign} buyerQuestions={buyerQuestions}
              />
            )}

            {/* ── Step 7: Payment ── */}
            {currentStep === 7 && (
              <div className="flex flex-col gap-10 lg:flex-row lg:gap-14 animate-in fade-in duration-300">
                {/* Fee card */}
                <div className="flex-1 flex flex-col gap-5">
                  <h3 className="text-lg font-bold text-foreground">{t(locale, "platformFeeTitle") || "Platform Haqqı"}</h3>
                  <Card className="border-none bg-primary text-primary-foreground relative overflow-hidden shadow-xl" style={{ isolation: "isolate" }}>
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl pointer-events-none" />
                    <CardContent className="flex flex-col gap-6 p-8 relative z-10">
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-semibold text-primary-foreground/80 uppercase tracking-widest">
                          {derivedCapacity} {t(locale, "seats") || "yer"} üçün
                        </span>
                        <span className="text-6xl font-black mt-2">
                          {platformFee === 0 ? (t(locale, "freeText") || "Pulsuz") : `${platformFee} AZN`}
                        </span>
                      </div>
                      <Separator className="bg-primary-foreground/20 my-2" />
                      <div className="flex flex-col gap-3 text-sm font-medium text-primary-foreground/90">
                        <span className="uppercase tracking-wider text-xs font-bold text-primary-foreground/70 mb-1">eticksystem {t(locale, "pricingRules") || "Qiymətlər"}</span>
                        {[["0 – 10", "0 AZN"], ["11 – 50", "5 AZN"], ["51 – 100", "10 AZN"], ["101+", "15 AZN"]].map(([range, price]) => (
                          <div key={range} className="flex justify-between border-b border-primary-foreground/10 pb-2 last:border-0">
                            <span>{range} {t(locale, "seats") || "yer"}</span>
                            <span>{price}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Payment form */}
                <div className="flex-1 flex flex-col gap-5">
                  <h3 className="text-lg font-bold text-foreground">{t(locale, "paymentMethodTitle") || "Ödəniş Metodu"}</h3>
                  <Card className="border-border/60 shadow-md">
                    <CardContent className="p-8 flex flex-col gap-6">
                      {platformFee === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center h-full">
                          <div className="h-16 w-16 rounded-full bg-green-500/10 flex items-center justify-center mb-5">
                            <Check className="h-8 w-8 text-green-500" />
                          </div>
                          <p className="text-xl font-bold text-foreground mb-2">{t(locale, "noPaymentRequired") || "Ödəniş tələb olunmur"}</p>
                          <p className="text-sm text-muted-foreground max-w-[250px] leading-relaxed">{t(locale, "noPaymentDesc") || "10 yerliyə qədər pulsuz!"}</p>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-2.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale, "cardholderName") || "Kart Sahibi"}</Label>
                            <Input placeholder="JOHN DOE" className="h-12 uppercase font-medium" />
                          </div>
                          <div className="flex flex-col gap-2.5">
                            <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale, "cardNumber") || "Kart Nömrəsi"}</Label>
                            <div className="relative">
                              <CreditCard className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                              <Input placeholder="0000 0000 0000 0000" className="pl-12 h-12 font-mono text-base" />
                            </div>
                          </div>
                          <div className="flex gap-5">
                            <div className="flex flex-col gap-2.5 flex-1">
                              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{t(locale, "expiry") || "Son Tarix"}</Label>
                              <Input placeholder="MM/YY" className="h-12 font-mono text-center text-base" />
                            </div>
                            <div className="flex flex-col gap-2.5 flex-1">
                              <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">CVC</Label>
                              <Input placeholder="123" type="password" maxLength={3} className="h-12 font-mono text-center text-base tracking-widest" />
                            </div>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* ── Step 8: Success ── */}
            {currentStep === 8 && (
              <SuccessStep
                generatedLink={generatedLink || `${APP_URL}/e/sample-link`}
                eventName={eventTitle}
                onCopy={handleCopyLink}
                onDashboardClick={onBack}
              />
            )}

          </div>
        </CardContent>
      </Card>

      {/* Navigation footer */}
      {currentStep < 8 && (
        <div className="flex flex-col gap-4 pt-4">
          {stepError && (
            <div className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold p-3.5 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{stepError}
            </div>
          )}
          {submitError && (
            <div className="flex items-center justify-center gap-2 bg-destructive/10 text-destructive text-sm font-semibold p-3.5 rounded-xl border border-destructive/20 animate-in fade-in slide-in-from-bottom-2">
              <AlertCircle className="h-4 w-4 shrink-0" />{submitError}
            </div>
          )}

          <div className="flex items-center justify-between mt-2">
            <Button
              variant="outline"
              onClick={handleBackStep}
              disabled={currentStep === 0 || isSubmitting}
              className="gap-2 w-32 h-12 rounded-xl border-2 font-bold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {t(locale, "back") || "Geri"}
            </Button>

            <Button
              onClick={() => currentStep === 7 ? submitEvent() : handleNextStep()}
              disabled={isSubmitting}
              className={cn(
                "gap-2 w-auto min-w-[160px] px-6 h-12 rounded-xl font-bold text-base shadow-md transition-all hover:scale-[1.02]",
                currentStep === 7 && "bg-green-600 hover:bg-green-700 text-white min-w-[192px]"
              )}
            >
              {isSubmitting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /><span className="animate-pulse">{t(locale, "processing") || "..."}</span></>
              ) : currentStep === 7 ? (
                <><Check className="h-5 w-5" />{t(locale, "publish") || "Yayımla"}</>
              ) : (
                <>{t(locale, "next") || "İrəli"}<ArrowRight className="h-5 w-5" /></>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* ── Cropper modal ── */}
      {isCropperOpen && imageSrc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 p-4 animate-in fade-in duration-200" style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <div className="bg-background rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col border border-border/50">
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-bold text-lg">{t(locale, "cropImage") || "Şəkli kəsin (16:9)"}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCropperOpen(false)} className="rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative w-full h-[50vh] sm:h-[60vh] bg-black">
              <Cropper
                image={imageSrc} crop={crop} zoom={zoom} aspect={16 / 9}
                onCropChange={setCrop}
                onCropComplete={(_, px) => setCroppedAreaPixels(px as { x: number; y: number; width: number; height: number })}
                onZoomChange={setZoom}
              />
            </div>
            <div className="p-4 flex items-center justify-between bg-card">
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-1/2 accent-primary" />
              <Button onClick={handleCropSave} disabled={isUploading} className="font-bold px-8">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4 mr-2" />}
                {t(locale, "save") || "Yadda saxla"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ── Toast ── */}
      {toast.show && (
        <div className={cn(
          "fixed bottom-8 right-8 flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-2xl border bg-popover text-popover-foreground animate-in slide-in-from-bottom-5 fade-in duration-300 z-[9999]",
          toast.type === "success" ? "border-border" : "border-destructive/30 bg-destructive/10"
        )}>
          {toast.type === "success"
            ? <CheckCircle2 className="h-5 w-5 text-green-500" />
            : <AlertCircle  className="h-5 w-5 text-destructive" />}
          <span className="text-sm font-semibold">{toast.message}</span>
        </div>
      )}
    </div>
  )
}