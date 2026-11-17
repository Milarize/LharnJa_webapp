export interface LatLng {
  lat: number
  lng: number
}

const BANGKOK: LatLng = { lat: 13.7563, lng: 100.5018 }

export function distanceKm(a: LatLng, b: LatLng) {
  const toRad = (value: number) => (value * Math.PI) / 180
  const dLat = toRad(b.lat - a.lat)
  const dLng = toRad(b.lng - a.lng)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2
  return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)))
}

export function inServiceArea(point: LatLng) {
  return distanceKm(point, BANGKOK) <= 80
}

export function formatKm(km: number) {
  if (km < 1) return `${Math.round(km * 1000)} ม.`
  return `${km.toFixed(1)} กม.`
}
