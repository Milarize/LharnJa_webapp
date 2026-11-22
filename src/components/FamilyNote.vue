<template>
  <v-card class="pa-4" rounded="md" variant="outlined">
    <div class="text-title-medium font-weight-medium mb-1">สรุปให้ลูกหลาน</div>
    <div class="text-body-medium mb-1">{{ trip.elderName }}</div>
    <p class="text-body-small text-medium-emphasis mb-3">{{ intro }}</p>

    <div v-if="sent" class="d-flex flex-column ga-3">
      <v-alert density="compact" icon="mdi-check-circle" type="success" variant="tonal">
        ส่งแล้วให้ {{ sentNames }} ข้อความถูกล็อก
      </v-alert>
      <p v-if="followText" class="text-body-small mb-0">{{ followText }}</p>
      <CareUpdateCard v-bind="sentCard" caption="ส่งแล้ว ข้อความถูกล็อก" />
    </div>

    <div v-else class="d-flex flex-column ga-4">
      <section>
        <div class="text-label-large mb-2">เลือกข้อความสำเร็จรูป</div>
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

      <section v-if="needsAppointment" class="d-flex flex-column ga-4">
        <div>
          <div class="text-label-large mb-1">นัดครั้งต่อไป</div>
          <p class="text-body-small text-medium-emphasis mb-0">วันและเวลาจดเองได้ สถานที่เริ่มจากที่นัดนี้ เปลี่ยนได้จากช่องเลือก</p>
        </div>

        <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
          <template #activator="{ props: menu }">
            <v-text-field
              v-bind="menu"
              density="comfortable"
              hide-details
              label="วันที่นัดครั้งต่อไป"
              prepend-inner-icon="mdi-calendar"
              readonly
              :model-value="draft.followUpDate ? appointmentDate(draft.followUpDate) : ''"
            />
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
          <div class="text-label-large mb-2">เวลานัด</div>
          <TimeWheel v-model="draft.followUpTime" />
          <p class="text-body-small text-medium-emphasis mt-2 mb-0">
            เลื่อนชั่วโมงและนาทีขึ้นลง แถบสีเขียวคือเวลาที่เลือก {{ draft.followUpTime || '—' }} น.
          </p>
        </div>

        <v-select
          v-model="draft.followUpPlace"
          density="comfortable"
          hide-details
          item-title="title"
          item-value="value"
          :items="placeChoices"
          label="สถานที่ปัจจุบัน"
          prepend-inner-icon="mdi-hospital-building"
        >
          <template #selection="{ item }">
            {{ item.raw.title }}
          </template>
          <template #item="{ props: itemProps, item }">
            <v-list-item v-bind="itemProps" :subtitle="item.raw.subtitle" :title="item.raw.title" />
          </template>
        </v-select>
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
        <div class="text-label-large mb-2">ก่อนส่ง เช็กสั้น ๆ</div>
        <div class="d-flex flex-column ga-1 text-body-small">
          <div>{{ gaps.length ? `ยังขาด ${gaps.join(' · ')}` : 'ข้อความครบแล้ว' }}</div>
          <div>{{ selected.length ? `จะส่งให้ ${selectedNames}` : 'ยังไม่ได้เลือกคนรับ' }}</div>
          <div>{{ basis.length ? 'ระบุเหตุผลในการส่งแล้ว' : 'ยังไม่ได้เลือกว่าส่งได้เพราะอะไร' }}</div>
        </div>
      </section>

      <div class="text-label-large">ส่งได้เพราะอะไร</div>
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
      <p class="text-body-small text-medium-emphasis mb-0">ส่งได้เฉพาะคนที่ยืนยันตัวตนแล้ว</p>
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
          {{ selected.includes(person.id) ? 'จะได้รับสรุป' : 'ส่งให้คนนี้' }}
        </v-btn>
        <span v-else class="text-body-small text-medium-emphasis">ยังไม่ยืนยันตัวตน</span>
      </div>

      <p class="text-body-small text-medium-emphasis mb-0">ร่างถูกบันทึกแล้ว ออกจากหน้านี้แล้วกลับมาแก้ได้</p>
      <v-btn color="primary" :disabled="!ready" @click="confirming = true">ดูตัวอย่างก่อนส่ง</v-btn>
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
  import TimeWheel from '@/components/TimeWheel.vue'
  import type { ShareBasis, Trip } from '@/domain/types'
  import { hospitals, tripPlaceName } from '@/domain/data'
  import { appointmentDate, CARE_CLOSING, careUpdate, FAMILY_MEMBERS, needsFollowUp, noteGaps, PROVIDER_TIERS, SHARE_BASIS } from '@/domain/model'
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
  const dateMenu = ref(false)
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
  const hospital = computed(() => tripPlaceName(props.trip))
  const currentPlace = computed(() => props.trip.pickup || hospital.value)
  const placeChoices = computed(() => {
    const current = {
      title: currentPlace.value,
      subtitle: `นัดนี้ · ${props.trip.department}`,
      value: currentPlace.value,
    }
    const seen = new Set([current.value])
    const others = hospitals
      .map(item => ({
        title: item.name,
        subtitle: `${item.area} · ${props.trip.department}`,
        value: item.name,
      }))
      .filter(item => {
        if (seen.has(item.value) || item.title === hospital.value || item.value === hospital.value) return false
        seen.add(item.value)
        return true
      })
    const choices = [current, ...others]
    if (draft.followUpPlace && !choices.some(item => item.value === draft.followUpPlace)) {
      choices.splice(1, 0, {
        title: draft.followUpPlace,
        subtitle: 'ที่เลือกไว้',
        value: draft.followUpPlace,
      })
    }
    return choices
  })
  const followUpLine = computed(() => {
    if (!needsAppointment.value) return ''
    if (!draft.followUpDate || !draft.followUpTime) return 'ยังไม่ได้จดวันและเวลา'
    const when = appointmentDate(draft.followUpDate)
    const place = draft.followUpPlace || currentPlace.value
    return `${when} เวลา ${draft.followUpTime} น. ที่ ${place} · ${props.trip.department}`
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
    if (plan.value === 'standard') return 'กดเลือกข้อความที่ตรงกับที่ฟังมา แล้วให้ระบบเรียบเรียงก่อนส่ง'
    if (plan.value === 'premium') return 'เลือกข้อความจากที่ฟังมา แล้วส่งให้ลูกหลานได้เลย'
    return 'กดเลือกข้อความสั้น ๆ จากที่ฟังหมอมา ไม่ต้องพิมพ์เองทั้งฉบับ'
  })
  const followText = computed(() => {
    const used = props.trip.visitNote?.tier
    return PROVIDER_TIERS.find(item => item.id === used)?.follow ?? ''
  })

  function fillFollowUpDefaults() {
    if (!draft.followUpDate) draft.followUpDate = props.trip.date
    if (!draft.followUpTime) draft.followUpTime = props.trip.time || '09:00'
    if (!draft.followUpPlace) draft.followUpPlace = currentPlace.value
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
