import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { liveCareTrip, SELF_CAREGIVER_ID } from '@/domain/model'
import type { Role } from '@/domain/types'
import { useCareStore } from '@/stores/care'

export interface NavItem {
  name:
    | 'home'
    | 'book'
    | 'trips'
    | 'history'
    | 'plans'
    | 'caregiver'
    | 'caregiver-requests'
    | 'caregiver-jobs'
    | 'caregiver-live'
    | 'caregiver-history'
  title: string
  icon: string
  center?: boolean
}

const familyNav: NavItem[] = [
  { name: 'home', title: 'หน้าแรก', icon: 'mdi-home' },
  { name: 'book', title: 'จอง', icon: 'mdi-calendar-plus', center: true },
  { name: 'trips', title: 'นัดหมาย', icon: 'mdi-clipboard-text-outline' },
  { name: 'history', title: 'ประวัติ', icon: 'mdi-history' },
  { name: 'plans', title: 'แพ็กเกจ', icon: 'mdi-star-circle-outline' },
]

const caregiverNav: NavItem[] = [
  { name: 'caregiver', title: 'ตาราง', icon: 'mdi-calendar-week' },
  { name: 'caregiver-requests', title: 'คำขอ', icon: 'mdi-inbox-arrow-down', center: true },
  { name: 'caregiver-live', title: 'กำลังดูแล', icon: 'mdi-heart-pulse' },
  { name: 'caregiver-jobs', title: 'งานที่รับ', icon: 'mdi-clipboard-check-outline' },
  { name: 'caregiver-history', title: 'ประวัติ', icon: 'mdi-history' },
]

export function useShell() {
  const store = useCareStore()
  const route = useRoute()
  const router = useRouter()
  const items = computed(() => (store.role === 'caregiver' ? caregiverNav : familyNav))

  const requestCount = computed(
    () => store.trips.filter(trip => trip.caregiverId === SELF_CAREGIVER_ID && trip.status === 'requested').length,
  )

  function isActive(name: string) {
    return activeNav.value === name
  }

  function onRole(value: unknown) {
    if (value !== 'family' && value !== 'caregiver') return
    const role = value as Role
    if (role === store.role) return
    store.role = role
    router.push({ name: role === 'family' ? 'home' : 'caregiver' })
  }

  const activeNav = computed(() => {
    if (route.name === 'trip') {
      if (store.role === 'family') return 'trips'
      const trip = store.trips.find(item => item.id === String(route.params.id))
      if (trip?.status === 'requested') return 'caregiver-requests'
      if (trip?.status === 'completed' || trip?.status === 'cancelled') return 'caregiver-history'
      if (trip && liveCareTrip(store.trips, SELF_CAREGIVER_ID)?.id === trip.id) return 'caregiver-live'
      return 'caregiver-jobs'
    }
    return typeof route.name === 'string' ? route.name : ''
  })

  return { store, route, router, items, isActive, onRole, activeNav, requestCount }
}
