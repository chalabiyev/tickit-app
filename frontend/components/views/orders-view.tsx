"use client"

import { useState, useEffect, useMemo } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Tag, AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

type FilterType = "all" | "paid" | "invite"

interface Order {
  id: string; eventName: string; customer: string
  email: string; type: number; isInvite: boolean
  amount: number; date: string
}

function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status !== undefined && status >= 500) return "errServer"
  return "errUnknown"
}

export function OrdersView() {
  const { locale }               = useLocale()
  const [orders, setOrders]      = useState<Order[]>([])
  const [loading, setLoading]    = useState(true)
  const [errorKey, setErrorKey]  = useState<string | null>(null)
  const [search, setSearch]      = useState("")
  const [filter, setFilter]      = useState<FilterType>("all")

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: "all",    label: t(locale, "all")    || "Bütün"        },
    { key: "paid",   label: t(locale, "paid")   || "Satışlar"     },
    { key: "invite", label: t(locale, "invite") || "Dəvətnamələr" },
  ]

  const fetchOrders = () => {
    const controller = new AbortController()
    setLoading(true)
    setErrorKey(null)
    ;(async () => {
      try {
        const token = localStorage.getItem(TOKEN_KEY)
        if (!token) { setErrorKey("errUnauthorized"); setLoading(false); return }
        const res = await fetch(`${API_BASE}/api/v1/orders/organizer-all`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!res.ok) { setErrorKey(getErrKey(null, res)); return }
        setOrders(await res.json())
      } catch (err) {
        if ((err as Error).name !== "AbortError") setErrorKey(getErrKey(err))
      } finally { setLoading(false) }
    })()
    return () => controller.abort()
  }

  useEffect(() => { fetchOrders() }, [])

  const filteredOrders = useMemo(() => {
    const q = search.toLowerCase()
    return orders.filter((o) => {
      const matchSearch = o.customer.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.id.toLowerCase().includes(q)
      const matchFilter = filter === "all" ? true : filter === "invite" ? o.isInvite : !o.isInvite
      return matchSearch && matchFilter
    })
  }, [search, filter, orders])

  if (loading) return (
    <div className="flex h-[60vh] items-center justify-center" role="status">
      <Loader2 className="h-7 w-7 animate-spin text-primary" />
    </div>
  )

  if (errorKey) return (
    <div className="flex flex-col items-center justify-center h-64 gap-4 text-center px-4">
      <div className="h-12 w-12 rounded-2xl bg-destructive/10 flex items-center justify-center">
        <AlertCircle className="h-6 w-6 text-destructive" />
      </div>
      <p className="text-sm font-semibold text-foreground max-w-xs">{t(locale, errorKey)}</p>
      <Button variant="outline" className="gap-2 rounded-xl font-bold" onClick={fetchOrders}>
        <RefreshCw className="h-4 w-4" /> {t(locale, "tryAgain") || "Yenidən cəhd et"}
      </Button>
    </div>
  )

  return (
    <div className="flex flex-col gap-5 animate-in fade-in duration-500">

      {/* Toolbar */}
      <Card className="border-border/50 bg-card/50 shadow-sm" style={{ WebkitBackdropFilter: "blur(8px)", backdropFilter: "blur(8px)" }}>
        <CardContent className="p-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder={t(locale, "searchOrdersPlaceholder") || "Axtarış (Ad, Email, ID)..."}
              className="pl-10 h-10 rounded-xl bg-secondary/30 border-border/50 focus-visible:ring-1 focus-visible:ring-primary/40"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label={t(locale, "search")}
            />
          </div>
          <div className="flex gap-1 bg-secondary/30 p-1 rounded-xl" role="group">
            {FILTERS.map(({ key, label }) => (
              <Button
                key={key}
                variant={filter === key ? "default" : "ghost"}
                size="sm"
                className={cn("rounded-lg text-xs font-bold h-8 px-3", filter !== key && "text-muted-foreground hover:text-foreground")}
                onClick={() => setFilter(key)}
              >
                {label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">{t(locale, "orders") || "Sifarişlər"}</p>
            <CardTitle className="text-lg font-black text-foreground">{filteredOrders.length} {t(locale, "results") || "nəticə"}</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border/40 hover:bg-transparent">
                {[
                  "ID",
                  t(locale, "event")       || "Tədbir",
                  t(locale, "customer")    || "Müştəri",
                  t(locale, "ticketType")  || "Bilet növü",
                  t(locale, "amount")      || "Məbləğ",
                  t(locale, "date")        || "Tarix",
                ].map((h, i) => (
                  <TableHead key={h} className={cn("text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground", i >= 4 && "text-right")}>
                    {h}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-20 text-muted-foreground/40 font-bold">
                    {t(locale, "noResults") || "Məlumat tapılmadı"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredOrders.map((o) => (
                  <TableRow key={o.id} className="hover:bg-muted/30 transition-colors border-border/30">
                    <TableCell>
                      <span className="font-mono text-xs font-black text-primary">#{o.id}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-xs font-bold text-foreground/80 max-w-[160px] truncate block">{o.eventName}</span>
                    </TableCell>
                    <TableCell>
                      <p className="text-xs font-bold text-foreground/80">{o.customer}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{o.email}</p>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={cn(
                          "text-[9px] font-black uppercase gap-1 border",
                          o.isInvite
                            ? "bg-violet-500/10 text-violet-500 border-violet-500/20"
                            : "bg-primary/10 text-primary border-primary/20"
                        )}
                      >
                        <Tag className="h-2 w-2" />
                        {o.type} {t(locale, "pcs") || "ədəd"}{o.isInvite ? " · INVITE" : ""}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-black text-foreground">{o.amount} ₼</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {new Date(o.date).toLocaleString("az-AZ")}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

    </div>
  )
}