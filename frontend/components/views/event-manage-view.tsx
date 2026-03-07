"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Cropper from "react-easy-crop"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  ArrowLeft, Upload, CalendarDays, Loader2, CheckCircle2,
  AlertCircle, Trash2, Clock, Globe, Power, ShieldAlert,
  Lock, Ticket, UserCheck, X, RefreshCw,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { LocationPicker } from "./create-event/LocationPicker"
import type { EventData } from "./AdminBookingModal"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

interface EventManageViewProps {
  event: EventData
  onBack: () => void
}

type ToastState = { show: boolean; message: string; type: "success" | "error" }
type CropArea   = { x: number; y: number; width: number; height: number }

const CATEGORIES = ["concert", "conference", "workshop", "sports", "theater", "exhibition", "other"] as const
const AGE_LIMITS = ["0+", "3+", "6+", "12+", "16+", "18+", "21+"] as const

// ── Error helper ──────────────────────────────────────────────────────────────
function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status === 404) return "errNotFound"
  if (status === 429) return "errTooManyRequests"
  if (status !== undefined && status >= 500) return "errServer"
  return "errUnknown"
}

// ── Image crop helpers ────────────────────────────────────────────────────────
function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.addEventListener("load", () => resolve(img))
    img.addEventListener("error", reject)
    img.src = url
  })
}

async function getCroppedImg(src: string, crop: CropArea): Promise<File> {
  const img    = await createImage(src)
  const canvas = document.createElement("canvas")
  const ctx    = canvas.getContext("2d")
  if (!ctx) throw new Error("No 2d context")
  canvas.width  = crop.width
  canvas.height = crop.height
  ctx.drawImage(img, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height)
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(new File([blob], "cropped.jpg", { type: "image/jpeg" })) : reject(new Error("Empty canvas")),
      "image/jpeg", 0.9
    )
  })
}

// ── UI helpers ────────────────────────────────────────────────────────────────
function Section({ title, icon, children, className }: {
  title: string; icon?: React.ReactNode; children: React.ReactNode; className?: string
}) {
  return (
    <Card className={cn("border-border/50 bg-card shadow-sm", className)}>
      <CardHeader className="pb-4 border-b border-border/50">
        <CardTitle className="text-base font-bold flex items-center gap-2">
          {icon && <span className="text-primary">{icon}</span>}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-5 flex flex-col gap-5">{children}</CardContent>
    </Card>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function EventManageView({ event, onBack }: EventManageViewProps) {
  const { locale } = useLocale()

  const [isLoading,         setIsLoading]         = useState(true)
  const [fetchErrorKey,     setFetchErrorKey]      = useState<string | null>(null)
  const [isSaving,          setIsSaving]           = useState(false)
  const [isDeleting,        setIsDeleting]         = useState(false)
  const [showDeleteModal,   setShowDeleteModal]    = useState(false)
  const [toast,             setToast]              = useState<ToastState>({ show: false, message: "", type: "success" })

  const [salesActive,          setSalesActive]          = useState(event.status === "active")
  const [title,                setTitle]                = useState("")
  const [description,          setDescription]          = useState("")
  const [category,             setCategory]             = useState("concert")
  const [customCategory,       setCustomCategory]       = useState("")
  const [date,                 setDate]                 = useState("")
  const [startTime,            setStartTime]            = useState("")
  const [endTime,              setEndTime]              = useState("")
  const [isPhysical,           setIsPhysical]           = useState(true)
  const [venueName,            setVenueName]            = useState("")
  const [address,              setAddress]              = useState("")
  const [isPrivate,            setIsPrivate]            = useState(false)
  const [ageRestriction,       setAgeRestriction]       = useState("0+")
  const [maxTicketsPerOrder,   setMaxTicketsPerOrder]   = useState(10)
  const [coverImageUrl,        setCoverImageUrl]        = useState<string | null>(null)

  const [isUploading,       setIsUploading]       = useState(false)
  const [imageSrc,          setImageSrc]          = useState<string | null>(null)
  const [crop,              setCrop]              = useState({ x: 0, y: 0 })
  const [zoom,              setZoom]              = useState(1)
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<CropArea | null>(null)
  const [isCropperOpen,     setIsCropperOpen]     = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const showToast = useCallback((msgKey: string, type: ToastState["type"], fallback?: string) => {
    setToast({ show: true, message: t(locale, msgKey) || fallback || msgKey, type })
    setTimeout(() => setToast((p) => ({ ...p, show: false })), 3000)
  }, [locale])

  // Fetch event
  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        const res = await fetch(`${API_BASE}/api/v1/events/${event.id}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setFetchErrorKey(getErrKey(null, res)); return }
        const d = await res.json()
        setTitle(d.title          ?? "")
        setDescription(d.description ?? "")
        setCategory(d.category    ?? "concert")
        setDate(d.eventDate       ?? "")
        setStartTime(d.startTime  ?? "")
        setEndTime(d.endTime      ?? "")
        setIsPhysical(d.isPhysical ?? true)
        setVenueName(d.venueName  ?? "")
        setAddress(d.address      ?? "")
        setIsPrivate(d.isPrivate  ?? false)
        setAgeRestriction(d.ageRestriction    ?? "0+")
        setMaxTicketsPerOrder(d.maxTicketsPerOrder ?? 10)
        setSalesActive(d.status !== "PAUSED")
        if (d.coverImageUrl) {
          setCoverImageUrl(d.coverImageUrl.startsWith("http")
            ? d.coverImageUrl
            : `${API_BASE}${d.coverImageUrl.startsWith("/") ? "" : "/"}${d.coverImageUrl}`)
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") setFetchErrorKey(getErrKey(err))
      } finally {
        setIsLoading(false)
      }
    })()
    return () => controller.abort()
  }, [event.id])

  // Image
  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => { setImageSrc(reader.result as string); setIsCropperOpen(true) }
    reader.readAsDataURL(file)
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleCropSave = async () => {
    if (!imageSrc || !croppedAreaPixels) return
    setIsUploading(true)
    setIsCropperOpen(false)
    try {
      const croppedFile = await getCroppedImg(imageSrc, croppedAreaPixels)
      const form = new FormData()
      form.append("file", croppedFile)
      const token = localStorage.getItem(TOKEN_KEY) ?? ""
      const res = await fetch(`${API_BASE}/api/v1/upload/image`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      })
      if (!res.ok) throw Object.assign(new Error(), { status: res.status })
      const data = await res.json()
      setCoverImageUrl(`${API_BASE}${data.url}`)
    } catch (err) {
      showToast(getErrKey(err), "error")
    } finally {
      setIsUploading(false)
      setImageSrc(null)
    }
  }

  // Save
  const handleSave = async () => {
    setIsSaving(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY) ?? ""
      const finalCategory = category === "other" ? customCategory.trim() : category
      const res = await fetch(`${API_BASE}/api/v1/events/${event.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          title, description, category: finalCategory,
          eventDate: date, startTime, endTime,
          isPhysical, venueName, address,
          isPrivate, ageRestriction, maxTicketsPerOrder,
          coverImageUrl: coverImageUrl?.replace(API_BASE, ""),
          status: salesActive ? "ACTIVE" : "PAUSED",
        }),
      })
      if (!res.ok) throw Object.assign(new Error(), { status: res.status })
      showToast("saveSuccess", "success")
      setTimeout(onBack, 1500)
    } catch (err) {
      showToast(getErrKey(err), "error")
      setIsSaving(false)
    }
  }

  // Delete
  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY) ?? ""
      const res = await fetch(`${API_BASE}/api/v1/events/${event.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw Object.assign(new Error(), { status: res.status })
      setShowDeleteModal(false)
      showToast("eventDeleted", "success")
      setTimeout(onBack, 1500)
    } catch (err) {
      showToast(getErrKey(err), "error")
      setIsDeleting(false)
      setShowDeleteModal(false)
    }
  }

  // ── States ──
  if (isLoading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-3 text-muted-foreground">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
      <p className="text-sm font-medium">{t(locale, "loadingData")}</p>
    </div>
  )

  if (fetchErrorKey) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, fetchErrorKey)}</p>
      <Button variant="outline" className="gap-2 font-bold rounded-xl" onClick={onBack}>
        <ArrowLeft className="h-4 w-4" /> {t(locale, "back")}
      </Button>
    </div>
  )

  return (
    <>
      <div className="flex flex-col gap-5 pb-24 sm:pb-12 animate-in fade-in duration-300">

        {/* Header */}
        <div className="flex items-center justify-between gap-4 p-4 rounded-2xl border border-border/50 bg-card shadow-sm">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="secondary" size="icon" className="h-9 w-9 shrink-0 rounded-xl" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div className="min-w-0">
              <h1 className="text-base font-bold text-foreground truncate">{t(locale, "editEvent")}</h1>
              <p className="text-xs text-muted-foreground truncate">{title}</p>
            </div>
          </div>
          <Badge variant={salesActive ? "default" : "destructive"} className="shrink-0 text-xs">
            {salesActive ? t(locale, "salesActiveStatus") : t(locale, "salesPausedStatus")}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Left column */}
          <div className="lg:col-span-2 flex flex-col gap-5">

            <Section title={t(locale, "basicInfo")}>
              <Field label={t(locale, "eventTitle")}>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="h-10 bg-secondary/30" placeholder={t(locale, "eventTitleExample")} />
              </Field>
              <Field label={t(locale, "description")}>
                <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} className="resize-none bg-secondary/30" placeholder={t(locale, "descriptionPlaceholder")} />
              </Field>
              <Field label={t(locale, "category")}>
                <div className="flex flex-col gap-2 max-w-xs">
                  <Select value={category} onValueChange={setCategory}>
                    <SelectTrigger className="h-10 bg-secondary/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => <SelectItem key={c} value={c}>{t(locale, c)}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  {category === "other" && (
                    <Input
                      autoFocus
                      placeholder={t(locale, "specifyCategory")}
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="h-10 bg-secondary/30 animate-in fade-in slide-in-from-top-1"
                    />
                  )}
                </div>
              </Field>
            </Section>

            {/* Date & Time */}
            <Section title={t(locale, "dateTime")} icon={<CalendarDays className="h-4 w-4" />}>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Field label={t(locale, "date")}>
                  {/* Safari: min-height fallback for date input */}
                  <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 bg-secondary/30" style={{ minHeight: "40px" }} />
                </Field>
                <Field label={t(locale, "startTime")}>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    {/* Safari: min-height + appearance fix for time input */}
                    <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="h-10 pl-9 bg-secondary/30" style={{ minHeight: "40px" }} />
                  </div>
                </Field>
                <Field label={t(locale, "endTime")}>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                    <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="h-10 pl-9 bg-secondary/30" style={{ minHeight: "40px" }} />
                  </div>
                </Field>
              </div>
            </Section>

            {/* Location */}
            <Card className="border-border/50 bg-card shadow-sm overflow-hidden" style={{ isolation: "isolate" }}>
              <CardHeader className="pb-0 border-b border-border/50">
                <div className="flex items-center justify-between pb-4">
                  <CardTitle className="text-base font-bold">{t(locale, "location")}</CardTitle>
                  <div className="flex items-center bg-secondary/50 rounded-lg border border-border/40 p-0.5">
                    {[
                      { val: true,  key: "physical" },
                      { val: false, key: "online" },
                    ].map(({ val, key }) => (
                      <button key={String(val)} onClick={() => setIsPhysical(val)} className={cn(
                        "px-3 py-1.5 text-xs font-bold rounded-md transition-all",
                        isPhysical === val ? "bg-primary text-primary-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                      )}>
                        {t(locale, key)}
                      </button>
                    ))}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-5">
                {isPhysical ? (
                  <div className="flex flex-col gap-4">
                    <Field label={t(locale, "venueName")}>
                      <Input value={venueName} onChange={(e) => setVenueName(e.target.value)} className="h-10 bg-secondary/30" placeholder={t(locale, "venueExample")} />
                    </Field>
                    <Field label={t(locale, "exactAddressAndMap")}>
                      <LocationPicker address={address} setAddress={setAddress} />
                    </Field>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3 py-6 text-center rounded-xl bg-secondary/20">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Globe className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-foreground">{t(locale, "onlineEventTitle")}</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">{t(locale, "onlineEventDesc")}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-5">

            {/* Poster */}
            <Section title={t(locale, "eventPosterTitle")}>
              <input type="file" ref={fileInputRef} onChange={onFileChange} accept="image/*" className="hidden" />
              <div
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={cn(
                  "relative flex h-44 w-full items-center justify-center rounded-xl border-2 border-dashed cursor-pointer overflow-hidden group transition-all",
                  coverImageUrl ? "border-primary/30" : "border-border/50 bg-secondary/20 hover:border-primary/30",
                  isUploading && "opacity-50 cursor-wait pointer-events-none"
                )}
                style={{ isolation: "isolate" }}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 text-primary">
                    <Loader2 className="h-7 w-7 animate-spin" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">{t(locale, "uploading")}</span>
                  </div>
                ) : coverImageUrl ? (
                  <>
                    <img src={coverImageUrl} alt="Cover" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" onError={() => setCoverImageUrl(null)} />
                    <div className="absolute inset-0 bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2"
                      style={{ WebkitBackdropFilter: "blur(4px)", backdropFilter: "blur(4px)" }}>
                      <Upload className="h-5 w-5" />
                      <span className="text-xs font-bold">{t(locale, "changeImage")}</span>
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <div className="p-2.5 bg-background rounded-xl border border-border/50"><Upload className="h-5 w-5" /></div>
                    <span className="text-xs font-semibold">{t(locale, "clickOrDrag")}</span>
                    <span className="text-[10px] opacity-50 uppercase tracking-wider">{t(locale, "recommendedSize")}</span>
                  </div>
                )}
              </div>
            </Section>

            {/* Additional settings */}
            <Section title={t(locale, "additionalSettings")}>
              {/* Privacy */}
              <div className="flex flex-col gap-2">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t(locale, "privacySettingsTitle")}</Label>
                <div className="flex flex-col gap-2">
                  {[
                    { val: false, icon: <Globe className="w-4 h-4" />,  titleKey: "publicEvent",  descKey: "publicEventDesc" },
                    { val: true,  icon: <Lock className="w-4 h-4" />,   titleKey: "privateEvent", descKey: "privateEventDesc" },
                  ].map(({ val, icon, titleKey, descKey }) => (
                    <div key={String(val)} onClick={() => setIsPrivate(val)} className={cn(
                      "flex items-center gap-3 p-3 rounded-xl border-2 cursor-pointer transition-all",
                      isPrivate === val ? "border-primary bg-primary/5" : "border-border/40 hover:border-primary/30"
                    )}>
                      <div className={cn("p-1.5 rounded-lg shrink-0", isPrivate === val ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground")}>
                        {icon}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground">{t(locale, titleKey)}</p>
                        <p className="text-[10px] text-muted-foreground leading-tight mt-0.5">{t(locale, descKey)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Age */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <UserCheck className="h-3.5 w-3.5 text-primary" /> {t(locale, "ageRestrictionTitle")}
                </Label>
                <p className="text-[10px] text-muted-foreground -mt-1">{t(locale, "ageRestrictionDesc")}</p>
                <Select value={ageRestriction} onValueChange={setAgeRestriction}>
                  <SelectTrigger className="h-9 bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {AGE_LIMITS.map((a) => <SelectItem key={a} value={a}>{a} {t(locale, "ageRestriction") || "Yaş"}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>

              {/* Max tickets */}
              <div className="flex flex-col gap-2 pt-4 border-t border-border/40">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-1.5">
                  <Ticket className="h-3.5 w-3.5 text-primary" /> {t(locale, "maxTicketsPerOrder")}
                </Label>
                <p className="text-[10px] text-muted-foreground -mt-1">{t(locale, "maxTicketsDesc")}</p>
                <Input type="number" min={1} max={100} value={maxTicketsPerOrder} onChange={(e) => setMaxTicketsPerOrder(Number(e.target.value))} className="h-9 bg-secondary/30 font-bold" style={{ minHeight: "36px" }} />
              </div>
            </Section>

            {/* Sales toggle */}
            <Card className={cn("border-border/50 shadow-sm transition-colors", salesActive ? "bg-card" : "bg-destructive/5 border-destructive/20")}>
              <CardContent className="p-5 flex flex-col gap-3">
                <div>
                  <p className="text-sm font-bold text-foreground">{t(locale, "ticketSales")}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{t(locale, "ticketSalesDesc")}</p>
                </div>
                <div className="flex items-center justify-between p-3 rounded-xl border border-border/40 bg-secondary/20">
                  <div className="flex items-center gap-2">
                    <div className={cn("h-2.5 w-2.5 rounded-full", salesActive ? "bg-emerald-500 animate-pulse" : "bg-destructive")} />
                    <span className="text-xs font-bold">
                      {salesActive ? t(locale, "salesActiveStatus") : t(locale, "salesPausedStatus")}
                    </span>
                  </div>
                  <Button variant="ghost" size="sm" className={cn("gap-1.5 text-xs font-bold h-8 rounded-lg", salesActive ? "text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-500/10")} onClick={() => setSalesActive(!salesActive)}>
                    <Power className="h-3.5 w-3.5" />
                    {salesActive ? t(locale, "pauseSales") : t(locale, "resumeSales")}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Danger zone */}
            <Card className="border-destructive/20 bg-destructive/5 shadow-sm">
              <CardContent className="p-5 flex flex-col gap-3">
                <div className="flex items-center gap-2 text-destructive">
                  <ShieldAlert className="h-4 w-4 shrink-0" />
                  <p className="text-sm font-bold">{t(locale, "dangerZone")}</p>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{t(locale, "dangerZoneDesc")}</p>
                <Button variant="destructive" className="w-full gap-2 font-bold text-xs h-9 rounded-xl" onClick={() => setShowDeleteModal(true)}>
                  <Trash2 className="h-3.5 w-3.5" /> {t(locale, "deleteEventForever")}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Sticky footer */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 sm:sticky sm:bottom-4 flex items-center justify-between gap-3 rounded-t-2xl sm:rounded-2xl border border-border/50 bg-card/95 p-4 shadow-[0_-8px_30px_-12px_rgba(0,0,0,0.15)]"
        style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
      >
        <div className="hidden sm:flex flex-col">
          <span className="text-sm font-semibold text-foreground">{t(locale, "confirmChanges")}</span>
          <span className="text-xs text-muted-foreground">{t(locale, "changesAppliedInstantly")}</span>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button variant="ghost" onClick={onBack} disabled={isSaving} className="font-bold h-10 px-5 rounded-xl">{t(locale, "cancel")}</Button>
          <Button onClick={handleSave} disabled={isSaving} className="gap-2 font-bold h-10 px-7 rounded-xl shadow-sm">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
            {t(locale, "save")}
          </Button>
        </div>
      </div>

      {/* Crop modal */}
      {isCropperOpen && imageSrc && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 animate-in fade-in duration-200 p-4"
          style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <div className="bg-background rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl border border-border/50 flex flex-col" style={{ isolation: "isolate" }}>
            <div className="flex items-center justify-between p-4 border-b border-border/50">
              <h3 className="font-bold">{t(locale, "cropImage")}</h3>
              <Button variant="ghost" size="icon" onClick={() => setIsCropperOpen(false)} className="rounded-full h-8 w-8"><X className="w-4 h-4" /></Button>
            </div>
            <div className="relative h-[50vh] bg-black">
              <Cropper image={imageSrc} crop={crop} zoom={zoom} aspect={16 / 9} onCropChange={setCrop} onCropComplete={(_, px) => setCroppedAreaPixels(px as CropArea)} onZoomChange={setZoom} />
            </div>
            <div className="flex items-center justify-between p-4 bg-secondary/20 border-t border-border/50">
              <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-1/2 accent-primary" />
              <Button onClick={handleCropSave} disabled={isUploading} className="font-bold gap-2 px-6">
                {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {t(locale, "save")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.show && (
        <div className={cn(
          "fixed bottom-24 sm:bottom-8 left-4 right-4 sm:left-auto sm:right-6 sm:w-80 flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border animate-in slide-in-from-bottom-3 fade-in z-[9999]",
          toast.type === "success" ? "bg-card border-emerald-500/20" : "bg-destructive/10 border-destructive/20"
        )}>
          {toast.type === "success" ? <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" /> : <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />}
          <span className="text-sm font-semibold text-foreground">{toast.message}</span>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 p-4 animate-in fade-in duration-200"
          style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 duration-200" style={{ isolation: "isolate" }}>
            <div className="h-11 w-11 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
              <Trash2 className="h-5 w-5 text-destructive" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">{t(locale, "deleteEventConfirmTitle")}</h3>
            <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{t(locale, "deleteEventConfirmDesc")}</p>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1 font-bold rounded-xl" onClick={() => setShowDeleteModal(false)} disabled={isDeleting}>{t(locale, "cancel")}</Button>
              <Button variant="destructive" className="flex-1 font-bold rounded-xl gap-2" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {t(locale, "yesDelete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}