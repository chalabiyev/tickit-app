"use client"

import { useState, useRef, useCallback } from "react"
import { GoogleMap, useLoadScript, Marker, Autocomplete } from "@react-google-maps/api"
import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

const libraries: ("places")[] = ["places"]
const defaultCenter = { lat: 40.409264, lng: 49.867092 }

interface LocationPickerProps {
  address: string
  setAddress: (address: string) => void
}

export function LocationPicker({ address, setAddress }: LocationPickerProps) {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY as string,
    libraries,
  })

  const [markerPos, setMarkerPos] = useState(defaultCenter)
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null)

  const onPlaceChanged = () => {
    if (autocompleteRef.current !== null) {
      const place = autocompleteRef.current.getPlace()
      if (place.geometry && place.geometry.location) {
        const lat = place.geometry.location.lat()
        const lng = place.geometry.location.lng()
        setMarkerPos({ lat, lng })
        setAddress(place.formatted_address || place.name || "")
      }
    }
  }

  const onMapClick = useCallback((e: google.maps.MapMouseEvent) => {
    if (!e.latLng) return
    const lat = e.latLng.lat()
    const lng = e.latLng.lng()
    setMarkerPos({ lat, lng })

    const geocoder = new window.google.maps.Geocoder()
    geocoder.geocode({ location: { lat, lng } }, (results, status) => {
      if (status === "OK" && results && results[0]) {
        setAddress(results[0].formatted_address)
      }
    })
  }, [setAddress])

  if (loadError) return <div className="p-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-xl text-sm">Error loading Google Maps.</div>
  if (!isLoaded) return <div className="h-11 flex items-center justify-center text-sm text-muted-foreground animate-pulse">Loading Map...</div>

  return (
    <div className="flex flex-col gap-4 w-full">
      <Autocomplete
        onLoad={(autoC) => (autocompleteRef.current = autoC)}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: "az" } }} 
      >
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input 
            placeholder="Məsələn: Nizami küçəsi 50, Bakı" 
            className="pl-10 h-11 text-base shadow-sm" 
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>
      </Autocomplete>

      <div className="relative w-full h-[300px] rounded-xl overflow-hidden border-2 border-border shadow-inner">
        <GoogleMap
          mapContainerStyle={{ width: "100%", height: "100%" }}
          center={markerPos}
          zoom={14}
          onClick={onMapClick}
          options={{ disableDefaultUI: true, zoomControl: true }}
        >
          <Marker position={markerPos} draggable={true} onDragEnd={onMapClick} />
        </GoogleMap>
      </div>
    </div>
  )
}