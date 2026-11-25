<template>
  <div v-if="shown.length" class="d-flex align-center ga-2">
    <span v-for="item in shown" :key="item.label" class="badge-mark" :title="item.label">
      <v-icon :aria-label="item.label" :icon="item.icon" role="img" size="22" />
    </span>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = defineProps<{ badges?: string[] }>()

  const catalog = [
    { match: 'ตรวจประวัติแล้ว', icon: 'mdi-shield-check', label: 'ตรวจประวัติแล้ว' },
    { match: 'อบรมดูแลผู้สูงอายุ', icon: 'mdi-school-outline', label: 'อบรมดูแลผู้สูงอายุ' },
  ]

  const shown = computed(() => catalog.filter(item => props.badges?.includes(item.match)))
</script>

<style scoped>
  .badge-mark {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #f6f1e8;
    color: #0e6b62;
  }
</style>
