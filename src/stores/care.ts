import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { Elder, ProviderTier, Role, Trip, TripStatus, VisitNote } from '@/domain/types'
import { caregiverById, createSeed, hospitalById } from '@/domain/data'
import { rankCaregivers } from '@/domain/match'
import { careUpdate, FAMILY, FAMILY_MEMBERS, familyStatusText, initialFromName, nextStatus, noteGaps, noteMessage, PROVIDER_TIERS, RESPOND_MS, SEED_RESPOND_MS, statusLabel, uid } from '@/domain/model'

const STORAGE_KEY = 'care-companion-v1'

interface LineNotice {
  id: string
  text: string
  at: string
  card?: ReturnType<typeof careUpdate>
}

interface Persisted {
  elders?: Elder[]
  trips?: Trip[]
  role?: Role
  thaidIds?: string[]
  providerTier?: ProviderTier | null
  lineNotices?: LineNotice[]
}

export interface NewTripInput {
  elderId: string
  elderName: string
  elderAge: number
  elderNote: string
  hospitalId: string
  department: string
  date: string
  time: string
  serviceType: Trip['serviceType']
  packageId?: Trip['packageId']
  profession?: string
  language?: string
  needs: Trip['needs']
  note: string
  pickup: string
  caregiverId: string
  price: number
  repeatOf?: string
}

export interface NewElderInput {
  name: string
  relation: string
  age: number
  conditions: string
  mobility: string
}

const tones = ['#0E6B62', '#8C5A3C', '#3D6B4F', '#5C4D72', '#0B4F6C']

export const useCareStore = defineStore('care', () => {
  const elders = ref<Elder[]>([])
  const trips = ref<Trip[]>([])
  const role = ref<Role>('family')
  const thaidIds = ref<string[]>([])
  const providerTier = ref<ProviderTier | null>(null)
  const lineNotices = ref<LineNotice[]>([])
  const toast = ref<{ text: string; line: boolean } | null>(null)
  const toastKey = ref(0)
  const clock = ref(Date.now())
  let clockTimer = 0

  function persist() {
    const payload: Persisted = {
      elders: elders.value,
      trips: trips.value,
      role: role.value,
      thaidIds: thaidIds.value,
      providerTier: providerTier.value,
      lineNotices: lineNotices.value,
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload))
  }

  function restoreSentNotes() {
    const seed = createSeed()
    for (const seeded of seed.trips) {
      if (!seeded.visitNote?.sentAt) continue
      const trip = trips.value.find(item => item.id === seeded.id)
      if (trip && !trip.visitNote?.sentAt) trip.visitNote = seeded.visitNote
    }
  }

  function hydrate() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const data = JSON.parse(raw) as Persisted
        if (Array.isArray(data.elders) && Array.isArray(data.trips)) {
          elders.value = data.elders
          trips.value = data.trips
          if (data.role === 'family' || data.role === 'caregiver') role.value = data.role
          thaidIds.value = Array.isArray(data.thaidIds) ? data.thaidIds : []
          if (data.providerTier === 'basic' || data.providerTier === 'standard' || data.providerTier === 'premium') {
            providerTier.value = data.providerTier
          }
          lineNotices.value = Array.isArray(data.lineNotices)
            ? data.lineNotices.filter(item => item && typeof item.id === 'string' && typeof item.text === 'string')
            : []
          restoreSentNotes()
          return
        }
      }
    } catch {
      // ใช้ชุดข้อมูลสาธิตถ้าอ่านที่เก็บในเครื่องไม่ได้
    }
    const seed = createSeed()
    elders.value = seed.elders
    trips.value = seed.trips
  }

  hydrate()
  armOpenRequests()
  persist()
  ensureClock()

  watch(
    () => ({
      elders: elders.value,
      trips: trips.value,
      role: role.value,
      thaidIds: thaidIds.value,
      providerTier: providerTier.value,
      lineNotices: lineNotices.value,
    }),
    persist,
    { deep: true },
  )

  function notify(text: string, line = true) {
    toastKey.value += 1
    toast.value = { text, line }
  }

  function clearToast() {
    toast.value = null
  }

  function addElder(input: NewElderInput) {
    const id = uid('elder')
    elders.value.push({
      id,
      name: input.name.trim(),
      relation: input.relation.trim(),
      age: input.age,
      conditions: input.conditions.trim() || 'ไม่ได้ระบุ',
      mobility: input.mobility.trim() || 'ไม่ได้ระบุ',
      initial: initialFromName(input.name),
      tone: tones[elders.value.length % tones.length] ?? '#0E6B62',
    })
    return id
  }

  function createTrip(input: NewTripInput) {
    const id = uid('trip')
    const trip: Trip = {
      id,
      owner: 'me',
      familyName: FAMILY.displayName,
      status: 'requested',
      timeline: [{ status: 'requested', at: new Date().toISOString() }],
      ...input,
    }
    trips.value.unshift(trip)
    const nickname = caregiverById(input.caregiverId)?.nickname ?? 'ผู้ดูแล'
    trip.respondBy = new Date(Date.now() + RESPOND_MS).toISOString()
    notify(
      input.repeatOf
        ? `ส่งคำขอจองซ้ำให้${nickname}ทาง LINE แล้ว ถ้าไม่กดรับ ระบบจะส่งต่อให้คนถัดไป`
        : `ส่งคำขอให้${nickname}ทาง LINE แล้ว ถ้าไม่กดรับ ระบบจะส่งต่อให้คนถัดไป`,
    )
    ensureClock()
    return id
  }

  function armOpenRequests() {
    const deadline = new Date(Date.now() + SEED_RESPOND_MS).toISOString()
    for (const trip of trips.value) {
      if (trip.status === 'requested' && !trip.respondBy) trip.respondBy = deadline
    }
  }

  function ensureClock() {
    const waiting = trips.value.some(trip => trip.status === 'requested')
    if (waiting && !clockTimer) {
      clockTimer = window.setInterval(() => {
        clock.value = Date.now()
        releaseUnanswered()
      }, 1000)
    }
    if (!waiting && clockTimer) {
      window.clearInterval(clockTimer)
      clockTimer = 0
    }
  }

  function releaseUnanswered() {
    const due = trips.value.filter(
      trip => trip.status === 'requested' && trip.respondBy && Date.parse(trip.respondBy) <= Date.now(),
    )
    for (const trip of due) handoff(trip.id, 'timeout')
    ensureClock()
  }

  function handoff(id: string, reason: 'timeout' | 'declined') {
    const trip = trips.value.find(item => item.id === id)
    if (!trip || trip.status !== 'requested') return
    const fromId = trip.caregiverId
    const fromName = caregiverById(fromId)?.nickname ?? 'ผู้ดูแล'
    const skipped = new Set([...(trip.handoffs ?? []).map(item => item.fromId), fromId])
    const next = rankCaregivers({
      hospitalId: trip.hospitalId,
      needs: trip.needs,
      elderId: trip.elderId,
      service: trip.serviceType,
    }).find(item => !item.blocked && !skipped.has(item.caregiver.id))
    const why = reason === 'declined' ? 'ปฏิเสธงาน' : 'ไม่กดรับภายในเวลา'
    if (!next) {
      trip.status = 'cancelled'
      trip.cancelReason = 'no_caregiver'
      trip.respondBy = undefined
      trip.timeline.push({ status: 'cancelled', at: new Date().toISOString() })
      notify(`ไม่มีเพื่อนดูแลรับงานของ${trip.elderName} ระบบยกเลิกคำขอให้แล้ว ไม่มีค่าใช้จ่าย`)
      return
    }
    trip.caregiverId = next.caregiver.id
    trip.price = next.quote.total
    trip.respondBy = new Date(Date.now() + RESPOND_MS).toISOString()
    trip.handoffs = [
      ...(trip.handoffs ?? []),
      { fromId, toId: next.caregiver.id, at: new Date().toISOString(), reason },
    ]
    notify(`${fromName}${why} ระบบส่งต่องานของ${trip.elderName}ให้${next.caregiver.nickname}แล้ว ยังไม่คิดเงิน`)
  }

  function patchStatus(id: string, status: TripStatus, message: string) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip) return
    trip.status = status
    trip.timeline.push({ status, at: new Date().toISOString() })
    notify(message)
  }

  function acceptTrip(id: string) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip || trip.status !== 'requested') return
    const nickname = caregiverById(trip.caregiverId)?.nickname ?? 'ผู้ดูแล'
    const place = hospitalById(trip.hospitalId)?.short ?? 'สถานพยาบาล'
    patchStatus(id, 'confirmed', familyStatusText('confirmed', nickname, trip.elderName, place))
    trip.respondBy = undefined
    ensureClock()
  }

  function declineTrip(id: string) {
    handoff(id, 'declined')
    ensureClock()
  }

  function advanceTrip(id: string) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip) return
    const next = nextStatus(trip.status, trip.serviceType)
    if (!next) return
    const nickname = caregiverById(trip.caregiverId)?.nickname ?? 'ผู้ดูแล'
    const place = hospitalById(trip.hospitalId)?.short ?? 'สถานพยาบาล'
    if (next === 'completed' && !trip.visitNote?.sentAt) {
      const sent = sendVisitNote(id, trip.visitNote?.sentTo ?? [])
      if (!sent) {
        notify('จดโน้ตให้ครบ เลือกฐานการรับข้อมูลและผู้รับ แล้วค่อยจบงาน')
        return
      }
    }
    const message = familyStatusText(next, nickname, trip.elderName, place) || `อัปเดตสถานะใน LINE แล้ว · ${statusLabel(next, trip.serviceType)}`
    patchStatus(id, next, message)
  }

  function cancelTrip(id: string) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip || trip.status === 'completed' || trip.status === 'cancelled') return
    trip.cancelReason = 'family'
    patchStatus(id, 'cancelled', `ยกเลิกนัดและแจ้งใน LINE แล้ว`)
    ensureClock()
  }

  function isVerified(id: string) {
    return thaidIds.value.includes(id)
  }

  function verifyThaid(id: string) {
    if (!thaidIds.value.includes(id)) thaidIds.value = [...thaidIds.value, id]
    const name = FAMILY_MEMBERS.find(person => person.id === id)?.name ?? 'สมาชิก'
    notify(`ยืนยันตัวตน${name}ด้วย ThaiD แล้ว`)
  }

  function saveVisitNote(id: string, note: VisitNote) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip || trip.visitNote?.sentAt) return
    trip.visitNote = { ...note, sentAt: undefined }
  }

  function sendVisitNote(id: string, recipientIds: string[]) {
    const trip = trips.value.find(item => item.id === id)
    if (!trip?.visitNote || trip.visitNote.sentAt) return Boolean(trip?.visitNote?.sentAt)
    const sentTo = recipientIds.filter(isVerified)
    if (noteGaps(trip.visitNote).length || !sentTo.length || !trip.visitNote.shareBasis?.length) return false
    trip.visitNote = { ...trip.visitNote, sentTo, sentAt: new Date().toISOString(), tier: providerTier.value ?? 'basic' }
    const names = sentTo
      .map(recipientId => FAMILY_MEMBERS.find(person => person.id === recipientId)?.name)
      .filter(Boolean)
      .join(' และ ')
    const card = careUpdate(trip)
    lineNotices.value = [
      ...lineNotices.value,
      { id: uid('line'), text: noteMessage(trip), at: new Date().toISOString(), card },
    ]
    notify(`ส่งสรุปนัด${trip.elderName}ทาง LINE ให้${names}แล้ว`)
    return true
  }

  function subscribePlan(tier: ProviderTier) {
    providerTier.value = tier
    const name = PROVIDER_TIERS.find(item => item.id === tier)?.name ?? tier
    notify(`สมัครแพ็กเกจ ${name} แล้ว`)
  }

  function resetDemo() {
    const seed = createSeed()
    elders.value = seed.elders
    trips.value = seed.trips
    thaidIds.value = []
    providerTier.value = null
    lineNotices.value = []
    armOpenRequests()
    notify('รีเซ็ตข้อมูลสาธิตแล้ว', false)
    ensureClock()
  }

  return {
    elders,
    trips,
    role,
    thaidIds,
    providerTier,
    lineNotices,
    toast,
    toastKey,
    clock,
    notify,
    clearToast,
    isVerified,
    verifyThaid,
    saveVisitNote,
    sendVisitNote,
    subscribePlan,
    addElder,
    createTrip,
    acceptTrip,
    declineTrip,
    advanceTrip,
    cancelTrip,
    resetDemo,
  }
})
