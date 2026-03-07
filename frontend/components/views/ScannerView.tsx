"use client"

import { useRef, useState } from "react"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Scanner } from "@yudiel/react-qr-scanner"
import { CheckCircle2, XCircle, ScanLine, Loader2, Wifi, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"

const API_BASE  = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
const TOKEN_KEY = "eticksystem_token"

type ScanStatus = "idle" | "loading" | "success" | "error"

interface ScanState {
  status: ScanStatus
  messageKey: string   // i18n key or raw message from server
  rawMessage?: string  // server message (non-translatable, shown as-is for success/known errors)
}

const RESET_DELAY = 3000

// ── Error helper ──────────────────────────────────────────────────────────
function getErrKey(err: unknown, res?: Response): string {
  if (typeof navigator !== "undefined" && !navigator.onLine) return "errNoInternet"
  const status = res?.status ?? (err as { status?: number })?.status
  if (status === 401) return "errUnauthorized"
  if (status === 403) return "errForbidden"
  if (status !== undefined && status >= 500) return "errServer"
  return "scannerSystemError"
}

export function ScannerView() {
  const { locale }       = useLocale()
  const [scan, setScan]  = useState<ScanState>({ status: "idle", messageKey: "" })
  const isProcessing     = useRef(false)

  // STATUS OVERLAY CONFIG — built inside component to access locale
  const STATUS_CFG: Record<Exclude<ScanStatus, "idle">, { bg: string; icon: React.ReactNode }> = {
    loading: {
      bg:   "bg-black/80",
      icon: <Loader2 className="w-20 h-20 animate-spin text-primary" />,
    },
    success: {
      bg:   "bg-emerald-500/90",
      icon: <CheckCircle2 className="w-20 h-20 text-white" />,
    },
    error: {
      bg:   "bg-destructive/90",
      icon: <XCircle className="w-20 h-20 text-white" />,
    },
  }

  const handleScan = async (text: string) => {
    if (!text || isProcessing.current) return
    isProcessing.current = true
    setScan({ status: "loading", messageKey: "scannerChecking" })

    try {
      const token = localStorage.getItem(TOKEN_KEY) ?? ""
      if (!token) {
        setScan({ status: "error", messageKey: "errUnauthorized" })
        setTimeout(() => { setScan({ status: "idle", messageKey: "" }); isProcessing.current = false }, RESET_DELAY)
        return
      }

      const res  = await fetch(`${API_BASE}/api/v1/orders/scan/${text}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        setScan({ status: "error", messageKey: getErrKey(null, res) })
      } else {
        const data = await res.json()
        // Server returns its own message for success/ticket errors — show as-is
        setScan({
          status:     data.success ? "success" : "error",
          messageKey: data.success ? "" : "scannerSystemError",
          rawMessage: data.message,
        })
      }
    } catch (err) {
      setScan({ status: "error", messageKey: getErrKey(err) })
    }

    setTimeout(() => {
      setScan({ status: "idle", messageKey: "" })
      isProcessing.current = false
    }, RESET_DELAY)
  }

  const cfg = scan.status !== "idle" ? STATUS_CFG[scan.status] : null

  // Resolve message: prefer rawMessage from server, fallback to translated key
  const displayMessage = scan.rawMessage
    ? scan.rawMessage
    : scan.messageKey
      ? (t(locale, scan.messageKey) || scan.messageKey)
      : ""

  return (
    <div className="flex flex-col items-center gap-6 max-w-md mx-auto py-4">

      {/* Title */}
      <div className="text-center">
        <h1 className="text-xl font-black uppercase tracking-widest text-foreground flex items-center justify-center gap-2">
          <ScanLine className="h-5 w-5 text-primary" />
          {t(locale, "scannerTitle")}
        </h1>
        <p className="text-sm text-muted-foreground mt-1 font-medium">{t(locale, "scannerSubtitle")}</p>
      </div>

      {/* Scanner card — isolation: isolate fixes Safari border-radius + overflow */}
      <div
        className="relative w-full rounded-3xl overflow-hidden bg-black border border-border/30 shadow-2xl"
        style={{ isolation: "isolate", aspectRatio: "1 / 1", minHeight: "320px" }}
      >
        {/* Camera feed */}
        <Scanner
          onScan={(result) => handleScan(result[0].rawValue)}
          components={{ finder: false }}
        />

        {/* Viewfinder overlay */}
        <div className="absolute inset-0 pointer-events-none z-10">
          <div className="absolute inset-0 [background:radial-gradient(ellipse_60%_60%_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-56 h-56">
              {[
                "top-0 left-0 border-t-4 border-l-4 rounded-tl-2xl",
                "top-0 right-0 border-t-4 border-r-4 rounded-tr-2xl",
                "bottom-0 left-0 border-b-4 border-l-4 rounded-bl-2xl",
                "bottom-0 right-0 border-b-4 border-r-4 rounded-br-2xl",
              ].map((cls, i) => (
                <div key={i} className={cn("absolute w-8 h-8 border-primary", cls)} />
              ))}
              {scan.status === "idle" && (
                <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/70 shadow-[0_0_8px_2px_rgba(var(--primary)/0.5)] animate-[scanline_2s_ease-in-out_infinite]" />
              )}
            </div>
          </div>
        </div>

        {/* Status overlay */}
        {cfg && (
          <div
            className={cn(
              "absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 text-center p-6 animate-in fade-in zoom-in-95 duration-200",
              cfg.bg
            )}
            style={{ WebkitBackdropFilter: "blur(12px)", backdropFilter: "blur(12px)" }}
          >
            {cfg.icon}
            <h2 className="text-xl font-black uppercase tracking-tight text-white drop-shadow">
              {displayMessage}
            </h2>
            {scan.status !== "loading" && (
              <p className="text-sm font-bold text-white/70 uppercase tracking-widest animate-pulse">
                {t(locale, "scannerWaitNext")}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status indicator */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary/40 border border-border/40">
        {scan.status === "error" ? (
          <AlertCircle className="h-3.5 w-3.5 text-destructive" />
        ) : (
          <Wifi className={cn("h-3.5 w-3.5", scan.status === "loading" ? "text-amber-500 animate-pulse" : "text-emerald-500")} />
        )}
        <span className="text-xs font-semibold text-muted-foreground">
          {scan.status === "loading"
            ? t(locale, "scannerChecking")
            : scan.status === "error"
              ? t(locale, displayMessage) || displayMessage
              : t(locale, "scannerReady")
          }
        </span>
      </div>

      <style>{`
        @keyframes scanline {
          0%, 100% { top: 0%;    opacity: 1; }
          50%       { top: 100%; opacity: 0.6; }
        }
        @-webkit-keyframes scanline {
          0%, 100% { top: 0%;    opacity: 1; }
          50%       { top: 100%; opacity: 0.6; }
        }
      `}</style>
    </div>
  )
}