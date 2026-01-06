<template>
  <div class="generate-panel">
    <div class="panel-header">
      <h2 class="title">创作灵感</h2>
      <p class="subtitle">用文字描述你想要的画面</p>
    </div>
    
    <div class="form">
      <div class="form-group">
        <label class="label">参考图（可选，最多20张）</label>
        <div 
          class="upload-area" 
          :class="{ disabled: loading }"
          @click="!loading && triggerUpload()" 
          @dragover.prevent 
          @drop.prevent="!loading && handleDrop($event)"
        >
          <input 
            ref="fileInputRef"
            type="file" 
            accept="image/jpeg,image/jpg,image/png,image/webp"
            multiple
            class="file-input"
            @change="handleFileSelect"
          />
          <div v-if="referenceImages.length === 0" class="upload-placeholder">
            <span class="upload-icon">📷</span>
            <p>点击或拖拽上传参考图</p>
            <p class="upload-hint">支持 JPG、PNG、WEBP 格式</p>
          </div>
          <div v-else class="preview-grid">
            <div v-for="(img, index) in referenceImages" :key="index" class="preview-item">
              <img :src="img.preview" :alt="'参考图 ' + (index + 1)" />
              <button class="remove-btn" @click.stop="removeImage(index)">×</button>
            </div>
            <div v-if="referenceImages.length < 20" class="add-more" @click.stop="triggerUpload">
              <span>+</span>
            </div>
          </div>
        </div>
      </div>

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
      <div v-if="loading" class="generating-tip">
        <p>正在生成中，请耐心等待...</p>
        <p class="tip-sub">图片生成通常需要30秒到2分钟</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['generate'])

const prompt = ref('')
const aspectRatio = ref('auto')
const imageSize = ref('1K')
const textareaRef = ref(null)
const fileInputRef = ref(null)
const referenceImages = ref([])

const MAX_IMAGES = 20

const triggerUpload = () => {
  fileInputRef.value?.click()
}

const handleFileSelect = (e) => {
  const files = Array.from(e.target.files || [])
  processFiles(files)
  e.target.value = ''
}

const handleDrop = (e) => {
  const files = Array.from(e.dataTransfer.files || [])
  processFiles(files)
}

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

const processFiles = async (files) => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  const validFiles = files.filter(f => {
    if (!validTypes.includes(f.type)) return false
    if (f.size > MAX_FILE_SIZE) {
      alert(`文件 ${f.name} 超过10MB限制，已跳过`)
      return false
    }
    return true
  })
  
  const remaining = MAX_IMAGES - referenceImages.value.length
  const filesToProcess = validFiles.slice(0, remaining)
  
  for (const file of filesToProcess) {
    const base64 = await fileToBase64(file)
    referenceImages.value.push({
      file,
      preview: URL.createObjectURL(file),
      base64
    })
  }
}

const fileToBase64 = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const removeImage = (index) => {
  URL.revokeObjectURL(referenceImages.value[index].preview)
  referenceImages.value.splice(index, 1)
}

const autoResize = () => {
  const el = textareaRef.value
  if (!el) return
  el.style.height = 'auto'
  el.style.height = el.scrollHeight + 'px'
}

const handleGenerate = () => {
  if (!prompt.value.trim()) return
  
  const urls = referenceImages.value.map(img => img.base64)
  
  emit('generate', {
    prompt: prompt.value,
    aspectRatio: aspectRatio.value,
    imageSize: imageSize.value,
    urls: urls.length > 0 ? urls : undefined
  })
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

.upload-area {
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-md);
  padding: var(--spacing-lg);
  cursor: pointer;
  transition: all 0.2s;
  min-height: 120px;
}

.upload-area:hover:not(.disabled) {
  border-color: var(--color-primary);
  background: var(--color-primary-soft);
}

.upload-area.disabled {
  opacity: 0.6;
  cursor: not-allowed;
  pointer-events: none;
}

.file-input {
  display: none;
}

.upload-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--spacing-sm);
  color: var(--color-text-tertiary);
}

.upload-icon {
  font-size: 32px;
}

.upload-hint {
  font-size: 12px;
  color: var(--color-text-disabled);
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  gap: var(--spacing-sm);
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.remove-btn {
  position: absolute;
  top: 4px;
  right: 4px;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: white;
  font-size: 14px;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.2s;
}

.remove-btn:hover {
  background: var(--color-error);
}

.add-more {
  aspect-ratio: 1;
  border: 2px dashed var(--color-border);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  color: var(--color-text-tertiary);
  cursor: pointer;
  transition: all 0.2s;
}

.add-more:hover {
  border-color: var(--color-primary);
  color: var(--color-primary);
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

.generating-tip {
  text-align: center;
  padding: var(--spacing-md);
  background: var(--color-primary-soft);
  border-radius: var(--radius-sm);
  margin-top: var(--spacing-md);
}

.generating-tip p {
  color: var(--color-primary);
  font-size: 14px;
  font-weight: 500;
  margin: 0;
}

.tip-sub {
  font-size: 12px !important;
  color: var(--color-text-tertiary) !important;
  margin-top: var(--spacing-xs) !important;
}
</style>

