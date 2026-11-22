<template>
  <v-card class="pa-4 lift" rounded="md" variant="outlined" @click="open">
    <div class="d-flex justify-space-between align-start ga-3">
      <div class="flex-grow-1" style="min-width: 0">
        <StatusChip :service="trip.serviceType" :status="trip.status" />
        <div class="text-title-medium font-weight-bold mt-2">{{ trip.elderName }}</div>
        <div class="text-body-medium text-medium-emphasis">
          {{ dayLabel(trip.date) }} · {{ trip.time }} น.
        </div>
        <div class="text-body-medium">
          {{ hospital?.short || trip.pickup || 'สถานพยาบาล' }} · {{ trip.department }}
        </div>
        <div v-if="audience === 'caregiver'" class="text-body-small text-medium-emphasis mt-1">
          ครอบครัว{{ trip.familyName }} · {{ serviceLabel }} · {{ SERVICES[trip.serviceType].hours }}
        </div>
        <p v-if="audience === 'caregiver'" class="text-body-small mt-2 mb-0">
          รับครั้งนี้ {{ baht(trip.price) }} เหมาจ่าย
          งานคืออยู่ดูแลในสถานพยาบาล ไม่ถือเงิน ไม่ติดต่อผู้สูงอายุส่วนตัว และไม่ทำหัตถการ
        </p>
        <div v-else class="text-body-small text-medium-emphasis mt-1">
          {{ caregiverName(trip.caregiverId) }} · {{ serviceLabel }}
        </div>
        <p v-if="trip.status === 'requested' && audience !== 'caregiver'" class="text-body-small mt-2 mb-0">
          เหลือ {{ remainText(trip.respondBy, store.clock) }} หากไม่กดรับ ระบบส่งต่อให้คนถัดไป ยังไม่คิดเงิน
        </p>
      </div>
      <div v-if="audience !== 'caregiver'" class="text-title-medium font-weight-bold flex-shrink-0" style="white-space: nowrap">{{ baht(trip.price) }}</div>
    </div>
    <slot />
  </v-card>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useRouter } from 'vue-router'
  import type { Trip } from '@/domain/types'
  import { hospitalById } from '@/domain/data'
  import { caregiverName } from '@/domain/match'
  import { baht, dayLabel, remainText, SERVICES } from '@/domain/model'
  import { useCareStore } from '@/stores/care'
  import StatusChip from '@/components/StatusChip.vue'

  const props = defineProps<{
    trip: Trip
    audience?: 'family' | 'caregiver'
  }>()

  const router = useRouter()
  const store = useCareStore()
  const hospital = computed(() => hospitalById(props.trip.hospitalId))
  const serviceLabel = computed(() => SERVICES[props.trip.serviceType].label)

  function open() {
    router.push({ name: 'trip', params: { id: props.trip.id } })
  }
</script>
