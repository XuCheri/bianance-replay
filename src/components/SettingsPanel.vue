<template>
  <el-drawer
    v-model="visible"
    title="系统设置"
    :size="400"
    direction="rtl"
  >
    <div class="settings-content">
      <!-- 基础设置 -->
      <div class="settings-section">
        <h4 class="section-title">基础设置</h4>
        
        <div class="setting-item">
          <div class="setting-label">深色模式</div>
          <el-switch v-model="configStore.isDarkMode" @change="handleDarkModeChange" />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">演示模式</div>
          <el-switch 
            v-model="configStore.demoMode" 
            @change="handleDemoModeChange"
            active-text="使用模拟数据"
            inactive-text="使用真实API"
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">语言</div>
          <el-select v-model="configStore.language" @change="configStore.setLanguage">
            <el-option label="简体中文" value="zh-CN" />
            <el-option label="English" value="en-US" />
          </el-select>
        </div>
      </div>

      <!-- API配置 -->
      <div v-if="!configStore.demoMode" class="settings-section">
        <h4 class="section-title">币安API配置</h4>
        
        <el-alert
          title="API配置说明"
          type="info"
          :closable="false"
          show-icon
          class="api-info"
        >
          <p>请确保您的API密钥具有以下权限：</p>
          <ul>
            <li>期货交易权限（Futures Trading）</li>
            <li>读取权限（Enable Reading）</li>
            <li>当前IP已添加到白名单</li>
          </ul>
        </el-alert>
        
        <div class="setting-item">
          <div class="setting-label">API Key</div>
          <el-input
            v-model="apiForm.apiKey"
            type="password"
            placeholder="请输入API Key"
            show-password
            clearable
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">Secret Key</div>
          <el-input
            v-model="apiForm.secretKey"
            type="password"
            placeholder="请输入Secret Key"
            show-password
            clearable
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">测试网络</div>
          <el-switch v-model="apiForm.testnet" />
        </div>
        
        <div class="setting-actions">
          <el-button type="primary" @click="saveApiConfig" :loading="testing">
            {{ testing ? '测试中...' : '保存配置' }}
          </el-button>
          <el-button @click="clearApiConfig">清除配置</el-button>
        </div>
        
        <el-alert
          v-if="apiStatus"
          :title="apiStatus.message"
          :type="apiStatus.type"
          :closable="false"
          show-icon
          class="api-status"
        />
      </div>

      <!-- 图表设置 -->
      <div class="settings-section">
        <h4 class="section-title">图表设置</h4>
        
        <div class="setting-item">
          <div class="setting-label">启用工具栏</div>
          <el-switch 
            v-model="chartConfig.toolboxEnabled"
            @change="updateChartConfig"
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">启用缩放</div>
          <el-switch 
            v-model="chartConfig.dataZoomEnabled"
            @change="updateChartConfig"
          />
        </div>
        
        <div class="setting-item">
          <div class="setting-label">动画时长 (ms)</div>
          <el-slider
            v-model="chartConfig.animationDuration"
            :min="0"
            :max="3000"
            :step="100"
            @change="updateChartConfig"
          />
        </div>
      </div>

      <!-- 数据刷新设置 -->
      <div class="settings-section">
        <h4 class="section-title">数据设置</h4>
        
        <div class="setting-item">
          <div class="setting-label">自动刷新</div>
          <el-switch 
            v-model="refreshConfig.autoRefresh"
            @change="updateRefreshConfig"
          />
        </div>
        
        <div v-if="refreshConfig.autoRefresh" class="setting-item">
          <div class="setting-label">刷新间隔 (分钟)</div>
          <el-select 
            v-model="refreshInterval"
            @change="updateRefreshInterval"
          >
            <el-option label="1分钟" :value="1" />
            <el-option label="5分钟" :value="5" />
            <el-option label="10分钟" :value="10" />
            <el-option label="30分钟" :value="30" />
          </el-select>
        </div>
        
        <div class="setting-item">
          <div class="setting-label">缓存时长 (分钟)</div>
          <el-select 
            v-model="cacheTimeout"
            @change="updateCacheTimeout"
          >
            <el-option label="1分钟" :value="1" />
            <el-option label="5分钟" :value="5" />
            <el-option label="10分钟" :value="10" />
            <el-option label="30分钟" :value="30" />
          </el-select>
        </div>
      </div>

      <!-- 主题设置 -->
      <div class="settings-section">
        <h4 class="section-title">主题设置</h4>
        
        <div class="color-picker-grid">
          <div class="color-picker-item">
            <div class="color-label">主色调</div>
            <el-color-picker 
              v-model="themeColors.primaryColor"
              @change="updateThemeColors"
            />
          </div>
          
          <div class="color-picker-item">
            <div class="color-label">成功色</div>
            <el-color-picker 
              v-model="themeColors.successColor"
              @change="updateThemeColors"
            />
          </div>
          
          <div class="color-picker-item">
            <div class="color-label">警告色</div>
            <el-color-picker 
              v-model="themeColors.warningColor"
              @change="updateThemeColors"
            />
          </div>
          
          <div class="color-picker-item">
            <div class="color-label">危险色</div>
            <el-color-picker 
              v-model="themeColors.dangerColor"
              @change="updateThemeColors"
            />
          </div>
        </div>
      </div>

      <!-- 配置管理 -->
      <div class="settings-section">
        <h4 class="section-title">配置管理</h4>
        
        <div class="config-actions">
          <el-button @click="exportSettings" icon="Download">
            导出配置
          </el-button>
          <el-button @click="showImportDialog = true" icon="Upload">
            导入配置
          </el-button>
          <el-button @click="resetSettings" type="danger" icon="RefreshLeft">
            重置设置
          </el-button>
        </div>
      </div>
    </div>

    <!-- 导入配置对话框 -->
    <el-dialog
      v-model="showImportDialog"
      title="导入配置"
      width="600px"
    >
      <el-input
        v-model="importConfigText"
        type="textarea"
        :rows="10"
        placeholder="请粘贴配置JSON"
      />
      
      <template #footer>
        <el-button @click="showImportDialog = false">取消</el-button>
        <el-button type="primary" @click="importSettings">确定</el-button>
      </template>
    </el-dialog>
  </el-drawer>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useConfigStore } from '@/stores/config'
import { useDataStore } from '@/stores/data'

interface Props {
  modelValue: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  'update:modelValue': [value: boolean]
  'config-saved': []
}>()

const configStore = useConfigStore()
const dataStore = useDataStore()

const visible = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// API配置表单
const apiForm = reactive({
  apiKey: '',
  secretKey: '',
  testnet: false
})

const testing = ref(false)
const apiStatus = ref<{ type: 'success' | 'error'; message: string } | null>(null)

// 图表配置
const chartConfig = reactive({ ...configStore.chartConfig })

// 刷新配置
const refreshConfig = reactive({ ...configStore.refreshConfig })

const refreshInterval = computed({
  get: () => refreshConfig.refreshInterval / (60 * 1000),
  set: (value: number) => {
    refreshConfig.refreshInterval = value * 60 * 1000
  }
})

const cacheTimeout = computed({
  get: () => refreshConfig.cacheTimeout / (60 * 1000),
  set: (value: number) => {
    refreshConfig.cacheTimeout = value * 60 * 1000
  }
})

// 主题颜色
const themeColors = reactive({ ...configStore.theme })

// 配置导入导出
const showImportDialog = ref(false)
const importConfigText = ref('')

// 监听配置变化
watch(() => configStore.chartConfig, (newConfig) => {
  Object.assign(chartConfig, newConfig)
}, { deep: true })

watch(() => configStore.refreshConfig, (newConfig) => {
  Object.assign(refreshConfig, newConfig)
}, { deep: true })

watch(() => configStore.theme, (newTheme) => {
  Object.assign(themeColors, newTheme)
}, { deep: true })

// 方法
const handleDarkModeChange = (value: boolean) => {
  configStore.updateDocumentTheme()
  configStore.saveToLocalStorage()
}

const handleDemoModeChange = async (value: boolean) => {
  configStore.setDemoMode(value)
  
  // 切换模式后重新加载数据
  try {
    await dataStore.loadAssetData('day', false)
    await dataStore.loadPositions()
    ElMessage.success(value ? '已切换到演示模式' : '已切换到API模式')
  } catch (error: any) {
    ElMessage.error(`切换模式失败: ${error.message}`)
  }
}

const saveApiConfig = async () => {
  if (!apiForm.apiKey || !apiForm.secretKey) {
    ElMessage.error('请填写完整的API配置')
    return
  }

  testing.value = true
  apiStatus.value = null

  try {
    const config = {
      apiKey: apiForm.apiKey,
      secretKey: apiForm.secretKey,
      testnet: apiForm.testnet
    }

    // 先设置API配置
    dataStore.setApiConfig(config)
    
    // 验证API并加载数据
    console.log('🔄 开始验证API配置...')
    await dataStore.loadAssetData('day', false)
    await dataStore.loadPositions()
    console.log('✅ API验证成功，数据加载完成')
    
    // 验证成功后才保存到配置store
    configStore.setBinanceConfig(config)
    // API配置成功后，自动关闭演示模式
    configStore.setDemoMode(false)
    
    apiStatus.value = {
      type: 'success',
      message: 'API配置已保存并验证成功，数据已加载'
    }
    
    ElMessage.success('API配置保存成功，数据已加载')
    
    // 关闭设置面板
    visible.value = false
    
    // 通知父组件刷新页面数据
    emit('config-saved')
  } catch (error: any) {
    // API验证失败，清理API配置
    dataStore.clearApiConfig()
    
    let errorMessage = 'API验证失败'
    
    // 解析币安API错误码
    if (error.response?.data?.code) {
      const errorCode = error.response.data.code
      const errorMsg = error.response.data.msg || error.message
      
      switch (errorCode) {
        case -2015:
          errorMessage = 'API密钥无效或IP地址未授权。请检查：\n1. API密钥是否正确\n2. 是否在币安账户中添加了当前IP到白名单\n3. API权限是否足够（需要期货交易权限）'
          break
        case -1021:
          errorMessage = '请求超时，请检查网络连接'
          break
        case -1022:
          errorMessage = 'API签名验证失败，请检查Secret Key是否正确'
          break
        case -2014:
          errorMessage = 'API密钥格式无效'
          break
        default:
          errorMessage = `API错误 (${errorCode}): ${errorMsg}`
      }
    } else if (error.message) {
      errorMessage = error.message
    }
    
    apiStatus.value = {
      type: 'error',
      message: errorMessage
    }
    ElMessage.error('API配置验证失败')
  } finally {
    testing.value = false
  }
}

const clearApiConfig = () => {
  apiForm.apiKey = ''
  apiForm.secretKey = ''
  apiForm.testnet = false
  apiStatus.value = null
  
  configStore.clearBinanceConfig()
  dataStore.clearApiConfig()
  
  ElMessage.success('API配置已清除')
}

const updateChartConfig = () => {
  configStore.updateChartConfig(chartConfig)
}

const updateRefreshConfig = () => {
  configStore.updateRefreshConfig(refreshConfig)
}

const updateRefreshInterval = () => {
  updateRefreshConfig()
}

const updateCacheTimeout = () => {
  updateRefreshConfig()
}

const updateThemeColors = () => {
  configStore.updateTheme(themeColors)
}

const exportSettings = () => {
  try {
    const configJson = configStore.exportConfig()
    
    // 创建下载链接
    const blob = new Blob([configJson], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `binance-replay-config-${new Date().toISOString().split('T')[0]}.json`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    
    ElMessage.success('配置已导出')
  } catch (error) {
    ElMessage.error('导出配置失败')
  }
}

const importSettings = () => {
  if (!importConfigText.value.trim()) {
    ElMessage.error('请输入配置内容')
    return
  }

  const success = configStore.importConfig(importConfigText.value)
  
  if (success) {
    ElMessage.success('配置导入成功')
    showImportDialog.value = false
    importConfigText.value = ''
  } else {
    ElMessage.error('配置格式无效')
  }
}

const resetSettings = async () => {
  try {
    await ElMessageBox.confirm(
      '确定要重置所有设置吗？此操作不可撤销。',
      '确认重置',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    configStore.resetToDefaults()
    dataStore.clearAllData()
    
    // 重置表单
    clearApiConfig()
    Object.assign(chartConfig, configStore.chartConfig)
    Object.assign(refreshConfig, configStore.refreshConfig)
    Object.assign(themeColors, configStore.theme)
    
    ElMessage.success('设置已重置')
  } catch {
    // 用户取消
  }
}
</script>

<style scoped>
.settings-content {
  padding: 20px 0;
}

.settings-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 0 0 16px 0;
}

.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.setting-item:last-child {
  margin-bottom: 0;
}

.setting-label {
  font-size: 14px;
  color: #606266;
  flex: 1;
  white-space: nowrap;
  min-width: 120px;
  margin-right: 16px;
}

.setting-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.api-info {
  margin-bottom: 16px;
}

.api-info ul {
  margin: 8px 0 0 0;
  padding-left: 16px;
}

.api-info li {
  margin-bottom: 4px;
}

.api-status {
  margin-top: 16px;
}

.color-picker-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.color-picker-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.color-label {
  font-size: 14px;
  color: #606266;
}

.config-actions {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: stretch;
}

.config-actions .el-button {
  width: 100%;
  justify-content: flex-start;
  margin-left: 0 !important;
}

:deep(.el-drawer__header) {
  margin-bottom: 0;
  padding-bottom: 20px;
  border-bottom: 1px solid #f0f2f5;
}

:deep(.el-drawer__body) {
  padding: 0 20px;
}

/* 修复switch文本换行问题 */
:deep(.el-switch__label) {
  white-space: nowrap !important;
  font-size: 12px !important;
}

:deep(.el-switch__label.is-active) {
  color: var(--el-color-primary) !important;
}

/* 去除对话框底部按钮的margin-left */
:deep(.el-dialog__footer .el-button) {
  margin-left: 0 !important;
}
</style>