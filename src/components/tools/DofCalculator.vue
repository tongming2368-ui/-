<template>
  <div class="dof-calculator">
    <div class="input-section">
      <div class="input-group">
        <label>焦距 (mm)</label>
        <input type="number" v-model.number="focalLength" min="1" max="1200" step="1" />
      </div>
      <div class="input-group">
        <label>光圈 (F)</label>
        <select v-model.number="aperture">
          <option v-for="f in apertureOptions" :key="f" :value="f">f/{{ f }}</option>
        </select>
      </div>
      <div class="input-group">
        <label>对焦距离 (m)</label>
        <input type="number" v-model.number="focusDistance" min="0.1" max="1000" step="0.1" />
      </div>
      <div class="input-group">
        <label>画幅</label>
        <div class="format-selector">
          <button
            v-for="fmt in formats"
            :key="fmt.key"
            class="format-btn"
            :class="{ active: selectedFormat === fmt.key }"
            @click="selectedFormat = fmt.key"
          >{{ fmt.label }}</button>
        </div>
      </div>
    </div>

    <div class="results-section">
      <div class="result-card glass-card">
        <span class="result-label">弥散圆直径</span>
        <span class="result-value">{{ circleOfConfusion }} mm</span>
      </div>
      <div class="result-card glass-card">
        <span class="result-label">超焦距</span>
        <span class="result-value">{{ hyperfocal.toFixed(2) }} m</span>
      </div>
      <div class="result-card glass-card highlight">
        <span class="result-label">前景深</span>
        <span class="result-value">{{ nearLimit.toFixed(2) }} m</span>
      </div>
      <div class="result-card glass-card highlight">
        <span class="result-label">后景深</span>
        <span class="result-value">{{ farLimit === Infinity ? '∞' : farLimit.toFixed(2) + ' m' }}</span>
      </div>
      <div class="result-card glass-card total">
        <span class="result-label">总景深</span>
        <span class="result-value">{{ totalDof === Infinity ? '∞' : totalDof.toFixed(2) + ' m' }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const focalLength = ref(50)
const aperture = ref(1.4)
const focusDistance = ref(3)
const selectedFormat = ref('ff')

const formats = [
  { key: 'ff', label: '全画幅', coc: 0.03 },
  { key: 'apsc', label: 'APS-C', coc: 0.02 },
  { key: 'm43', label: 'M43', coc: 0.015 },
]

const apertureOptions = [
  1, 1.2, 1.4, 1.8, 2, 2.2, 2.5, 2.8, 3.5, 4, 4.5, 5, 5.6, 6.3, 7.1, 8,
  9, 10, 11, 13, 14, 16, 18, 20, 22
]

const circleOfConfusion = computed(() => {
  const fmt = formats.find(f => f.key === selectedFormat.value)
  return fmt ? fmt.coc : 0.03
})

const hyperfocal = computed(() => {
  const f = focalLength.value
  const N = aperture.value
  const c = circleOfConfusion.value
  return (f * f) / (N * c) / 1000 + f / 1000
})

const nearLimit = computed(() => {
  const s = focusDistance.value
  const H = hyperfocal.value
  const f = focalLength.value / 1000
  const denom = H + s - f
  if (denom <= 0) return 0
  return (H * s) / denom
})

const farLimit = computed(() => {
  const s = focusDistance.value
  const H = hyperfocal.value
  const f = focalLength.value / 1000
  const denom = H - s + f
  if (denom <= 0) return Infinity
  const val = (H * s) / denom
  if (val < 0) return Infinity
  return val
})

const totalDof = computed(() => {
  if (farLimit.value === Infinity) return Infinity
  return farLimit.value - nearLimit.value
})
</script>

<style scoped>

.dof-calculator { padding: 8px; }

.input-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}

.input-group label {
  display: block;
  font-size: 13px;
  color: var(--text-primary);
  margin-bottom: 6px;
}

.input-group input,
.input-group select {
  width: 100%;
  padding: 10px 12px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 10px;
  color: var(--text-primary);
  font-size: 15px;
  outline: none;
  transition: border-color 0.2s;
}

.input-group input:focus,
.input-group select:focus {
  border-color: var(--text-secondary);
}

.input-group select option {
  background: #333;
  color: var(--text-primary);
}

.format-selector {
  display: flex;
  gap: 8px;
}

.format-btn {
  flex: 1;
  padding: 8px;
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.06);
  color: var(--text-primary);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.2s;
}

.format-btn.active {
  background: rgba(255, 255, 255, 0.14);
  border-color: rgba(255, 255, 255, 0.35);
  color: var(--text-primary);
}

.format-btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.results-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  text-align: center;
}

.result-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.result-value {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-primary);
}

.glass-card.total {
  grid-column: 1 / -1;
}

.glass-card.highlight .result-value {
  color: #60a5fa;
}

.glass-card.total .result-value {
  font-size: 24px;
  color: #4ade80;
}

@media (max-width: 400px) {
  .input-section { grid-template-columns: 1fr; }
}

</style>
