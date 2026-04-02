<template>
  <div class="base-info-panel" :class="`category-${base.category}`">
    <div class="panel-header">
      <div class="header-content">
        <div class="category-badge">
          <span class="badge-icon">{{ categoryIcon }}</span>
          <span class="badge-text">{{ categoryText }}</span>
        </div>
        <h2 class="base-name">{{ base.name }}</h2>
        <p class="route-name">{{ base.routeName }}</p>
      </div>
      <button class="close-btn" @click="$emit('close')">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="panel-body">
      <div class="info-section">
        <div class="info-row">
          <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 21V5a2 2 0 0 0-2-2H7a2 2 0 0 0-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5m-4 0h4" />
          </svg>
          <div class="info-content">
            <span class="info-label">所属单位</span>
            <span class="info-value">{{ base.unit }}</span>
          </div>
        </div>

        <div class="info-row">
          <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
            <circle cx="12" cy="10" r="3" />
          </svg>
          <div class="info-content">
            <span class="info-label">地址</span>
            <span class="info-value">{{ base.address }}</span>
          </div>
        </div>

        <div class="info-row" v-if="base.contacts">
          <svg class="info-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path
              d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
          </svg>
          <div class="info-content">
            <span class="info-label">联系方式</span>
            <span class="info-value contacts">{{ base.contacts }}</span>
          </div>
        </div>
      </div>

      <!-- <div class="description-section" v-if="base.description">
        <div class="description-content" v-html="base.description"></div>
      </div> -->

      <div class="image-section" v-if="resolvedImages.length > 0">
        <div class="image-gallery" v-viewer>
          <img v-for="(img, index) in resolvedImages" :key="index" :src="img" :alt="`${base.name} - 图片${index + 1}`" class="gallery-image" />
        </div>
      </div>
      <div class="image-placeholder" v-else>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
        <span>暂无图片</span>
      </div>
    </div>

    <div class="panel-footer">
      <a :href="navigationUrl" target="_blank" class="action-btn primary">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polygon points="3 11 22 2 13 21 11 13 3 11" />
        </svg>
        在高德地图导航
      </a>
      <button class="action-btn secondary" @click="goToDetail">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        查看详情
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import type { Base } from '@/types';

  const props = defineProps<{
    base: Base;
  }>();

  const emit = defineEmits<{
    close: [];
  }>();

  const router = useRouter();

  // 用户当前位置
  const userPosition = ref<[number, number] | null>(null);
  const isLocating = ref(false);
  const locateError = ref<string | null>(null);

  // 获取用户当前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      locateError.value = '浏览器不支持定位';
      return;
    }

    isLocating.value = true;
    locateError.value = null;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userPosition.value = [position.coords.longitude, position.coords.latitude];
        isLocating.value = false;
      },
      (error) => {
        switch (error.code) {
          case error.PERMISSION_DENIED:
            locateError.value = '定位权限被拒绝';
            break;
          case error.POSITION_UNAVAILABLE:
            locateError.value = '无法获取位置';
            break;
          case error.TIMEOUT:
            locateError.value = '定位超时';
            break;
          default:
            locateError.value = '定位失败';
        }
        isLocating.value = false;
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000,
      },
    );
  };

  // 页面加载时自动获取位置
  onMounted(() => {
    getCurrentLocation();
  });

  // 生成导航链接
  const navigationUrl = computed(() => {
    const dest = `${props.base.position[0]},${props.base.position[1]},${encodeURIComponent(props.base.name)}`;
    if (userPosition.value) {
      const from = `${userPosition.value[0]},${userPosition.value[1]}`;
      return `https://uri.amap.com/navigation?from=${from},我的位置&to=${dest}&mode=car&callnative=1`;
    }
    return `https://uri.amap.com/navigation?to=${dest}&mode=car&callnative=1`;
  });

  const goToDetail = () => {
    emit('close');
    router.push(`/base/${props.base.id}`);
  };

  const categoryConfig = computed(() => {
    const configs = {
      technology: { icon: '🚀', text: '科技探索', color: '#2563EB' },
      culture: { icon: '🎨', text: '文化体验', color: '#8B5CF6' },
      nature: { icon: '🌿', text: '自然生态', color: '#10B981' },
    };
    return configs[props.base.category] || configs.technology;
  });

  const categoryIcon = computed(() => categoryConfig.value.icon);
  const categoryText = computed(() => categoryConfig.value.text);

  // 使用 import.meta.glob 加载所有图片资源
  const allImages = import.meta.glob('@/assets/images/*', { eager: true }) as Record<string, { default: string }>;

  // 直接使用 bases.json 中定义的 images 属性
  const resolvedImages = computed<string[]>(() => {
    if (!props.base.images || props.base.images.length === 0) return [];
    let images = props.base.images.map((img) => {
      if (img.startsWith('@/')) {
        // 将 @/assets/images/xxx 转换为 glob 键名
        const key = img.replace('@/assets/images/', '/src/assets/images/');
        return allImages[key]?.default || img;
      }
      return img;
    });
    return images.slice(0, 2);
  });
</script>

<style lang="scss" scoped>
  .base-info-panel {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: min(60vh, calc(100dvh - 120px));
    background: var(--surface);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    box-shadow: 0 -4px 20px var(--shadow-lg);
    overflow: hidden;
    display: flex;
    flex-direction: column;
    z-index: 999;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 4px;
      background: linear-gradient(90deg, var(--primary), var(--secondary));
    }

    &.category-technology::before {
      background: linear-gradient(90deg, #2563eb, #3b82f6);
    }

    &.category-culture::before {
      background: linear-gradient(90deg, #8b5cf6, #a78bfa);
    }

    &.category-nature::before {
      background: linear-gradient(90deg, #10b981, #34d399);
    }
  }

  .panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    padding: 20px 20px 16px;
    border-bottom: 1px solid var(--border);
  }

  .header-content {
    flex: 1;
    min-width: 0;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 10px;
    background: var(--background);
    border-radius: var(--radius-full);
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 8px;

    .badge-icon {
      font-size: 14px;
    }
  }

  .base-name {
    font-size: 18px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 4px;
    line-height: 1.3;
  }

  .route-name {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }

  .close-btn {
    width: 32px;
    height: 32px;
    padding: 6px;
    background: var(--background);
    border: none;
    border-radius: var(--radius-full);
    cursor: pointer;
    transition: all var(--transition-fast);
    flex-shrink: 0;
    margin-left: 12px;

    svg {
      width: 100%;
      height: 100%;
      color: var(--text-secondary);
    }

    &:hover {
      background: var(--border);

      svg {
        color: var(--text-primary);
      }
    }
  }

  .panel-body {
    flex: 1;
    overflow-y: auto;
    padding: 16px 20px;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;
  }

  .info-row {
    display: flex;
    align-items: flex-start;
    gap: 12px;

    .info-icon {
      width: 20px;
      height: 20px;
      color: var(--text-muted);
      flex-shrink: 0;
      margin-top: 2px;
    }

    .info-content {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .info-label {
      font-size: 12px;
      color: var(--text-muted);
    }

    .info-value {
      font-size: 14px;
      color: var(--text-primary);
      line-height: 1.4;
    }

    .info-value.contacts {
      white-space: pre-line;
    }
  }

  .description-section {
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--border);
  }

  .description-content {
    font-size: 14px;
    line-height: 1.7;
    color: var(--text-primary);

    :deep(p) {
      margin: 0 0 12px;

      &:last-child {
        margin-bottom: 0;
      }
    }

    :deep(strong) {
      color: var(--primary);
      font-weight: 600;
    }
  }

  .image-section {
    margin-top: 12px;
  }

  .image-gallery {
    display: flex;
    justify-content: center;
    gap: 8px;
    overflow-x: auto;
    padding-bottom: 8px;

    .gallery-image {
      width: 120px;
      height: 80px;
      object-fit: cover;
      border-radius: var(--radius-md);
      flex-shrink: 0;
    }
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px;
    background: var(--background);
    border-radius: var(--radius-md);
    color: var(--text-muted);

    svg {
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    span {
      font-size: 13px;
    }
  }

  .panel-footer {
    display: flex;
    gap: 12px;
    padding: 16px 20px;
    // background: var(--background);
    // border-top: 1px solid var(--border);
  }

  .action-btn {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 10px 16px;
    border-radius: var(--radius-md);
    font-size: 13px;
    font-weight: 500;
    text-decoration: none;
    transition: all var(--transition-fast);
    cursor: pointer;

    svg {
      width: 16px;
      height: 16px;
    }

    &.primary {
      background: var(--primary);
      color: white;

      &:hover {
        background: var(--primary-dark);
      }
    }

    &.secondary {
      background: var(--surface);
      color: var(--text-primary);
      border: 1px solid var(--border);

      &:hover {
        background: var(--background);
      }
    }
  }

  // 小屏：底部抽屉更高、预留安全区与层叠上下文，避免被地图控件遮挡
  @media (max-width: 767px) {
    .base-info-panel {
      max-height: min(82vh, calc(100dvh - 72px));
      z-index: 1200;
    }

    .panel-header {
      padding: 16px 16px 12px;
    }

    .base-name {
      font-size: 17px;
    }

    .panel-body {
      padding: 14px 16px;
    }

    .panel-footer {
      flex-direction: column;
      gap: 10px;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom, 0px));
    }

    .action-btn {
      width: 100%;
      padding: 12px 14px;
      font-size: 14px;
    }
  }

  // 响应式适配
  @media (min-width: 768px) {
    .base-info-panel {
      position: absolute;
      left: auto;
      right: 16px;
      bottom: 24px;
      width: 380px;
      max-height: calc(100% - 48px);
      border-radius: var(--radius-lg);

      &::before {
        border-radius: var(--radius-lg) var(--radius-lg) 0 0;
      }
    }
  }
</style>
