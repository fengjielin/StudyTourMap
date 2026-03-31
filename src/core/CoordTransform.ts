/**
 * 坐标系转换工具
 * WGS-84: GPS原始坐标
 * GCJ-02: 国测局坐标（火星坐标），高德/腾讯/谷歌中国使用
 * BD-09: 百度坐标
 */

const PI = Math.PI
const A = 6378245.0
const EE = 0.00669342162296594323

function transformLat(x: number, y: number): number {
  let ret = -100.0 + 2.0 * x + 3.0 * y + 0.2 * y * y + 0.1 * x * y + 0.2 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(y * Math.PI) + 40.0 * Math.sin(y / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (160.0 * Math.sin(y / 12.0 * Math.PI) + 320 * Math.sin(y * Math.PI / 30.0)) * 2.0 / 3.0
  return ret
}

function transformLon(x: number, y: number): number {
  let ret = 300.0 + x + 2.0 * y + 0.1 * x * x + 0.1 * x * y + 0.1 * Math.sqrt(Math.abs(x))
  ret += (20.0 * Math.sin(6.0 * x * Math.PI) + 20.0 * Math.sin(2.0 * x * Math.PI)) * 2.0 / 3.0
  ret += (20.0 * Math.sin(x * Math.PI) + 40.0 * Math.sin(x / 3.0 * Math.PI)) * 2.0 / 3.0
  ret += (150.0 * Math.sin(x / 12.0 * Math.PI) + 300.0 * Math.sin(x / 30.0 * Math.PI)) * 2.0 / 3.0
  return ret
}

function outOfChina(lat: number, lon: number): boolean {
  return lon < 72.004 || lon > 137.8347 || lat < 0.8293 || lat > 55.8271
}

export function wgs84ToGcj02(lon: number, lat: number): [number, number] {
  if (outOfChina(lat, lon)) {
    return [lon, lat]
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0)
  let dLon = transformLon(lon - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI)
  return [lon + dLon, lat + dLat]
}

export function gcj02ToWgs84(lon: number, lat: number): [number, number] {
  if (outOfChina(lat, lon)) {
    return [lon, lat]
  }
  let dLat = transformLat(lon - 105.0, lat - 35.0)
  let dLon = transformLon(lon - 105.0, lat - 35.0)
  const radLat = lat / 180.0 * PI
  let magic = Math.sin(radLat)
  magic = 1 - EE * magic * magic
  const sqrtMagic = Math.sqrt(magic)
  dLat = (dLat * 180.0) / ((A * (1 - EE)) / (magic * sqrtMagic) * PI)
  dLon = (dLon * 180.0) / (A / sqrtMagic * Math.cos(radLat) * PI)
  return [lon - dLon, lat - dLat]
}

export function gcj02ToBd09(lon: number, lat: number): [number, number] {
  const x = lon, y = lat
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * PI)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * PI)
  return [z * Math.cos(theta) + 0.0065, z * Math.sin(theta) + 0.006]
}

export function bd09ToGcj02(lon: number, lat: number): [number, number] {
  const x = lon - 0.0065, y = lat - 0.006
  const z = Math.sqrt(x * x + y * y) + 0.00002 * Math.sin(y * PI)
  const theta = Math.atan2(y, x) + 0.000003 * Math.cos(x * PI)
  return [z * Math.cos(theta), z * Math.sin(theta)]
}

export function wgs84ToBd09(lon: number, lat: number): [number, number] {
  const gcj = wgs84ToGcj02(lon, lat)
  return gcj02ToBd09(gcj[0], gcj[1])
}

export function bd09ToWgs84(lon: number, lat: number): [number, number] {
  const gcj = bd09ToGcj02(lon, lat)
  return gcj02ToWgs84(gcj[0], gcj[1])
}

export type CoordType = 'wgs84' | 'gcj02' | 'bd09'

export function convertCoord(
  lon: number,
  lat: number,
  from: CoordType,
  to: CoordType
): [number, number] {
  if (from === to) return [lon, lat]

  let result: [number, number] = [lon, lat]

  if (from !== 'gcj02') {
    if (from === 'wgs84') result = wgs84ToGcj02(lon, lat)
    else if (from === 'bd09') result = bd09ToGcj02(lon, lat)
  }

  if (to === 'gcj02') return result
  if (to === 'wgs84') return gcj02ToWgs84(result[0], result[1])
  if (to === 'bd09') return gcj02ToBd09(result[0], result[1])

  return result
}
