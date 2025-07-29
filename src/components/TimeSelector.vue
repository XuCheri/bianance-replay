<template>
  <div class="time-selector">
    <div class="time-presets">
      <el-button-group>
        <el-button
          v-for="preset in presets"
          :key="preset.key"
          :type="activePreset === preset.key ? 'primary' : ''"
          size="small"
          @click="selectPreset(preset.key)"
        >
          {{ preset.label }}
        </el-button>
      </el-button-group>
    </div>
    
    <div class="custom-range">
      <el-date-picker
        v-model="customRange"
        type="datetimerange"
        range-separator="至"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        format="YYYY-MM-DD HH:mm:ss"
        value-format="YYYY-MM-DD HH:mm:ss"
        size="small"
        @change="handleCustomRangeChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import dayjs from 'dayjs'

interface TimeRange {
  start: Date
  end: Date
}

const emit = defineEmits<{
  change: [timeRange: TimeRange]
}>()

// 预设时间范围
const presets = [
  { key: 'today', label: '今日' },
  { key: 'week', label: '本周' },
  { key: 'month', label: '本月' },
  { key: 'year', label: '本年' }
]

const activePreset = ref('today')
const customRange = ref<[string, string] | null>(null)

// 计算当前时间范围
const currentTimeRange = computed((): TimeRange => {
  if (customRange.value) {
    return {
      start: new Date(customRange.value[0]),
      end: new Date(customRange.value[1])
    }
  }

  const now = dayjs()
  let start: dayjs.Dayjs
  let end: dayjs.Dayjs = now

  switch (activePreset.value) {
    case 'today':
      start = now.startOf('day')
      end = now.endOf('day')
      break
    case 'week':
      start = now.startOf('week')
      end = now.endOf('week')
      break
    case 'month':
      start = now.startOf('month')
      end = now.endOf('month')
      break
    case 'year':
      start = now.startOf('year')
      end = now.endOf('year')
      break
    default:
      start = now.startOf('day')
      end = now.endOf('day')
  }

  return {
    start: start.toDate(),
    end: end.toDate()
  }
})

// 方法
const selectPreset = (presetKey: string) => {
  activePreset.value = presetKey
  customRange.value = null
  emitChange()
}

const handleCustomRangeChange = (value: [string, string] | null) => {
  if (value) {
    activePreset.value = ''
    emitChange()
  }
}

const emitChange = () => {
  emit('change', currentTimeRange.value)
}

// 初始化
emitChange()
</script>

<style scoped>
.time-selector {
  display: flex;
  align-items: center;
  gap: 16px;
}

.time-presets {
  display: flex;
  align-items: center;
}

.custom-range {
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  .time-selector {
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
  }
  
  .time-presets {
    justify-content: center;
  }
  
  .custom-range {
    justify-content: center;
  }
}
</style>