<template>
  <v-app>
    <template v-if="!isLine">
      <v-navigation-drawer v-if="mdAndUp" border="e" color="surface" permanent width="288">
        <ShellMenu />
      </v-navigation-drawer>

      <v-app-bar v-if="!mdAndUp" border="b" color="surface" density="comfortable" flat>
        <v-app-bar-title class="text-title-medium font-weight-bold app-brand">หลานจ๋า</v-app-bar-title>
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

    <v-main :class="{ 'line-screen': isLine, 'has-dock': showBottom }">
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

    <nav v-if="showBottom && centerItem" class="dock" aria-label="เมนูหลัก">
      <div class="dock-side">
        <router-link
          v-for="item in leftItems"
          :key="item.name"
          class="dock-link"
          :class="{ 'is-active': activeNav === item.name }"
          :aria-current="activeNav === item.name ? 'page' : undefined"
          :to="{ name: item.name }"
        >
          <v-icon :icon="item.icon" size="24" />
          <span>{{ item.title }}</span>
        </router-link>
      </div>
      <router-link
        class="dock-book"
        :class="{ 'is-active': activeNav === centerItem.name }"
        :aria-current="activeNav === centerItem.name ? 'page' : undefined"
        :aria-label="centerItem.title"
        :to="{ name: centerItem.name }"
      >
        <span class="dock-book-face">
          <v-icon :icon="centerItem.icon" size="30" />
          <span v-if="centerItem.name === 'caregiver-requests' && requestCount" class="dock-count">{{ requestCount }}</span>
        </span>
        <span class="dock-book-label">{{ centerItem.title }}</span>
      </router-link>
      <div class="dock-side">
        <router-link
          v-for="item in rightItems"
          :key="item.name"
          class="dock-link"
          :class="{ 'is-active': activeNav === item.name }"
          :aria-current="activeNav === item.name ? 'page' : undefined"
          :to="{ name: item.name }"
        >
          <v-icon :icon="item.icon" size="24" />
          <span>{{ item.title }}</span>
        </router-link>
      </div>
    </nav>
    <nav v-else-if="showBottom" class="dock dock-plain" aria-label="เมนูหลัก">
      <router-link
        v-for="item in items"
        :key="item.name"
        class="dock-link"
        :class="{ 'is-active': activeNav === item.name }"
        :aria-current="activeNav === item.name ? 'page' : undefined"
        :to="{ name: item.name }"
      >
        <v-icon :icon="item.icon" size="24" />
        <span>{{ item.title }}</span>
      </router-link>
    </nav>

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

    <DemoTour />
  </v-app>
</template>

<script setup lang="ts">
  import { computed, watch } from 'vue'
  import { useDisplay } from 'vuetify'
  import DemoTour from '@/components/DemoTour.vue'
  import ShellMenu from '@/components/ShellMenu.vue'
  import { useShell } from '@/composables/useShell'

  const { mdAndUp } = useDisplay()
  const { store, route, items, activeNav, onRole, requestCount } = useShell()
  const isLine = computed(() => route.name === 'line')
  const showBottom = computed(() => !mdAndUp.value && !isLine.value && route.name !== 'book')
  const centerItem = computed(() => items.value.find(item => item.center))
  const sideItems = computed(() => items.value.filter(item => !item.center))
  const aroundCenter = computed(() => {
    const index = items.value.findIndex(item => item.center)
    if (index < 0) return { left: items.value, right: [] as typeof items.value }
    const left = items.value.slice(0, index)
    const right = items.value.slice(index + 1)
    if (left.length === right.length || left.length + 1 === right.length) return { left, right }
    const mid = Math.ceil(sideItems.value.length / 2)
    return { left: sideItems.value.slice(0, mid), right: sideItems.value.slice(mid) }
  })
  const leftItems = computed(() => aroundCenter.value.left)
  const rightItems = computed(() => aroundCenter.value.right)

  watch(
    () => route.name,
    name => {
      if (typeof name === 'string' && name.startsWith('caregiver')) store.role = 'caregiver'
      if (name === 'home' || name === 'book' || name === 'trips' || name === 'history' || name === 'plans') {
        store.role = 'family'
      }
    },
    { immediate: true },
  )

  function onToast(open: boolean) {
    if (!open) store.clearToast()
  }
</script>

<style scoped>
  .has-dock {
    padding-bottom: calc(92px + env(safe-area-inset-bottom)) !important;
  }

  .dock {
    position: fixed;
    z-index: 1004;
    right: 0;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: flex-end;
    height: calc(74px + env(safe-area-inset-bottom));
    padding: 0 6px env(safe-area-inset-bottom);
    overflow: visible;
    background: #fffcf8;
    border-top: 1px solid #b7a99a;
    box-shadow: 0 -10px 28px rgba(36, 28, 22, 0.08);
  }

  .dock-side {
    display: flex;
    flex: 1;
    align-items: flex-end;
    justify-content: space-around;
    min-width: 0;
  }

  .dock-plain {
    align-items: center;
  }

  .dock-plain .dock-link {
    flex: 1;
  }

  .dock-count {
    position: absolute;
    top: -4px;
    right: -4px;
    display: grid;
    place-items: center;
    min-width: 22px;
    height: 22px;
    padding: 0 6px;
    border-radius: 999px;
    background: #a16207;
    color: #fff;
    font-size: 0.75rem;
    font-weight: 700;
  }

  .dock-link,
  .dock-book {
    color: #5c534c;
    font-size: 0.875rem;
    font-weight: 600;
    line-height: 1.15;
    text-decoration: none;
  }

  .dock-link {
    display: flex;
    flex-direction: column;
    align-items: center;
    align-self: end;
    justify-content: center;
    gap: 2px;
    min-width: 0;
    height: 64px;
    border-radius: 16px;
  }

  .dock-link span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dock-link.is-active {
    color: var(--care-green);
    font-weight: 700;
  }

  .dock-book {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: flex-end;
    width: 84px;
    padding-bottom: 6px;
  }

  .dock-book-face {
    position: absolute;
    top: -34px;
    left: 50%;
    display: grid;
    place-items: center;
    width: 68px;
    height: 68px;
    border: 4px solid #efe6d8;
    border-radius: 50%;
    background: var(--care-green);
    color: #fff;
    box-shadow: 0 10px 18px rgba(14, 107, 98, 0.34);
    transform: translateX(-50%);
  }

  .dock-book-label {
    margin-top: 2px;
    color: var(--care-green);
    font-size: 0.875rem;
    font-weight: 700;
  }

  .dock :deep(.v-icon) {
    color: inherit;
  }

  .dock-link:focus-visible,
  .dock-book:focus-visible .dock-book-face {
    outline: 2px solid var(--care-green);
    outline-offset: 2px;
  }
</style>
