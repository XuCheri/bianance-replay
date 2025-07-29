<template>
  <div class="binance-home">
    <!-- 币安风格顶部导航栏 -->
    <header class="binance-header">
      <div class="header-container">
        <div class="header-left">
          <div class="logo-section">
            <h1 class="brand-title">
              <span class="brand-icon">₿</span>
              币安合约复盘
            </h1>
            <div class="version-badge">v1.0</div>
          </div>
        </div>
        
        <div class="header-right">
          <div class="header-controls">
            <TimeSelector @change="handleTimeChange" class="time-selector" />
            <button 
              class="binance-btn binance-btn-primary header-btn"
              @click="refreshData" 
              :disabled="loading"
            >
              <el-icon class="btn-icon">
                <RefreshIcon :class="{ 'rotating': loading }" />
              </el-icon>
              <span>{{ loading ? '刷新中...' : '刷新数据' }}</span>
            </button>
            <button 
              class="binance-btn binance-btn-ghost header-btn"
              @click="showSettings = true"
            >
              <el-icon class="btn-icon">
                <SettingIcon />
              </el-icon>
              <span>设置</span>
            </button>
          </div>
        </div>
      </div>
    </header>

    <!-- 币安风格主要内容区域 -->
    <main class="binance-main">
      <!-- 资产概览和趋势图 -->
      <section class="chart-section">
        <div class="binance-card chart-card">
          <div class="card-header">
            <div class="header-left">
              <h2 class="card-title">资产变化趋势</h2>
              <div class="asset-summary">
                <div class="summary-item">
                  <span class="summary-label">总资产</span>
                  <span class="summary-value text-primary">{{ formatCurrency(totalBalance) }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">已实现盈亏</span>
                  <span :class="['summary-value', totalPnl.realized >= 0 ? 'text-success' : 'text-danger']">
                    {{ formatPnl(totalPnl.realized) }}
                  </span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">未实现盈亏</span>
                  <span :class="['summary-value', totalPnl.unrealized >= 0 ? 'text-success' : 'text-danger']">
                    {{ formatPnl(totalPnl.unrealized) }}
                  </span>
                </div>
              </div>
            </div>
            
            <div class="header-right">
              <div class="dimension-tabs">
                <button
                  v-for="dimension in timeDimensions"
                  :key="dimension.value"
                  :class="[
                    'dimension-tab',
                    { 'active': currentDimension === dimension.value }
                  ]"
                  @click="setTimeDimension(dimension.value)"
                >
                  {{ dimension.label }}
                </button>
              </div>
            </div>
          </div>
          
          <div class="card-content">
            <AssetTrendChart 
              :key="chartKey"
              :data="assetData" 
              :dimension="currentDimension"
              :loading="loading"
            />
          </div>
        </div>
      </section>

      <!-- 交易数据区域 -->
      <section class="trading-section">
        <div class="section-grid">
          <!-- 持仓记录 -->
          <div class="positions-panel">
            <div class="binance-card positions-card">
              <div class="card-header">
                <div class="header-left">
                  <h2 class="card-title">持仓记录</h2>
                  <div class="position-stats">
                    <span class="stat-item">
                      <span class="stat-label">持仓中</span>
                      <span class="stat-value text-warning">{{ openPositionsCount }}</span>
                    </span>
                    <span class="stat-divider">|</span>
                    <span class="stat-item">
                      <span class="stat-label">已平仓</span>
                      <span class="stat-value text-secondary">{{ closedPositionsCount }}</span>
                    </span>
                  </div>
                </div>
                
                <div class="header-right">
                  <div class="filter-controls">
                    <div class="search-box">
                      <el-input
                        v-model="searchText"
                        placeholder="搜索合约"
                        clearable
                        class="search-input"
                      >
                        <template #prefix>
                          <el-icon><SearchIcon /></el-icon>
                        </template>
                      </el-input>
                    </div>
                    
                    <div class="filter-selects">
                      <el-select v-model="filterSide" placeholder="方向" class="filter-select">
                        <el-option label="全部" value="" />
                        <el-option label="多单" value="LONG" />
                        <el-option label="空单" value="SHORT" />
                      </el-select>
                      
                      <el-select v-model="filterStatus" placeholder="状态" class="filter-select">
                        <el-option label="全部" value="" />
                        <el-option label="持仓中" value="OPEN" />
                        <el-option label="已平仓" value="CLOSED" />
                      </el-select>
                    </div>
                  </div>
                </div>
              </div>
              
              <div class="card-content positions-content">
                <PositionList
                  :positions="filteredPositions"
                  :loading="loading"
                  @select="handlePositionSelect"
                />
              </div>
            </div>
          </div>

          <!-- 仓位详情 -->
          <div class="detail-panel" v-if="selectedPosition">
            <div class="binance-card detail-card">
              <div class="card-header">
                <div class="header-left">
                  <h2 class="card-title">仓位详情</h2>
                </div>
                <div class="header-right">
                  <button class="close-btn" @click="closeDetail">
                    <el-icon><Close /></el-icon>
                  </button>
                </div>
              </div>
              
              <div class="card-content detail-content">
                <PositionDetail :position="selectedPosition" />
              </div>
            </div>  
          </div>
        </div>
      </section>
    </main>

    <!-- 设置面板 -->
    <SettingsPanel v-model="showSettings" @config-saved="handleConfigSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { Refresh, Search, Close, Setting } from '@element-plus/icons-vue'
import TimeSelector from '@/components/TimeSelector.vue'
import AssetTrendChart from '@/components/AssetTrendChart.vue'
import PositionList from '@/components/PositionList.vue'
import PositionDetail from '@/components/PositionDetail.vue'
import SettingsPanel from '@/components/SettingsPanel.vue'
import { useDataStore } from '@/stores/data'
import { useConfigStore } from '@/stores/config'
import type { TimeDimension, PositionRecord } from '@/types'

const RefreshIcon = Refresh
const SearchIcon = Search
const SettingIcon = Setting

// 状态管理
const dataStore = useDataStore()
const configStore = useConfigStore()
const loading = computed(() => dataStore.loading)
const currentDimension = ref<TimeDimension>('day')
const selectedPosition = ref<PositionRecord | null>(null)
const showSettings = ref(false)
const chartKey = ref(0)

// 筛选条件
const searchText = ref('')
const filterSide = ref('')
const filterStatus = ref('')

// 自动刷新
let refreshTimer: number | null = null

// 时间维度选项
const timeDimensions = [
  { label: '日', value: 'day' as TimeDimension },
  { label: '月', value: 'month' as TimeDimension },
  { label: '年', value: 'year' as TimeDimension }
]

// 计算属性
const assetData = computed(() => dataStore.assetData)
const totalBalance = computed(() => dataStore.totalBalance)
const totalPnl = computed(() => dataStore.totalPnl)
const openPositionsCount = computed(() => dataStore.openPositionsCount)
const closedPositionsCount = computed(() => dataStore.closedPositionsCount)

const filteredPositions = computed(() => {
  let positions = dataStore.positions
  
  if (searchText.value) {
    positions = positions.filter(p => 
      p.symbol.toLowerCase().includes(searchText.value.toLowerCase())
    )
  }
  
  if (filterSide.value) {
    positions = positions.filter(p => p.side === filterSide.value)
  }
  
  if (filterStatus.value) {
    positions = positions.filter(p => p.status === filterStatus.value)
  }
  
  return positions
})

// 方法
const handleTimeChange = (timeRange: { start: Date; end: Date }) => {
  console.log('时间范围变化:', timeRange)
  loadData()
}

const setTimeDimension = (dimension: TimeDimension) => {
  currentDimension.value = dimension
  loadData()
}

const refreshData = () => {
  loadData()
}

const handlePositionSelect = (position: PositionRecord) => {
  selectedPosition.value = position
}

const closeDetail = () => {
  selectedPosition.value = null
}

const handleConfigSaved = async () => {
  console.log('🔄 配置已保存，重新加载数据...')
  await loadData()
  
  // 强制刷新页面数据显示
  chartKey.value++
  await nextTick()
  console.log('🔄 数据加载完成，当前assetData长度:', assetData.value.length)
}

const loadData = async () => {
  try {
    console.log('🔍 Home loadData - 当前状态:', {
      demoMode: configStore.demoMode,
      hasConfig: !!configStore.binanceConfig,
      dimension: currentDimension.value
    })
    
    // 根据模式决定数据源
    if (configStore.demoMode) {
      // 演示模式：清除API配置，使用模拟数据
      console.log('🔄 演示模式，清除API配置')
      dataStore.clearApiConfig()
    } else if (configStore.binanceConfig) {
      // API模式且有配置：使用真实API
      console.log('🔄 API模式，设置API配置')
      dataStore.setApiConfig(configStore.binanceConfig)
    } else {
      console.log('⚠️ 没有API配置，将使用模拟数据')
    }
    
    // 强制不使用缓存来加载最新数据
    await dataStore.loadAssetData(currentDimension.value, false)
    await dataStore.loadPositions(false)
    
    // 更新图表key强制重新渲染
    chartKey.value++
  } catch (error) {
    console.error('加载数据失败:', error)
  }
}

const startAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
  }
  
  if (configStore.refreshConfig.autoRefresh) {
    refreshTimer = window.setInterval(() => {
      loadData()
    }, configStore.refreshConfig.refreshInterval)
  }
}

const stopAutoRefresh = () => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
}

// 生命周期
onMounted(() => {
  loadData()
  startAutoRefresh()
})

onUnmounted(() => {
  stopAutoRefresh()
})

// 格式化函数
const formatCurrency = (value: number | undefined | null): string => {
  if (!value || value === 0) return '0.00 USDT'
  if (Math.abs(value) >= 1000000) {
    return (value / 1000000).toFixed(2) + 'M USDT'
  }
  if (Math.abs(value) >= 1000) {
    return (value / 1000).toFixed(2) + 'K USDT'
  }
  return value.toFixed(2) + ' USDT'
}

const formatPnl = (value: number | undefined | null): string => {
  if (!value || value === 0) return '0.00'
  const prefix = value >= 0 ? '+' : ''
  if (Math.abs(value) >= 1000000) {
    return prefix + (value / 1000000).toFixed(2) + 'M'
  }
  if (Math.abs(value) >= 1000) {
    return prefix + (value / 1000).toFixed(2) + 'K'
  }
  return prefix + value.toFixed(2)
}
</script>

<style scoped>
/* 币安风格主页样式 */
.binance-home {
  min-height: 100vh;
  background: var(--binance-bg-primary);
  display: flex;
  flex-direction: column;
}

/* 顶部导航栏 */
.binance-header {
  background: var(--binance-bg-secondary);
  border-bottom: 1px solid var(--binance-border-primary);
  position: sticky;
  top: 0;
  z-index: 100;
  backdrop-filter: blur(12px);
}

.header-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 72px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.brand-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 24px;
  font-weight: 700;
  color: var(--binance-text-primary);
  margin: 0;
}

.brand-icon {
  font-size: 28px;
  color: var(--binance-yellow);
  font-weight: bold;
}

.version-badge {
  background: var(--binance-bg-tertiary);
  color: var(--binance-text-tertiary);
  padding: 2px 8px;
  border-radius: var(--binance-radius-sm);
  font-size: 11px;
  font-weight: 500;
}

.header-right {
  display: flex;
  align-items: center;
}

.header-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.header-btn {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
  font-weight: 500;
}

.btn-icon {
  font-size: 16px;
}

.rotating {
  animation: rotate 1s linear infinite;
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

/* 主要内容区域 */
.binance-main {
  flex: 1;
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* 图表区域 */
.chart-section {
  width: 100%;
}

.chart-card {
  min-height: 500px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 24px 24px 16px;
  border-bottom: 1px solid var(--binance-border-primary);
}

.header-left {
  flex: 1;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.card-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--binance-text-primary);
  margin: 0 0 12px 0;
}

.asset-summary {
  display: flex;
  gap: 32px;
  margin-top: 8px;
}

.summary-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.summary-label {
  font-size: 12px;
  color: var(--binance-text-tertiary);
  font-weight: 500;
}

.summary-value {
  font-size: 16px;
  font-weight: 600;
}

.dimension-tabs {
  display: flex;
  background: var(--binance-bg-tertiary);
  border-radius: var(--binance-radius-md);
  padding: 2px;
}

.dimension-tab {
  padding: 6px 16px;
  background: transparent;
  border: none;
  color: var(--binance-text-secondary);
  font-size: 13px;
  font-weight: 500;
  border-radius: var(--binance-radius-sm);
  cursor: pointer;
  transition: all 0.2s ease;
}

.dimension-tab:hover {
  color: var(--binance-text-primary);
}

.dimension-tab.active {
  background: var(--binance-yellow);
  color: var(--binance-bg-primary);
}

.card-content {
  padding: 24px;
  min-height: 400px;
}

/* 交易数据区域 */
.trading-section {
  flex: 1;
}

.section-grid {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 24px;
  min-height: 600px;
}

.positions-panel {
  min-height: 0;
}

.positions-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.position-stats {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 8px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--binance-text-tertiary);
}

.stat-value {
  font-size: 14px;
  font-weight: 600;
}

.stat-divider {
  color: var(--binance-border-secondary);
  font-size: 12px;
}

.filter-controls {
  display: flex;
  align-items: center;
  gap: 12px;
}

.search-box {
  width: 200px;
}

.search-input {
  border-radius: var(--binance-radius-md);
}

.filter-selects {
  display: flex;
  gap: 8px;
}

.filter-select {
  width: 100px;
}

.positions-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

/* 仓位详情面板 */
.detail-panel {
  min-height: 0;
}

.detail-card {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.detail-content {
  flex: 1;
  padding: 0;
  overflow: hidden;
}

.close-btn {
  background: transparent;
  border: none;
  color: var(--binance-text-tertiary);
  cursor: pointer;
  padding: 4px;
  border-radius: var(--binance-radius-sm);
  transition: all 0.2s ease;
}

.close-btn:hover {
  color: var(--binance-text-primary);
  background: var(--binance-bg-tertiary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .section-grid {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
  
  .detail-panel {
    max-height: 500px;
  }
  
  .asset-summary {
    gap: 24px;
  }
}

@media (max-width: 768px) {
  .header-container {
    padding: 0 16px;
    height: 64px;
    flex-direction: column;
    gap: 12px;
    padding-top: 12px;
    padding-bottom: 12px;
    height: auto;
  }
  
  .brand-title {
    font-size: 20px;
  }
  
  .brand-icon {
    font-size: 24px;
  }
  
  .header-controls {
    flex-direction: column;
    gap: 12px;
    width: 100%;
  }
  
  .time-selector {
    width: 100%;
  }
  
  .binance-main {
    padding: 16px;
    gap: 16px;
  }
  
  .card-header {
    padding: 16px 16px 12px;
    flex-direction: column;
    align-items: stretch;
    gap: 16px;
  }
  
  .asset-summary {
    gap: 16px;
    flex-wrap: wrap;
  }
  
  .summary-item {
    min-width: 0;
    flex: 1;
  }
  
  .dimension-tabs {
    align-self: flex-start;
  }
  
  .card-content {
    padding: 16px;
  }
  
  .filter-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }
  
  .search-box {
    width: 100%;
  }
  
  .filter-selects {
    gap: 8px;
  }
  
  .filter-select {
    flex: 1;
  }
  
  .position-stats {
    justify-content: center;
  }
}

@media (max-width: 480px) {
  .header-container {
    padding: 0 12px;
  }
  
  .binance-main {
    padding: 12px;
  }
  
  .card-header {
    padding: 12px 12px 8px;
  }
  
  .card-content {
    padding: 12px;
  }
  
  .asset-summary {
    flex-direction: column;
    gap: 12px;
  }
  
  .header-btn {
    height: 36px;
    font-size: 13px;
  }
}

</style>