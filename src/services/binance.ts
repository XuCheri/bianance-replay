import axios, { AxiosInstance } from 'axios'
import CryptoJS from 'crypto-js'
import type { 
  AccountInfo, 
  PositionRecord, 
  TradeRecord, 
  AssetData,
  ApiResponse 
} from '@/types'

interface BinanceConfig {
  apiKey: string
  secretKey: string
  baseURL?: string
  testnet?: boolean
}

interface BinanceApiResponse<T = any> {
  code?: number
  msg?: string
  data?: T
  [key: string]: any
}

class BinanceService {
  private api: AxiosInstance
  private apiKey: string
  private secretKey: string

  constructor(config: BinanceConfig) {
    this.apiKey = config.apiKey
    this.secretKey = config.secretKey

    // 根据配置选择基础URL
    const baseURL = config.baseURL || (config.testnet 
      ? 'https://testnet.binancefuture.com'
      : 'https://fapi.binance.com')

    this.api = axios.create({
      baseURL,
      timeout: 10000,
      headers: {
        'X-MBX-APIKEY': this.apiKey
      }
    })

    // 请求拦截器
    this.api.interceptors.request.use(
      (config) => {
        console.log(`API请求: ${config.method?.toUpperCase()} ${config.url}`)
        return config
      },
      (error) => {
        console.error('请求拦截器错误:', error)
        return Promise.reject(error)
      }
    )

    // 响应拦截器
    this.api.interceptors.response.use(
      (response) => {
        return response
      },
      (error) => {
        console.error('API请求失败:', error.response?.data || error.message)
        return Promise.reject(this.handleError(error))
      }
    )
  }

  /**
   * 生成签名
   */
  private generateSignature(queryString: string): string {
    return CryptoJS.HmacSHA256(queryString, this.secretKey).toString()
  }

  /**
   * 构建查询参数
   */
  private buildQueryString(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${key}=${value}`)
      .join('&')
    
    return filteredParams
  }

  /**
   * 发送带签名的请求
   */
  private async signedRequest<T>(method: 'GET' | 'POST', endpoint: string, params: Record<string, any> = {}): Promise<T> {
    const timestamp = Date.now()
    const queryParams = {
      ...params,
      timestamp
    }

    const queryString = this.buildQueryString(queryParams)
    const signature = this.generateSignature(queryString)
    const finalQueryString = `${queryString}&signature=${signature}`

    const config = {
      method,
      url: `${endpoint}?${finalQueryString}`
    }

    const response = await this.api.request<BinanceApiResponse<T>>(config)
    
    // 处理币安API的不同响应格式
    if (response.data.code && response.data.code !== 200) {
      throw new Error(response.data.msg || '请求失败')
    }

    return response.data as T
  }

  /**
   * 错误处理
   */
  private handleError(error: any): Error {
    if (error.response?.data) {
      const data = error.response.data
      const apiError = new Error(data.msg || data.message || '请求失败')
      // 保留原始响应数据以便上层处理
      ;(apiError as any).response = error.response
      return apiError
    }
    return new Error(error.message || '网络请求失败')
  }

  /**
   * 获取账户信息
   */
  async getAccountInfo(): Promise<AccountInfo> {
    try {
      const data = await this.signedRequest<AccountInfo>('GET', '/fapi/v2/account')
      return data
    } catch (error) {
      console.error('获取账户信息失败:', error)
      throw error
    }
  }

  /**
   * 获取资金流水记录
   */
  async getIncomeHistory(params: {
    symbol?: string
    incomeType?: string
    startTime?: number
    endTime?: number
    limit?: number
  } = {}): Promise<any[]> {
    try {
      const defaultParams = {
        limit: 1000,
        ...params
      }
      
      console.log('📡 调用币安API getIncomeHistory:', defaultParams)
      const data = await this.signedRequest<any[]>('GET', '/fapi/v1/income', defaultParams)
      console.log('📥 收到币安API响应:', Array.isArray(data) ? `${data.length}条记录` : '非数组数据')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('获取资金流水失败:', error)
      throw error
    }
  }

  /**
   * 获取所有订单
   */
  async getAllOrders(params: {
    symbol: string
    startTime?: number
    endTime?: number
    limit?: number
  }): Promise<any[]> {
    try {
      const defaultParams = {
        limit: 1000,
        ...params
      }

      console.log('📡 调用币安API getAllOrders:', defaultParams)
      const data = await this.signedRequest<any[]>('GET', '/fapi/v1/allOrders', defaultParams)
      console.log('📥 收到订单数据:', Array.isArray(data) ? `${data.length}条记录` : '非数组数据')
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('获取订单失败:', error)
      throw error
    }
  }

  /**
   * 获取所有用户交易记录（不限币种）
   */
  async getAllUserTrades(): Promise<any[]> {
    try {
      console.log('📡 调用币安API 获取所有交易记录...')
      // 使用income接口获取所有交易相关的记录
      const incomeData = await this.signedRequest<any[]>('GET', '/fapi/v1/income', {
        incomeType: 'REALIZED_PNL',
        limit: 1000
      })
      
      console.log('📥 收到交易相关收入数据:', Array.isArray(incomeData) ? `${incomeData.length}条记录` : '非数组数据')
      
      // 从收入记录中提取币种，然后获取每个币种的交易记录
      const symbols = [...new Set(incomeData.map(item => item.symbol).filter(Boolean))]
      console.log('💰 从收入记录发现币种:', symbols)
      
      const allTrades: any[] = []
      
      for (const symbol of symbols) {
        try {
          const trades = await this.getUserTrades({ symbol })
          allTrades.push(...trades)
        } catch (err) {
          console.warn(`获取 ${symbol} 交易记录失败:`, err)
        }
      }
      
      console.log('✅ 总计获取交易记录:', allTrades.length)
      return allTrades
    } catch (error) {
      console.error('获取所有交易记录失败:', error)
      throw error
    }
  }

  /**
   * 获取用户交易记录
   */
  async getUserTrades(params: {
    symbol: string
    startTime?: number
    endTime?: number
    fromId?: number
    limit?: number
  }): Promise<TradeRecord[]> {
    try {
      const defaultParams = {
        limit: 1000,
        ...params
      }

      console.log('📡 调用币安API getUserTrades:', defaultParams)
      const data = await this.signedRequest<any[]>('GET', '/fapi/v1/userTrades', defaultParams)
      console.log('📥 收到交易数据:', Array.isArray(data) ? `${data.length}条记录` : '非数组数据')
      
      if (data.length > 0) {
        console.log('📋 交易数据样例:', data[0])
      }
      
      return (Array.isArray(data) ? data : []).map(trade => ({
        id: trade.id.toString(),
        symbol: trade.symbol,
        orderId: trade.orderId.toString(),
        side: trade.side,
        quantity: parseFloat(trade.qty),
        price: parseFloat(trade.price),
        fee: parseFloat(trade.commission),
        timestamp: trade.time,
        isMaker: trade.maker
      }))
    } catch (error) {
      console.error('获取交易记录失败:', error)
      throw error
    }
  }

  /**
   * 获取历史订单
   */
  async getAllOrders(params: {
    symbol: string
    orderId?: number
    startTime?: number
    endTime?: number
    limit?: number
  }): Promise<any[]> {
    try {
      const defaultParams = {
        limit: 1000,
        ...params
      }

      const data = await this.signedRequest<any[]>('GET', '/fapi/v1/allOrders', defaultParams)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('获取历史订单失败:', error)
      throw error
    }
  }

  /**
   * 获取当前持仓风险
   */
  async getPositionRisk(symbol?: string): Promise<any[]> {
    try {
      const params = symbol ? { symbol } : {}
      const data = await this.signedRequest<any[]>('GET', '/fapi/v2/positionRisk', params)
      return Array.isArray(data) ? data : []
    } catch (error) {
      console.error('获取持仓风险失败:', error)
      throw error
    }
  }

  /**
   * 生成模拟数据（用于演示）
   */
  generateMockAssetData(days: number = 30): AssetData[] {
    const data: AssetData[] = []
    const now = Date.now()
    const baseBalance = 10000
    
    for (let i = days; i >= 0; i--) {
      const timestamp = now - (i * 24 * 60 * 60 * 1000)
      const variation = (Math.random() - 0.5) * 1000
      const realizedPnl = (Math.random() - 0.4) * 500
      const unrealizedPnl = (Math.random() - 0.5) * 300
      
      data.push({
        timestamp,
        balance: baseBalance + variation + (days - i) * 50,
        realizedPnl,
        unrealizedPnl
      })
    }
    
    return data
  }

  /**
   * 生成模拟持仓数据（用于演示）
   */
  generateMockPositions(): PositionRecord[] {
    const symbols = ['BTCUSDT', 'ETHUSDT', 'ADAUSDT', 'DOTUSDT', 'LINKUSDT']
    const positions: PositionRecord[] = []
    
    symbols.forEach((symbol, index) => {
      const isLong = Math.random() > 0.5
      const entryPrice = 40000 + Math.random() * 20000
      const exitPrice = Math.random() > 0.3 ? entryPrice + (Math.random() - 0.5) * 2000 : undefined
      const quantity = Math.random() * 0.1 + 0.01
      const pnl = exitPrice ? (exitPrice - entryPrice) * quantity * (isLong ? 1 : -1) : undefined
      const openTime = Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
      const closeTime = exitPrice ? openTime + Math.random() * 24 * 60 * 60 * 1000 : undefined
      
      positions.push({
        id: `pos_${index + 1}`,
        symbol,
        side: isLong ? 'LONG' : 'SHORT',
        leverage: Math.floor(Math.random() * 20) + 1,
        entryPrice,
        exitPrice,
        quantity,
        openTime,
        closeTime,
        pnl,
        fee: quantity * entryPrice * 0.0004,
        isForceClose: Math.random() < 0.1,
        status: exitPrice ? 'CLOSED' : 'OPEN'
      })
    })
    
    return positions.sort((a, b) => b.openTime - a.openTime)
  }
}

// 导出服务实例创建函数
export const createBinanceService = (config: BinanceConfig): BinanceService => {
  return new BinanceService(config)
}

// 导出类型
export type { BinanceConfig }
export default BinanceService