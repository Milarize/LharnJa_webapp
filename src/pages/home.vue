<template>
  <div>
    <p class="text-body-medium text-medium-emphasis mb-1">{{ greeting() }}</p>
    <h1 class="display-thai d-flex align-center ga-2 mb-6">
      {{ FAMILY.lineName }}
      <VerifiedMark :ok="thaidReady" />
    </h1>

    <v-card v-if="nextTrip" class="pa-5 mb-6" color="primary" rounded="md">
      <div class="text-label-large mb-2" style="opacity: .85">นัดถัดไป</div>
      <div class="text-headline-small font-weight-medium mb-1">{{ nextTrip.elderName }}</div>
      <div class="text-body-large mb-1">
        {{ dayLabel(nextTrip.date) }} · {{ nextTrip.time }} น. · {{ tripPlaceName(nextTrip, 'โรงพยาบาล') }}
      </div>
      <div class="d-flex align-center ga-2 text-body-medium mb-4" style="opacity: .9">
        <span>{{ nextTrip.department }} · {{ caregiverName(nextTrip.caregiverId) }}</span>
        <VerifiedMark v-if="caregiverVerified(caregiverById(nextTrip.caregiverId)?.badges)" />
      </div>
      <v-chip class="hero-chip" size="small" variant="flat">
        {{ statusLabel(nextTrip.status, nextTrip.serviceType) }}
      </v-chip>
      <div class="d-flex flex-wrap ga-2 mt-5">
        <v-btn color="white" :to="{ name: 'trip', params: { id: nextTrip.id } }">ดูสถานะ</v-btn>
        <v-btn color="white" variant="outlined" :to="{ name: 'book' }">จองนัดใหม่</v-btn>
      </div>
    </v-card>

    <v-card v-else class="pa-5 mb-6" rounded="md" variant="outlined">
      <div class="text-title-large font-weight-medium mb-2">ยังไม่มีนัดที่กำลังจะถึง</div>
      <p class="text-body-medium text-medium-emphasis mb-4">
        เริ่มจากเลือกผู้สูงอายุ โรงพยาบาล และเพื่อนดูแลที่ไปด้วยกันทั้งนัด
      </p>
      <v-btn color="primary" prepend-icon="mdi-calendar-plus" :to="{ name: 'book' }">จองเพื่อนดูแล</v-btn>
    </v-card>

    <section v-if="companions.length" class="mb-8">
      <h2 class="text-title-large font-weight-medium mb-3">จองซ้ำคนเดิม</h2>
      <v-row>
        <v-col v-for="item in companions" :key="item.caregiverId" cols="12">
          <v-card class="pa-4" rounded="md" variant="outlined">
            <div class="d-flex flex-wrap ga-4 align-center">
              <v-avatar size="64">
                <v-img v-if="item.caregiver" :alt="item.caregiver.nickname" cover :src="item.caregiver.photo" />
              </v-avatar>
              <div class="flex-grow-1" style="min-width: 220px">
                <div class="d-flex align-center ga-2">
                  <div class="text-title-medium font-weight-bold">{{ item.caregiver?.nickname }}</div>
                  <VerifiedMark v-if="caregiverVerified(item.caregiver?.badges)" />
                </div>
                <div class="text-body-medium">
                  {{ item.count }} นัด · {{ item.latest.elderName }}
                </div>
                <ReviewNote :text="item.latest.review" />
              </div>
              <v-btn
                color="primary"
                prepend-icon="mdi-calendar-sync"
                :to="{ name: 'book', query: { rebook: item.rebookFrom?.id ?? item.latest.id } }"
              >
                จองซ้ำกับ{{ item.caregiver?.nickname }}
              </v-btn>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </section>

    <div class="d-flex flex-wrap ga-3 mb-8">
      <v-btn color="primary" prepend-icon="mdi-calendar-plus" size="large" :to="{ name: 'book' }">
        จองเพื่อนดูแล
      </v-btn>
      <v-btn prepend-icon="mdi-clipboard-text-outline" size="large" variant="outlined" :to="{ name: 'trips' }">
        นัดทั้งหมด
      </v-btn>
      <v-btn prepend-icon="mdi-history" size="large" variant="outlined" :to="{ name: 'history' }">
        ประวัติ
      </v-btn>
    </div>

    <h2 class="text-title-large font-weight-medium mb-3">คนในครอบครัว</h2>
    <v-row>
      <v-col v-for="elder in store.elders" :key="elder.id" cols="12" sm="6">
        <v-card class="pa-4 h-100" rounded="md" variant="outlined">
          <div class="d-flex ga-3">
            <v-avatar :color="elder.tone" size="48">
              <span class="text-title-medium">{{ elder.initial }}</span>
            </v-avatar>
            <div>
              <div class="text-title-medium font-weight-bold">{{ elder.name }}</div>
              <div class="text-body-medium text-medium-emphasis">{{ elder.relation }} · {{ elder.age }} ปี</div>
            </div>
          </div>
          <div class="text-body-medium mt-3">{{ elder.conditions }}</div>
          <div class="text-body-small text-medium-emphasis">{{ elder.mobility }}</div>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import { caregiverName } from '@/domain/match'
  import ReviewNote from '@/components/ReviewNote.vue'
  import VerifiedMark from '@/components/VerifiedMark.vue'
  import { caregiverVerified, dayLabel, FAMILY, greeting, isOpenStatus, repeatCompanions, statusLabel, tripStamp } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const thaidReady = computed(() => store.isVerified(FAMILY.memberId))

  const nextTrip = computed(() =>
    store.trips
      .filter(trip => trip.owner === 'me' && isOpenStatus(trip.status))
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b)))[0],
  )

  const companions = computed(() =>
    repeatCompanions(store.trips).map(item => ({
      ...item,
      caregiver: caregiverById(item.caregiverId),
      upcoming: store.trips
        .filter(trip => trip.owner === 'me' && trip.caregiverId === item.caregiverId && isOpenStatus(trip.status))
        .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b)))[0],
    })),
  )

</script>

<style scoped>
  .hero-chip {
    background: #fff !important;
    color: #084842 !important;
  }

  .hero-chip :deep(.v-chip__content) {
    color: #084842 !important;
  }

</style>
