"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { QrCode, Ticket } from "lucide-react"
import type { TicketDesign } from "./TicketDesignEditor"
import type { BuyerQuestion } from "./BuyerQuestionsStep"

interface TicketTier {
  id: string | number
  name: string
  price: number
  quantity: number
  color: string
}

interface EventSummaryStepProps {
  eventDetails: { title: string; date: string; location: string }
  isPrivate: boolean
  derivedCapacity: number
  ticketRevenue: number
  tiers: TicketTier[]
  ticketDesign: TicketDesign
  buyerQuestions: BuyerQuestion[]
}

// Replace {{Tag}} placeholders with preview values
function applyTags(
  content: string,
  details: EventSummaryStepProps["eventDetails"],
  questions: BuyerQuestion[]
): string {
  let preview = content
    .replace(/{{Event_Name}}/g,  details.title    || "My Awesome Event")
    .replace(/{{Event_Date}}/g,  details.date     || "12.12.2026")
    .replace(/{{Location}}/g,    details.location || "Baku, AZ")
    .replace(/{{Guest_Name}}/g,  "John Doe")
    .replace(/{{Ticket_Type}}/g, "VIP")
    .replace(/{{Seat_Info}}/g,   "Row 1, Seat 12")

  questions.forEach((q) => {
    if (q.label.trim()) {
      preview = preview.replace(new RegExp(`{{${q.label}}}`, "g"), `Sample ${q.label}`)
    }
  })
  return preview
}

export function EventSummaryStep({
  eventDetails,
  isPrivate,
  derivedCapacity,
  ticketRevenue,
  tiers,
  ticketDesign,
  buyerQuestions,
}: EventSummaryStepProps) {
  const { locale } = useLocale()

  const safe     = ticketDesign || { bgColor: "#09090b", elements: [] }
  const bgScale  = safe.bgScale  ?? 100
  const bgOffX   = safe.bgOffsetX ?? 0
  const bgOffY   = safe.bgOffsetY ?? 0

  return (
    <div className="flex flex-col gap-10 lg:flex-row lg:gap-16 animate-in fade-in duration-300">

      {/* Ticket preview */}
      <div className="flex flex-col gap-6 mx-auto lg:mx-0 shrink-0">
        <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground text-center lg:text-left">
          {t(locale, "guestPreview") || "Guest Preview"}
        </h3>

        {/* 360x640 canvas scaled down 80% → 288x512 display */}
        <div
          className="w-[288px] h-[512px] relative rounded-[24px] overflow-hidden shadow-2xl ring-1 ring-border/20 bg-background"
          style={{ isolation: "isolate" }}
        >
          <div
            className="absolute top-0 left-0 w-[360px] h-[640px] origin-top-left"
            style={{ backgroundColor: safe.bgColor, transform: "scale(0.8)" }}
          >
            {/* Background image */}
            {safe.bgImage && (
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <img
                  src={safe.bgImage}
                  className="min-w-full min-h-full object-cover"
                  style={{ transform: `scale(${bgScale / 100}) translate(${bgOffX}px, ${bgOffY}px)` }}
                  alt="bg"
                />
              </div>
            )}
            {safe.bgImage && (
              <div
                className="absolute inset-0 z-0"
                style={{ backgroundColor: `rgba(0,0,0,${safe.bgOverlay || 0})` }}
              />
            )}

            {/* eticksystem header */}
            <div className="absolute top-0 left-0 right-0 h-[70px] bg-zinc-950 text-white flex items-center justify-center z-40 border-b border-white/10 shadow-sm">
              <div className="flex items-center gap-2 opacity-95">
                <Ticket className="h-6 w-6" />
                <span className="font-black tracking-[0.25em] text-lg mt-0.5">eticksystem</span>
              </div>
            </div>

            {/* Elements */}
            {safe.elements?.map((el) => (
              <div
                key={el.id}
                className="absolute flex flex-col z-20"
                style={{
                  left: el.x, top: el.y,
                  color: el.color, fontSize: el.fontSize, fontWeight: el.fontWeight,
                  fontFamily: el.fontFamily,
                  width:  el.width  || (el.type === "qr" ? el.fontSize : "auto"),
                  height: el.height || (el.type === "qr" ? el.fontSize : "auto"),
                  textAlign: el.textAlign || "left",
                }}
              >
                {el.type === "text" && (
                  <span className="leading-tight break-words px-1">
                    {applyTags(el.content, eventDetails, buyerQuestions)}
                  </span>
                )}
                {el.type === "qr" && (
                  <div className="w-full h-full bg-white rounded-2xl flex items-center justify-center p-3 shadow-md border">
                    <QrCode className="w-full h-full text-black" />
                  </div>
                )}
                {el.type === "image" && el.src && (
                  <img src={el.src} alt="logo" className="w-full h-full object-contain drop-shadow-sm" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="flex-1 flex flex-col gap-8">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-2xl font-bold text-foreground">
            {t(locale, "eventSummary") || "Event Summary"}
          </h3>
          <Badge variant={isPrivate ? "secondary" : "default"} className="px-3 py-1 text-xs">
            {isPrivate
              ? (t(locale, "private") || "Private")
              : (t(locale, "public")  || "Public")}
          </Badge>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div className="flex flex-col p-6 rounded-2xl border bg-card shadow-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {t(locale, "totalCapacity") || "Total Capacity"}
            </span>
            <span className="text-4xl font-black text-foreground">{derivedCapacity}</span>
          </div>
          <div className="flex flex-col p-6 rounded-2xl border bg-card shadow-sm">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">
              {t(locale, "expectedRevenue") || "Expected Revenue"}
            </span>
            <span className="text-4xl font-black text-primary">{ticketRevenue} AZN</span>
          </div>
        </div>

        <Card className="border-border/60 shadow-none bg-secondary/10">
          <CardHeader className="pb-4 px-6 pt-6">
            <CardTitle className="text-base font-bold uppercase tracking-wide text-muted-foreground">
              {t(locale, "ticketTiers") || "Ticket Tiers"}
            </CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="flex flex-col gap-4">
              {tiers.map((tier) => (
                <div
                  key={tier.id}
                  className="flex items-center justify-between text-base bg-background p-3.5 rounded-xl border shadow-sm"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="w-3 h-3 rounded-full shadow-inner"
                      style={{ backgroundColor: tier.color }}
                    />
                    <span className="font-bold text-foreground">
                      {tier.name || (t(locale, "unnamed") || "Unnamed")}
                    </span>
                    <Badge variant="secondary" className="font-mono ml-2">
                      {tier.quantity} {t(locale, "seatsCount") || "seats"}
                    </Badge>
                  </div>
                  <span className="font-bold text-muted-foreground">{tier.price} AZN</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}