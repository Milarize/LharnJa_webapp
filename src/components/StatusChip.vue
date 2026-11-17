<template>
  <v-chip :color="statusColor(status)" size="small" variant="flat">
    {{ statusLabel(status, service) }}
  </v-chip>
</template>

<script setup lang="ts">
  import type { ServiceType, TripStatus } from '@/domain/types'
  import { statusColor, statusLabel } from '@/domain/model'

  defineProps<{
    status: TripStatus
    service: ServiceType
  }>()
</script>
