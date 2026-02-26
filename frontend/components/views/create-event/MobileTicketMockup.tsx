"use client"

import { QrCode, MapPin, CalendarDays } from "lucide-react"
import { Separator } from "@/components/ui/separator"

export function MobileTicketMockup({ eventName, location, date, startTime }: any) {
  return (
    <div className="mx-auto w-full max-w-[280px]">
      <div className="overflow-hidden rounded-3xl border border-border bg-card shadow-2xl">
        <div className="bg-primary px-5 py-4 text-center">
          <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-primary-foreground/80">Tickit Pass</span>
        </div>
        <div className="flex flex-col items-center gap-3 px-5 py-8">
          <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-secondary border border-border/50">
            <QrCode className="h-24 w-24 text-foreground opacity-80" />
          </div>
          <span className="font-mono text-[10px] text-muted-foreground tracking-[0.1em] mt-2">TKT-2026-XXXX</span>
        </div>
        <div className="relative">
          <div className="absolute -left-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background border-r border-border" />
          <div className="absolute -right-4 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-background border-l border-border" />
          <Separator className="border-dashed border-border/60 mx-4" />
        </div>
        <div className="flex flex-col gap-3.5 px-6 py-6 pb-8 bg-secondary/5">
          <h3 className="text-base font-bold text-foreground leading-tight text-balance">{eventName || "My Awesome Event"}</h3>
          <div className="flex items-start gap-2.5 text-xs text-muted-foreground font-medium">
            <MapPin className="h-4 w-4 shrink-0 text-primary/70 mt-0.5" />
            <span className="line-clamp-2 leading-relaxed">{location || "Venue Address"}</span>
          </div>
          <div className="flex items-center gap-2.5 text-xs text-muted-foreground font-medium">
            <CalendarDays className="h-4 w-4 shrink-0 text-primary/70" />
            <span>{date || "Event Date"} {startTime && `• ${startTime}`}</span>
          </div>
        </div>
      </div>
    </div>
  )
}