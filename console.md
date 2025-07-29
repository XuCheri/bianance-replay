⚙️ 设置API配置: {apiKey: '2I2RkkvpuduqZWBEhCU20uLl9Iv4Qx8pBWl1tMClsgYqO8eQOawvfcfB1TSMYvwf', secretKey: 'LuSnzJeryiqMtTPdt2ou1xs2m6Ixu1WfaCKBX6TmbVSurq9oFTwiNgmznHDc8Bjq', testnet: false}
data.ts:67 ✅ binanceService创建完成: true
SettingsPanel.vue:362 🔄 开始验证API配置...
data.ts:156 🚀 使用真实API加载数据...
binance.ts:162 📡 调用币安API getIncomeHistory: {limit: 1000, startTime: 1753701435193, endTime: 1753787835193}
binance.ts:50 API请求: GET /fapi/v1/income?limit=1000&startTime=1753701435193&endTime=1753787835193&timestamp=1753787835193&signature=bfaa9c919d01e93518d81f67bc17fa4bbd521bc1a3745489f5c12611021fcea1
binance.ts:164 📥 收到币安API响应: 576条记录
data.ts:391 📊 处理真实收入数据: 576 条记录
data.ts:429 ✅ 真实数据处理完成，生成 24 个数据点
data.ts:430 📈 首个数据点: {timestamp: 1753740503000, balance: 10000, realizedPnl: 0, unrealizedPnl: 0, change: 0}
data.ts:431 📈 最后数据点: {timestamp: 1753749063000, balance: 10086.61, realizedPnl: 87.59, unrealizedPnl: 0, change: -0.0047183200003928505}
data.ts:175 🎯 资产数据已更新: {dataPoints: 24, firstPoint: {…}, lastPoint: {…}}
10[Violation] Added non-passive event listener to a scroll-blocking <some> event. Consider marking event handler as 'passive' to make the page more responsive. See <URL>
SettingsPanel.vue:365 ✅ API验证成功，数据加载完成
config.ts:61 币安API配置已设置
Home.vue:282 🔄 配置已保存，重新加载数据...
Home.vue:293 🔍 Home loadData - 当前状态: {demoMode: false, hasConfig: true, dimension: 'day'}
Home.vue:306 🔄 API模式，设置API配置
data.ts:64 ⚙️ 设置API配置: Proxy(Object) {apiKey: '2I2RkkvpuduqZWBEhCU20uLl9Iv4Qx8pBWl1tMClsgYqO8eQOawvfcfB1TSMYvwf', secretKey: 'LuSnzJeryiqMtTPdt2ou1xs2m6Ixu1WfaCKBX6TmbVSurq9oFTwiNgmznHDc8Bjq', testnet: false}
data.ts:67 ✅ binanceService创建完成: true
data.ts:156 🚀 使用真实API加载数据...
binance.ts:162 📡 调用币安API getIncomeHistory: {limit: 1000, startTime: 1753701435465, endTime: 1753787835465}
binance.ts:50 API请求: GET /fapi/v1/income?limit=1000&startTime=1753701435465&endTime=1753787835465&timestamp=1753787835466&signature=0fb9422d01715ca707e39491e6c266cd5f5b4570724e9cbcfebe9600082dcceb
binance.ts:164 📥 收到币安API响应: 576条记录
data.ts:391 📊 处理真实收入数据: 576 条记录
data.ts:429 ✅ 真实数据处理完成，生成 24 个数据点
data.ts:430 📈 首个数据点: {timestamp: 1753740503000, balance: 10000, realizedPnl: 0, unrealizedPnl: 0, change: 0}
data.ts:431 📈 最后数据点: {timestamp: 1753749063000, balance: 10086.61, realizedPnl: 87.59, unrealizedPnl: 0, change: -0.0047183200003928505}
data.ts:175 🎯 资产数据已更新: {dataPoints: 24, firstPoint: {…}, lastPoint: {…}}
data.ts:221 🚀 使用真实API加载持仓数据...
binance.ts:50 API请求: GET /fapi/v1/allOrders?limit=1000&symbol=BTCUSDT&timestamp=1753787835714&signature=9659d2437c157cc5820bcb15521d12af247f7fd4af56f1b1763d14037e943a40
binance.ts:213 📡 调用币安API getUserTrades: {limit: 1000, symbol: 'BTCUSDT'}
binance.ts:50 API请求: GET /fapi/v1/userTrades?limit=1000&symbol=BTCUSDT&timestamp=1753787835912&signature=950c65922f3782768573558551b489b5afe809a79bb06881db6899cfce4fcd9c
binance.ts:215 📥 收到交易数据: 0条记录
binance.ts:50 API请求: GET /fapi/v1/allOrders?limit=1000&symbol=ETHUSDT&timestamp=1753787836105&signature=0004ab4aaf8d177cdb5e651724583aa1516390d8990d1d7d51e25e97ba9f27fc
binance.ts:213 📡 调用币安API getUserTrades: {limit: 1000, symbol: 'ETHUSDT'}
binance.ts:50 API请求: GET /fapi/v1/userTrades?limit=1000&symbol=ETHUSDT&timestamp=1753787836298&signature=449c4b7e7c32aa7875f48d02c84f774d3db8f30a8718a97f45f494d1e179a654
binance.ts:215 📥 收到交易数据: 38条记录
binance.ts:50 API请求: GET /fapi/v1/allOrders?limit=1000&symbol=ADAUSDT&timestamp=1753787836497&signature=fd499b23cfc9c3dc70fe8b85c945aa7ae7a76c3351df2941ac2b63d6249586e9
binance.ts:213 📡 调用币安API getUserTrades: {limit: 1000, symbol: 'ADAUSDT'}
binance.ts:50 API请求: GET /fapi/v1/userTrades?limit=1000&symbol=ADAUSDT&timestamp=1753787836691&signature=b9f51af6d2c2bef1354d792b950998d95d95e8ff5d52ea2275ea7cb100c12af8
binance.ts:215 📥 收到交易数据: 0条记录
binance.ts:50 API请求: GET /fapi/v1/allOrders?limit=1000&symbol=DOTUSDT&timestamp=1753787836887&signature=08d5dce5b6a8a303784348e373b3d72c8aa11ce1553c0fa34e20d151ceb2ccff
binance.ts:213 📡 调用币安API getUserTrades: {limit: 1000, symbol: 'DOTUSDT'}
binance.ts:50 API请求: GET /fapi/v1/userTrades?limit=1000&symbol=DOTUSDT&timestamp=1753787837084&signature=9d9ed24ea16002bef867337033ffd6c0197f6836df7cdfbf9ec16704592e5149
binance.ts:215 📥 收到交易数据: 0条记录
binance.ts:50 API请求: GET /fapi/v1/allOrders?limit=1000&symbol=LINKUSDT&timestamp=1753787837283&signature=3a01b3775bd6fab119d1b6025ebcfed8a672417acba0f8a018ec420f10b337bc
binance.ts:213 📡 调用币安API getUserTrades: {limit: 1000, symbol: 'LINKUSDT'}
binance.ts:50 API请求: GET /fapi/v1/userTrades?limit=1000&symbol=LINKUSDT&timestamp=1753787837476&signature=37b8bcb059cb3bed2e1ca149d27f4a77c93a85f1b353b754f135c87e3cf461df
binance.ts:215 📥 收到交易数据: 0条记录
data.ts:240 📊 处理持仓数据，总计: 0 个持仓
data.ts:244 ⚠️ 没有真实持仓数据，使用模拟数据
Home.vue:288 🔄 数据加载完成，当前assetData长度: 24