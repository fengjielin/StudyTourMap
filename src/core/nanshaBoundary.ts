import type { LatLngExpression } from 'leaflet'

/** 高德 / DataV 等常用数据源：GeoJSON 为 [lng, lat]，Leaflet 为 [lat, lng] */
export function lngLatRingToLeaflet(ring: number[][]): LatLngExpression[] {
  return ring.map(([lng, lat]) => [lat, lng] as LatLngExpression)
}

export interface NanshaBoundaryGeoJson {
  type: 'FeatureCollection'
  features: Array<{
    type: 'Feature'
    properties?: { adcode?: string; name?: string; center?: [number, number] }
    geometry: { type: string; coordinates: unknown }
  }>
}

export interface ParsedNanshaBoundary {
  /** 行政区外轮廓（每块_disjoint 面取一个外环），用于边界线 */
  outlineRings: LatLngExpression[][]
  /** 面积最大的主外环，用作稳定遮罩镂空，避免多环 evenodd 缩放闪漏 */
  mainMaskRing: LatLngExpression[] | null
  /** GeoJSON 中顺次的全部环（外环+内环），用于与「世界矩形」组成 evenodd 遮罩 */
  maskInnerRings: LatLngExpression[][]
}

function ringAreaApprox(ring: number[][]): number {
  if (ring.length < 3) return 0
  let area = 0
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    area += x1 * y2 - x2 * y1
  }
  return Math.abs(area / 2)
}

function parsePolygonCoords(coords: number[][][]): ParsedNanshaBoundary {
  const outlineRings: LatLngExpression[][] = []
  const maskInnerRings: LatLngExpression[][] = []
  let mainMaskRing: LatLngExpression[] | null = null
  if (coords[0]?.length) outlineRings.push(lngLatRingToLeaflet(coords[0]))
  if (coords[0]?.length) mainMaskRing = lngLatRingToLeaflet(coords[0])
  for (const ring of coords) {
    maskInnerRings.push(lngLatRingToLeaflet(ring))
  }
  return { outlineRings, mainMaskRing, maskInnerRings }
}

function parseMultiPolygonCoords(coords: number[][][][]): ParsedNanshaBoundary {
  const outlineRings: LatLngExpression[][] = []
  const maskInnerRings: LatLngExpression[][] = []
  let maxArea = -1
  let mainMaskRing: LatLngExpression[] | null = null
  for (const polygon of coords) {
    if (polygon[0]?.length) {
      outlineRings.push(lngLatRingToLeaflet(polygon[0]))
      const area = ringAreaApprox(polygon[0])
      if (area > maxArea) {
        maxArea = area
        mainMaskRing = lngLatRingToLeaflet(polygon[0])
      }
    }
    for (const ring of polygon) {
      maskInnerRings.push(lngLatRingToLeaflet(ring))
    }
  }
  return { outlineRings, mainMaskRing, maskInnerRings }
}

/** 解析 440115 等区县边界 GeoJSON（Polygon / MultiPolygon） */
export function parseNanshaBoundaryGeoJson(data: NanshaBoundaryGeoJson): ParsedNanshaBoundary {
  const feature = data.features[0]
  if (!feature?.geometry) return { outlineRings: [], mainMaskRing: null, maskInnerRings: [] }

  const { type, coordinates } = feature.geometry as {
    type: string
    coordinates: number[][][] | number[][][][]
  }

  if (type === 'Polygon') return parsePolygonCoords(coordinates as number[][][])
  if (type === 'MultiPolygon') return parseMultiPolygonCoords(coordinates as number[][][][])

  return { outlineRings: [], mainMaskRing: null, maskInnerRings: [] }
}

/** 从 GeoJSON properties.center 读取 [lng, lat] */
export function getCenterLngLat(data: NanshaBoundaryGeoJson): [number, number] | null {
  const c = data.features[0]?.properties?.center
  if (c && c.length >= 2) return [c[0], c[1]]
  return null
}
