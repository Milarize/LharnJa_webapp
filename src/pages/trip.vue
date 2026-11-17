<template>
  <div v-if="trip">
    <v-btn
      class="mb-4"
      prepend-icon="mdi-arrow-left"
      variant="text"
      :to="store.role === 'caregiver' ? { name: 'caregiver' } : { name: 'trips' }"
    >
      กลับ
    </v-btn>

    <div class="d-flex flex-wrap align-center ga-3 mb-2">
      <StatusChip :service="trip.serviceType" :status="trip.status" />
      <v-chip v-if="trip.repeatOf" color="primary" size="small" variant="tonal">จองซ้ำคนเดิม</v-chip>
      <span class="text-body-medium text-medium-emphasis">{{ baht(trip.price) }} · ค่าผู้ดูแลที่โรงพยาบาล</span>
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

        <v-alert v-if="trip.review" class="mt-4" icon="mdi-star" type="success" variant="tonal">
          {{ trip.review }}
        </v-alert>
      </v-col>

      <v-col cols="12" md="5">
        <v-card class="pa-4 mb-4" rounded="md" variant="outlined">
          <div class="d-flex ga-3 align-center mb-3">
            <v-avatar size="56">
              <v-img v-if="caregiver" :alt="caregiver.nickname" cover :src="caregiver.photo" />
            </v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold">{{ caregiver?.nickname }}</div>
              <div class="text-body-small text-medium-emphasis">{{ caregiver?.name }}</div>
            </div>
          </div>
          <p class="text-body-medium mb-3">{{ caregiver?.bio }}</p>
          <div class="d-flex flex-wrap ga-2">
            <v-btn prepend-icon="mdi-phone" variant="outlined" @click="fake('โทร')">โทร</v-btn>
            <v-btn prepend-icon="mdi-chat" variant="outlined" @click="fake('ส่งข้อความ')">ข้อความ</v-btn>
            <v-btn
              v-if="trip.owner === 'me' && trip.status === 'completed'"
              color="primary"
              prepend-icon="mdi-calendar-sync"
              :to="{ name: 'book', query: { rebook: trip.id } }"
            >
              จองซ้ำกับ{{ caregiver?.nickname }}
            </v-btn>
          </div>
        </v-card>

        <v-card class="pa-4" rounded="md" variant="outlined">
          <div class="text-title-medium font-weight-medium mb-2">สิ่งที่ผู้ดูแลควรรู้</div>
          <p class="text-body-medium mb-2">{{ trip.elderNote }}</p>
          <p v-if="trip.note" class="text-body-medium mb-3">{{ trip.note }}</p>
          <div class="text-body-medium">{{ SERVICES[trip.serviceType].label }}</div>
          <div class="text-body-small text-medium-emphasis mb-3">{{ hospital?.name }} · {{ trip.department }}</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip v-for="need in trip.needs" :key="need" size="small" variant="tonal">{{ needLabel(need) }}</v-chip>
          </div>
        </v-card>

        <div v-if="store.role === 'caregiver' && viewStatus(trip.status, trip.serviceType) === 'with_doctor'" class="mt-4">
          <FamilyNote :trip="trip" />
        </div>
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
  import StatusChip from '@/components/StatusChip.vue'
  import FamilyNote from '@/components/FamilyNote.vue'
  import { caregiverById, hospitalById } from '@/domain/data'
  import type { TripStatus } from '@/domain/types'
  import {
    baht,
    dayLabel,
    needLabel,
    nextActionLabel,
    SERVICES,
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
  const hospital = computed(() => (trip.value ? hospitalById(trip.value.hospitalId) : undefined))
  const caregiver = computed(() => (trip.value ? caregiverById(trip.value.caregiverId) : undefined))
  const flow = computed(() => (trip.value ? statusFlow(trip.value.serviceType) : []))
  const currentIndex = computed(() =>
    trip.value ? flow.value.indexOf(viewStatus(trip.value.status, trip.value.serviceType)) : -1,
  )
  const nextLabel = computed(() =>
    trip.value && trip.value.status !== 'requested' ? nextActionLabel(trip.value.status, trip.value.serviceType) : null,
  )
  const remain = computed(() => remainText(trip.value?.respondBy, store.clock))

  function eventAt(status: TripStatus) {
    return trip.value?.timeline.find(item => item.status === status)?.at
  }

  function fake(action: string) {
    store.notify(`ต้นแบบยังไม่${action}ออก ในของจริงจะติดต่อผ่านช่องทางที่ยืนยันตัวตนแล้ว`, false)
  }
</script>
