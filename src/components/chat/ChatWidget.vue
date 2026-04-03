<template>
  <Teleport to="body">
  <div class="chat-widget-container">
    <!-- Floating toggle button -->
    <div v-if="!isOpen" class="chat-float-btn" @click="isOpen = true" title="打开聊天室">
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
          <div
            v-for="msg in messages"
            :key="msg.id"
            class="message"
            :class="{ self: msg.userId === currentUser.value?.id || msg.userId === 0 }"
          >
            <div class="msg-avatar">{{ msg.avatar || '👤' }}</div>
            <div class="msg-content">
              <div class="msg-header">
                <span class="msg-author">{{ msg.authorName }}</span>
                <span class="msg-time">{{ formatTime(msg.createdAt) }}</span>
              </div>
              <div class="msg-text">{{ msg.content }}</div>
            </div>
          </div>
        </div>
        <div class="chat-input">
          <input
            v-model="newMessage"
            :placeholder="canSend ? '发送消息...' : `${countdown}秒后可发送`"
            :disabled="!canSend"
            @keyup.enter="handleSend"
          />
          <button @click="handleSend" :disabled="!canSend">
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

const openChat = () => {
  isOpen.value = true
  nextTick(() => {
    if (msgList.value) {
      msgList.value.scrollTop = msgList.value.scrollHeight
    }
  })
}

const messages = ref([
  { id: 1, userId: 2, authorName: '小明', avatar: '🧑', content: '今天天气真好！出去拍了几张', createdAt: new Date(Date.now() - 3600000).toISOString() },
  { id: 2, userId: 3, authorName: '老王', avatar: '👨', content: '拍的什么题材？', createdAt: new Date(Date.now() - 1800000).toISOString() },
  { id: 3, userId: 1, authorName: '测试用户', avatar: '👤', content: '刚拍了一组夜景，太美了', createdAt: new Date(Date.now() - 600000).toISOString() },
])

const newMessage = ref('')
const canSend = ref(true)
const countdown = ref(0)
const msgList = ref(null)
let timer = null

const formatTime = (time) => {
  const d = new Date(time)
  return `${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}

const handleSend = async () => {
  if (!canSend.value || !newMessage.value.trim()) return

  const content = newMessage.value
  newMessage.value = ''

  messages.value.push({
    id: Date.now(),
    userId: currentUser.value?.id || 0,
    authorName: currentUser.value?.nickname || '我',
    avatar: currentUser.value?.avatar || '😊',
    content,
    createdAt: new Date().toISOString()
  })

  canSend.value = false
  countdown.value = 30

  timer = setInterval(() => {
    countdown.value--
    if (countdown.value <= 0) {
      canSend.value = true
      clearInterval(timer)
    }
  }, 1000)

  await nextTick()
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
}

onMounted(() => {
  if (msgList.value) {
    msgList.value.scrollTop = msgList.value.scrollHeight
  }
})

onUnmounted(() => {
  clearInterval(timer)
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
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
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

.msg-author {
  font-size: 12px;
  color: #1a1a2e;
  font-weight: 600;
  
}

.chat-input {
  display: flex;
  gap: 8px;
  padding: 12px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  flex-shrink: 0;
}

.chat-input input {
  flex: 1;
  background: rgba(0, 0, 0, 0.06);
  border: 1px solid rgba(255, 255, 255, 0.2);
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
