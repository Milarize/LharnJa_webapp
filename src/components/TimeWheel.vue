<template>
  <div class="time-wheel" role="group" aria-label="เวลานัด">
    <div
      class="time-wheel-col"
      role="spinbutton"
      tabindex="0"
      aria-label="ชั่วโมง"
      :aria-valuenow="hour"
      aria-valuemin="0"
      aria-valuemax="23"
      :aria-valuetext="`${pad(hour)} นาฬิกา`"
      @keydown.up.prevent="step('hour', 1)"
      @keydown.down.prevent="step('hour', -1)"
    >
      <div class="time-wheel-caption">ชั่วโมง</div>
      <div class="time-wheel-frame">
        <div class="time-wheel-band" aria-hidden="true" />
        <div ref="hourEl" class="time-wheel-scroll" @scroll="onScroll('hour')">
          <div class="time-wheel-pad" />
          <button
            v-for="value in hours"
            :key="value"
            class="time-wheel-item"
            :class="{ 'is-on': value === hour, 'is-off': hourBlocked(value) }"
            :disabled="hourBlocked(value)"
            type="button"
            @click="select('hour', value)"
          >
            {{ pad(value) }}
          </button>
          <div class="time-wheel-pad" />
        </div>
      </div>
    </div>
    <div class="time-wheel-colon" aria-hidden="true">:</div>
    <div
      class="time-wheel-col"
      role="spinbutton"
      tabindex="0"
      aria-label="นาที"
      :aria-valuenow="minute"
      aria-valuemin="0"
      aria-valuemax="59"
      :aria-valuetext="`${pad(minute)} นาที`"
      @keydown.up.prevent="step('minute', 1)"
      @keydown.down.prevent="step('minute', -1)"
    >
      <div class="time-wheel-caption">นาที</div>
      <div class="time-wheel-frame">
        <div class="time-wheel-band" aria-hidden="true" />
        <div ref="minuteEl" class="time-wheel-scroll" @scroll="onScroll('minute')">
          <div class="time-wheel-pad" />
          <button
            v-for="value in minutes"
            :key="value"
            class="time-wheel-item"
            :class="{ 'is-on': value === minute, 'is-off': minuteBlocked(value) }"
            :disabled="minuteBlocked(value)"
            type="button"
            @click="select('minute', value)"
          >
            {{ pad(value) }}
          </button>
          <div class="time-wheel-pad" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, ref, watch } from 'vue'

  const props = defineProps<{ modelValue: string, minTime?: string }>()
  const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

  const ITEM = 48
  const hours = Array.from({ length: 24 }, (_, value) => value)
  const minutes = Array.from({ length: 60 }, (_, value) => value)
  const hour = ref(9)
  const minute = ref(0)
  const hourEl = ref<HTMLElement | null>(null)
  const minuteEl = ref<HTMLElement | null>(null)
  let timer = 0
  let syncing = false

  function pad(value: number) {
    return String(value).padStart(2, '0')
  }

  function clamp(value: number, max: number) {
    if (!Number.isFinite(value)) return 0
    return Math.min(max, Math.max(0, value))
  }

  function read(value: string) {
    const [hourText, minuteText] = value.split(':')
    return {
      hour: clamp(Number(hourText), 23),
      minute: clamp(Number(minuteText), 59),
    }
  }

  function floor() {
    return read(props.minTime || '00:00')
  }

  function hourBlocked(value: number) {
    return Boolean(props.minTime) && value < floor().hour
  }

  function minuteBlocked(value: number) {
    if (!props.minTime) return false
    const limit = floor()
    return hour.value < limit.hour || (hour.value === limit.hour && value < limit.minute)
  }

  function tooEarly(nextHour: number, nextMinute: number) {
    if (!props.minTime) return false
    const limit = floor()
    return nextHour < limit.hour || (nextHour === limit.hour && nextMinute < limit.minute)
  }

  function liftToFloor() {
    const limit = floor()
    hour.value = limit.hour
    minute.value = limit.minute
    place(hourEl.value, limit.hour)
    place(minuteEl.value, limit.minute)
  }

  function place(el: HTMLElement | null, index: number) {
    if (!el) return
    syncing = true
    el.scrollTop = index * ITEM
    window.setTimeout(() => {
      syncing = false
    }, 60)
  }

  function sync() {
    const next = read(props.modelValue)
    hour.value = next.hour
    minute.value = next.minute
    place(hourEl.value, next.hour)
    place(minuteEl.value, next.minute)
  }

  function commit() {
    if (tooEarly(hour.value, minute.value)) liftToFloor()
    const next = `${pad(hour.value)}:${pad(minute.value)}`
    if (next !== props.modelValue) emit('update:modelValue', next)
  }

  function onScroll(part: 'hour' | 'minute') {
    if (syncing) return
    const el = part === 'hour' ? hourEl.value : minuteEl.value
    if (!el) return
    const index = clamp(Math.round(el.scrollTop / ITEM), part === 'hour' ? 23 : 59)
    if (part === 'hour') hour.value = index
    else minute.value = index
    window.clearTimeout(timer)
    timer = window.setTimeout(commit, 90)
  }

  function select(part: 'hour' | 'minute', value: number) {
    if (part === 'hour' && hourBlocked(value)) return
    if (part === 'minute' && minuteBlocked(value)) return
    const el = part === 'hour' ? hourEl.value : minuteEl.value
    if (part === 'hour') hour.value = value
    else minute.value = value
    el?.scrollTo({ top: value * ITEM, behavior: 'smooth' })
    commit()
  }

  function step(part: 'hour' | 'minute', delta: number) {
    const max = part === 'hour' ? 23 : 59
    const current = part === 'hour' ? hour.value : minute.value
    select(part, clamp(current + delta, max))
  }

  onMounted(async () => {
    await nextTick()
    sync()
  })

  watch(() => props.modelValue, sync)
  watch(() => props.minTime, () => {
    if (tooEarly(hour.value, minute.value)) commit()
  })
</script>

<style scoped>
  .time-wheel {
    display: flex;
    align-items: flex-end;
    justify-content: center;
    gap: 8px;
    max-width: 280px;
  }

  .time-wheel-col {
    flex: 1;
    outline: none;
  }

  .time-wheel-col:focus-visible .time-wheel-frame {
    border-color: #0e6b62;
  }

  .time-wheel-caption {
    margin-bottom: 6px;
    text-align: center;
    font-size: 13px;
    color: #6b6258;
  }

  .time-wheel-frame {
    position: relative;
    height: 144px;
    border: 1px solid #e4ddd2;
    border-radius: 16px;
    background: #fff;
    overflow: hidden;
  }

  .time-wheel-band {
    position: absolute;
    left: 8px;
    right: 8px;
    top: 48px;
    height: 48px;
    border-radius: 12px;
    background: #e7f3f1;
    pointer-events: none;
  }

  .time-wheel-scroll {
    position: relative;
    z-index: 1;
    height: 100%;
    overflow-y: auto;
    scroll-snap-type: y mandatory;
    scrollbar-width: none;
    mask-image: linear-gradient(to bottom, transparent, #000 28%, #000 72%, transparent);
  }

  .time-wheel-scroll::-webkit-scrollbar {
    display: none;
  }

  .time-wheel-pad,
  .time-wheel-item {
    height: 48px;
    scroll-snap-align: center;
  }

  .time-wheel-item {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    border: 0;
    background: transparent;
    color: #8a8178;
    font: inherit;
    font-size: 22px;
    font-variant-numeric: tabular-nums;
    cursor: pointer;
  }

  .time-wheel-item.is-on {
    color: #084842;
    font-weight: 700;
  }

  .time-wheel-item.is-off {
    color: #d5cfc6;
    cursor: default;
  }

  .time-wheel-colon {
    width: 16px;
    height: 144px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: #0e6b62;
    font-size: 28px;
    font-weight: 700;
  }
</style>
