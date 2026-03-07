"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "@/hooks/use-toast"
import {
  Camera, Save, Lock, Building2, User, Loader2,
  CheckCircle2, Globe, Instagram, CreditCard, KeyRound, AlertCircle,
} from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"

interface ProfileForm {
  firstName: string; lastName: string; companyName: string
  phone: string; email: string; avatarUrl: string
  voen: string; legalAddress: string; responsiblePerson: string
  extraContact: string; instagramUrl: string; websiteUrl: string
  iban: string; bankName: string
}

const EMPTY_FORM: ProfileForm = {
  firstName: "", lastName: "", companyName: "", phone: "", email: "",
  avatarUrl: "", voen: "", legalAddress: "", responsiblePerson: "",
  extraContact: "", instagramUrl: "", websiteUrl: "", iban: "", bankName: "",
}

function getAuthHeader(): HeadersInit {
  const token = localStorage.getItem("eticksystem_token")
  return token ? { Authorization: `Bearer ${token}` } : {}
}

// Replace null/undefined with "" to avoid React controlled-input warnings
function sanitizeForm(data: Partial<Record<keyof ProfileForm, unknown>>): ProfileForm {
  const result = { ...EMPTY_FORM }
  for (const k of Object.keys(EMPTY_FORM) as (keyof ProfileForm)[]) {
    const val = data[k]
    result[k] = val == null ? "" : String(val)
  }
  return result
}

function SectionCard({ icon: Icon, title, children }: {
  icon: React.ElementType; title: string; children: React.ReactNode
}) {
  return (
    <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
          <Icon className="w-4 h-4 text-primary" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">{children}</CardContent>
    </Card>
  )
}

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{label}</Label>
      {children}
    </div>
  )
}

export function SettingsView() {
  const { locale }                = useLocale()
  const [loading, setLoading]     = useState(true)
  const [loadErrKey, setLoadErrKey] = useState<string | null>(null)
  const [saving, setSaving]       = useState(false)
  const [saveState, setSaveState] = useState<"idle" | "success">("idle")
  const [form, setForm]           = useState<ProfileForm>(EMPTY_FORM)
  const fileInputRef              = useRef<HTMLInputElement>(null)

  const set = useCallback(<K extends keyof ProfileForm>(key: K, val: ProfileForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
  }, [])

  function getErrKey(res?: Response): string {
    if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
    const status = res?.status
    if (status === 401) return "errUnauthorized"
    if (status === 403) return "errForbidden"
    if (status !== undefined && status >= 500) return "errServer"
    return "errUnknown"
  }

  useEffect(() => {
    const controller = new AbortController()
    ;(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/v1/profile`, {
          headers: getAuthHeader(), signal: controller.signal,
        })
        if (!res.ok) { setLoadErrKey(getErrKey(res)); return }
        const data = await res.json()
        setForm(sanitizeForm(data))
      } catch (err) {
        if ((err as Error).name !== "AbortError") setLoadErrKey(getErrKey())
      } finally { setLoading(false) }
    })()
    return () => controller.abort()
  }, [])

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith("image/")) {
      toast({ variant: "destructive", title: t(locale, "error") || "Xəta", description: t(locale, "onlyImages") || "Yalnız şəkil faylları qəbul edilir" }); return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ variant: "destructive", title: t(locale, "error") || "Xəta", description: t(locale, "fileTooLarge") || "Fayl 5MB-dan böyük ola bilməz" }); return
    }
    const fd = new FormData()
    fd.append("file", file)
    try {
      const res = await fetch(`${API_BASE}/api/v1/upload/image`, { method: "POST", headers: getAuthHeader(), body: fd })
      if (!res.ok) throw { status: res.status }
      const data = await res.json()
      set("avatarUrl", `${API_BASE}${data.url}`)
    } catch (err) {
      toast({ variant: "destructive", title: t(locale, "error") || "Xəta", description: t(locale, getErrKey((err as { status?: number })?.status ? { status: (err as { status?: number }).status } as Response : undefined)) })
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`${API_BASE}/api/v1/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", ...getAuthHeader() },
        body: JSON.stringify(form),
      })
      if (!res.ok) throw { status: res.status }
      setSaveState("success")
      setTimeout(() => setSaveState("idle"), 3000)
    } catch (err) {
      toast({ variant: "destructive", title: t(locale, "error") || "Xəta", description: t(locale, getErrKey((err as { status?: number })?.status ? { status: (err as { status?: number }).status } as Response : undefined)) })
    } finally { setSaving(false) }
  }

  const avatarSrc = form.avatarUrl?.startsWith("http") ? form.avatarUrl : null
  const displayName = [form.firstName, form.lastName].filter(Boolean).join(" ") || "İstifadəçi"

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center" role="status">
      <Loader2 className="animate-spin text-primary" />
    </div>
  )

  if (loadErrKey) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, loadErrKey)}</p>
    </div>
  )

  const inputCls = "h-11 bg-secondary/30 border-border/50 rounded-xl font-medium focus-visible:ring-1 focus-visible:ring-primary/40"

  return (
    <div className="max-w-4xl mx-auto flex flex-col gap-6 animate-in fade-in duration-500 pb-24">

      {/* Header */}
      <Card className="border-border/50 bg-card/50 backdrop-blur-sm">
        <CardContent className="p-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className="w-20 h-20 rounded-2xl bg-primary/10 border-2 border-border overflow-hidden flex items-center justify-center">
                  {avatarSrc ? (
                    <img src={avatarSrc} className="w-full h-full object-cover" alt={displayName} loading="lazy"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none" }} />
                  ) : (
                    <User className="w-8 h-8 text-primary/50" />
                  )}
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/jpeg,image/png,image/webp" onChange={handleImageUpload} aria-label="Upload avatar" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="absolute -bottom-1.5 -right-1.5 p-2 bg-primary text-primary-foreground rounded-xl shadow-lg hover:scale-105 active:scale-95 transition-transform"
                  aria-label="Change avatar"
                >
                  <Camera className="w-3.5 h-3.5" />
                </button>
              </div>
              <div>
                <h1 className="text-xl font-black tracking-tight text-foreground">{displayName}</h1>
                <p className="text-sm text-muted-foreground">{form.email}</p>
              </div>
            </div>
            <Button className="gap-2 h-11 px-6 rounded-xl font-bold shadow-md shadow-primary/20" onClick={handleSave} disabled={saving}>
              {saving
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : saveState === "success" ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />
              }
              {saveState === "success" ? (t(locale, "saved") || "Yadda saxlanıldı") : (t(locale, "save") || "Yadda saxla")}
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">

        <SectionCard icon={User} title="Şəxsi Məlumatlar">
          <FormField label="Ad">
            <Input className={inputCls} value={form.firstName} onChange={(e) => set("firstName", e.target.value)} autoComplete="given-name" />
          </FormField>
          <FormField label="Soyad">
            <Input className={inputCls} value={form.lastName} onChange={(e) => set("lastName", e.target.value)} autoComplete="family-name" />
          </FormField>
          <FormField label="Mobil Nömrə">
            <Input className={inputCls} value={form.phone} onChange={(e) => set("phone", e.target.value)} autoComplete="tel" inputMode="tel" />
          </FormField>
        </SectionCard>

        <SectionCard icon={Building2} title="Təşkilat Məlumatları">
          <FormField label="Brend Adı">
            <Input className={inputCls} value={form.companyName} onChange={(e) => set("companyName", e.target.value)} />
          </FormField>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="VÖEN">
              <Input className={inputCls} value={form.voen} onChange={(e) => set("voen", e.target.value)} />
            </FormField>
            <FormField label="Məsul Şəxs">
              <Input className={inputCls} value={form.responsiblePerson} onChange={(e) => set("responsiblePerson", e.target.value)} />
            </FormField>
          </div>
          <FormField label="Hüquqi Ünvan">
            <Input className={inputCls} value={form.legalAddress} onChange={(e) => set("legalAddress", e.target.value)} />
          </FormField>
        </SectionCard>

        <SectionCard icon={Globe} title="Onlayn Mövcudluq">
          <FormField label="Vebsayt">
            <div className="relative">
              <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-muted-foreground/50" />
              <Input className={cn(inputCls, "pl-10")} placeholder="https://..." value={form.websiteUrl} onChange={(e) => set("websiteUrl", e.target.value)} type="url" autoComplete="url" />
            </div>
          </FormField>
          <FormField label="Instagram">
            <div className="relative">
              <Instagram className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none w-4 h-4 text-muted-foreground/50" />
              <Input className={cn(inputCls, "pl-10")} placeholder="@username" value={form.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
            </div>
          </FormField>
        </SectionCard>

        <SectionCard icon={CreditCard} title="Bank Rekvizitləri">
          <FormField label="Bankın Adı">
            <Input className={inputCls} value={form.bankName} onChange={(e) => set("bankName", e.target.value)} />
          </FormField>
          <FormField label="IBAN">
            <Input className={cn(inputCls, "font-mono")} placeholder="AZ00XXXX..." value={form.iban} onChange={(e) => set("iban", e.target.value)} />
          </FormField>
        </SectionCard>

        <Card className="md:col-span-2 border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <Lock className="w-4 h-4 text-primary" /> Təhlükəsizlik
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-5">
            <div className="flex items-center gap-4">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-destructive/10">
                <KeyRound className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">Şifrəni Yenilə</p>
                <p className="text-xs text-muted-foreground mt-0.5">Hesabınızın təhlükəsizliyi üçün mütəmadi olaraq şifrənizi dəyişin.</p>
              </div>
            </div>
            <Button variant="outline" className="rounded-xl font-bold h-11 px-5 border-destructive/30 text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors shrink-0">
              Şifrəni dəyişdir
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  )
}