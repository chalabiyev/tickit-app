"use client"

import { useState } from "react"
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
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

interface Order {
  id: string
  customer: string
  event: string
  amount: number
  status: "paid" | "pending" | "refunded"
  date: string
}

const orders: Order[] = [
  { id: "TKT-001", customer: "Leyla Mammadova", event: "Baku Jazz Festival", amount: 85, status: "paid", date: "2026-02-20" },
  { id: "TKT-002", customer: "Orhan Yilmaz", event: "Tech Summit 2026", amount: 120, status: "paid", date: "2026-02-19" },
  { id: "TKT-003", customer: "Ivan Petrov", event: "Stand-Up Night", amount: 35, status: "pending", date: "2026-02-18" },
  { id: "TKT-004", customer: "Aysel Huseynova", event: "Baku Jazz Festival", amount: 85, status: "paid", date: "2026-02-17" },
  { id: "TKT-005", customer: "Mehmet Demir", event: "Tech Summit 2026", amount: 120, status: "refunded", date: "2026-02-16" },
  { id: "TKT-006", customer: "Natasha Ivanova", event: "Art Exhibition", amount: 45, status: "paid", date: "2026-02-15" },
  { id: "TKT-007", customer: "Rasim Aliyev", event: "Stand-Up Night", amount: 35, status: "paid", date: "2026-02-14" },
  { id: "TKT-008", customer: "Elif Kaya", event: "Baku Jazz Festival", amount: 170, status: "pending", date: "2026-02-13" },
  { id: "TKT-009", customer: "Dmitry Sokolov", event: "Classical Music Night", amount: 95, status: "paid", date: "2026-02-12" },
  { id: "TKT-010", customer: "Zeynab Hajiyeva", event: "Film Festival", amount: 60, status: "paid", date: "2026-02-11" },
]

export function OrdersView() {
  const { locale } = useLocale()
  const [searchQuery, setSearchQuery] = useState("")

  const filteredOrders = orders.filter(
    (o) =>
      o.customer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.id.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const statusVariant = (status: Order["status"]) => {
    switch (status) {
      case "paid":
        return "default"
      case "pending":
        return "secondary"
      case "refunded":
        return "outline"
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <Card className="border-border/50 shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-base font-semibold text-foreground">
              {t(locale, "orders")}
            </CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder={t(locale, "searchOrders")}
                className="pl-9 h-9 bg-secondary/50 border-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "orderId")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "customer")}
                </TableHead>
                <TableHead className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
                  {t(locale, "event")}
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
              {filteredOrders.map((order) => (
                <TableRow key={order.id}>
                  <TableCell className="font-mono text-sm font-medium text-foreground">
                    {order.id}
                  </TableCell>
                  <TableCell className="text-sm text-foreground">
                    {order.customer}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {order.event}
                  </TableCell>
                  <TableCell className="text-sm font-medium text-foreground text-right">
                    ${order.amount}
                  </TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(order.status)} className="text-xs">
                      {t(locale, order.status)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground text-right">
                    {order.date}
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
