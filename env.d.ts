/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_NOSTRA_API_KEY?: string
}

interface NostraMarker {
  onClick?: () => void
}

interface NostraGraphicsLayer {
  clear: () => void
  addMarker: (lat: number, lon: number, marker: NostraMarker) => void
}

interface NostraMap {
  onLoad: (() => void) | null
  addLayer: (layer: NostraGraphicsLayer) => void
  setExtent?: (points: number[][]) => void
  destroy?: () => void
}

interface NostraApi {
  onready?: () => void
  onerror?: () => void
  language?: { E?: string, L?: string } | null
  config?: {
    ClientConfig?: {
      token?: { streetmap?: { L?: string, E?: string } }
    }
  }
  maps: {
    Map: new (containerId: string, options: Record<string, unknown>) => NostraMap
    layers: {
      GraphicsLayer: new (map: NostraMap, options: { id: string, mouseOver?: boolean }) => NostraGraphicsLayer
    }
    symbols: {
      Marker: new (options: { url: string, width: number, height: number }) => NostraMarker
    }
  }
}

interface Window {
  nostra?: NostraApi
}
