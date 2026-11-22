<template>
  <v-card
    class="pa-4"
    :color="selected ? 'primary' : undefined"
    :role="selectable ? 'button' : undefined"
    rounded="md"
    :tabindex="selectable ? 0 : undefined"
    :variant="selected ? 'tonal' : 'outlined'"
    @click="onCard"
    @keydown.enter="onCard"
  >
    <div class="d-flex justify-space-between align-start ga-3">
      <div>
        <div class="text-title-medium font-weight-medium">{{ item.name }}</div>
        <div class="text-body-small text-medium-emphasis">{{ item.lead }}</div>
      </div>
      <div class="text-title-medium font-weight-bold">{{ baht(item.price) }}</div>
    </div>
    <button class="detail-link" type="button" @click.stop="open = true">ดูรายละเอียด</button>
  </v-card>

  <v-dialog v-model="open" max-width="440">
    <v-card class="pa-5" rounded="lg">
      <div class="d-flex justify-space-between align-start ga-3">
        <div>
          <div class="text-title-large font-weight-medium">{{ item.name }}</div>
          <div class="text-body-medium text-medium-emphasis">{{ item.lead }}</div>
        </div>
        <div class="text-title-medium font-weight-bold">{{ baht(item.price) }}</div>
      </div>
      <ul class="package-points mt-4 mb-0">
        <li v-for="point in item.points" :key="point">{{ point }}</li>
      </ul>
      <div v-if="item.profession" class="mt-4">
        <div class="text-label-large mb-1">วิชาชีพ</div>
        <div class="text-body-medium">{{ PACKAGE_PROFESSIONS.join(' · ') }}</div>
      </div>
      <div v-if="item.language" class="mt-3">
        <div class="text-label-large mb-1">ภาษา</div>
        <div class="text-body-medium">{{ PACKAGE_LANGUAGES.join(' · ') }}</div>
      </div>
      <div class="d-flex justify-end ga-2 mt-5">
        <v-btn variant="text" @click="open = false">ปิด</v-btn>
        <v-btn v-if="selectable" color="primary" @click="choose">เลือกอันนี้</v-btn>
      </div>
    </v-card>
  </v-dialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import type { CarePackageId } from '@/domain/types'
  import { baht, CARE_PACKAGES, PACKAGE_LANGUAGES, PACKAGE_PROFESSIONS } from '@/domain/model'

  const props = defineProps<{
    item: (typeof CARE_PACKAGES)[number]
    selectable?: boolean
    selected?: boolean
  }>()

  const emit = defineEmits<{ select: [id: CarePackageId] }>()
  const open = ref(false)

  function onCard() {
    if (props.selectable) emit('select', props.item.id)
    else open.value = true
  }

  function choose() {
    emit('select', props.item.id)
    open.value = false
  }
</script>

<style scoped>
  .detail-link {
    margin-top: 10px;
    padding: 0;
    border: 0;
    background: transparent;
    color: #0e6b62;
    font: inherit;
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
  }

  .package-points {
    padding-left: 1.2rem;
  }
</style>
