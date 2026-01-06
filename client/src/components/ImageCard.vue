<template>
  <div class="image-card">
    <div class="image-wrapper">
      <img :src="image.url" :alt="image.prompt" class="image" />
      <div class="overlay">
        <button class="action-btn" @click="handleView">查看</button>
        <button class="action-btn delete" @click="handleDelete">删除</button>
      </div>
    </div>
    <div class="card-info">
      <p class="prompt">{{ image.prompt }}</p>
      <p class="time">{{ formatTime(image.createdAt) }}</p>
    </div>
  </div>
</template>

<script setup>
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  image: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['view', 'delete'])

const handleView = () => {
  emit('view', props.image)
}

const handleDelete = () => {
  emit('delete', props.image.id)
}

const formatTime = (timestamp) => {
  const date = new Date(timestamp)
  return date.toLocaleString('zh-CN', { 
    month: 'numeric', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}
</script>

<style scoped>
.image-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: all 0.3s;
}

.image-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: var(--color-bg-container);
}

.image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-md);
  opacity: 0;
  transition: opacity 0.3s;
}

.image-wrapper:hover .overlay {
  opacity: 1;
}

.action-btn {
  padding: var(--spacing-sm) var(--spacing-lg);
  background: var(--color-bg-card);
  color: var(--color-text-primary);
  border-radius: var(--radius-sm);
  font-size: 14px;
  transition: all 0.2s;
}

.action-btn:hover {
  background: var(--color-primary);
  color: white;
}

.action-btn.delete:hover {
  background: var(--color-error);
}

.card-info {
  padding: var(--spacing-md);
}

.prompt {
  font-size: 14px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-xs);
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.time {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>

