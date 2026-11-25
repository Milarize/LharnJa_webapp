<template>
  <ThaiIdGate
    v-if="!store.isVerified(PROVIDER_THAID.id)"
    kind="provider"
    detail="ทำครั้งเดียวตอนเริ่มรับงาน ครั้งถัดไปเปิดแอปแล้วดูงานได้เลย"
    :masked-id="PROVIDER_THAID.maskedId"
    :name="PROVIDER_THAID.name"
    :relation="PROVIDER_THAID.relation"
    @confirm="store.verifyThaid(PROVIDER_THAID.id)"
  />
  <div v-else>
    <v-card v-if="section === 'schedule'" class="pa-5 mb-6" color="primary" rounded="md">
      <div class="d-flex align-center ga-3">
        <v-avatar size="72">
          <v-img v-if="me" :alt="me.nickname" cover :src="me.photo" />
        </v-avatar>
        <div>
          <div class="d-flex align-center ga-2">
            <div class="text-headline-small font-weight-medium">{{ me?.nickname }}</div>
            <VerifiedMark />
          </div>
          <div class="d-flex align-center flex-wrap ga-3 text-body-medium mt-1" style="opacity: .95">
            <span class="d-inline-flex align-center ga-1"><v-icon color="gold" icon="mdi-star" size="20" />{{ me?.rating }}</span>
            <span class="d-inline-flex align-center ga-1"><v-icon icon="mdi-comment-quote-outline" size="20" />{{ me?.reviews }}</span>
            <span class="d-inline-flex align-center ga-1"><v-icon icon="mdi-briefcase-outline" size="20" />{{ me?.years }}</span>
          </div>
        </div>
      </div>
      <BadgeMarks class="mt-3" :badges="me?.badges" />
    </v-card>

    <template v-if="section === 'schedule'">
    <h2 class="text-title-large font-weight-medium mb-3">ตารางงานของฉัน</h2>
    <div class="teams mb-8">
      <div class="teams-nav">
        <v-btn aria-label="อาทิตย์ก่อน" icon="mdi-chevron-left" size="small" variant="text" @click="shiftWeek(-1)" />
        <div class="teams-range">
          <strong>{{ viewingThisWeek ? 'อาทิตย์นี้' : weekLabel }}</strong>
          <span v-if="viewingThisWeek">{{ weekLabel }}</span>
          <button v-else class="teams-back" type="button" @click="weekStart = startOfWeek(new Date())">กลับอาทิตย์นี้</button>
        </div>
        <v-btn aria-label="อาทิตย์หน้า" icon="mdi-chevron-right" size="small" variant="text" @click="shiftWeek(1)" />
      </div>
      <div class="teams-scroll">
        <div class="teams-head">
          <div></div>
          <div v-for="day in calendarDays" :key="day.iso" class="teams-date" :class="{ 'is-today': day.today }">
            <span>{{ day.weekday }}</span>
            <strong>{{ day.number }}</strong>
          </div>
        </div>
        <div class="teams-grid" :style="{ height: `${gridHours.length * HOUR}px` }">
          <div class="teams-times">
            <span v-for="hour in gridHours" :key="hour">{{ pad(hour) }}:00</span>
          </div>
          <div v-for="day in calendarDays" :key="day.iso" class="teams-col" :class="{ 'is-today': day.today }">
            <i v-for="hour in gridHours" :key="hour" class="teams-line"></i>
            <router-link
              v-for="block in day.blocks"
              :key="block.trip.id"
              class="teams-event"
              :class="`is-${block.trip.status}`"
              :style="{ top: `${block.top}px`, height: `${block.height}px` }"
              :to="{ name: 'trip', params: { id: block.trip.id } }"
            >
              <strong>{{ block.trip.elderName }}</strong>
              <span class="teams-when"><span>{{ block.trip.time }}</span><span class="teams-dash">–</span><span>{{ block.end }}</span></span>
              <span class="teams-place">{{ tripPlaceName(block.trip) }}</span>
            </router-link>
          </div>
        </div>
      </div>
    </div>
    </template>

    <template v-else-if="section === 'requests'">
      <h2 class="text-title-large font-weight-medium mb-3">คำขอใหม่</h2>
      <div v-if="requests.length" class="d-flex flex-column ga-3 mb-8">
        <TripCard v-for="trip in requests" :key="trip.id" audience="caregiver" tone="request" :trip="trip">
          <div class="d-flex flex-wrap ga-2 mt-4">
            <v-btn color="primary" @click.stop="store.acceptTrip(trip.id)">รับงาน</v-btn>
            <v-btn variant="text" @click.stop="store.declineTrip(trip.id)">ปฏิเสธ</v-btn>
          </div>
          <p class="text-body-small mt-3 mb-0">
            เหลือ {{ remainText(trip.respondBy, store.clock) }} หากไม่กดรับหรือกดปฏิเสธ โปรแกรมส่งงานต่อให้คนอื่น
            คุณไม่ต้องไปและไม่ได้รับค่าตอบแทน
          </p>
        </TripCard>
      </div>
      <p v-else class="text-body-medium text-medium-emphasis mb-8">ไม่มีคำขอที่รออยู่</p>
    </template>

    <template v-else-if="section === 'live'">
      <h2 class="text-title-large font-weight-medium mb-3">กำลังดูแล</h2>
      <article v-if="live" class="live-job mb-8">
        <div class="live-kicker">
          <v-icon icon="mdi-heart-pulse" size="22" />
          กำลังดำเนินการวันนี้
        </div>
        <StatusChip class="mt-3" :service="live.serviceType" :status="live.status" />
        <h3 class="text-headline-small mt-3 mb-1">{{ live.elderName }}</h3>
        <p class="text-body-large mb-1">{{ dayLabel(live.date) }} · {{ live.time }} น.</p>
        <p class="text-body-medium mb-4">{{ tripPlaceName(live) }} · {{ live.department }}</p>
        <ol class="live-steps">
          <li
            v-for="(step, index) in liveSteps"
            :key="step"
            :class="{ done: index < liveIndex, now: index === liveIndex }"
          >
            {{ statusLabel(step, live.serviceType) }}
          </li>
        </ol>
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            v-if="needsSummary(live)"
            color="primary"
            :to="{ name: 'trip', params: { id: live.id } }"
          >
            ไปสรุปให้ลูกหลาน
          </v-btn>
          <v-btn
            v-else-if="nextActionLabel(live.status, live.serviceType, live.packageId)"
            color="primary"
            @click="store.advanceTrip(live.id)"
          >
            {{ nextActionLabel(live.status, live.serviceType, live.packageId) }}
          </v-btn>
        </div>
      </article>
      <p v-else class="text-body-medium text-medium-emphasis mb-8">ตอนนี้ไม่มีงานที่กำลังดูแล</p>
    </template>

    <template v-else-if="section === 'jobs'">
    <div v-if="store.lineNotices.length" class="d-flex flex-column ga-2 mb-6">
      <h2 class="text-title-large font-weight-medium">แจ้งเตือนถึงครอบครัว</h2>
      <v-alert
        v-for="item in [...store.lineNotices].reverse()"
        :key="item.id"
        icon="mdi-bell-ring-outline"
        type="success"
        variant="tonal"
      >
        ส่งทาง LINE แล้ว · {{ item.text }}
      </v-alert>
    </div>

    <h2 class="text-title-large font-weight-medium mb-3">งานที่รับแล้ว</h2>
    <div v-if="active.length" class="d-flex flex-column ga-3 mb-8">
      <TripCard v-for="trip in active" :key="trip.id" audience="caregiver" tone="accepted" :trip="trip">
        <div class="d-flex flex-wrap ga-2 mt-4">
          <v-btn
            v-if="needsSummary(trip)"
            color="primary"
            :to="{ name: 'trip', params: { id: trip.id } }"
            @click.stop
          >
            ไปสรุปให้ลูกหลาน
          </v-btn>
          <v-btn
            v-else-if="nextActionLabel(trip.status, trip.serviceType, trip.packageId)"
            color="primary"
            @click.stop="store.advanceTrip(trip.id)"
          >
            {{ nextActionLabel(trip.status, trip.serviceType, trip.packageId) }}
          </v-btn>
          <v-btn
            v-if="needsSummary(trip) && trip.visitNote?.sentAt"
            color="primary"
            variant="tonal"
            @click.stop="store.advanceTrip(trip.id)"
          >
            จบงานและส่งสรุป
          </v-btn>
        </div>
      </TripCard>
    </div>
    <p v-else class="text-body-medium text-medium-emphasis mb-8">ยังไม่มีงานที่รับไว้</p>
    </template>

    <template v-else>
      <h2 class="text-title-large font-weight-medium mb-3">ประวัติงาน</h2>
      <div v-if="past.length" class="d-flex flex-column ga-3 mb-8">
        <TripCard v-for="trip in past" :key="trip.id" audience="caregiver" :trip="trip" />
      </div>
      <p v-else class="text-body-medium text-medium-emphasis mb-8">ยังไม่มีงานที่จบแล้ว</p>
    </template>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import BadgeMarks from '@/components/BadgeMarks.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import ThaiIdGate from '@/components/ThaiIdGate.vue'
  import TripCard from '@/components/TripCard.vue'
  import VerifiedMark from '@/components/VerifiedMark.vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import type { Trip } from '@/domain/types'
  import { dayLabel, isoOffset, isOpenStatus, liveCareTrip, nextActionLabel, packageHasNotes, PROVIDER_THAID, remainText, SELF_CAREGIVER_ID, statusFlow, statusLabel, tripStamp, viewStatus } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const route = useRoute()
  const section = computed(() => {
    if (route.name === 'caregiver-requests') return 'requests'
    if (route.name === 'caregiver-live') return 'live'
    if (route.name === 'caregiver-jobs') return 'jobs'
    if (route.name === 'caregiver-history') return 'history'
    return 'schedule'
  })
  const me = computed(() => caregiverById(SELF_CAREGIVER_ID))
  const mine = computed(() => store.trips.filter(trip => trip.caregiverId === SELF_CAREGIVER_ID))
  const requests = computed(() => mine.value.filter(trip => trip.status === 'requested'))
  const active = computed(() =>
    mine.value
      .filter(trip => isOpenStatus(trip.status) && trip.status !== 'requested')
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )
  const live = computed(() => liveCareTrip(store.trips, SELF_CAREGIVER_ID))
  const liveSteps = computed(() =>
    live.value ? statusFlow(live.value.serviceType, live.value.packageId).filter(step => step !== 'requested') : [],
  )
  const liveIndex = computed(() =>
    live.value ? liveSteps.value.indexOf(viewStatus(live.value.status, live.value.serviceType)) : -1,
  )
  const past = computed(() =>
    mine.value
      .filter(trip => trip.status === 'completed' || trip.status === 'cancelled')
      .sort((a, b) => tripStamp(b).localeCompare(tripStamp(a))),
  )
  const schedule = computed(() =>
    mine.value
      .filter(trip => trip.status !== 'cancelled')
      .sort((a, b) => tripStamp(a).localeCompare(tripStamp(b))),
  )

  const HOUR = 48
  const GRID_START = 8

  function startOfWeek(date: Date) {
    const copy = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
    copy.setDate(copy.getDate() - copy.getDay())
    return copy
  }

  const weekStart = ref(startOfWeek(new Date()))

  const viewingThisWeek = computed(() => toIso(weekStart.value) === toIso(startOfWeek(new Date())))

  const weekLabel = computed(() => {
    const start = weekStart.value
    const end = new Date(start)
    end.setDate(end.getDate() + 6)
    const year = new Intl.DateTimeFormat('th-TH', { year: 'numeric' }).format(end)
    if (start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear()) {
      const month = new Intl.DateTimeFormat('th-TH', { month: 'short' }).format(start)
      return `${start.getDate()}–${end.getDate()} ${month} ${year}`
    }
    const dayMonth = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short' })
    return `${dayMonth.format(start)} – ${dayMonth.format(end)} ${year}`
  })

  function shiftWeek(delta: number) {
    const next = new Date(weekStart.value)
    next.setDate(next.getDate() + delta * 7)
    weekStart.value = next
  }

  const calendarDays = computed(() => {
    const today = isoOffset(0)
    const byDay = new Map<string, Trip[]>()
    for (const trip of schedule.value) {
      const list = byDay.get(trip.date) ?? []
      list.push(trip)
      byDay.set(trip.date, list)
    }
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(weekStart.value)
      date.setDate(date.getDate() + index)
      const iso = toIso(date)
      return {
        iso,
        today: iso === today,
        weekday: new Intl.DateTimeFormat('th-TH', { weekday: 'short' }).format(date),
        number: date.getDate(),
        blocks: (byDay.get(iso) ?? []).map(trip => {
          const start = minutes(trip.time)
          const length = (trip.packageId === 'p1' ? 4 : 8) * 60
          return {
            trip,
            top: ((start - GRID_START * 60) / 60) * HOUR,
            height: Math.max((length / 60) * HOUR - 4, 36),
            end: clockLabel(start + length),
          }
        }),
      }
    })
  })

  const gridHours = computed(() => {
    const latest = calendarDays.value
      .flatMap(day => day.blocks)
      .reduce((max, block) => Math.max(max, block.top + block.height), 0)
    const end = Math.max(18, GRID_START + Math.ceil(latest / HOUR))
    return Array.from({ length: end - GRID_START }, (_, index) => GRID_START + index)
  })

  function minutes(time: string) {
    const [hour, minute] = time.split(':').map(Number)
    return hour * 60 + (minute || 0)
  }

  function clockLabel(total: number) {
    const hour = Math.floor(total / 60) % 24
    const minute = total % 60
    return `${pad(hour)}:${pad(minute)}`
  }

  function pad(value: number) {
    return String(value).padStart(2, '0')
  }

  function toIso(date: Date) {
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  }

  function needsSummary(trip: Trip) {
    return packageHasNotes(trip.packageId) && viewStatus(trip.status, trip.serviceType) === 'with_doctor'
  }
</script>

<style scoped>
  .live-job {
    padding: 20px;
    border: 1.5px solid #0e6b62;
    border-radius: 20px;
    background: #f7fbfa;
  }

  .live-kicker {
    display: flex;
    align-items: center;
    gap: 8px;
    color: #0e6b62;
    font-size: 1.05rem;
    font-weight: 700;
  }

  .live-steps {
    display: flex;
    flex-direction: column;
    gap: 8px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .live-steps li {
    padding: 8px 12px;
    border-radius: 12px;
    background: #fff;
    color: #6f6256;
  }

  .live-steps .done {
    background: #e7f3f1;
    color: #0e6b62;
  }

  .live-steps .now {
    background: #0e6b62;
    color: #fff;
    font-weight: 700;
  }

  .teams {
    container-type: inline-size;
    border: 1.5px solid #6f6256;
    border-radius: 16px;
    background: #fffcf8;
    overflow: hidden;
  }

  .teams-scroll {
    max-height: 560px;
    overflow: auto;
  }

  .teams-nav {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 6px 6px 2px;
  }

  .teams-range {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.35;
    text-align: center;
  }

  .teams-range strong {
    color: #0e6b62;
    font-size: 1.05rem;
  }

  .teams-range span,
  .teams-back {
    color: #5c534c;
    font-size: 0.95rem;
  }

  .teams-back {
    border: 0;
    background: transparent;
    padding: 0;
    text-decoration: underline;
    cursor: pointer;
  }

  .teams-head,
  .teams-grid {
    display: grid;
    grid-template-columns: 48px repeat(7, minmax(0, 1fr));
  }

  @container (max-width: 720px) {
    .teams-date {
      gap: 0;
      padding: 8px 0 8px;
      font-size: 0.75rem;
    }

    .teams-date strong {
      width: 26px;
      height: 26px;
      font-size: 0.9rem;
    }

    .teams-event {
      right: 2px;
      left: 2px;
      padding: 3px 2px;
    }

    .teams-event strong,
    .teams-event .teams-place {
      position: absolute;
      width: 1px;
      height: 1px;
      overflow: hidden;
      clip: rect(0 0 0 0);
    }

    .teams-event .teams-when {
      display: flex;
      flex-direction: column;
      font-size: 0.68rem;
    }

    .teams-event .teams-when span {
      white-space: nowrap;
    }

    .teams-dash {
      display: none;
    }
  }

  .teams-head {
    position: sticky;
    top: 0;
    z-index: 2;
    background: #fffcf8;
    border-bottom: 1px solid #e4d8c8;
  }

  .teams-date {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    padding: 10px 6px 12px;
    color: #5c534c;
    font-size: 0.95rem;
  }

  .teams-date strong {
    display: grid;
    place-items: center;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    color: #241c16;
    font-size: 1.05rem;
  }

  .teams-date.is-today strong {
    background: #0e6b62;
    color: #fff;
  }

  .teams-grid {
    position: relative;
  }

  .teams-times,
  .teams-col {
    position: relative;
  }

  .teams-times span,
  .teams-line {
    display: block;
    height: 48px;
    box-sizing: border-box;
  }

  .teams-times span {
    padding: 2px 8px 0 0;
    color: #6f6256;
    font-size: 0.8rem;
    line-height: 1;
    text-align: right;
  }

  .teams-line {
    border-top: 1px solid #eadfce;
  }

  .teams-col + .teams-col,
  .teams-times + .teams-col {
    border-left: 1px solid #eadfce;
  }

  .teams-col.is-today {
    background: #f4faf8;
  }

  .teams-event {
    position: absolute;
    right: 4px;
    left: 4px;
    display: flex;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    padding: 4px 5px;
    border-radius: 6px;
    border-left: 4px solid #0e6b62;
    background: #e7f3f1;
    color: #241c16;
    text-decoration: none;
  }

  .teams-event strong {
    font-size: 0.85rem;
    line-height: 1.25;
  }

  .teams-event span {
    color: #3f3832;
    font-size: 0.75rem;
    line-height: 1.25;
  }

  .teams-event.is-completed {
    border-left-color: #8a7b6b;
    background: #f3eee6;
  }

  .teams-event.is-requested {
    border-left-style: dashed;
    background: #fff6e8;
  }
</style>
