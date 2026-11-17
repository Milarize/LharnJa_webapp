<template>
  <v-app>
    <template v-if="!isLine">
      <v-navigation-drawer v-if="mdAndUp" border="e" color="surface" permanent width="288">
        <ShellMenu />
      </v-navigation-drawer>

      <v-app-bar v-if="!mdAndUp" border="b" color="surface" density="comfortable" flat>
        <v-app-bar-title class="text-title-medium font-weight-bold">หลานจ๋า</v-app-bar-title>
        <template #append>
          <v-btn
            aria-label="รีเซ็ตข้อมูลสาธิต"
            icon="mdi-backup-restore"
            variant="text"
            @click="store.resetDemo()"
          />
        </template>
      </v-app-bar>
    </template>

    <v-main :class="{ 'line-screen': isLine }">
      <v-container v-if="!isLine" class="py-4 py-md-8" max-width="920">
        <v-sheet class="d-flex align-center ga-2 px-3 py-2 mb-4" color="line" rounded="lg">
          <v-icon color="white" icon="mdi-chat" size="18" />
          <span class="text-body-medium text-white">เปิดจาก LINE ของคุณนภา</span>
          <v-spacer />
          <v-btn color="white" size="small" variant="text" :to="{ name: 'line' }">แชท</v-btn>
        </v-sheet>
        <v-tabs
          :model-value="store.role"
          align-tabs="center"
          class="mb-6"
          color="primary"
          grow
          @update:model-value="onRole"
        >
          <v-tab value="family">คนใช้บริการ</v-tab>
          <v-tab value="caregiver">ผู้ให้บริการ</v-tab>
        </v-tabs>
        <router-view />
      </v-container>
      <router-view v-else />
    </v-main>

    <v-bottom-navigation
      v-if="showBottom"
      :model-value="activeNav"
      bg-color="surface"
      color="primary"
      grow
      height="74"
    >
      <v-btn v-for="item in items" :key="item.name" :to="{ name: item.name }" :value="item.name">
        <v-icon :icon="item.icon" />
        <span class="text-label-medium">{{ item.title }}</span>
      </v-btn>
    </v-bottom-navigation>

    <v-snackbar
      :key="store.toastKey"
      color="surface"
      location="top end"
      :model-value="!!store.toast"
      rounded="lg"
      :timeout="3800"
      @update:model-value="onToast"
    >
      <div class="d-flex align-start ga-3">
        <v-avatar v-if="store.toast?.line" color="line" size="32">
          <v-icon color="white" icon="mdi-chat" size="18" />
        </v-avatar>
        <div>
          <div v-if="store.toast?.line" class="text-label-medium text-line">LINE · หลานจ๋า</div>
          <div class="text-body-medium">{{ store.toast?.text }}</div>
        </div>
      </div>
    </v-snackbar>
  </v-app>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import ShellMenu from '@/components/ShellMenu.vue'
  import { useShell } from '@/composables/useShell'

  const { mdAndUp } = useDisplay()
  const { store, route, items, activeNav, onRole } = useShell()
  const isLine = computed(() => route.name === 'line')
  const showBottom = computed(() => !mdAndUp.value && !isLine.value && route.name !== 'book')

  watch(
    () => route.name,
    name => {
      if (name === 'caregiver') store.role = 'caregiver'
      if (name === 'home' || name === 'book' || name === 'trips' || name === 'plans') store.role = 'family'
    },
    { immediate: true },
  )

  function onToast(open: boolean) {
    if (!open) store.clearToast()
  }
</script>
