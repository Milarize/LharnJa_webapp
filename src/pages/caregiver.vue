<template>
  <ThaiIdGate
    v-if="!store.isVerified(PROVIDER_THAID.id)"
    kind="provider"
    detail="ทำครั้งเดียวตอนเริ่มรับงาน ครั้งถัดไปเปิดแอปแล้วดูงานได้เลย"
    :masked-id="PROVIDER_THAID.maskedId"
    :name="PROVIDER_THAID.name"
    :relation="PROVIDER_THAID.relation"
    @confirm="store.verifyThaid(PROVIDER_THAID.id)"
  />
  <div v-else>
    <v-card class="pa-5 mb-6" color="primary" rounded="md">
      <div class="d-flex align-center ga-2 mb-3">
        <v-icon icon="mdi-shield-check" size="18" />
        <span class="text-label-large">ยืนยันตัวตนด้วย ThaID แล้ว</span>
      </div>
      <div class="d-flex align-center ga-3">
        <v-avatar size="72">
          <v-img v-if="me" :alt="me.nickname" cover :src="me.photo" />
        </v-avatar>
        <div>
          <div class="text-headline-small font-weight-medium">{{ me?.nickname }}</div>
          <div class="text-body-medium" style="opacity: .9">
            {{ me?.rating }} คะแนน · {{ me?.reviews }} รีวิว · ประสบการณ์ {{ me?.years }} ปี
          </div>
        </div>
      </div>
      <p class="text-body-medium mt-3 mb-0" style="opacity: .92">{{ me?.bio }}</p>
    </v-card>

    <h2 class="text-title-large font-weight-medium mb-3">ตารางงานของฉัน</h2>
    <div v-if="schedule.length" class="schedule mb-8">
      <article v-for="trip in schedule" :key="trip.id" class="schedule-item">
        <div class="schedule-when">
          <strong>{{ trip.time }}</strong>
          <span>{{ dayLabel(trip.date) }}</span>
        </div>
        <div class="schedule-body">
          <div class="text-title-medium font-weight-bold">{{ trip.elderName }}</div>
          <div class="text-body-small text-medium-emphasis">{{ tripPlaceName(trip) }} · {{ trip.department }}</div>
          <StatusChip class="mt-2" :service="trip.serviceType" :status="trip.status" />
          <div v-if="trip.status !== 'requested'" class="schedule-steps">
            <span
              v-for="step in stepsFor(trip)"
              :key="step"
              :class="{ 'is-done': stepIndex(trip) > stepsFor(trip).indexOf(step), 'is-now': stepIndex(trip) === stepsFor(trip).indexOf(step) }"
            >
              {{ statusLabel(step, trip.serviceType) }}
            </span>
          </div>
        </div>
      </article>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis mb-8">ยังไม่มีงานในตาราง</p>

    <h2 class="text-title-large font-weight-medium mb-3">คำขอใหม่</h2>
    <div v-if="requests.length" class="d-flex flex-column ga-3 mb-8">
      <TripCard v-for="trip in requests" :key="trip.id" audience="caregiver" :trip="trip">
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn color="primary" @click.stop="store.acceptTrip(trip.id)">รับงาน</v-btn>
          <v-btn variant="text" @click.stop="store.declineTrip(trip.id)">ปฏิเสธ</v-btn>
        </div>
        <p class="text-body-small mt-3 mb-0">
          เหลือ {{ remainText(trip.respondBy, store.clock) }} หากไม่กดรับหรือกดปฏิเสธ โปรแกรมส่งงานต่อให้คนอื่น
          คุณไม่ต้องไปและไม่ได้รับค่าตอบแทน
        </p>
      </TripCard>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis mb-8">ไม่มีคำขอที่รออยู่</p>

    <div v-if="store.lineNotices.length" class="d-flex flex-column ga-2 mb-6">
      <h2 class="text-title-large font-weight-medium">แจ้งเตือนถึงครอบครัว</h2>
      <v-alert
        v-for="item in [...store.lineNotices].reverse()"
        :key="item.id"
        icon="mdi-bell-ring-outline"
        type="success"
        variant="tonal"
      >
        ส่งทาง LINE แล้ว · {{ item.text }}
      </v-alert>
    </div>

    <h2 class="text-title-large font-weight-medium mb-3">งานที่รับแล้ว</h2>
    <div v-if="active.length" class="d-flex flex-column ga-3 mb-8">
      <TripCard v-for="trip in active" :key="trip.id" audience="caregiver" :trip="trip">
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            v-if="needsSummary(trip)"
            color="primary"
            :to="{ name: 'trip', params: { id: trip.id } }"
            @click.stop
          >
            ไปสรุปให้ลูกหลาน
          </v-btn>
          <v-btn
            v-else-if="nextActionLabel(trip.status, trip.serviceType, trip.packageId)"
            color="primary"
            @click.stop="store.advanceTrip(trip.id)"
          >
            {{ nextActionLabel(trip.status, trip.serviceType, trip.packageId) }}
          </v-btn>
          <v-btn
            v-if="needsSummary(trip) && trip.visitNote?.sentAt"
            color="primary"
            variant="tonal"
            @click.stop="store.advanceTrip(trip.id)"
          >
            จบงานและส่งสรุป
          </v-btn>
        </div>
      </TripCard>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis mb-8">ยังไม่มีงานที่รับไว้</p>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import TripCard from '@/components/TripCard.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import ThaiIdGate from '@/components/ThaiIdGate.vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import type { Trip } from '@/domain/types'
  import { dayLabel, isOpenStatus, nextActionLabel, packageHasNotes, PROVIDER_THAID, remainText, SELF_CAREGIVER_ID, statusFlow, statusLabel, tripStamp, viewStatus } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const me = computed(() => caregiverById(SELF_CAREGIVER_ID))
  const mine = computed(() => store.trips.filter(trip => trip.caregiverId === SELF_CAREGIVER_ID))
  const requests = computed(() => mine.value.filter(trip => trip.status === 'requested'))
  const active = computed(() =>
    mine.value
      .filter(trip => isOpenStatus(trip.status) && trip.status !== 'requested')
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )
  const schedule = computed(() =>
    mine.value
      .filter(trip => trip.status !== 'cancelled')
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )

  function stepsFor(trip: Trip) {
    return statusFlow(trip.serviceType, trip.packageId).filter(step => step !== 'requested')
  }

  function stepIndex(trip: Trip) {
    return stepsFor(trip).indexOf(viewStatus(trip.status, trip.serviceType))
  }

  function needsSummary(trip: Trip) {
    return packageHasNotes(trip.packageId) && viewStatus(trip.status, trip.serviceType) === 'with_doctor'
  }
</script>

<style scoped>
  .schedule {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .schedule-item {
    display: grid;
    grid-template-columns: 72px 1fr;
    gap: 10px;
  }

  .schedule-when {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    padding-top: 2px;
  }

  .schedule-when strong {
    font-size: 16px;
  }

  .schedule-when span {
    color: #6d6256;
    font-size: 12px;
  }

  .schedule-body {
    border-left: 3px solid #0e6b62;
    background: white;
    border-radius: 0 14px 14px 0;
    padding: 10px 12px;
  }

  .schedule-steps {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }

  .schedule-steps span {
    border-radius: 999px;
    background: #f3eee6;
    color: #8a8178;
    font-size: 11px;
    padding: 2px 8px;
  }

  .schedule-steps .is-done {
    background: #e7f3f1;
    color: #0e6b62;
  }

  .schedule-steps .is-now {
    background: #0e6b62;
    color: white;
  }
</style>
