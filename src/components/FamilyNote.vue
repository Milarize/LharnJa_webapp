<template>
  <v-card class="pa-4" rounded="md" variant="outlined">
    <h2 class="text-title-large mb-3">สรุปให้ลูกหลาน</h2>
    <div v-if="!sent" class="note-caution mb-4" role="note">
      <v-icon aria-hidden="true" icon="mdi-shield-alert-outline" size="22" />
      <span>ระวังใส่ข้อมูลผิด ข้อความนี้เป็นข้อมูลสุขภาพ ส่งแล้วแก้ไม่ได้</span>
    </div>

    <div v-if="sent" class="d-flex flex-column ga-3">
      <v-alert density="compact" icon="mdi-check-circle" type="success" variant="tonal">
        ส่งแล้วให้ {{ sentNames }} ข้อความถูกล็อก
      </v-alert>
      <p v-if="followText" class="text-body-small mb-0">{{ followText }}</p>
      <CareUpdateCard v-bind="sentCard" caption="ส่งแล้ว ข้อความถูกล็อก" />
    </div>

    <div v-else class="note-body d-flex flex-column ga-4">
      <section>
        <div class="note-label mb-2">ข้อความสำเร็จรูป</div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="item in TEMPLATES"
            :key="item.id"
            :variant="templateId === item.id ? 'flat' : 'outlined'"
            :color="templateId === item.id ? 'primary' : undefined"
            @click="applyTemplate(item)"
          >
            {{ item.label }}
          </v-btn>
        </div>
      </section>

      <section v-for="group in groups" :key="group.field">
        <div class="note-label mb-2">{{ group.label }}</div>
        <div class="d-flex flex-wrap ga-2">
          <v-btn
            v-for="choice in group.choices"
            :key="choice"
            :variant="draft[group.field] === choice ? 'flat' : 'outlined'"
            :color="draft[group.field] === choice ? 'primary' : undefined"
            @click="pick(group.field, choice)"
          >
            {{ choice }}
          </v-btn>
          <v-btn variant="text" @click="custom[group.field] = true">พิมพ์เอง</v-btn>
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

      <section v-if="needsAppointment" class="d-flex flex-column ga-4">
        <div class="note-label">นัดครั้งต่อไป</div>

        <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
          <template #activator="{ props: menu }">
            <button class="follow-date" type="button" v-bind="menu">
              <v-icon icon="mdi-calendar" size="26" />
              <span>
                <span class="follow-kicker">วันที่</span>
                <span class="follow-value">{{ draft.followUpDate ? appointmentDate(draft.followUpDate) : 'เลือกวัน' }}</span>
              </span>
            </button>
          </template>
          <v-date-picker
            color="primary"
            header-date-format="appointment"
            :min="trip.date"
            :model-value="draft.followUpDate"
            @update:model-value="chooseFollowDate"
          />
        </v-menu>

        <div>
          <div class="note-label mb-2">เวลานัด</div>
          <TimeWheel v-model="draft.followUpTime" />
        </div>

        <div class="follow-place">
          <v-icon color="coral" icon="mdi-hospital-building" size="26" />
          <div>
            <div class="follow-value">{{ shownPlace }}</div>
            <div class="follow-kicker">{{ trip.department }}</div>
          </div>
        </div>
        <v-btn
          v-if="!changingPlace"
          class="align-self-start"
          prepend-icon="mdi-swap-horizontal"
          variant="text"
          @click="changingPlace = true"
        >
          เปลี่ยนโรงพยาบาล
        </v-btn>
        <div v-else class="d-flex flex-column ga-2">
          <v-select
            density="comfortable"
            hide-details
            item-title="title"
            item-value="value"
            :items="hospitalChoices"
            label="โรงพยาบาลใหม่"
            :model-value="draft.followUpPlace || null"
            @update:model-value="chooseHospital"
          />
          <v-btn class="align-self-start" variant="text" @click="clearHospitalChange">
            ใช้โรงพยาบาลเดิม
          </v-btn>
        </div>
      </section>

      <v-btn v-if="plan === 'standard'" :disabled="gaps.length > 0" variant="tonal" @click="arranged = true">
        {{ arranged ? 'เรียบเรียงแล้ว' : 'ให้ AI เรียบเรียงจากเทมเพลต' }}
      </v-btn>
      <v-checkbox
        v-if="plan === 'premium'"
        v-model="doctorConfirm"
        density="compact"
        hide-details
        label="ประสานแพทย์เพื่อยืนยันข้อมูลตามความจำเป็น"
      />

      <button type="button" class="booker-confirm" :class="{ on: confirmed }" @click="confirmed = !confirmed">
        <v-icon :icon="confirmed ? 'mdi-check-circle' : 'mdi-account-check-outline'" size="28" />
        <span>
          <strong>{{ booker.name }}</strong>
          <span>{{ booker.relation }} · คนที่จองงานนี้</span>
        </span>
        <span class="confirm-word">{{ confirmed ? 'ยืนยันแล้ว' : 'ยืนยัน' }}</span>
      </button>

      <v-btn color="primary" :disabled="!ready" @click="confirming = true">ดูตัวอย่างก่อนส่ง</v-btn>
    </div>

    <v-dialog v-model="confirming" max-width="420">
      <v-card class="pa-4" rounded="md">
        <h2 class="text-title-large mb-2">ตรวจอีกครั้งก่อนส่ง</h2>
        <div class="note-caution mb-3" role="note">
          <v-icon aria-hidden="true" icon="mdi-shield-alert-outline" size="22" />
          <span>ตรวจให้ตรงกับที่ฟังมา ส่งผิดแล้วแก้ไม่ได้</span>
        </div>
        <p class="text-body-small mb-3">ส่งให้ {{ booker.name }} คนที่จองงานนี้</p>
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
  import TimeWheel from '@/components/TimeWheel.vue'
  import type { ShareBasis, Trip } from '@/domain/types'
  import { hospitals, tripPlaceName } from '@/domain/data'
  import { appointmentDate, CARE_CLOSING, careUpdate, FAMILY, FAMILY_MEMBERS, needsFollowUp, noteGaps, PROVIDER_TIERS } from '@/domain/model'
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
  const booker = FAMILY_MEMBERS.find(person => person.id === FAMILY.memberId) ?? FAMILY_MEMBERS[0]
  const confirmed = ref(false)
  const selected = ref<string[]>([])
  const basis = ref<ShareBasis[]>([])
  const doctorConfirm = ref(false)
  const hisAllowed = ref(false)
  const arranged = ref(false)
  const confirming = ref(false)
  const dateMenu = ref(false)
  const changingPlace = ref(false)
  const custom = reactive({ doctorSaid: false, medicines: false, nextVisit: false })

  const TEMPLATES = [
    {
      id: 'stable',
      label: 'อาการคงที่',
      doctorSaid: 'อาการโดยรวมคงที่',
      medicines: 'ดำเนินการรักษาตามแผนเดิม',
      nextVisit: 'มีนัดครั้งต่อไป',
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
    { field: 'nextVisit' as const, label: 'ขั้นตอนถัดไป', choices: ['มีนัดครั้งต่อไป', 'นัดติดตามตามอาการ', 'รอประเมินอาการเพิ่มเติม', 'ไม่มีนัดถัดไป'] },
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
      const savedPlace = note?.followUpPlace ?? ''
      const inherited = savedPlace === tripPlaceName(props.trip) || savedPlace === props.trip.pickup
      draft.followUpPlace = inherited ? '' : savedPlace
      changingPlace.value = Boolean(draft.followUpPlace)
      confirmed.value = (note?.sentTo ?? []).includes(booker.id)
      selected.value = confirmed.value ? [booker.id] : []
      basis.value = confirmed.value ? ['consent'] : []
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
  watch(confirmed, value => {
    selected.value = value ? [booker.id] : []
    basis.value = value ? ['consent'] : []
  })
  watch([selected, basis, doctorConfirm, hisAllowed], persist)

  function persist() {
    if (props.trip.visitNote?.sentAt) return
    store.saveVisitNote(props.trip.id, {
      ...draft,
      followUpPlace: draft.followUpPlace || tripPlaceName(props.trip),
      sentTo: selected.value,
      shareBasis: basis.value,
      doctorConfirm: doctorConfirm.value,
      hisAllowed: hisAllowed.value,
    })
  }

  const needsAppointment = computed(() => needsFollowUp(draft.nextVisit))
  const hospital = computed(() => tripPlaceName(props.trip))
  const shownPlace = computed(() => draft.followUpPlace || hospital.value)
  const hospitalChoices = computed(() =>
    hospitals
      .filter(item => item.short !== hospital.value)
      .map(item => ({ title: item.name, value: item.short })),
  )
  const followUpLine = computed(() => {
    if (!needsAppointment.value) return ''
    if (!draft.followUpDate || !draft.followUpTime) return 'ยังไม่ได้จดวันและเวลา'
    const when = appointmentDate(draft.followUpDate)
    const place = shownPlace.value
    return `${when} เวลา ${draft.followUpTime} น. ที่ ${place} · ${props.trip.department}`
  })
  const visitLine = computed(() => `${hospital.value} · ${props.trip.department} · ${props.trip.date} ${props.trip.time} น.`)
  const templateId = computed(() => TEMPLATES.find(item => item.doctorSaid === draft.doctorSaid && item.medicines === draft.medicines && item.nextVisit === draft.nextVisit)?.id)
  const gaps = computed(() => noteGaps({ ...draft, sentTo: selected.value }))
  const sent = computed(() => Boolean(props.trip.visitNote?.sentAt))
  const ready = computed(() => gaps.value.length === 0 && confirmed.value && store.isVerified(booker.id))
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
  const followText = computed(() => {
    const used = props.trip.visitNote?.tier
    return PROVIDER_TIERS.find(item => item.id === used)?.follow ?? ''
  })

  function fillFollowUpDefaults() {
    if (!draft.followUpDate) draft.followUpDate = props.trip.date
    if (!draft.followUpTime) draft.followUpTime = props.trip.time || '09:00'
  }

  function chooseHospital(value: unknown) {
    draft.followUpPlace = typeof value === 'string' ? value : ''
  }

  function clearHospitalChange() {
    draft.followUpPlace = ''
    changingPlace.value = false
  }

  function chooseFollowDate(value: unknown) {
    if (value instanceof Date) {
      const pad = (part: number) => String(part).padStart(2, '0')
      draft.followUpDate = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    } else if (typeof value === 'string' && value) {
      draft.followUpDate = value.slice(0, 10)
    }
    dateMenu.value = false
  }

  function pick(field: 'doctorSaid' | 'medicines' | 'nextVisit', value: string) {
    draft[field] = value
    custom[field] = false
    if (field === 'nextVisit' && needsFollowUp(value)) fillFollowUpDefaults()
  }

  function applyTemplate(item: (typeof TEMPLATES)[number]) {
    draft.doctorSaid = item.doctorSaid
    draft.medicines = item.medicines
    draft.nextVisit = item.nextVisit
    draft.caution = CARE_CLOSING
    if (needsFollowUp(item.nextVisit)) fillFollowUpDefaults()
    custom.doctorSaid = false
    custom.medicines = false
    custom.nextVisit = false
  }

  watch(needsAppointment, value => {
    if (value) fillFollowUpDefaults()
  })

  function send() {
    confirming.value = false
    store.sendVisitNote(props.trip.id, selected.value)
  }
</script>

<style scoped>
  .note-caution {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    border: 1.5px solid #a16207;
    border-radius: 12px;
    background: #fff6e8;
    color: #5c3b06;
    font-size: 1.2rem;
    line-height: 1.45;
  }

  .note-label {
    color: #241c16;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.35;
  }

  .note-body :deep(.v-btn.v-btn--size-default) {
    min-height: 48px;
    padding-inline: 16px;
    font-size: 1.125rem;
    letter-spacing: 0;
  }

  .note-caution :deep(.v-icon) {
    margin-top: 1px;
    color: #a16207;
  }

  .follow-date {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 14px 16px;
    border: 1.5px solid #6f6256;
    border-radius: 16px;
    background: #fffcf8;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .follow-date:focus-visible {
    outline: 2px solid #0e6b62;
    outline-offset: 2px;
  }

  .follow-date :deep(.v-icon) {
    color: #0e6b62;
  }

  .follow-kicker {
    display: block;
    color: #5c534c;
    font-size: 1rem;
    line-height: 1.3;
  }

  .follow-value {
    display: block;
    color: #241c16;
    font-size: 1.25rem;
    font-weight: 700;
    line-height: 1.3;
  }

  .follow-place {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .booker-confirm {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 12px 14px;
    border: 1.5px solid #6f6256;
    border-radius: 16px;
    background: #fff;
    color: #241c16;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .booker-confirm.on {
    border-color: #0e6b62;
    background: #e7f3f1;
  }

  .booker-confirm strong,
  .booker-confirm span span {
    display: block;
  }

  .booker-confirm strong {
    font-size: 1.3rem;
  }

  .booker-confirm span span,
  .confirm-word {
    color: #5c534c;
    font-size: 1.15rem;
  }

  .booker-confirm.on .confirm-word {
    color: #0e6b62;
    font-weight: 700;
  }

  .confirm-word {
    margin-left: auto;
  }
</style>
