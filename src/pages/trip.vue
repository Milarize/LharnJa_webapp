<template>
  <div v-if="trip">
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      :to="backTo"
    >
      กลับ
    </v-btn>

    <div class="d-flex flex-wrap align-center ga-3 mb-2">
      <StatusChip :service="trip.serviceType" :status="trip.status" />
      <v-chip v-if="trip.repeatOf" color="primary" size="small" variant="tonal">จองซ้ำคนเดิม</v-chip>
      <span v-if="store.role !== 'caregiver'" class="text-body-medium text-medium-emphasis">{{ baht(trip.price) }} · ค่าผู้ดูแลที่โรงพยาบาล</span>
    </div>
    <h1 class="display-thai mb-1">{{ trip.elderName }}</h1>
    <p class="text-body-large text-medium-emphasis mb-6">
      {{ dayLabel(trip.date) }} {{ thaiDate(trip.date) }} · {{ trip.time }} น.
    </p>

    <v-row>
      <v-col cols="12" md="7">
        <v-card class="pa-4 mb-4" rounded="md" variant="outlined">
          <div class="text-label-large text-medium-emphasis mb-2">อยู่ดูแลที่โรงพยาบาล</div>
          <div class="d-flex align-center ga-2 text-body-medium">
            <v-icon color="coral" icon="mdi-hospital-building" size="18" />
            <span>{{ hospital?.name }}</span>
          </div>
          <div class="text-body-small text-medium-emphasis mt-2">{{ trip.department }} · {{ trip.time }} น.</div>
        </v-card>

        <v-alert v-if="trip.status === 'requested'" class="mb-4" icon="mdi-shield-account" type="info" variant="tonal">
          รอ{{ caregiver?.nickname }}กดรับ เหลือ {{ remain }}
          ถ้าไม่กด โปรแกรมส่งต่องานให้เพื่อนดูแลคนถัดไปที่เลือกได้เอง ยังไม่คิดเงินจนกว่าจะมีคนรับ
          คนเดิมไม่ต้องไปและไม่ได้รับค่าตอบแทน ของจริงให้เวลา 15 นาที ต้นแบบย่นเวลาให้เห็นผลเลย
        </v-alert>
        <v-alert
          v-if="trip.status === 'cancelled' && trip.cancelReason === 'no_caregiver'"
          class="mb-4"
          icon="mdi-shield-account"
          type="warning"
          variant="tonal"
        >
          ไม่มีเพื่อนดูแลกดรับงาน โปรแกรมยกเลิกคำขอให้แล้ว ไม่มีค่าใช้จ่าย จองใหม่ได้
        </v-alert>
        <v-card v-if="trip.handoffs?.length" class="pa-4 mb-4" rounded="md" variant="outlined">
          <div class="text-label-large text-medium-emphasis mb-2">โปรแกรมรับช่วงต่อ</div>
          <div v-for="hop in trip.handoffs" :key="hop.at" class="text-body-medium">
            {{ caregiverById(hop.fromId)?.nickname }}{{ hop.reason === 'declined' ? 'ปฏิเสธงาน' : 'ไม่กดรับ' }}
            ระบบส่งต่อให้{{ caregiverById(hop.toId)?.nickname }}
          </div>
        </v-card>

        <v-card class="pa-2" rounded="md" variant="outlined">
          <v-timeline class="pa-2" density="compact" side="end" truncate-line="both">
            <v-timeline-item
              v-for="(status, index) in flow"
              :key="status"
              :dot-color="index <= currentIndex ? 'primary' : 'surface-variant'"
              :icon="index < currentIndex ? 'mdi-check' : undefined"
              size="small"
            >
              <div :class="index === currentIndex ? 'font-weight-bold' : 'text-medium-emphasis'">
                {{ statusLabel(status, trip.serviceType) }}
              </div>
              <div v-if="eventAt(status)" class="text-body-small text-medium-emphasis">
                {{ thaiTime(eventAt(status) ?? '') }}
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card>

        <ReviewNote class="mt-4" :text="trip.review" />
      </v-col>

      <v-col cols="12" md="5">
        <v-card v-if="store.role === 'caregiver'" class="pa-4 mb-4" rounded="md" variant="outlined">
          <div class="text-label-large text-medium-emphasis mb-3">ติดต่อฉุกเฉิน</div>
          <div class="d-flex ga-3 align-center">
            <v-avatar class="contact-avatar" size="56">{{ booker.initial }}</v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold">{{ booker.name }}</div>
              <div class="text-body-medium text-medium-emphasis">{{ booker.detail }}</div>
            </div>
          </div>
          <button v-if="booker.phone" class="contact-phone" type="button" @click="fake('โทร')">
            <v-icon icon="mdi-phone" size="26" />
            <span>{{ booker.phone }}</span>
          </button>
        </v-card>
        <v-card v-else class="pa-4 mb-4" rounded="md" variant="outlined">
          <div class="d-flex ga-3 align-center mb-3">
            <v-avatar size="56">
              <v-img v-if="caregiver" :alt="caregiver.nickname" cover :src="caregiver.photo" />
            </v-avatar>
            <div>
              <div class="d-flex align-center ga-2">
                <div class="text-title-medium font-weight-bold">{{ caregiver?.nickname }}</div>
                <VerifiedMark v-if="caregiverVerified(caregiver?.badges)" />
              </div>
              <div class="text-body-medium text-medium-emphasis">{{ caregiver?.name }}</div>
              <BadgeMarks class="mt-1" :badges="caregiver?.badges" />
            </div>
          </div>
          <div class="d-flex flex-wrap ga-2">
            <v-btn prepend-icon="mdi-phone" variant="outlined" @click="fake('โทร')">โทร</v-btn>
            <v-btn
              v-if="trip.owner === 'me' && canRebookTrip(trip)"
              color="primary"
              prepend-icon="mdi-calendar-sync"
              :to="{ name: 'book', query: { rebook: trip.id } }"
            >
              จองซ้ำกับ{{ caregiver?.nickname }}
            </v-btn>
          </div>
        </v-card>

        <v-card class="pa-4" rounded="md" variant="outlined">
          <h2 class="text-title-large mb-3">สิ่งที่ผู้ดูแลควรรู้</h2>
          <ul class="know-list">
            <li v-for="fact in knowFacts" :key="fact.text" :class="{ warn: fact.warn }">
              <v-icon :icon="fact.icon" size="22" />
              <span>{{ fact.text }}</span>
            </li>
          </ul>
        </v-card>

        <v-alert
          v-if="packageHasNotes(trip.packageId) && viewStatus(trip.status, trip.serviceType) === 'with_doctor' && store.role !== 'caregiver'"
          class="mt-4"
          icon="mdi-account-switch"
          type="info"
          variant="tonal"
        >
          นัดนี้อยู่ขั้นช่วยฟังหมอแล้ว สลับเป็นผู้ดูแลด้านบนเพื่อกรอกสรุปให้ลูกหลาน
        </v-alert>
        <div
          v-else-if="store.role === 'caregiver' && packageHasNotes(trip.packageId) && viewStatus(trip.status, trip.serviceType) === 'with_doctor'"
          class="mt-4"
        >
          <FamilyNote :trip="trip" />
        </div>
        <v-alert
          v-else-if="store.role === 'caregiver' && packageHasNotes(trip.packageId) && trip.status !== 'completed' && trip.status !== 'cancelled'"
          class="mt-4"
          icon="mdi-note-text-outline"
          type="info"
          variant="tonal"
        >
          สรุปให้ลูกหลานจะโผล่เมื่อถึงขั้นช่วยฟังหมอ ใช้แผงสาธิตด้านล่างเดินสถานะได้
        </v-alert>
      </v-col>
    </v-row>

    <v-sheet class="demo-panel pa-4 mt-6" rounded="md">
      <div class="text-label-large mb-1">แผงสาธิตสำหรับผู้นำเสนอ</div>
      <p class="text-body-medium text-medium-emphasis mb-3">
        ผู้ใช้จริงไม่เห็นปุ่มนี้ ครอบครัวเห็นไทม์ไลน์อย่างเดียว ส่วนผู้ดูแลอัปเดตสถานะจากหน้างานของฉัน
        ปุ่มด้านล่างมีไว้เดินเรื่องระหว่างพรีเซนต์
      </p>
      <div class="d-flex flex-wrap ga-2">
        <v-btn
          v-if="trip.status === 'requested'"
          color="primary"
          @click="store.acceptTrip(trip.id)"
        >
          จำลองว่าผู้ดูแลรับงาน
        </v-btn>
        <v-btn
          v-if="nextLabel"
          color="primary"
          variant="tonal"
          @click="store.advanceTrip(trip.id)"
        >
          {{ nextLabel }}
        </v-btn>
        <v-btn
          v-if="trip.status !== 'completed' && trip.status !== 'cancelled'"
          color="error"
          variant="text"
          @click="store.cancelTrip(trip.id)"
        >
          ยกเลิกนัด
        </v-btn>
      </div>
    </v-sheet>
  </div>

  <v-card v-else class="pa-6" rounded="md" variant="outlined">
    <div class="text-title-large mb-2">ไม่พบนัดนี้</div>
    <p class="text-body-medium text-medium-emphasis mb-4">รายการอาจหายไปหลังรีเซ็ตข้อมูลสาธิต</p>
    <v-btn color="primary" :to="{ name: 'trips' }">กลับไปนัดหมาย</v-btn>
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRoute } from 'vue-router'
  import BadgeMarks from '@/components/BadgeMarks.vue'
  import FamilyNote from '@/components/FamilyNote.vue'
  import ReviewNote from '@/components/ReviewNote.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import VerifiedMark from '@/components/VerifiedMark.vue'
  import { caregiverById, hospitalById } from '@/domain/data'
  import type { TripStatus } from '@/domain/types'
  import {
    baht,
    dayLabel,
    caregiverVerified,
    canRebookTrip,
    FAMILY,
    FAMILY_MEMBERS,
    initialFromName,
    nextActionLabel,
    NEED_OPTIONS,
    packageHasNotes,
    statusFlow,
    statusLabel,
    viewStatus,
    remainText,
    thaiDate,
    thaiTime,
  } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const route = useRoute()
  const trip = computed(() => store.trips.find(item => item.id === String(route.params.id)))
  const backTo = computed(() => {
    if (store.role !== 'caregiver') return { name: 'trips' as const }
    if (trip.value?.status === 'requested') return { name: 'caregiver-requests' as const }
    if (trip.value?.status === 'completed' || trip.value?.status === 'cancelled') return { name: 'caregiver-history' as const }
    return { name: 'caregiver-jobs' as const }
  })
  const hospital = computed(() => {
    if (!trip.value) return undefined
    return hospitalById(trip.value.hospitalId) ?? {
      id: trip.value.hospitalId,
      name: trip.value.pickup || 'สถานพยาบาล',
      short: trip.value.pickup || 'สถานพยาบาล',
      area: '',
      lat: trip.value.placeLat ?? 0,
      lng: trip.value.placeLng ?? 0,
    }
  })
  const caregiver = computed(() => (trip.value ? caregiverById(trip.value.caregiverId) : undefined))
  const booker = computed(() => {
    const current = trip.value
    if (current?.owner === 'me') {
      const person = FAMILY_MEMBERS.find(item => item.id === FAMILY.memberId)
      const name = person?.name ?? FAMILY.displayName
      return {
        name,
        detail: person ? `${person.relation} · คนที่จองงานนี้` : 'คนที่จองงานนี้',
        phone: FAMILY.phone,
        initial: initialFromName(name),
      }
    }
    const name = current?.familyName ?? ''
    return { name, detail: 'คนที่จองงานนี้', phone: '', initial: initialFromName(name) }
  })
  const knowFacts = computed(() => {
    if (!trip.value) return []
    const facts: { icon: string; text: string; warn: boolean }[] = []
    if (trip.value.note) facts.push({ icon: 'mdi-alert-outline', text: trip.value.note, warn: true })
    for (const part of trip.value.elderNote.split('·').map(item => item.trim()).filter(Boolean)) {
      const allergy = part.includes('แพ้')
      const walking = part.includes('เดิน') || part.includes('ไม้เท้า')
      facts.push({
        icon: allergy ? 'mdi-alert-circle-outline' : walking ? 'mdi-walk' : 'mdi-heart-pulse',
        text: part,
        warn: allergy,
      })
    }
    for (const id of trip.value.needs) {
      const option = NEED_OPTIONS.find(item => item.id === id)
      if (!option) continue
      if (facts.some(fact => fact.text.includes('ไม้เท้า') && option.id === 'cane')) continue
      facts.push({ icon: option.icon, text: option.label, warn: false })
    }
    return facts
  })
  const flow = computed(() => (trip.value ? statusFlow(trip.value.serviceType, trip.value.packageId) : []))
  const currentIndex = computed(() =>
    trip.value ? flow.value.indexOf(viewStatus(trip.value.status, trip.value.serviceType)) : -1,
  )
  const nextLabel = computed(() =>
    trip.value && trip.value.status !== 'requested'
      ? nextActionLabel(trip.value.status, trip.value.serviceType, trip.value.packageId)
      : null,
  )
  const remain = computed(() => remainText(trip.value?.respondBy, store.clock))

  function eventAt(status: TripStatus) {
    return trip.value?.timeline.find(item => item.status === status)?.at
  }

  function fake(action: string) {
    store.notify(`ต้นแบบยังไม่${action}ออก ในของจริงจะติดต่อผ่านช่องทางที่ยืนยันตัวตนแล้ว`, false)
  }
</script>

<style scoped>
  .know-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .know-list li {
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 12px;
    background: #f7fbfa;
    color: #241c16;
    font-size: 1.05rem;
    line-height: 1.4;
  }

  .know-list .warn {
    background: #fff6e8;
    color: #5c3b06;
  }

  .know-list :deep(.v-icon) {
    margin-top: 1px;
    color: #0e6b62;
  }

  .know-list .warn :deep(.v-icon) {
    color: #a16207;
  }

  .contact-avatar {
    background: #0e6b62;
    color: #fff;
    font-size: 1.4rem;
    font-weight: 700;
  }

  .contact-phone {
    display: flex;
    align-items: center;
    gap: 10px;
    width: 100%;
    margin-top: 14px;
    padding: 12px 14px;
    border: none;
    border-radius: 14px;
    background: #e7f3f1;
    color: #0e6b62;
    font: inherit;
    font-size: 1.35rem;
    font-weight: 700;
    text-align: left;
    cursor: pointer;
  }

  .contact-phone :deep(.v-icon) {
    color: #0e6b62;
  }
</style>
