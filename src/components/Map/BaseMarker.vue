<template>
  <l-marker
    ref="markerRef"
    :lat-lng="markerLatLng"
    :icon="markerIcon"
    @click="$emit('click')"
  >
    <l-popup :options="popupOptions">
      <div class="popup-content">
        <h3>{{ base.name }}</h3>
        <p class="popup-route">{{ base.routeName }}</p>
      </div>
    </l-popup>
  </l-marker>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted, onUnmounted, nextTick } from 'vue';
  import { LMarker, LPopup } from '@vue-leaflet/vue-leaflet';
  import { divIcon } from 'leaflet';
  import type { Marker as LeafletMarker } from 'leaflet';
  import type { Base } from '@/types';
  import { useMapStore } from '@/stores/mapStore';

  const props = defineProps<{
    base: Base;
    isSelected: boolean;
  }>();

  defineEmits<{
    click: [];
  }>();

  const mapStore = useMapStore();
  const markerRef = ref<InstanceType<typeof LMarker> | null>(null);

  onMounted(() => {
    nextTick(() => {
      const comp = markerRef.value as unknown as { leafletObject?: { value?: LeafletMarker } | LeafletMarker };
      const lo = comp?.leafletObject;
      const leafletMarker = (
        lo && typeof lo === 'object' && 'value' in lo ? (lo as { value?: LeafletMarker }).value : lo
      ) as LeafletMarker | undefined;
      if (leafletMarker && typeof leafletMarker.openPopup === 'function') {
        mapStore.registerMarkerPopup(props.base.id, () => leafletMarker.openPopup());
      }
    });
  });

  onUnmounted(() => {
    mapStore.unregisterMarkerPopup(props.base.id);
  });

  const categoryClass = computed(() => {
    return `category-${props.base.category}`;
  });

  const markerColor = computed(() => {
    return props.isSelected ? '#dc2626' : '#ef4444';
  });

  const markerNumber = computed(() => {
    const index = mapStore.bases.findIndex((b) => b.id === props.base.id);
    return index + 1;
  });

  const markerLatLng = computed<[number, number]>(() => [props.base.position[1], props.base.position[0]]);

  const iconSize = computed(() => {
    return props.isSelected ? [104, 64] : [92, 56];
  });

  const iconAnchor = computed(() => {
    return [18, 42];
  });

  /** 浮窗整体上移，避免遮挡自定义 divIcon 标记（锚点在图标底部） */
  const popupOptions = computed(() => ({
    closeButton: false,
    className: 'base-popup',
    maxWidth: 320,
    // Leaflet: offset [x, y]，负 y 表示向上偏移（像素）
    offset: [0, -52] as [number, number],
    autoPan: true,
    autoPanPadding: [20, 70] as [number, number],
    autoPanPaddingTopLeft: [20, 20] as [number, number],
    autoPanPaddingBottomRight: [20, 88] as [number, number],
  }));

  const markerIcon = computed<any>(() =>
    divIcon({
      className: 'custom-base-marker-wrapper',
      iconSize: iconSize.value as [number, number],
      iconAnchor: iconAnchor.value as [number, number],
      html: `
      <div class="base-marker ${categoryClass.value} ${props.isSelected ? 'is-selected' : ''}" style="--marker-color: ${markerColor.value}">
        <div class="marker-pin">
          <span class="marker-number">${markerNumber.value}</span>
        </div>
        <div class="marker-tail"></div>
        <div class="marker-pulse"></div>
      </div>
    `,
    }),
  );
</script>

<style lang="scss">
  :deep(.custom-base-marker-wrapper) {
    background: transparent;
    border: none;
  }

  .base-marker {
    position: relative;
    width: 96px;
    height: 60px;
    cursor: pointer;
    transition: transform var(--transition-fast);

    &:hover {
      transform: translateY(-1px);
    }

    &.is-selected {
      transform: scale(1.03);
      z-index: 1000 !important;
    }
  }

  .marker-pin {
    position: absolute;
    left: 0;
    top: 0;
    width: 34px;
    height: 34px;
    background: var(--marker-color);
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.35);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 3;

    .marker-number {
      color: white;
      font-size: 13px;
      font-weight: 700;
    }
  }

  .marker-tail {
    position: absolute;
    left: 13px;
    top: 30px;
    width: 8px;
    height: 14px;
    background: var(--marker-color);
    transform: rotate(20deg);
    border-radius: 0 0 6px 6px;
    z-index: 2;
  }

  .marker-pulse {
    position: absolute;
    left: -3px;
    top: -3px;
    width: 40px;
    height: 40px;
    border: 2px solid var(--marker-color);
    border-radius: 50%;
    opacity: 0.65;
    animation: markerPulse 1.8s ease-out infinite;
    z-index: 1;
  }

  @keyframes markerPulse {
    0% {
      transform: scale(1);
      opacity: 0.55;
    }
    100% {
      transform: scale(1.45);
      opacity: 0;
    }
  }

  // Popup 样式
  :deep(.base-popup) {
    .leaflet-popup-content-wrapper {
      background: white;
      border-radius: var(--radius-md);
      box-shadow: 0 4px 12px var(--shadow);
      padding: 0;
    }

    .leaflet-popup-content {
      margin: 0;
      padding: 12px 16px;
    }

    .leaflet-popup-tip {
      background: white;
    }
  }

  .popup-content {
    h3 {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 4px;
      max-width: 200px;
    }

    .popup-route {
      font-size: 12px;
      color: var(--text-secondary);
      max-width: 200px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  @media (max-width: 768px) {
    :deep(.base-popup) {
      .leaflet-popup-content-wrapper {
        max-width: min(calc(100vw - 36px), 300px) !important;
        border-radius: 12px;
      }

      .leaflet-popup-content {
        padding: 12px 14px;
        min-width: 0;
      }

      /* 小屏上弹尖略上移，贴近大头针 */
      .leaflet-popup-tip-container {
        margin-top: -6px;
      }
    }

    .popup-content h3 {
      font-size: 15px;
      line-height: 1.35;
      max-width: none;
    }

    .popup-content .popup-route {
      font-size: 13px;
      max-width: none;
      white-space: normal;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
  }
</style>
