<template>
  <div class="place-map-frame">
    <div :id="mapId" ref="el" class="place-map" role="application" aria-label="แผนที่โรงพยาบาล คลินิก และศูนย์กายภาพใกล้ตำแหน่งของคุณ" />
    <p v-if="message" class="place-map-note">{{ message }}</p>
  </div>
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import type { Hospital } from '@/domain/types'
  import type { LatLng } from '@/domain/geo'

  const props = defineProps<{
    hospitals: Hospital[]
    selectedId: string
    user: LatLng
  }>()

  const emit = defineEmits<{ select: [id: string] }>()

  const mapId = `care-place-map-${Math.random().toString(36).slice(2, 8)}`
  const el = ref<HTMLElement | null>(null)
  const message = ref('กำลังเปิดแผนที่ NOSTRA')
  let map: NostraMap | null = null
  let layer: NostraGraphicsLayer | null = null
  let alive = true
  let drawGen = 0

  function upgradeNostraUrl(value: string) {
    if (value.startsWith('//api.nostramap.com/')) return `https:${value}`
    if (value.startsWith('http://api.nostramap.com/')) return `https://${value.slice('http://'.length)}`
    return value
  }

  function installNostraHttps() {
    const holder = window as Window & { __careNostraHttps?: boolean }
    if (holder.__careNostraHttps) return
    holder.__careNostraHttps = true
    const rewrite = (value: unknown) => typeof value === 'string' ? upgradeNostraUrl(value) : value
    for (const [proto, name] of [
      [HTMLScriptElement.prototype, 'src'],
      [HTMLLinkElement.prototype, 'href'],
      [HTMLImageElement.prototype, 'src'],
    ] as const) {
      const desc = Object.getOwnPropertyDescriptor(proto, name)
      if (!desc?.set || !desc.get) continue
      Object.defineProperty(proto, name, {
        configurable: true,
        enumerable: desc.enumerable,
        get: desc.get,
        set(value: string) {
          desc.set?.call(this, rewrite(value))
        },
      })
    }
    const setAttribute = Element.prototype.setAttribute
    Element.prototype.setAttribute = function (name, value) {
      const next = (name === 'src' || name === 'href') ? rewrite(value) : value
      setAttribute.call(this, name, String(next))
    }
    const open = XMLHttpRequest.prototype.open
    XMLHttpRequest.prototype.open = function (method, url, async, username, password) {
      open.call(this, method, rewrite(url) as string, async ?? true, username, password)
    }
    const fetchImpl = window.fetch.bind(window)
    window.fetch = (input, init) => {
      if (typeof input === 'string') return fetchImpl(upgradeNostraUrl(input), init)
      if (input instanceof URL) return fetchImpl(upgradeNostraUrl(input.toString()), init)
      return fetchImpl(input, init)
    }
  }

  function nostraReady(api: NostraApi | undefined): api is NostraApi {
    return Boolean(api?.maps?.Map && api.language?.E && api.config?.ClientConfig?.token?.streetmap?.L)
  }

  function loadNostra(key: string) {
    installNostraHttps()
    const readyApi = window.nostra
    if (nostraReady(readyApi)) return Promise.resolve(readyApi)
    let script = document.getElementById('nostra-map-api') as HTMLScriptElement | null
    if (script?.src.includes('%3D')) {
      script.remove()
      script = null
    }
    if (!script) {
      script = document.createElement('script')
      script.id = 'nostra-map-api'
      script.async = false
      script.src = `https://api.nostramap.com/nostraapi/v2.0?key=${key}`
      document.head.appendChild(script)
    }
    return new Promise((resolve, reject) => {
      let settled = false
      const succeed = () => {
        const api = window.nostra
        if (settled || !nostraReady(api)) return
        settled = true
        resolve(api)
      }
      const fail = (message: string) => {
        if (settled) return
        settled = true
        reject(new Error(message))
      }
      const hook = () => {
        const api = window.nostra
        if (!api) return
        const previousError = api.onerror
        api.onerror = () => {
          if (typeof previousError === 'function') previousError()
          fail('NOSTRA ปฏิเสธคีย์ของหน้าเว็บ เปิดผ่าน http://localhost:3000')
        }
      }
      script?.addEventListener('load', hook)
      script?.addEventListener('error', () => fail('โหลดแผนที่ NOSTRA ไม่สำเร็จ'))
      hook()
      const started = Date.now()
      const tick = () => {
        if (settled) return
        succeed()
        if (settled) return
        if (Date.now() - started > 20000) {
          fail('แผนที่ NOSTRA โหลดไม่ทัน เปิดผ่าน http://localhost:3000')
          return
        }
        window.setTimeout(tick, 100)
      }
      tick()
    })
  }

  function roundRect(ctx: CanvasRenderingContext2D, width: number, height: number, radius: number) {
    ctx.beginPath()
    ctx.moveTo(radius, 1)
    ctx.arcTo(width - 1, 1, width - 1, height - 1, radius)
    ctx.arcTo(width - 1, height - 1, 1, height - 1, radius)
    ctx.arcTo(1, height - 1, 1, 1, radius)
    ctx.arcTo(1, 1, width - 1, 1, radius)
    ctx.closePath()
  }

  async function raster(draw: (ctx: CanvasRenderingContext2D, width: number, height: number) => void, width: number, height: number) {
    const scale = 2
    const canvas = document.createElement('canvas')
    canvas.width = width * scale
    canvas.height = height * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.scale(scale, scale)
    draw(ctx, width, height)
    return canvas.toDataURL('image/png')
  }

  async function hospitalPin(label: string, selected: boolean) {
    await document.fonts.load('700 12px "IBM Plex Sans Thai"')
    const measure = document.createElement('canvas').getContext('2d')
    const font = '700 12px "IBM Plex Sans Thai", sans-serif'
    if (!measure) return { url: '', width: 72, height: 28 }
    measure.font = font
    const width = Math.min(180, Math.max(76, Math.ceil(measure.measureText(label).width) + 24))
    const height = 28
    const url = await raster((ctx, boxWidth, boxHeight) => {
      ctx.font = font
      ctx.fillStyle = selected ? '#0e6b62' : '#ffffff'
      ctx.strokeStyle = '#0e6b62'
      ctx.lineWidth = 2
      roundRect(ctx, boxWidth, boxHeight, 14)
      ctx.fill()
      ctx.stroke()
      ctx.fillStyle = selected ? '#ffffff' : '#0e6b62'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(label, boxWidth / 2, boxHeight / 2 + 1)
    }, width, height)
    return { url, width, height }
  }

  async function userPin() {
    const size = 18
    const url = await raster(ctx => {
      ctx.fillStyle = 'rgba(212, 101, 74, 0.28)'
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, 8, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d4654a'
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(size / 2, size / 2, 5, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
    }, size, size)
    return { url, width: size, height: size }
  }

  async function draw(fit: boolean) {
    const api = window.nostra
    if (!alive || !map || !layer || !api?.maps) return
    const gen = ++drawGen
    const user = await userPin()
    const pins = await Promise.all(props.hospitals.map(async hospital => ({
      hospital,
      pin: await hospitalPin(hospital.short, hospital.id === props.selectedId),
    })))
    if (!alive || gen !== drawGen || !layer) return
    layer.clear()
    const userMarker = new api.maps.symbols.Marker(user)
    userMarker.onClick = () => {}
    layer.addMarker(props.user.lat, props.user.lng, userMarker)
    pins.forEach(({ hospital, pin }) => {
      if (!pin.url) return
      const marker = new api.maps.symbols.Marker(pin)
      marker.onClick = () => emit('select', hospital.id)
      layer?.addMarker(hospital.lat, hospital.lng, marker)
    })
    if (!fit || !map.setExtent) return
    try {
      map.setExtent([
        [props.user.lat, props.user.lng],
        ...props.hospitals.map(hospital => [hospital.lat, hospital.lng]),
      ])
    } catch {
      /* คงระดับซูมเริ่มต้นถ้าชุดพิกัดนี้ใช้กับแผนที่ไม่ได้ */
    }
  }

  onMounted(async () => {
    const key = import.meta.env.VITE_NOSTRA_API_KEY?.trim()
    if (!key) {
      message.value = 'ยังไม่มีคีย์ NOSTRA สำหรับหน้าเว็บ'
      return
    }
    try {
      const api = await loadNostra(key)
      if (!alive || !el.value) return
      map = new api.maps.Map(mapId, {
        id: mapId,
        logo: true,
        scalebar: true,
        basemap: 'streetmap',
        slider: true,
        level: 12,
        lat: props.user.lat,
        lon: props.user.lng,
        country: 'TH',
      })
      map.onLoad = () => {
        if (!alive || !map) return
        layer = new api.maps.layers.GraphicsLayer(map, { id: `${mapId}-pins`, mouseOver: false })
        map.addLayer(layer)
        message.value = ''
        void draw(true)
      }
    } catch (error) {
      if (alive) message.value = error instanceof Error ? error.message : 'เปิดแผนที่ NOSTRA ไม่สำเร็จ ให้ใช้ http://localhost:3000'
    }
  })

  watch(
    () => props.selectedId,
    () => void draw(false),
  )

  watch(
    () => [props.user.lat, props.user.lng, props.hospitals.map(hospital => hospital.id).join('|')],
    () => void draw(true),
  )

  onBeforeUnmount(() => {
    alive = false
    drawGen += 1
    try {
      layer?.clear()
      map?.destroy?.()
    } catch {
      /* แผนที่ถูกถอดออกพร้อมกับขั้นจอง */
    }
    map = null
    layer = null
  })
</script>

<style>
  .place-map-frame {
    position: relative;
  }

  .place-map {
    height: 320px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e4ddd2;
    background: #f6f1ea;
  }

  .place-map-note {
    position: absolute;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0;
    padding: 16px;
    text-align: center;
    background: rgba(255, 252, 248, 0.92);
  }
</style>
