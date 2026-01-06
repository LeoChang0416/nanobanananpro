<template>
  <div class="task-card" :class="task.status">
    <div class="task-header">
      <span class="task-status">
        <span v-if="task.status === 'pending'" class="status-icon">⏳</span>
        <span v-else-if="task.status === 'running'" class="status-icon spinning">🔄</span>
        <span v-else-if="task.status === 'succeeded'" class="status-icon">✅</span>
        <span v-else-if="task.status === 'failed'" class="status-icon">❌</span>
        <span v-else-if="task.status === 'cancelled'" class="status-icon">🚫</span>
        {{ statusText }}
        <span v-if="task.status === 'running' && task.progress > 0" class="progress-text">{{ task.progress }}%</span>
      </span>
      <div class="task-actions">
        <button 
          v-if="task.status === 'pending' || task.status === 'running'" 
          class="cancel-btn" 
          @click="$emit('cancel', task.id)"
          title="取消任务"
        >取消</button>
        <button 
          v-if="task.status === 'failed' || task.status === 'cancelled' || task.status === 'succeeded'" 
          class="close-btn" 
          @click="$emit('remove', task.id)"
        >×</button>
      </div>
    </div>
    
    <div class="task-prompt">{{ truncatedPrompt }}</div>
    
    <div class="task-meta">
      <span>{{ task.aspectRatio }}</span>
      <span>{{ task.imageSize }}</span>
      <span v-if="task.hasReferenceImages">含参考图</span>
    </div>

    <div v-if="task.status === 'running' || task.status === 'pending'" class="progress-bar">
      <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
    </div>

    <div v-if="task.status === 'failed'" class="task-error">
      <p>{{ task.error }}</p>
      <button class="retry-btn" @click="$emit('retry', task.id)">重试</button>
    </div>

    <div v-if="task.status === 'cancelled'" class="task-cancelled">
      <p>任务已取消</p>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  task: {
    type: Object,
    required: true
  }
})

defineEmits(['remove', 'retry', 'cancel'])

const statusText = computed(() => {
  const map = {
    pending: '排队中',
    running: '生成中',
    succeeded: '完成',
    failed: '失败',
    cancelled: '已取消'
  }
  return map[props.task.status] || props.task.status
})

const truncatedPrompt = computed(() => {
  const p = props.task.prompt || ''
  return p.length > 50 ? p.substring(0, 50) + '...' : p
})
</script>

<style scoped>
.task-card {
  background: var(--color-bg-card);
  border-radius: var(--radius-md);
  padding: var(--spacing-md);
  box-shadow: var(--shadow-sm);
  border-left: 4px solid var(--color-border);
  transition: all 0.3s;
}

.task-card.pending {
  border-left-color: var(--color-text-tertiary);
}

.task-card.running {
  border-left-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.task-card.succeeded {
  border-left-color: var(--color-success);
}

.task-card.failed {
  border-left-color: var(--color-error);
  background: var(--color-error-light);
}

.task-card.cancelled {
  border-left-color: var(--color-text-tertiary);
  background: var(--color-bg-container);
  opacity: 0.7;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--spacing-sm);
}

.task-status {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-secondary);
}

.progress-text {
  margin-left: 4px;
  font-weight: 600;
  color: var(--color-primary);
}

.status-icon {
  font-size: 14px;
}

.status-icon.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.task-actions {
  display: flex;
  gap: var(--spacing-xs);
  align-items: center;
}

.cancel-btn {
  font-size: 12px;
  padding: 2px 8px;
  background: var(--color-warning);
  color: white;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.cancel-btn:hover {
  opacity: 0.8;
}

.close-btn {
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: var(--color-text-tertiary);
  color: white;
  font-size: 14px;
  line-height: 1;
  cursor: pointer;
}

.close-btn:hover {
  background: var(--color-error);
}

.task-prompt {
  font-size: 14px;
  color: var(--color-text-primary);
  margin-bottom: var(--spacing-sm);
  line-height: 1.4;
}

.task-meta {
  display: flex;
  gap: var(--spacing-sm);
  font-size: 12px;
  color: var(--color-text-tertiary);
}

.task-meta span {
  background: var(--color-bg-container);
  padding: 2px 8px;
  border-radius: var(--radius-xs);
}

.progress-bar {
  margin-top: var(--spacing-sm);
  height: 4px;
  background: var(--color-border);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary);
  transition: width 0.3s;
}

.task-error {
  margin-top: var(--spacing-sm);
}

.task-error p {
  font-size: 12px;
  color: var(--color-error);
  margin-bottom: var(--spacing-xs);
}

.retry-btn {
  font-size: 12px;
  padding: 4px 12px;
  background: var(--color-error);
  color: white;
  border-radius: var(--radius-xs);
  cursor: pointer;
}

.retry-btn:hover {
  opacity: 0.9;
}

.task-cancelled {
  margin-top: var(--spacing-sm);
}

.task-cancelled p {
  font-size: 12px;
  color: var(--color-text-tertiary);
}
</style>

