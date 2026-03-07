"use client"

import { useState, useEffect, useCallback } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Copy, Tag, X, Loader2, Calendar, Trash2, AlertTriangle, Check, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

// ── Types ─────────────────────────────────────────────────────────────────────
interface Tier      { tierId: string; name: string }
interface EventItem { id: string; title: string; tiers?: Tier[]; eventDate?: string; status?: string; deleted?: boolean }
interface Promo     { id: string; code: string; value: number; type: "PERCENTAGE" | "FIXED"; usedCount: number; usageLimit: number; active: boolean; expiresAt?: string; eventId?: string }

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

// ── Field wrapper ─────────────────────────────────────────────────────────────
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <Label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
    </div>
  )
}

// ── Promo Card ────────────────────────────────────────────────────────────────
function PromoCard({ promo, events, onDeleteRequest }: {
  promo: Promo
  events: EventItem[]
  onDeleteRequest: () => void
}) {
  const [copied, setCopied] = useState(false)
  const pct = promo.usageLimit > 0 ? Math.round((promo.usedCount / promo.usageLimit) * 100) : 0
  const associatedEvent = events.find((e) => e.id === promo.eventId)
  const { locale } = useLocale()

  const handleCopy = () => {
    navigator.clipboard.writeText(promo.code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }

  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl border border-border/50 bg-card p-5 transition-all duration-200 hover:border-primary/25 hover:shadow-md" style={{ isolation: "isolate" }}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <Tag className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-black text-foreground tracking-tight">{promo.code}</span>
              <button onClick={handleCopy} className={cn("transition-colors", copied ? "text-emerald-500" : "text-muted-foreground hover:text-foreground")} aria-label={t(locale, "copy")}>
                {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
              </button>
            </div>
            <span className="text-xs font-bold text-primary">
              -{promo.value}{promo.type === "PERCENTAGE" ? "%" : " ₼"}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <span className={cn(
            "text-[10px] font-bold px-2 py-0.5 rounded-full border",
            promo.active
              ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
              : "bg-secondary text-muted-foreground border-border/40"
          )}>
            {promo.active ? t(locale, "active") : t(locale, "past")}
          </span>
          <button onClick={onDeleteRequest} className="opacity-0 group-hover:opacity-100 h-7 w-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all" aria-label={t(locale, "cancel")}>
            <Trash2 className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-secondary/40 text-[10px] font-semibold text-muted-foreground">
        <Calendar className="h-3 w-3 text-primary/60 shrink-0" />
        <span className="truncate">{associatedEvent ? associatedEvent.title : t(locale, "allEvents")}</span>
      </div>

      <div className="space-y-1.5">
        <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          <span>{t(locale, "usageLabel") || t(locale, "usage")}</span>
          <span className="tabular-nums">{promo.usedCount} / {promo.usageLimit}</span>
        </div>
        <div className="relative h-1.5 rounded-full bg-secondary overflow-hidden">
          <div className={cn("h-full rounded-full transition-all duration-700", pct > 80 ? "bg-amber-500" : "bg-primary")} style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-between text-[10px] text-muted-foreground/50 font-medium">
        <span>{promo.expiresAt ? `${t(locale, "expiresOn")}: ${promo.expiresAt.split("T")[0]}` : t(locale, "noExpiry")}</span>
        <span className="uppercase tracking-widest">ID …{promo.id.slice(-4)}</span>
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function PromocodesView() {
  const { locale } = useLocale()

  const [isModalOpen,   setIsModalOpen]   = useState(false)
  const [promoToDelete, setPromoToDelete] = useState<string | null>(null)
  const [isDeleting,    setIsDeleting]    = useState(false)
  const [isSubmitting,  setIsSubmitting]  = useState(false)
  const [isLoading,     setIsLoading]     = useState(true)
  const [loadErrorKey,  setLoadErrorKey]  = useState<string | null>(null)

  const [promocodes,      setPromocodes]      = useState<Promo[]>([])
  const [events,          setEvents]          = useState<EventItem[]>([])

  // Form
  const [newCode,         setNewCode]         = useState("")
  const [discountType,    setDiscountType]    = useState("PERCENTAGE")
  const [discountValue,   setDiscountValue]   = useState("")
  const [limit,           setLimit]           = useState("")
  const [expiryDate,      setExpiryDate]      = useState("")
  const [selectedEventId, setSelectedEventId] = useState("all")
  const [selectedTierIds, setSelectedTierIds] = useState<string[]>([])
  const [formErrorKey,    setFormErrorKey]    = useState<string | null>(null)
  const [submitErrorKey,  setSubmitErrorKey]  = useState<string | null>(null)
  const [deleteErrorKey,  setDeleteErrorKey]  = useState<string | null>(null)

  const resetForm = () => {
    setNewCode(""); setDiscountValue(""); setLimit(""); setExpiryDate("")
    setSelectedEventId("all"); setSelectedTierIds([]); setFormErrorKey(null); setSubmitErrorKey(null)
  }

  const fetchData = useCallback(async () => {
    setIsLoading(true)
    setLoadErrorKey(null)
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) { setLoadErrorKey("errUnauthorized"); setIsLoading(false); return }
    const headers = { Authorization: `Bearer ${token}` }
    const today = new Date(); today.setHours(0, 0, 0, 0)
    try {
      const [promoRes, eventRes] = await Promise.all([
        fetch(`${API_BASE}/api/v1/promocodes/me`, { headers }),
        fetch(`${API_BASE}/api/v1/events/me`,     { headers }),
      ])
      if (!promoRes.ok) { setLoadErrorKey(getErrKey(null, promoRes)); return }
      if (!eventRes.ok) { setLoadErrorKey(getErrKey(null, eventRes)); return }

      setPromocodes(await promoRes.json())
      const all: EventItem[] = await eventRes.json()
      setEvents(all.filter((ev) => {
        if (ev.deleted || ev.status !== "PUBLISHED") return false
        if (ev.eventDate) {
          const str  = ev.eventDate.includes(".") ? ev.eventDate.split(".").reverse().join("-") : ev.eventDate
          const evDt = new Date(str); evDt.setHours(0, 0, 0, 0)
          if (evDt < today) return false
        }
        return true
      }))
    } catch (err) {
      setLoadErrorKey(getErrKey(err))
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleCreate = async () => {
    if (!newCode || !discountValue || !limit) {
      setFormErrorKey("fillAllFields")
      return
    }
    setFormErrorKey(null)
    setSubmitErrorKey(null)
    setIsSubmitting(true)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${API_BASE}/api/v1/promocodes`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          code:              newCode.trim().toUpperCase(),
          type:              discountType,
          value:             parseFloat(discountValue),
          usageLimit:        parseInt(limit, 10),
          eventId:           selectedEventId === "all" ? null : selectedEventId,
          applicableTierIds: selectedTierIds.length ? selectedTierIds : null,
          expiresAt:         expiryDate ? `${expiryDate}T23:59:59` : null,
        }),
      })
      if (!res.ok) { setSubmitErrorKey(getErrKey(null, res)); return }
      setIsModalOpen(false)
      resetForm()
      fetchData()
    } catch (err) {
      setSubmitErrorKey(getErrKey(err))
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!promoToDelete) return
    setIsDeleting(true)
    setDeleteErrorKey(null)
    try {
      const token = localStorage.getItem(TOKEN_KEY)
      const res = await fetch(`${API_BASE}/api/v1/promocodes/${promoToDelete}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) { setDeleteErrorKey(getErrKey(null, res)); return }
      setPromocodes((p) => p.filter((x) => x.id !== promoToDelete))
      setPromoToDelete(null)
    } catch (err) {
      setDeleteErrorKey(getErrKey(err))
    } finally {
      setIsDeleting(false)
    }
  }

  const availableTiers = selectedEventId !== "all"
    ? (events.find((e) => e.id === selectedEventId)?.tiers ?? [])
    : []

  // Loading
  if (isLoading) return (
    <div className="flex h-40 items-center justify-center gap-3 text-muted-foreground">
      <Loader2 className="h-6 w-6 animate-spin text-primary" />
      <p className="text-sm font-medium">{t(locale, "loadingData")}</p>
    </div>
  )

  // Load error
  if (loadErrorKey) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, loadErrorKey)}</p>
      <Button variant="outline" className="gap-2 rounded-xl font-bold" onClick={fetchData}>
        <RefreshCw className="h-4 w-4" /> {t(locale, "tryAgain") || "Yenidən cəhd et"}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground font-medium">{t(locale, "promoSubtitle")}</p>
        <Button className="gap-2 font-bold rounded-xl shadow-sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" /> {t(locale, "createCode")}
        </Button>
      </div>

      {promocodes.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {promocodes.map((p) => (
            <PromoCard key={p.id} promo={p} events={events} onDeleteRequest={() => setPromoToDelete(p.id)} />
          ))}
        </div>
      ) : (
        <div className="py-20 text-center text-sm text-muted-foreground font-medium rounded-2xl border-2 border-dashed border-border/40 bg-secondary/10">
          {t(locale, "noPromocodes")}
        </div>
      )}

      {/* Create modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-background/80 p-4 animate-in fade-in"
          style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" style={{ isolation: "isolate" }}>
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <h3 className="text-base font-bold">{t(locale, "createCode")}</h3>
              <button onClick={() => { setIsModalOpen(false); resetForm() }} className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-secondary transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 flex flex-col gap-4">
              <Field label={t(locale, "event")}>
                <Select value={selectedEventId} onValueChange={(v) => { setSelectedEventId(v); setSelectedTierIds([]) }}>
                  <SelectTrigger className="h-10 bg-secondary/30"><SelectValue /></SelectTrigger>
                  <SelectContent className="z-[1001]">
                    <SelectItem value="all">{t(locale, "allEvents")}</SelectItem>
                    {events.map((ev) => <SelectItem key={ev.id} value={ev.id}>{ev.title}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>

              {availableTiers.length > 0 && (
                <Field label={t(locale, "tierSelectorHint")}>
                  <div className="flex flex-wrap gap-2 p-3 border border-border/40 rounded-xl bg-secondary/20">
                    {availableTiers.map((tier) => (
                      <button key={tier.tierId} onClick={() => setSelectedTierIds((p) =>
                        p.includes(tier.tierId) ? p.filter((id) => id !== tier.tierId) : [...p, tier.tierId]
                      )} className={cn(
                        "px-3 py-1 text-xs font-semibold rounded-full border transition-all",
                        selectedTierIds.includes(tier.tierId)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border/50 text-muted-foreground hover:border-primary/40"
                      )}>
                        {tier.name}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              <Field label={`${t(locale, "promoCodeName")} *`}>
                <Input placeholder="DOST25" className="h-10 uppercase font-mono font-bold bg-secondary/30" value={newCode} onChange={(e) => setNewCode(e.target.value)} />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label={t(locale, "discountType") || t(locale, "type")}>
                  <Select value={discountType} onValueChange={setDiscountType}>
                    <SelectTrigger className="h-10 bg-secondary/30"><SelectValue /></SelectTrigger>
                    <SelectContent className="z-[1001]">
                      <SelectItem value="PERCENTAGE">{t(locale, "percentageType")}</SelectItem>
                      <SelectItem value="FIXED">{t(locale, "fixedType")}</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>
                <Field label={`${t(locale, "discountValue") || t(locale, "discount")} *`}>
                  <Input type="number" placeholder="20" className="h-10 font-bold bg-secondary/30" value={discountValue} onChange={(e) => setDiscountValue(e.target.value)} style={{ minHeight: "40px" }} />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label={`${t(locale, "usageLimit")} *`}>
                  <Input type="number" placeholder="100" className="h-10 bg-secondary/30" value={limit} onChange={(e) => setLimit(e.target.value)} style={{ minHeight: "40px" }} />
                </Field>
                <Field label={t(locale, "expiryDate") || t(locale, "expiresOn")}>
                  <Input type="date" className="h-10 bg-secondary/30" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} style={{ minHeight: "40px" }} />
                </Field>
              </div>

              {/* Form validation error */}
              {formErrorKey && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs font-semibold text-destructive">{t(locale, formErrorKey)}</p>
                </div>
              )}

              {/* Submit error */}
              {submitErrorKey && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                  <p className="text-xs font-semibold text-destructive">{t(locale, submitErrorKey)}</p>
                </div>
              )}
            </div>

            <div className="flex gap-2 p-5 pt-0">
              <Button variant="outline" className="flex-1 font-bold rounded-xl" onClick={() => { setIsModalOpen(false); resetForm() }} disabled={isSubmitting}>{t(locale, "cancel")}</Button>
              <Button className="flex-1 font-bold rounded-xl" onClick={handleCreate} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : t(locale, "createCode")}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirm */}
      {promoToDelete && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-4 animate-in fade-in"
          style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}>
          <div className="bg-card border border-border/50 rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-in zoom-in-95 flex flex-col items-center text-center gap-4" style={{ isolation: "isolate" }}>
            <div className="h-12 w-12 rounded-xl bg-destructive/10 flex items-center justify-center text-destructive">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">{t(locale, "areYouSure")}</h3>
              <p className="text-sm text-muted-foreground mt-1">{t(locale, "confirmDeletePromo")}</p>
            </div>
            {deleteErrorKey && (
              <div className="w-full flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-4 w-4 text-destructive shrink-0" />
                <p className="text-xs font-semibold text-destructive">{t(locale, deleteErrorKey)}</p>
              </div>
            )}
            <div className="flex w-full gap-2">
              <Button variant="outline" className="flex-1 font-bold rounded-xl" onClick={() => { setPromoToDelete(null); setDeleteErrorKey(null) }} disabled={isDeleting}>{t(locale, "cancel")}</Button>
              <Button variant="destructive" className="flex-1 font-bold rounded-xl" onClick={handleConfirmDelete} disabled={isDeleting}>
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : t(locale, "yesDelete")}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}