export interface TileProvider {
  name: string
  subdomains?: string[]
  layers: TileLayer[]
}

export interface TileLayer {
  id: string
  name: string
  url: string
}

export const tileProviders: Record<string, TileProvider> = {
  gaode: {
    name: '高德地图',
    subdomains: ['1', '2', '3', '4'],
    layers: [
      {
        id: 'normal',
        name: '常规',
        // 经验证 2026-03 返回 200 image/png
        url: 'https://webrd0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=8&x={x}&y={y}&z={z}'
      },
      {
        id: 'satellite',
        name: '卫星',
        // 经验证 2026-03 返回 200 image/png
        url: 'https://webst0{s}.is.autonavi.com/appmaptile?lang=zh_cn&size=1&scale=1&style=6&x={x}&y={y}&z={z}'
      }
    ]
  },
  // baidu: {
  //   name: '百度地图',
  //   layers: [
  //     {
  //       id: 'normal',
  //       name: '常规',
  //       url: 'https://maponline0.bdimg.io/stylenormal?qt=tile&x={x}&y={y}&zoom={z}&styles=pl'
  //     },
  //     {
  //       id: 'satellite',
  //       name: '卫星',
  //       url: 'https://maponline0.bdimg.io/stylesatellite?qt=tile&x={x}&y={y}&zoom={z}'
  //     }
  //   ]
  // },
  // tianmap: {
  //   name: '天地图',
  //   subdomains: ['0', '1', '2', '3', '4', '5', '6', '7'],
  //   layers: [
  //     {
  //       id: 'normal',
  //       name: '常规',
  //       url: 'https://t{s}.tianditu.gov.cn/DataServer?T=vec_w&x={x}&y={y}&l={z}'
  //     },
  //     {
  //       id: 'satellite',
  //       name: '卫星',
  //       url: 'https://t{s}.tianditu.gov.cn/DataServer?T=img_w&x={x}&y={y}&l={z}'
  //     }
  //   ]
  // },
  // osm: {
  //   name: 'OpenStreetMap',
  //   layers: [
  //     {
  //       id: 'normal',
  //       name: '常规',
  //       url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
  //     }
  //   ]
  // }
}

export type TileProviderId = keyof typeof tileProviders

export function getTileUrl(providerId: TileProviderId, layerId: string): string {
  const provider = tileProviders[providerId]
  const layer = provider.layers.find(l => l.id === layerId)
  return layer?.url || provider.layers[0].url
}

export function getSubdomains(providerId: TileProviderId): string[] | undefined {
  return tileProviders[providerId].subdomains
}
