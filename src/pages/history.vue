<template>
  <div>
    <h1 class="display-thai mb-6">ประวัติ</h1>

    <div v-if="tracks.length" class="d-flex flex-column ga-8">
      <section v-for="group in tracks" :key="group.elder.id">
        <div class="d-flex align-center ga-3 mb-4">
          <v-avatar :color="group.elder.tone" size="48">
            <span class="text-title-medium">{{ group.elder.initial }}</span>
          </v-avatar>
          <div>
            <h2 class="text-title-large">{{ group.elder.name }}</h2>
            <div class="text-body-medium">{{ group.elder.relation }} · {{ group.elder.age }} ปี</div>
          </div>
        </div>

          <v-card class="care-sheet pa-4 pa-md-5" rounded="md" variant="outlined">
          <v-timeline class="care-track" density="comfortable" side="end" truncate-line="both">
            <v-timeline-item
              v-for="trip in group.trips"
              :key="trip.id"
              :dot-color="dotColor(trip)"
              fill-dot
              :icon="dotIcon(trip)"
              :size="isOpenStatus(trip.status) ? 'default' : 'small'"
            >
              <template #opposite>
                <button class="track-open track-when" type="button" @click="openTrip(trip.id)">
                  <span>{{ dayLabel(trip.date) }}</span>
                  <span class="track-time">{{ trip.time }} น.</span>
                </button>
              </template>
              <button class="track-open" type="button" @click="openTrip(trip.id)">
                <span class="track-when track-when-inline">
                  <span>{{ dayLabel(trip.date) }}</span>
                  <span class="track-time">{{ trip.time }} น.</span>
                </span>
                <div v-if="isOpenStatus(trip.status) || trip.status === 'cancelled'" class="d-flex flex-wrap align-center ga-2 mb-1">
                  <v-chip v-if="isOpenStatus(trip.status)" color="primary" size="small" variant="flat">
                    {{ statusLabel(trip.status, trip.serviceType) }}
                  </v-chip>
                  <v-chip v-else-if="trip.status === 'cancelled'" color="error" size="small" variant="flat">
                    ยกเลิก
                  </v-chip>
                </div>
                <div class="track-place d-flex align-start ga-2 text-body-large">
                  <v-icon color="coral" icon="mdi-hospital-building" size="20" />
                  <span>{{ trip.department }} · {{ tripPlaceName(trip) }}</span>
                </div>
                <div v-if="trip.visitNote" class="track-facts">
                  <div><v-icon icon="mdi-stethoscope" size="20" />{{ trip.visitNote.doctorSaid }}</div>
                  <div><v-icon icon="mdi-pill" size="20" />{{ trip.visitNote.medicines }}</div>
                  <div><v-icon icon="mdi-arrow-right-circle-outline" size="20" />{{ trip.visitNote.nextVisit }}</div>
                  <div v-if="trip.visitNote.caution">
                    <v-icon icon="mdi-alert-outline" size="20" />{{ trip.visitNote.caution }}
                  </div>
                </div>
              </button>
              <ReviewNote :text="trip.review" />
              <div class="d-flex align-center flex-wrap ga-2 mt-2" @click.stop>
                <v-avatar size="32">
                  <v-img
                    v-if="caregiverById(trip.caregiverId)?.photo"
                    :alt="caregiverName(trip.caregiverId)"
                    cover
                    :src="caregiverById(trip.caregiverId)?.photo"
                  />
                </v-avatar>
                <span class="text-body-medium font-weight-medium">{{ caregiverName(trip.caregiverId) }}</span>
                <VerifiedMark v-if="caregiverVerified(caregiverById(trip.caregiverId)?.badges)" />
                <v-spacer />
                <v-btn
                  :aria-label="`โทรหา${caregiverName(trip.caregiverId)}`"
                  icon="mdi-phone"
                  size="small"
                  :title="`โทรหา${caregiverName(trip.caregiverId)}`"
                  variant="outlined"
                  @click="contact(caregiverName(trip.caregiverId))"
                />
                <v-btn
                  v-if="canRebookTrip(trip)"
                  aria-label="จองซ้ำ"
                  color="primary"
                  icon="mdi-calendar-sync"
                  size="small"
                  title="จองซ้ำ"
                  :to="{ name: 'book', query: { rebook: trip.id } }"
                />
                <v-icon
                  v-else-if="trip.status === 'completed' && !packageAllowsRebook(trip.packageId)"
                  aria-label="จองคนเดิมไม่ได้"
                  icon="mdi-lock-outline"
                  size="20"
                  title="จองคนเดิมไม่ได้"
                />
              </div>
            </v-timeline-item>
          </v-timeline>
        </v-card>
      </section>
    </div>

    <v-card v-else class="pa-5" rounded="md" variant="outlined">
      <h2 class="text-title-large mb-2">ยังไม่มีการรักษาให้ติดตาม</h2>
      <v-btn class="mt-2" color="primary" :to="{ name: 'book' }">จองนัดแรก</v-btn>
    </v-card>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import ReviewNote from '@/components/ReviewNote.vue'
  import VerifiedMark from '@/components/VerifiedMark.vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import type { Trip } from '@/domain/types'
  import { caregiverName } from '@/domain/match'
  import {
    canRebookTrip,
    caregiverVerified,
    dayLabel,
    isOpenStatus,
    packageAllowsRebook,
    statusLabel,
    tripStamp,
  } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const router = useRouter()

  const tracks = computed(() => {
    const trips = store.trips
      .filter(trip => trip.owner === 'me')
      .sort((a, b) => tripStamp(b).localeCompare(tripStamp(a)))
    const order: string[] = []
    for (const trip of trips) {
      if (!order.includes(trip.elderId)) order.push(trip.elderId)
    }
    return order
      .map(id => ({
        elder: store.elders.find(item => item.id === id),
        trips: trips.filter(trip => trip.elderId === id),
      }))
      .filter((group): group is { elder: NonNullable<typeof group.elder>, trips: Trip[] } => Boolean(group.elder))
  })

  function dotColor(trip: Trip) {
    if (trip.status === 'cancelled') return 'error'
    return 'primary'
  }

  function dotIcon(trip: Trip) {
    if (trip.status === 'cancelled') return 'mdi-close'
    if (isOpenStatus(trip.status)) return 'mdi-hospital-marker'
    return 'mdi-check'
  }

  function openTrip(id: string) {
    router.push({ name: 'trip', params: { id } })
  }

  function contact(nickname: string) {
    store.notify(`ต้นแบบยังไม่โทรออก ในของจริงจะโทรหา${nickname}ผ่านช่องทางที่ยืนยันตัวตนแล้ว`, false)
  }
</script>

<style scoped>
  .care-sheet {
    container-type: inline-size;
  }

  .track-open {
    display: block;
    width: 100%;
    min-width: 0;
    padding: 0;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .track-place {
    min-width: 0;
  }

  .track-place span {
    min-width: 0;
  }

  .care-track :deep(.v-timeline-item__opposite) {
    min-width: 8.75rem;
  }

  .track-when {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    color: #0e6b62;
    font-size: 1.125rem;
    font-weight: 700;
    line-height: 1.3;
    white-space: nowrap;
  }

  .track-time {
    color: #3f3832;
    font-size: 1rem;
    font-weight: 600;
  }

  .track-when-inline {
    display: none;
    flex-direction: row;
    align-items: baseline;
    gap: 8px;
    margin-bottom: 4px;
  }

  .care-track :deep(.v-timeline-item__body) {
    min-width: 0;
  }

  @container (max-width: 560px) {
    .care-track {
      grid-template-columns: 2.75rem minmax(0, 1fr);
    }

    .care-track :deep(.v-timeline-item__opposite) {
      display: none;
    }

    .track-when-inline {
      display: flex;
    }
  }

  .track-facts {
    display: flex;
    flex-direction: column;
    gap: 6px;
    margin-top: 10px;
  }

  .track-facts div {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    font-size: 1.0625rem;
    line-height: 1.45;
  }

  .track-facts :deep(.v-icon) {
    margin-top: 2px;
    color: #0e6b62;
  }

  .care-track :deep(.v-timeline-divider__before),
  .care-track :deep(.v-timeline-divider__after) {
    width: 3px;
    background: #0e6b62;
  }
</style>
