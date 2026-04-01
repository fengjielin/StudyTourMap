<template>
  <div class="detail-page" :class="`category-${base?.category}`">
    <header class="detail-header">
      <button class="back-btn" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="19" y1="12" x2="5" y2="12" />
          <polyline points="12 19 5 12 12 5" />
        </svg>
      </button>
    </header>

    <main class="detail-content" v-if="base">
      <div class="content-header">
        <div class="category-badge">
          <span class="badge-icon">{{ categoryIcon }}</span>
          <span class="badge-text">{{ categoryText }}</span>
        </div>
        <h1 class="base-title">{{ base.name }}</h1>
        <p class="route-name">{{ base.routeName }}</p>
      </div>

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

      <div class="description-section">
        <h2 class="section-title">简介</h2>
        <div class="description-content" v-html="base.description"></div>
      </div>

      <div class="action-section">
        <a :href="navigationUrl" target="_blank" class="action-btn primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polygon points="3 11 22 2 13 21 11 13 3 11" />
          </svg>
          在高德地图导航
        </a>
      </div>
    </main>

    <div class="loading" v-else>
      <p>加载中...</p>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue';
  import { useRouter } from 'vue-router';
  import { useBasesStore } from '@/stores/bases';

  const props = defineProps<{
    id: string;
  }>();

  const router = useRouter();
  const basesStore = useBasesStore();

  const base = computed(() => {
    return basesStore.bases.find((b) => b.id === props.id);
  });

  const categoryConfig = computed(() => {
    const configs: Record<string, { icon: string; text: string; color: string }> = {
      technology: { icon: '🚀', text: '科技探索', color: '#2563EB' },
      culture: { icon: '🎨', text: '文化体验', color: '#8B5CF6' },
      nature: { icon: '🌿', text: '自然生态', color: '#10B981' },
    };
    return configs[base.value?.category || ''] || configs.technology;
  });

  const categoryIcon = computed(() => categoryConfig.value.icon);
  const categoryText = computed(() => categoryConfig.value.text);
  const categoryColor = computed(() => categoryConfig.value.color);

  // 用户当前位置
  const userPosition = ref<[number, number] | null>(null);

  // 获取用户当前位置
  const getCurrentLocation = () => {
    if (!navigator.geolocation) return;

    navigator.geolocation.getCurrentPosition(
      (position) => {
        userPosition.value = [position.coords.longitude, position.coords.latitude];
      },
      () => {
        // 定位失败静默处理
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
    if (!base.value) return '#';
    const dest = `${base.value.position[0]},${base.value.position[1]},${encodeURIComponent(base.value.name)}`;
    if (userPosition.value) {
      return `https://uri.amap.com/navigation?from=${userPosition.value[0]},${userPosition.value[1]},我的位置&to=${dest}&mode=car&callnative=1`;
    }
    return `https://uri.amap.com/navigation?to=${dest}&mode=car&callnative=1`;
  });

  // 使用 import.meta.glob 加载所有图片资源
  const allImages = import.meta.glob('@/assets/images/*', { eager: true }) as Record<string, { default: string }>;

  const resolvedImages = computed(() => {
    if (!base.value?.images || base.value.images.length === 0) return [];
    return base.value.images.map((img) => {
      if (img.startsWith('@/')) {
        const key = img.replace('@/assets/images/', '/src/assets/images/');
        return allImages[key]?.default || img;
      }
      return img;
    });
  });

  const goBack = () => {
    router.back();
  };
</script>

<style lang="scss" scoped>
  .detail-page {
    width: 100%;
    height: 100vh;
    height: 100dvh;
    display: flex;
    flex-direction: column;
    background: var(--background);
    overflow: hidden;
  }

  .detail-header {
    position: sticky;
    top: 0;
    z-index: 100;
    padding: 12px 16px;
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-dark) 100%);
    box-shadow: 0 2px 10px var(--shadow);

    .back-btn {
      width: 36px;
      height: 36px;
      display: flex;
      align-items: center;
      justify-content: center;
      border: none;
      background: rgba(255, 255, 255, 0.2);
      border-radius: var(--radius-full);
      cursor: pointer;
      transition: all var(--transition-fast);

      svg {
        width: 20px;
        height: 20px;
        color: white;
      }

      &:active {
        transform: scale(0.95);
        background: rgba(255, 255, 255, 0.3);
      }
    }
  }

  .detail-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px 16px 40px;
    max-width: 800px;
    margin: 0 auto;
    -webkit-overflow-scrolling: touch;
  }

  .content-header {
    text-align: center;
    margin-bottom: 20px;
  }

  .category-badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 12px;
    background: var(--surface);
    border-radius: var(--radius-full);
    font-size: 12px;
    color: var(--text-secondary);
    margin-bottom: 10px;

    .badge-icon {
      font-size: 14px;
    }
  }

  .base-title {
    font-size: 22px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 6px;
    line-height: 1.3;
  }

  .route-name {
    font-size: 14px;
    color: var(--text-secondary);
    margin: 0;
  }

  .info-section {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-bottom: 16px;

    .info-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 12px 14px;
      background: var(--surface);
      border-radius: var(--radius-md);

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
  }

  .section-title {
    font-size: 16px;
    font-weight: 600;
    color: var(--text-primary);
    margin: 0 0 12px;
  }

  .image-section {
    margin-bottom: 20px;

    .image-gallery {
      display: flex;
      justify-content: center;
      flex-wrap: wrap;
      gap: 8px;
      overflow-x: auto;
      padding-bottom: 8px;

      .gallery-image {
        width: 140px;
        height: 100px;
        object-fit: cover;
        border-radius: var(--radius-md);
        flex-shrink: 0;
      }
    }
  }

  .image-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 32px;
    background: var(--surface);
    border-radius: var(--radius-md);
    color: var(--text-muted);
    margin-bottom: 20px;

    svg {
      width: 48px;
      height: 48px;
      opacity: 0.5;
    }

    span {
      font-size: 13px;
    }
  }

  .description-section {
    margin-bottom: 20px;

    .description-content {
      background: var(--surface);
      border-radius: var(--radius-md);
      padding: 16px;

      :deep(p) {
        font-size: 14px;
        color: var(--text-primary);
        line-height: 1.8;
        margin: 0 0 12px;
        text-align: justify;
        text-indent: 2em;

        &:last-child {
          margin-bottom: 0;
        }
      }

      :deep(strong) {
        color: var(--primary);
        font-weight: 600;
      }
    }
  }

  .action-section {
    .action-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: var(--radius-md);
      font-size: 15px;
      font-weight: 500;
      text-decoration: none;
      background: var(--primary);
      color: white;
      transition: all var(--transition-fast);

      svg {
        width: 18px;
        height: 18px;
      }

      &:active {
        transform: scale(0.98);
      }
    }
  }

  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 50vh;
    color: var(--text-muted);
  }

  @media (min-width: 768px) {
    .detail-content {
      padding: 24px 20px 60px;
    }

    .image-section .image-gallery .gallery-image {
      width: 180px;
      height: 120px;
    }
  }

  @media (max-width: 767px) {
    .detail-content {
      padding: 16px 16px calc(40px + env(safe-area-inset-bottom, 0px));
    }
  }
</style>
