"use client"

import { useState, useRef } from "react"
import { Scanner } from '@yudiel/react-qr-scanner'
import { CheckCircle2, XCircle, ScanLine, Loader2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

export function ScannerView() {
  const [scanResult, setScanResult] = useState<{ status: 'idle' | 'loading' | 'success' | 'error', message: string }>({ status: 'idle', message: '' })
  
  // Чтобы не спамить бэкенд, пока обрабатывается запрос
  const isProcessing = useRef(false);

  const handleScan = async (text: string) => {
    if (!text || isProcessing.current) return;
    
    isProcessing.current = true;
    setScanResult({ status: 'loading', message: 'Yoxlanılır...' });

    try {
      const token = localStorage.getItem("tickit_token") || "";
      const res = await fetch(`http://72.60.135.9:8080/api/v1/orders/scan/${text}`, {
        method: 'POST',
        headers: { "Authorization": `Bearer ${token}` }
      });

      const data = await res.json();

      if (data.success) {
        // ЗЕЛЕНЫЙ ЭКРАН - ПРОПУСКАТЬ
        setScanResult({ status: 'success', message: data.message });
      } else {
        // КРАСНЫЙ ЭКРАН - ФЕЙК ИЛИ УЖЕ ПРОШЕЛ
        setScanResult({ status: 'error', message: data.message });
      }

    } catch (err) {
      setScanResult({ status: 'error', message: "Sistem xətası baş verdi" });
    }

    // Через 3 секунды сканер снова готов к работе
    setTimeout(() => {
      setScanResult({ status: 'idle', message: '' });
      isProcessing.current = false;
    }, 3000);
  }

  return (
    <div className="flex flex-col h-[80vh] w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center mb-6">
        <h1 className="text-2xl font-black uppercase tracking-widest text-foreground flex items-center gap-2">
          <ScanLine className="w-6 h-6 text-primary" />
          Bilet Skaneri
        </h1>
        <p className="text-muted-foreground text-sm font-medium mt-1">Kameranı QR koda yaxınlaşdırın</p>
      </div>

      <Card className="flex-1 overflow-hidden relative bg-black border-border/50 shadow-2xl rounded-3xl">
        <CardContent className="p-0 h-full w-full relative">
          
          {/* КАМЕРА */}
          <Scanner 
            onScan={(result) => handleScan(result[0].rawValue)} 
            components={{
              finder: false, 
            }}
          />

          {/* Рамка прицела */}
          <div className="absolute inset-0 pointer-events-none border-[40px] border-black/50 z-10 flex items-center justify-center">
            <div className="w-64 h-64 border-2 border-dashed border-white/50 rounded-3xl relative">
              <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-primary rounded-tl-3xl -mt-0.5 -ml-0.5"></div>
              <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-primary rounded-tr-3xl -mt-0.5 -mr-0.5"></div>
              <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-primary rounded-bl-3xl -mb-0.5 -ml-0.5"></div>
              <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-primary rounded-br-3xl -mb-0.5 -mr-0.5"></div>
            </div>
          </div>

          {/* ОВЕРЛЕИ РЕЗУЛЬТАТОВ (Появляются поверх камеры) */}
          {scanResult.status !== 'idle' && (
            <div className={`absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-200 backdrop-blur-md
              ${scanResult.status === 'success' ? 'bg-green-500/90 text-white' : 
                scanResult.status === 'error' ? 'bg-destructive/90 text-white' : 
                'bg-black/80 text-white'}`
            }>
              {scanResult.status === 'loading' && <Loader2 className="w-20 h-20 animate-spin text-primary mb-4" />}
              {scanResult.status === 'success' && <CheckCircle2 className="w-24 h-24 mb-4" />}
              {scanResult.status === 'error' && <XCircle className="w-24 h-24 mb-4" />}
              
              <h2 className="text-2xl font-black uppercase tracking-tight shadow-black drop-shadow-md">
                {scanResult.message}
              </h2>
              
              {scanResult.status !== 'loading' && (
                <p className="mt-4 text-sm font-bold opacity-80 uppercase tracking-widest animate-pulse">
                  Növbəti bilet üçün gözləyin...
                </p>
              )}
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  )
}