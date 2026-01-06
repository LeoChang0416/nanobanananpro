<template>
  <Teleport to="body">
    <div v-if="visible" class="modal-overlay" @click="handleClose">
      <div class="modal-content" @click.stop>
        <button class="close-btn" @click="handleClose">×</button>
        <div class="image-container">
          <img :src="image?.url" :alt="image?.prompt" class="modal-image" />
        </div>
        <div class="modal-info">
          <p class="prompt">{{ image?.prompt }}</p>
          <div class="meta">
            <span class="tag">{{ image?.aspectRatio }}</span>
            <span class="tag">{{ image?.imageSize }}</span>
            <span class="time">{{ formatTime(image?.createdAt) }}</span>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  visible: Boolean,
  image: Object
})

const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}

const formatTime = (timestamp) => {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: var(--spacing-lg);
}

.modal-content {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  max-width: 90vw;
  max-height: 90vh;
  overflow: hidden;
  position: relative;
  display: flex;
  flex-direction: column;
}

.close-btn {
  position: absolute;
  top: var(--spacing-md);
  right: var(--spacing-md);
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
  transition: all 0.2s;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.8);
}

.image-container {
  flex: 1;
  overflow: auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #000;
}

.modal-image {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
}

.modal-info {
  padding: var(--spacing-lg);
  border-top: 1px solid var(--color-border-light);
}

.prompt {
  font-size: 15px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.5;
}

.meta {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.tag {
  padding: 2px 8px;
  background: var(--color-primary-subtle);
  color: var(--color-primary);
  border-radius: var(--radius-xs);
  font-size: 12px;
}

.time {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>

