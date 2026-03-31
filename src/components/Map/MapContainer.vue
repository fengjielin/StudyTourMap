<template>
  <div ref="mapContainerRef" class="map-container">
    <div ref="mapHeaderRef" class="map-header">
      <div class="header-title">
        <svg class="logo" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
          <circle cx="12" cy="10" r="3" />
        </svg>
        <h1>南沙科普研学地图</h1>
      </div>
      <p class="header-subtitle">探索科技与自然的研学之旅</p>
    </div>

    <div class="map-body">
      <div v-if="isMobile && mobileSidebarOpen" class="sidebar-backdrop" aria-hidden="true" @click="mobileSidebarOpen = false" />
      <BaseListSidebar :class="{ 'sidebar-mobile-open': isMobile && mobileSidebarOpen }" @select="handleListSelect" />

      <div class="map-wrapper">
        <button
          v-if="isMobile"
          type="button"
          class="mobile-list-toggle"
          :aria-expanded="mobileSidebarOpen"
          :aria-label="mobileSidebarOpen ? '关闭基地列表' : '打开基地列表'"
          @click="mobileSidebarOpen = !mobileSidebarOpen"
        >
          <svg v-if="!mobileSidebarOpen" class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="8" y1="6" x2="21" y2="6" />
            <line x1="8" y1="12" x2="21" y2="12" />
            <line x1="8" y1="18" x2="21" y2="18" />
            <line x1="3" y1="6" x2="3.01" y2="6" />
            <line x1="3" y1="12" x2="3.01" y2="12" />
            <line x1="3" y1="18" x2="3.01" y2="18" />
          </svg>
          <svg v-else class="toggle-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <l-map :zoom="mapStore.mapZoom" :center="mapStore.mapCenter" :options="{ zoomControl: false }" @ready="onMapReady">
          <l-tile-layer :url="currentTileUrl" :attribution="currentAttribution" :options="tileOptions" />

          <!-- 南沙区外遮罩：世界矩形 + 官方边界 evenodd 镂空 -->
          <l-polygon
            v-if="nanshaMask"
            :lat-lngs="nanshaMask"
            :options="{
              stroke: false,
              fill: true,
              fillColor: '#F1F2EA',
              fillOpacity: 0.92,
              fillRule: 'evenodd',
              interactive: false,
            }"
          />

          <!-- 官方行政边界线 -->
          <l-polygon
            v-for="(ring, i) in boundaryData.outlineRings"
            :key="'outline-' + i"
            :lat-lngs="ring"
            :options="{
              color: '#4B5563',
              weight: 2,
              dashArray: '8 6',
              fill: false,
              interactive: false,
            }"
          />

          <BaseMarker v-for="base in mapStore.bases" :key="base.id" :base="base" :is-selected="base.id === mapStore.selectedBaseId" @click="handleMarkerClick(base)" />
        </l-map>

        <MapSwitcher class="map-controls" />
      </div>
    </div>

    <Transition name="slide">
      <BaseInfoPanel v-if="mapStore.selectedBase" :base="mapStore.selectedBase" @close="handleClosePanel" />
    </Transition>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue';
  import { LMap, LTileLayer, LPolygon } from '@vue-leaflet/vue-leaflet';
  import { control, latLngBounds, type Map as LeafletMap, type LatLngBoundsExpression } from 'leaflet';
  import { useMapStore } from '@/stores/mapStore';
  import { tileProviders, getSubdomains, type TileProviderId } from '@/core/TileProvider';
  import { parseNanshaBoundaryGeoJson, getCenterLngLat } from '@/core/nanshaBoundary';
  import type { ParsedNanshaBoundary, NanshaBoundaryGeoJson } from '@/core/nanshaBoundary';
  import type { Base } from '@/types';
  import BaseMarker from './BaseMarker.vue';
  import BaseListSidebar from './BaseListSidebar.vue';
  import MapSwitcher from './MapSwitcher.vue';
  import BaseInfoPanel from '@/components/Panel/BaseInfoPanel.vue';
  import { useMobileBreakpoint } from '@/composables/useMobileBreakpoint';

  const mapStore = useMapStore();
  const { isMobile } = useMobileBreakpoint();
  const mobileSidebarOpen = ref(false);
  const mapContainerRef = ref<HTMLElement | null>(null);
  const mapHeaderRef = ref<HTMLElement | null>(null);
  const mapInstance = ref<LeafletMap | null>(null);
  const boundaryData = ref<ParsedNanshaBoundary>({ outlineRings: [], mainMaskRing: null, maskInnerRings: [] });

  /** 侧栏/遮罩与顶栏对齐：用实际高度覆盖固定像素，避免 H5 上出现缝隙 */
  function syncMapHeaderHeight() {
    const el = mapHeaderRef.value;
    const root = mapContainerRef.value;
    if (!el || !root) return;
    root.style.setProperty('--map-header-height', `${el.offsetHeight}px`);
  }

  let headerResizeObserver: ResizeObserver | null = null;

  watch(isMobile, (m) => {
    if (!m) mobileSidebarOpen.value = false;
    nextTick(() => syncMapHeaderHeight());
  });

  onMounted(() => {
    nextTick(() => {
      syncMapHeaderHeight();
      const el = mapHeaderRef.value;
      if (el && typeof ResizeObserver !== 'undefined') {
        headerResizeObserver = new ResizeObserver(() => syncMapHeaderHeight());
        headerResizeObserver.observe(el);
      }
      window.addEventListener('resize', syncMapHeaderHeight);
      window.addEventListener('orientationchange', syncMapHeaderHeight);
    });
  });

  onUnmounted(() => {
    headerResizeObserver?.disconnect();
    headerResizeObserver = null;
    window.removeEventListener('resize', syncMapHeaderHeight);
    window.removeEventListener('orientationchange', syncMapHeaderHeight);
  });

  // 加载 bases.json 和 440115.geoJson（并行）
  onMounted(async () => {
    mapStore.setLoading(true);
    try {
      const [basesRes, boundaryRes] = await Promise.all([fetch('/data/bases.json'), fetch('/data/440115.geoJson')]);
      const [bases, boundaryJson] = await Promise.all([basesRes.json(), boundaryRes.json() as Promise<NanshaBoundaryGeoJson>]);
      mapStore.setBases(bases);
      boundaryData.value = parseNanshaBoundaryGeoJson(boundaryJson);

      const center = getCenterLngLat(boundaryJson);
      if (center) {
        mapStore.setMapView([center[1], center[0]], 12);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      mapStore.setLoading(false);
    }
  });

  // 世界矩形（遮罩外层）
  const WORLD_RING: [number, number][] = [
    [-90, -180],
    [-90, 180],
    [90, 180],
    [90, -180],
  ];

  /** evenodd 遮罩：[世界矩形, 主外环]，缩放时更稳定 */
  const nanshaMask = computed<any>(() => {
    if (!boundaryData.value.mainMaskRing) return null;
    return [WORLD_RING, boundaryData.value.mainMaskRing];
  });

  const currentTileUrl = computed(() => {
    const provider = tileProviders[mapStore.currentProvider as TileProviderId];
    const layer = provider?.layers.find((l) => l.id === mapStore.currentLayer);
    return layer?.url || provider?.layers[0].url || '';
  });

  const currentAttribution = computed(() => {
    const attributionMap: Record<string, string> = {
      gaode: '&copy; <a href="https://lbs.amap.com/">高德地图</a>',
      tianmap: '&copy; <a href="https://www.tianditu.gov.cn/">天地图</a>',
      osm: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
    };
    return attributionMap[mapStore.currentProvider] || '';
  });

  const tileOptions = computed(() => {
    const subdomains = getSubdomains(mapStore.currentProvider as TileProviderId);
    return {
      subdomains: subdomains || ['1', '2', '3', '4'],
      maxZoom: 17,
      minZoom: 10,
    };
  });

  function onMapReady(map: LeafletMap) {
    mapInstance.value = map;

    // 从 GeoJSON 首块外轮廓计算可视范围
    if (boundaryData.value.outlineRings.length > 0) {
      const bounds = latLngBounds(boundaryData.value.outlineRings[0] as [number, number][]).pad(0.08);
      map.setMaxBounds(bounds as LatLngBoundsExpression);
      map.fitBounds(bounds, { animate: true });
    }

    map.addControl(control.zoom({ position: 'bottomright' }));
  }

  function handleMarkerClick(base: Base) {
    mapStore.selectBase(base.id);
    if (mapInstance.value) {
      mapInstance.value.flyTo([base.position[1], base.position[0]], 14, { duration: 0.8 });
    }
  }

  /** 侧栏点击：与地图点选一致，并打开对应 Leaflet 弹窗 */
  function handleListSelect(base: Base) {
    handleMarkerClick(base);
    if (isMobile.value) mobileSidebarOpen.value = false;
    nextTick(() => {
      mapStore.openMarkerPopup(base.id);
    });
  }

  function handleClosePanel() {
    mapStore.selectBase(null);
  }
</script>

<style lang="scss" scoped>
  .map-container {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--background);
    --map-header-height: 118px;
  }

  .map-header {
    padding: 16px 24px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    color: white;
    text-align: center;
    box-shadow: 0 2px 10px var(--shadow);

    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 10px;

      .logo {
        width: 28px;
        height: 28px;
      }

      h1 {
        font-size: 20px;
        font-weight: 600;
        margin: 0;
      }
    }

    .header-subtitle {
      font-size: 13px;
      opacity: 0.9;
      margin-top: 4px;
    }
  }

  .map-body {
    flex: 1;
    display: flex;
    min-height: 0;
    overflow: hidden;
  }

  @media (max-width: 768px) {
    .map-header {
      padding: 12px 16px 10px;

      .header-title h1 {
        font-size: 17px;
      }

      .header-subtitle {
        font-size: 12px;
        margin-top: 2px;
      }

      .header-title .logo {
        width: 24px;
        height: 24px;
      }
    }

    .map-body {
      flex-direction: row;
      position: relative;
    }
  }

  .sidebar-backdrop {
    display: none;
  }

  @media (max-width: 768px) {
    .sidebar-backdrop {
      display: block;
      position: fixed;
      inset: 0;
      top: var(--map-header-height);
      background: rgba(15, 23, 42, 0.45);
      z-index: 1040;
      -webkit-tap-highlight-color: transparent;
    }
  }

  .map-wrapper {
    flex: 1;
    position: relative;
    overflow: hidden;
    min-width: 0;
  }

  .mobile-list-toggle {
    display: none;
  }

  @media (max-width: 768px) {
    .mobile-list-toggle {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      left: 12px;
      top: 12px;
      z-index: 1050;
      width: 44px;
      height: 44px;
      padding: 0;
      border: none;
      border-radius: 12px;
      background: var(--surface);
      color: var(--text-primary);
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.12);
      cursor: pointer;
      -webkit-tap-highlight-color: transparent;
    }

    .mobile-list-toggle .toggle-icon {
      width: 22px;
      height: 22px;
    }
  }

  .map-controls {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 1000;
  }

  @media (max-width: 768px) {
    .map-controls {
      top: 12px;
      right: 12px;
    }
  }

  // 面板过渡动画
  .slide-enter-active,
  .slide-leave-active {
    transition: transform var(--transition-normal), opacity var(--transition-normal);
  }

  .slide-enter-from,
  .slide-leave-to {
    transform: translateY(100%);
    opacity: 0;
  }
</style>
