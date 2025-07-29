# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication Guidelines

- 全程中文回答

## 项目概述

这是一个币安合约账户复盘分析系统，专注于提供资产变化趋势、持仓记录分析和交易复盘功能。主要目标是帮助用户复盘分析其在币安合约交易中的操作和资金变化轨迹。

## 核心功能模块

- **资产变化趋势图**: 折线图展示账户余额、已实现盈亏、未实现盈亏
- **持仓记录列表**: 历史仓位记录展示与筛选
- **仓位详情**: 选中仓位的详细信息展示
- **时间维度切换**: 支持日/月/年维度分析

## 技术架构

根据需求文档，推荐技术栈：
- 前端：Vue3 + TypeScript + Pinia
- UI框架：Element Plus / Naive UI / Tailwind
- 图表库：Echarts / TradingView Charts
- 数据源：币安合约API或本地CSV导入

## 数据接口

主要使用币安合约API：
- `/fapi/v2/account` - 账户资产信息
- `/fapi/v1/income` - 资金流水
- `/fapi/v1/positionRisk` - 当前持仓
- `/fapi/v1/userTrades` - 历史成交
- `/fapi/v1/allOrders` - 历史订单

## 开发注意事项

- 所有金额保留2-4位小数，默认USDT单位
- 支持图表交互（缩放、Hover、筛选联动）
- 本地缓存数据以减少API频率限制
- 支持CSV数据导入用于离线调试

## 项目状态

✅ **项目已完成从0到1的完整开发**

### 开发环境运行
- 安装依赖：`npm install`
- 启动开发：`npm run dev`
- 项目地址：http://localhost:3001

### 已实现功能
- ✅ 完整的Vue3 + TypeScript + Element Plus架构
- ✅ **币安官网风格深色主题** - 专业金融界面设计
- ✅ 资产变化趋势图表（币安配色，支持日/月/年维度）
- ✅ 持仓记录列表（专业徽章系统，筛选搜索）
- ✅ 仓位详情展示（详细交易明细、盈亏曲线）
- ✅ 时间维度选择器（预设和自定义范围）
- ✅ 系统设置面板（主题配置、API设置等）
- ✅ 币安API服务集成（完整签名验证）
- ✅ Pinia状态管理（缓存和自动刷新）
- ✅ 完美响应式设计（桌面/平板/手机适配）
- ✅ 默认深色模式（币安官方配色）
- ✅ 演示模式（丰富模拟数据）

### 界面特色
- 🎨 采用币安官网同款深色主题和配色
- 💰 专业的金融数据展示和格式化
- 📊 高质量的交互式图表系统
- 🏷️ 直观的状态徽章和标签
- ⚡ 流畅的动画和交互反馈

### 命令说明
- `npm run dev` - 启动开发服务器
- `npm run build` - 构建生产版本
- `npm run type-check` - TypeScript类型检查
- `npm run lint` - 代码检查