<template>
  <Teleport to="body">
  <div class="chat-widget-container">
    <!-- Floating toggle button -->
    <div v-if="!isOpen" class="chat-float-btn" @click="openChat" title="打开聊天室">
      <span class="float-icon">💬</span>
    </div>

    <!-- Chat panel -->
    <Transition name="slide-up">
      <div v-if="isOpen" class="chat-widget">
        <div class="chat-header">
          <span>💬 聊天室</span>
          <button @click="isOpen = false" class="close-btn">×</button>
        </div>
        <div class="chat-messages" ref="msgList">
          <div v-if="loading" class="chat-loading">加载中...</div>
          <div v-else-if="messages.length === 0" class="chat-empty">暂无消息，来聊两句吧 💬</div>
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message"
            :class="{ self: msg.user_id === currentUser?.id }"
          >
            <div class="msg-avatar">{{ msg.author_avatar || '👤' }}</div>
            <div class="msg-content">
              <div class="msg-header">
                <span class="msg-author">{{ msg.author_name || '匿名' }}</span>
                <span class="msg-time">{{ formatTime(msg.created_at) }}</span>
              </div>
              <div class="msg-text">{{ msg.content }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            :placeholder="canSend ? '发送消息...' : `${countdown}秒后可发送`"
            :disabled="!canSend || !currentUser"
            @keyup.enter="handleSend"
          />
          <button @click="handleSend" :disabled="!canSend || !currentUser">
            {{ canSend ? '发送' : countdown }}
          </button>
        </div>
      </div>
    </Transition>
  </div>
  </Teleport>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useUserStore } from '@/stores/user'

const props = defineProps({ isOpen: { type: Boolean, default: false } })
const emit = defineEmits(['update:isOpen'])

const userStore = useUserStore()
const currentUser = computed(() => userStore.user)
const isOpen = computed({
  get: () => props.isOpen,
  set: (val) => emit('update:isOpen', val)
})

const messages = ref([])
const newMessage = ref('')
const canSend = ref(true)
const countdown = ref(0)
const msgList = ref(null)
const loading = ref(false)
let timer = null
let pollTimer = null

const API_BASE = '/api/chat'

const formatTime = (time) => {
  if (!time) return ''
  const d = new Date(time)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const scrollToBottom = () => {
  nextTick(() => {
    if (msgList.value) {
      msgList.value.scrollTop = msgList.value.scrollHeight
    }
  })
}

// 加载消息
const loadMessages = async () => {
  try {
    const res = await fetch(`${API_BASE}/messages?limit=50`)
    const data = await res.json()
    if (data.messages) {
      messages.value = data.messages
      scrollToBottom()
    }
  } catch (e) {
    console.error('加载聊天消息失败:', e)
  }
}

// 轮询新消息
const pollMessages = async () => {
  if (!isOpen.value) return
  try {
    const res = await fetch(`${API_BASE}/messages?limit=50`)
    const data = await res.json()
    if (data.messages && data.messages.length !== messages.value.length) {
      messages.value = data.messages
      scrollToBottom()
    }
  } catch (e) { /* 静默失败 */ }
}

const openChat = () => {
  isOpen.value = true
  loading.value = true
  loadMessages().finally(() => { loading.value = false })
  // 启动轮询
  if (pollTimer) clearInterval(pollTimer)
  pollTimer = setInterval(pollMessages, 5000)
}

const handleSend = async () => {
  if (!canSend.value || !newMessage.value.trim() || !currentUser.value) return

  const content = newMessage.value.trim()
  newMessage.value = ''

  try {
    const token = localStorage.getItem('auth_token')
    const res = await fetch(`${API_BASE}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ content })
    })
    const data = await res.json()
    if (data.message) {
      messages.value.push(data.message)
      scrollToBottom()
    }
  } catch (e) {
    console.error('发送消息失败:', e)
  }

  // 发送冷却
  canSend.value = false
  countdown.value = 10
  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      canSend.value = true
      clearInterval(timer)
    }
  }, 1000)
}

watch(isOpen, (val) => {
  if (val) {
    if (pollTimer) clearInterval(pollTimer)
    pollTimer = setInterval(pollMessages, 5000)
  } else {
    if (pollTimer) clearInterval(pollTimer)
  }
})

onMounted(() => {
  if (isOpen.value) {
    loading.value = true
    loadMessages().finally(() => { loading.value = false })
    pollTimer = setInterval(pollMessages, 5000)
  }
})

onUnmounted(() => {
  clearInterval(timer)
  clearInterval(pollTimer)
})
</script>

<style scoped>
.chat-widget-container {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
}

.chat-float-btn {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea, #764ba2);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 4px 24px rgba(102, 126, 234, 0.5);
  transition: transform 0.3s ease;
  border: 2px solid rgba(255, 255, 255, 0.2);
}

.chat-float-btn:hover {
  transform: scale(1.1);
}

.float-icon {
  font-size: 24px;
}

.chat-widget {
  width: 360px;
  height: 500px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(24px);
  -webkit-backdrop-filter: blur(24px);
  border: 1px solid rgba(0, 0, 0, 0.12);
  border-radius: 16px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
  color: #1a1a2e;
}

.chat-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  font-weight: 600;
  font-size: 15px;
  flex-shrink: 0;
  color: #1a1a2e;
}

.close-btn {
  background: none;
  border: none;
  color: rgba(0, 0, 0, 0.5);
  font-size: 22px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1a1a2e;
}

.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-loading, .chat-empty {
  text-align: center;
  color: rgba(0, 0, 0, 0.4);
  font-size: 14px;
  padding: 40px 0;
}

.message {
  display: flex;
  gap: 8px;
}

.message.self {
  flex-direction: row-reverse;
}

.msg-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  flex-shrink: 0;
}

.msg-content {
  max-width: 70%;
}

.msg-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.msg-author {
  font-size: 12px;
  color: #1a1a2e;
  font-weight: 600;
}

.msg-time {
  font-size: 10px;
  color: rgba(0, 0, 0, 0.45);
}

.msg-text {
  background: rgba(0, 0, 0, 0.06);
  padding: 10px 14px;
  border-radius: 12px;
  font-size: 14px;
  color: #1a1a2e;
  line-height: 1.5;
  word-break: break-word;
}

.message.self .msg-text {
  background: rgba(80, 130, 220, 0.5);
  color: #1a1a2e;
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
  flex-shrink: 0;
}

.chat-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  padding: 8px 12px;
  color: #1a1a2e;
  font-size: 14px;
  outline: none;
}

.chat-input input:focus {
  border-color: rgba(0, 0, 0, 0.2);
}

.chat-input input::placeholder {
  color: rgba(0, 0, 0, 0.4);
}

.chat-input button {
  background: rgba(100, 140, 220, 0.6);
  border: none;
  border-radius: 8px;
  padding: 8px 16px;
  color: #1a1a2e;
  font-size: 14px;
  cursor: pointer;
  transition: background 0.2s;
  font-weight: 500;
}

.chat-input button:hover:not(:disabled) {
  background: rgba(100, 140, 220, 0.85);
}

.chat-input button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(20px);
}
</style>
