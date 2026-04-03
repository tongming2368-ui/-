<template>
  <div class="tools-page" :class="{ 'guest-mode': !isLoggedIn }">
    <h1>🛠️ 实用工具</h1>
    <div class="tools-grid">
      <GlassCard
        v-for="tool in tools"
        :key="tool.id"
        hoverable
        :class="{ 'tool-locked': !isLoggedIn }"
        @click="handleToolClick(tool)"
      >
        <span class="tool-icon">{{ tool.icon }}</span>
        <h3>{{ tool.name }}</h3>
        <p>{{ tool.desc }}</p>
        <span v-if="tool.level > 1" class="level-badge">Lv.{{ tool.level }}</span>
        <span v-if="tool.pointsCost > 0" class="points-badge">💎{{ tool.pointsCost }}</span>
        <div v-if="!isLoggedIn" class="lock-overlay">
          <span class="lock-icon">🔒</span>
        </div>
      </GlassCard>
    </div>

    <Modal v-model="showExif" title="📷 EXIF 查看器" width="600px">
      <ExifViewer />
    </Modal>

    <Modal v-model="showCompress" title="📦 图片压缩" width="600px">
      <ImageCompressor />
    </Modal>

    <Modal v-model="showDof" title="🔭 景深计算器" width="600px">
      <DofCalculator />
    </Modal>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import GlassCard from '@/components/common/GlassCard.vue'
import Modal from '@/components/common/Modal.vue'
import ExifViewer from '@/components/tools/ExifViewer.vue'
import ImageCompressor from '@/components/tools/ImageCompressor.vue'
import DofCalculator from '@/components/tools/DofCalculator.vue'
import { useAccessControl } from '@/composables/useAccessControl'

const { isLoggedIn, requireLogin } = useAccessControl()

const showExif = ref(false)
const showCompress = ref(false)
const showDof = ref(false)

const STORAGE_KEY = 'phototool_tools_data'

const allTools = ref([])

const defaultTools = [
  { id: 'exif', icon: '📷', name: 'EXIF 查看器', desc: '上传图片，解析光圈/快门/ISO等信息', level: 1, pointsCost: 0, enabled: true },
  { id: 'compress', icon: '📦', name: '图片压缩', desc: '支持 JPG/PNG/WebP 前端压缩', level: 1, pointsCost: 0, enabled: true },
  { id: 'dof', icon: '🔭', name: '景深计算器', desc: '计算景深范围和虚化程度', level: 1, pointsCost: 0, enabled: true },
  { id: 'gallery', icon: '🖼️', name: '图库', desc: '摄影图片资源库', level: 1, pointsCost: 0, enabled: true },
  { id: 'ai', icon: '🤖', name: 'AI API 解析站', desc: 'AI 工具集合', level: 3, pointsCost: 0, enabled: true },
]

// 后台工具名 → 前台功能ID映射 + 描述
const toolMeta = {
  'EXIF查看器': { id: 'exif', desc: '上传图片，解析光圈/快门/ISO等信息' },
  '图片压缩': { id: 'compress', desc: '支持 JPG/PNG/WebP 前端压缩' },
  '景深计算器': { id: 'dof', desc: '计算景深范围和虚化程度' },
  '图库': { id: 'gallery', desc: '摄影图片资源库' },
  'AI API 解析站': { id: 'ai', desc: 'AI 工具集合' },
  '色彩分析器': { id: 'color', desc: '分析图片色彩组成和搭配' },
  '构图辅助线': { id: 'composition', desc: '辅助构图参考线工具' },
  '参数计算器': { id: 'params', desc: '摄影参数计算工具' },
  '直方图分析': { id: 'histogram', desc: '分析图片曝光直方图' },
  '批量裁剪': { id: 'batchcrop', desc: '批量裁剪多张图片' },
  '图片搜索引擎': { id: 'imagesearch', desc: '以图搜图找到相似图片' },
  '光线模拟器': { id: 'lightsim', desc: '模拟不同光线效果' },
  '焦点堆叠工具': { id: 'focusstack', desc: '多焦点合成深度清晰照片' },
}

const loadTools = async () => {
  try {
    // 优先从 API 加载
    const res = await fetch('/api/tools')
    const data = await res.json()
    if (data.items && data.items.length > 0) {
      const apiTools = data.items.map(t => {
        const meta = toolMeta[t.title]
        return {
          id: meta?.id || `api_${t.id}`,
          icon: t.icon || '🔧',
          name: t.title,
          desc: meta?.desc || t.description || '摄影工具',
          level: 1,
          pointsCost: 0,
          enabled: true,
        }
      })
      const frontendOnly = defaultTools.filter(dt => !apiTools.find(at => at.id === dt.id))
      allTools.value = [...apiTools, ...frontendOnly]
      return
    }
  } catch (e) { /* fallback */ }

  // 降级到 localStorage
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const backendTools = JSON.parse(raw)
      const enabledBackend = backendTools.filter(t => t.enabled).map(t => {
        const meta = toolMeta[t.name]
        return {
          id: meta?.id || `backend_${t.id}`,
          icon: t.icon || '🔧',
          name: t.name,
          desc: meta?.desc || (t.toolType === 'external' ? '外部工具链接' : '摄影工具'),
          level: t.levelLimit || 1,
          pointsCost: t.pointsCost || 0,
          enabled: t.enabled,
          toolType: t.toolType,
        }
      })
      const frontendOnly = defaultTools.filter(dt => !enabledBackend.find(bt => bt.id === dt.id))
      allTools.value = [...enabledBackend, ...frontendOnly]
      return
    }
  } catch {}

  allTools.value = defaultTools
}

onMounted(() => {
  loadTools()
  })

// 工具卡片显示用（过滤掉没有对应弹窗的内置工具，只显示有实际功能的）
const tools = computed(() => allTools.value.filter(t => t.enabled))

import { useUserStore } from '@/stores/user'

const userStore = useUserStore()

function handleToolClick(tool) {
  if (!requireLogin('登录后即可使用所有工具')) return

  // 检查等级限制
  if (tool.level > 1 && userStore.levelInfo?.level < tool.level) {
    alert(`需要等级 Lv.${tool.level} 才能使用此工具`)
    return
  }

  // 检查积分消耗
  if (tool.pointsCost > 0) {
    if ((userStore.user?.points || 0) < tool.pointsCost) {
      alert(`积分不足，需要 ${tool.pointsCost} 积分`)
      return
    }
    userStore.addPoints(-tool.pointsCost)
  }

  openTool(tool)
}

function openTool(tool) {
  switch (tool.id) {
    case 'exif': showExif.value = true; break
    case 'compress': showCompress.value = true; break
    case 'dof': showDof.value = true; break
    case 'gallery': alert('图库功能即将上线，敬请期待！'); break
    case 'ai': alert('AI API 解析站即将上线，敬请期待！'); break
    default: alert(`「${tool.name}」功能开发中，敬请期待！`); break
  }
}
</script>

<style scoped>
.tools-page.guest-mode .tools-grid {
  pointer-events: none;
}

.tool-locked {
  position: relative;
  pointer-events: auto;
}

.tool-locked:hover {
  cursor: not-allowed;
}

.lock-overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 14px;
  opacity: 0;
  transition: opacity 0.3s;
  pointer-events: none;
}

.tool-locked:hover .lock-overlay {
  opacity: 1;
}

.lock-icon {
  font-size: 28px;
  filter: drop-shadow(0 2px 8px rgba(0, 0, 0, 0.5));
}

.tools-page { padding: 32px; color: var(--text-primary); }
.tools-page h1 { font-size: 24px; margin-bottom: 24px; }
.tools-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; }
.tools-grid .glass-card { text-align: center; padding: 32px 20px; position: relative; }
.tool-icon { font-size: 48px; display: block; margin-bottom: 12px; }
.tools-grid h3 { font-size: 16px; margin-bottom: 8px; }
.tools-grid p { font-size: 13px; color: var(--text-primary); }
.level-badge {
  position: absolute;
  top: 12px;
  right: 12px;
  background: rgba(251, 191, 36, 0.2);
  border: 1px solid rgba(251, 191, 36, 0.4);
  color: #fbbf24;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
}

.points-badge {
  position: absolute;
  top: 12px;
  left: 12px;
  background: rgba(59, 130, 246, 0.2);
  border: 1px solid rgba(59, 130, 246, 0.4);
  color: #60a5fa;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 8px;
}

</style>
