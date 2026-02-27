"use client"

import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Button } from "@/components/ui/button"
import { CheckCircle2, Copy, MessageCircle, Send, Twitter, Facebook, QrCode, ArrowRight } from "lucide-react"

interface SuccessStepProps {
  generatedLink: string
  eventName: string
  onCopy: () => void
  onDashboardClick: () => void
}

export function SuccessStep({ generatedLink, eventName, onCopy, onDashboardClick }: SuccessStepProps) {
  const { locale } = useLocale()

  // Формируем текст для шаринга
  const rawShareText = t(locale, "shareMessage") || "Check out this event: {eventName}"
  const shareText = rawShareText.replace("{eventName}", eventName || "Awesome Event")
  
  // Кодируем URL и текст для вставки в ссылки
  const encodedUrl = encodeURIComponent(generatedLink)
  const encodedText = encodeURIComponent(shareText)

  const shareLinks = {
    telegram: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
    whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`
  }

  // Супер-фича: Открываем сгенерированный QR-код (используем бесплатный надежный API)
  const handleGetQrCode = () => {
    // margin=20 добавляет красивые белые поля вокруг QR для удобной печати
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodedUrl}&margin=20`;
    window.open(qrUrl, '_blank');
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
      
      {/* Иконка Успеха */}
      <div className="h-24 w-24 rounded-full bg-green-500/10 flex items-center justify-center mb-8 ring-8 ring-green-500/5">
        <CheckCircle2 className="h-12 w-12 text-green-500" />
      </div>
      
      <h2 className="text-3xl sm:text-4xl font-black tracking-tight mb-4 text-foreground">
        {t(locale, "eventPublished") || "Event Published!"}
      </h2>
      <p className="text-base text-muted-foreground max-w-md mb-8 leading-relaxed">
        {t(locale, "eventPublishedDesc") || "Your event is now live. Copy the link below to start selling tickets immediately."}
      </p>

      {/* Поле со ссылкой */}
      <div className="flex items-center gap-3 w-full max-w-md p-2 rounded-2xl bg-secondary border border-border shadow-inner">
        <div className="bg-background px-4 py-3.5 rounded-xl text-sm font-bold font-mono text-foreground flex-1 truncate text-left border shadow-sm select-all">
          {generatedLink}
        </div>
        <Button size="lg" className="shrink-0 gap-2 rounded-xl px-6 font-bold shadow-sm hover:scale-105 transition-transform" onClick={onCopy}>
          <Copy className="h-4 w-4" />
          {t(locale, "copy") || "Copy"}
        </Button>
      </div>

      {/* Разделитель */}
      <div className="w-full max-w-md flex items-center gap-4 my-8 opacity-60">
        <div className="h-px bg-border flex-1" />
        <span className="text-[10px] uppercase font-bold tracking-widest text-muted-foreground">
          {t(locale, "shareOnSocials") || "Share Event"}
        </span>
        <div className="h-px bg-border flex-1" />
      </div>

      {/* Соцсети (Прямые ссылки с авто-текстом) */}
      <div className="flex items-center justify-center gap-4 mb-10">
        <a href={shareLinks.whatsapp} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-secondary border border-border hover:bg-[#25D366]/20 hover:border-[#25D366]/50 hover:text-[#25D366] rounded-2xl transition-all hover:scale-110 shadow-sm" title="WhatsApp">
          <MessageCircle className="h-6 w-6" />
        </a>
        <a href={shareLinks.telegram} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-secondary border border-border hover:bg-[#0088cc]/20 hover:border-[#0088cc]/50 hover:text-[#0088cc] rounded-2xl transition-all hover:scale-110 shadow-sm" title="Telegram">
          <Send className="h-6 w-6 ml-0.5" />
        </a>
        <a href={shareLinks.twitter} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-secondary border border-border hover:bg-black/10 hover:border-black/50 hover:text-black dark:hover:bg-white/10 dark:hover:border-white/50 dark:hover:text-white rounded-2xl transition-all hover:scale-110 shadow-sm" title="X (Twitter)">
          <Twitter className="h-6 w-6" />
        </a>
        <a href={shareLinks.facebook} target="_blank" rel="noopener noreferrer" className="p-3.5 bg-secondary border border-border hover:bg-[#1877F2]/20 hover:border-[#1877F2]/50 hover:text-[#1877F2] rounded-2xl transition-all hover:scale-110 shadow-sm" title="Facebook">
          <Facebook className="h-6 w-6" />
        </a>
      </div>

      {/* Главные кнопки действий (QR и Дашборд) */}
      <div className="flex gap-4 w-full max-w-md">
        <Button variant="outline" size="lg" className="flex-1 gap-2 border-2 font-bold bg-background hover:bg-secondary h-12" onClick={handleGetQrCode}>
          <QrCode className="h-5 w-5" /> 
          {t(locale, "getQrCode") || "Get QR Code"}
        </Button>
        <Button size="lg" variant="default" onClick={onDashboardClick} className="flex-1 font-bold shadow-md h-12 gap-2">
          {t(locale, "dashboard") || "Dashboard"} <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

    </div>
  )
}