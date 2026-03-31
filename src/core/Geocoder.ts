/**
 * 高德地图地理编码 / 逆地理编码服务
 *
 * 地址转坐标（地理编码）：通过详细地址获取精确 GCJ-02 坐标
 * 坐标转地址（逆地理编码）：通过坐标获取结构化地址
 *
 * 使用方式：
 *   VITE_AMAP_KEY=你的高德Web服务Key  npm run dev
 *
 * Key 申请：https://console.amap.com/dev/key/app
 */

const AMapKey = import.meta.env.VITE_AMAP_KEY as string | undefined

export interface GeocodingResult {
  lng: number   // GCJ-02 经度
  lat: number   // GCJ-02 纬度
  level: string
  district: string
  township?: string
  building?: string
}

export interface ReGeocodingResult {
  addressComponent: {
    province: string
    city: string
    district: string
    township?: string
    building?: string
  }
  formattedAddress: string
  nearestPoiName?: string
  citycode?: string
  adcode?: string
}

/** 地理编码：通过地址获取 GCJ-02 坐标 */
export async function geocodeAddress(address: string): Promise<GeocodingResult | null> {
  if (!AMapKey) {
    console.warn('[Geocoder] 未配置 VITE_AMAP_KEY，无法进行地理编码')
    return null
  }
  try {
    const url = new URL('https://restapi.amap.com/v3/geocode/geo')
    url.searchParams.set('key', AMapKey)
    url.searchParams.set('address', address)
    url.searchParams.set('output', 'JSON')

    const resp = await fetch(url.toString())
    const data = await resp.json()

    if (data.status === '1' && data.geocodes?.length > 0) {
      const g = data.geocodes[0]
      const [lng, lat] = (g.location as string).split(',').map(Number)
      return {
        lng,
        lat,
        level: g.level || '',
        district: g.district || '',
        township: g.township || undefined,
        building: g.building || undefined
      }
    } else {
      console.warn(`[Geocoder] 地址未命中：${address}`, data.info)
      return null
    }
  } catch (err) {
    console.error(`[Geocoder] 地理编码请求失败：${address}`, err)
    return null
  }
}

/** 逆地理编码：通过 GCJ-02 坐标获取地址 */
export async function reGeocode(lng: number, lat: number): Promise<ReGeocodingResult | null> {
  if (!AMapKey) return null
  try {
    const url = new URL('https://restapi.amap.com/v3/geocode/regeo')
    url.searchParams.set('key', AMapKey)
    url.searchParams.set('location', `${lng},${lat}`)
    url.searchParams.set('extensions', 'all')
    url.searchParams.set('output', 'JSON')

    const resp = await fetch(url.toString())
    const data = await resp.json()

    if (data.status === '1' && data.regeocode) {
      const r = data.regeocode
      return {
        addressComponent: {
          province: r.addressComponent.province,
          city: r.addressComponent.city,
          district: r.addressComponent.district,
          township: r.addressComponent.township,
          building: r.addressComponent.building
        },
        formattedAddress: r.formatted_address,
        nearestPoiName: r.pois?.[0]?.name,
        citycode: r.addressComponent.citycode,
        adcode: r.addressComponent.adcode
      }
    }
    return null
  } catch (err) {
    console.error(`[Geocoder] 逆地理编码请求失败：${lng},${lat}`, err)
    return null
  }
}

/**
 * 批量地理编码（带速率限制：每秒 1 次，符合高德个人配额限制）
 * 返回 { [address]: GeocodingResult | null }
 */
export async function batchGeocode(
  addresses: string[],
  onProgress?: (done: number, total: number) => void
): Promise<Map<string, GeocodingResult | null>> {
  const results = new Map<string, GeocodingResult | null>()

  for (let i = 0; i < addresses.length; i++) {
    const address = addresses[i]
    if (!address) {
      results.set(address, null)
      continue
    }
    const result = await geocodeAddress(address)
    results.set(address, result)
    onProgress?.(i + 1, addresses.length)

    // 高德个人认证用户 QPS=1，间隔 1.1s 防止触发限流
    if (i < addresses.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 1100))
    }
  }

  return results
}
