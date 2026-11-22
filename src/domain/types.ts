export type Role = 'family' | 'caregiver'

export type ProviderTier = 'basic' | 'standard' | 'premium'

export type ShareBasis = 'consent' | 'law' | 'authority'

export type ServiceType = 'full' | 'dropoff' | 'pickup' | 'fullday'

export type CarePackageId = 'p1' | 'p2' | 'p3'

export type TripStatus =
  | 'requested'
  | 'confirmed'
  | 'en_route_pickup'
  | 'picked_up'
  | 'at_hospital'
  | 'waiting'
  | 'examining'
  | 'with_doctor'
  | 'returning'
  | 'completed'
  | 'cancelled'

export type NeedId =
  | 'cane'
  | 'wheelchair'
  | 'transfer'
  | 'memory'
  | 'meds'
  | 'hearing'
  | 'female'
  | 'male'
  | 'chinese'
  | 'updates'

export interface Elder {
  id: string
  name: string
  relation: string
  age: number
  conditions: string
  mobility: string
  initial: string
  tone: string
}

export interface Hospital {
  id: string
  name: string
  short: string
  area: string
  lat: number
  lng: number
}

export interface Caregiver {
  id: string
  nickname: string
  name: string
  gender: 'female' | 'male'
  age: number
  years: number
  rating: number
  reviews: number
  bio: string
  hospitalIds: string[]
  skills: NeedId[]
  languages: string[]
  distanceKm: number
  zone: string
  priceFactor: number
  badges: string[]
  initial: string
  tone: string
  photo: string
  unavailable?: boolean
}

export interface TripEvent {
  status: TripStatus
  at: string
}

export type HandoffReason = 'timeout' | 'declined'

export interface TripHandoff {
  fromId: string
  toId: string
  at: string
  reason: HandoffReason
}

export type CancelReason = 'family' | 'no_caregiver'

export interface Trip {
  id: string
  owner: 'me' | 'demo'
  familyName: string
  elderId: string
  elderName: string
  elderAge: number
  elderNote: string
  hospitalId: string
  department: string
  date: string
  time: string
  serviceType: ServiceType
  packageId?: CarePackageId
  profession?: string
  language?: string
  needs: NeedId[]
  note: string
  pickup: string
  placeLat?: number
  placeLng?: number
  caregiverId: string
  status: TripStatus
  price: number
  timeline: TripEvent[]
  review?: string
  repeatOf?: string
  respondBy?: string
  handoffs?: TripHandoff[]
  cancelReason?: CancelReason
  visitNote?: VisitNote
}

export interface VisitNote {
  doctorSaid: string
  medicines: string
  nextVisit: string
  caution: string
  sentAt?: string
  sentTo: string[]
  shareBasis?: ShareBasis[]
  tier?: ProviderTier
  doctorConfirm?: boolean
  hisAllowed?: boolean
  followUpDate?: string
  followUpTime?: string
  followUpPlace?: string
}

export interface FamilyMember {
  id: string
  name: string
  relation: string
  maskedId: string
}

export interface Quote {
  serviceFee: number
  travel: number
  total: number
  overtimeCap: number
}
