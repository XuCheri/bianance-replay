<template>
  <div class="position-list">
    <div v-if="loading" class="loading-container">
      <el-skeleton animated>
        <template #template>
          <div v-for="i in 5" :key="i" class="skeleton-item">
            <el-skeleton-item variant="rect" style="width: 100%; height: 60px; margin-bottom: 8px;" />
          </div>
        </template>
      </el-skeleton>
    </div>
    
    <div v-else-if="!positions || positions.length === 0" class="empty-container">
      <el-empty description="暂无持仓记录" />
    </div>
    
    <div v-else class="list-container">
      <div class="list-header">
        <div class="header-cell symbol">合约</div>
        <div class="header-cell side">方向</div>
        <div class="header-cell leverage">杠杆</div>
        <div class="header-cell entry-price">开仓价</div>
        <div class="header-cell exit-price">平仓价</div>
        <div class="header-cell pnl">盈亏</div>
        <div class="header-cell status">状态</div>
        <div class="header-cell time">时间</div>
      </div>
      
      <div class="list-body">
        <div
          v-for="position in paginatedPositions"
          :key="position.id"
          class="position-item"
          :class="{ active: selectedPosition?.id === position.id }"
          @click="selectPosition(position)"
        >
          <div class="cell symbol">
            <span class="symbol-text">{{ position.symbol }}</span>
          </div>
          
          <div class="cell side">
            <span :class="['binance-badge', position.side === 'LONG' ? 'binance-badge-success' : 'binance-badge-danger']">
              {{ position.side === 'LONG' ? '多' : '空' }}
            </span>
          </div>
          
          <div class="cell leverage">
            {{ position.leverage || 1 }}x
          </div>
          
          <div class="cell entry-price">
            {{ (position.entryPrice || 0).toFixed(4) }}
          </div>
          
          <div class="cell exit-price">
            <span v-if="position.exitPrice">
              {{ (position.exitPrice || 0).toFixed(4) }}
            </span>
            <span v-else class="text-muted">-</span>
          </div>
          
          <div class="cell pnl">
            <span 
              v-if="position.pnl !== undefined"
              :class="getPnlClass(position.pnl)"
            >
              {{ position.pnl >= 0 ? '+' : '' }}{{ (position.pnl || 0).toFixed(2) }}
            </span>
            <span v-else class="text-muted">-</span>
          </div>
          
          <div class="cell status">
            <span :class="['binance-badge', position.status === 'OPEN' ? 'binance-badge-warning' : 'binance-badge-secondary']">
              {{ position.status === 'OPEN' ? '持仓中' : '已平仓' }}
            </span>
          </div>
          
          <div class="cell time">
            <div class="time-info">
              <div class="open-time">
                {{ formatTime(position.openTime) }}
              </div>
              <div v-if="position.closeTime" class="close-time">
                {{ formatTime(position.closeTime) }}
              </div>
            </div>
          </div>
          
          <!-- 强平标识 -->
          <div v-if="position.isForceClose" class="force-close-badge">
            <span class="binance-badge binance-badge-danger">强平</span>
          </div>
        </div>
      </div>
      
      <!-- 分页 -->
      <div v-if="showPagination" class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="totalPositions"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import dayjs from 'dayjs'
import type { PositionRecord } from '@/types'

interface Props {
  positions: PositionRecord[]
  loading?: boolean
  showPagination?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  showPagination: true
})

const emit = defineEmits<{
  select: [position: PositionRecord]
}>()

const selectedPosition = ref<PositionRecord | null>(null)
const currentPage = ref(1)
const pageSize = ref(20)

// 计算属性
const totalPositions = computed(() => props.positions.length)

const paginatedPositions = computed(() => {
  if (!props.showPagination) {
    return props.positions
  }
  
  const start = (currentPage.value - 1) * pageSize.value
  const end = start + pageSize.value
  const result = props.positions.slice(start, end)
  
  console.log('📄 分页计算:', {
    总数: props.positions.length,
    当前页: currentPage.value,
    每页数量: pageSize.value,
    开始索引: start,
    结束索引: end,
    分页结果: result.length
  })
  
  return result
})

// 方法
const selectPosition = (position: PositionRecord) => {
  selectedPosition.value = position
  emit('select', position)
}

const getPnlClass = (pnl: number): string => {
  if (pnl > 0) return 'text-success'
  if (pnl < 0) return 'text-danger'
  return ''
}

const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
}

const handleCurrentChange = (val: number) => {
  currentPage.value = val
}

// 监听数据变化，重置到第一页
watch(() => props.positions.length, () => {
  currentPage.value = 1
})
</script>

<style scoped>
.position-list {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.loading-container,
.empty-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
}

.skeleton-item {
  padding: 0 16px;
}

.list-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.list-header {
  display: grid;
  grid-template-columns: 1fr 60px 50px 80px 80px 80px 70px 100px;
  gap: 8px;
  padding: 12px 16px;
  background: var(--binance-bg-tertiary);
  border-bottom: 1px solid var(--binance-border-primary);
  font-weight: 600;
  font-size: 12px;
  color: var(--binance-text-tertiary);
}

.header-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.header-cell.symbol {
  justify-content: flex-start;
}

.list-body {
  flex: 1;
  overflow-y: auto;
}

.position-item {
  display: grid;
  grid-template-columns: 1fr 60px 50px 80px 80px 80px 70px 100px;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--binance-border-primary);
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  background: transparent;
}

.position-item:hover {
  background: var(--binance-bg-tertiary);
}

.position-item.active {
  background: rgba(240, 185, 11, 0.1);
  border-left: 3px solid var(--binance-yellow);
}

.cell {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  text-align: center;
}

.cell.symbol {
  justify-content: flex-start;
}

.symbol-text {
  font-weight: 600;
  color: var(--binance-text-primary);
}

.time-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
}

.open-time {
  color: var(--binance-text-secondary);
}

.close-time {
  color: var(--binance-text-tertiary);
}

.text-success {
  color: var(--binance-green);
  font-weight: 600;
}

.text-danger {
  color: var(--binance-red);
  font-weight: 600;
}

.text-muted {
  color: var(--binance-text-quaternary);
}

.force-close-badge {
  position: absolute;
  top: 4px;
  right: 4px;
}

.pagination-container {
  padding: 16px;
  border-top: 1px solid var(--binance-border-primary);
  background: var(--binance-bg-secondary);
}

/* 响应式设计 */
@media (max-width: 1200px) {
  .list-header,
  .position-item {
    grid-template-columns: 1fr 60px 50px 70px 70px 70px 100px;
  }
  
  .header-cell.leverage,
  .cell.leverage {
    display: none;
  }
}

@media (max-width: 768px) {
  .list-header {
    display: none;
  }
  
  .position-item {
    display: block;
    padding: 16px;
  }
  
  .cell {
    justify-content: space-between;
    margin-bottom: 8px;
    font-size: 14px;
  }
  
  .cell::before {
    content: attr(data-label);
    font-weight: 600;
    color: #909399;
    font-size: 12px;
  }
  
  .cell.symbol::before {
    content: '合约: ';
  }
  
  .cell.side::before {
    content: '方向: ';
  }
  
  .cell.leverage::before {
    content: '杠杆: ';
  }
  
  .cell.entry-price::before {
    content: '开仓价: ';
  }
  
  .cell.exit-price::before {
    content: '平仓价: ';
  }
  
  .cell.pnl::before {
    content: '盈亏: ';
  }
  
  .cell.status::before {
    content: '状态: ';
  }
  
  .cell.time::before {
    content: '时间: ';
  }
}
</style>