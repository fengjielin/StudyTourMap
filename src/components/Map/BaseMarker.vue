<template>
  <l-marker ref="markerRef" :lat-lng="markerLatLng" :icon="markerIcon" @click="$emit('click')" />
</template>

<script setup lang="ts">
  import { LMarker } from '@vue-leaflet/vue-leaflet';
  import { divIcon } from 'leaflet';
  import type { Marker as LeafletMarker } from 'leaflet';
  import type { Base } from '@/types';
  import { useMapStore } from '@/stores/mapStore';

  const props = defineProps<{
    base: Base;
    isSelected: boolean;
    index: number;
    allImages: Record<string, { default: string }>;
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
      const leafletMarker = (lo && typeof lo === 'object' && 'value' in lo ? (lo as { value?: LeafletMarker }).value : lo) as LeafletMarker | undefined;
      if (leafletMarker && typeof leafletMarker.openPopup === 'function') {
        mapStore.registerMarkerPopup(props.base.id, () => leafletMarker.openPopup());
      }
    });
  });

  onUnmounted(() => {
    mapStore.unregisterMarkerPopup(props.base.id);
  });

  const markerColor = computed(() => {
    return props.isSelected ? '#dc2626' : '#ef4444';
  });

  const markerNumber = computed(() => {
    return props.index + 1;
  });

  const markerLatLng = computed<[number, number]>(() => [props.base.position[1], props.base.position[0]]);

  // 根据索引决定卡片在左边还是右边
  const isCardOnLeft = computed(() => props.index == 9 || props.index % 2 === 0);

  const markerIcon = computed<any>(() => {
    const cardOnLeft = isCardOnLeft.value;
    let firstImage = props.allImages[props.base.images?.[0]]?.default;

    if (props.base.images?.[0].startsWith('@/')) {
      const key = props.base.images?.[0].replace('@/assets/images/', '/src/assets/images/');
      firstImage = props.allImages[key]?.default;
    }
    const cardImageHtml = firstImage ? `<div class="marker-card-image"><img src="${firstImage}" alt="${props.base.name}" /></div>` : '';

    return divIcon({
      className: 'custom-base-marker-wrapper',
      iconSize: [200, 40] as [number, number],
      // 锚点 (10, 20) 是定位点圆心的位置，始终对应地理坐标
      iconAnchor: [10, 20] as [number, number],
      html: `
      <div class="base-marker-container ${cardOnLeft ? 'card-left' : 'card-right'} ${props.isSelected ? 'is-selected' : ''}" style="--marker-color: ${markerColor.value}">
        <!-- 定位点：position absolute 固定在锚点位置 -->
        <div class="marker-point">
          <span class="marker-number">${markerNumber.value}</span>
          <div class="marker-pulse"></div>
        </div>
        <!-- 卡片 + 连线 -->
        <div class="marker-card-area">
          <svg class="marker-connector" viewBox="0 0 36 40" preserveAspectRatio="none">
            <path class="connector-path" d="${cardOnLeft ? 'M 36 20 L 0 20' : 'M 0 20 L 36 20'}" />
          </svg>
          <div class="marker-card">
            ${cardImageHtml}
            <div class="marker-card-info">
              <span class="marker-card-name">${props.base.name}</span>
              <span class="marker-card-route">${props.base.routeName}</span>
            </div>
          </div>
        </div>
      </div>
    `,
    });
  });
</script>

<style lang="scss">
  .base-marker-container {
    position: relative;
    width: 200px;
    height: 40px;

    /* 卡片在定位点左侧：整块右缘对齐在定位点右侧，flex 为 [卡片][连线]，连线指向定位点 */
    &.card-left {
      .marker-card-area {
        position: absolute;
        left: -6px;
        top: 50%;
        transform: translate(-100%, -50%);
        display: flex;
        align-items: center;
        flex-direction: row;
      }

      .marker-connector {
        margin-left: 4px;
        order: 2;
      }

      .marker-card {
        order: 1;
      }
    }

    /* 卡片在定位点右侧：连线紧贴定位点，再接卡片 */
    &.card-right {
      .marker-card-area {
        position: absolute;
        left: 22px;
        top: 50%;
        transform: translateY(-50%);
        display: flex;
        align-items: center;
        flex-direction: row;
      }

      .marker-connector {
        margin-right: 4px;
      }
    }

    &.is-selected {
      z-index: 1000 !important;
    }
  }

  .marker-point {
    pointer-events: auto;
    cursor: pointer;
    position: absolute;
    left: 0;
    top: 10px; // 20 (anchor center) - 10 (half of 20px height)
    width: 20px;
    height: 20px;
    background: var(--marker-color, #ef4444);
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    z-index: 2;

    .marker-number {
      color: white;
      font-size: 9px;
      font-weight: 700;
      line-height: 1;
    }

    .is-selected & {
      width: 22px;
      height: 22px;
      top: 9px;
      box-shadow: 0 2px 8px rgba(220, 38, 38, 0.5);
    }
  }

  .marker-pulse {
    position: absolute;
    left: -4px;
    top: -4px;
    width: 24px;
    height: 24px;
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

  .marker-card-area {
    pointer-events: auto;
    cursor: pointer;
  }

  .marker-card {
    display: flex;
    align-items: center;
    gap: 6px;
    background: white;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.12);
    padding: 4px 8px;
    width: 140px;
    // height: 32px;
    flex-shrink: 0;
    transition: all 0.2s ease;
    border: 1px solid #e5e7eb;

    .is-selected & {
      border-color: #dc2626;
      box-shadow: 0 4px 12px rgba(220, 38, 38, 0.2);
    }
  }

  .marker-card-image {
    width: 24px;
    height: 24px;
    border-radius: 4px;
    overflow: hidden;
    flex-shrink: 0;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
  }

  .marker-card-info {
    display: flex;
    flex-direction: column;
    min-width: 0;
    flex: 1;
  }

  .marker-card-name {
    font-size: 11px;
    font-weight: 600;
    color: #1f2937;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
    text-overflow: ellipsis;
    overflow-wrap: break-word;
    display: -webkit-box;
    /*！autoprefixer: off */
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    /*！autoprefixer: on */
    line-clamp: 2;
  }

  .marker-card-route {
    font-size: 9px;
    color: #6b7280;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    line-height: 1.2;
  }

  .marker-connector {
    width: 32px;
    height: 20px;
    flex-shrink: 0;

    .connector-path {
      stroke: #ef4444;
      stroke-width: 2;
      fill: none;
      stroke-dasharray: none;
    }
  }

  @media (max-width: 768px) {
    .base-marker-container {
      width: 160px;
      height: 36px;
    }

    .marker-card {
      width: 100px;
      padding: 3px 6px;
      gap: 4px;

      .marker-card-image {
        width: 20px;
        height: 20px;
      }

      .marker-card-name {
        font-size: 10px;
      }

      .marker-card-route {
        font-size: 8px;
      }
    }

    .marker-connector {
      width: 24px;
    }

    .marker-point {
      width: 18px;
      height: 18px;
      top: 9px;

      .marker-number {
        font-size: 8px;
      }

      .is-selected & {
        width: 20px;
        height: 20px;
        top: 8px;
      }
    }

    // .base-marker-container.card-left .marker-card-area {
    //   left: 20px;
    // }

    // .base-marker-container.card-right .marker-card-area {
    //   left: 20px;
    // }
  }
</style>
