import type { CarePackageId, NeedId, ProviderTier, Quote, ServiceType, ShareBasis, Trip, TripStatus, VisitNote, FamilyMember } from '@/domain/types'

export const FAMILY = {
  displayName: 'คุณนภา วงศ์สุข',
  lineName: 'คุณนภา',
  pickup: '128/4 ซอยลาดพร้าว 41 แขวงจรเข้บัว เขตลาดพร้าว กรุงเทพฯ',
  lat: 13.7928,
  lng: 100.5852,
  memberId: 'rel-napa',
}

export const FAMILY_MEMBERS: FamilyMember[] = [
  { id: 'rel-napa', name: 'คุณนภา วงศ์สุข', relation: 'ลูกสาว', maskedId: 'x-xxxx-xxxxx-12-3' },
  { id: 'rel-pawit', name: 'คุณภาวิช วงศ์สุข', relation: 'ลูกชาย', maskedId: 'x-xxxx-xxxxx-45-6' },
]

export const SELF_CAREGIVER_ID = 'cg-ann'

export const PROVIDER_THAID: FamilyMember = {
  id: SELF_CAREGIVER_ID,
  name: 'แอนธิรา สุขใจ',
  relation: 'ผู้ให้บริการ',
  maskedId: 'x-xxxx-xxxxx-78-9',
}

export const DEPARTMENTS = [
  'อายุรกรรม',
  'โรคหัวใจ',
  'จักษุ',
  'กระดูกและข้อ',
  'ระบบประสาท',
  'หู คอ จมูก',
  'กายภาพบำบัด',
  'ตรวจสุขภาพ',
]

export const TIME_SLOTS = ['07:30', '08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00']

export const BOOKABLE_SERVICES: ServiceType[] = ['full', 'fullday']

export const CARE_PACKAGES: {
  id: CarePackageId
  name: string
  price: number
  lead: string
  points: string[]
  recurring: boolean
  notes: boolean
  profession: boolean
  language: boolean
}[] = [
  {
    id: 'p1',
    name: 'Basic',
    price: 1090,
    lead: 'ไปด้วยกัน',
    points: ['มีเพื่อนดูแลไปด้วยตลอดนัด', 'ไม่ช่วยฟังหมอและไม่ส่งสรุปให้ลูกหลาน', 'นัดล่วงหน้า 3 วัน'],
    recurring: false,
    notes: false,
    profession: false,
    language: false,
  },
  {
    id: 'p2',
    name: 'Plus',
    price: 1490,
    lead: 'ไปฟังหมอแทน',
    points: [
      'มีประกันอุบัติเหตุรายวันระหว่างไปพบแพทย์',
      'ดูแลใกล้ชิดตลอดนัด 8 ชั่วโมง',
      'ช่วยฟังหมอ แล้วสรุปส่งให้ลูกหลาน',
      'จองคนเดิมซ้ำได้',
      'นัดล่วงหน้าได้ 2 ชั่วโมง',
    ],
    recurring: true,
    notes: true,
    profession: false,
    language: false,
  },
  {
    id: 'p3',
    name: 'Care',
    price: 2790,
    lead: 'ดูแลจากผู้เชี่ยวชาญ',
    points: [
      'มีประกันอุบัติเหตุรายวันระหว่างไปพบแพทย์',
      'ดูแลใกล้ชิดตลอดนัด 8 ชั่วโมง',
      'ช่วยฟังหมอ แล้วสรุปส่งให้ลูกหลาน',
      'จองคนเดิมซ้ำได้',
      'เลือกวิชาชีพของผู้ดูแลได้',
      'เลือกภาษาที่ใช้คุยได้',
      'นัดล่วงหน้าได้ 2 ชั่วโมง',
    ],
    recurring: true,
    notes: true,
    profession: true,
    language: true,
  },
]

export const PACKAGE_PROFESSIONS = ['ไม่ระบุ', 'พยาบาล', 'นักกายภาพบำบัด', 'ผู้ช่วยพยาบาล']
export const PACKAGE_LANGUAGES = ['ไทย', 'อังกฤษ', 'จีน', 'ญี่ปุ่น']

export function carePackage(id: CarePackageId) {
  return CARE_PACKAGES.find(item => item.id === id) ?? CARE_PACKAGES[0]
}

export function packageHasNotes(id?: CarePackageId) {
  if (!id) return true
  return carePackage(id).notes
}

function formatIso(date: Date) {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function packageMinDate(id: CarePackageId, now = new Date()) {
  if (id === 'p1') {
    const date = new Date(now)
    date.setDate(date.getDate() + 2)
    return formatIso(date)
  }
  return formatIso(new Date(now.getTime() + 2 * 60 * 60 * 1000))
}

export function packageMinTime(id: CarePackageId, dateIso: string, now = new Date()) {
  if (id === 'p1') return ''
  const limit = new Date(now.getTime() + 2 * 60 * 60 * 1000)
  if (dateIso !== formatIso(limit)) return ''
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(limit.getHours())}:${pad(limit.getMinutes())}`
}

export function packageMaxDate(id: CarePackageId, now = new Date()) {
  if (id === 'p1') {
    const date = new Date(now)
    date.setDate(date.getDate() + 4)
    return formatIso(date)
  }
  const date = new Date(now)
  date.setMonth(date.getMonth() + 2)
  return formatIso(date)
}
export const OVERTIME_CAP = 150

export const SERVICES: Record<
  ServiceType,
  { label: string; short: string; detail: string; base: number; hours: string; icon: string; overtimeCap?: number }
> = {
  full: {
    label: 'อยู่ดูแลที่โรงพยาบาลตลอดนัด',
    short: 'พาไปหาหมอ',
    detail: 'อยู่ดูแลที่โรงพยาบาลตลอดนัดนี้ พบแพทย์ด้วยกัน',
    base: 1000,
    hours: 'ประมาณ 5–6 ชั่วโมง',
    icon: 'mdi-hospital-building',
    overtimeCap: OVERTIME_CAP,
  },
  dropoff: {
    label: 'พาไปส่งโรงพยาบาล',
    short: 'ไปส่ง',
    detail: 'รับจากบ้าน ส่งถึงแผนก และส่งมอบให้เจ้าหน้าที่',
    base: 420,
    hours: 'ประมาณ 1.5 ชั่วโมง',
    icon: 'mdi-walk',
  },
  pickup: {
    label: 'ไปรับกลับบ้าน',
    short: 'ไปรับกลับ',
    detail: 'ไปรอที่โรงพยาบาล แล้วพากลับถึงบ้าน',
    base: 420,
    hours: 'ประมาณ 1.5 ชั่วโมง',
    icon: 'mdi-home-import-outline',
  },
  fullday: {
    label: 'อยู่ดูแลที่โรงพยาบาลทั้งวัน',
    short: 'อยู่เป็นเพื่อน',
    detail: 'อยู่ดูแลที่โรงพยาบาลทั้งวัน เมื่อมีหลายแผนกหรือรอนาน',
    base: 1500,
    hours: 'ทั้งวันที่โรงพยาบาล',
    icon: 'mdi-clock-outline',
  },
}

export const NEED_OPTIONS: { id: NeedId; label: string; icon: string; group: 'care' | 'prefer' }[] = [
  { id: 'cane', label: 'ใช้ไม้เท้า เดินช้า', icon: 'mdi-walk', group: 'care' },
  { id: 'wheelchair', label: 'ใช้รถเข็น', icon: 'mdi-wheelchair', group: 'care' },
  { id: 'transfer', label: 'ต้องพยุงหรือยกตัว', icon: 'mdi-hand-heart', group: 'care' },
  { id: 'memory', label: 'หลงลืม ต้องมีคนอยู่ใกล้', icon: 'mdi-brain', group: 'care' },
  { id: 'meds', label: 'ดูแลยาและอาหารตามเวลา', icon: 'mdi-pill', group: 'care' },
  { id: 'hearing', label: 'ได้ยินไม่ชัด', icon: 'mdi-ear-hearing', group: 'care' },
  { id: 'female', label: 'ขอผู้ดูแลเพศหญิง', icon: 'mdi-human-female', group: 'prefer' },
  { id: 'male', label: 'ขอผู้ดูแลเพศชาย', icon: 'mdi-human-male', group: 'prefer' },
]

const RETIRED_NEED_LABEL: Partial<Record<NeedId, string>> = {
  chinese: 'ต้องการคนพูดภาษาจีน',
  updates: 'รายงานครอบครัวระหว่างรอ',
}

const SHORT_NEED: Record<NeedId, string> = {
  cane: 'การเดินช้า',
  wheelchair: 'รถเข็น',
  transfer: 'การพยุงตัว',
  memory: 'อาการหลงลืม',
  meds: 'ยาตามเวลา',
  hearing: 'การได้ยิน',
  female: 'เพศหญิง',
  male: 'เพศชาย',
  chinese: 'ภาษาจีน',
  updates: 'รายงานระหว่างรอ',
}

export function needLabel(id: NeedId) {
  return NEED_OPTIONS.find(item => item.id === id)?.label ?? RETIRED_NEED_LABEL[id] ?? id
}

export function shortNeed(id: NeedId) {
  return SHORT_NEED[id]
}

export function quote(service: ServiceType, priceFactor: number): Quote {
  const serviceFee = Math.round(SERVICES[service].base * priceFactor)
  return {
    serviceFee,
    travel: 0,
    total: serviceFee,
    overtimeCap: SERVICES[service].overtimeCap ?? 0,
  }
}

export function baht(amount: number) {
  return new Intl.NumberFormat('th-TH', {
    style: 'currency',
    currency: 'THB',
    maximumFractionDigits: 0,
  }).format(amount)
}

export function isoOffset(days: number) {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return formatIso(date)
}

export const RESPOND_MS = 20_000
export const SEED_RESPOND_MS = 15 * 60_000

export const HEALTH_SHARE_CAUTION =
  'ลูกหลานไม่ได้มีสิทธิรับข้อมูลสุขภาพของผู้ป่วยโดยอัตโนมัติเพียงเพราะเป็นญาติ ต้องพิจารณาความยินยอม ฐานกฎหมาย และอำนาจในการดำเนินการแทนผู้ป่วยตามกรณี'

export const SHARE_BASIS: { id: ShareBasis; label: string }[] = [
  { id: 'consent', label: 'ผู้ป่วยยินยอมให้แจ้งคนนี้' },
  { id: 'law', label: 'มีฐานกฎหมายรองรับ' },
  { id: 'authority', label: 'มีอำนาจดำเนินการแทนตามกรณี' },
]

export const PROVIDER_TIERS: {
  id: ProviderTier
  name: string
  format: string
  author: string
  record: string
  review: string
  notify: string
  follow: string
}[] = [
  {
    id: 'basic',
    name: 'Basic',
    format: 'Self-service / Staff-assisted',
    author: 'เจ้าหน้าที่',
    record: 'พิมพ์เอง',
    review: 'เจ้าหน้าที่ตรวจ',
    notify: 'ส่งข้อความ',
    follow: 'ไม่มีหรือจำกัด',
  },
  {
    id: 'standard',
    name: 'Standard',
    format: 'AI-assisted',
    author: 'เจ้าหน้าที่ + AI',
    record: 'กรอก Template แล้ว AI เรียบเรียง',
    review: 'เจ้าหน้าที่ตรวจ',
    notify: 'ส่งข้อความที่เรียบเรียงแล้ว',
    follow: 'ติดตามสถานะข้อความ',
  },
  {
    id: 'premium',
    name: 'Premium',
    format: 'Human-assisted',
    author: 'Care Coordinator',
    record: 'เจ้าหน้าที่รับฟัง ประสาน และจัดทำโน้ต',
    review: 'ประสานแพทย์เพื่อยืนยันข้อมูลตามความจำเป็น',
    notify: 'แจ้งความคืบหน้าและประสานการสื่อสาร',
    follow: 'ติดตามและประสานงานต่อเนื่อง',
  },
]

export const TIER_ROWS: { key: 'format' | 'author' | 'record' | 'review' | 'notify' | 'follow'; label: string }[] = [
  { key: 'format', label: 'รูปแบบบริการ' },
  { key: 'author', label: 'ผู้สร้างโน้ต' },
  { key: 'record', label: 'การบันทึก' },
  { key: 'review', label: 'การตรวจสอบ' },
  { key: 'notify', label: 'การแจ้งลูกหลาน' },
  { key: 'follow', label: 'การติดตาม' },
]

export function needsFollowUp(next?: string) {
  return Boolean(next?.includes('ติดตาม'))
}

export function noteGaps(note?: VisitNote) {
  const gaps: string[] = []
  if (!note?.doctorSaid.trim()) gaps.push('อาการ')
  if (!note?.medicines.trim()) gaps.push('การรักษา')
  if (!note?.nextVisit.trim()) gaps.push('ขั้นตอนถัดไป')
  if (needsFollowUp(note?.nextVisit)) {
    if (!note?.followUpDate?.trim()) gaps.push('วันนัดครั้งต่อไป')
    if (!note?.followUpTime?.trim()) gaps.push('เวลานัดครั้งต่อไป')
  }
  return gaps
}

export const CARE_CLOSING =
  'หากครอบครัวมีข้อสงสัยเกี่ยวกับแผนการรักษา สามารถติดต่อทีมดูแลเพื่อประสานแพทย์ได้ค่ะ'

export function careUpdate(trip: Trip) {
  const note = trip.visitNote
  return {
    greeting: `สวัสดีค่ะ ครอบครัว${trip.familyName}`,
    elderLabel: trip.elderName,
    symptom: note?.doctorSaid.trim() || '',
    treatment: note?.medicines.trim() || '',
    next: note?.nextVisit.trim() || '',
    closing: note?.caution.trim() || CARE_CLOSING,
    visit: `${trip.department} · ${trip.date} · ${trip.time} น.`,
    followUp:
      needsFollowUp(note?.nextVisit) && note?.followUpDate
        ? `${note.followUpDate} เวลา ${note.followUpTime ?? ''} น. ที่ ${note.followUpPlace || trip.department}`.replace(/\s+/g, ' ').trim()
        : '',
  }
}

export function noteMessage(trip: Trip) {
  const note = trip.visitNote
  if (!note) return ''
  const card = careUpdate(trip)
  return [
    card.greeting,
    `วันนี้ทีมดูแลขอแจ้งความคืบหน้าเกี่ยวกับอาการของ${card.elderLabel}ค่ะ`,
    `อาการ: ${card.symptom}`,
    `การรักษา: ${card.treatment}`,
    `ขั้นตอนถัดไป: ${card.next}`,
    card.followUp ? `นัดครั้งต่อไป: ${card.followUp}` : '',
    card.closing,
  ].filter(Boolean).join('\n')
}

export function arrangeNote(trip: Trip) {
  const note = trip.visitNote
  if (!note) return ''
  return [
    `ข้อความที่เรียบเรียงจากเทมเพลต สำหรับครอบครัวของ${trip.elderName}`,
    `นัดแผนก${trip.department} วันที่ ${trip.date} เวลา ${trip.time} น.`,
    `แพทย์แจ้งว่า ${note.doctorSaid.trim()}`,
    `เรื่องยา ${note.medicines.trim()}`,
    `นัดถัดไป ${note.nextVisit.trim()}`,
    `ที่บ้านควรระวัง ${note.caution.trim()}`,
  ].join('\n')
}

export function remainText(deadline: string | undefined, now: number) {
  if (!deadline) return ''
  const seconds = Math.max(0, Math.ceil((Date.parse(deadline) - now) / 1000))
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  if (minutes <= 0) return `${rest} วินาที`
  return `${minutes} นาที ${rest} วินาที`
}

export function hoursAgo(hours: number) {
  return new Date(Date.now() - hours * 3_600_000).toISOString()
}

export function greeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'อรุณสวัสดิ์ค่ะ'
  if (hour < 17) return 'สวัสดีค่ะ'
  return 'สวัสดียามเย็นค่ะ'
}

export function appointmentDate(value: string | Date) {
  const date = typeof value === 'string'
    ? (() => {
        const [year, month, day] = value.split('-').map(Number)
        return new Date(year, (month || 1) - 1, day || 1)
      })()
    : value
  return new Intl.DateTimeFormat('th-TH', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  }).format(date)
}

export function thaiDate(isoDate: string) {
  const [year, month, day] = isoDate.split('-').map(Number)
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(year, (month ?? 1) - 1, day))
}

export function dayLabel(isoDate: string) {
  if (isoDate === isoOffset(0)) return 'วันนี้'
  if (isoDate === isoOffset(1)) return 'พรุ่งนี้'
  return new Intl.DateTimeFormat('th-TH', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  }).format(new Date(`${isoDate}T12:00:00`))
}

export function thaiTime(iso: string) {
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function tripStamp(trip: Pick<Trip, 'date' | 'time'>) {
  return `${trip.date}T${trip.time}`
}

export function packageAllowsRebook(id?: CarePackageId) {
  return Boolean(id && carePackage(id).recurring)
}

export function canRebookTrip(trip: Pick<Trip, 'status' | 'packageId'>) {
  return trip.status === 'completed' && packageAllowsRebook(trip.packageId)
}

function groupCompanions(trips: Trip[], onlyRebookable: boolean) {
  const done = trips.filter(trip => {
    if (trip.owner !== 'me' || trip.status !== 'completed') return false
    return onlyRebookable ? packageAllowsRebook(trip.packageId) : true
  })
  const grouped = new Map<string, Trip[]>()
  for (const trip of done) {
    const list = grouped.get(trip.caregiverId) ?? []
    list.push(trip)
    grouped.set(trip.caregiverId, list)
  }
  return [...grouped.entries()]
    .map(([caregiverId, list]) => {
      const sorted = [...list].sort((a, b) => tripStamp(b).localeCompare(tripStamp(a)))
      const rebookable = [...list].filter(item => packageAllowsRebook(item.packageId)).sort((a, b) => tripStamp(b).localeCompare(tripStamp(a)))
      return {
        caregiverId,
        count: list.length,
        latest: sorted[0] as Trip,
        rebookFrom: (rebookable[0] as Trip | undefined) ?? null,
      }
    })
    .sort((a, b) => b.count - a.count)
}

/** คนเดิมที่จองซ้ำได้ จากนัด Plus/Care ที่จบแล้วเท่านั้น */
export function repeatCompanions(trips: Trip[]) {
  return groupCompanions(trips, true)
}

/** คนที่เคยไปด้วยทั้งหมด รวม Basic ใช้ในหน้าประวัติ */
export function historyCompanions(trips: Trip[]) {
  return groupCompanions(trips, false)
}

export function isOpenStatus(status: TripStatus) {
  return status !== 'completed' && status !== 'cancelled'
}

export function viewStatus(status: TripStatus, service: ServiceType): TripStatus {
  if (
    (service === 'full' || service === 'fullday') &&
    (status === 'en_route_pickup' || status === 'picked_up' || status === 'returning')
  ) {
    return 'at_hospital'
  }
  return status
}

export function statusFlow(service: ServiceType, packageId?: CarePackageId): TripStatus[] {
  void service
  const steps: TripStatus[] = ['requested', 'confirmed', 'at_hospital', 'waiting', 'examining']
  if (packageHasNotes(packageId)) steps.push('with_doctor')
  steps.push('completed')
  return steps
}

export function statusLabel(status: TripStatus, service: ServiceType) {
  switch (viewStatus(status, service)) {
    case 'requested':
      return 'รอผู้ดูแลรับงาน'
    case 'confirmed':
      return 'ผู้ดูแลรับงานแล้ว'
    case 'cancelled':
      return 'ยกเลิกแล้ว'
    case 'at_hospital':
      return 'ถึงโรงพยาบาลแล้ว'
    case 'waiting':
      return 'กำลังรอคิว'
    case 'examining':
      return 'กำลังตรวจ'
    case 'with_doctor':
      return 'ช่วยฟังหมอ'
    case 'completed':
      return 'จบการดูแลแล้ว'
    default:
      return 'อัปเดตสถานะ'
  }
}

export function statusColor(status: TripStatus) {
  if (status === 'cancelled') return 'error'
  if (status === 'completed') return 'moss'
  if (status === 'requested') return 'warning'
  return 'primary'
}

export function nextStatus(status: TripStatus, service: ServiceType, packageId?: CarePackageId) {
  const flow = statusFlow(service, packageId)
  const index = flow.indexOf(viewStatus(status, service))
  if (index < 0 || index >= flow.length - 1) return null
  return flow[index + 1] ?? null
}

export function nextActionLabel(status: TripStatus, service: ServiceType, packageId?: CarePackageId) {
  const next = nextStatus(status, service, packageId)
  if (!next) return null
  switch (next) {
    case 'confirmed':
      return 'รับงาน'
    case 'at_hospital':
      return 'ถึงโรงพยาบาลแล้ว'
    case 'waiting':
      return 'เริ่มรอคิว'
    case 'examining':
      return 'เริ่มตรวจ'
    case 'with_doctor':
      return 'เริ่มช่วยฟังหมอ'
    case 'completed':
      return packageHasNotes(packageId) ? 'จบงานและส่งสรุป' : 'จบการดูแล'
    default:
      return null
  }
}

export const EMERGENCY_PHONE = '02-017-8899'

export function familyStatusText(status: TripStatus, nickname: string, elderName: string, place: string) {
  switch (status) {
    case 'confirmed':
      return `${nickname}รับงานดูแล${elderName}ที่${place}แล้ว หากติดต่อฉุกเฉิน โทรหลานจ๋า ${EMERGENCY_PHONE}`
    case 'at_hospital':
      return `${nickname}ถึงโรงพยาบาลกับ${elderName}ที่${place}แล้ว`
    case 'waiting':
      return `${nickname}กำลังรอคิวกับ${elderName}ที่${place}`
    case 'examining':
      return `${nickname}กำลังอยู่ระหว่างตรวจกับ${elderName}`
    case 'with_doctor':
      return `${nickname}กำลังช่วยฟังหมอให้${elderName}`
    case 'completed':
      return `${nickname}จบการดูแล${elderName}ที่${place}แล้ว`
    default:
      return ''
  }
}

export function initialFromName(name: string) {
  const cleaned = name.replace(/^(คุณตา|คุณยาย|คุณลุง|คุณป้า|คุณน้า|คุณอา|คุณ)/, '').trim()
  return (cleaned || name).slice(0, 1)
}

export function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}`
}
