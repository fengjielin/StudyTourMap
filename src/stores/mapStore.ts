import { defineStore } from 'pinia'
import type { MapState, Base, Route } from '@/types'
import { tileProviders } from '@/core/TileProvider'

export const useMapStore = defineStore('map', {
  state: (): MapState => ({
    currentProvider: 'gaode',
    currentLayer: 'normal',
    selectedBaseId: null,
    bases: [],
    routes: [],
    isLoading: false,
    mapCenter: [113.35, 22.75], // 南沙区中心
    mapZoom: 12,
    markerPopupRegistry: {} as Record<string, () => void>
  }),

  getters: {
    selectedBase: (state): Base | undefined => {
      return state.bases.find(b => b.id === state.selectedBaseId)
    },

    providerInfo: (state) => {
      const provider = tileProviders[state.currentProvider]
      const layer = provider?.layers.find(l => l.id === state.currentLayer)
      return {
        provider: provider?.name || '',
        layer: layer?.name || ''
      }
    }
  },

  actions: {
    setProvider(providerId: string) {
      this.currentProvider = providerId
      const provider = tileProviders[providerId]
      if (provider && provider.layers.length > 0) {
        this.currentLayer = provider.layers[0].id
      }
    },

    setLayer(layerId: string) {
      this.currentLayer = layerId
    },

    selectBase(baseId: string | null) {
      this.selectedBaseId = baseId
    },

    setBases(bases: Base[]) {
      this.bases = bases
    },

    setRoutes(routes: Route[]) {
      this.routes = routes
    },

    setLoading(loading: boolean) {
      this.isLoading = loading
    },

    setMapView(center: [number, number], zoom: number) {
      this.mapCenter = center
      this.mapZoom = zoom
    },

    updateBasePosition(baseId: string, position: [number, number]) {
      const base = this.bases.find(b => b.id === baseId)
      if (base) {
        base.position = position
      }
    },

    registerMarkerPopup(baseId: string, fn: () => void) {
      this.markerPopupRegistry[baseId] = fn
    },

    unregisterMarkerPopup(baseId: string) {
      delete this.markerPopupRegistry[baseId]
    },

    openMarkerPopup(baseId: string) {
      this.markerPopupRegistry[baseId]?.()
    }
  }
})
