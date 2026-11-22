<template>
  <v-container class="py-6 py-md-8" max-width="920">
    <v-tabs v-model="tab" align-tabs="center" class="mb-6" color="primary" grow>
      <v-tab value="user">คนใช้บริการ</v-tab>
      <v-tab value="provider">ผู้ให้บริการ</v-tab>
    </v-tabs>

    <div class="d-flex justify-center">
      <div class="phone" :aria-label="tab === 'user' ? 'แชท LINE ของคนใช้บริการ' : 'แอปผู้ให้บริการ'">
        <div class="phone-status">{{ clock }}</div>
        <div class="phone-bar" :class="{ 'phone-bar-app': tab === 'provider' }">
          <v-icon color="white" icon="mdi-chevron-left" size="22" />
          <v-avatar color="white" size="34">
            <v-icon color="primary" icon="mdi-hand-heart" size="18" />
          </v-avatar>
          <div>
            <div class="d-flex align-center ga-1">
              <strong>{{ tab === 'user' ? 'หลานจ๋า' : 'งานของฉัน' }}</strong>
              <v-icon v-if="tab === 'user'" color="white" icon="mdi-check-decagram" size="14" />
            </div>
            <div class="phone-sub">
              {{ tab === 'user' ? 'บัญชีทางการ' : providerVerified ? 'พี่แอน · ผู้ให้บริการ' : 'ผู้ให้บริการ' }}
            </div>
          </div>
        </div>

        <template v-if="tab === 'user'">
          <div v-if="booker && !verified" class="phone-screen">
            <ThaiIdGate
              kind="family"
              :masked-id="booker.maskedId"
              :name="booker.name"
              :relation="booker.relation"
              @confirm="confirmThaid"
            />
          </div>
          <div v-else ref="chat" class="phone-chat">
            <div class="bubble bubble-oa">
              สวัสดีค่ะ คุณนภา เราคือหลานจ๋า มีผู้ดูแลไปอยู่ด้วยที่โรงพยาบาลตอนพบแพทย์ ไม่ได้รับส่งค่ะ
            </div>
            <div class="bubble-time">10:02</div>
            <div class="bubble bubble-me">
              คุณยายสมศรีมีนัดพรุ่งนี้ อยากได้คนไปด้วยทั้งเช้าค่ะ
            </div>
            <div class="bubble-time me">10:04</div>
            <div class="bubble bubble-oa">
              ได้เลยค่ะ กดปุ่มด้านล่างเพื่อเปิดหน้าจอง ตัวตนคุณนภายืนยันไว้แล้วตั้งแต่ครั้งแรก
            </div>
            <div class="bubble-time">10:06</div>
            <template v-for="item in familyFeed" :key="item.id">
              <CareUpdateCard v-if="item.card" class="line-card" v-bind="item.card" caption="ข้อความจากทีมดูแล" />
              <div v-else class="bubble bubble-oa">{{ item.text }}</div>
              <div class="bubble-time">{{ noticeTime(item.at) }}</div>
            </template>
            <div class="quick">
              <button type="button" @click="enter('book')">เปิดหน้าจอง</button>
              <button type="button" @click="enter('trips')">ดูนัดที่กำลังจะถึง</button>
              <button type="button" @click="enter('plans')">ดูแพ็กเกจ</button>
            </div>
          </div>

          <div v-if="verified" class="rich-menu">
            <button type="button" @click="enter('book')">
              <v-icon color="primary" icon="mdi-calendar-plus" />
              <span>จอง</span>
            </button>
            <button type="button" @click="enter('trips')">
              <v-icon color="primary" icon="mdi-clipboard-text-outline" />
              <span>นัดของฉัน</span>
            </button>
            <button type="button" @click="enter('plans')">
              <v-icon color="primary" icon="mdi-star-circle-outline" />
              <span>แพ็กเกจ</span>
            </button>
          </div>
        </template>
        <div v-else class="phone-screen">
          <ThaiIdGate
            v-if="!providerVerified"
            kind="provider"
            detail="ทำครั้งเดียวตอนเริ่มรับงาน ครั้งถัดไปเปิดแอปแล้วดูงานได้เลย"
            :masked-id="PROVIDER_THAID.maskedId"
            :name="PROVIDER_THAID.name"
            :relation="PROVIDER_THAID.relation"
            @confirm="confirmProvider"
          />
          <CaregiverPage v-else />
        </div>
      </div>
    </div>
  </v-container>
</template>

<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import ThaiIdGate from '@/components/ThaiIdGate.vue'
  import CareUpdateCard from '@/components/CareUpdateCard.vue'
  import { caregiverById, tripPlaceName } from '@/domain/data'
  import { careUpdate, FAMILY, FAMILY_MEMBERS, familyStatusText, PROVIDER_THAID } from '@/domain/model'
  import CaregiverPage from '@/pages/caregiver.vue'
  import { useCareStore } from '@/stores/care'

  const router = useRouter()
  const store = useCareStore()
  const booker = FAMILY_MEMBERS.find(person => person.id === FAMILY.memberId) ?? FAMILY_MEMBERS[0]
  const verified = computed(() => (booker ? store.isVerified(booker.id) : false))
  const providerVerified = computed(() => store.isVerified(PROVIDER_THAID.id))
  const pendingEnter = ref<'home' | 'book' | 'trips' | 'plans' | null>(null)
  const tab = ref<'user' | 'provider'>('user')
  const chat = ref<HTMLElement | null>(null)
  const now = ref(new Date())
  let timer = 0

  const clock = computed(() =>
    new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' }).format(now.value),
  )

  const careNotes = computed(() =>
    store.trips
      .filter(trip => trip.visitNote?.sentAt && (trip.visitNote.sentTo ?? []).includes(FAMILY.memberId))
      .map(trip => ({
        id: trip.id,
        at: trip.visitNote?.sentAt ?? '',
        card: { ...careUpdate(trip), elderLabel: trip.elderName },
      })),
  )
  const textNotices = computed(() =>
    store.lineNotices.filter(item => !item.card && !item.text.includes('เริ่มดูแล') && !item.text.includes('จบการดูแล')),
  )
  const familyFeed = computed(() => {
    const steps = store.trips
      .filter(trip => trip.owner === 'me')
      .flatMap(trip => {
        const nickname = caregiverById(trip.caregiverId)?.nickname ?? 'ผู้ดูแล'
        const place = tripPlaceName(trip)
        return trip.timeline.flatMap(event => {
          const text = familyStatusText(event.status, nickname, trip.elderName, place)
          if (!text) return []
          return [{ id: `${trip.id}-${event.status}`, at: event.at, text, card: null }]
        })
      })
    const notes = careNotes.value.map(item => ({ id: item.id, at: item.at, text: '', card: item.card }))
    const extras = textNotices.value.map(item => ({ id: item.id, at: item.at, text: item.text, card: null }))
    return [...steps, ...notes, ...extras].sort((a, b) => a.at.localeCompare(b.at))
  })

  watch(tab, value => {
    store.role = value === 'provider' ? 'caregiver' : 'family'
  })

  watch([tab, verified, () => familyFeed.value.length], async () => {
    if (tab.value !== 'user' || !verified.value) return
    await nextTick()
    chat.value?.querySelector('.line-card')?.scrollIntoView({ block: 'center' })
  })

  onMounted(() => {
    timer = window.setInterval(() => {
      now.value = new Date()
    }, 30_000)
  })

  onUnmounted(() => window.clearInterval(timer))

  function enter(name: 'home' | 'book' | 'trips' | 'plans') {
    store.role = 'family'
    if (!verified.value) {
      pendingEnter.value = name
      return
    }
    router.push({ name })
  }

  function noticeTime(at: string) {
    const date = new Date(at)
    if (Number.isNaN(date.getTime())) return ''
    return new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit' }).format(date)
  }

  function confirmThaid() {
    if (!booker) return
    store.verifyThaid(booker.id)
    const next = pendingEnter.value
    pendingEnter.value = null
    if (next) router.push({ name: next })
  }

  function confirmProvider() {
    store.role = 'caregiver'
    store.verifyThaid(PROVIDER_THAID.id)
  }
</script>
