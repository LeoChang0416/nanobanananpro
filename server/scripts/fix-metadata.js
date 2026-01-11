import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const STORAGE_DIR = path.join(__dirname, '..', 'storage', 'images')
const METADATA_FILE = path.join(__dirname, '..', 'storage', 'metadata.json')

// 读取元数据
const readMetadata = () => {
  if (!fs.existsSync(METADATA_FILE)) {
    return []
  }
  const data = fs.readFileSync(METADATA_FILE, 'utf-8')
  return JSON.parse(data)
}

// 写入元数据
const writeMetadata = (data) => {
  fs.writeFileSync(METADATA_FILE, JSON.stringify(data, null, 2), 'utf-8')
}

// 修复缺失的metadata记录
const fixMissingMetadata = () => {
  console.log('🔧 开始修复metadata...')
  
  // 读取目录中的所有图片文件
  const files = fs.readdirSync(STORAGE_DIR).filter(f => f.endsWith('.png'))
  console.log(`📁 目录中共有 ${files.length} 个图片文件`)
  
  // 读取现有metadata
  const metadata = readMetadata()
  const existingIds = new Set(metadata.map(m => m.id))
  console.log(`📝 metadata中已有 ${metadata.length} 条记录`)
  
  // 找出缺失的图片
  const missingFiles = files.filter(f => !existingIds.has(f.replace('.png', '')))
  console.log(`❌ 发现 ${missingFiles.length} 个图片缺失metadata记录`)
  
  if (missingFiles.length === 0) {
    console.log('✅ 所有图片都已有记录，无需修复')
    return
  }
  
  // 为缺失的图片创建记录
  const newRecords = missingFiles.map(filename => {
    const id = filename.replace('.png', '')
    const filepath = path.join(STORAGE_DIR, filename)
    const stats = fs.statSync(filepath)
    
    return {
      id,
      prompt: '(历史记录修复)',
      aspectRatio: 'auto',
      imageSize: '1K',
      filename,
      url: `/storage/images/${filename}`,
      remoteUrl: '',
      createdAt: stats.mtimeMs
    }
  })
  
  // 合并到metadata（按创建时间排序）
  const allRecords = [...metadata, ...newRecords]
  allRecords.sort((a, b) => b.createdAt - a.createdAt)
  
  // 写入文件
  writeMetadata(allRecords)
  
  console.log('✅ 修复完成！')
  console.log(`📝 新增 ${newRecords.length} 条记录`)
  console.log(`📊 metadata总记录数: ${allRecords.length}`)
}

// 执行修复
fixMissingMetadata()

