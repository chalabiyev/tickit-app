"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DollarSign, Clock, ArrowDownToLine, Wallet } from "lucide-react"

interface Transaction {
  id: string
  description: string
  type: "sale" | "withdrawal" | "payout"
  amount: number
  date: string
  status: "completed" | "pending"
}

const transactions: Transaction[] = [
  { id: "TXN-001", description: "Baku Jazz Festival - 5 tickets", type: "sale", amount: 425, date: "2026-02-20", status: "completed" },
  { id: "TXN-002", description: "Withdrawal to bank", type: "withdrawal", amount: -2000, date: "2026-02-19", status: "completed" },
  { id: "TXN-003", description: "Tech Summit 2026 - 3 tickets", type: "sale", amount: 360, date: "2026-02-18", status: "completed" },
  { id: "TXN-004", description: "Stand-Up Night - 2 tickets", type: "sale", amount: 70, date: "2026-02-17", status: "completed" },
  { id: "TXN-005", description: "Payout processing", type: "payout", amount: -1500, date: "2026-02-16", status: "pending" },
  { id: "TXN-006", description: "Art Exhibition - 4 tickets", type: "sale", amount: 180, date: "2026-02-15", status: "completed" },
  { id: "TXN-007", description: "Classical Music Night - 6 tickets", type: "sale", amount: 570, date: "2026-02-14", status: "completed" },
  { id: "TXN-008", description: "Withdrawal to bank", type: "withdrawal", amount: -3000, date: "2026-02-13", status: "completed" },
]

export function FinancesView() {
  const { locale } = useLocale()

  const balanceCards = [
    {
      label: t(locale, "totalBalance"),
      value: "$24,580",
      icon: DollarSign,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      label: t(locale, "pendingBalance"),
      value: "$3,200",
      icon: Clock,
      color: "text-warning",
      bgColor: "bg-warning/10",
    },
    {
      label: t(locale, "withdrawn"),
      value: "$18,400",
      icon: ArrowDownToLine,
      color: "text-success",
      bgColor: "bg-success/10",
    },
  ]

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 flex-1">
          {balanceCards.map((card) => {
            const Icon = card.icon
            return (
              <Card key={card.label} className="border-border/50 shadow-sm">
                <CardContent className="flex items-center gap-4 p-5">
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.bgColor}`}
                  >
                    <Icon className={`h-5 w-5 ${card.color}`} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">
                      {card.label}
                    </span>
                    <span className="text-xl font-bold tracking-tight text-foreground">
                      {card.value}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
        <Button className="gap-1.5 self-start sm:self-auto">
          <Wallet className="h-4 w-4" />
          {t(locale, "withdrawFunds")}
        </Button>
      </div>

      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold text-foreground">
            {t(locale, "transactionHistory")}
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  ID
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "description")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "type")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                  {t(locale, "amount")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "status")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium text-right">
                  {t(locale, "date")}
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {transactions.map((txn) => (
                <TableRow key={txn.id}>
                  <TableCell className="font-mono text-sm font-medium text-foreground">
                    {txn.id}
                  </TableCell>
                  <TableCell className="text-sm text-foreground max-w-[200px] truncate">
                    {txn.description}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs capitalize">
                      {t(locale, txn.type)}
                    </Badge>
                  </TableCell>
                  <TableCell
                    className={`text-sm font-medium text-right ${
                      txn.amount >= 0 ? "text-success" : "text-foreground"
                    }`}
                  >
                    {txn.amount >= 0 ? "+" : ""}${Math.abs(txn.amount)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        txn.status === "completed" ? "default" : "secondary"
                      }
                      className="text-xs"
                    >
                      {t(locale, txn.status === "completed" ? "paid" : "pending")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {txn.date}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  )
}
