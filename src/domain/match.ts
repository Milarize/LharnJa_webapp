import type { Caregiver, NeedId, Quote, ServiceType } from '@/domain/types'
import { caregiverById, caregivers, hospitalById } from '@/domain/data'
import { quote, shortNeed } from '@/domain/model'

const SKILLS = new Set<NeedId>(['cane', 'wheelchair', 'transfer', 'memory', 'meds', 'hearing'])

export interface RankedCaregiver {
  caregiver: Caregiver
  score: number
  reasons: string[]
  blocked: boolean
  quote: Quote
}

export function rankCaregivers(input: {
  hospitalId: string
  needs: NeedId[]
  elderId: string
  service: ServiceType
}) {
  const hospital = hospitalById(input.hospitalId)
  const ranked = caregivers.map(caregiver => scoreOne(caregiver, input, hospital?.short))
  ranked.sort((a, b) => {
    const aPenalty = a.blocked ? 1 : 0
    const bPenalty = b.blocked ? 1 : 0
    if (aPenalty !== bPenalty) return aPenalty - bPenalty
    return b.score - a.score
  })
  return ranked
}

function scoreOne(
  caregiver: Caregiver,
  input: { hospitalId: string; needs: NeedId[]; elderId: string; service: ServiceType },
  hospitalShort?: string,
): RankedCaregiver {
  let score = 64
  let blocked = false
  const reasons: string[] = []

  if (input.elderId === 'elder-somsri' && caregiver.id === 'cg-ann') {
    score += 7
    reasons.push('เคยดูแลคุณยายสมศรี')
  }

  if (caregiver.hospitalIds.includes(input.hospitalId)) {
    score += 12
    reasons.push(`คุ้นทาง${hospitalShort ?? 'โรงพยาบาลนี้'}`)
  }

  const wantedSkills = input.needs.filter(need => SKILLS.has(need))
  const matched = wantedSkills.filter(need => caregiver.skills.includes(need))
  if (matched.length) {
    score += Math.min(18, matched.length * 6)
    reasons.push(`ถนัด${matched.map(shortNeed).join(' · ')}`)
  }

  if (input.needs.includes('female')) {
    if (caregiver.gender === 'female') {
      score += 8
      reasons.push('เป็นผู้ดูแลเพศหญิงตามที่ต้องการ')
    } else {
      blocked = true
      reasons.unshift('เพศไม่ตรงตามที่ระบุ')
    }
  }

  if (input.needs.includes('male')) {
    if (caregiver.gender === 'male') {
      score += 8
      reasons.push('เป็นผู้ดูแลเพศชายตามที่ต้องการ')
    } else {
      blocked = true
      reasons.unshift('เพศไม่ตรงตามที่ระบุ')
    }
  }

  if (input.needs.includes('chinese')) {
    const speaks = caregiver.languages.some(language => language.includes('จีน'))
    if (speaks) {
      score += 10
      reasons.push('พูดภาษาจีนได้')
    } else {
      score -= 8
      reasons.push('ไม่ได้พูดภาษาจีน')
    }
  }

  if (caregiver.distanceKm <= 3) {
    score += 8
    reasons.push(`อยู่ในพื้นที่ประมาณ ${caregiver.distanceKm} กม.`)
  } else if (caregiver.distanceKm <= 6) {
    score += 4
    reasons.push(`อยู่ในพื้นที่ประมาณ ${caregiver.distanceKm} กม.`)
  }

  score += Math.round((caregiver.rating - 4.6) * 8)

  if (caregiver.unavailable) {
    blocked = true
    score = Math.min(score, 48)
    reasons.unshift('ติดนัดในช่วงตารางสาธิต')
  }

  if (!reasons.length) {
    reasons.push('เหมาะกับนัดทั่วไปจากประสบการณ์และรีวิว')
  }

  return {
    caregiver,
    score: Math.max(42, Math.min(98, Math.round(score))),
    reasons: reasons.slice(0, 3),
    blocked,
    quote: quote(input.service, caregiver.priceFactor),
  }
}

export function caregiverName(id: string) {
  return caregiverById(id)?.nickname ?? 'เพื่อนดูแล'
}
