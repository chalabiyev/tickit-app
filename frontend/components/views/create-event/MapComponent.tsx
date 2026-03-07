"use client"

import { useEffect } from "react"
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet"
import "leaflet/dist/leaflet.css"
import L from "leaflet"

// Fix missing pin icon in Next.js (known Leaflet + webpack issue)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:       "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:     "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
})

// Catch map clicks and bubble up
function ClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng.lat, e.latlng.lng) },
  })
  return null
}

// Smoothly fly to new coords when address search resolves
function MapUpdater({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 15) }, [center, map])
  return null
}

interface MapProps {
  position: [number, number]
  onMapClick: (lat: number, lng: number) => void
}

export default function MapComponent({ position, onMapClick }: MapProps) {
  return (
    <MapContainer
      center={position}
      zoom={13}
      style={{ height: "100%", width: "100%", zIndex: 0 }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={position} />
      <MapUpdater center={position} />
      <ClickHandler onMapClick={onMapClick} />
    </MapContainer>
  )
}