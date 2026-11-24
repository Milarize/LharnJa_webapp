<template>
  <div class="d-flex flex-column h-100 pa-4">
    <div class="d-flex align-center ga-3">
      <v-avatar color="primary" rounded="lg" size="44">
        <v-icon color="white" icon="mdi-hand-heart" />
      </v-avatar>
      <div>
        <div class="text-title-medium font-weight-bold">หลานจ๋า</div>
        <div class="text-body-small text-medium-emphasis">เพื่อนดูแลไปโรงพยาบาล</div>
      </div>
    </div>

    <v-list class="mt-6" color="primary" density="comfortable" nav>
      <v-list-item
        v-for="item in items"
        :key="item.name"
        :active="isActive(item.name)"
        :prepend-icon="item.icon"
        rounded="lg"
        :title="item.title"
        :to="{ name: item.name }"
      />
    </v-list>

    <v-spacer />

    <v-btn class="mb-2" color="primary" prepend-icon="mdi-presentation-play" variant="tonal" :to="{ path: '/', query: { demo: '1' } }">
      Demo ทั้งสองฝั่ง
    </v-btn>
    <v-btn
      class="mb-2"
      color="primary"
      prepend-icon="mdi-briefcase-outline"
      variant="text"
      :to="{ path: '/', query: { demo: '1', tour: 'provider', side: 'provider' } }"
    >
      Demo ผู้ให้บริการ
    </v-btn>
    <v-btn class="mb-2" prepend-icon="mdi-backup-restore" variant="text" @click="store.resetDemo()">
      รีเซ็ตข้อมูลสาธิต
    </v-btn>
    <p class="text-body-small text-medium-emphasis mb-0">
      ต้นแบบนี้จำลองการจอง ไม่ได้เชื่อม LINE หรือโรงพยาบาลจริง และไม่ใช่คำแนะนำทางการแพทย์
    </p>
  </div>
</template>

<script setup lang="ts">
  import { useShell } from '@/composables/useShell'

  const { items, isActive, store } = useShell()
</script>
