"use client"

import React, { useRef, useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import { Button } from "@/components/ui/button"
import { Download, Loader2, Ticket as TicketIcon } from "lucide-react"
import { TicketDesign } from '@/components/views/create-event/TicketDesignEditor' // Твой путь к типам

interface TicketPDFEngineProps {
  design: TicketDesign
  orderData: {
    eventName: string
    eventDate: string
    location: string
    guestName: string
    ticketType: string
    seatInfo: string
    companyName: string // Реальное имя компании менеджера
    companyPhone: string // Реальный телефон менеджера
    qrData: string
  }
}

// Жесткие размеры билета
const CANVAS_WIDTH = 360
const CANVAS_HEIGHT = 640

export function TicketPDFEngine({ design, orderData }: TicketPDFEngineProps) {
  const ticketRef = useRef<HTMLDivElement>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // Функция замены всех смарт-тегов на РЕАЛЬНЫЕ данные
  const fillTags = (content: string) => {
    return content
      .replace(/{{Event_Name}}/g, orderData.eventName)
      .replace(/{{Event_Date}}/g, orderData.eventDate)
      .replace(/{{Location}}/g, orderData.location)
      .replace(/{{Guest_Name}}/g, orderData.guestName)
      .replace(/{{Ticket_Type}}/g, orderData.ticketType)
      .replace(/{{Seat_Info}}/g, orderData.seatInfo)
      .replace(/{{Company_Name}}/g, orderData.companyName)
      .replace(/{{Company_Phone}}/g, orderData.companyPhone)
      // Исправление меток: ATTENDEE_ID -> Ad Soyad, // SCAN_TO_ENTER // -> Направление
      .replace(/ATTENDEE_ID/g, "Ad Soyad") 
      .replace(/\/\/ SCAN_TO_ENTER \/\//g, "Giriş üçün skan edin") 
  }

  const handleDownload = async () => {
    if (!ticketRef.current) return
    setIsGenerating(true)

    try {
      // Магия html2canvas: фоткаем скрытый идеальный блок с 3-кратным увеличением
      const canvas = await html2canvas(ticketRef.current, {
        scale: 3, // Высочайшее качество
        useCORS: true, // Чтобы грузились картинки организатора
        backgroundColor: design.bgColor,
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        logging: false
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)

      // Создаем PDF: формат p (portrait), mm, размер 90x160 мм (идеально 360x640 px при 72 DPI)
      const pdf = new jsPDF('p', 'mm', [90, 160])
      
      pdf.addImage(imgData, 'JPEG', 0, 0, 90, 160)
      pdf.save(`${orderData.eventName.replace(/\s+/g, '_')}_Bilet.pdf`)
      
    } catch (error) {
      console.error("PDF Generation failed:", error)
      alert("Xəta baş verdi. Bilet yüklənmədi.")
    } finally {
      setIsGenerating(false)
    }
  }

  return (
    <>
      <Button onClick={handleDownload} disabled={isGenerating} size="lg" className="w-full h-14 font-black text-lg rounded-xl shadow-xl hover:scale-[1.02] transition-transform bg-green-600 hover:bg-green-700">
        {isGenerating ? <Loader2 className="w-6 h-6 animate-spin" /> : <Download className="w-6 h-6" />}
        {isGenerating ? "Hazırlanır..." : "Bileti PDF Yüklə"}
      </Button>

      {/* СКРЫТАЯ ЗОНА РЕНДЕРА: Она за пределами экрана */}
      <div className="absolute -left-[9999px] top-0 overflow-hidden" aria-hidden="true">
        <div 
          ref={ticketRef}
          className="relative overflow-hidden"
          style={{ width: CANVAS_WIDTH, height: CANVAS_HEIGHT, backgroundColor: design.bgColor }}
        >
          {/* ОБЯЗАТЕЛЬНОЕ ЛОГО ETICKSYSTEM — Жестко вшито в структуру */}
          <div className="absolute top-0 left-0 right-0 h-[70px] bg-black text-white flex items-center justify-center z-50 border-b border-white/10 shadow-sm">
            <div className="flex items-center gap-2 opacity-95">
              <TicketIcon className="h-6 w-6 text-[#00f5ff]" />
              <span className="font-black tracking-[0.25em] text-lg mt-0.5 uppercase text-white">eticksystem</span>
            </div>
          </div>

          {/* Фон (если есть картинка) */}
          {design.bgImage && (
            <div className="absolute inset-0 z-0 flex items-center justify-center">
              <img 
                src={design.bgImage} 
                crossOrigin="anonymous" // Важно для CORS
                className="min-w-full min-h-full object-cover"
                style={{ transform: `scale(${design.bgScale! / 100}) translate(${design.bgOffsetX}px, ${design.bgOffsetY}px)` }}
                alt="bg"
              />
            </div>
          )}
          {design.bgImage && (<div className="absolute inset-0 z-0" style={{ backgroundColor: `rgba(0,0,0,${design.bgOverlay})` }} />)}

          {/* Элементы билета (смещены вниз на 70px из-за нашего лого) */}
          <div className="absolute inset-0 z-20 pt-[70px]">
            {design.elements.map(el => (
              <div 
                key={el.id} 
                className="absolute flex flex-col"
                style={{ 
                  left: el.x, top: el.y - 70, color: el.color, fontSize: el.fontSize, 
                  fontWeight: el.fontWeight, fontFamily: el.fontFamily, 
                  width: el.width || (el.type === 'qr' ? el.fontSize : 'auto'), 
                  height: el.height || (el.type === 'qr' ? el.fontSize : 'auto'),
                  textAlign: el.textAlign || 'left' 
                }}
              >
                {el.type === 'text' && (<span className="leading-tight break-words px-1">{fillTags(el.content)}</span>)}
                
                {/* QR КОД: CSS магия делает его прозрачным без белого фона */}
                {el.type === 'qr' && (
                  <div className="w-full h-full flex items-center justify-center p-3">
                    <QRCodeSVG 
                      value={orderData.qrData} 
                      size={el.width ? el.width - 24 : el.fontSize - 24} 
                      level="H"
                      bgColor="rgba(255,255,255,0)" // Прозрачный фон QR
                      fgColor={el.color} // Цвет пикселей QR как у элемента в админке
                    />
                  </div>
                )}
                
                {el.type === 'image' && el.src && (<img src={el.src} alt="logo" crossOrigin="anonymous" className="w-full h-full object-contain" />)}
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}