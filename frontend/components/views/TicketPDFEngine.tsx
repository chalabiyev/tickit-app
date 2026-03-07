"use client"

import React, { useRef, useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { Button } from "@/components/ui/button"
import { Download, Loader2, Ticket as TicketIcon, AlertCircle } from "lucide-react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { TicketDesign } from "@/components/views/create-event/TicketDesignEditor"

// ── Types ──────────────────────────────────────────────────────────────────
interface OrderData {
  eventName: string
  eventDate: string
  location: string
  guestName: string
  ticketType: string
  seatInfo: string
  companyName: string
  companyPhone: string
  qrData: string
}

interface TicketPDFEngineProps {
  design: TicketDesign
  orderData: OrderData
}

const CANVAS_WIDTH  = 360
const CANVAS_HEIGHT = 640

// ── Component ──────────────────────────────────────────────────────────────
export function TicketPDFEngine({ design, orderData }: TicketPDFEngineProps) {
  const { locale }          = useLocale()
  const ticketRef           = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [errorKey,     setErrorKey]     = useState("")

  // Replace all smart-tags with real data
  const fillTags = (content: string): string =>
    content
      .replace(/{{Event_Name}}/g,   orderData.eventName)
      .replace(/{{Event_Date}}/g,   orderData.eventDate)
      .replace(/{{Location}}/g,     orderData.location)
      .replace(/{{Guest_Name}}/g,   orderData.guestName)
      .replace(/{{Ticket_Type}}/g,  orderData.ticketType)
      .replace(/{{Seat_Info}}/g,    orderData.seatInfo)
      .replace(/{{Company_Name}}/g, orderData.companyName)
      .replace(/{{Company_Phone}}/g, orderData.companyPhone)
      .replace(/ATTENDEE_ID/g,          orderData.guestName)
      .replace(/\/\/ SCAN_TO_ENTER \/\//g, t(locale, "scanToEnter") || "Giriş üçün skan edin")

  const handleDownload = async () => {
    if (!ticketRef.current) return
    setIsGenerating(true); setErrorKey("")

    try {
      const canvas = await html2canvas(ticketRef.current, {
        scale:           3,     // High quality
        useCORS:         true,  // Allow organizer images
        backgroundColor: design.bgColor,
        width:           CANVAS_WIDTH,
        height:          CANVAS_HEIGHT,
        logging:         false,
      })

      const imgData = canvas.toDataURL("image/jpeg", 0.95)

      // 90×160 mm → matches 360×640 px at 72 DPI
      const pdf = new jsPDF("p", "mm", [90, 160])
      pdf.addImage(imgData, "JPEG", 0, 0, 90, 160)
      pdf.save(`${orderData.eventName.replace(/\s+/g, "_")}_Bilet.pdf`)
    } catch {
      setErrorKey("errPdfGeneration")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      {/* Error banner */}
      {errorKey && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm font-semibold animate-in fade-in">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{t(locale, errorKey) || t(locale, "errUnknown") || "Xəta baş verdi. Bilet yüklənmədi."}</span>
        </div>
      )}

      <Button
        onClick={handleDownload}
        disabled={isGenerating}
        size="lg"
        className="w-full h-14 font-black text-lg rounded-xl shadow-xl hover:scale-[1.02] transition-transform bg-green-600 hover:bg-green-700"
      >
        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
        {isGenerating
          ? (t(locale, "preparing") || "Hazırlanır...")
          : (t(locale, "downloadTicketPdf") || "Bileti PDF Yüklə")
        }
      </Button>

      {/* Hidden render zone — positioned off-screen for html2canvas */}
      <div className="absolute -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div
          ref={ticketRef}
          className="relative overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: design.bgColor }}
        >
          {/* Mandatory eticksystem header — always rendered */}
          <div className="absolute top-0 left-0 right-0 h-[70px] bg-black text-white flex items-center justify-center z-50 border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-2 opacity-95">
              <TicketIcon className="h-6 w-6 text-[#00f5ff]" />
              <span className="font-black tracking-[0.25em] text-lg mt-0.5 uppercase text-white">eticksystem</span>
            </div>
          </div>

          {/* Background image */}
          {design.bgImage && (
            <>
              <div className="absolute inset-0 z-0 flex items-center justify-center">
                <img
                  src={design.bgImage}
                  crossOrigin="anonymous"
                  className="min-w-full min-h-full object-cover"
                  style={{
                    transform: `scale(${(design.bgScale ?? 100) / 100}) translate(${design.bgOffsetX ?? 0}px, ${design.bgOffsetY ?? 0}px)`,
                  }}
                  alt=""
                />
              </div>
              <div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${design.bgOverlay ?? 0})` }} />
            </>
          )}

          {/* Elements — offset 70px down for the header */}
          <div className="absolute inset-0 z-20 pt-[70px]">
            {design.elements.map((el) => (
              <div
                key={el.id}
                className="absolute flex flex-col"
                style={{
                  left:       el.x,
                  top:        el.y - 70,
                  color:      el.color,
                  fontSize:   el.fontSize,
                  fontWeight: el.fontWeight,
                  fontFamily: el.fontFamily,
                  width:      el.width  || (el.type === "qr" ? el.fontSize : "auto"),
                  height:     el.height || (el.type === "qr" ? el.fontSize : "auto"),
                  textAlign:  el.textAlign || "left",
                }}
              >
                {el.type === "text" && (
                  <span className="leading-tight break-words px-1">{fillTags(el.content)}</span>
                )}

                {el.type === "qr" && (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <QRCodeSVG
                      value={orderData.qrData}
                      size={el.width ? el.width - 24 : el.fontSize - 24}
                      level="H"
                      bgColor="rgba(255,255,255,0)"
                      fgColor={el.color}
                    />
                  </div>
                )}

                {el.type === "image" && el.src && (
                  <img src={el.src} alt="" crossOrigin="anonymous" className="w-full h-full object-contain" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}