<template>
  <div class="dynamic-filter-bar" v-if="pageConfig">
    <div class="filter-row">
      <slot name="before"></slot>

      <div
        v-for="group in visibleGroups"
        :key="group.id"
        class="filter-group"
      >
        <span class="filter-label">{{ group.label }}</span>
        <div class="filter-pills">
          <button
            v-for="opt in group.options"
            :key="opt.value"
            :class="{ active: modelValue[group.id] === opt.value }"
            @click="updateFilter(group.id, opt.value)"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <slot name="after"></slot>
    </div>
  </div>
</template>

<script setup>
import { computed, watch } from 'vue'
import { useFilterConfig } from '@/composables/useFilterConfig'

const props = defineProps({
  pageId: { type: String, required: true },
  modelValue: { type: Object, default: () => ({}) },
  // 某些筛选组需要根据条件隐藏
  hiddenGroups: { type: Array, default: () => [] },
  // 额外的静态筛选组（不从配置读取）
  extraGroups: { type: Array, default: () => [] },
})

const emit = defineEmits(['update:modelValue'])

const { getPageFilterById } = useFilterConfig()

const pageConfig = computed(() => getPageFilterById(props.pageId))

const visibleGroups = computed(() => {
  const groups = [...(pageConfig.value?.groups || []), ...props.extraGroups]
  return groups.filter(g => !props.hiddenGroups.includes(g.id))
})

const updateFilter = (groupId, value) => {
  emit('update:modelValue', { ...props.modelValue, [groupId]: value })
}
</script>

<style scoped>
.dynamic-filter-bar {
  margin-bottom: 16px;
}

.filter-row {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.filter-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-label {
  font-size: 13px;
  color: var(--text-secondary);
  white-space: nowrap;
}

.filter-pills {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}

.filter-pills button {
  background: var(--pill-bg);
  border: 1px solid var(--border-color);
  border-radius: 20px;
  padding: 5px 14px;
  color: var(--inactive-color);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(8px);
  white-space: nowrap;
}

.filter-pills button:hover {
  background: var(--hover-menu-bg);
  color: var(--theme-color);
  border-color: rgba(113, 119, 144, 0.4);
}

.filter-pills button.active {
  background: rgba(59, 130, 246, 0.25);
  border-color: rgba(59, 130, 246, 0.5);
  color: var(--theme-color);
  box-shadow: 0 0 12px rgba(59, 130, 246, 0.15);
}
</style>
