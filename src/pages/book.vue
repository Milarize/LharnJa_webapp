<template>
  <div>
    <div class="d-flex align-center ga-3 mb-2">
      <v-progress-circular :model-value="(step / 6) * 100" :size="52" :width="5" color="primary">
        <span class="text-label-large font-weight-bold">{{ step }}</span>
      </v-progress-circular>
      <div>
        <div class="text-label-large text-medium-emphasis">ขั้นที่ {{ step }} จาก 6</div>
        <h1 class="text-headline-small font-weight-medium">{{ titles[step - 1] }}</h1>
      </div>
    </div>
    <v-progress-linear :model-value="(step / 6) * 100" class="mb-6" color="primary" height="6" rounded />

    <v-alert v-if="rebookSource" class="mb-4" icon="mdi-account-heart" type="info" variant="tonal">
      จองซ้ำกับ{{ rebookNickname }} จากนัด{{ rebookSource.elderName }}
      วันนัดเลือกใหม่ได้ คนเดิมถูกเลือกไว้ให้แล้ว
    </v-alert>

    <v-alert v-if="error" class="mb-4" type="warning" variant="tonal">{{ error }}</v-alert>

    <div v-if="step === 1">
      <p class="text-body-medium text-medium-emphasis mb-4">เลือกคนที่จะมีเพื่อนดูแลไปด้วย</p>
      <v-row>
        <v-col v-for="elder in store.elders" :key="elder.id" cols="12" sm="6">
          <v-card
            class="pa-4 h-100"
            :color="elderId === elder.id ? 'primary' : undefined"
            role="button"
            rounded="md"
            tabindex="0"
            :variant="elderId === elder.id ? 'tonal' : 'outlined'"
            @click="elderId = elder.id"
            @keydown.enter="elderId = elder.id"
          >
            <div class="d-flex ga-3 align-center">
              <v-avatar :color="elder.tone" size="44">
                <span>{{ elder.initial }}</span>
              </v-avatar>
              <div>
                <div class="text-title-medium font-weight-bold">{{ elder.name }}</div>
                <div class="text-body-small text-medium-emphasis">{{ elder.relation }} · {{ elder.age }} ปี</div>
              </div>
            </div>
            <div class="text-body-medium mt-3">{{ elder.conditions }}</div>
          </v-card>
        </v-col>
      </v-row>
      <v-btn class="mt-4" prepend-icon="mdi-account-plus" variant="text" @click="adding = true">
        เพิ่มผู้สูงอายุในครอบครัว
      </v-btn>
    </div>

    <div v-else-if="step === 2">
      <p class="text-body-medium text-medium-emphasis mb-4">วันนี้ให้หลานจ๋าช่วยอะไร</p>
      <v-row>
        <v-col v-for="key in BOOKABLE_SERVICES" :key="key" cols="12">
          <v-card
            class="pa-4"
            :color="service === key ? 'primary' : undefined"
            role="button"
            rounded="md"
            tabindex="0"
            :variant="service === key ? 'tonal' : 'outlined'"
            @click="service = key"
            @keydown.enter="service = key"
          >
            <div class="d-flex align-center ga-3">
              <v-icon :icon="SERVICES[key].icon" size="32" />
              <div>
                <div class="text-title-medium font-weight-medium">{{ SERVICES[key].short }}</div>
                <div class="text-body-small text-medium-emphasis">{{ SERVICES[key].detail }}</div>
                <div class="text-body-small mt-1">{{ SERVICES[key].hours }}</div>
              </div>
            </div>
          </v-card>
        </v-col>
      </v-row>
    </div>

    <div v-else-if="step === 3" class="d-flex flex-column ga-5">
      <div>
        <div class="text-label-large mb-1">โรงพยาบาล คลินิก หรือศูนย์กายภาพ</div>
        <p class="text-body-small text-medium-emphasis mb-3">{{ locationHint }}</p>
        <PlaceMap :hospitals="hospitals" :selected-id="hospitalId" :user="userPoint" @select="chooseHospital" />
        <div class="d-flex flex-column ga-2 mt-3">
          <button
            v-for="hospital in nearestHospitals"
            :key="hospital.id"
            class="hospital-row"
            :class="{ 'is-on': hospitalId === hospital.id }"
            type="button"
            @click="chooseHospital(hospital.id)"
          >
            <span>
              <strong>{{ hospital.short }}</strong>
              <span class="hospital-area">{{ hospital.area }}</span>
            </span>
            <span class="hospital-km">{{ formatKm(hospital.km) }}</span>
          </button>
        </div>
      </div>

      <v-text-field v-model="date" hide-details label="วันที่นัด" :min="earliest" type="date" />

      <div>
        <div class="text-label-large mb-2">เวลานัด</div>
        <div class="d-flex flex-wrap ga-2">
          <v-chip
            v-for="slot in TIME_SLOTS"
            :key="slot"
            :color="time === slot ? 'primary' : undefined"
            :variant="time === slot ? 'flat' : 'outlined'"
            @click="time = slot"
          >
            {{ slot }} น.
          </v-chip>
        </div>
      </div>

      <p class="text-body-small text-medium-emphasis mb-0">ผู้ดูแลไปเจอที่นั่น และอยู่ดูแลระหว่างพบแพทย์ ไม่ได้รับส่ง</p>
    </div>

    <div v-else-if="step === 4">
      <p class="text-body-medium text-medium-emphasis mb-4">เลือกแผนก แล้วบอกความต้องการเพิ่มได้ ข้ามข้อที่ไม่จำเป็นได้</p>
      <div class="text-label-large mb-2">แผนก</div>
      <div class="d-flex flex-wrap ga-2 mb-5">
        <v-chip
          v-for="item in DEPARTMENTS"
          :key="item"
          :color="department === item ? 'primary' : undefined"
          :variant="department === item ? 'flat' : 'outlined'"
          @click="department = item"
        >
          {{ item }}
        </v-chip>
      </div>
      <div class="text-label-large mb-2">การดูแล</div>
      <div class="d-flex flex-wrap ga-2 mb-5">
        <v-chip
          v-for="item in careNeeds"
          :key="item.id"
          :color="needs.includes(item.id) ? 'primary' : undefined"
          :prepend-icon="item.icon"
          :variant="needs.includes(item.id) ? 'flat' : 'outlined'"
          @click="toggleNeed(item.id)"
        >
          {{ item.label }}
        </v-chip>
      </div>
      <div class="text-label-large mb-2">ความต้องการเพิ่มเติม</div>
      <div class="d-flex flex-wrap ga-2">
        <v-chip
          v-for="item in preferNeeds"
          :key="item.id"
          :color="needs.includes(item.id) ? 'primary' : undefined"
          :prepend-icon="item.icon"
          :variant="needs.includes(item.id) ? 'flat' : 'outlined'"
          @click="toggleNeed(item.id)"
        >
          {{ item.label }}
        </v-chip>
      </div>
      <v-textarea
        v-model="note"
        auto-grow
        class="mt-5"
        hide-details
        label="หมายเหตุถึงผู้ดูแล ไม่จำเป็นต้องกรอก"
        placeholder="เช่น อย่าให้คุณยายรอแดดนาน"
        rows="2"
      />
    </div>

    <div v-else-if="step === 5">
      <p class="text-body-medium text-medium-emphasis mb-4">เลือกเพื่อนดูแลที่จะไปด้วยกันในนัดนี้</p>
      <div v-if="ranking" class="d-flex flex-column ga-3">
        <v-card v-for="index in 3" :key="index" class="pa-4" rounded="md" variant="outlined">
          <div class="text-body-medium mb-2">กำลังดูตารางเพื่อนดูแล...</div>
          <v-progress-linear color="primary" indeterminate rounded />
        </v-card>
      </div>
      <p v-else-if="!shownRanked.length" class="text-body-medium text-medium-emphasis">
        วันนี้ยังไม่มีเพื่อนดูแลที่เลือกได้
      </p>
      <div v-else class="d-flex flex-column ga-3">
        <v-card
          v-for="item in shownRanked"
          :key="item.caregiver.id"
          class="pa-4"
          :color="caregiverId === item.caregiver.id ? 'primary' : undefined"
          role="button"
          rounded="md"
          tabindex="0"
          :variant="caregiverId === item.caregiver.id ? 'tonal' : 'outlined'"
          @click="pick(item)"
          @keydown.enter="pick(item)"
        >
          <div class="d-flex ga-3">
            <v-avatar size="84">
              <v-img :alt="item.caregiver.nickname" cover :src="item.caregiver.photo" />
            </v-avatar>
            <div class="flex-grow-1">
              <v-chip
                v-if="item.caregiver.id === rebookSource?.caregiverId"
                class="mb-1"
                color="primary"
                size="small"
                variant="tonal"
              >
                คนเดิม
              </v-chip>
              <div class="text-title-medium font-weight-bold">{{ item.caregiver.nickname }}</div>
              <div class="text-body-small text-medium-emphasis">
                {{ item.caregiver.name }} · {{ item.caregiver.gender === 'female' ? 'หญิง' : 'ชาย' }} ·
                ประสบการณ์ {{ item.caregiver.years }} ปี
              </div>
              <div class="d-flex align-center ga-1 text-body-small mt-1">
                <v-icon color="gold" icon="mdi-star" size="16" />
                {{ item.caregiver.rating }} · {{ item.caregiver.reviews }} รีวิว · {{ item.caregiver.zone }}
              </div>
              <div class="d-flex flex-wrap ga-1 my-3">
                <v-chip v-for="badge in item.caregiver.badges" :key="badge" size="small" variant="tonal">
                  {{ badge }}
                </v-chip>
              </div>
              <div class="d-flex justify-space-between align-center">
                <div>
                  <div class="text-title-medium font-weight-bold">{{ baht(item.quote.total) }}</div>
                  <div class="text-body-small text-medium-emphasis">
                    {{
                      item.quote.total > SERVICES[service].base
                        ? `เลือกคนนี้เอง เพิ่ม ${baht(item.quote.total - SERVICES[service].base)}`
                        : 'ราคาทั่วไปของการจองครั้งนี้'
                    }}
                  </div>
                </div>
                <v-chip color="primary" variant="flat">
                  {{ caregiverId === item.caregiver.id ? 'เลือกแล้ว' : 'เลือก' }}
                </v-chip>
              </div>
            </div>
          </div>
        </v-card>
      </div>
    </div>

    <div v-else>
      <v-card class="pa-5" rounded="md" variant="outlined">
        <div class="text-label-large text-medium-emphasis">{{ rebookSource ? 'สรุปคำขอจองซ้ำ' : 'สรุปคำขอ' }}</div>
        <div class="text-headline-small font-weight-medium mt-1 mb-4">{{ selectedElder?.name }}</div>
        <v-list class="bg-transparent py-0" density="compact">
          <v-list-item prepend-icon="mdi-hospital-building" :title="selectedHospital?.name" :subtitle="`${department} · ${dayLabel(date)} ${time} น.`" />
          <v-list-item :title="selectedCare?.nickname" :subtitle="selectedCare?.name">
            <template #prepend>
              <v-avatar class="me-2" size="40">
                <v-img v-if="selectedCare" :alt="selectedCare.nickname" cover :src="selectedCare.photo" />
              </v-avatar>
            </template>
          </v-list-item>
          <v-list-item prepend-icon="mdi-clock-outline" :title="SERVICES[service].label" :subtitle="SERVICES[service].detail" />
        </v-list>
        <div v-if="needs.length" class="d-flex flex-wrap ga-2 mt-2">
          <v-chip v-for="need in needs" :key="need" size="small" variant="tonal">{{ needLabel(need) }}</v-chip>
        </div>
        <p v-else class="text-body-medium text-medium-emphasis mt-2 mb-0">ไม่ได้ระบุความต้องการพิเศษ</p>
        <v-divider class="my-4" />
        <div v-if="selectedRank" class="d-flex justify-space-between text-title-medium font-weight-bold">
          <span>ค่าผู้ดูแลที่โรงพยาบาล</span><span>{{ baht(selectedRank.quote.total) }}</span>
        </div>
        <p class="text-body-small text-medium-emphasis mt-3 mb-0">
          ครอบครัวจ่ายครั้งนี้ครั้งเดียว ผู้ดูแลไม่ถือเงินและไม่ติดต่อผู้สูงอายุส่วนตัว ถ้าผู้ดูแลไม่กดรับ โปรแกรมส่งต่อให้คนถัดไป และยังไม่คิดเงิน
        </p>
      </v-card>
    </div>

    <div class="d-flex ga-2 mt-6">
      <v-btn v-if="step > 1" variant="outlined" @click="back">ย้อนกลับ</v-btn>
      <v-spacer />
      <v-btn color="primary" :loading="submitting" size="large" @click="next">
        {{ step === 6 ? 'ยืนยันคำขอ' : 'ถัดไป' }}
      </v-btn>
    </div>

    <v-dialog v-model="adding" max-width="480">
      <v-card class="pa-5" rounded="md">
        <div class="text-title-large font-weight-medium mb-4">เพิ่มผู้สูงอายุ</div>
        <v-text-field v-model="draft.name" hide-details="auto" label="ชื่อ" placeholder="คุณป้าสมหญิง" />
        <v-text-field v-model="draft.relation" class="mt-3" hide-details="auto" label="ความสัมพันธ์" placeholder="ป้า" />
        <v-text-field v-model.number="draft.age" class="mt-3" hide-details="auto" label="อายุ" min="40" type="number" />
        <v-text-field v-model="draft.conditions" class="mt-3" hide-details="auto" label="โรคประจำตัวหรือข้อควรระวัง" />
        <v-text-field v-model="draft.mobility" class="mt-3" hide-details="auto" label="การเดิน" placeholder="ใช้ไม้เท้า" />
        <div class="d-flex justify-end ga-2 mt-5">
          <v-btn variant="text" @click="adding = false">ยกเลิก</v-btn>
          <v-btn color="primary" @click="saveElder">บันทึก</v-btn>
        </div>
      </v-card>
    </v-dialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import PlaceMap from '@/components/PlaceMap.vue'
  import type { NeedId, ServiceType } from '@/domain/types'
  import { caregiverById, hospitals } from '@/domain/data'
  import { distanceKm, formatKm, inServiceArea, type LatLng } from '@/domain/geo'
  import type { RankedCaregiver } from '@/domain/match'
  import { rankCaregivers } from '@/domain/match'
  import {
    baht,
    BOOKABLE_SERVICES,
    dayLabel,
    DEPARTMENTS,
    isoOffset,
    needLabel,
    NEED_OPTIONS,
    SERVICES,
    TIME_SLOTS,
  } from '@/domain/model'
  import { FAMILY } from '@/domain/model'
  import { useCareStore } from '@/stores/care'

  const store = useCareStore()
  const router = useRouter()
  const route = useRoute()
  const step = ref(1)
  const error = ref('')
  const submitting = ref(false)
  const ranking = ref(false)
  const adding = ref(false)
  const elderId = ref(store.elders[0]?.id ?? '')
  const service = ref<ServiceType>('full')
  const hospitalId = ref('')
  const department = ref('อายุรกรรม')
  const earliest = isoOffset(1)
  const date = ref(isoOffset(1))
  const time = ref('09:00')
  const pickup = ref('')
  const userPoint = ref<LatLng>({ lat: FAMILY.lat, lng: FAMILY.lng })
  const usingDevice = ref(false)
  const locating = ref(false)
  const outsideArea = ref(false)
  const hospitalTouched = ref(false)
  const note = ref('')
  const needs = ref<NeedId[]>([])
  const caregiverId = ref('')
  let rankTimer = 0

  const titles = ['ผู้สูงอายุ', 'ช่วยอะไร', 'ไปเมื่อไร', 'ความต้องการ', 'เพื่อนดูแล', 'ยืนยันคำขอ']
  const careNeeds = NEED_OPTIONS.filter(item => item.group === 'care')
  const preferNeeds = NEED_OPTIONS.filter(item => item.group === 'prefer')
  const draft = reactive({ name: '', relation: '', age: 75, conditions: '', mobility: '' })

  const ranked = computed(() =>
    rankCaregivers({
      hospitalId: hospitalId.value,
      needs: needs.value,
      elderId: elderId.value,
      service: service.value,
    }),
  )
  const selectedElder = computed(() => store.elders.find(item => item.id === elderId.value))
  const selectedHospital = computed(() => hospitals.find(item => item.id === hospitalId.value))
  const nearestHospitals = computed(() =>
    hospitals
      .map(hospital => ({ ...hospital, km: distanceKm(userPoint.value, hospital) }))
      .sort((a, b) => a.km - b.km),
  )
  const pickupText = computed(() => {
    if (pickup.value.trim()) return pickup.value.trim()
    if (usingDevice.value) return 'ตำแหน่งปัจจุบันของคุณ'
    return FAMILY.pickup
  })
  const locationHint = computed(() => {
    if (locating.value) return 'กำลังอ่านตำแหน่งจากเครื่อง เพื่อเรียงโรงพยาบาลที่ใกล้ที่สุด'
    if (outsideArea.value) return 'ตำแหน่งนี้อยู่นอกพื้นที่ ใช้จุดที่บันทึกไว้เพื่อเรียงโรงพยาบาล'
    if (usingDevice.value) return 'เรียงโรงพยาบาลจากตำแหน่งของคุณ ผู้ดูแลไปเจอที่โรงพยาบาล'
    return 'ยังไม่ได้เปิดตำแหน่ง เรียงโรงพยาบาลจากจุดที่บันทึกไว้'
  })
  const selectedRank = computed(() => ranked.value.find(item => item.caregiver.id === caregiverId.value))
  const selectedCare = computed(() => selectedRank.value?.caregiver)
  const rebookSource = computed(() => {
    const id = String(route.query.rebook ?? '')
    if (!id) return undefined
    return store.trips.find(trip => trip.id === id && trip.owner === 'me')
  })
  const rebookNickname = computed(() =>
    rebookSource.value ? caregiverById(rebookSource.value.caregiverId)?.nickname ?? 'เพื่อนดูแล' : '',
  )
  const shownRanked = computed(() => {
    const available = ranked.value.filter(item => !item.blocked)
    const sameId = rebookSource.value?.caregiverId
    if (!sameId) return available
    return [...available].sort((a, b) => {
      if (a.caregiver.id === sameId) return -1
      if (b.caregiver.id === sameId) return 1
      return 0
    })
  })

  watch(
    () => String(route.query.rebook ?? ''),
    id => {
      if (!id) return
      const source = store.trips.find(trip => trip.id === id && trip.owner === 'me')
      if (!source) return
      elderId.value = source.elderId
      service.value = source.serviceType === 'fullday' ? 'fullday' : 'full'
      hospitalId.value = source.hospitalId
      department.value = source.department
      needs.value = [...source.needs]
      pickup.value = source.pickup
      hospitalTouched.value = true
      note.value = source.note
      caregiverId.value = source.caregiverId
      date.value = isoOffset(7)
      time.value = source.time
      step.value = 2
    },
    { immediate: true },
  )

  watch(step, (value, previous) => {
    if (value === 5 && previous === 4) {
      const keep = rebookSource.value?.caregiverId ?? ''
      caregiverId.value = keep
      ranking.value = true
      window.clearTimeout(rankTimer)
      rankTimer = window.setTimeout(() => {
        ranking.value = false
        const match = ranked.value.find(item => item.caregiver.id === keep && !item.blocked)
        caregiverId.value = match?.caregiver.id ?? ''
      }, 700)
    }
  })

  function chooseHospital(id: string) {
    hospitalTouched.value = true
    hospitalId.value = id
  }

  function applyNearest() {
    if (hospitalTouched.value) return
    const first = nearestHospitals.value[0]
    if (first) hospitalId.value = first.id
  }

  function locate() {
    if (!navigator.geolocation) return
    locating.value = true
    navigator.geolocation.getCurrentPosition(
      position => {
        const here = { lat: position.coords.latitude, lng: position.coords.longitude }
        locating.value = false
        if (!inServiceArea(here)) {
          outsideArea.value = true
          usingDevice.value = false
          applyNearest()
          return
        }
        outsideArea.value = false
        usingDevice.value = true
        userPoint.value = here
        applyNearest()
      },
      () => {
        locating.value = false
        usingDevice.value = false
        applyNearest()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60_000 },
    )
  }

  onMounted(() => {
    applyNearest()
    locate()
  })

  function toggleNeed(id: NeedId) {
    if (needs.value.includes(id)) {
      needs.value = needs.value.filter(item => item !== id)
      return
    }
    const nextNeeds = [...needs.value, id]
    if (id === 'female') needs.value = nextNeeds.filter(item => item !== 'male')
    else if (id === 'male') needs.value = nextNeeds.filter(item => item !== 'female')
    else needs.value = nextNeeds
  }

  function pick(item: RankedCaregiver) {
    if (item.blocked) return
    caregiverId.value = item.caregiver.id
  }

  function saveElder() {
    if (!draft.name.trim() || !draft.relation.trim()) {
      error.value = 'กรอกชื่อและความสัมพันธ์ก่อนบันทึก'
      return
    }
    error.value = ''
    elderId.value = store.addElder({
      name: draft.name,
      relation: draft.relation,
      age: Number(draft.age) || 75,
      conditions: draft.conditions,
      mobility: draft.mobility,
    })
    adding.value = false
    draft.name = ''
    draft.relation = ''
    draft.conditions = ''
    draft.mobility = ''
  }

  function back() {
    error.value = ''
    step.value -= 1
  }

  function next() {
    error.value = ''
    if (step.value === 1 && !elderId.value) {
      error.value = 'เลือกผู้สูงอายุก่อนไปขั้นถัดไป'
      return
    }
    if (step.value === 3) {
      if (!hospitalId.value || !date.value || !time.value) {
        error.value = 'เลือกสถานพยาบาล วันที่ และเวลา'
        return
      }
      if (date.value < earliest) {
        error.value = 'จองล่วงหน้าอย่างน้อย 1 วัน'
        return
      }
    }
    if (step.value === 5) {
      if (ranking.value) return
      if (!caregiverId.value) {
        error.value = 'เลือกเพื่อนดูแลก่อนยืนยัน'
        return
      }
    }
    if (step.value < 6) {
      step.value += 1
      return
    }
    submit()
  }

  function submit() {
    const elder = selectedElder.value
    const rankedCare = selectedRank.value
    if (!elder || !rankedCare) return
    submitting.value = true
    const id = store.createTrip({
      elderId: elder.id,
      elderName: elder.name,
      elderAge: elder.age,
      elderNote: `${elder.conditions} · ${elder.mobility}`,
      hospitalId: hospitalId.value,
      department: department.value,
      date: date.value,
      time: time.value,
      serviceType: service.value,
      needs: [...needs.value],
      note: note.value.trim(),
      pickup: pickupText.value,
      caregiverId: rankedCare.caregiver.id,
      price: rankedCare.quote.total,
      repeatOf:
        rebookSource.value && rankedCare.caregiver.id === rebookSource.value.caregiverId
          ? rebookSource.value.id
          : undefined,
    })
    router.push({ name: 'trip', params: { id } })
  }
</script>

<style scoped>
  .hospital-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    width: 100%;
    text-align: left;
    font: inherit;
    color: inherit;
    background: white;
    border: 1px solid #e4ddd2;
    border-radius: 14px;
    padding: 10px 12px;
    cursor: pointer;
  }

  .hospital-row.is-on {
    border-color: #0e6b62;
    background: #e7f3f1;
  }

  .hospital-area {
    display: block;
    color: #6b6258;
    font-size: 13px;
    font-weight: 400;
  }

  .hospital-km {
    color: #0e6b62;
    font-weight: 700;
    white-space: nowrap;
  }
</style>
