# 南沙科普研学地图 — 完整项目文档

> 整理时间：2026-03-31
> 项目路径：`StudyTourMap/`
> 版本：0.0.1

---

## 目录

1. [项目概述](#1-项目概述)
2. [技术栈](#2-技术栈)
3. [项目结构](#3-项目结构)
4. [类型定义](#4-类型定义)
5. [数据文件](#5-数据文件)
6. [核心模块](#6-核心模块)
7. [组件详解](#7-组件详解)
8. [样式系统](#8-样式系统)
9. [Pinia 状态管理](#9-pinia-状态管理)
10. [H5 适配工作](#10-h5-适配工作)
11. [坐标校正脚本](#11-坐标校正脚本)
12. [数据流与架构](#12-数据流与架构)
13. [环境变量](#13-环境变量)
14. [后续建议](#14-后续建议)

---

## 1. 项目概述

**项目名称**: 南沙区科普研学地图（StudyTourMap）

**核心功能**: 基于 Vue 3 + Leaflet 的交互式研学基地地图，支持多地图源切换、基地搜索筛选、详情查看与导航链接。

**功能特性**:

- 10 个研学基地在地图上的可视化展示
- 三种分类：科技探索（technology）、文化体验（culture）、自然生态（nature）
- 多地图源切换：高德地图（常规/卫星）
- 南沙区行政边界绘制与区域遮罩
- 基地列表搜索与分类筛选
- 基地详情面板，含导航跳转

---

## 2. 技术栈

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue | ^3.4.21 |
| 构建工具 | Vite | ^5.2.0 |
| 语言 | TypeScript | ^5.2.2 |
| 状态管理 | Pinia | ^2.1.7 |
| 地图引擎 | Leaflet + vue-leaflet | ^1.9.4 |
| 样式 | SCSS | ^1.72.0 |
| 地图瓦片 | 高德地图 | Web 服务 |

---

## 3. 项目结构

```
StudyTourMap/
├── public/
│   └── data/
│       ├── bases.json         # 研学基地数据（10个基地）
│       └── 440115.geoJson     # 南沙区行政边界 GeoJSON
├── src/
│   ├── assets/
│   │   └── styles/               # 样式资源
│   │       ├── main.scss         # 全局样式
│   │       └── variables.scss    # CSS 变量定义
│   ├── components/
│   │   ├── Map/
│   │   │   ├── MapContainer.vue     # 主地图容器（含顶栏）
│   │   │   ├── BaseMarker.vue       # 地图标记（数字+脉冲动画）
│   │   │   ├── BaseListSidebar.vue  # 基地列表侧边栏
│   │   │   └── MapSwitcher.vue      # 地图图层切换器
│   │   └── Panel/
│   │       └── BaseInfoPanel.vue    # 基地详情面板
│   ├── composables/
│   │   └── useMobileBreakpoint.ts   # 移动端断点检测
│   ├── core/
│   │   ├── TileProvider.ts         # 地图瓦片提供者配置
│   │   ├── Geocoder.ts             # 高德地理编码服务
│   │   ├── nanshaBoundary.ts       # 南沙边界解析与遮罩
│   │   └── CoordTransform.ts       # 坐标系转换工具（WGS/GCJ/BD）
│   ├── stores/
│   │   └── mapStore.ts             # Pinia 全局状态
│   ├── types/
│   │   └── index.ts                # TypeScript 接口定义
│   ├── App.vue                     # 根组件
│   └── main.ts                     # 入口文件
├── scripts/
│   └── geocode-bases.mjs           # 高德坐标批量校正脚本
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 4. 类型定义

> 文件：`src/types/index.ts`

### Base（研学基地）

```typescript
export interface Base {
  id: string                                    // 唯一标识
  name: string                                 // 基地名称
  unit: string                                 // 所属单位
  routeName: string                            // 研学路线名称
  address: string                               // 地址
  category: 'technology' | 'culture' | 'nature' // 分类
  position: [number, number]                   // [lng, lat] GCJ-02 坐标系
  images: string[]                             // 图片 URL 数组
}
```

### Route（研学路线）

```typescript
export interface Route {
  id: string
  name: string
  baseIds: string[]  // 包含的基地 ID 列表
  color: string     // 路线颜色
}
```

### MapState（地图状态）

```typescript
export interface MapState {
  currentProvider: string                         // 当前地图提供商
  currentLayer: string                          // 当前图层
  selectedBaseId: string | null                 // 选中基地 ID
  bases: Base[]                                 // 基地列表
  routes: Route[]                               // 路线列表
  isLoading: boolean                            // 加载状态
  mapCenter: [number, number]                   // 地图中心
  mapZoom: number                               // 缩放级别
  markerPopupRegistry: Record<string, () => void> // 标记弹窗注册表
}
```

---

## 5. 数据文件

### 5.1 bases.json

包含 10 个研学基地，涵盖南沙区科技、文化、自然三大类别：

| ID | 名称 | 分类 | 坐标 (GCJ-02) |
|----|------|------|---------------|
| base_01 | 广东空天科技研究院科普基地 | technology | [113.543053, 22.723961] |
| base_02 | 隧道博物馆 | technology | [113.552033, 22.758936] |
| base_03 | 广州南华珠宝矿物科普基地 | culture | [113.488955, 22.880962] |
| base_04 | 广州海洋地质调查局科普基地 | technology | [113.604136, 22.742628] |
| base_05 | 广州市农业农村科学院 | nature | [113.572691, 22.712631] |
| base_06 | 大湾区中央湿地公园(南沙湿地) | nature | [113.619072, 22.626854] |
| base_07 | 广州市香港科大霍英东研究院... | technology | [113.609271, 22.749885] |
| base_08 | 云纱星韵香云纱非遗文化园 | culture | [113.46304, 22.881264] |
| base_09 | 南沙水鸟世界生态园 | nature | [113.619072, 22.626854] |
| base_10 | 广州软件应用技术研究院 | technology | [113.599903, 22.741123] |

### 5.2 440115.geoJson

南沙区行政边界数据（GeoJSON FeatureCollection，adcode: 440115），用于：

- 计算地图可视范围（fitBounds）
- 绘制虚线行政边界
- 使用 evenodd 规则创建区域遮罩（仅显示南沙区域）

---

## 6. 核心模块

### 6.1 TileProvider.ts — 地图瓦片源管理

**文件**: `src/core/TileProvider.ts`

定义支持的地图瓦片提供商和图层，支持多 subdomain 负载均衡：

```typescript
// 当前启用的提供商
tileProviders = {
  gaode: {
    name: '高德地图',
    subdomains: ['1', '2', '3', '4'],
    layers: [
      { id: 'normal',  name: '常规', url: 'https://webst0{s}.is.autonavi.com/...' },
      { id: 'satellite', name: '卫星', url: 'https://webst0{s}.is.autonavi.com/...' }
    ]
  }
}
```

已注释但可启用的提供商：百度地图（BD-09 坐标系）、天地图（需申请 Key）、OpenStreetMap。

### 6.2 Geocoder.ts — 高德地理编码服务

**文件**: `src/core/Geocoder.ts`

封装高德 Web 服务 API，提供地理编码、逆地理编码、批量处理功能：

| 函数 | 说明 |
|------|------|
| `geocodeAddress(address)` | 地址 → 坐标 |
| `reGeocode(lng, lat)` | 坐标 → 地址 |
| `batchGeocode(addresses, onProgress?)` | 批量处理，带速率限制（1次/秒） |

### 6.3 nanshaBoundary.ts — 南沙边界解析

**文件**: `src/core/nanshaBoundary.ts`

解析 GeoJSON 边界数据，支持 Polygon 和 MultiPolygon：

| 函数 | 说明 |
|------|------|
| `parseNanshaBoundaryGeoJson(data)` | 解析为 outlineRings + mainMaskRing |
| `lngLatRingToLeaflet(ring)` | GeoJSON [lng,lat] → Leaflet [lat,lng] |
| `getCenterLngLat(data)` | 从 properties.center 取地图中心 |

**遮罩原理**：使用 Leaflet Polygon 的 `fillRule: 'evenodd'`，外层世界矩形 + 内层南沙外环，实现"只显示南沙区域"的挖空效果。

### 6.4 CoordTransform.ts — 坐标系转换

**文件**: `src/core/CoordTransform.ts`

支持 WGS-84、GCJ-02、BD-09 三种坐标系之间的互转：

| 函数 | 说明 |
|------|------|
| `wgs84ToGcj02(lon, lat)` | GPS 坐标 → 火星坐标 |
| `gcj02ToBd09(lon, lat)` | 火星坐标 → 百度坐标 |
| `convertCoord(lon, lat, from, to)` | 通用转换函数 |

> 注：项目数据统一使用 GCJ-02，与高德地图坐标系一致。

---

## 7. 组件详解

### 7.1 MapContainer.vue — 主地图容器

**文件**: `src/components/Map/MapContainer.vue`（390行）

**职责**：

- 整体页面布局：顶栏 + 地图 + 侧栏 + 遮罩
- 响应式切换：桌面固定侧栏 / 移动端抽屉
- 数据加载：并行获取 bases.json 和 440115.geoJson
- 南沙区域遮罩渲染（evenodd 镂空）
- 顶栏高度动态测量（ResizeObserver）
- 管理 mapStore 中 selectedBase 状态

**关键特性**：

- 动态 CSS 变量 `--map-header-height`：通过 ResizeObserver 测量实际顶栏高度，侧栏和遮罩的 `top` 与之对齐
- 地图视口限制：`minZoom: 10, maxZoom: 17`，防止浏览到南沙区外
- `flyTo` 动画：选中基地时平滑飞转到该位置

**事件处理**：

| 方法 | 触发场景 |
|------|----------|
| `handleMarkerClick(base)` | 点击地图标记 |
| `handleListSelect(base)` | 点击侧栏列表项 |
| `handleClosePanel()` | 关闭详情面板 |
| `syncMapHeaderHeight()` | 同步顶栏高度到 CSS 变量 |

---

### 7.2 BaseMarker.vue — 地图标记

**文件**: `src/components/Map/BaseMarker.vue`（263行）

**职责**：在 Leaflet 地图上显示基地位置标记。

**外观**：

- 数字编号圆点（直径 34px）
- 底部小三角指向位置
- 分类颜色：科技(蓝 #2563EB)、文化(紫 #8B5CF6)、自然(绿 #10B981)
- 选中状态：脉冲呼吸灯动画 + 放大 1.1 倍

**标记结构**（纯 CSS DivIcon，无图片依赖）：

```
      ●               ← 圆形头部 (34px)
     /\              ← 尾部 (8×14px)
    ╭──╮              ← 脉冲环（选中时显示）
    │01│              ← 数字编号
    ╰──╯
```

**Marker Popup 注册机制**：

Leaflet 弹窗需要直接持有 Marker 实例才能打开，但业务侧（如侧栏点击）无法直接访问。解决方案：

1. BaseMarker 在 `onMounted` 中获取 Leaflet Marker 实例，注册 `openPopup` 函数
2. `mapStore.registerMarkerPopup(baseId, openPopupFn)` 将函数存入注册表
3. 外部通过 `mapStore.openMarkerPopup(baseId)` 调用任意标记的弹窗
4. `onUnmounted` 时注销，防止内存泄漏

---

### 7.3 BaseListSidebar.vue — 基地列表侧边栏

**文件**: `src/components/Map/BaseListSidebar.vue`（271行）

**职责**：展示基地列表，支持搜索和分类展示。

**功能**：

- 实时搜索（名称、地址、路线名）
- 序号对应地图标记
- 分类标签（科技/文化/自然，颜色与标记一致）
- 选中高亮（左侧蓝色指示条）

**响应式**：

- **桌面端**：固定在左侧，宽度 300px
- **移动端**：固定抽屉，从左侧滑入（宽 88vw，最大 320px）

**移动端遮罩**：

- 半透明黑色背景覆盖地图，`z-index: 1040`
- `top` 使用 `--map-header-height` 与顶栏精确对齐
- 点击遮罩关闭抽屉

---

### 7.4 BaseInfoPanel.vue — 基地详情面板

**文件**: `src/components/Panel/BaseInfoPanel.vue`（391行）

**职责**：展示选中基地的完整信息。

**内容区域**：

| 区块 | 内容 |
|------|------|
| 分类标签 | 图标 + 分类名称（科技/文化/自然） |
| 基地名称 | 大字标题 |
| 路线名称 | 研学路线副标题 |
| 所属单位 | 运营主体 |
| 地址 | 带复制按钮 |
| 图片画廊 | 横向滚动，支持无图片占位 |
| 操作按钮 | "在高德地图导航"、"查看详情" |

**分类配置**：

| 分类 | 图标 | 颜色 |
|------|------|------|
| technology（科技探索） | 🚀 | #2563EB |
| culture（文化体验） | 🎨 | #8B5CF6 |
| nature（自然生态） | 🌿 | #10B981 |

**外链按钮**：

- **导航**：拼接高德地图 URL `https://uri.amap.com/navigation?to=lng,lat,name,mode=car`
- **详情**：`https://www.map.com/Search?query=基地名称&region=广州南沙`

**响应式**：

- **桌面端**：右下角固定卡片，宽 380px，z-index 999
- **移动端**：底部全宽抽屉，高 `min(82vh, calc(100dvh - 72px))`，z-index 1200，预留 `safe-area-inset-bottom`

---

### 7.5 MapSwitcher.vue — 地图图层切换器

**文件**: `src/components/Map/MapSwitcher.vue`（206行）

**职责**：切换地图瓦片提供商和图层类型。

**UI**：下拉菜单，点击展开选项，选中后自动收起。

---

## 8. 样式系统

### 8.1 variables.scss — CSS 变量

**文件**: `src/assets/styles/variables.scss`

**主题色**：

```scss
--primary: #2563EB;           // 主色（蓝）
--primary-dark: #1D4ED8;      // 深蓝
--primary-light: #3B82F6;     // 浅蓝
--secondary: #10B981;         // 辅助色（绿）
--accent: #F59E0B;            // 强调色（橙）
```

**分类色**：

```scss
--tech-color: #2563EB;       // 科技
--culture-color: #8B5CF6;    // 文化
--nature-color: #10B981;      // 自然
```

**其他变量**：背景色、表面色、文字色（主/次/弱）、边框色、圆角半径、阴影、过渡时长。

### 8.2 main.scss — 全局样式

**文件**: `src/assets/styles/main.scss`

包含：盒模型重置、字体设置、通用按钮卡片样式、自定义滚动条、Leaflet 控件样式覆盖、动画 keyframes（pulse、fadeIn、slideUp、shimmer）。

---

## 9. Pinia 状态管理

**文件**: `src/stores/mapStore.ts`

### State

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| currentProvider | string | 'gaode' | 当前地图提供商 |
| currentLayer | string | 'normal' | 当前图层 |
| selectedBaseId | string \| null | null | 选中基地 |
| bases | Base[] | [] | 基地列表 |
| routes | Route[] | [] | 路线列表 |
| isLoading | boolean | false | 加载状态 |
| mapCenter | [number, number] | [113.35, 22.75] | 地图中心 |
| mapZoom | number | 12 | 缩放级别 |
| markerPopupRegistry | Record | {} | 弹窗注册表 |

### Getters

| Getter | 返回 | 说明 |
|--------|------|------|
| selectedBase | Base \| undefined | 当前选中基地完整数据 |

### Actions

| Action | 参数 | 说明 |
|--------|------|------|
| setProvider | providerId | 切换提供商 |
| setLayer | layerId | 切换图层 |
| selectBase | baseId \| null | 选择/取消选择基地 |
| setBases | bases[] | 设置基地列表 |
| setLoading | boolean | 设置加载状态 |
| setMapView | center, zoom | 设置地图视图 |
| updateBasePosition | baseId, position | 更新基地坐标 |
| registerMarkerPopup | baseId, fn | 注册标记弹窗函数 |
| unregisterMarkerPopup | baseId | 注销弹窗函数 |
| openMarkerPopup | baseId | 打开指定基地弹窗 |

---

## 10. H5 适配工作

### 10.1 左侧基地列表 — 移动端抽屉模式

#### 改动文件

- `src/composables/useMobileBreakpoint.ts`（新增）
- `src/components/Map/MapContainer.vue`
- `src/components/Map/BaseListSidebar.vue`

#### 实现逻辑

| 场景 | 行为 |
|------|------|
| 桌面端（> 768px） | 左侧固定列表，常态显示 |
| 移动端（≤ 768px） | 列表默认隐藏；从左侧滑出为固定抽屉（宽 88vw，最大 320px） |
| 选中基地 | 自动关闭抽屉，地图飞点 + 弹出 Leaflet 气泡 |

#### 断点检测 (`useMobileBreakpoint.ts`)

```typescript
export function useMobileBreakpoint(breakpointPx = 768) {
  const isMobile = ref(false);
  onMounted(() => {
    mq = window.matchMedia(`(max-width: ${breakpointPx}px)`);
    sync();
    mq.addEventListener('change', sync);
  });
  return { isMobile };
}
```

#### 抽屉样式 (`BaseListSidebar.vue`)

```scss
@media (max-width: 768px) {
  .base-list-sidebar {
    position: fixed;
    top: var(--map-header-height, 112px);
    left: 0;
    bottom: 0;
    width: min(88vw, 320px);
    z-index: 1060;
    transform: translateX(-100%);
    transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  }

  .base-list-sidebar.sidebar-mobile-open {
    transform: translateX(0);
    pointer-events: auto;
  }
}
```

#### 顶栏高度动态同步

```typescript
function syncMapHeaderHeight() {
  const el = mapHeaderRef.value;
  const root = mapContainerRef.value;
  if (!el || !root) return;
  root.style.setProperty('--map-header-height', `${el.offsetHeight}px`);
}

// ResizeObserver 监听 + resize / orientationchange 兜底
headerResizeObserver = new ResizeObserver(() => syncMapHeaderHeight());
headerResizeObserver.observe(mapHeaderRef.value);
```

> **解决**：移动端抽屉 `top` 用 CSS 变量引用实测顶栏高度，避免因固定像素偏差导致抽屉与顶栏之间出现空白缝隙。

---

### 10.2 基地标记弹窗 — 移动端优化

#### 改动文件

- `src/components/Map/BaseMarker.vue`

#### 桌面端 vs 移动端对比

| 属性 | 桌面端 | 移动端（≤ 768px） |
|------|--------|-------------------|
| maxWidth | 320px | `min(calc(100vw - 36px), 300px)` |
| autoPanPadding | [24, 24] | [20, 70]（上下分别设） |
| 标题字号 | 14px | 15px |
| 线路名字数 | 单行省略 | 最多 3 行 |

---

### 10.3 底部详情面板 — 移动端优化

#### 改动文件

- `src/components/Panel/BaseInfoPanel.vue`

#### 桌面端 vs 移动端对比

| 项目 | 桌面端 | 移动端（≤ 768px） |
|------|--------|-------------------|
| 弹出位置 | 右侧固定卡片（380px 宽） | 全宽底部抽屉 |
| 最大高度 | 60vh | `min(82vh, calc(100dvh - 72px))` |
| z-index | 999 | 1200（盖过地图控件） |
| 按钮排列 | 横向 | 纵向，宽度撑满 |
| 安全区域 | — | `env(safe-area-inset-bottom)` |

---

## 11. 坐标校正脚本

### 11.1 改动文件

- `scripts/geocode-bases.mjs`

### 11.2 升级说明

| 版本 | API | 精度 | 说明 |
|------|-----|------|------|
| 旧版 | `v3/geocode/geo` | 门牌/道路级 | 按地址字符串解析，常落在路段中心或路口 |
| **新版** | `v5/place/text`（优先）→ `v3/geocode/geo`（兜底） | **POI 级** | 关键字搜索返回同名场馆/学校的精确标注点 |

### 11.3 使用方法

```bash
# 基本用法
node scripts/geocode-bases.mjs --key=你的高德Web服务Key

# 可选：限定城市
node scripts/geocode-bases.mjs --key=你的Key --region=广州市
```

**前提**：

1. 在 [高德控制台](https://console.amap.com/dev/key/app) 创建 Web 服务 Key
2. Key 需开通「搜索」相关权限（用于 v5 place/text）
3. Key 通过命令行 `--key=` 传入，脚本内不硬编码

### 11.4 输出示例

```
[geocode-bases] 共 10 个基地，region=广州市
  优先：v5 place/text → 兜底：v3 geocode/geo

----------------------------------------------------------------------
[1/10] 广东空天科技研究院科普基地 ... ✅ [113.543053, 22.723961] (place/text) POI: 广东空天科技研究院(南沙)
   旧坐标: [113.542000, 22.723000]
[2/10] 隧道博物馆 ... ✅ [113.552033, 22.758936] (place/text)
   旧坐标: [113.551000, 22.758000]
...
----------------------------------------------------------------------

✅ 校正完成，数据已写入 public/data/bases.json
```

---

## 12. 数据流与架构

### 12.1 应用初始化流程

```
main.ts
  ├── createApp(App)
  ├── createPinia()
  └── app.use(pinia)

App.vue
  └── MapContainer (根组件)

MapContainer.onMounted
  ├── fetch('/data/bases.json')  ─→ mapStore.setBases()
  ├── fetch('/data/440115.geoJson') → parseNanshaBoundaryGeoJson()
  ├── getCenterLngLat()           → mapStore.setMapView()
  └── mapStore.setLoading(false)
```

### 12.2 核心交互流程

#### 场景 A：点击地图标记

```
点击 BaseMarker
  → BaseMarker.$emit('click')
  → MapContainer.handleMarkerClick(base)
  → mapStore.selectBase(base.id)
  → BaseInfoPanel 显示 (watch selectedBase)
```

#### 场景 B：点击侧栏列表

```
点击 BaseListSidebar 列表项
  → BaseListSidebar.$emit('select', base)
  → MapContainer.handleListSelect(base)
  → mapStore.selectBase(base.id)
  → mapStore.openMarkerPopup(base.id)  → BaseMarker 弹窗打开
  → map.flyTo(base.position, 14)
  → BaseInfoPanel 显示
```

#### 场景 C：关闭详情面板

```
点击 BaseInfoPanel 关闭按钮
  → BaseInfoPanel.$emit('close')
  → MapContainer.handleClosePanel()
  → mapStore.selectBase(null)
  → BaseInfoPanel 隐藏
```

---

## 13. 环境变量

**文件**: `.env.example`

```bash
VITE_AMAP_KEY=e9147212b1e4b1d7fb2d4e994b003d45
```

用于 `Geocoder.ts` 中的高德地理编码 API 调用。

**申请地址**: https://console.amap.com/dev/key/app

---

## 14. 后续建议

### 14.1 坐标人工校准

对于偏差仍大的基地（如涉及多个校区的单位），建议：

1. 登录[高德开放平台](https://lbs.amap.com/dev/key/app)，在地图上手动拾取对应 POI 坐标
2. 或在高德官网搜索基地名称，对比标注点与当前坐标
3. 直接将更精确的 POI 坐标填入 `bases.json`

### 14.2 真机测试重点

- iOS Safari 和 Android Chrome 各做一次横竖屏切换
- 验证抽屉与顶栏是否无缝
- 检查地图标记弹窗在移动端是否被底部栏遮挡
- 测试导航按钮在高德 App 中的跳转效果

### 14.3 首屏闪烁处理

若抽屉出现"跳一下"（CSS 变量测量滞后于字体加载），可在 `document.fonts.ready` 后补一次 `syncMapHeaderHeight()`：

```typescript
onMounted(() => {
  nextTick(() => {
    syncMapHeaderHeight();
    document.fonts.ready.then(() => syncMapHeaderHeight());
    // ...
  });
});
```

### 14.4 图片资源扩展

当前 `bases.json` 中所有基地的 `images` 字段均为空数组，建议：

1. 为每个基地拍摄或收集 2-3 张代表性图片
2. 将图片放入 `public/images/` 目录
3. 更新 `bases.json` 中的 `images` 数组

### 14.5 研学路线功能

当前 `Route` 接口已定义但未完全使用，可考虑：

1. 在地图上绘制路线连接线
2. 在侧栏添加"研学路线"筛选视图
3. 实现路线点击高亮功能

---

## 附录：CSS 变量速查表

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `--map-header-height` | 118px（桌面）→ JS 实测 | 顶栏实际高度 |
| `--primary` | #2563EB | 主色 |
| `--primary-dark` | #1D4ED8 | 深蓝 |
| `--primary-light` | #3B82F6 | 浅蓝 |
| `--tech-color` | #2563EB | 科技分类色 |
| `--culture-color` | #8B5CF6 | 文化分类色 |
| `--nature-color` | #10B981 | 自然分类色 |
| `--background` | #F8FAFC | 页面背景 |
| `--surface` | #FFFFFF | 卡片/面板背景 |
| `--text-primary` | #1E293B | 主文字 |
| `--text-secondary` | #64748B | 次级文字 |
| `--text-muted` | #94A3B8 | 弱化文字 |
| `--border` | #E2E8F0 | 边框色 |
| `--radius-sm` | 6px | 小圆角 |
| `--radius-md` | 10px | 中圆角 |
| `--radius-lg` | 16px | 大圆角 |
