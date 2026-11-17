<template>
  <div ref="el" class="place-map" role="application" aria-label="แผนที่โรงพยาบาล คลินิก และศูนย์กายภาพใกล้ตำแหน่งของคุณ" />
</template>

<script setup lang="ts">
  import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
  import * as L from 'leaflet'
  import 'leaflet/dist/leaflet.css'
  import type { Hospital } from '@/domain/types'
  import type { LatLng } from '@/domain/geo'

  const props = defineProps<{
    hospitals: Hospital[]
    selectedId: string
    user: LatLng
  }>()

  const emit = defineEmits<{ select: [id: string] }>()

  const el = ref<HTMLElement | null>(null)
  let map: L.Map | null = null
  let layer: L.LayerGroup | null = null
  let alive = true

  function draw(fit: boolean) {
    if (!alive || !map || !layer) return
    layer.clearLayers()
    const userIcon = L.divIcon({
      className: 'map-pin-wrap',
      html: '<div class="map-pin map-pin-user"></div>',
      iconSize: [18, 18],
      iconAnchor: [9, 9],
    })
    L.marker([props.user.lat, props.user.lng], { icon: userIcon, zIndexOffset: 800, keyboard: false })
      .addTo(layer)
      .bindTooltip('ตำแหน่งของคุณ', { direction: 'top', offset: [0, -8] })

    props.hospitals.forEach(hospital => {
      const selected = hospital.id === props.selectedId
      const icon = L.divIcon({
        className: 'map-pin-wrap',
        html: `<div class="map-pin${selected ? ' is-selected' : ''}">${hospital.short}</div>`,
        iconSize: [120, 28],
        iconAnchor: [60, 14],
      })
      L.marker([hospital.lat, hospital.lng], { icon, keyboard: false })
        .addTo(layer)
        .on('click', () => emit('select', hospital.id))
    })

    if (fit) {
      const points: L.LatLngExpression[] = [
        [props.user.lat, props.user.lng],
        ...props.hospitals.map(hospital => [hospital.lat, hospital.lng] as [number, number]),
      ]
      map.fitBounds(points, { padding: [36, 36], maxZoom: 13 })
    }
  }

  onMounted(() => {
    if (!el.value) return
    map = L.map(el.value, {
      zoomControl: false,
      attributionControl: true,
      zoomAnimation: false,
      fadeAnimation: false,
    }).setView([props.user.lat, props.user.lng], 12)
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap',
      maxZoom: 19,
    }).addTo(map)
    layer = L.layerGroup().addTo(map)
    draw(true)
  })

  watch(
    () => props.selectedId,
    () => draw(false),
  )

  watch(
    () => [props.user.lat, props.user.lng],
    () => draw(true),
  )

  onBeforeUnmount(() => {
    alive = false
    try {
      map?.stop()
      map?.remove()
    } catch {
      /* แผนที่ถูกถอดออกพร้อมกับขั้นจอง */
    }
    map = null
    layer = null
  })
</script>

<style>
  .place-map {
    height: 320px;
    border-radius: 14px;
    overflow: hidden;
    border: 1px solid #e4ddd2;
  }

  .map-pin-wrap {
    background: transparent;
    border: 0;
  }

  .map-pin {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 72px;
    height: 28px;
    padding: 0 10px;
    border-radius: 999px;
    border: 2px solid #0e6b62;
    background: white;
    color: #0e6b62;
    font-size: 12px;
    font-weight: 700;
    white-space: nowrap;
    box-shadow: 0 2px 8px rgba(36, 28, 22, 0.16);
  }

  .map-pin.is-selected {
    background: #0e6b62;
    color: white;
  }

  .map-pin-user {
    width: 16px;
    height: 16px;
    min-width: 0;
    padding: 0;
    border-radius: 50%;
    border: 3px solid white;
    background: #d4654a;
    box-shadow: 0 0 0 6px rgba(212, 101, 74, 0.28);
  }
</style>
