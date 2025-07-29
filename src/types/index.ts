// 时间维度类型
export type TimeDimension = 'day' | 'month' | 'year'

// 持仓方向
export type PositionSide = 'LONG' | 'SHORT'

// 订单状态
export type OrderStatus = 'NEW' | 'PARTIALLY_FILLED' | 'FILLED' | 'CANCELED' | 'REJECTED' | 'EXPIRED'

// 资产数据接口
export interface AssetData {
  timestamp: number
  balance: number
  realizedPnl: number
  unrealizedPnl: number
}

// 持仓记录接口
export interface PositionRecord {
  id: string
  symbol: string
  side: PositionSide
  leverage?: number
  entryPrice: number
  exitPrice?: number
  size: number
  quantity?: number // 兼容字段
  openTime: number
  closeTime?: number
  pnl?: number
  roe?: number
  fee?: number
  isForceClose?: boolean
  status: 'OPEN' | 'CLOSED'
  trades?: TradeRecord[]
}

// 仓位详情接口
export interface PositionDetail extends PositionRecord {
  trades: TradeRecord[]
  pnlHistory: PnlHistoryPoint[]
  stopLoss?: number
  takeProfit?: number
}

// 交易记录接口
export interface TradeRecord {
  id: string
  symbol: string
  orderId: string
  side: 'BUY' | 'SELL'
  quantity: number
  price: number
  fee: number
  timestamp: number
  isMaker: boolean
}

// 盈亏历史点
export interface PnlHistoryPoint {
  timestamp: number
  pnl: number
  price: number
}

// 账户信息接口
export interface AccountInfo {
  totalWalletBalance: number
  totalUnrealizedPnl: number
  totalMarginBalance: number
  totalPositionInitialMargin: number
  totalOpenOrderInitialMargin: number
  maxWithdrawAmount: number
  assets: AccountAsset[]
  positions: AccountPosition[]
}

// 账户资产
export interface AccountAsset {
  asset: string
  walletBalance: number
  unrealizedProfit: number
  marginBalance: number
  maintMargin: number
  initialMargin: number
  positionInitialMargin: number
  openOrderInitialMargin: number
  maxWithdrawAmount: number
}

// 账户持仓
export interface AccountPosition {
  symbol: string
  initialMargin: number
  maintMargin: number
  unrealizedProfit: number
  positionInitialMargin: number
  openOrderInitialMargin: number
  leverage: number
  isolated: boolean
  entryPrice: number
  maxNotional: number
  positionSide: PositionSide
  positionAmt: number
  notional: number
  isolatedWallet: number
  updateTime: number
}

// API响应基础接口
export interface ApiResponse<T> {
  code?: number
  msg?: string
  data: T
}

// 筛选条件接口
export interface FilterOptions {
  symbol?: string
  side?: PositionSide
  status?: 'OPEN' | 'CLOSED' | 'ALL'
  startTime?: number
  endTime?: number
}