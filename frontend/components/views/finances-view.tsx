"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, ArrowDownToLine, Wallet, ArrowUpRight, ArrowDownLeft } from "lucide-react"
import { cn } from "@/lib/utils"

type TxType   = "sale" | "withdrawal" | "payout"
type TxStatus = "completed" | "pending"

interface Transaction {
  id: string; description: string; type: TxType
  amount: number; date: string; status: TxStatus
}

// TODO: replace with API call
const TRANSACTIONS: Transaction[] = [
  { id: "TXN-001", description: "Baku Jazz Festival - 5 tickets",    type: "sale",       amount:  425,  date: "2026-02-20", status: "completed" },
  { id: "TXN-002", description: "Withdrawal to bank",                type: "withdrawal", amount: -2000, date: "2026-02-19", status: "completed" },
  { id: "TXN-003", description: "Tech Summit 2026 - 3 tickets",      type: "sale",       amount:  360,  date: "2026-02-18", status: "completed" },
  { id: "TXN-004", description: "Stand-Up Night - 2 tickets",        type: "sale",       amount:  70,   date: "2026-02-17", status: "completed" },
  { id: "TXN-005", description: "Payout processing",                 type: "payout",     amount: -1500, date: "2026-02-16", status: "pending"   },
  { id: "TXN-006", description: "Art Exhibition - 4 tickets",        type: "sale",       amount:  180,  date: "2026-02-15", status: "completed" },
  { id: "TXN-007", description: "Classical Music Night - 6 tickets", type: "sale",       amount:  570,  date: "2026-02-14", status: "completed" },
  { id: "TXN-008", description: "Withdrawal to bank",                type: "withdrawal", amount: -3000, date: "2026-02-13", status: "completed" },
]

const TYPE_BADGE: Record<TxType, string> = {
  sale:       "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  withdrawal: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  payout:     "bg-violet-500/10 text-violet-500 border-violet-500/20",
}

const TYPE_LABEL: Record<TxType, string> = {
  sale: "Satış", withdrawal: "Çıxarış", payout: "Ödəniş",
}

export function FinancesView() {
  const { locale } = useLocale()

  const balanceCards = [
    { label: t(locale, "totalBalance"),   value: "24 580 ₼", icon: DollarSign,      accent: "text-primary",    bg: "bg-primary/10"    },
    { label: t(locale, "pendingBalance"), value: "3 200 ₼",  icon: Clock,           accent: "text-amber-500",  bg: "bg-amber-500/10"  },
    { label: t(locale, "withdrawn"),      value: "18 400 ₼", icon: ArrowDownToLine, accent: "text-emerald-500",bg: "bg-emerald-500/10"},
  ]

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">

      {/* Top row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-stretch sm:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 flex-1">
          {balanceCards.map(({ label, value, icon: Icon, accent, bg }) => (
            <Card key={label} className="border-border/50 bg-card/50 shadow-sm hover:-translate-y-0.5 transition-transform duration-200">
              <CardContent className="p-5">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-[13px] mb-4", bg)}>
                  <Icon className={cn("h-5 w-5", accent)} />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">{label}</p>
                <p className="text-2xl font-black tracking-tight text-foreground">{value}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <div className="flex sm:items-center">
          <Button className="gap-2 h-11 px-5 rounded-xl font-bold shadow-md shadow-primary/20 w-full sm:w-auto">
            <Wallet className="h-4 w-4" />
            {t(locale, "withdrawFunds")}
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card className="border-border/50 bg-card/50 shadow-sm overflow-hidden">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-1">
                {t(locale, "transactionHistory")}
              </p>
              <CardTitle className="text-lg font-black text-foreground">{TRANSACTIONS.length} əməliyyat</CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border/40">
                  {["ID", t(locale, "description"), t(locale, "type"), t(locale, "amount"), t(locale, "status"), t(locale, "date")].map((h, i) => (
                    <th key={h} className={cn("px-5 py-3.5 text-[10px] font-black uppercase tracking-[0.12em] text-muted-foreground", i >= 3 ? "text-right" : "text-left")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TRANSACTIONS.map(({ id, description, type, amount, date, status }) => {
                  const isPositive = amount >= 0
                  return (
                    <tr key={id} className="border-b border-border/30 last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-5 py-4">
                        <span className="font-mono text-xs font-bold text-primary">{id}</span>
                      </td>
                      <td className="px-5 py-4 max-w-[200px]">
                        <span className="text-xs font-semibold text-foreground/70 truncate block">{description}</span>
                      </td>
                      <td className="px-5 py-4">
                        <Badge variant="outline" className={cn("text-[10px] font-bold border", TYPE_BADGE[type])}>
                          {TYPE_LABEL[type]}
                        </Badge>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isPositive
                            ? <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                            : <ArrowDownLeft className="h-3 w-3 text-muted-foreground" />
                          }
                          <span className={cn("text-sm font-black", isPositive ? "text-emerald-500" : "text-foreground")}>
                            {isPositive ? "+" : ""}${Math.abs(amount)}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <span className={cn(
                            "inline-block w-1.5 h-1.5 rounded-full",
                            status === "completed" ? "bg-emerald-500" : "bg-amber-500"
                          )} />
                          <span className={cn("text-[11px] font-bold", status === "completed" ? "text-emerald-500" : "text-amber-500")}>
                            {t(locale, status === "completed" ? "paid" : "pending")}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-[11px] font-bold text-muted-foreground">{date}</span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}