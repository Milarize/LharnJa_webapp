<template>
  <span class="verified-mark" :class="{ off: !ok }" :title="caption">
    <v-icon :aria-label="caption" :icon="ok ? 'mdi-check-decagram' : 'mdi-account-alert-outline'" role="img" :size="size" />
  </span>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  const props = withDefaults(
    defineProps<{
      ok?: boolean
      size?: number | string
      label?: string
    }>(),
    { ok: true, size: 22, label: '' },
  )

  const caption = computed(() => props.label || (props.ok ? 'ยืนยันตัวตนแล้ว' : 'ยังไม่ยืนยันตัวตน'))
</script>

<style scoped>
  .verified-mark {
    display: inline-flex;
    flex: none;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border-radius: 999px;
    background: #fff;
    color: #2563eb;
    box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.18);
  }

  .verified-mark.off {
    color: #8a8176;
    box-shadow: inset 0 0 0 1px rgba(36, 28, 22, 0.12);
  }
</style>
