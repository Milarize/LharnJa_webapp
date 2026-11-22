import type { Hospital } from '@/domain/types'

interface NostraHit {
  NostraId?: string
  Name_L?: string
  Name_E?: string
  AdminLevel2_L?: string
  AdminLevel3_L?: string
  Catcode?: string
  LatLon?: string
}

const CARE_START = /^(โรงพยาบาล|คลินิก|ศูนย์ทันต|ศูนย์กายภาพ|ศูนย์การแพทย์|ศูนย์บริการสาธารณสุข|ทันตกรรม)/

function shortName(name: string) {
  const cut = name.replace(/^โรงพยาบาล/, '').replace(/^คลินิก/, '').trim()
  const label = cut || name
  return label.length > 18 ? `${label.slice(0, 18)}…` : label
}

function toPlace(item: NostraHit): Hospital | null {
  const name = item.Name_L?.trim() || item.Name_E?.trim() || ''
  const [latText, lngText] = (item.LatLon ?? '').split(',')
  const lat = Number(latText)
  const lng = Number(lngText)
  if (!name || !Number.isFinite(lat) || !Number.isFinite(lng)) return null
  if (item.Catcode !== 'HOSPITAL' && !CARE_START.test(name)) return null
  return {
    id: item.NostraId || `${lat.toFixed(5)},${lng.toFixed(5)}`,
    name,
    short: shortName(name),
    area: [item.AdminLevel3_L, item.AdminLevel2_L].filter(Boolean).join(' '),
    lat,
    lng,
  }
}

export async function searchPlaces(input: {
  lat: number
  lng: number
  keyword?: string
  nearby?: boolean
}) {
  const key = import.meta.env.VITE_NOSTRA_API_KEY?.trim()
  if (!key) return []
  const url = new URL('https://api.nostramap.com/Service/V2/Location/Search')
  url.searchParams.set('key', key)
  url.searchParams.set('keyword', input.nearby ? '' : input.keyword?.trim() || '')
  url.searchParams.set('lat', String(input.lat))
  url.searchParams.set('lon', String(input.lng))
  url.searchParams.set('country', 'TH')
  url.searchParams.set('rowsPerPage', '8')
  url.searchParams.set('pageNumber', '1')
  if (input.nearby) {
    url.searchParams.set('catCode', 'HOSPITAL')
    url.searchParams.set('radius', '8')
  }
  const response = await fetch(url)
  if (!response.ok && response.status !== 404) throw new Error('ค้นหาสถานที่ไม่สำเร็จ')
  const data = await response.json() as { results?: NostraHit[] }
  const seen = new Set<string>()
  const places: Hospital[] = []
  for (const item of data.results ?? []) {
    const place = toPlace(item)
    if (!place || seen.has(place.id)) continue
    seen.add(place.id)
    places.push(place)
  }
  return places
}
