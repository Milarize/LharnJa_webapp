import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { DEMO_SCENES, PROVIDER_START_INDEX, type DemoScene } from '@/demo/scenes'
import { FAMILY, PROVIDER_THAID } from '@/domain/model'
import { useCareStore } from '@/stores/care'

const STORAGE_FLAG = 'care-companion-demo-tour'

function readFlag() {
  try {
    return localStorage.getItem(STORAGE_FLAG) === '1'
  } catch {
    return false
  }
}

export function useDemoTour() {
  const store = useCareStore()
  const router = useRouter()
  const route = useRoute()

  const open = ref(route.query.demo === '1' || readFlag())
  const index = ref(0)
  const playing = ref(false)
  const busy = ref(false)
  let timer = 0

  const scene = computed<DemoScene>(() => DEMO_SCENES[index.value] ?? DEMO_SCENES[0])
  const total = DEMO_SCENES.length
  const progress = computed(() => ((index.value + 1) / total) * 100)
  const providerStart = PROVIDER_START_INDEX >= 0 ? PROVIDER_START_INDEX : total - 1

  function persist(value: boolean) {
    try {
      if (value) localStorage.setItem(STORAGE_FLAG, '1')
      else localStorage.removeItem(STORAGE_FLAG)
    } catch {
      // ignore
    }
  }

  function clearTimer() {
    if (timer) {
      window.clearTimeout(timer)
      timer = 0
    }
  }

  async function applyPrep(prep?: DemoScene['prep']) {
    if (!prep) return
    if (prep === 'fresh') {
      store.resetDemo(true)
      return
    }
    if (prep === 'provider-gate') {
      store.resetDemo(true)
      store.role = 'caregiver'
      return
    }
    if (prep === 'family' || prep === 'family-verified') {
      store.role = 'family'
      if (prep === 'family-verified' && !store.isVerified(FAMILY.memberId)) {
        store.verifyThaid(FAMILY.memberId, true)
      }
      return
    }
    if (prep === 'caregiver') {
      store.role = 'caregiver'
      if (!store.isVerified(FAMILY.memberId)) store.verifyThaid(FAMILY.memberId, true)
      if (!store.isVerified(PROVIDER_THAID.id)) store.verifyThaid(PROVIDER_THAID.id, true)
    }
  }

  async function goTo(i: number) {
    const next = DEMO_SCENES[i]
    if (!next || busy.value) return
    busy.value = true
    clearTimer()
    index.value = i
    try {
      await applyPrep(next.prep)
      await router.push({
        name: next.route,
        params: next.params,
        query: { demo: '1', ...(next.query ?? {}) },
      })
    } finally {
      busy.value = false
      if (playing.value) scheduleNext()
    }
  }

  function scheduleNext() {
    clearTimer()
    if (!playing.value || !open.value) return
    const hold = scene.value.holdMs ?? 5000
    timer = window.setTimeout(() => {
      if (index.value >= total - 1) {
        playing.value = false
        return
      }
      void goTo(index.value + 1)
    }, hold)
  }

  function beginAt(startIndex: number) {
    open.value = true
    persist(true)
    playing.value = true
    void goTo(startIndex)
  }

  function start() {
    beginAt(0)
  }

  function startProvider() {
    beginAt(providerStart)
  }

  function stop() {
    playing.value = false
    clearTimer()
  }

  function close() {
    stop()
    open.value = false
    persist(false)
    const query = { ...route.query }
    delete query.demo
    delete query.side
    void router.replace({ query })
  }

  function play() {
    if (!open.value) {
      start()
      return
    }
    playing.value = true
    scheduleNext()
  }

  function pause() {
    playing.value = false
    clearTimer()
  }

  function toggle() {
    if (playing.value) pause()
    else play()
  }

  function next() {
    if (index.value >= total - 1) {
      playing.value = false
      return
    }
    void goTo(index.value + 1)
  }

  function prev() {
    if (index.value <= 0) return
    void goTo(index.value - 1)
  }

  watch(
    () => route.query.demo,
    value => {
      if (value === '1') {
        open.value = true
        persist(true)
      }
    },
  )

  onMounted(() => {
    if (route.query.demo === '1' && route.query.tour === 'provider') {
      beginAt(providerStart)
    }
  })

  onUnmounted(clearTimer)

  return {
    open,
    index,
    playing,
    busy,
    scene,
    total,
    progress,
    scenes: DEMO_SCENES,
    providerStart,
    start,
    startProvider,
    stop,
    close,
    play,
    pause,
    toggle,
    next,
    prev,
    goTo,
  }
}
