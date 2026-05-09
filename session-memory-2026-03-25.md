---
name: 认知训练平台项目全记录
description: Charlie FocusLab 游戏化专注力训练平台 — 毕业设计项目的完整开发记录，包括架构、已修复的Bug、已实现的功能、SDT学术指标体系
type: project
---

# Charlie FocusLab — 游戏化专注力训练与行为评估平台

## 项目背景
- **毕业设计题目**: 游戏化专注力训练与行为评估平台的设计与实现
- **目标用户**: ADHD儿童
- **核心学术框架**: 信号检测理论 (SDT)，指标包括 d'(敏感度)、β(反应偏向)、RT、RTV、疲劳指数
- **技术栈**: React + TypeScript + Vite (前端), Node.js + tRPC (后端), MySQL + Drizzle ORM (数据库), Recharts (可视化)
- **项目路径**: `/Users/qiqichen/Desktop/cognitive-training-platform-hi-main`
- **毕业设计参考文件**: `/Users/qiqichen/Desktop/Capstone Project/` (只读，不要修改)

## 已修复的关键Bug

### 1. Go/No-Go 游戏数据丢失 (严重)
- **根因**: React stale closure bug — `runTrial` (useCallback) 捕获了旧的 `finishGame` 引用
- **修复**: 引入 `sessionIdRef` + `finishGameRef` 模式，所有 `finishGame(...)` 调用改为 `finishGameRef.current(...)`
- **同步修复**: Schulte、Memory、Stroop 三个游戏也添加了 `sessionIdRef` 防止相同问题
- **涉及文件**: `client/src/pages/games/GoNoGoGame.tsx`, `SchulteGame.tsx`, `MemoryGame.tsx`, `StroopGame.tsx`

### 2. Dashboard 可视化问题
- **Y轴标签截断**: `margin={{ left: -12 }}` 导致 "3000ms" 被截断 → 改为 `left: 4` + 显式 `width={48}`
- **游戏对比图不可用**: 不同游戏RT量级差异太大，BarChart无法展示 → 替换为水平进度条
- **雷达图太小**: `outerRadius="65%"` → `outerRadius="75%"`, 高度 190→220px

### 3. MySQL boolean 问题
- `completed` 字段存储为 0/1，过滤条件更新为 `s.completed || s.score || s.accuracy`

### 4. 数据库清理
- 删除了6条 gonogo 的残损记录: `DELETE FROM training_sessions WHERE gameType='gonogo' AND completed=0 AND score IS NULL`

## 已实现的功能

### SDT 学术指标体系 (2026-03-25)

**共享工具库** `client/src/lib/sdtUtils.ts`:
- `zScore()` — 逆正态CDF近似 (从 CPTTest.tsx 提取)
- `calculateDPrime(hitRate, faRate)` — d' = z(H) - z(FA)
- `calculateBeta(hitRate, faRate)` — β = exp((z(FA)² - z(H)²) / 2)
- `calculateRTV(rts[])` — 变异系数 CV = SD/Mean
- `calculateFatigueIndex(rts[])` — mean(后半段RT) / mean(前半段RT)
- `interpretDPrime()` / `interpretBeta()` — 学术解读标签 + 颜色

**GoNoGoGame.tsx 增强**:
- finishGame 计算 d'、β、RTV、疲劳指数，存入 gameMetrics
- 结果页展示 d' 和 β 卡片（带学术解读Badge）
- 疲劳指数 > 1.1 时显示警告
- 鼓励性反馈消息（根据准确率分三档）
- 已清除所有 debug console.log

**Dashboard.tsx SDT KPI卡片**:
- 4列学术指标行: 平均RT / d'敏感度 / β反应偏向 / 疲劳指数
- 仅在有 Go/No-Go SDT数据时显示
- 已清除 debug console.log

**Analytics.tsx 增强**:
- SDT指标趋势图: d'(左Y轴) + β(右Y轴) 折线图，带 d'=2.5 和 d'=1.0 参考线
- 疲劳分析柱状图: 颜色编码 (绿/橙/红) + 1.1阈值线
- 基线对比卡片: 前3次 vs 最近3次 d' 改善百分比
- CSV/JSON 导出按钮 (复用 `lib/exportUtils.ts`)
- 修复: 表现趋势Y轴截断 (left margin -16 → 4, 添加 width={52})
- 修复: 反应时间分布替换为「各游戏反应时间」(Mean±SD 条形图 + Min/Med/Max)
- 修复: CV趋势图 left margin

**CPTTest.tsx 重构**:
- 内联 zScore 函数替换为从 `@/lib/sdtUtils` 导入

### 排除记录功能 (2026-03-25)

**Server** `server/routers.ts`:
- 新增 `training.toggleSessionStats` mutation — 切换 `includedInStats` 字段

**4个游戏结果页**:
- 添加"排除此次记录（练习/测试用）"切换按钮
- 点击后立即同步到数据库，状态显示为"此次记录已排除，不计入数据分析"
- 新游戏开始时自动重置

**数据过滤**:
- Dashboard: `completedSessions` 过滤 `includedInStats !== false`
- Analytics: `filteredSessions` 过滤 `includedInStats === false`
- History: 排除的记录仍可见但半透明 + "已排除" Badge

### UI修复 (2026-03-25)
- 左侧菜单栏头像居中: user section padding 从 `12px 8px` 改为 `12px 0`

## 数据库关键字段

**training_sessions 表**:
- `includedInStats` (boolean, default true) — 是否计入统计
- `gameMetrics` (JSON) — Go/No-Go 现在包含: dPrime, beta, fatigueIndex, hitRate, falseAlarmRate
- `rtv` (float) — Go/No-Go 现在填充此字段

**GoNoGoMetrics 接口** (`drizzle/schema.ts`):
- 已定义 dPrime 字段，现在实际填充

## 关键文件路径

| 文件 | 用途 |
|------|------|
| `client/src/lib/sdtUtils.ts` | SDT 计算工具库 |
| `client/src/lib/exportUtils.ts` | CSV/JSON 导出工具 |
| `client/src/pages/games/GoNoGoGame.tsx` | Go/No-Go 游戏 (含SDT计算) |
| `client/src/pages/games/StroopGame.tsx` | Stroop 游戏 |
| `client/src/pages/games/MemoryGame.tsx` | 记忆翻牌游戏 |
| `client/src/pages/games/SchulteGame.tsx` | 舒尔特方格游戏 |
| `client/src/pages/Dashboard.tsx` | 首页仪表盘 (含SDT KPI) |
| `client/src/pages/Analytics.tsx` | 数据分析页 (含SDT趋势/疲劳/导出) |
| `client/src/pages/History.tsx` | 训练日记 |
| `client/src/pages/assessment/CPTTest.tsx` | CPT评估测试 |
| `client/src/pages/AssessmentReport.tsx` | 评估报告 (6维度雷达图) |
| `client/src/components/DashboardLayout.tsx` | 侧边栏布局组件 |
| `server/routers.ts` | tRPC API 路由 |
| `server/db.ts` | 数据库操作函数 |
| `drizzle/schema.ts` | 数据库Schema定义 |

## 注意事项
- **stale closure 模式**: 所有游戏组件中使用 `sessionIdRef` + `finishGameRef` 避免 React hooks 闭包陷阱
- **MySQL boolean**: 始终用 `s.completed || s.score || s.accuracy` 过滤已完成会话
- **参考文件只读**: `/Users/qiqichen/Desktop/Capstone Project/` 中的文件不要修改
