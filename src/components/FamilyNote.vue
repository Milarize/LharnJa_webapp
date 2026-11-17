<template>
  <v-card class="pa-4" rounded="md" variant="outlined">
    <div class="text-title-medium font-weight-medium mb-1">โน้ตแจ้งลูกหลาน</div>
    <div class="text-body-medium mb-1">{{ trip.elderName }}</div>
    <p class="text-body-small text-medium-emphasis mb-3">{{ intro }}</p>
    <v-alert class="mb-3" density="compact" icon="mdi-scale-balance" type="warning" variant="tonal">
      {{ HEALTH_SHARE_CAUTION }}
    </v-alert>

    <div v-if="sent" class="d-flex flex-column ga-3">
      <v-alert density="compact" icon="mdi-check-circle" type="success" variant="tonal">
        ส่งแล้วให้ {{ sentNames }} ข้อความถูกล็อก
      </v-alert>
      <p v-if="followText" class="text-body-small mb-0">{{ followText }}</p>
      <CareUpdateCard v-bind="sentCard" caption="ส่งแล้ว ข้อความถูกล็อก" />
    </div>

    <div v-else class="d-flex flex-column ga-4">
      <section>
        <div class="text-label-large mb-2">เทมเพลต</div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="item in TEMPLATES"
            :key="item.id"
            size="small"
            :variant="templateId === item.id ? 'flat' : 'outlined'"
            :color="templateId === item.id ? 'primary' : undefined"
            @click="applyTemplate(item)"
          >
            {{ item.label }}
          </v-btn>
        </div>
      </section>

      <section v-for="group in groups" :key="group.field">
        <div class="text-label-large mb-2">{{ group.label }}</div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="choice in group.choices"
            :key="choice"
            size="small"
            :variant="draft[group.field] === choice ? 'flat' : 'outlined'"
            :color="draft[group.field] === choice ? 'primary' : undefined"
            @click="pick(group.field, choice)"
          >
            {{ choice }}
          </v-btn>
          <v-btn size="small" variant="text" @click="custom[group.field] = true">พิมพ์เอง</v-btn>
        </div>
        <v-text-field
          v-if="custom[group.field]"
          v-model="draft[group.field]"
          class="mt-2"
          density="compact"
          hide-details
          :label="`พิมพ์${group.label}`"
        />
      </section>

      <section v-if="needsAppointment">
        <div class="text-label-large mb-1">นัดครั้งต่อไป</div>
        <p class="text-body-small text-medium-emphasis mb-2">ติดตามตามอาการ ต้องจดวัน เวลา และสถานที่ไว้</p>
        <v-text-field v-model="draft.followUpDate" class="mb-2" density="compact" hide-details label="วันที่นัดครั้งต่อไป" :min="trip.date" type="date" />
        <div class="d-flex flex-wrap ga-2 mb-2">
          <v-btn
            v-for="slot in TIME_SLOTS"
            :key="slot"
            size="small"
            :color="draft.followUpTime === slot ? 'primary' : undefined"
            :variant="draft.followUpTime === slot ? 'flat' : 'outlined'"
            @click="draft.followUpTime = slot"
          >
            {{ slot }} น.
          </v-btn>
        </div>
        <v-text-field v-model="draft.followUpPlace" density="compact" hide-details label="สถานที่นัด" />
      </section>

      <v-btn v-if="plan === 'standard'" :disabled="gaps.length > 0" size="small" variant="tonal" @click="arranged = true">
        {{ arranged ? 'เรียบเรียงแล้ว' : 'ให้ AI เรียบเรียงจากเทมเพลต' }}
      </v-btn>
      <v-checkbox
        v-if="plan === 'premium'"
        v-model="doctorConfirm"
        density="compact"
        hide-details
        label="ประสานแพทย์เพื่อยืนยันข้อมูลตามความจำเป็น"
      />

      <section>
        <div class="text-label-large mb-2">ตรวจก่อนส่ง</div>
        <div class="d-flex flex-column ga-1 text-body-small">
          <div>{{ gaps.length ? `เนื้อหายังขาด ${gaps.join(' · ')}` : 'เนื้อหาครบ' }}</div>
          <div>{{ selected.length ? `ผู้รับ ${selectedNames}` : 'ยังไม่ได้เลือกผู้รับ' }}</div>
          <div>{{ basis.length ? 'มีฐานการรับข้อมูลแล้ว' : 'ยังไม่ได้เลือกฐานการรับข้อมูล' }}</div>
        </div>
      </section>

      <div class="text-label-large">ฐานการรับข้อมูล</div>
      <v-checkbox
        v-for="item in SHARE_BASIS"
        :key="item.id"
        density="compact"
        hide-details
        :label="item.label"
        :model-value="basis.includes(item.id)"
        @update:model-value="toggleBasis(item.id)"
      />

      <div class="text-label-large">ส่งให้ใคร</div>
      <p class="text-body-small text-medium-emphasis mb-0">การยืนยันตัวตนบอกได้แค่ว่าเป็นใคร</p>
      <div v-for="person in FAMILY_MEMBERS" :key="person.id" class="d-flex align-center justify-space-between ga-3">
        <div>
          <div class="text-body-medium font-weight-medium">{{ person.name }}</div>
          <div class="text-body-small text-medium-emphasis">{{ person.relation }}</div>
        </div>
        <v-btn
          v-if="store.isVerified(person.id)"
          :color="selected.includes(person.id) ? 'primary' : undefined"
          size="small"
          :variant="selected.includes(person.id) ? 'flat' : 'outlined'"
          @click="toggle(person.id)"
        >
          {{ selected.includes(person.id) ? 'จะได้รับโน้ต' : 'ส่งให้คนนี้' }}
        </v-btn>
        <span v-else class="text-body-small text-medium-emphasis">ยังไม่ยืนยันตัวตน</span>
      </div>

      <p class="text-body-small text-medium-emphasis mb-0">ร่างถูกบันทึกแล้ว ออกจากหน้านี้แล้วกลับมาแก้ได้</p>
      <v-btn color="primary" :disabled="!ready" @click="confirming = true">ตรวจแล้วส่ง</v-btn>
    </div>

    <v-dialog v-model="confirming" max-width="420">
      <v-card class="pa-4" rounded="md">
        <div class="text-title-medium font-weight-medium mb-2">ตรวจอีกครั้งก่อนส่ง</div>
        <p class="text-body-small mb-3">ส่งให้ {{ selectedNames }} ข้อความนี้ถูกล็อกหลังส่ง</p>
        <CareUpdateCard v-bind="liveCard" caption="นี่คือข้อความที่จะส่ง" />
        <div class="d-flex justify-end ga-2 mt-4">
          <v-btn variant="text" @click="confirming = false">กลับไปแก้</v-btn>
          <v-btn color="primary" @click="send">ส่งข้อความนี้</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import CareUpdateCard from '@/components/CareUpdateCard.vue'
  import type { ShareBasis, Trip } from '@/domain/types'
  import { hospitalById } from '@/domain/data'
  import { CARE_CLOSING, careUpdate, FAMILY_MEMBERS, HEALTH_SHARE_CAUTION, needsFollowUp, noteGaps, PROVIDER_TIERS, SHARE_BASIS, TIME_SLOTS } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const props = defineProps<{ trip: Trip }>()
  const store = useCareStore()
  const plan = computed(() => store.providerTier ?? 'basic')
  const draft = reactive({
    doctorSaid: '',
    medicines: '',
    nextVisit: '',
    caution: CARE_CLOSING,
    followUpDate: '',
    followUpTime: '',
    followUpPlace: '',
  })
  const selected = ref<string[]>([])
  const basis = ref<ShareBasis[]>([])
  const doctorConfirm = ref(false)
  const hisAllowed = ref(false)
  const arranged = ref(false)
  const confirming = ref(false)
  const custom = reactive({ doctorSaid: false, medicines: false, nextVisit: false })

  const TEMPLATES = [
    {
      id: 'stable',
      label: 'อาการคงที่',
      doctorSaid: 'อาการโดยรวมคงที่',
      medicines: 'ดำเนินการรักษาตามแผนเดิม',
      nextVisit: 'รอประเมินอาการเพิ่มเติม',
    },
    {
      id: 'better',
      label: 'อาการดีขึ้น',
      doctorSaid: 'อาการดีขึ้น',
      medicines: 'ดำเนินการรักษาตามแผนเดิม',
      nextVisit: 'นัดติดตามตามอาการ',
    },
  ]

  const groups = [
    { field: 'doctorSaid' as const, label: 'อาการ', choices: ['อาการโดยรวมคงที่', 'อาการดีขึ้น', 'ยังต้องเฝ้าดูอาการ'] },
    { field: 'medicines' as const, label: 'การรักษา', choices: ['ดำเนินการรักษาตามแผนเดิม', 'ได้ยาเพิ่มตามที่แพทย์สั่ง', 'ใช้ยาเดิม ไม่มียาเพิ่ม'] },
    { field: 'nextVisit' as const, label: 'ขั้นตอนถัดไป', choices: ['รอประเมินอาการเพิ่มเติม', 'นัดติดตามตามอาการ', 'ไม่มีนัดถัดไป'] },
  ]

  watch(
    () => props.trip.id,
    () => {
      const note = props.trip.visitNote
      draft.doctorSaid = note?.doctorSaid ?? ''
      draft.medicines = note?.medicines ?? ''
      draft.nextVisit = note?.nextVisit ?? ''
      draft.caution = note?.caution || CARE_CLOSING
      draft.followUpDate = note?.followUpDate ?? ''
      draft.followUpTime = note?.followUpTime ?? ''
      draft.followUpPlace = note?.followUpPlace ?? ''
      selected.value = [...(note?.sentTo ?? [])].filter(id => store.isVerified(id))
      basis.value = [...(note?.shareBasis ?? [])]
      doctorConfirm.value = Boolean(note?.doctorConfirm)
      hisAllowed.value = Boolean(note?.hisAllowed)
      arranged.value = false
      confirming.value = false
    },
    { immediate: true },
  )

  watch(draft, () => {
    arranged.value = false
    persist()
  })
  watch([selected, basis, doctorConfirm, hisAllowed], persist)

  function persist() {
    if (props.trip.visitNote?.sentAt) return
    store.saveVisitNote(props.trip.id, {
      ...draft,
      sentTo: selected.value,
      shareBasis: basis.value,
      doctorConfirm: doctorConfirm.value,
      hisAllowed: hisAllowed.value,
    })
  }

  const needsAppointment = computed(() => needsFollowUp(draft.nextVisit))
  const hospital = computed(() => hospitalById(props.trip.hospitalId)?.short ?? 'สถานพยาบาล')
  const followUpLine = computed(() => {
    if (!needsAppointment.value) return ''
    if (!draft.followUpDate || !draft.followUpTime) return 'ยังไม่ได้จดวันและเวลา'
    return `${draft.followUpDate} เวลา ${draft.followUpTime} น. ที่ ${draft.followUpPlace || props.trip.department}`
  })
  const visitLine = computed(() => `${hospital.value} · ${props.trip.department} · ${props.trip.date} ${props.trip.time} น.`)
  const templateId = computed(() => TEMPLATES.find(item => item.doctorSaid === draft.doctorSaid && item.medicines === draft.medicines && item.nextVisit === draft.nextVisit)?.id)
  const gaps = computed(() => noteGaps({ ...draft, sentTo: selected.value }))
  const sent = computed(() => Boolean(props.trip.visitNote?.sentAt))
  const ready = computed(() => gaps.value.length === 0 && selected.value.length > 0 && basis.value.length > 0)
  const selectedNames = computed(() =>
    selected.value.map(id => FAMILY_MEMBERS.find(person => person.id === id)?.name ?? '').filter(Boolean).join(' และ '),
  )
  const sentNames = computed(() =>
    (props.trip.visitNote?.sentTo ?? []).map(id => FAMILY_MEMBERS.find(person => person.id === id)?.name ?? '').filter(Boolean).join(' และ '),
  )
  const extraLine = computed(() => {
    if (plan.value === 'premium' && doctorConfirm.value) return 'จะประสานแพทย์เพื่อยืนยันข้อมูลตามความจำเป็น ยังไม่ถือว่าแพทย์ยืนยันแล้ว'
    if (plan.value === 'standard' && arranged.value) return 'ข้อความเรียบเรียงจากเทมเพลตแล้ว'
    return ''
  })
  const liveCard = computed(() => ({
    greeting: `สวัสดีค่ะ ครอบครัว${props.trip.familyName}`,
    elderLabel: props.trip.elderName,
    symptom: draft.doctorSaid,
    treatment: draft.medicines,
    next: draft.nextVisit,
    closing: draft.caution || CARE_CLOSING,
    visit: visitLine.value,
    extra: extraLine.value,
    followUp: followUpLine.value,
  }))
  const sentCard = computed(() => {
    const card = careUpdate(props.trip)
    return {
      ...card,
      elderLabel: props.trip.elderName,
      visit: `${hospital.value} · ${props.trip.department} · ${props.trip.date} ${props.trip.time} น.`,
    }
  })
  const intro = computed(() => {
    if (plan.value === 'standard') return 'เลือกเทมเพลตหรือข้อความสำเร็จรูป แล้วให้ AI เรียบเรียงได้'
    if (plan.value === 'premium') return 'Care Coordinator เลือกข้อความจากสิ่งที่รับฟัง แล้วประสานเมื่อจำเป็น'
    return 'เลือกข้อความสำเร็จรูป ไม่ต้องพิมพ์ทั้งฉบับ'
  })
  const followText = computed(() => {
    const used = props.trip.visitNote?.tier
    return PROVIDER_TIERS.find(item => item.id === used)?.follow ?? ''
  })

  function pick(field: 'doctorSaid' | 'medicines' | 'nextVisit', value: string) {
    draft[field] = value
    custom[field] = false
    if (field === 'nextVisit' && needsFollowUp(value) && !draft.followUpPlace) {
      draft.followUpPlace = `${hospital.value} · ${props.trip.department}`
    }
  }

  function applyTemplate(item: (typeof TEMPLATES)[number]) {
    draft.doctorSaid = item.doctorSaid
    draft.medicines = item.medicines
    draft.nextVisit = item.nextVisit
    draft.caution = CARE_CLOSING
    if (needsFollowUp(item.nextVisit) && !draft.followUpPlace) {
      draft.followUpPlace = `${hospital.value} · ${props.trip.department}`
    }
    custom.doctorSaid = false
    custom.medicines = false
    custom.nextVisit = false
  }

  function toggle(id: string) {
    selected.value = selected.value.includes(id) ? selected.value.filter(item => item !== id) : [...selected.value, id]
  }

  function toggleBasis(id: ShareBasis) {
    basis.value = basis.value.includes(id) ? basis.value.filter(item => item !== id) : [...basis.value, id]
  }

  function send() {
    confirming.value = false
    store.sendVisitNote(props.trip.id, selected.value)
  }
</script>
