<template>
  <div class="exif-viewer">
    <div
      class="upload-zone"
      :class="{ dragging }"
      @dragover.prevent="dragging = true"
      @dragleave="dragging = false"
      @drop.prevent="handleDrop"
      @click="triggerUpload"
    >
      <input ref="fileInput" type="file" accept="image/jpeg,image/png" hidden @change="handleFileChange" />
      <div v-if="!imageLoaded" class="upload-placeholder">
        <span class="upload-icon">📷</span>
        <p>拖拽图片到此处或点击上传</p>
        <span class="upload-hint">支持 JPG / PNG 格式</span>
      </div>
      <div v-else class="preview-area">
        <img :src="previewUrl" class="preview-img" />
      </div>
    </div>

    <div v-if="exifData" class="exif-results">
      <h4 class="result-title">EXIF 信息</h4>
      <div class="exif-grid">
        <div v-for="item in exifList" :key="item.key" class="exif-item glass-card">
          <span class="exif-label">{{ item.label }}</span>
          <span class="exif-value">{{ item.value }}</span>
        </div>
      </div>
      <p v-if="exifList.length === 0" class="no-exif">未找到 EXIF 信息</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const fileInput = ref(null)
const dragging = ref(false)
const imageLoaded = ref(false)
const previewUrl = ref('')
const exifData = ref(null)

const exifLabels = {
  Make: '相机厂商',
  Model: '相机型号',
  DateTime: '拍摄时间',
  FocalLength: '焦距',
  FNumber: '光圈',
  ExposureTime: '快门速度',
  ISOSpeedRatings: 'ISO',
  LensModel: '镜头型号',
}

const exifList = computed(() => {
  if (!exifData.value) return []
  const result = []
  for (const [key, label] of Object.entries(exifLabels)) {
    if (exifData.value[key] !== undefined && exifData.value[key] !== null) {
      let value = exifData.value[key]
      if (key === 'FocalLength') value = formatRational(value) + ' mm'
      else if (key === 'FNumber') value = 'f/' + formatRational(value)
      else if (key === 'ExposureTime') value = formatExposureTime(value)
      else if (key === 'ISOSpeedRatings') value = String(value)
      else if (typeof value === 'object' && value.numerator !== undefined) value = formatRational(value)
      result.push({ key, label, value: String(value) })
    }
  }
  return result
})

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
  const reader = new FileReader()
  reader.onload = (e) => {
    previewUrl.value = e.target.result
    imageLoaded.value = true
    const bytes = new Uint8Array(e.target.result)
    exifData.value = parseExif(bytes)
  }
  reader.readAsArrayBuffer(file)
}

function formatRational(val) {
  if (typeof val === 'number') return val.toFixed(1)
  if (val && val.numerator !== undefined) {
    if (val.denominator === 0) return '0'
    return (val.numerator / val.denominator).toFixed(1)
  }
  return String(val)
}

function formatExposureTime(val) {
  if (typeof val === 'number') {
    if (val < 1) return `1/${Math.round(1 / val)}s`
    return val + 's'
  }
  if (val && val.numerator !== undefined) {
    if (val.denominator === 0) return '0'
    const v = val.numerator / val.denominator
    if (v < 1) return `1/${Math.round(1 / v)}s`
    return v.toFixed(1) + 's'
  }
  return String(val)
}

function parseExif(uint8Array) {
  if (uint8Array[0] !== 0xff || uint8Array[1] !== 0xd8) return null

  let offset = 2
  while (offset < uint8Array.length - 1) {
    if (uint8Array[offset] !== 0xff) break
    const marker = uint8Array[offset + 1]

    if (marker === 0xda) break

    const segmentLength = (uint8Array[offset + 2] << 8) | uint8Array[offset + 3]

    if (marker === 0xe1) {
      const segData = uint8Array.slice(offset + 4, offset + 2 + segmentLength)
      if (segData[0] === 0x45 && segData[1] === 0x78 && segData[2] === 0x69 && segData[3] === 0x66) {
        return parseTiff(segData, 6)
      }
    }

    offset += 2 + segmentLength
  }
  return null
}

function parseTiff(data, tiffOffset) {
  if (data.length < tiffOffset + 8) return null

  let bigEndian = false
  if (data[tiffOffset] === 0x49 && data[tiffOffset + 1] === 0x49) {
    bigEndian = false
  } else if (data[tiffOffset] === 0x4d && data[tiffOffset + 1] === 0x4d) {
    bigEndian = true
  } else {
    return null
  }

  const read16 = (off) => bigEndian ? (data[off] << 8) | data[off + 1] : (data[off + 1] << 8) | data[off]
  const read32 = (off) => bigEndian
    ? (data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]
    : (data[off + 3] << 24) | (data[off + 2] << 16) | (data[off + 1] << 8) | data[off]

  const ifdOffset = read32(tiffOffset + 4)
  const entries = read16(tiffOffset + ifdOffset)
  const result = {}

  for (let i = 0; i < entries; i++) {
    const entryOffset = tiffOffset + ifdOffset + 2 + i * 12
    if (entryOffset + 12 > data.length) break

    const tag = read16(entryOffset)
    const type = read16(entryOffset + 2)
    const count = read32(entryOffset + 4)
    const valueOffset = read32(entryOffset + 8)

    const value = readTagValue(data, tiffOffset, tag, type, count, valueOffset, bigEndian)
    if (value !== null) {
      result[getExifTag(tag)] = value
    }
  }

  if (result.ExifOffset) {
    const subOffset = tiffOffset + result.ExifOffset
    if (subOffset + 2 <= data.length) {
      const subEntries = read16(subOffset)
      for (let i = 0; i < subEntries; i++) {
        const entryOffset = subOffset + 2 + i * 12
        if (entryOffset + 12 > data.length) break

        const tag = read16(entryOffset)
        const type = read16(entryOffset + 2)
        const count = read32(entryOffset + 4)
        const valueOffset = read32(entryOffset + 8)

        const value = readTagValue(data, tiffOffset, tag, type, count, valueOffset, bigEndian)
        if (value !== null) {
          result[getExifTag(tag)] = value
        }
      }
    }
  }

  return result
}

function readTagValue(data, tiffOffset, tag, type, count, valueOffset, bigEndian) {
  const read16 = (off) => bigEndian ? (data[off] << 8) | data[off + 1] : (data[off + 1] << 8) | data[off]
  const read32 = (off) => bigEndian
    ? (data[off] << 24) | (data[off + 1] << 16) | (data[off + 2] << 8) | data[off + 3]
    : (data[off + 3] << 24) | (data[off + 2] << 16) | (data[off + 1] << 8) | data[off]

  if (tag === 0x8769) return valueOffset
  if (tag === 0x0103 && type === 3) return valueOffset & 0xffff

  if (type === 2) {
    let str = ''
    if (count <= 4) {
      for (let i = 0; i < count - 1; i++) {
        str += String.fromCharCode((valueOffset >> (8 * (3 - i))) & 0xff)
      }
    } else {
      const strOff = tiffOffset + valueOffset
      for (let i = 0; i < count - 1 && strOff + i < data.length; i++) {
        str += String.fromCharCode(data[strOff + i])
      }
    }
    return str
  }

  if (type === 3 && count === 1) return valueOffset & 0xffff

  if (type === 4 && count === 1) return valueOffset

  if (type === 5) {
    const rOff = tiffOffset + valueOffset
    const num = read32(rOff)
    const den = read32(rOff + 4)
    return { numerator: num, denominator: den }
  }

  if (type === 10) {
    const rOff = tiffOffset + valueOffset
    const num = read32(rOff)
    const den = read32(rOff + 4)
    return { numerator: num, denominator: den }
  }

  return null
}

function getExifTag(tag) {
  const tags = {
    0x010f: 'Make',
    0x0110: 'Model',
    0x0132: 'DateTime',
    0x829a: 'ExposureTime',
    0x829d: 'FNumber',
    0x8827: 'ISOSpeedRatings',
    0x920a: 'FocalLength',
    0xa432: 'LensModel',
    0x9003: 'DateTime',
    0x0112: 'Orientation',
    0x011a: 'XResolution',
    0x011b: 'YResolution',
  }
  return tags[tag] || `Tag_${tag.toString(16)}`
}
</script>

<style scoped>

.exif-viewer { padding: 8px; }

.upload-zone {
  border: 2px dashed rgba(255, 255, 255, 0.25);
  border-radius: 16px;
  padding: 40px 20px;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  background: rgba(255, 255, 255, 0.05);
  min-height: 180px;
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

.preview-area { width: 100%; }
.preview-img { max-width: 100%; max-height: 200px; border-radius: 12px; }

.exif-results { margin-top: 20px; }
.result-title { font-size: 16px; margin-bottom: 12px; color: var(--text-primary); }

.exif-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 12px;
}

.glass-card {
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 12px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.exif-label {
  font-size: 12px;
  color: var(--text-secondary);
}

.exif-value {
  font-size: 15px;
  font-weight: 500;
  color: var(--text-primary);
  word-break: break-all;
}

.no-exif {
  color: var(--text-secondary);
  text-align: center;
  padding: 20px;
}

</style>
