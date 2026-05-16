# Architecture

本文档记录当前项目结构和边界，用于帮助 AI、协作者和另一台电脑稳定接手。它描述现状，不要求把项目改成新的架构。

## Top-Level Structure

```text
client/        前端 React/Vite 应用
server/        Express 服务、tRPC 路由、OAuth 和数据库访问
shared/        前后端共享类型和常量
drizzle/       MySQL schema、迁移 SQL 和 Drizzle 快照
docs/          长期维护文档
apple/         设计系统参考
scripts/       数据生成或维护脚本
patches/       package patch
```

## Frontend

前端入口：

- `client/src/main.tsx`
- `client/src/App.tsx`
- `client/src/index.css`

主要页面：

- `client/src/pages/Home.tsx`
- `client/src/pages/Login.tsx`
- `client/src/pages/Dashboard.tsx`
- `client/src/pages/Games.tsx`
- `client/src/pages/Analytics.tsx`
- `client/src/pages/History.tsx`
- `client/src/pages/Leaderboard.tsx`
- `client/src/pages/Profile.tsx`
- `client/src/pages/AssessmentReport.tsx`

游戏页面在 `client/src/pages/games/`，评估页面在 `client/src/pages/assessment/`。

关键共享组件：

- `client/src/components/DashboardLayout.tsx`
- `client/src/components/PageHeader.tsx`
- `client/src/components/GameContainer.tsx`
- `client/src/components/TrainingCalendar.tsx`
- `client/src/components/MetricTooltip.tsx`

UI 基础组件在 `client/src/components/ui/`。后续轻量视觉统一应优先复用这些组件，不要复制新的组件系统。

## Server

服务端入口：

- `server/_core/index.ts`

核心职责：

- 启动 Express 和 HTTP server。
- 注册 OAuth callback。
- 挂载 `/api/trpc`。
- 开发环境接入 Vite，生产环境服务静态文件。

关键文件：

- `server/routers.ts`：业务 tRPC 路由。
- `server/db.ts`：数据库访问逻辑。
- `server/storage.ts`：存储相关逻辑。
- `server/_core/trpc.ts`：tRPC procedure 定义。
- `server/_core/context.ts`：请求上下文。
- `server/_core/oauth.ts`：OAuth 路由。
- `server/_core/env.ts`：环境变量读取。

## Database

数据库结构由 Drizzle 管理：

- `drizzle/schema.ts`
- `drizzle/*.sql`
- `drizzle/meta/*.json`
- `drizzle.config.ts`

本项目使用 MySQL/TiDB 兼容连接。真实连接字符串来自 `.env`，不得写入 Git。

更多数据说明见 `docs/DATA_AND_MYSQL.md`。

## Routing Shape

`client/src/App.tsx` 使用 `wouter` 管理路由。后续不要在没有必要的情况下重写路由树。

当前应保持稳定的功能区：

- Landing / login
- Dashboard
- Games
- Baseline assessment
- Analytics and history
- Admin and user detail

## Design System

当前样式基础在：

- `client/src/index.css`
- `apple/DESIGN.md`

轻量 UI 优化应围绕 spacing、page header、卡片节奏、按钮一致性和可读性展开。不要把项目重做成个人网站风格，也不要照搬参考站的黑白极简系统。

## Future Website Embedding

`/Users/mac/Desktop/charliechanstudio.com` 是只读参考。未来如果把本项目作为个人网站的二级项目页，建议先准备内容和资产，不直接移动代码。

候选 slug：

- `cognitive-training-platform`
- `focus-training`

未来嵌入前需要准备：

- 项目简介和中英文摘要。
- 封面图和关键截图。
- Demo 路径规划。
- 数据与隐私说明。
- 构建输出和部署边界。

当前阶段本项目保持独立仓库维护。
