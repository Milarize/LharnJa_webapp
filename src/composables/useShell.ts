import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { Role } from '@/domain/types'
import { useCareStore } from '@/stores/care'

export interface NavItem {
  name: 'home' | 'book' | 'trips' | 'history' | 'plans' | 'caregiver'
  title: string
  icon: string
}

const familyNav: NavItem[] = [
  { name: 'home', title: 'หน้าแรก', icon: 'mdi-home' },
  { name: 'book', title: 'จอง', icon: 'mdi-calendar-plus' },
  { name: 'trips', title: 'นัดหมาย', icon: 'mdi-clipboard-text-outline' },
  { name: 'history', title: 'ประวัติ', icon: 'mdi-history' },
  { name: 'plans', title: 'แพ็กเกจ', icon: 'mdi-star-circle-outline' },
]

const caregiverNav: NavItem[] = [
  { name: 'caregiver', title: 'งานของฉัน', icon: 'mdi-briefcase-outline' },
]

export function useShell() {
  const store = useCareStore()
  const route = useRoute()
  const router = useRouter()
  const items = computed(() => (store.role === 'caregiver' ? caregiverNav : familyNav))

  function isActive(name: string) {
    if (name === 'trips') return route.name === 'trips' || route.name === 'trip'
    return route.name === name
  }

  function onRole(value: unknown) {
    if (value !== 'family' && value !== 'caregiver') return
    const role = value as Role
    if (role === store.role) return
    store.role = role
    router.push({ name: role === 'family' ? 'home' : 'caregiver' })
  }

  const activeNav = computed(() => {
    if (route.name === 'trip' && store.role === 'family') return 'trips'
    return typeof route.name === 'string' ? route.name : ''
  })

  return { store, route, router, items, isActive, onRole, activeNav }
}
