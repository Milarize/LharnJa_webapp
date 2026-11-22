<template>
  <div>
    <h1 class="display-thai mb-2">นัดหมาย</h1>
    <p class="text-body-large text-medium-emphasis mb-6">รายการของครอบครัวคุณนภา ที่จองจากบัญชี LINE นี้</p>

    <h2 class="text-title-large font-weight-medium mb-3">กำลังจะถึง</h2>
    <div v-if="upcoming.length" class="d-flex flex-column ga-3 mb-8">
      <TripCard v-for="trip in upcoming" :key="trip.id" :trip="trip" />
    </div>
    <v-card v-else class="pa-5 mb-8" rounded="md" variant="outlined">
      <div class="text-title-medium mb-3">ยังไม่มีนัดที่เปิดอยู่</div>
      <v-btn color="primary" :to="{ name: 'book' }">จองเพื่อนดูแล</v-btn>
    </v-card>

    <div class="d-flex align-center justify-space-between ga-3 mb-3">
      <h2 class="text-title-large font-weight-medium mb-0">ที่ผ่านมา</h2>
      <v-btn prepend-icon="mdi-history" size="small" variant="text" :to="{ name: 'history' }">ดูประวัติ</v-btn>
    </div>
    <div v-if="pastPreview.length" class="d-flex flex-column ga-3">
      <TripCard v-for="trip in pastPreview" :key="trip.id" :trip="trip">
        <div class="d-flex flex-wrap ga-2 mt-3">
          <v-btn
            v-if="canRebookTrip(trip)"
            color="primary"
            prepend-icon="mdi-calendar-sync"
            size="small"
            variant="tonal"
            @click.stop="rebook(trip.id)"
          >
            จองซ้ำกับ{{ caregiverName(trip.caregiverId) }}
          </v-btn>
          <v-btn size="small" variant="text" :to="{ name: 'history' }" @click.stop>
            ติดต่อจากประวัติ
          </v-btn>
        </div>
      </TripCard>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis">ยังไม่มีนัดที่จบแล้ว</p>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import TripCard from '@/components/TripCard.vue'
  import { useRouter } from 'vue-router'
  import { caregiverName } from '@/domain/match'
  import { canRebookTrip, isOpenStatus, tripStamp } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const router = useRouter()

  function rebook(id: string) {
    router.push({ name: 'book', query: { rebook: id } })
  }
  const mine = computed(() => store.trips.filter(trip => trip.owner === 'me'))
  const upcoming = computed(() =>
    mine.value.filter(trip => isOpenStatus(trip.status)).sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )
  const past = computed(() =>
    mine.value.filter(trip => !isOpenStatus(trip.status)).sort((a, b) => tripStamp(b).localeCompare(tripStamp(a))),
  )
  const pastPreview = computed(() => past.value.slice(0, 3))
</script>
