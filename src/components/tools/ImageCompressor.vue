<template>
  <div class="image-compressor">
    <div
      class="upload-zone"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="handleDrop"
      @click="triggerUpload"
    >
      <input ref="fileInput" type="file" accept="image/jpeg,image/png,image/webp" hidden @change="handleFileChange" />
      <div v-if="!originalImage" class="upload-placeholder">
        <span class="upload-icon">📦</span>
        <p>拖拽图片到此处或点击上传</p>
        <span class="upload-hint">支持 JPG / PNG / WebP 格式</span>
      </div>
      <div v-else class="preview-container">
        <div class="preview-col">
          <span class="preview-label">原始</span>
          <img :src="originalUrl" class="preview-img" />
          <span class="file-size">{{ formatSize(originalSize) }}</span>
        </div>
        <div class="preview-col">
          <span class="preview-label">压缩后</span>
          <img :src="compressedUrl" class="preview-img" />
          <span class="file-size" :class="{ reduced: compressedSize < originalSize }">
            {{ formatSize(compressedSize) }}
            <span v-if="compressedSize < originalSize" class="saved">(-{{ savingsPercent }}%)</span>
          </span>
        </div>
      </div>
    </div>

    <div v-if="originalImage" class="controls">
      <div class="quality-control">
        <label>压缩质量：{{ quality }}%</label>
        <input type="range" v-model.number="quality" min="0" max="100" step="1" class="quality-slider" />
      </div>
      <div class="action-buttons">
        <button class="btn btn-secondary" @click="reset">重新选择</button>
        <button class="btn btn-primary" @click="download" :disabled="!compressedBlob">下载压缩图片</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'

const fileInput = ref(null)
const dragging = ref(false)
const originalImage = ref(null)
const originalUrl = ref('')
const originalSize = ref(0)
const compressedUrl = ref('')
const compressedSize = ref(0)
const compressedBlob = ref(null)
const quality = ref(80)

function triggerUpload() {
  fileInput.value?.click()
}

function handleFileChange(e) {
  const file = e.target.files[0]
  if (file) processFile(file)
}

function handleDrop(e) {
  dragging.value = false
  const file = e.dataTransfer.files[0]
  if (file && file.type.startsWith('image/')) processFile(file)
}

function processFile(file) {
  originalSize.value = file.size
  const url = URL.createObjectURL(file)
  originalUrl.value = url

  const img = new Image()
  img.onload = () => {
    originalImage.value = img
    compress()
  }
  img.src = url
}

function compress() {
  if (!originalImage.value) return
  const canvas = document.createElement('canvas')
  canvas.width = originalImage.value.naturalWidth
  canvas.height = originalImage.value.naturalHeight
  const ctx = canvas.getContext('2d')
  ctx.drawImage(originalImage.value, 0, 0)

  canvas.toBlob(
    (blob) => {
      if (!blob) return
      if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
      compressedBlob.value = blob
      compressedSize.value = blob.size
      compressedUrl.value = URL.createObjectURL(blob)
    },
    'image/jpeg',
    quality.value / 100
  )
}

watch(quality, () => {
  if (originalImage.value) compress()
})

const savingsPercent = computed(() => {
  if (originalSize.value === 0) return 0
  return Math.round(((originalSize.value - compressedSize.value) / originalSize.value) * 100)
})

function download() {
  if (!compressedBlob.value) return
  const a = document.createElement('a')
  a.href = compressedUrl.value
  a.download = 'compressed.jpg'
  a.click()
}

function reset() {
  originalImage.value = null
  if (originalUrl.value) URL.revokeObjectURL(originalUrl.value)
  if (compressedUrl.value) URL.revokeObjectURL(compressedUrl.value)
  originalUrl.value = ''
  compressedUrl.value = ''
  originalSize.value = 0
  compressedSize.value = 0
  compressedBlob.value = null
  quality.value = 80
  if (fileInput.value) fileInput.value.value = ''
}

function formatSize(bytes) {
  if (bytes === 0) return '0 B'
  const units = ['B', 'KB', 'MB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  return (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 2 : 0) + ' ' + units[i]
}


</script>

<style scoped>

.image-compressor { padding: 8px; }

.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  min-height: 200px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-zone:hover,
.upload-zone.dragging {
  border-color: var(--text-secondary);
  background: rgba(255, 255, 255, 0.08);
}

.upload-placeholder { color: var(--text-secondary); }
.upload-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.upload-hint { font-size: 12px; color: var(--text-secondary); margin-top: 8px; }

.preview-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  width: 100%;
}

.preview-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.preview-label {
  font-size: 13px;
  color: var(--text-primary);
}

.preview-img {
  max-width: 100%;
  max-height: 180px;
  border-radius: 10px;
  object-fit: contain;
}

.file-size {
  font-size: 14px;
  color: var(--text-secondary);
}

.file-size.reduced { color: #4ade80; }
.saved { font-size: 12px; }

.controls {
  margin-top: 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.quality-control label {
  display: block;
  font-size: 14px;
  color: var(--text-primary);
  margin-bottom: 8px;
}

.quality-slider {
  width: 100%;
  height: 6px;
  -webkit-appearance: none;
  appearance: none;
  background: rgba(255, 255, 255, 0.15);
  border-radius: 3px;
  outline: none;
}

.quality-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: white;
  cursor: pointer;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.btn {
  flex: 1;
  padding: 10px 16px;
  border: none;
  border-radius: 10px;
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: rgba(255, 255, 255, 0.15);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-primary:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.3);
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.08);
  color: var(--text-primary);
  border: 1px solid rgba(255, 255, 255, 0.15);
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.12);
}

@media (max-width: 500px) {
  .preview-container { grid-template-columns: 1fr; }
}

</style>
