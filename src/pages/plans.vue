<template>
  <div>
    <h1 class="text-headline-small font-weight-medium mb-2">แพ็กเกจ</h1>
    <p class="text-body-large text-medium-emphasis mb-6">
      เติมต่อการจองครั้งเดียว ไม่มีการสมัครรายเดือน ผู้ดูแลไปพบที่โรงพยาบาลแล้วอยู่ดูแลระหว่างพบแพทย์
    </p>
    <div class="d-flex flex-column ga-4">
      <v-card v-for="item in CARE_PACKAGES" :key="item.id" class="pa-4" rounded="md" variant="outlined">
        <div class="d-flex justify-space-between align-start ga-3">
          <div>
            <div class="text-title-medium font-weight-medium">{{ item.name }}</div>
            <div class="text-body-small text-medium-emphasis">{{ item.lead }}</div>
          </div>
          <div class="text-title-medium font-weight-bold">{{ baht(item.price) }}</div>
        </div>
        <ul class="package-points mt-3 mb-0">
          <li v-for="point in item.points" :key="point">{{ point }}</li>
        </ul>
        <div v-if="item.profession" class="mt-4">
          <div class="text-label-large mb-1">วิชาชีพที่เลือกได้</div>
          <div class="text-body-medium">{{ PACKAGE_PROFESSIONS.join(' · ') }}</div>
        </div>
        <div v-if="item.language" class="mt-3">
          <div class="text-label-large mb-1">ภาษาที่เลือกได้</div>
          <div class="text-body-medium">{{ PACKAGE_LANGUAGES.join(' · ') }}</div>
        </div>
      </v-card>
    </div>
    <v-btn class="mt-6" color="primary" prepend-icon="mdi-calendar-plus" :to="{ name: 'book' }">
      ไปเลือกแพ็กเกจตอนจอง
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import { baht, CARE_PACKAGES, PACKAGE_LANGUAGES, PACKAGE_PROFESSIONS } from '@/domain/model'
</script>

<style scoped>
  .package-points {
    padding-left: 1.2rem;
  }
</style>
