<template>
  <div class="generate-panel">
    <div class="panel-header">
      <h2 class="title">创作灵感</h2>
      <p class="subtitle">用文字描述你想要的画面</p>
    </div>
    
    <div class="form">
      <div class="form-group">
        <label class="label">描述</label>
        <textarea 
          ref="textareaRef"
          v-model="prompt" 
          class="textarea"
          placeholder="例如：一只可爱的猫咪坐在窗边，阳光洒在它身上..."
          @input="autoResize"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label class="label">比例</label>
          <select v-model="aspectRatio" class="select">
            <option value="auto">自动</option>
            <option value="1:1">1:1 正方形</option>
            <option value="16:9">16:9 横版</option>
            <option value="9:16">9:16 竖版</option>
            <option value="4:3">4:3</option>
            <option value="3:4">3:4</option>
            <option value="3:2">3:2</option>
            <option value="2:3">2:3</option>
            <option value="5:4">5:4</option>
            <option value="4:5">4:5</option>
            <option value="21:9">21:9 超宽</option>
          </select>
        </div>

        <div class="form-group">
          <label class="label">分辨率</label>
          <select v-model="imageSize" class="select">
            <option value="1K">1K</option>
            <option value="2K">2K</option>
            <option value="4K">4K</option>
          </select>
        </div>
      </div>

      <button 
        class="generate-btn" 
        @click="handleGenerate"
        :disabled="!prompt.trim() || loading"
      >
        <span v-if="loading" class="loading-icon">⏳</span>
        <span>{{ loading ? '生成中...' : '开始生成' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, nextTick } from 'vue'

const emit = defineEmits(['generate'])

const prompt = ref('')
const aspectRatio = ref('auto')
const imageSize = ref('1K')
const loading = ref(false)
const textareaRef = ref(null)

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const handleGenerate = () => {
  if (!prompt.value.trim()) return
  
  loading.value = true
  emit('generate', {
    prompt: prompt.value,
    aspectRatio: aspectRatio.value,
    imageSize: imageSize.value
  })
  
  setTimeout(() => {
    loading.value = false
  }, 2000)
}
</script>

<style scoped>
.generate-panel {
  background: var(--color-bg-card);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-md);
}

.panel-header {
  margin-bottom: var(--spacing-xl);
}

.title {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text-title);
  margin-bottom: var(--spacing-xs);
}

.subtitle {
  font-size: 14px;
  color: var(--color-text-tertiary);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-lg);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-sm);
  flex: 1;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-md);
}

.form-group > .label {
  font-size: 14px;
  font-weight: 500;
  color: #333333 !important;
  display: block;
}

.textarea,
.select {
  padding: var(--spacing-md);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  font-size: 15px;
  transition: all 0.2s;
  background: var(--color-bg-page);
  color: #333333;
  width: 100%;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.select {
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%23666' d='M6 8L1 3h10z'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  cursor: pointer;
}

.textarea:focus,
.select:focus {
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-primary-subtle);
  outline: none;
}

.textarea {
  resize: none;
  min-height: 100px;
  max-height: 300px;
  overflow-y: auto;
}

.generate-btn {
  padding: var(--spacing-md) var(--spacing-xl);
  background: var(--color-primary);
  color: white;
  border-radius: var(--radius-md);
  font-size: 16px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
}

.generate-btn:hover:not(:disabled) {
  background: var(--color-primary-dark);
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.generate-btn:active:not(:disabled) {
  transform: translateY(0);
}

.generate-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.loading-icon {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}
</style>

