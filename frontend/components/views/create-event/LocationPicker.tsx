"use client"

import { useState, useRef } from "react"
import dynamic from "next/dynamic"
import { Input } from "@/components/ui/input"
import { Search, MapPin } from "lucide-react"

// Загружаем карту без SSR
const MapComponent = dynamic(() => import("./MapComponent"), { 
  ssr: false, 
  loading: () => <div className="h-full w-full bg-secondary/50 animate-pulse flex items-center justify-center text-muted-foreground text-sm font-medium border-2 border-border rounded-xl">Xəritə yüklənir...</div> 
})

interface LocationPickerProps {
  address: string
  setAddress: (address: string) => void
}

export function LocationPicker({ address, setAddress }: LocationPickerProps) {
  const [position, setPosition] = useState<[number, number]>([40.409264, 49.867092]) 
  const [suggestions, setSuggestions] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)
  
  // Создаем ссылку на таймер для Дебаунсинга
  const debounceTimer = useRef<NodeJS.Timeout | null>(null)

  // 1. Умный Поиск с задержкой (Debounce)
  const handleSearch = (query: string) => {
    setAddress(query) // Сразу обновляем текст в инпуте, чтобы не было лагов

    // Если таймер уже запущен (юзер все еще печатает) - отменяем его
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current)
    }

    if (query.length < 3) {
      setSuggestions([])
      return
    }
    
    setIsSearching(true)

    // Запускаем новый таймер на 800 миллисекунд
    debounceTimer.current = setTimeout(async () => {
      try {
        // Добавили accept-language=az, чтобы результаты были на азербайджанском
const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&countrycodes=az&limit=5&accept-language=az&email=dev@tickit.az`)        
        if (!res.ok) throw new Error("API limit reached")
        
        const data = await res.json()
        setSuggestions(data)
      } catch (e) {
        console.error("Search failed. Probably rate limited.", e)
      } finally {
        setIsSearching(false)
      }
    }, 800) // Ждем 0.8 секунд после последнего нажатия клавиши
  }

  // 2. Юзер выбрал адрес из выпадающего списка
  const handleSelect = (item: any) => {
    setAddress(item.display_name)
    setPosition([parseFloat(item.lat), parseFloat(item.lon)])
    setSuggestions([])
  }

  // 3. Юзер кликнул на карту -> Превращаем координаты в текст
  const handleMapClick = async (lat: number, lng: number) => {
    setPosition([lat, lng])
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=az&email=dev@tickit.az`)
      if (!res.ok) throw new Error("API limit reached")
      const data = await res.json()
      if (data && data.display_name) {
        setAddress(data.display_name)
      }
    } catch (e) {
      console.error("Reverse geocoding failed", e)
    }
  }

  return (
    <div className="flex flex-col gap-4 w-full relative">
      <div className="relative z-50">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input 
          placeholder="Məsələn: Nizami küçəsi 50, Bakı" 
          className="pl-10 h-11 text-base shadow-sm" 
          value={address}
          onChange={(e) => handleSearch(e.target.value)}
        />
        
        {/* Индикатор загрузки (крутится, пока ждем ответа от сервера) */}
        {isSearching && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
             <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Выпадающий список с результатами поиска */}
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background border rounded-xl shadow-xl overflow-hidden max-h-60 overflow-y-auto">
            {suggestions.map((item, i) => (
              <div 
                key={i} 
                className="flex items-start gap-3 p-3 hover:bg-secondary cursor-pointer border-b last:border-0 transition-colors"
                onClick={() => handleSelect(item)}
              >
                <MapPin className="h-4 w-4 shrink-0 mt-0.5 text-primary" />
                <span className="text-sm font-medium text-foreground leading-snug">{item.display_name}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Контейнер для карты */}
      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border-2 border-border shadow-inner z-0">
        <MapComponent position={position} onMapClick={handleMapClick} />
      </div>
    </div>
  )
}