import { createRouter, createWebHistory } from 'vue-router'
import Index from '@/pages/index.vue'
import Home from '@/pages/home.vue'
import Book from '@/pages/book.vue'
import Trips from '@/pages/trips.vue'
import Trip from '@/pages/trip.vue'
import Plans from '@/pages/plans.vue'
import History from '@/pages/history.vue'
import Caregiver from '@/pages/caregiver.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior() {
    return { top: 0 }
  },
  routes: [
    { path: '/', name: 'line', component: Index },
    { path: '/home', name: 'home', component: Home },
    { path: '/book', name: 'book', component: Book },
    { path: '/trips', name: 'trips', component: Trips },
    { path: '/trips/:id', name: 'trip', component: Trip },
    { path: '/packages', name: 'plans', component: Plans },
    { path: '/plans', redirect: { name: 'plans' } },
    { path: '/history', name: 'history', component: History },
    { path: '/caregiver', name: 'caregiver', component: Caregiver },
    { path: '/caregiver/requests', name: 'caregiver-requests', component: Caregiver },
    { path: '/caregiver/jobs', name: 'caregiver-jobs', component: Caregiver },
    { path: '/caregiver/live', name: 'caregiver-live', component: Caregiver },
    { path: '/caregiver/history', name: 'caregiver-history', component: Caregiver },
    { path: '/:pathMatch(.*)*', redirect: '/' },
  ],
})

const titles: Record<string, string> = {
  line: 'หลานจ๋า · เข้าจาก LINE',
  home: 'หน้าแรก · หลานจ๋า',
  book: 'จองเพื่อนดูแล · หลานจ๋า',
  trips: 'นัดหมาย · หลานจ๋า',
  trip: 'สถานะนัด · หลานจ๋า',
  plans: 'แพ็กเกจ · หลานจ๋า',
  history: 'ประวัติ · หลานจ๋า',
  caregiver: 'ตารางงาน · หลานจ๋า',
  'caregiver-requests': 'คำขอใหม่ · หลานจ๋า',
  'caregiver-jobs': 'งานที่รับแล้ว · หลานจ๋า',
  'caregiver-live': 'กำลังดูแล · หลานจ๋า',
  'caregiver-history': 'ประวัติงาน · หลานจ๋า',
}

router.afterEach(to => {
  document.title = titles[String(to.name)] ?? 'หลานจ๋า'
})

export default router
