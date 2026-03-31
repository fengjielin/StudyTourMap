<template>
  <aside class="base-list-sidebar">
    <div class="sidebar-search">
      <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
      <input v-model="keyword" type="text" inputmode="search" enterkeyhint="search" class="search-input" placeholder="搜索研学基地名称或地址" autocomplete="off" />
      <button v-if="keyword" type="button" class="search-clear" aria-label="清空" @click="keyword = ''">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>

    <div class="sidebar-list" role="list">
      <button v-for="base in filteredBases" :key="base.id" type="button" class="list-item" :class="{ 'is-active': base.id === mapStore.selectedBaseId }" role="listitem" @click="emitSelect(base)">
        <span class="item-index">{{ indexNumber(base) }}</span>
        <div class="item-body">
          <div class="item-title">{{ base.name }}</div>
          <div class="item-meta">
            <span class="item-tag" :class="`tag-${base.category}`">{{ categoryLabel(base.category) }}</span>
          </div>
          <div class="item-address">{{ base.address }}</div>
        </div>
      </button>
      <p v-if="filteredBases.length === 0" class="list-empty">未找到匹配的基地</p>
    </div>
  </aside>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue';
  import { useMapStore } from '@/stores/mapStore';
  import type { Base } from '@/types';

  const mapStore = useMapStore();
  const keyword = ref('');

  const emit = defineEmits<{
    select: [base: Base];
  }>();

  const filteredBases = computed(() => {
    const q = keyword.value.trim().toLowerCase();
    const list = mapStore.bases;
    if (!q) return list;
    return list.filter((b) => b.name.toLowerCase().includes(q) || b.address.toLowerCase().includes(q) || b.routeName.toLowerCase().includes(q));
  });

  function indexNumber(base: Base) {
    const i = mapStore.bases.findIndex((b) => b.id === base.id);
    return i >= 0 ? i + 1 : '—';
  }

  function categoryLabel(c: Base['category']) {
    const m = { technology: '科技', culture: '文化', nature: '自然' };
    return m[c] || '';
  }

  function emitSelect(base: Base) {
    emit('select', base);
  }
</script>

<style lang="scss" scoped>
  .base-list-sidebar {
    width: 300px;
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    background: var(--surface);
    border-right: 1px solid var(--border);
    box-shadow: 4px 0 16px rgba(0, 0, 0, 0.06);
    z-index: 500;
    min-height: 0;
  }

  .sidebar-search {
    position: relative;
    padding: 12px;
    border-bottom: 1px solid var(--border);
    flex-shrink: 0;

    .search-icon {
      position: absolute;
      left: 22px;
      top: 50%;
      transform: translateY(-50%);
      width: 18px;
      height: 18px;
      color: var(--text-muted);
      pointer-events: none;
    }

    .search-input {
      width: 100%;
      padding: 10px 36px 10px 40px;
      font-size: 14px;
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      background: var(--background);
      color: var(--text-primary);
      outline: none;

      &::placeholder {
        color: var(--text-muted);
      }

      &:focus {
        border-color: var(--primary-light);
        box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.15);
      }
    }

    .search-clear {
      position: absolute;
      right: 18px;
      top: 50%;
      transform: translateY(-50%);
      width: 28px;
      height: 28px;
      padding: 6px;
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      border-radius: var(--radius-sm);

      &:hover {
        background: var(--border);
        color: var(--text-primary);
      }

      svg {
        width: 100%;
        height: 100%;
      }
    }
  }

  .sidebar-list {
    flex: 1;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
  }

  .list-item {
    display: flex;
    gap: 10px;
    width: 100%;
    padding: 12px 14px;
    text-align: left;
    border: none;
    border-bottom: 1px solid var(--border);
    background: var(--surface);
    cursor: pointer;
    transition: background var(--transition-fast);

    &:hover {
      background: var(--background);
    }

    &.is-active {
      background: rgba(37, 99, 235, 0.08);
      border-left: 3px solid var(--primary);
      padding-left: 11px;
    }
  }

  .item-index {
    flex-shrink: 0;
    width: 22px;
    height: 22px;
    margin-top: 2px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 700;
    color: #fff;
    background: #ef4444;
    border-radius: 50%;
  }

  .item-body {
    min-width: 0;
    flex: 1;
  }

  .item-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--text-primary);
    line-height: 1.35;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .item-meta {
    margin-top: 4px;
  }

  .item-tag {
    display: inline-block;
    font-size: 11px;
    padding: 2px 6px;
    border-radius: 4px;
    font-weight: 500;

    &.tag-technology {
      color: #1d4ed8;
      background: rgba(37, 99, 235, 0.12);
    }

    &.tag-culture {
      color: #6d28d9;
      background: rgba(139, 92, 246, 0.12);
    }

    &.tag-nature {
      color: #047857;
      background: rgba(16, 185, 129, 0.12);
    }
  }

  .item-address {
    margin-top: 6px;
    font-size: 12px;
    color: var(--text-secondary);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  .list-empty {
    padding: 24px 16px;
    text-align: center;
    font-size: 13px;
    color: var(--text-muted);
  }

  @media (max-width: 768px) {
    .base-list-sidebar {
      position: fixed;
      top: var(--map-header-height, 112px);
      left: 0;
      bottom: 0;
      width: min(88vw, 320px);
      max-height: none;
      border-right: none;
      border-bottom: none;
      z-index: 1060;
      transform: translateX(-100%);
      transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 8px 0 28px rgba(0, 0, 0, 0.18);
      pointer-events: none;
    }

    .base-list-sidebar.sidebar-mobile-open {
      transform: translateX(0);
      pointer-events: auto;
    }
  }
</style>
