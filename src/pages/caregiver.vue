<template>
  <ThaiIdGate
    v-if="!store.isVerified(PROVIDER_THAID.id)"
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
        <span class="text-label-large">ยืนยันตัวตนด้วย ThaiD แล้ว</span>
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
        <v-btn
          v-if="nextActionLabel(trip.status, trip.serviceType)"
          class="mt-4"
          color="primary"
          @click.stop="store.advanceTrip(trip.id)"
        >
          {{ nextActionLabel(trip.status, trip.serviceType) }}
        </v-btn>
      </TripCard>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis mb-8">ยังไม่มีงานที่รับไว้</p>

    <p class="text-body-medium text-medium-emphasis mb-4">{{ planLabel }}</p>

    <div v-if="noted.length" class="d-flex flex-column ga-4">
      <FamilyNote v-for="trip in noted" :key="trip.id" :trip="trip" />
    </div>
    <p v-else class="text-body-medium text-medium-emphasis">รับงานแล้วจึงจดสรุปที่โรงพยาบาลได้</p>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import TripCard from '@/components/TripCard.vue'
  import FamilyNote from '@/components/FamilyNote.vue'
  import ThaiIdGate from '@/components/ThaiIdGate.vue'
  import { caregiverById } from '@/domain/data'
  import { isOpenStatus, nextActionLabel, PROVIDER_THAID, PROVIDER_TIERS, remainText, SELF_CAREGIVER_ID, tripStamp } from '@/domain/model'
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
  const planLabel = computed(() => {
    const name = PROVIDER_TIERS.find(item => item.id === store.providerTier)?.name
    return name ? `ครอบครัวสมัครแพ็กเกจ ${name} ไว้แล้ว` : 'ครอบครัวยังไม่ได้สมัครแพ็กเกจ'
  })
  const noted = computed(() =>
    mine.value
      .filter(trip => trip.status !== 'requested' && trip.status !== 'cancelled')
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )
</script>
