<template>
  <div class="glass-card" :class="{ hoverable, active }">
    <div class="card-highlight"></div>
    <slot></slot>
  </div>
</template>

<script setup>
defineProps({
  hoverable: Boolean,
  active: Boolean
})
</script>

<style scoped>
.glass-card {
  position: relative;
  background: var(--glass-bg);
  backdrop-filter: blur(20px) saturate(1.2);
  -webkit-backdrop-filter: blur(20px) saturate(1.2);
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: 14px;
  padding: 20px;
  color: var(--text-primary);
  transition: all 0.3s ease;
  box-shadow: var(--shadow-glass);
  overflow: hidden;
}

/* 顶部高光线 */
.card-highlight {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.15) 20%,
    rgba(255, 255, 255, 0.4) 50%,
    rgba(255, 255, 255, 0.15) 80%,
    transparent 100%
  );
  pointer-events: none;
}

.glass-card.hoverable {
  cursor: pointer;
}

.glass-card.hoverable:hover {
  transform: translateY(-3px);
  background: var(--glass-hover-bg);
  border-color: rgba(255, 255, 255, 0.3);
  box-shadow: 0 0 20px 1px rgba(255, 255, 255, 0.1), var(--shadow-glass);
}

.glass-card.active {
  background: var(--glass-active-bg);
  border-color: var(--glass-active-border);
}
</style>
