"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { useLocale } from "@/lib/locale-context"
import { t } from "@/lib/i18n"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"

// Load map without SSR — Leaflet needs window
const MapComponent = dynamic(() => import("./MapComponent"), {
  ssr: false,
  loading: () => (
    <div className="h-full w-full bg-secondary/50 animate-pulse flex items-center justify-center text-muted-foreground text-sm font-medium border-2 border-border rounded-xl">
      Xəritə yüklənir...
    </div>
  ),
})

const NOMINATIM = "https://nominatim.openstreetmap.org"
const BAKU_CENTER: [number, number] = [40.409264, 49.867092]

// Nominatim result shape (only fields we use)
interface NominatimResult {
  display_name: string
  lat: string
  lon: string
}

interface LocationPickerProps {
  address: string
  setAddress: (address: string) => void
}

export function LocationPicker({ address, setAddress }: LocationPickerProps) {
  const { locale } = useLocale()
  const [position, setPosition]       = useState<[number, number]>(BAKU_CENTER)
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleSearch = (query: string) => {
    setAddress(query)
    if (debounceTimer.current) clearTimeout(debounceTimer.current)
    if (query.length < 3) { setSuggestions([]); return }

    setIsSearching(true)
    debounceTimer.current = setTimeout(async () => {
      try {
        const res = await fetch(
          `${NOMINATIM}/search?format=json&q=${encodeURIComponent(query)}&countrycodes=az&limit=5&accept-language=az&email=dev@eticksystem.com`
        )
        if (!res.ok) throw new Error("Search API error")
        setSuggestions(await res.json())
      } catch {
        // Silently ignore — user just won't see suggestions
      } finally {
        setIsSearching(false)
      }
    }, 800)
  }

  const handleSelect = (item: NominatimResult) => {
    setAddress(item.display_name)
    setPosition([parseFloat(item.lat), parseFloat(item.lon)])
    setSuggestions([])
  }

  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng])
    try {
      const res = await fetch(
        `${NOMINATIM}/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=az&email=dev@eticksystem.com`
      )
      if (!res.ok) throw new Error("Reverse geocoding error")
      const data = await res.json()
      if (data?.display_name) setAddress(data.display_name)
    } catch {
      // Silently ignore — marker still moves, just no address text
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full relative">
      {/* Search input */}
      <div className="relative z-50">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t(locale, "addressSearchPlaceholder") || "Məsələn: Nizami küçəsi 50, Bakı"}
          className="pl-10 h-11 text-base shadow-sm bg-secondary/20"
          value={address}
          onChange={(e) => handleSearch(e.target.value)}
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Suggestions dropdown */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border border-border/50 rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto z-50">
            {suggestions.map((item, i) => (
              <div
                key={i}
                className="flex items-start gap-3 p-3 hover:bg-secondary cursor-pointer border-b border-border/50 last:border-0 transition-colors"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-sm font-medium text-foreground leading-snug">
                  {item.display_name}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Map */}
      <div
        className="relative w-full rounded-xl overflow-hidden border-2 border-border/50 shadow-inner z-0"
        style={{ height: "300px", isolation: "isolate" }}
      >
        <MapComponent position={position} onMapClick={handleMapClick} />
      </div>
    </div>
  )
}