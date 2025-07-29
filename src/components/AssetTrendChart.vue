<template>
  <div class="asset-trend-chart">
    <div v-if="loading" class="loading-container">
      <el-skeleton animated>
        <template #template>
          <div class="chart-skeleton">
            <el-skeleton-item variant="rect" style="width: 100%; height: 300px;" />
          </div>
        </template>
      </el-skeleton>
    </div>
    
    <div v-else-if="!data || data.length === 0" class="empty-container">
      <el-empty description="暂无数据" />
    </div>
    
    <div v-else class="chart-container">
      <v-chart 
        ref="chartRef"
        :option="chartOption" 
        :loading="loading"
        autoresize
        class="chart"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick } from 'vue'
import { use } from 'echarts/core'
import { CanvasRenderer } from 'echarts/renderers'
import { LineChart } from 'echarts/charts'
import {
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
} from 'echarts/components'
import VChart from 'vue-echarts'
import dayjs from 'dayjs'
import type { AssetData, TimeDimension } from '@/types'

// 注册 ECharts 组件
use([
  CanvasRenderer,
  LineChart,
  TitleComponent,
  TooltipComponent,
  LegendComponent,
  GridComponent,
  DataZoomComponent,
  ToolboxComponent
])

interface Props {
  data: AssetData[]
  dimension: TimeDimension
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})

const chartRef = ref()

// 格式化时间显示
const formatTime = (timestamp: number): string => {
  const date = dayjs(timestamp)
  switch (props.dimension) {
    case 'day':
      return date.format('HH:mm')
    case 'month':
      return date.format('MM-DD')
    case 'year':
      return date.format('YYYY-MM')
    default:
      return date.format('MM-DD HH:mm')
  }
}

// 格式化金额显示
const formatAmount = (value: number): string => {
  if (Math.abs(value) >= 10000) {
    return (value / 10000).toFixed(2) + 'W'
  }
  return value.toFixed(2)
}

// 币安风格图表配置
const chartOption = computed(() => {
  if (!props.data || props.data.length === 0) {
    return {}
  }

  const xAxisData = props.data.map(item => formatTime(item.timestamp))
  const balanceData = props.data.map(item => item.balance)
  const realizedPnlData = props.data.map(item => item.realizedPnl)
  const unrealizedPnlData = props.data.map(item => item.unrealizedPnl)

  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'axis',
      backgroundColor: '#2B3139',
      borderColor: '#474D57',
      borderWidth: 1,
      textStyle: {
        color: '#FDFEFE',
        fontSize: 12
      },
      axisPointer: {
        type: 'cross',
        crossStyle: {
          color: '#F0B90B'
        },
        label: {
          backgroundColor: '#2B3139',
          color: '#FDFEFE',
          borderColor: '#474D57'
        }
      },
      formatter: (params: any) => {
        if (!params || params.length === 0) return ''
        
        const dataIndex = params[0].dataIndex
        const originalData = props.data[dataIndex]
        const time = dayjs(originalData.timestamp).format('YYYY-MM-DD HH:mm:ss')
        
        let html = `<div style="margin-bottom: 8px; font-weight: 600; color: #FDFEFE; border-bottom: 1px solid #474D57; padding-bottom: 6px;">${time}</div>`
        
        params.forEach((param: any) => {
          const value = param.value
          const color = param.color
          const textColor = param.seriesName === '账户余额' ? '#FDFEFE' : 
                           value >= 0 ? '#0ECB81' : '#F6465D'
          
          html += `
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 6px; padding: 2px 0;">
              <div style="display: flex; align-items: center;">
                <span style="display: inline-block; width: 8px; height: 8px; background-color: ${color}; border-radius: 50%; margin-right: 8px;"></span>
                <span style="color: #B7BDC6; font-size: 12px;">${param.seriesName}</span>
              </div>
              <span style="font-weight: 600; color: ${textColor}; font-size: 12px;">${value >= 0 && param.seriesName !== '账户余额' ? '+' : ''}${value.toFixed(2)} USDT</span>
            </div>
          `
        })
        
        return html
      }
    },
    legend: {
      data: ['账户余额', '已实现盈亏', '未实现盈亏'],
      top: 15,
      left: 'center',
      textStyle: {
        color: '#B7BDC6',
        fontSize: 12
      },
      itemGap: 20,
      itemWidth: 12,
      itemHeight: 8
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '18%',
      top: '18%',
      containLabel: true,
      backgroundColor: 'transparent'
    },
    dataZoom: [
      {
        type: 'inside',
        start: 0,
        end: 100
      },
      {
        start: 0,
        end: 100,
        height: 24,
        bottom: 30,
        backgroundColor: '#2B3139',
        borderColor: '#474D57',
        fillerColor: 'rgba(240, 185, 11, 0.2)',
        handleStyle: {
          color: '#F0B90B'
        },
        textStyle: {
          color: '#B7BDC6',
          fontSize: 11
        }
      }
    ],
    toolbox: {
      feature: {
        saveAsImage: {
          title: '保存图片',
          iconStyle: {
            borderColor: '#848E9C'
          },
          emphasis: {
            iconStyle: {
              borderColor: '#F0B90B'
            }
          }
        },
        restore: {
          title: '重置',
          iconStyle: {
            borderColor: '#848E9C'
          },
          emphasis: {
            iconStyle: {
              borderColor: '#F0B90B'
            }
          }
        },
        dataZoom: {
          title: {
            zoom: '区域缩放',
            back: '还原缩放'
          },
          iconStyle: {
            borderColor: '#848E9C'
          },
          emphasis: {
            iconStyle: {
              borderColor: '#F0B90B'
            }
          }
        }
      },
      right: 20,
      top: 15,
      iconStyle: {
        borderColor: '#848E9C'
      }
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: xAxisData,
      axisLabel: {
        color: '#848E9C',
        fontSize: 11,
        rotate: props.data.length > 20 ? 45 : 0,
        margin: 12
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#474D57',
          width: 1
        }
      },
      axisTick: {
        show: false
      }
    },
    yAxis: {
      type: 'value',
      axisLabel: {
        color: '#848E9C',
        fontSize: 11,
        margin: 12,
        formatter: (value: number) => formatAmount(value)
      },
      axisLine: {
        show: false
      },
      axisTick: {
        show: false
      },
      splitLine: {
        show: true,
        lineStyle: {
          color: '#2B3139',
          width: 1,
          type: 'solid'
        }
      }
    },
    series: [
      {
        name: '账户余额',
        type: 'line',
        data: balanceData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 4,
        showSymbol: false,
        lineStyle: {
          width: 3,
          color: '#F0B90B'
        },
        itemStyle: {
          color: '#F0B90B',
          borderColor: '#F0B90B',
          borderWidth: 2
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: 'rgba(240, 185, 11, 0.3)' },
              { offset: 1, color: 'rgba(240, 185, 11, 0.05)' }
            ]
          }
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 4
          }
        }
      },
      {
        name: '已实现盈亏',
        type: 'line',
        data: realizedPnlData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 3,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: '#0ECB81'
        },
        itemStyle: {
          color: '#0ECB81',
          borderColor: '#0ECB81',
          borderWidth: 2
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3
          }
        }
      },
      {
        name: '未实现盈亏',
        type: 'line',
        data: unrealizedPnlData,
        smooth: true,
        symbol: 'circle',
        symbolSize: 3,
        showSymbol: false,
        lineStyle: {
          width: 2,
          color: '#FF8A00',
          type: [4, 4]
        },
        itemStyle: {
          color: '#FF8A00',
          borderColor: '#FF8A00',
          borderWidth: 2
        },
        emphasis: {
          focus: 'series',
          lineStyle: {
            width: 3
          }
        }
      }
    ]
  }
})

// 监听数据变化，重新渲染图表
watch(
  () => [props.data, props.dimension],
  () => {
    nextTick(() => {
      if (chartRef.value) {
        chartRef.value.resize()
      }
    })
  },
  { deep: true }
)
</script>

<style scoped>
.asset-trend-chart {
  width: 100%;
  height: 100%;
  min-height: 350px;
  position: relative;
}

.loading-container,
.empty-container {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 350px;
}

.chart-skeleton {
  width: 100%;
}

.chart-container {
  width: 100%;
  height: 100%;
  min-height: 350px;
}

.chart {
  width: 100%;
  height: 100%;
  min-height: 350px;
}

@media (max-width: 768px) {
  .asset-trend-chart {
    min-height: 300px;
  }
  
  .loading-container,
  .empty-container {
    height: 300px;
  }
  
  .chart-container {
    min-height: 300px;
  }
  
  .chart {
    min-height: 300px;
  }
}
</style>