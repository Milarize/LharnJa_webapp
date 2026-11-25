export interface DemoScene {
  id: string
  title: string
  say: string
  /** ชื่อ route ของ vue-router */
  route: string
  params?: Record<string, string>
  query?: Record<string, string>
  /** เตรียมสถานะก่อนแสดงฉาก */
  prep?: 'fresh' | 'family' | 'caregiver' | 'family-verified' | 'provider-gate'
  /** กลุ่มสำหรับเลือกทัวร์ย่อย */
  track: 'family' | 'provider' | 'shared'
  /** มิลลิวินาทีก่อนไปฉากถัดไปตอนเล่นอัตโนมัติ */
  holdMs?: number
}

/** ลำดับฉากสำหรับ live demo นำเสนอ (~5–6 นาที รวมทั้งสองฝั่ง) */
export const DEMO_SCENES: DemoScene[] = [
  {
    id: 'line-intro',
    title: 'เปิดจาก LINE',
    say: 'Killing Feature 1 — ความน่าเชื่อถือจากจุดแข็ง CDG ที่นำมา integrate รวมกัน',
    route: 'line',
    prep: 'fresh',
    track: 'family',
    holdMs: 5000,
  },
  {
    id: 'thaid',
    title: 'ยืนยันตัวตนครั้งแรก',
    say: 'Value — ThaiD (CDT) + ตรวจประวัติ (CSGS) + NostraMap ทำให้ครอบครัวไว้ใจได้',
    route: 'line',
    track: 'family',
    holdMs: 5500,
  },
  {
    id: 'home',
    title: 'หน้าแรกครอบครัว',
    say: 'หลังยืนยันแล้ว เห็นนัดถัดไป คนในครอบครัว และจองซ้ำกับเพื่อนดูแลคนเดิมได้ทันที',
    route: 'home',
    prep: 'family-verified',
    track: 'family',
    holdMs: 5000,
  },
  {
    id: 'book',
    title: 'จองเพื่อนดูแล',
    say: 'จองเป็น 6 ขั้น เลือกผู้สูงอายุ แพ็กเกจ วันเวลา ความต้องการ และเพื่อนดูแล แล้วยืนยันคำขอ',
    route: 'book',
    prep: 'family-verified',
    track: 'family',
    holdMs: 5000,
  },
  {
    id: 'plans',
    title: 'แพ็กเกจการดูแล',
    say: 'มี Basic Plus และ Care จ่ายครั้งเดียวตอนจอง แพ็กเกจสูงกว่าช่วยฟังหมอและส่งสรุปเข้า LINE',
    route: 'plans',
    prep: 'family-verified',
    track: 'family',
    holdMs: 5000,
  },
  {
    id: 'trips',
    title: 'นัดหมายทั้งหมด',
    say: 'ดูนัดที่กำลังจะถึง สถานะ และรายละเอียดเพื่อนดูแลที่ไปด้วย',
    route: 'trips',
    prep: 'family-verified',
    track: 'family',
    holdMs: 4000,
  },
  {
    id: 'trip',
    title: 'สถานะนัดแบบเรียลไทม์',
    say: 'Killing Feature 2 — สถานะเรียลไทม์ ครอบครัวเห็นตลอดว่าอยู่ขั้นไหนของนัด',
    route: 'trip',
    params: { id: 'trip-somsri-next' },
    prep: 'family-verified',
    track: 'family',
    holdMs: 5500,
  },
  {
    id: 'history',
    title: 'ประวัติการดูแล',
    say: 'นัดที่ผ่านมาเก็บไว้ให้ดูย้อนหลัง และจองซ้ำกับคนเดิมได้',
    route: 'history',
    prep: 'family-verified',
    track: 'family',
    holdMs: 4000,
  },

  // —— ฝั่งผู้ให้บริการ ——
  {
    id: 'provider-line',
    title: 'ผู้ให้บริการจาก LINE',
    say: 'สลับไปแท็บผู้ให้บริการ พี่แอนเปิดงานจาก LINE ได้เหมือนกัน ไม่ต้องมีแอปแยก',
    route: 'line',
    query: { side: 'provider' },
    prep: 'provider-gate',
    track: 'provider',
    holdMs: 5500,
  },
  {
    id: 'provider-thaid',
    title: 'ThaID ของผู้ดูแล',
    say: 'ยืนยันตัวตนครั้งเดียวตอนเริ่มรับงาน ได้ชื่อจาก ThaID แล้วครั้งถัดไปเปิดดูงานได้เลย',
    route: 'line',
    query: { side: 'provider' },
    prep: 'provider-gate',
    track: 'provider',
    holdMs: 5500,
  },
  {
    id: 'provider-schedule',
    title: 'ตารางงานของฉัน',
    say: 'หลังยืนยันแล้วเห็นโปรไฟล์ ตารางงานทั้งวัน และสถานะแต่ละนัดแบบขั้นตอน',
    route: 'caregiver',
    prep: 'caregiver',
    track: 'provider',
    holdMs: 5500,
  },
  {
    id: 'provider-requests',
    title: 'คำขอใหม่ · รับงาน',
    say: 'คำขอใหม่เด้งเข้า LINE ของผู้ดูแล กดรับหรือปฏิเสธจากข้อความ ถ้าไม่กดในเวลา ระบบส่งต่อคนถัดไป',
    route: 'line',
    query: { side: 'provider' },
    prep: 'caregiver',
    track: 'provider',
    holdMs: 6000,
  },
  {
    id: 'provider-active',
    title: 'งานที่รับแล้ว',
    say: 'Value ของ KF2 — ผู้ดูแลอัปเดตทีละขั้น ครอบครัวเห็นความคืบหน้าทาง LINE ทันที',
    route: 'caregiver-live',
    prep: 'caregiver',
    track: 'provider',
    holdMs: 5500,
  },
  {
    id: 'provider-note',
    title: 'สรุปให้ลูกหลาน',
    say: 'Killing Feature 3 — ช่วยฟังหมอแล้วสรุปสั้น ๆ ส่งเข้า LINE ให้ลูกหลาน',
    route: 'trip',
    params: { id: 'trip-somsri-next' },
    prep: 'caregiver',
    track: 'provider',
    holdMs: 6500,
  },

  {
    id: 'line-close',
    title: 'ปิดท้ายที่ LINE',
    say: 'สองฝั่งจบที่ LINE   ครอบครัวจองและติดตาม ผู้ดูแลอยู่โรงพยาบาลแล้วส่งสถานะกับสรุปกลับมา',
    route: 'line',
    prep: 'family-verified',
    track: 'shared',
    holdMs: 6000,
  },
]

export const PROVIDER_START_INDEX = DEMO_SCENES.findIndex(scene => scene.track === 'provider')
