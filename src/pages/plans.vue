<template>
  <div>
    <h1 class="text-headline-small mb-2">การดูแล</h1>
    <p class="text-body-large mb-6">
      เทียบ 3 แบบด้านล่าง แล้วเลือกตอนจอง จ่ายครั้งเดียว
    </p>
    <PackageCompare :items="CARE_PACKAGES" />
    <v-btn class="mt-6" color="primary" prepend-icon="mdi-calendar-plus" size="large" :to="{ name: 'book' }">
      ไปเลือกตอนจอง
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import PackageCompare from '@/components/PackageCompare.vue'
  import { CARE_PACKAGES } from '@/domain/model'
</script>
