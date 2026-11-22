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
      <p class="text-body-medium text-medium-emphasis mb-4">
        เลือกการดูแลครั้งนี้ จ่ายตอนจองครั้งเดียว
      </p>
      <v-row>
        <v-col v-for="item in packageChoices" :key="item.id" cols="12">
          <PackageChoice
            :item="item"
            selectable
            :selected="packageId === item.id"
            @select="selectPackage"
          />
        </v-col>
      </v-row>
      <div v-if="selectedPackage.profession" class="d-flex flex-column ga-4 mt-5">
        <div>
          <div class="text-label-large mb-2">วิชาชีพของผู้ดูแล</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="item in PACKAGE_PROFESSIONS"
              :key="item"
              :color="profession === item ? 'primary' : undefined"
              :variant="profession === item ? 'flat' : 'outlined'"
              @click="profession = item"
            >
              {{ item }}
            </v-chip>
          </div>
        </div>
        <div>
          <div class="text-label-large mb-2">ภาษา</div>
          <div class="d-flex flex-wrap ga-2">
            <v-chip
              v-for="item in PACKAGE_LANGUAGES"
              :key="item"
              :color="language === item ? 'primary' : undefined"
              :variant="language === item ? 'flat' : 'outlined'"
              @click="language = item"
            >
              {{ item }}
            </v-chip>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="step === 3" class="d-flex flex-column ga-5">
      <div>
        <div class="text-label-large mb-1">โรงพยาบาลใกล้บ้าน</div>
        <p class="text-body-small text-medium-emphasis mb-3">{{ locationHint }}</p>
        <v-text-field
          v-model="hospitalQuery"
          clearable
          hide-details
          label="ค้นหาชื่อสถานพยาบาลเอง"
          :loading="searching"
          placeholder="ค้นหาโรงพยาบาลใกล้คุณ"
          prepend-inner-icon="mdi-magnify"
        />
        <PlaceMap
          class="mt-3"
          :confirm="confirmPoint"
          :hospitals="shownPlaces"
          :selected-id="hospitalId"
          :user="userPoint"
          @move="movePin"
          @select="chooseHospital"
        />
        <p class="text-body-small text-medium-emphasis mt-2 mb-0">
          {{ pinMoved ? 'ใช้ตำแหน่งที่เลื่อนบนแผนที่แล้ว' : 'เลือกชื่อจากรายการ แล้วเลื่อนหมุดสีส้มเพื่อยืนยันจุดนัด' }}
        </p>
        <p v-if="searching" class="text-body-medium text-medium-emphasis mt-3 mb-0">กำลังค้นหา</p>
        <p v-else-if="hospitalQuery.trim().length >= 2 && !shownPlaces.length" class="text-body-medium text-medium-emphasis mt-3 mb-0">
          ไม่พบชื่อนี้ เลื่อนหมุดบนแผนที่เพื่อปักจุดเอง
        </p>
        <div v-else class="d-flex flex-column ga-2 mt-3">
          <button
            v-for="hospital in shownPlaces"
            :key="hospital.id"
            class="hospital-row"
            :class="{ 'is-on': hospitalId === hospital.id }"
            type="button"
            @click="choosePlace(hospital)"
          >
            <span>
              <strong>{{ hospital.name }}</strong>
              <span class="hospital-area">{{ hospital.area }}</span>
            </span>
            <span class="hospital-km">{{ formatKm(hospital.km) }}</span>
          </button>
        </div>
      </div>

      <v-menu v-model="dateMenu" :close-on-content-click="false" location="bottom start">
        <template #activator="{ props: menu }">
          <v-text-field
            v-bind="menu"
            hide-details
            label="วันที่นัด"
            prepend-inner-icon="mdi-calendar"
            readonly
            :model-value="appointmentDate(date)"
          />
        </template>
        <v-date-picker
          color="primary"
          header-date-format="appointment"
          :max="latest"
          :min="earliest"
          :model-value="date"
          @update:model-value="chooseDate"
        />
      </v-menu>
      <p class="text-body-small text-medium-emphasis mt-2 mb-0">{{ dateHint }}</p>

      <div>
        <div class="text-label-large mb-2">เวลานัด</div>
        <TimeWheel v-model="time" :min-time="earliestTime || undefined" />
        <p class="text-body-small text-medium-emphasis mt-2 mb-0">{{ timeHint }}</p>
      </div>

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
                v-if="selectedPackage.recurring && item.caregiver.id === rebookSource?.caregiverId"
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
                  <div class="text-title-medium font-weight-bold">{{ baht(selectedPackage.price) }}</div>
                  <div class="text-body-small text-medium-emphasis">ราคาแพ็กเกจนี้ เติมต่อการจอง</div>
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
          <v-list-item prepend-icon="mdi-package-variant" :title="`${selectedPackage.name} · ${baht(selectedPackage.price)}`" :subtitle="packageDetail" />
        </v-list>
        <div v-if="needs.length" class="d-flex flex-wrap ga-2 mt-2">
          <v-chip v-for="need in needs" :key="need" size="small" variant="tonal">{{ needLabel(need) }}</v-chip>
        </div>
        <p v-else class="text-body-medium text-medium-emphasis mt-2 mb-0">ไม่ได้ระบุความต้องการพิเศษ</p>
        <v-divider class="my-4" />
        <div class="d-flex justify-space-between text-title-medium font-weight-bold">
          <span>ค่าแพ็กเกจต่อการจอง</span><span>{{ baht(selectedPackage.price) }}</span>
        </div>
        <p class="text-body-small text-medium-emphasis mt-3 mb-0">
          เติมแพ็กเกจครั้งนี้ครั้งเดียว ไม่มีการสมัครรายเดือน ผู้ดูแลไม่ถือเงินและไม่ติดต่อผู้สูงอายุส่วนตัว ถ้าผู้ดูแลไม่กดรับ โปรแกรมส่งต่อให้คนถัดไป และยังไม่คิดเงิน
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
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import PlaceMap from '@/components/PlaceMap.vue'
  import PackageChoice from '@/components/PackageChoice.vue'
  import TimeWheel from '@/components/TimeWheel.vue'
  import type { CarePackageId, Hospital, NeedId } from '@/domain/types'
  import { caregiverById, hospitals } from '@/domain/data'
  import { searchPlaces } from '@/domain/placeSearch'
  import { distanceKm, formatKm, inServiceArea, type LatLng } from '@/domain/geo'
  import type { RankedCaregiver } from '@/domain/match'
  import { rankCaregivers } from '@/domain/match'
  import {
    appointmentDate,
    baht,
    CARE_PACKAGES,
    canRebookTrip,
    carePackage,
    dayLabel,
    DEPARTMENTS,
    isoOffset,
    needLabel,
    NEED_OPTIONS,
    PACKAGE_LANGUAGES,
    PACKAGE_PROFESSIONS,
    packageMaxDate,
    packageMinDate,
    packageMinTime,
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
  const packageId = ref<CarePackageId>('p1')
  const profession = ref(PACKAGE_PROFESSIONS[0])
  const language = ref(PACKAGE_LANGUAGES[0])
  const hospitalId = ref('')
  const department = ref('อายุรกรรม')
  const date = ref(packageMinDate('p1'))
  const dateMenu = ref(false)
  const time = ref('09:00')
  const earliest = computed(() => packageMinDate(packageId.value))
  const selectedPackage = computed(() => carePackage(packageId.value))
  const latest = computed(() => packageMaxDate(packageId.value))
  const earliestTime = computed(() => packageMinTime(packageId.value, date.value))
  const dateHint = computed(() =>
    packageId.value === 'p1'
      ? 'แพ็กเกจ 1 เลือกวันนัดได้ 3 วัน เริ่มตั้งแต่วันที่สามนับจากวันนี้'
      : 'นัดวันนี้ได้ถ้าเวลาห่างอย่างน้อย 2 ชั่วโมง',
  )
  const timeHint = computed(() =>
    earliestTime.value
      ? `วันนี้เลือกได้ตั้งแต่ ${earliestTime.value} น. เลื่อนวงล้อได้เฉพาะเวลาที่ยังทัน`
      : `เลื่อนชั่วโมงและนาทีขึ้นลง แถบสีเขียวคือเวลาที่เลือก ${time.value} น.`,
  )
  const packageDetail = computed(() => {
    const extra = [
      selectedPackage.value.profession && profession.value !== 'ไม่ระบุ' ? `วิชาชีพ ${profession.value}` : '',
      selectedPackage.value.language && language.value !== 'ไทย' ? `ภาษา${language.value}` : '',
    ].filter(Boolean)
    return [selectedPackage.value.lead, ...extra].join(' · ')
  })
  const hospitalQuery = ref('')
  const suggestions = ref<Hospital[]>([])
  const found = ref<Hospital[]>([])
  const chosen = ref<Hospital | null>(null)
  const searching = ref(false)
  const pinMoved = ref(false)
  const userPoint = ref<LatLng>({ lat: FAMILY.lat, lng: FAMILY.lng })
  const usingDevice = ref(false)
  const locating = ref(false)
  const outsideArea = ref(false)
  const hospitalTouched = ref(false)
  const note = ref('')
  const needs = ref<NeedId[]>([])
  const caregiverId = ref('')
  let rankTimer = 0
  let searchTimer = 0
  let nearGen = 0
  let queryGen = 0

  const titles = ['ผู้สูงอายุ', 'แพ็กเกจ', 'ไปเมื่อไร', 'ความต้องการ', 'เพื่อนดูแล', 'ยืนยันคำขอ']
  const careNeeds = NEED_OPTIONS.filter(item => item.group === 'care')
  const preferNeeds = NEED_OPTIONS.filter(item => item.group === 'prefer')
  const draft = reactive({ name: '', relation: '', age: 75, conditions: '', mobility: '' })

  const ranked = computed(() =>
    rankCaregivers({
      hospitalId: hospitalId.value,
      needs: needs.value,
      elderId: elderId.value,
      service: 'full',
    }),
  )
  const selectedElder = computed(() => store.elders.find(item => item.id === elderId.value))
  const selectedHospital = computed(() => chosen.value)
  const confirmPoint = computed<LatLng | null>(() =>
    chosen.value ? { lat: chosen.value.lat, lng: chosen.value.lng } : null,
  )
  const shownPlaces = computed(() => {
    const querying = hospitalQuery.value.trim().length >= 2
    const source = querying ? found.value : suggestions.value
    const withKm = source.map(place => ({ ...place, km: distanceKm(userPoint.value, place) }))
    return querying ? withKm : [...withKm].sort((a, b) => a.km - b.km)
  })
  const locationHint = computed(() => {
    if (searching.value) return 'กำลังค้นหาจากแผนที่'
    if (hospitalQuery.value.trim().length >= 2) return 'ผลการค้นหา เลือกชื่อแล้วเลื่อนหมุดสีส้มเพื่อยืนยันจุดนัด'
    if (locating.value) return 'กำลังอ่านตำแหน่งจากเครื่อง เพื่อแนะนำจุดใกล้บ้าน'
    if (outsideArea.value) return 'ตำแหน่งนี้อยู่นอกพื้นที่ ใช้จุดที่บันทึกไว้เพื่อแนะนำที่ใกล้บ้าน'
    if (usingDevice.value) return 'แนะนำจุดใกล้ตำแหน่งของคุณ ค้นชื่อเองได้ แล้วเลื่อนหมุดเพื่อยืนยัน'
    return 'แนะนำจุดใกล้บ้านก่อน ค้นชื่อเองได้ แล้วเลื่อนหมุดสีส้มเพื่อยืนยันจุดนัด'
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
  const packageChoices = computed(() =>
    rebookSource.value ? CARE_PACKAGES.filter(item => item.id !== 'p1') : CARE_PACKAGES,
  )
  const shownRanked = computed(() => {
    const available = ranked.value.filter(item => !item.blocked)
    const sameId = selectedPackage.value.recurring ? rebookSource.value?.caregiverId : ''
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
      if (!canRebookTrip(source)) {
        router.replace({ name: 'book' })
        return
      }
      elderId.value = source.elderId
      packageId.value = source.packageId && carePackage(source.packageId).recurring ? source.packageId : 'p2'
      profession.value = source.profession || PACKAGE_PROFESSIONS[0]
      language.value = source.language || PACKAGE_LANGUAGES[0]
      hospitalId.value = source.hospitalId
      const known = hospitals.find(item => item.id === source.hospitalId)
      chosen.value = {
        id: source.hospitalId,
        name: known?.name || source.pickup || 'สถานพยาบาล',
        short: known?.short || source.pickup || 'สถานพยาบาล',
        area: known?.area || '',
        lat: source.placeLat ?? known?.lat ?? FAMILY.lat,
        lng: source.placeLng ?? known?.lng ?? FAMILY.lng,
      }
      pinMoved.value = source.placeLat != null
      department.value = source.department
      needs.value = [...source.needs]
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
      const keep = selectedPackage.value.recurring ? rebookSource.value?.caregiverId ?? '' : ''
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

  function choosePlace(place: Hospital) {
    hospitalTouched.value = true
    pinMoved.value = false
    chosen.value = { ...place }
    hospitalId.value = place.id
  }

  function chooseHospital(id: string) {
    const place = shownPlaces.value.find(item => item.id === id)
    if (place) choosePlace(place)
  }

  function movePin(point: LatLng) {
    hospitalTouched.value = true
    pinMoved.value = true
    const base = chosen.value ?? {
      id: `pin-${Date.now()}`,
      name: hospitalQuery.value.trim() || 'จุดที่ปักบนแผนที่',
      short: 'จุดนัด',
      area: 'ยืนยันจากหมุด',
      lat: point.lat,
      lng: point.lng,
    }
    chosen.value = { ...base, lat: point.lat, lng: point.lng }
    hospitalId.value = chosen.value.id
  }

  function localSuggestions(point: LatLng) {
    return [...hospitals]
      .sort((a, b) => distanceKm(point, a) - distanceKm(point, b))
      .slice(0, 6)
  }

  function applyNearest() {
    if (hospitalTouched.value) return
    const first = [...suggestions.value].sort((a, b) => distanceKm(userPoint.value, a) - distanceKm(userPoint.value, b))[0]
    if (!first) return
    pinMoved.value = false
    chosen.value = { ...first }
    hospitalId.value = first.id
  }

  async function loadNearby() {
    const gen = ++nearGen
    const point = { ...userPoint.value }
    try {
      const places = await searchPlaces({ lat: point.lat, lng: point.lng, nearby: true })
      if (gen !== nearGen) return
      suggestions.value = (places.length ? places : localSuggestions(point)).slice(0, 6)
    } catch {
      if (gen !== nearGen) return
      suggestions.value = localSuggestions(point)
    }
    applyNearest()
  }

  async function runSearch(query: string) {
    const gen = ++queryGen
    try {
      const places = await searchPlaces({ keyword: query, lat: userPoint.value.lat, lng: userPoint.value.lng })
      if (gen !== queryGen || hospitalQuery.value.trim() !== query) return
      found.value = places
      searching.value = false
      if (!places.length && !chosen.value) {
        chosen.value = {
          id: `pin-${query}`,
          name: query,
          short: 'จุดนัด',
          area: 'ปักเองบนแผนที่',
          lat: userPoint.value.lat,
          lng: userPoint.value.lng,
        }
        hospitalId.value = chosen.value.id
        hospitalTouched.value = true
      }
    } catch {
      if (gen !== queryGen) return
      found.value = []
      searching.value = false
    }
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

  watch(hospitalQuery, value => {
    window.clearTimeout(searchTimer)
    const query = value.trim()
    if (query.length < 2) {
      found.value = []
      searching.value = false
      return
    }
    searching.value = true
    searchTimer = window.setTimeout(() => void runSearch(query), 400)
  })

  watch(
    () => [userPoint.value.lat, userPoint.value.lng],
    () => void loadNearby(),
  )

  onMounted(() => {
    void loadNearby()
    locate()
  })

  onBeforeUnmount(() => {
    window.clearTimeout(searchTimer)
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

  function selectPackage(id: CarePackageId) {
    packageId.value = id
    date.value = id === 'p1' ? packageMinDate('p1') : isoOffset(0)
  }

  function chooseDate(value: unknown) {
    if (value instanceof Date) {
      const pad = (part: number) => String(part).padStart(2, '0')
      date.value = `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
    } else if (typeof value === 'string' && value) {
      date.value = value.slice(0, 10)
    }
    dateMenu.value = false
  }

  watch([packageId, date], () => {
    if (date.value < earliest.value) date.value = earliest.value
    else if (date.value > latest.value) date.value = latest.value
    else if (earliestTime.value && time.value < earliestTime.value) time.value = earliestTime.value
  })

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
      if (!chosen.value || !date.value || !time.value) {
        error.value = 'เลือกสถานพยาบาลหรือปักหมุด แล้วเลือกวันที่และเวลา'
        return
      }
      if (date.value < earliest.value || date.value > latest.value) {
        error.value = selectedPackage.value.id === 'p1'
          ? 'แพ็กเกจ 1 เลือกวันนัดได้ 3 วัน เริ่มตั้งแต่วันที่สามนับจากวันนี้'
          : 'เวลานัดต้องห่างจากตอนนี้อย่างน้อย 2 ชั่วโมง'
        return
      }
      if (earliestTime.value && time.value < earliestTime.value) {
        error.value = 'เวลานัดต้องห่างจากตอนนี้อย่างน้อย 2 ชั่วโมง'
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
      serviceType: 'full',
      packageId: selectedPackage.value.id,
      profession: selectedPackage.value.profession && profession.value !== 'ไม่ระบุ' ? profession.value : undefined,
      language: selectedPackage.value.language && language.value !== 'ไทย' ? language.value : undefined,
      needs: [...needs.value],
      note: note.value.trim(),
      pickup: selectedHospital.value?.name ?? '',
      placeLat: selectedHospital.value?.lat,
      placeLng: selectedHospital.value?.lng,
      caregiverId: rankedCare.caregiver.id,
      price: selectedPackage.value.price,
      repeatOf:
        selectedPackage.value.recurring &&
        rebookSource.value &&
        rankedCare.caregiver.id === rebookSource.value.caregiverId
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
