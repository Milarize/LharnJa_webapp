<template>
  <div v-if="text" class="review-note" role="note">
    <v-icon aria-label="รีวิว" icon="mdi-comment-quote-outline" role="img" size="22" />
    <span>{{ text }}</span>
  </div>
</template>

<script setup lang="ts">
  defineProps<{ text?: string }>()
</script>

<style scoped>
  .review-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    margin-top: 8px;
    padding: 8px 10px;
    border-radius: 12px;
    background: #f3f6fb;
    color: #243044;
    font-size: 1rem;
    line-height: 1.45;
  }

  .review-note :deep(.v-icon) {
    margin-top: 1px;
    color: #2563eb;
  }
</style>
