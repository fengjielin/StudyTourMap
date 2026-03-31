<template>
  <div class="map-switcher">
    <div class="switcher-dropdown">
      <button class="switcher-btn" @click="toggleDropdown">
        <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M2 12h20"/>
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
        </svg>
        <span class="provider-name">{{ currentProviderName }}</span>
        <svg class="arrow" :class="{ 'is-open': isOpen }" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="6 9 12 15 18 9"/>
        </svg>
      </button>

      <Transition name="dropdown">
        <div v-if="isOpen" class="dropdown-menu">
          <div 
            v-for="(provider, key) in tileProviders" 
            :key="key"
            class="dropdown-group"
          >
            <div class="group-title">{{ provider.name }}</div>
            <button
              v-for="layer in provider.layers"
              :key="`${key}-${layer.id}`"
              class="dropdown-item"
              :class="{ 'is-active': isActive(key, layer.id) }"
              @click="selectProvider(key, layer.id)"
            >
              <span class="layer-name">{{ layer.name }}</span>
              <svg v-if="isActive(key, layer.id)" class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>
        </div>
      </Transition>
    </div>

    <div v-if="isOpen" class="backdrop" @click="closeDropdown"></div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMapStore } from '@/stores/mapStore'
import { tileProviders, type TileProviderId } from '@/core/TileProvider'

const mapStore = useMapStore()
const isOpen = ref(false)

const currentProviderName = computed(() => {
  const provider = tileProviders[mapStore.currentProvider as TileProviderId]
  const layer = provider?.layers.find(l => l.id === mapStore.currentLayer)
  return `${provider?.name || ''} ${layer?.name || ''}`
})

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

function selectProvider(providerKey: string, layerId: string) {
  mapStore.setProvider(providerKey)
  mapStore.setLayer(layerId)
  closeDropdown()
}

function isActive(providerKey: string, layerId: string): boolean {
  return mapStore.currentProvider === providerKey && mapStore.currentLayer === layerId
}
</script>

<style lang="scss" scoped>
.map-switcher {
  position: relative;
}

.switcher-dropdown {
  position: relative;
}

.switcher-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 14px;
  background: var(--surface);
  border: none;
  border-radius: var(--radius-md);
  box-shadow: 0 2px 10px var(--shadow);
  cursor: pointer;
  transition: all var(--transition-fast);

  &:hover {
    background: var(--background);
  }

  .icon {
    width: 18px;
    height: 18px;
    color: var(--primary);
  }

  .provider-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--text-primary);
  }

  .arrow {
    width: 16px;
    height: 16px;
    color: var(--text-secondary);
    transition: transform var(--transition-fast);

    &.is-open {
      transform: rotate(180deg);
    }
  }
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  width: 200px;
  background: var(--surface);
  border-radius: var(--radius-md);
  box-shadow: 0 4px 20px var(--shadow-lg);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-group {
  padding: 8px 0;

  &:not(:last-child) {
    border-bottom: 1px solid var(--border);
  }
}

.group-title {
  padding: 6px 14px;
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.dropdown-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 14px;
  background: none;
  border: none;
  font-size: 13px;
  color: var(--text-primary);
  cursor: pointer;
  transition: background var(--transition-fast);

  &:hover {
    background: var(--background);
  }

  &.is-active {
    color: var(--primary);
    background: rgba(37, 99, 235, 0.08);
  }

  .check-icon {
    width: 16px;
    height: 16px;
    color: var(--primary);
  }
}

.backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1000;
}

// 过渡动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity var(--transition-fast), transform var(--transition-fast);
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
