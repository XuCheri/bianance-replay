import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { BinanceConfig } from '@/services/binance'

export const useConfigStore = defineStore('config', () => {
  // 状态
  const isDarkMode = ref(true) // 默认启用深色模式
  const language = ref('zh-CN')
  const binanceConfig = ref<BinanceConfig | null>(null)
  const demoMode = ref(true) // 演示模式，使用模拟数据

  // 币安风格主题配置
  const theme = ref({
    primaryColor: '#F0B90B', // 币安黄
    successColor: '#0ECB81', // 币安绿
    warningColor: '#FF8A00',  // 币安橙
    dangerColor: '#F6465D',   // 币安红
    infoColor: '#848E9C'      // 币安灰
  })

  // 图表配置
  const chartConfig = ref({
    animationDuration: 1000,
    tooltipEnabled: true,
    dataZoomEnabled: true,
    toolboxEnabled: true
  })

  // 数据刷新配置
  const refreshConfig = ref({
    autoRefresh: false,
    refreshInterval: 5 * 60 * 1000, // 5分钟
    cacheTimeout: 5 * 60 * 1000 // 5分钟缓存
  })

  // 计算属性
  const isApiConfigured = computed(() => 
    !demoMode.value && binanceConfig.value?.apiKey && binanceConfig.value?.secretKey
  )

  const currentTheme = computed(() => ({
    ...theme.value,
    mode: isDarkMode.value ? 'dark' : 'light'
  }))

  // 方法
  const toggleDarkMode = () => {
    isDarkMode.value = !isDarkMode.value
    updateDocumentTheme()
    saveToLocalStorage()
  }

  const setLanguage = (lang: string) => {
    language.value = lang
    saveToLocalStorage()
  }

  const setBinanceConfig = (config: BinanceConfig) => {
    binanceConfig.value = config
    // 不保存到localStorage以确保安全
    console.log('币安API配置已设置')
  }

  const clearBinanceConfig = () => {
    binanceConfig.value = null
    console.log('币安API配置已清除')
  }

  const setDemoMode = (enabled: boolean) => {
    demoMode.value = enabled
    if (enabled) {
      clearBinanceConfig()
    }
    saveToLocalStorage()
  }

  const updateTheme = (newTheme: Partial<typeof theme.value>) => {
    theme.value = { ...theme.value, ...newTheme }
    updateDocumentTheme()
    saveToLocalStorage()
  }

  const updateChartConfig = (newConfig: Partial<typeof chartConfig.value>) => {
    chartConfig.value = { ...chartConfig.value, ...newConfig }
    saveToLocalStorage()
  }

  const updateRefreshConfig = (newConfig: Partial<typeof refreshConfig.value>) => {
    refreshConfig.value = { ...refreshConfig.value, ...newConfig }
    saveToLocalStorage()
  }

  const updateDocumentTheme = () => {
    const root = document.documentElement
    if (isDarkMode.value) {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
    
    // 更新CSS变量
    root.style.setProperty('--el-color-primary', theme.value.primaryColor)
    root.style.setProperty('--el-color-success', theme.value.successColor)
    root.style.setProperty('--el-color-warning', theme.value.warningColor)
    root.style.setProperty('--el-color-danger', theme.value.dangerColor)
    root.style.setProperty('--el-color-info', theme.value.infoColor)
  }

  const saveToLocalStorage = () => {
    const configData = {
      isDarkMode: isDarkMode.value,
      language: language.value,
      demoMode: demoMode.value,
      theme: theme.value,
      chartConfig: chartConfig.value,
      refreshConfig: refreshConfig.value
    }
    
    try {
      localStorage.setItem('binance-replay-config', JSON.stringify(configData))
    } catch (error) {
      console.warn('保存配置到本地存储失败:', error)
    }
  }

  const loadFromLocalStorage = () => {
    try {
      const saved = localStorage.getItem('binance-replay-config')
      if (saved) {
        const configData = JSON.parse(saved)
        
        isDarkMode.value = configData.isDarkMode ?? true
        language.value = configData.language ?? 'zh-CN'
        demoMode.value = configData.demoMode ?? true
        
        if (configData.theme) {
          theme.value = { ...theme.value, ...configData.theme }
        }
        
        if (configData.chartConfig) {
          chartConfig.value = { ...chartConfig.value, ...configData.chartConfig }
        }
        
        if (configData.refreshConfig) {
          refreshConfig.value = { ...refreshConfig.value, ...configData.refreshConfig }
        }
        
        updateDocumentTheme()
      }
    } catch (error) {
      console.warn('从本地存储加载配置失败:', error)
    }
  }

  const resetToDefaults = () => {
    isDarkMode.value = true
    language.value = 'zh-CN'
    demoMode.value = true
    theme.value = {
      primaryColor: '#F0B90B', // 币安黄
      successColor: '#0ECB81', // 币安绿
      warningColor: '#FF8A00',  // 币安橙
      dangerColor: '#F6465D',   // 币安红
      infoColor: '#848E9C'      // 币安灰
    }
    chartConfig.value = {
      animationDuration: 1000,
      tooltipEnabled: true,
      dataZoomEnabled: true,
      toolboxEnabled: true
    }
    refreshConfig.value = {
      autoRefresh: false,
      refreshInterval: 5 * 60 * 1000,
      cacheTimeout: 5 * 60 * 1000
    }
    
    clearBinanceConfig()
    updateDocumentTheme()
    saveToLocalStorage()
  }

  const exportConfig = () => {
    const exportData = {
      isDarkMode: isDarkMode.value,
      language: language.value,
      theme: theme.value,
      chartConfig: chartConfig.value,
      refreshConfig: refreshConfig.value
      // 注意：不导出API配置以确保安全
    }
    
    return JSON.stringify(exportData, null, 2)
  }

  const importConfig = (configJson: string) => {
    try {
      const configData = JSON.parse(configJson)
      
      if (configData.isDarkMode !== undefined) {
        isDarkMode.value = configData.isDarkMode
      }
      
      if (configData.language) {
        language.value = configData.language
      }
      
      if (configData.theme) {
        theme.value = { ...theme.value, ...configData.theme }
      }
      
      if (configData.chartConfig) {
        chartConfig.value = { ...chartConfig.value, ...configData.chartConfig }
      }
      
      if (configData.refreshConfig) {
        refreshConfig.value = { ...refreshConfig.value, ...configData.refreshConfig }
      }
      
      updateDocumentTheme()
      saveToLocalStorage()
      
      return true
    } catch (error) {
      console.error('导入配置失败:', error)
      return false
    }
  }

  // 初始化
  loadFromLocalStorage()

  return {
    // 状态
    isDarkMode,
    language,
    binanceConfig,
    demoMode,
    theme,
    chartConfig,
    refreshConfig,
    
    // 计算属性
    isApiConfigured,
    currentTheme,
    
    // 方法
    toggleDarkMode,
    setLanguage,
    setBinanceConfig,
    clearBinanceConfig,
    setDemoMode,
    updateTheme,
    updateChartConfig,
    updateRefreshConfig,
    updateDocumentTheme,
    saveToLocalStorage,
    loadFromLocalStorage,
    resetToDefaults,
    exportConfig,
    importConfig
  }
})