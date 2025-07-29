<template>
  <div class="position-detail">
    <div class="detail-header">
      <div class="position-info">
        <div class="symbol-info">
          <h3 class="symbol">{{ position.symbol }}</h3>
          <el-tag :type="position.side === 'LONG' ? 'success' : 'danger'" class="side-tag">
            {{ position.side === 'LONG' ? '多单' : '空单' }}
          </el-tag>
          <span class="leverage">{{ position.leverage }}x</span>
        </div>
        
        <div class="pnl-info">
          <div class="pnl-amount" :class="getPnlClass(position.pnl || 0)">
            {{ position.pnl !== undefined ? (position.pnl >= 0 ? '+' : '') + position.pnl.toFixed(2) : '-' }} USDT
          </div>
          <div class="pnl-label">总盈亏</div>
        </div>
      </div>
      
      <!-- 强平标识 -->
      <div v-if="position.isForceClose" class="force-close-warning">
        <el-alert
          title="此仓位已被强制平仓"
          type="error"
          :closable="false"
          show-icon
        />
      </div>
    </div>

    <div class="detail-content">
      <!-- 基础信息 -->
      <div class="info-section">
        <h4 class="section-title">基础信息</h4>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">开仓时间</span>
            <span class="value">{{ formatDateTime(position.openTime) }}</span>
          </div>
          <div class="info-item">
            <span class="label">开仓价格</span>
            <span class="value">{{ position.entryPrice?.toFixed(4) || '0.0000' }} USDT</span>
          </div>
          <div class="info-item">
            <span class="label">持仓数量</span>
            <span class="value">{{ (position.quantity || position.size || 0).toFixed(4) }}</span>
          </div>
          <div class="info-item" v-if="position.closeTime">
            <span class="label">平仓时间</span>
            <span class="value">{{ formatDateTime(position.closeTime) }}</span>
          </div>
          <div class="info-item" v-if="position.exitPrice">
            <span class="label">平仓价格</span>
            <span class="value">{{ position.exitPrice?.toFixed(4) || '0.0000' }} USDT</span>
          </div>
          <div class="info-item">
            <span class="label">手续费</span>
            <span class="value">{{ (position.fee || 0).toFixed(4) }} USDT</span>
          </div>
        </div>
      </div>

      <!-- 盈亏图表 -->
      <div v-if="pnlChartData.length > 0" class="chart-section">
        <h4 class="section-title">盈亏变化</h4>
        <div class="chart-container">
          <v-chart 
            :option="pnlChartOption" 
            autoresize
            class="pnl-chart"
          />
        </div>
      </div>

      <!-- 交易明细 -->
      <div v-if="trades.length > 0" class="trades-section">
        <h4 class="section-title">交易明细</h4>
        <div class="trades-table">
          <div class="table-header">
            <div class="header-cell">时间</div>
            <div class="header-cell">方向</div>
            <div class="header-cell">价格</div>
            <div class="header-cell">数量</div>
            <div class="header-cell">手续费</div>
            <div class="header-cell">类型</div>
          </div>
          <div class="table-body">
            <div v-for="trade in trades" :key="trade.id" class="trade-row">
              <div class="cell">{{ formatTime(trade.timestamp) }}</div>
              <div class="cell">
                <el-tag :type="trade.side === 'BUY' ? 'success' : 'danger'" size="small">
                  {{ trade.side === 'BUY' ? '买入' : '卖出' }}
                </el-tag>
              </div>
              <div class="cell">{{ (trade.price || 0).toFixed(4) }}</div>
              <div class="cell">{{ (trade.quantity || 0).toFixed(4) }}</div>
              <div class="cell">{{ (trade.fee || 0).toFixed(4) }}</div>
              <div class="cell">
                <el-tag :type="trade.isMaker ? 'info' : 'warning'" size="small">
                  {{ trade.isMaker ? 'Maker' : 'Taker' }}
                </el-tag>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 风险管理 -->
      <div class="risk-section">
        <h4 class="section-title">风险管理</h4>
        <div class="risk-info">
          <div v-if="position.stopLoss" class="risk-item">
            <span class="label">止损价格</span>
            <span class="value danger">{{ (position.stopLoss || 0).toFixed(4) }} USDT</span>
          </div>
          <div v-if="position.takeProfit" class="risk-item">
            <span class="label">止盈价格</span>
            <span class="value success">{{ (position.takeProfit || 0).toFixed(4) }} USDT</span>
          </div>
          <div class="risk-item">
            <span class="label">持仓时长</span>
            <span class="value">{{ getPositionDuration() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TooltipComponent,
  GridComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import duration from 'dayjs/plugin/duration'
import type { PositionDetail, TradeRecord, PnlHistoryPoint } from '@/types'

// 扩展dayjs
dayjs.extend(duration)

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TooltipComponent,
  GridComponent
])

interface Props {
  position: PositionDetail
}

const props = defineProps<Props>()

// 计算属性
const trades = computed((): TradeRecord[] => props.position.trades || [])

const pnlChartData = computed((): PnlHistoryPoint[] => props.position.pnlHistory || [])

// 盈亏图表配置
const pnlChartOption = computed(() => {
  if (pnlChartData.value.length === 0) {
    return {}
  }

  const xAxisData = pnlChartData.value.map(item => 
    dayjs(item.timestamp).format('MM-DD HH:mm')
  )
  const pnlData = pnlChartData.value.map(item => item.pnl)
  const priceData = pnlChartData.value.map(item => item.price)

  return {
    tooltip: {
      trigger: 'axis',
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        
        const dataIndex = params[0].dataIndex
        const point = pnlChartData.value[dataIndex]
        const time = dayjs(point.timestamp).format('YYYY-MM-DD HH:mm:ss')
        
        return `
          <div style="margin-bottom: 8px; font-weight: bold;">${time}</div>
          <div style="display: flex; align-items: center; margin-bottom: 4px;">
            <span style="display: inline-block; width: 10px; height: 10px; background-color: ${params[0].color}; border-radius: 50%; margin-right: 8px;"></span>
            <span style="margin-right: 8px;">盈亏:</span>
            <span style="font-weight: bold; color: ${point.pnl >= 0 ? '#67C23A' : '#F56C6C'};">${point.pnl >= 0 ? '+' : ''}${point.pnl.toFixed(2)} USDT</span>
          </div>
          <div style="margin-bottom: 4px;">
            <span style="margin-right: 8px;">价格:</span>
            <span>${point.price.toFixed(4)} USDT</span>
          </div>
        `
      }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '10%',
      top: '10%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisLabel: {
        color: '#606266',
        fontSize: 11
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#606266',
        formatter: (value: number) => value.toFixed(2)
      }
    },
    series: [
      {
        type: 'line',
        data: pnlData,
        smooth: true,
        lineStyle: {
          width: 2,
          color: '#409EFF'
        },
        itemStyle: {
          color: '#409EFF'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(64, 158, 255, 0.3)' },
              { offset: 1, color: 'rgba(64, 158, 255, 0.05)' }
            ]
          }
        }
      }
    ]
  }
})

// 方法
const getPnlClass = (pnl: number): string => {
  if (pnl > 0) return 'success'
  if (pnl < 0) return 'danger'
  return ''
}

const formatDateTime = (timestamp: number): string => {
  return dayjs(timestamp).format('YYYY-MM-DD HH:mm:ss')
}

const formatTime = (timestamp: number): string => {
  return dayjs(timestamp).format('MM-DD HH:mm')
}

const getPositionDuration = (): string => {
  const start = dayjs(props.position.openTime)
  const end = props.position.closeTime ? dayjs(props.position.closeTime) : dayjs()
  const diff = end.diff(start)
  const dur = dayjs.duration(diff)
  
  const days = dur.days()
  const hours = dur.hours()
  const minutes = dur.minutes()
  
  if (days > 0) {
    return `${days}天 ${hours}小时 ${minutes}分钟`
  } else if (hours > 0) {
    return `${hours}小时 ${minutes}分钟`
  } else {
    return `${minutes}分钟`
  }
}
</script>

<style scoped>
.position-detail {
  height: 100%;
  overflow-y: auto;
}

.detail-header {
  padding: 20px;
  border-bottom: 1px solid #f0f2f5;
}

.position-info {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.symbol-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.symbol {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.side-tag {
  font-weight: 600;
}

.leverage {
  background-color: #f4f4f5;
  color: #909399;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 600;
}

.pnl-info {
  text-align: right;
}

.pnl-amount {
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 4px;
}

.pnl-amount.success {
  color: #67c23a;
}

.pnl-amount.danger {
  color: #f56c6c;
}

.pnl-label {
  font-size: 12px;
  color: #909399;
}

.force-close-warning {
  margin-top: 16px;
}

.detail-content {
  padding: 0 20px 20px;
}

.section-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
  margin: 24px 0 16px;
  padding-bottom: 8px;
  border-bottom: 2px solid #f0f2f5;
}

.info-section .section-title:first-of-type {
  margin-top: 0;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafc;
  border-radius: 6px;
}

.info-item .label {
  color: #606266;
  font-size: 13px;
}

.info-item .value {
  font-weight: 600;
  color: #303133;
  font-size: 13px;
}

.chart-section {
  margin-top: 24px;
}

.chart-container {
  height: 250px;
  background-color: #fff;
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  padding: 16px;
}

.pnl-chart {
  width: 100%;
  height: 100%;
}

.trades-section {
  margin-top: 24px;
}

.trades-table {
  border: 1px solid #f0f2f5;
  border-radius: 6px;
  overflow: hidden;
}

.table-header {
  display: grid;
  grid-template-columns: 100px 60px 80px 80px 70px 60px;
  background-color: #f5f7fa;
  border-bottom: 1px solid #f0f2f5;
}

.header-cell {
  padding: 12px 8px;
  font-size: 12px;
  font-weight: 600;
  color: #909399;
  text-align: center;
}

.table-body {
  max-height: 200px;
  overflow-y: auto;
}

.trade-row {
  display: grid;
  grid-template-columns: 100px 60px 80px 80px 70px 60px;
  border-bottom: 1px solid #f9fafc;
}

.trade-row:last-child {
  border-bottom: none;
}

.cell {
  padding: 8px;
  font-size: 12px;
  color: #606266;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
}

.risk-section {
  margin-top: 24px;
}

.risk-info {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.risk-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background-color: #f9fafc;
  border-radius: 6px;
}

.risk-item .label {
  color: #606266;
  font-size: 13px;
}

.risk-item .value {
  font-weight: 600;
  font-size: 13px;
}

.risk-item .value.success {
  color: #67c23a;
}

.risk-item .value.danger {
  color: #f56c6c;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .position-info {
    flex-direction: column;
    gap: 16px;
  }
  
  .pnl-info {
    text-align: left;
  }
  
  .info-grid {
    grid-template-columns: 1fr;
  }
  
  .risk-info {
    grid-template-columns: 1fr;
  }
  
  .table-header,
  .trade-row {
    grid-template-columns: 1fr;
  }
  
  .header-cell,
  .cell {
    justify-content: space-between;
    text-align: left;
  }
  
  .cell::before {
    content: attr(data-label);
    font-weight: 600;
  }
}
</style>