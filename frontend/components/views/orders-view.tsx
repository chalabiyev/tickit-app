"use client"

import { useState, useEffect, useMemo } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Search, Loader2, Tag, Calendar } from "lucide-react"

export function OrdersView() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all") // all, paid, invite

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const token = localStorage.getItem("tickit_token")
        const res = await fetch("http://localhost:8080/api/v1/orders/organizer-all", {
          headers: { "Authorization": `Bearer ${token}` }
        })
        const data = await res.json()
        setOrders(data)
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    fetchOrders()
  }, [])

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      const matchesSearch = o.customer.toLowerCase().includes(search.toLowerCase()) || 
                            o.email.toLowerCase().includes(search.toLowerCase()) ||
                            o.id.includes(search.toUpperCase());
      const matchesFilter = filter === "all" ? true : 
                            filter === "invite" ? o.isInvite : !o.isInvite;
      return matchesSearch && matchesFilter;
    })
  }, [search, filter, orders])

  if (loading) return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="animate-spin text-primary" /></div>

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between bg-card/50 backdrop-blur-md p-4 rounded-2xl border border-border/50">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Axtarış (Ad, Email, ID)..." 
            className="pl-10 rounded-xl bg-secondary/20 border-none"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex bg-secondary/20 p-1 rounded-xl">
          <Button variant={filter === "all" ? "default" : "ghost"} size="sm" className="rounded-lg text-xs font-bold" onClick={() => setFilter("all")}>Bütün</Button>
          <Button variant={filter === "paid" ? "default" : "ghost"} size="sm" className="rounded-lg text-xs font-bold" onClick={() => setFilter("paid")}>Satışlar</Button>
          <Button variant={filter === "invite" ? "default" : "ghost"} size="sm" className="rounded-lg text-xs font-bold" onClick={() => setFilter("invite")}>Dəvətnamələr</Button>
        </div>
      </div>

      <Card className="border-border/50 bg-card/50 overflow-hidden rounded-[2rem]">
        <Table>
          <TableHeader className="bg-secondary/10">
            <TableRow className="border-border/40">
              <TableHead className="pl-6 font-bold uppercase text-[10px]">ID</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Tədbir</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Müştəri</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Bilet</TableHead>
              <TableHead className="font-bold uppercase text-[10px]">Məbləğ</TableHead>
              <TableHead className="pr-6 font-bold uppercase text-[10px] text-right">Tarix</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredOrders.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center py-20 opacity-30 font-bold">Məlumat tapılmadı</TableCell></TableRow>
            ) : (
              filteredOrders.map((o) => (
                <TableRow key={o.id} className="hover:bg-primary/5 transition-colors border-border/40">
                  <TableCell className="pl-6 font-black text-xs text-primary">#{o.id}</TableCell>
                  <TableCell className="font-bold text-xs max-w-[180px] truncate">{o.eventName}</TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-bold text-xs">{o.customer}</span>
                      <span className="text-[10px] text-muted-foreground">{o.email}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={o.isInvite ? "destructive" : "secondary"} className="text-[9px] font-black uppercase">
                      {o.type} ədəd {o.isInvite && "• INVITE"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-black text-xs">{o.amount} ₼</TableCell>
                  <TableCell className="pr-6 text-right text-[10px] font-bold text-muted-foreground">
                    {new Date(o.date).toLocaleString('az-AZ')}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  )
}