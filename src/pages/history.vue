<template>
  <div>
    <h1 class="display-thai mb-2">ประวัติ</h1>
    <p class="text-body-large text-medium-emphasis mb-6">
      ดูนัดที่เคยใช้ และติดต่อเพื่อนดูแลผ่านช่องทางที่ยืนยันตัวตนแล้ว
    </p>

    <section class="mb-8">
      <h2 class="text-title-large font-weight-medium mb-1">คนที่เคยไปด้วย</h2>
      <p class="text-body-medium text-medium-emphasis mb-3">
        ติดต่อคนเดิมได้ จองซ้ำได้เฉพาะคนที่เคยจองแบบ Plus หรือ Care
      </p>
      <div v-if="companions.length" class="d-flex flex-column ga-3">
        <v-card v-for="item in companions" :key="item.caregiverId" class="pa-4" rounded="md" variant="outlined">
          <div class="d-flex ga-3 align-start">
            <v-avatar size="56">
              <v-img v-if="item.caregiver" :alt="item.caregiver.nickname" cover :src="item.caregiver.photo" />
            </v-avatar>
            <div class="flex-grow-1" style="min-width: 0">
              <div class="text-title-medium font-weight-bold">{{ item.caregiver?.nickname }}</div>
              <div class="text-body-small text-medium-emphasis">{{ item.caregiver?.name }}</div>
              <div class="text-body-medium mt-1">
                เคยพาไป {{ item.count }} นัด · ล่าสุด {{ dayLabel(item.latest.date) }}
              </div>
              <div class="text-body-small text-medium-emphasis">
                {{ tripPlaceName(item.latest) }} · {{ item.latest.elderName }}
              </div>
              <v-chip
                v-if="!item.rebookFrom"
                class="mt-2"
                color="warning"
                size="small"
                variant="tonal"
              >
                Basic อย่างเดียว จองคนเดิมไม่ได้
              </v-chip>
              <div class="d-flex flex-wrap ga-2 mt-3">
                <v-btn
                  prepend-icon="mdi-phone"
                  size="small"
                  variant="outlined"
                  @click="contact(item.caregiver?.nickname ?? 'ผู้ดูแล')"
                >
                  โทร
                </v-btn>
                <v-btn
                  v-if="item.rebookFrom"
                  color="primary"
                  prepend-icon="mdi-calendar-sync"
                  size="small"
                  :to="{ name: 'book', query: { rebook: item.rebookFrom.id } }"
                >
                  จองซ้ำ
                </v-btn>
                <v-btn
                  v-else
                  color="primary"
                  prepend-icon="mdi-calendar-plus"
                  size="small"
                  variant="tonal"
                  :to="{ name: 'book' }"
                >
                  จองใหม่
                </v-btn>
              </div>
            </div>
          </div>
        </v-card>
      </div>
      <v-card v-else class="pa-5" rounded="md" variant="outlined">
        <div class="text-title-medium mb-2">ยังไม่มีประวัติผู้ดูแล</div>
        <p class="text-body-medium text-medium-emphasis mb-4">เมื่อมีนัดที่จบแล้ว คนที่เคยไปด้วยจะโผล่ที่นี่</p>
        <v-btn color="primary" :to="{ name: 'book' }">จองนัดแรก</v-btn>
      </v-card>
    </section>

    <section>
      <h2 class="text-title-large font-weight-medium mb-1">ประวัตินัด</h2>
      <p class="text-body-medium text-medium-emphasis mb-3">นัดที่จบแล้วหรือยกเลิก เรียงจากล่าสุด</p>
      <div v-if="past.length" class="d-flex flex-column ga-3">
        <v-card
          v-for="trip in past"
          :key="trip.id"
          class="pa-4"
          rounded="md"
          variant="outlined"
          @click="openTrip(trip.id)"
        >
          <div class="d-flex justify-space-between align-start ga-3">
            <div style="min-width: 0">
              <StatusChip :service="trip.serviceType" :status="trip.status" />
              <div class="text-title-medium font-weight-bold mt-2">{{ trip.elderName }}</div>
              <div class="text-body-medium">
                {{ dayLabel(trip.date) }} · {{ trip.time }} น. · {{ tripPlaceName(trip) }}
              </div>
              <div class="text-body-small text-medium-emphasis">
                {{ packageLabel(trip.packageId) }} · {{ caregiverName(trip.caregiverId) }}
              </div>
            </div>
            <div class="text-title-medium font-weight-bold flex-shrink-0">{{ baht(trip.price) }}</div>
          </div>
          <div class="d-flex flex-wrap ga-2 mt-3" @click.stop>
            <v-btn
              prepend-icon="mdi-phone"
              size="small"
              variant="tonal"
              @click="contact(caregiverName(trip.caregiverId))"
            >
              โทรหา{{ caregiverName(trip.caregiverId) }}
            </v-btn>
            <v-btn
              v-if="canRebookTrip(trip)"
              color="primary"
              prepend-icon="mdi-calendar-sync"
              size="small"
              :to="{ name: 'book', query: { rebook: trip.id } }"
            >
              จองซ้ำ
            </v-btn>
            <v-chip
              v-else-if="trip.status === 'completed' && !packageAllowsRebook(trip.packageId)"
              color="warning"
              size="small"
              variant="tonal"
            >
              Basic จองคนเดิมไม่ได้
            </v-chip>
            <v-btn size="small" variant="text" :to="{ name: 'trip', params: { id: trip.id } }">
              ดูรายละเอียด
            </v-btn>
          </div>
        </v-card>
      </div>
      <p v-else class="text-body-medium text-medium-emphasis">ยังไม่มีนัดในประวัติ</p>
    </section>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import StatusChip from '@/components/StatusChip.vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import type { CarePackageId } from '@/domain/types'
  import { caregiverName } from '@/domain/match'
  import {
    baht,
    canRebookTrip,
    carePackage,
    dayLabel,
    historyCompanions,
    isOpenStatus,
    packageAllowsRebook,
    tripStamp,
  } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const router = useRouter()

  const mine = computed(() => store.trips.filter(trip => trip.owner === 'me'))
  const past = computed(() =>
    mine.value.filter(trip => !isOpenStatus(trip.status)).sort((a, b) => tripStamp(b).localeCompare(tripStamp(a))),
  )
  const companions = computed(() =>
    historyCompanions(store.trips).map(item => ({
      ...item,
      caregiver: caregiverById(item.caregiverId),
    })),
  )

  function packageLabel(id?: CarePackageId) {
    if (!id) return 'การดูแล'
    const item = carePackage(id)
    return `${item.name} · ${item.lead}`
  }

  function openTrip(id: string) {
    router.push({ name: 'trip', params: { id } })
  }

  function contact(nickname: string) {
    store.notify(`ต้นแบบยังไม่โทรออก ในของจริงจะโทรหา${nickname}ผ่านช่องทางที่ยืนยันตัวตนแล้ว`, false)
  }
</script>
