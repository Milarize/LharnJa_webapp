<template>
  <v-btn-toggle
    :model-value="store.role"
    class="role-switch"
    color="primary"
    density="comfortable"
    divided
    mandatory
    rounded="lg"
    variant="outlined"
    @update:model-value="onRole"
  >
    <v-btn class="flex-grow-1" value="family">คนใช้บริการ</v-btn>
    <v-btn class="flex-grow-1" value="caregiver">ผู้ให้บริการ</v-btn>
  </v-btn-toggle>
</template>

<script setup lang="ts">
  import { useShell } from '@/composables/useShell'

  const { store, onRole } = useShell()
</script>

<style scoped>
  .role-switch {
    width: 100%;
  }
</style>
