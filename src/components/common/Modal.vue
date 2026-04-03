<template>
  <Teleport to="body">
    <Transition name="modal">
      <div v-if="modelValue" class="modal-mask" @click="handleMaskClick">
        <div class="modal-wrapper" @click.stop>
          <div class="modal-container" :style="{ width, maxHeight }">
            <div class="modal-header">
              <slot name="header">
                <h3>{{ title }}</h3>
              </slot>
              <button class="close-btn" @click="close">×</button>
            </div>
            <div class="modal-body">
              <slot></slot>
            </div>
            <div v-if="$slots.footer" class="modal-footer">
              <slot name="footer"></slot>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup>
const props = defineProps({
  modelValue: Boolean,
  title: String,
  width: { type: String, default: '600px' },
  maxHeight: { type: String, default: '90vh' },
  maskClosable: { type: Boolean, default: true }
})

const emit = defineEmits(['update:modelValue'])

const close = () => emit('update:modelValue', false)

const handleMaskClick = () => {
  if (props.maskClosable) close()
}
</script>

<style scoped>
.modal-mask {
  position: fixed;
  z-index: 9998;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  backdrop-filter: blur(5px);
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal-container {
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(24px) saturate(1.3);
  -webkit-backdrop-filter: blur(24px) saturate(1.3);
  border: 1px solid rgba(255, 255, 255, 0.5);
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.6);
  overflow-y: auto;
  color: #1e2e3e;
}

body.light-theme .modal-container {
  background: rgba(255, 255, 255, 0.92);
  border-color: rgba(0, 0, 0, 0.1);
  color: #1a2e3a;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: #000;
}

.close-btn {
  background: none;
  border: none;
  color: #5a6e7e;
  font-size: 24px;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 6px;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.06);
  color: #1e2e3e;
}

.modal-footer {
  margin-top: 16px;
  padding-top: 12px;
  border-top: 1px solid rgba(0, 0, 0, 0.08);
}

.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}
</style>
