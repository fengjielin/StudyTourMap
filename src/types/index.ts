export interface Base {
  id: string
  name: string
  unit: string
  routeName: string
  address: string
  category: 'technology' | 'culture' | 'nature'
  position: [number, number]  // [lng, lat] GCJ-02
  images: string[]
  description?: string
  contacts?: string
}

export interface Route {
  id: string
  name: string
  baseIds: string[]
  color: string
}

export interface MapState {
  currentProvider: string
  currentLayer: string
  selectedBaseId: string | null
  bases: Base[]
  routes: Route[]
  isLoading: boolean
  mapCenter: [number, number]
  mapZoom: number
  /** BaseMarker 注册的 Leaflet openPopup，供侧栏点击同步弹窗 */
  markerPopupRegistry: Record<string, () => void>
}
