<template>
  <div>
    <h1 class="text-headline-small font-weight-medium mb-2">แพ็กเกจ</h1>
    <p class="text-body-large text-medium-emphasis mb-6">
      เทียบ Basic, Standard และ Premium แล้วกดสมัครแพ็กเกจที่ต้องการ
    </p>
    <ProviderTiers />
  </div>
</template>

<script setup lang="ts">
  import ProviderTiers from '@/components/ProviderTiers.vue'
</script>
