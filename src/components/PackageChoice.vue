<template>
  <article
    class="compare-card"
    :class="[`tone-${item.id}`, { selected, pick: selectable }]"
    :data-package-id="item.id"
    :style="{ gridRow: `span ${span}` }"
    @click="onCard"
  >
    <header class="compare-head">
      <div class="text-headline-small font-weight-bold">{{ item.name }}</div>
      <div class="text-body-large">{{ item.lead }}</div>
      <div class="price">{{ baht(item.price) }}</div>
      <div class="text-body-medium">จ่ายครั้งเดียวตอนจอง</div>
    </header>
    <div
      v-for="row in PACKAGE_COMPARE"
      :key="row.label"
      class="compare-row"
      :class="{ off: row.values[item.id] === false, diff: diff.includes(row.label) }"
    >
      <v-icon aria-hidden="true" :icon="iconOf(row.values[item.id])" size="24" />
      <div>
        <div class="text-body-large font-weight-medium">{{ row.label }}</div>
        <div v-if="typeof row.values[item.id] === 'string'" class="text-title-medium font-weight-bold">
          {{ row.values[item.id] }}
        </div>
        <span v-if="typeof row.values[item.id] === 'boolean'" class="sr-only">
          {{ row.values[item.id] ? 'มี' : 'ไม่มี' }}
        </span>
      </div>
    </div>
    <div v-if="selectable" class="compare-foot">
      <v-btn
        block
        :color="selected ? 'primary' : undefined"
        size="large"
        :variant="selected ? 'flat' : 'outlined'"
        @click.stop="emit('select', item.id)"
      >
        {{ selected ? 'เลือกอยู่' : 'เลือกอันนี้' }}
      </v-btn>
    </div>
  </article>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import type { CarePackageId } from '@/domain/types'
  import { baht, CARE_PACKAGES, PACKAGE_COMPARE } from '@/domain/model'

  const props = defineProps<{
    item: (typeof CARE_PACKAGES)[number]
    selectable?: boolean
    selected?: boolean
    diff?: string[]
  }>()

  const emit = defineEmits<{ select: [id: CarePackageId] }>()
  const diff = computed(() => props.diff ?? [])
  const span = computed(() => 1 + PACKAGE_COMPARE.length + (props.selectable ? 1 : 0))

  function iconOf(value: boolean | string) {
    if (value === true) return 'mdi-check-circle'
    if (value === false) return 'mdi-minus-circle-outline'
    return 'mdi-calendar-clock'
  }

  function onCard() {
    if (props.selectable) emit('select', props.item.id)
  }
</script>

<style scoped>
  .compare-card {
    display: grid;
    grid-template-rows: subgrid;
    min-width: 0;
    overflow: hidden;
    scroll-margin-top: 188px;
    border: 1.5px solid #6f6256;
    border-radius: 16px;
    background: #fffcf8;
  }

  .compare-card.pick {
    cursor: pointer;
  }

  .compare-card.selected {
    border-color: #0e6b62;
    box-shadow: inset 0 0 0 1px #0e6b62;
  }

  .tone-p1 .compare-head {
    background: #f6f0e6;
  }

  .tone-p2 .compare-head {
    background: #e7f3f1;
  }

  .tone-p3 .compare-head {
    background: #e8f0ea;
  }

  .compare-head {
    padding: 20px 18px 16px;
  }

  .price {
    margin-top: 12px;
    color: #241c16;
    font-family: var(--v-font-body);
    font-size: 2rem;
    font-weight: 700;
    line-height: 1.15;
  }

  .compare-row {
    display: flex;
    gap: 10px;
    align-items: flex-start;
    padding: 14px 16px;
    border-top: 1px solid rgba(36, 28, 22, 0.08);
  }

  .compare-row.diff {
    background: rgba(14, 107, 98, 0.07);
  }

  .compare-row :deep(.v-icon) {
    margin-top: 2px;
    color: #0e6b62;
  }

  .compare-row.off {
    color: #4e4842;
  }

  .compare-row.off :deep(.v-icon) {
    color: #b3aa9e;
  }

  .compare-foot {
    padding: 14px 16px 16px;
    border-top: 1px solid rgba(36, 28, 22, 0.08);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }
</style>
