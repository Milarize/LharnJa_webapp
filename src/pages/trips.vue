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

    <h2 class="text-title-large font-weight-medium mb-3">ที่ผ่านมา</h2>
    <div v-if="past.length" class="d-flex flex-column ga-3">
      <TripCard v-for="trip in past" :key="trip.id" :trip="trip">
        <v-btn
          v-if="trip.status === 'completed' && trip.packageId !== 'p1'"
          class="mt-3"
          color="primary"
          prepend-icon="mdi-calendar-sync"
          variant="tonal"
          @click.stop="rebook(trip.id)"
        >
          จองซ้ำกับ{{ caregiverName(trip.caregiverId) }}
        </v-btn>
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
  import { isOpenStatus, tripStamp } from '@/domain/model'
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
</script>
