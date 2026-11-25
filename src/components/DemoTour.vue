<template>
  <div v-if="open" class="demo-tour" aria-live="polite">
    <div class="demo-caption">
      <div class="demo-caption-meta">
        <span class="demo-badge">Live Demo</span>
        <span>{{ index + 1 }} / {{ total }} · {{ scene.title }}</span>
      </div>
      <p class="demo-say">{{ scene.say }}</p>
      <v-progress-linear
        class="mt-3"
        color="primary"
        height="4"
        :model-value="progress"
        rounded
      />
    </div>

    <div class="demo-controls">
      <v-btn
        aria-label="ฉากก่อนหน้า"
        icon="mdi-skip-previous"
        size="small"
        variant="text"
        @click="prev()"
      />
      <v-btn
        :aria-label="playing ? 'หยุดชั่วคราว' : 'เล่นต่อ'"
        color="primary"
        :icon="playing ? 'mdi-pause' : 'mdi-play'"
        rounded="lg"
        @click="toggle()"
      />
      <v-btn
        aria-label="ฉากถัดไป"
        icon="mdi-skip-next"
        size="small"
        variant="text"
        @click="next()"
      />
      <v-menu location="top">
        <template #activator="{ props }">
          <v-btn
            v-bind="props"
            aria-label="เลือกฉาก"
            icon="mdi-playlist-play"
            size="small"
            variant="text"
          />
        </template>
        <v-list density="compact" max-height="280" nav>
          <v-list-item
            v-for="(item, i) in scenes"
            :key="item.id"
            :active="i === index"
            :subtitle="item.say"
            :title="`${i + 1}. ${item.title}`"
            @click="goTo(i)"
          />
        </v-list>
      </v-menu>
      <v-btn
        aria-label="เริ่มใหม่"
        icon="mdi-replay"
        size="small"
        variant="text"
        @click="start()"
      />
      <v-btn
        aria-label="ปิดโหมดเดโม"
        icon="mdi-close"
        size="small"
        variant="text"
        @click="close()"
      />
    </div>
  </div>

  <div v-else class="demo-launcher-group">
    <v-btn
      color="primary"
      prepend-icon="mdi-presentation-play"
      rounded="lg"
      size="small"
      @click="start()"
    >
      Demo ทั้งสองฝั่ง
    </v-btn>
    <v-btn
      color="primary"
      prepend-icon="mdi-briefcase-outline"
      rounded="lg"
      size="small"
      variant="tonal"
      @click="startProvider()"
    >
      Demo ผู้ให้บริการ
    </v-btn>
  </div>
</template>

<script setup lang="ts">
  import { onMounted, onUnmounted } from 'vue'
  import { useDemoTour } from '@/composables/useDemoTour'

  const {
    open,
    index,
    playing,
    scene,
    total,
    progress,
    scenes,
    start,
    startProvider,
    close,
    toggle,
    next,
    prev,
    goTo,
  } = useDemoTour()

  function onKey(event: KeyboardEvent) {
    if (!open.value) return
    const tag = (event.target as HTMLElement | null)?.tagName
    if (tag === 'INPUT' || tag === 'TEXTAREA') return
    if (event.code === 'Space') {
      event.preventDefault()
      toggle()
    } else if (event.code === 'ArrowRight') {
      event.preventDefault()
      next()
    } else if (event.code === 'ArrowLeft') {
      event.preventDefault()
      prev()
    } else if (event.code === 'Escape') {
      close()
    }
  }

  onMounted(() => window.addEventListener('keydown', onKey))
  onUnmounted(() => window.removeEventListener('keydown', onKey))
</script>

<style scoped>
  .demo-tour {
    position: fixed;
    z-index: 2400;
    left: 16px;
    right: 16px;
    bottom: 18px;
    display: flex;
    flex-direction: column;
    gap: 10px;
    pointer-events: none;
    max-width: 720px;
    margin-inline: auto;
  }

  .demo-caption,
  .demo-controls {
    pointer-events: auto;
  }

  .demo-caption {
    background: rgba(20, 28, 26, 0.92);
    color: #f4f7f5;
    border-radius: 18px;
    padding: 14px 16px 12px;
    box-shadow: 0 18px 40px rgba(20, 28, 26, 0.28);
    backdrop-filter: blur(10px);
  }

  .demo-caption-meta {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    font-size: 0.9375rem;
    opacity: 0.85;
    margin-bottom: 6px;
  }

  .demo-badge {
    display: inline-flex;
    align-items: center;
    padding: 2px 8px;
    border-radius: 999px;
    background: rgba(14, 107, 98, 0.9);
    color: white;
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .demo-say {
    margin: 0;
    font-size: 1.05rem;
    line-height: 1.45;
    font-family: var(--v-font-heading);
  }

  .demo-controls {
    align-self: center;
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 8px;
    border-radius: 999px;
    background: rgba(255, 255, 255, 0.94);
    box-shadow: 0 10px 28px rgba(20, 28, 26, 0.18);
  }

  .demo-launcher-group {
    position: fixed;
    z-index: 2300;
    right: 16px;
    bottom: 108px;
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
  }

  .demo-launcher-group .v-btn {
    box-shadow: 0 12px 28px rgba(14, 107, 98, 0.22);
  }

  @media (min-width: 960px) {
    .demo-launcher-group {
      bottom: 24px;
    }
  }
</style>
