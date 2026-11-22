<template>
  <div>
    <h1 class="text-headline-small font-weight-medium mb-2">การดูแล</h1>
    <p class="text-body-large text-medium-emphasis mb-6">
      เลือกแบบที่ต้องการ จ่ายครั้งเดียวตอนจอง
    </p>
    <div class="d-flex flex-column ga-4">
      <PackageChoice v-for="item in CARE_PACKAGES" :key="item.id" :item="item" />
    </div>
    <v-btn class="mt-6" color="primary" prepend-icon="mdi-calendar-plus" :to="{ name: 'book' }">
      ไปเลือกตอนจอง
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import PackageChoice from '@/components/PackageChoice.vue'
  import { CARE_PACKAGES } from '@/domain/model'
</script>
