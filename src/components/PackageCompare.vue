<template>
  <div class="compare-block" :style="{ '--cols': String(items.length) }">
    <nav class="compare-index" :aria-label="`แพ็กเกจ ${items.length} แบบ`">
      <button
        v-for="(item, index) in items"
        :key="item.id"
        class="index-card"
        :aria-current="viewed === item.id ? 'true' : undefined"
        :class="{ on: viewed === item.id }"
        type="button"
        @click="focusItem(item.id)"
      >
        <span class="index-no">{{ index + 1 }}</span>
        <span class="index-name">{{ item.name }}</span>
        <span class="index-price">{{ baht(item.price) }}</span>
      </button>
    </nav>
    <div class="compare-wrap">
      <div ref="grid" class="compare-grid">
        <PackageChoice
          v-for="item in items"
          :key="item.id"
          :diff="diffs"
          :item="item"
          :selectable="selectable"
          :selected="selected === item.id"
          @select="emit('select', $event)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import type { CarePackageId } from '@/domain/types'
  import { baht, CARE_PACKAGES, PACKAGE_COMPARE } from '@/domain/model'
  import PackageChoice from '@/components/PackageChoice.vue'

  const props = defineProps<{
    items: (typeof CARE_PACKAGES)[number][]
    selectable?: boolean
    selected?: CarePackageId
  }>()

  const emit = defineEmits<{ select: [id: CarePackageId] }>()
  const grid = ref<HTMLElement | null>(null)
  const viewed = ref<CarePackageId>(props.selected ?? props.items[0]?.id ?? 'p1')
  let observer: IntersectionObserver | null = null

  watch(
    () => props.selected,
    id => {
      if (id) viewed.value = id
    },
  )

  function focusItem(id: CarePackageId) {
    viewed.value = id
    if (props.selectable) emit('select', id)
    grid.value?.querySelector<HTMLElement>(`[data-package-id="${id}"]`)?.scrollIntoView({
      behavior: 'smooth',
      block: 'start',
    })
  }

  onMounted(() => {
    observer = new IntersectionObserver(
      entries => {
        const hit = entries
          .filter(entry => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0]
        const id = (hit?.target as HTMLElement | undefined)?.dataset.packageId
        if (id) viewed.value = id as CarePackageId
      },
      { threshold: [0.35, 0.6] },
    )
    grid.value?.querySelectorAll<HTMLElement>('[data-package-id]').forEach(node => observer?.observe(node))
  })

  onUnmounted(() => observer?.disconnect())

  const diffs = computed(() => {
    const ids = props.items.map(item => item.id)
    return PACKAGE_COMPARE
      .filter(row => new Set(ids.map(id => String(row.values[id]))).size > 1)
      .map(row => row.label)
  })
</script>

<style scoped>
  .compare-block {
    container-type: inline-size;
  }

  .compare-index {
    display: none;
  }

  .index-card {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 2px;
    min-width: 0;
    padding: 10px 10px 12px;
    border: 1.5px solid #6f6256;
    border-radius: 14px;
    background: #fffcf8;
    color: inherit;
    font: inherit;
    text-align: left;
    cursor: pointer;
  }

  .index-card.on {
    border-color: #0e6b62;
    background: #e7f3f1;
    box-shadow: inset 0 0 0 1px #0e6b62;
  }

  .index-no {
    display: grid;
    place-items: center;
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #0e6b62;
    color: #fff;
    font-size: 0.95rem;
    font-weight: 700;
  }

  .index-name {
    color: #0e6b62;
    font-size: 1.05rem;
    font-weight: 700;
    line-height: 1.2;
  }

  .index-price {
    color: #241c16;
    font-size: 0.95rem;
    font-weight: 700;
    line-height: 1.3;
  }

  @container (max-width: 680px) {
    .compare-index {
      position: sticky;
      top: var(--v-layout-top, 0px);
      z-index: 3;
      display: grid;
      grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
      gap: 8px;
      margin-bottom: 14px;
      padding: 8px 0 10px;
      background: #efe6d8;
    }
  }

  .compare-grid {
    display: grid;
    grid-template-columns: repeat(var(--cols), minmax(0, 1fr));
    column-gap: 16px;
    row-gap: 16px;
  }

  @container (max-width: 680px) {
    .compare-grid {
      grid-template-columns: 1fr;
    }
  }
</style>
