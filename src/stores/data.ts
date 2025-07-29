import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { createBinanceService, type BinanceConfig } from '@/services/binance'
import type { 
  AssetData, 
  PositionRecord, 
  PositionDetail,
  TimeDimension, 
  FilterOptions,
  TradeRecord,
  PnlHistoryPoint
} from '@/types'

export const useDataStore = defineStore('data', () => {
  // 状态
  const binanceService = ref<any>(null)
  const apiConfig = ref<BinanceConfig | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // 数据状态
  const assetData = ref<AssetData[]>([])
  const positions = ref<PositionRecord[]>([])
  const selectedPosition = ref<PositionDetail | null>(null)
  
  // 缓存状态
  const cache = ref({
    assetData: new Map<string, AssetData[]>(),
    positions: new Map<string, PositionRecord[]>(),
    lastUpdate: new Map<string, number>()
  })

  // 计算属性
  const isConfigured = computed(() => !!apiConfig.value)
  
  const hasData = computed(() => 
    assetData.value.length > 0 || positions.value.length > 0
  )

  const totalBalance = computed(() => {
    if (assetData.value.length === 0) return 0
    return assetData.value[assetData.value.length - 1]?.balance || 0
  })

  const totalPnl = computed(() => {
    if (assetData.value.length === 0) return { realized: 0, unrealized: 0 }
    const latest = assetData.value[assetData.value.length - 1]
    return {
      realized: latest?.realizedPnl || 0,
      unrealized: latest?.unrealizedPnl || 0
    }
  })

  const openPositionsCount = computed(() => 
    positions.value.filter(p => p.status === 'OPEN').length
  )

  const closedPositionsCount = computed(() => 
    positions.value.filter(p => p.status === 'CLOSED').length
  )

  // 方法
  const setApiConfig = (config: BinanceConfig) => {
    console.log('⚙️ 设置API配置:', config)
    apiConfig.value = config
    binanceService.value = createBinanceService(config)
    console.log('✅ binanceService创建完成:', !!binanceService.value)
  }

  const clearApiConfig = () => {
    console.log('🗑️ 清除API配置')
    apiConfig.value = null
    binanceService.value = null
    clearAllData()
  }

  const clearAllData = () => {
    assetData.value = []
    positions.value = []
    selectedPosition.value = null
    cache.value.assetData.clear()
    cache.value.positions.clear()
    cache.value.lastUpdate.clear()
    error.value = null
  }

  const setError = (message: string) => {
    error.value = message
    console.error('数据错误:', message)
  }

  const clearError = () => {
    error.value = null
  }

  /**
   * 检查缓存是否有效
   */
  const isCacheValid = (key: string, maxAge: number = 5 * 60 * 1000): boolean => {
    const lastUpdate = cache.value.lastUpdate.get(key)
    if (!lastUpdate) return false
    return Date.now() - lastUpdate < maxAge
  }

  /**
   * 更新缓存
   */
  const updateCache = (key: string, data: any) => {
    if (key.startsWith('asset_')) {
      cache.value.assetData.set(key, data)
    } else if (key.startsWith('positions')) {
      cache.value.positions.set(key, data)
    }
    cache.value.lastUpdate.set(key, Date.now())
  }

  /**
   * 从缓存获取数据
   */
  const getFromCache = (key: string): any => {
    if (key.startsWith('asset_')) {
      return cache.value.assetData.get(key)
    } else if (key.startsWith('positions')) {
      return cache.value.positions.get(key)
    }
    return null
  }

  /**
   * 加载资产数据
   */
  const loadAssetData = async (dimension: TimeDimension = 'day', useCache = true) => {
    const cacheKey = `asset_${dimension}`
    
    if (useCache && isCacheValid(cacheKey)) {
      const cachedData = getFromCache(cacheKey)
      if (cachedData) {
        assetData.value = cachedData
        return
      }
    }

    loading.value = true
    clearError()

    try {
      // 如果没有配置API，使用模拟数据
      if (!binanceService.value) {
        console.log('🔄 没有API服务，使用模拟数据')
        const mockData = generateMockAssetData(dimension)
        assetData.value = mockData
        updateCache(cacheKey, mockData)
        return
      }

      console.log('🚀 使用真实API加载数据...')

      // 调用真实API
      const days = dimension === 'day' ? 1 : dimension === 'month' ? 30 : 365
      const endTime = Date.now()
      const startTime = endTime - (days * 24 * 60 * 60 * 1000)

      // 获取资金流水记录
      const incomeHistory = await binanceService.value.getIncomeHistory({
        startTime,
        endTime,
        limit: 1000
      })

      // 处理数据并生成资产变化趋势
      const processedData = processIncomeToAssetData(incomeHistory, dimension)
      assetData.value = processedData
      updateCache(cacheKey, processedData)
      
      console.log('🎯 资产数据已更新:', {
        dataPoints: processedData.length,
        firstPoint: processedData[0],
        lastPoint: processedData[processedData.length - 1]
      })

    } catch (err: any) {
      console.error('💥 加载资产数据失败，回退到模拟数据:', err)
      setError(err.message || '加载资产数据失败')
      
      // 失败时使用模拟数据
      const mockData = generateMockAssetData(dimension)
      assetData.value = mockData
      updateCache(cacheKey, mockData)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载持仓记录
   */
  const loadPositions = async (useCache = true) => {
    const cacheKey = 'positions_all'
    
    if (useCache && isCacheValid(cacheKey)) {
      const cachedData = getFromCache(cacheKey)
      if (cachedData) {
        positions.value = cachedData
        return
      }
    }

    loading.value = true
    clearError()

    try {
      // 如果没有配置API，使用模拟数据
      if (!binanceService.value) {
        console.log('🔄 没有API服务，使用模拟持仓数据')
        const mockData = generateMockPositions()
        positions.value = mockData
        updateCache(cacheKey, mockData)
        return
      }

      console.log('🚀 使用真实API加载持仓数据...')

      // 先获取用户的所有交易记录来确定交易过的币种
      console.log('📡 获取所有交易记录以确定币种...')
      const allTrades = await binanceService.value.getAllUserTrades()
      
      // 从交易记录中提取所有交易过的币种
      const tradedSymbols = [...new Set(allTrades.map((trade: any) => trade.symbol))]
      console.log('💰 发现交易币种:', tradedSymbols)

      const allPositions: PositionRecord[] = []

      for (const symbol of tradedSymbols) {
        try {
          // 获取该币种的所有交易记录
          const symbolTrades = allTrades.filter((trade: any) => trade.symbol === symbol)
          console.log(`🔍 处理 ${symbol}: ${symbolTrades.length} 笔交易`)
          
          // 处理交易记录，生成持仓记录
          const symbolPositions = processOrdersToPositions([], symbolTrades, symbol)
          allPositions.push(...symbolPositions)
        } catch (err) {
          console.warn(`处理 ${symbol} 数据失败:`, err)
        }
      }

      console.log('📊 处理持仓数据，总计:', allPositions.length, '个持仓')
      
      // 如果没有真实持仓数据，使用模拟数据但保留API服务状态
      if (allPositions.length === 0) {
        console.log('⚠️ 没有真实持仓数据，使用模拟数据')
        const mockData = generateMockPositions()
        positions.value = mockData
        updateCache(cacheKey, mockData)
        return
      }
      
      // 按时间排序
      allPositions.sort((a, b) => b.openTime - a.openTime)
      
      positions.value = allPositions
      updateCache(cacheKey, allPositions)

    } catch (err: any) {
      console.error('💥 加载持仓记录失败，回退到模拟数据:', err)
      setError(err.message || '加载持仓记录失败')
      
      // 失败时使用模拟数据
      const mockData = generateMockPositions()
      positions.value = mockData
      updateCache(cacheKey, mockData)
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载仓位详情
   */
  const loadPositionDetail = async (positionId: string): Promise<PositionDetail | null> => {
    const position = positions.value.find(p => p.id === positionId)
    if (!position) return null

    try {
      // 生成详细的交易记录和盈亏历史
      const trades = generateMockTrades(position)
      const pnlHistory = generateMockPnlHistory(position)

      const detail: PositionDetail = {
        ...position,
        trades,
        pnlHistory,
        stopLoss: Math.random() > 0.7 ? position.entryPrice * (position.side === 'LONG' ? 0.95 : 1.05) : undefined,
        takeProfit: Math.random() > 0.7 ? position.entryPrice * (position.side === 'LONG' ? 1.1 : 0.9) : undefined
      }

      selectedPosition.value = detail
      return detail
    } catch (err: any) {
      setError(err.message || '加载仓位详情失败')
      return null
    }
  }

  /**
   * 筛选持仓记录
   */
  const filterPositions = (options: FilterOptions): PositionRecord[] => {
    let filtered = [...positions.value]

    if (options.symbol) {
      filtered = filtered.filter(p => 
        p.symbol.toLowerCase().includes(options.symbol!.toLowerCase())
      )
    }

    if (options.side) {
      filtered = filtered.filter(p => p.side === options.side)
    }

    if (options.status && options.status !== 'ALL') {
      filtered = filtered.filter(p => p.status === options.status)
    }

    if (options.startTime) {
      filtered = filtered.filter(p => p.openTime >= options.startTime!)
    }

    if (options.endTime) {
      filtered = filtered.filter(p => p.openTime <= options.endTime!)
    }

    return filtered
  }

  // 工具函数
  const generateMockAssetData = (dimension: TimeDimension): AssetData[] => {
    if (!binanceService.value) {
      // 创建临时service实例来生成模拟数据
      const tempService = createBinanceService({ apiKey: '', secretKey: '' })
      const days = dimension === 'day' ? 1 : dimension === 'month' ? 30 : 365
      return tempService.generateMockAssetData(days)
    }
    return binanceService.value.generateMockAssetData()
  }

  const generateMockPositions = (): PositionRecord[] => {
    if (!binanceService.value) {
      const tempService = createBinanceService({ apiKey: '', secretKey: '' })
      return tempService.generateMockPositions()
    }
    return binanceService.value.generateMockPositions()
  }

  const generateMockTrades = (position: PositionRecord): TradeRecord[] => {
    const trades: TradeRecord[] = []
    const tradeCount = Math.floor(Math.random() * 5) + 1

    for (let i = 0; i < tradeCount; i++) {
      trades.push({
        id: `trade_${position.id}_${i}`,
        symbol: position.symbol,
        orderId: `order_${position.id}_${i}`,
        side: Math.random() > 0.5 ? 'BUY' : 'SELL',
        quantity: position.quantity / tradeCount,
        price: position.entryPrice + (Math.random() - 0.5) * 100,
        fee: (position.quantity / tradeCount) * position.entryPrice * 0.0004,
        timestamp: position.openTime + i * 60000,
        isMaker: Math.random() > 0.5
      })
    }

    return trades
  }

  const generateMockPnlHistory = (position: PositionRecord): PnlHistoryPoint[] => {
    const history: PnlHistoryPoint[] = []
    const duration = position.closeTime ? position.closeTime - position.openTime : 24 * 60 * 60 * 1000
    const points = Math.min(Math.floor(duration / (5 * 60 * 1000)), 50) // 每5分钟一个点，最多50个点

    for (let i = 0; i <= points; i++) {
      const timestamp = position.openTime + (duration / points) * i
      const priceVariation = (Math.random() - 0.5) * 1000
      const price = position.entryPrice + priceVariation
      const pnl = (price - position.entryPrice) * position.quantity * (position.side === 'LONG' ? 1 : -1)

      history.push({
        timestamp,
        price,
        pnl
      })
    }

    return history
  }

  const processIncomeToAssetData = (incomeHistory: any[], dimension: TimeDimension): AssetData[] => {
    console.log('📊 处理真实收入数据:', incomeHistory.length, '条记录')
    
    if (!incomeHistory || incomeHistory.length === 0) {
      console.log('⚠️ 没有收入数据，使用模拟数据')
      return generateMockAssetData(dimension)
    }

    // 按时间排序
    const sortedHistory = incomeHistory.sort((a, b) => parseInt(a.time) - parseInt(b.time))
    
    // 计算累计资产变化
    let balance = 10000 // 初始余额
    let totalRealizedPnl = 0
    let totalUnrealizedPnl = 0
    
    const assetData: AssetData[] = []
    const dataPoints = Math.min(sortedHistory.length, dimension === 'day' ? 24 : dimension === 'month' ? 30 : 365)
    
    for (let i = 0; i < dataPoints; i++) {
      const income = sortedHistory[i]
      const amount = parseFloat(income.income || '0')
      
      if (income.incomeType === 'REALIZED_PNL') {
        totalRealizedPnl += amount
        balance += amount
      } else if (income.incomeType === 'FUNDING_FEE') {
        balance += amount
      }
      
      assetData.push({
        timestamp: parseInt(income.time),
        balance: parseFloat(balance.toFixed(2)),
        realizedPnl: parseFloat(totalRealizedPnl.toFixed(2)),
        unrealizedPnl: totalUnrealizedPnl,
        change: i > 0 ? balance - assetData[i-1].balance : 0
      })
    }
    
    console.log('✅ 真实数据处理完成，生成', assetData.length, '个数据点')
    console.log('📈 首个数据点:', assetData[0])
    console.log('📈 最后数据点:', assetData[assetData.length - 1])
    return assetData
  }

  const processOrdersToPositions = (orders: any[], trades: any[], symbol: string): PositionRecord[] => {
    console.log(`🏗️ 处理 ${symbol} 数据: ${trades.length} 个交易`)
    
    if (trades.length === 0) {
      return []
    }

    // 按时间排序交易记录
    const sortedTrades = trades.sort((a, b) => a.timestamp - b.timestamp)
    
    const positions: PositionRecord[] = []
    let netPosition = 0 // 净持仓量
    let totalCost = 0 // 总成本
    let positionTrades: any[] = [] // 当前仓位的交易记录
    let openTime = 0 // 开仓时间
    
    for (const trade of sortedTrades) {
      const side = trade.side // 'BUY' or 'SELL'
      const quantity = trade.quantity
      const price = trade.price
      const timestamp = trade.timestamp
      
      // 计算方向数量（买入为正，卖出为负）
      const directedQty = side === 'BUY' ? quantity : -quantity
      const tradeValue = quantity * price
      
      if (netPosition === 0) {
        // 开新仓
        netPosition = directedQty
        totalCost = tradeValue
        positionTrades = [trade]
        openTime = timestamp
      } else if ((netPosition > 0 && directedQty > 0) || (netPosition < 0 && directedQty < 0)) {
        // 加仓
        totalCost += tradeValue
        netPosition += directedQty
        positionTrades.push(trade)
      } else {
        // 平仓或反向
        const absNetPosition = Math.abs(netPosition)
        const absTradeQty = Math.abs(directedQty)
        
        if (absTradeQty >= absNetPosition) {
          // 完全平仓或反向
          const closedQty = absNetPosition
          const avgEntryPrice = totalCost / absNetPosition
          const pnl = netPosition > 0 
            ? (price - avgEntryPrice) * closedQty
            : (avgEntryPrice - price) * closedQty
          
          // 创建已平仓记录
          const position: PositionRecord = {
            id: `pos_${symbol}_${openTime}`,
            symbol,
            side: netPosition > 0 ? 'LONG' : 'SHORT',
            size: closedQty,
            entryPrice: Number(avgEntryPrice.toFixed(6)),
            exitPrice: price,
            pnl: Number(pnl.toFixed(4)),
            roe: Number(((pnl / totalCost) * 100).toFixed(2)),
            openTime,
            closeTime: timestamp,
            status: 'CLOSED' as const,
            trades: [...positionTrades, trade]
          }
          positions.push(position)
          
          // 如果有剩余量，开新的反向仓
          if (absTradeQty > absNetPosition) {
            const remainingQty = absTradeQty - absNetPosition
            netPosition = side === 'BUY' ? remainingQty : -remainingQty
            totalCost = remainingQty * price
            positionTrades = [trade]
            openTime = timestamp
          } else {
            // 完全平仓
            netPosition = 0
            totalCost = 0
            positionTrades = []
            openTime = 0
          }
        } else {
          // 部分平仓
          const avgEntryPrice = totalCost / Math.abs(netPosition)
          const closedQty = absTradeQty
          const pnl = netPosition > 0 
            ? (price - avgEntryPrice) * closedQty
            : (avgEntryPrice - price) * closedQty
          
          // 创建部分平仓记录
          const position: PositionRecord = {
            id: `pos_${symbol}_${openTime}_partial_${timestamp}`,
            symbol,
            side: netPosition > 0 ? 'LONG' : 'SHORT',
            size: closedQty,
            entryPrice: Number(avgEntryPrice.toFixed(6)),
            exitPrice: price,
            pnl: Number(pnl.toFixed(4)),
            roe: Number(((pnl / (closedQty * avgEntryPrice)) * 100).toFixed(2)),
            openTime,
            closeTime: timestamp,
            status: 'CLOSED' as const,
            trades: [...positionTrades, trade]
          }
          positions.push(position)
          
          // 更新剩余持仓
          netPosition += directedQty
          totalCost = Math.abs(netPosition) * avgEntryPrice
          positionTrades.push(trade)
        }
      }
    }
    
    // 如果还有未平仓的持仓
    if (netPosition !== 0) {
      const avgEntryPrice = totalCost / Math.abs(netPosition)
      const position: PositionRecord = {
        id: `pos_${symbol}_${openTime}_open`,
        symbol,
        side: netPosition > 0 ? 'LONG' : 'SHORT',
        size: Math.abs(netPosition),
        entryPrice: Number(avgEntryPrice.toFixed(6)),
        exitPrice: 0,
        pnl: 0,
        roe: 0,
        openTime,
        closeTime: 0,
        status: 'OPEN' as const,
        trades: positionTrades
      }
      positions.push(position)
    }
    
    console.log(`✅ ${symbol} 处理完成，生成 ${positions.length} 个持仓记录`)
    return positions
  }

  return {
    // 状态
    loading,
    error,
    assetData,
    positions,
    selectedPosition,
    
    // 计算属性
    isConfigured,
    hasData,
    totalBalance,
    totalPnl,
    openPositionsCount,
    closedPositionsCount,
    
    // 方法
    setApiConfig,
    clearApiConfig,
    clearAllData,
    setError,
    clearError,
    loadAssetData,
    loadPositions,
    loadPositionDetail,
    filterPositions
  }
})